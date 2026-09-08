#!/bin/bash
# Integration tests for the four Edge Functions and the RLS rules, run against
# the local Supabase stack with the mock Razorpay server (tests/mock-razorpay.mjs).
# Each case prints PASS or FAIL; the script exits non-zero if anything failed.
set -uo pipefail
cd "$(dirname "$0")/.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|PUBLISHABLE_KEY)=')"
API=$API_URL; PK=$PUBLISHABLE_KEY
WEBHOOK_SECRET=$(grep '^RAZORPAY_WEBHOOK_SECRET=' tests/functions.env | cut -d= -f2)
KEY_SECRET=$(grep '^RAZORPAY_KEY_SECRET=' tests/functions.env | cut -d= -f2)

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL  $1"; echo "      got: $2"; }
# expect <name> <needle> <haystack>: pass when needle is found
expect() { case "$3" in *"$2"*) ok "$1";; *) bad "$1 (wanted '$2')" "$3";; esac; }
# expect_eq <name> <wanted> <got>
expect_eq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (wanted '$2')" "$3"; fi; }

tok() { curl -s -X POST "$API/auth/v1/token?grant_type=password" -H "apikey: $PK" -H "content-type: application/json" \
  --data "{\"email\":\"$1\",\"password\":\"Passw0rd!x\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))"; }
A=$(tok asha@example.com); B=$(tok bala@example.com); C=$(tok chitra@example.com); D=$(tok dev@example.com); E=$(tok eve@example.com); O=$(tok owner@test.local)

# fn <function> <token or ""> <json body> [extra curl args...]  -> body + " [status]"
fn() { local name=$1 token=$2 body=$3; shift 3
  if [ -n "$token" ]; then
    curl -s -w ' [%{http_code}]' -X POST "$API/functions/v1/$name" -H "apikey: $PK" -H "Authorization: Bearer $token" -H "content-type: application/json" "$@" --data "$body"
  else
    curl -s -w ' [%{http_code}]' -X POST "$API/functions/v1/$name" -H "apikey: $PK" -H "content-type: application/json" "$@" --data "$body"
  fi; }
q() { curl -s "$API/rest/v1/$2" -H "apikey: $PK" -H "Authorization: Bearer $1"; }
sig() { printf '%s|%s' "$1" "$2" | openssl dgst -sha256 -hmac "$KEY_SECRET" | sed 's/^.* //'; }
mockpay() { curl -s -u a:b -X POST http://127.0.0.1:4599/mock/pay -d "$1"; }
jget() { python3 -c "import sys,json; s=sys.stdin.read(); s=s.rsplit(' [',1)[0] if ' [' in s else s; print(json.loads(s).get('$1',''))"; }
webhook() { # webhook <event id> <payment entity json> [event name]
  local body; body=$(printf '{"event":"%s","payload":{"payment":{"entity":%s}}}' "${3:-payment.captured}" "$2")
  local ws; ws=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
  curl -s -w ' [%{http_code}]' -X POST "$API/functions/v1/razorpay-webhook" -H "x-razorpay-signature: $ws" -H "x-razorpay-event-id: $1" --data "$body"; }
sql() { bash tests/sql.sh "$1"; }
verify() { fn verify-payment "$1" "$(printf '{"razorpay_order_id":"%s","razorpay_payment_id":"%s","razorpay_signature":"%s"}' "$2" "$3" "$(sig "$2" "$3")")"; }

echo "== create-order"
expect "no token is refused"         "[401]" "$(fn create-order "" '{"plan":"3 months","name":"Asha","phone":"9876500001"}')"
R=$(fn create-order "$A" '{"plan":"3 months","name":"Asha Rao","phone":"98765 00001","amount":1}')
expect "asha creates an order"       "[200]" "$R"
ORD=$(echo "$R" | jget order_id)
expect_eq "server decides the amount" "500000" "$(echo "$R" | jget amount)"
R2=$(fn create-order "$A" '{"plan":"3 months","name":"Asha Rao","phone":"9876500001"}')
expect_eq "same plan again reuses the open order" "$ORD" "$(echo "$R2" | jget order_id)"
expect "unknown plan"                "[400]" "$(fn create-order "$A" '{"plan":"free","name":"Asha","phone":"9876500001"}')"
expect "bad phone"                   "[400]" "$(fn create-order "$A" '{"plan":"1 month","name":"Asha","phone":"123"}')"

echo "== verify-payment"
P=$(mockpay "{\"order_id\":\"$ORD\",\"contact\":\"+919876500001\",\"email\":\"asha@example.com\"}"); PID=$(echo "$P" | jget id)
expect "captured payment is recorded" '"ok":true' "$(verify "$A" "$ORD" "$PID")"
expect "verifying twice is a no-op"   '"duplicate":true' "$(verify "$A" "$ORD" "$PID")"
expect "webhook for the same payment is a no-op" '"duplicate":true' "$(webhook evt_1 "$P")"
expect "webhook redelivered after success" '"duplicate":true' "$(webhook evt_1 "$P")"
P2=$(mockpay "{\"order_id\":\"$ORD\"}"); PID2=$(echo "$P2" | jget id)
expect "bala cannot confirm asha's order" "[403]" "$(verify "$B" "$ORD" "$PID2")"
expect "wrong signature"             "[401]" "$(fn verify-payment "$A" "$(printf '{"razorpay_order_id":"%s","razorpay_payment_id":"%s","razorpay_signature":"abc"}' "$ORD" "$PID2")")"
R3=$(fn create-order "$B" '{"plan":"1 month","name":"Bala","phone":"9876500002"}'); ORD2=$(echo "$R3" | jget order_id)
P3=$(mockpay "{\"order_id\":\"$ORD2\",\"status\":\"authorized\"}"); PID3=$(echo "$P3" | jget id)
expect "authorised but not captured stays pending" '"pending":true' "$(verify "$B" "$ORD2" "$PID3")"
P4=$(mockpay "{\"order_id\":\"$ORD2\",\"amount\":100}"); PID4=$(echo "$P4" | jget id)
expect "wrong amount is rejected, not retried" "[422]" "$(verify "$B" "$ORD2" "$PID4")"

echo "== webhook: payments without a local order (F04)"
P5='{"id":"pay_NOORDER","amount":900000,"contact":"9876500001","email":"asha@example.com","notes":{"name":"Someone"},"created_at":1757100000}'
expect "no order: acknowledged so Razorpay stops retrying" "[200]" "$(webhook evt_2 "$P5")"
expect_eq "no order: kept unprocessed for the attention list" "f" "$(sql "select processed from public.webhook_events where event_id='evt_2'")"
expect_eq "no order: asha's phone did NOT get a membership" "1" "$(sql "select count(*) from public.memberships m join public.members x on x.id=m.member_id where x.phone='919876500001'")"
P6='{"id":"pay_FAKEORDER","amount":500000,"order_id":"order_NOTOURS","contact":"9876500001","created_at":1757100000}'
expect "unknown order id: acknowledged" '"ok":false' "$(webhook evt_3 "$P6")"
expect_eq "unknown order id: no membership created" "0" "$(sql "select count(*) from public.memberships where razorpay_payment_id='pay_FAKEORDER'")"

echo "== webhook: transient failure is retried (F02)"
R4=$(fn create-order "$B" '{"plan":"6 months","name":"Bala","phone":"9876500002"}'); ORD3=$(echo "$R4" | jget order_id)
P7=$(mockpay "{\"order_id\":\"$ORD3\"}"); PID7=$(echo "$P7" | jget id)
sql "revoke insert on public.memberships from service_role" >/dev/null
expect "database write fails: webhook answers 500" "[500]" "$(webhook evt_4 "$P7")"
expect_eq "attempt 1 logged, unprocessed" "false|1" "$(sql "select processed||'|'||attempts from public.webhook_events where event_id='evt_4'")"
sql "grant insert on public.memberships to service_role" >/dev/null
expect "same event redelivered: recorded" '"ok":true' "$(webhook evt_4 "$P7")"
expect_eq "attempt 2 logged, processed" "true|2" "$(sql "select processed||'|'||attempts from public.webhook_events where event_id='evt_4'")"
expect_eq "exactly one membership for that payment" "1" "$(sql "select count(*) from public.memberships where razorpay_payment_id='$PID7'")"
expect_eq "order marked paid" "paid" "$(sql "select status from public.payment_orders where razorpay_order_id='$ORD3'")"
expect "other events are ignored" '"ignored":"payment.failed"' "$(webhook evt_5 "$P7" payment.failed)"
expect "bad webhook signature" "[401]" "$(curl -s -w ' [%{http_code}]' -X POST "$API/functions/v1/razorpay-webhook" -H "x-razorpay-signature: nope" --data '{"event":"payment.captured"}')"

echo "== member linking (F01)"
R5=$(fn create-order "$C" '{"plan":"6 months","name":"Chitra M","phone":"9000011111"}')
expect "walk-in with matching email links to her own row" "[200]" "$R5"
expect_eq "chitra's row now carries her user id" "1" "$(sql "select count(*) from public.members where phone='919000011111' and email='chitra@example.com' and user_id is not null")"
expect "another account cannot claim a walk-in's phone" "[409]" "$(fn create-order "$D" '{"plan":"1 month","name":"Dev","phone":"9000022222"}')"
expect_eq "phone-only walk-in stays unlinked" "1" "$(sql "select count(*) from public.members where phone='919000022222' and user_id is null")"
expect "dev cannot use asha's phone" "[409]" "$(fn create-order "$D" '{"plan":"1 month","name":"Dev","phone":"9876500001"}')"
expect_eq "dev got no member row" "0" "$(sql "select count(*) from public.members where email='dev@example.com'")"
R6=$(fn create-order "$D" '{"plan":"1 month","name":"Dev","phone":"9876500004"}')
expect "dev with his own phone is fine" "[200]" "$R6"
expect "asha changing to dev's phone is refused" "[409]" "$(fn create-order "$A" '{"plan":"1 month","name":"Asha","phone":"9876500004"}')"

echo "== order limit (F05)"
EVEID=$(sql "select id from auth.users where email='eve@example.com'")
sql "insert into public.members (name, phone, email, user_id) values ('Eve','9876500005','eve@example.com','$EVEID')" >/dev/null
sql "insert into public.payment_orders (razorpay_order_id, member_id, plan, amount_paise) select 'order_old'||g, id, '1 month', 200000 from public.members, generate_series(1,5) g where email='eve@example.com'" >/dev/null
sql "update public.payment_orders set created_at = now() - interval '40 minutes' where razorpay_order_id like 'order_old%'" >/dev/null
expect "sixth order in an hour is refused" "[429]" "$(fn create-order "$E" '{"plan":"1 year","name":"Eve","phone":"9876500005"}')"

echo "== enquiries (F03)"
enq() { fn submit-enquiry "" "$(printf '{"name":"Test","phone":"%s","message":"hi"}' "$1")" -H "x-forwarded-for: ${2:-10.0.0.1}"; }
expect "honeypot silently accepted" '"ok":true' "$(fn submit-enquiry "" '{"name":"Bot","phone":"9111100000","message":"x","bot-field":"y"}')"
expect_eq "honeypot stored nothing" "0" "$(sql "select count(*) from public.enquiries where phone='919111100000'")"
for i in 1 2 3; do enq 9111100001 >/dev/null; done
expect "fourth from one phone refused" "[429]" "$(enq 9111100001)"
for i in 2 3 4 5 6; do enq 911110000$i 10.0.0.9 >/dev/null; done
expect "sixth from one address refused" "[429]" "$(enq 9111100010 10.0.0.9)"
# Six at once from a new phone: the lock must let exactly three through.
for i in 1 2 3 4 5 6; do enq 9111100007 10.0.0.$i >/dev/null & done; wait
expect_eq "parallel burst: exactly three stored" "3" "$(sql "select count(*) from public.enquiries where phone='919111100007'")"
expect "bad email rejected" "[400]" "$(fn submit-enquiry "" '{"name":"T","phone":"9111100008","email":"nope"}')"
expect "student cannot call submit_enquiry directly" "42501" "$(curl -s -X POST "$API/rest/v1/rpc/submit_enquiry" -H "apikey: $PK" -H "Authorization: Bearer $A" -H "content-type: application/json" --data '{"p_name":"x","p_phone":"919111100009","p_email":null,"p_studio":"","p_interest":"","p_message":"","p_ip":null}')"

echo "== row level security"
expect_eq "asha sees only her memberships" "1" "$(q "$A" "memberships?select=plan" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))')"
expect_eq "asha sees only her member row" "1" "$(q "$A" "members?select=id" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))')"
expect_eq "eve (never bought) sees no memberships" "0" "$(q "$E" "memberships?select=plan" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))')"
ANON=$(curl -s "$API/rest/v1/members?select=id" -H "apikey: $PK")
case "$ANON" in "[]"|*"permission denied"*) ok "anon sees nothing";; *) bad "anon sees nothing" "$ANON";; esac
expect "students cannot read enquiries" "[]" "$(q "$A" "enquiries?select=id")"
expect "owner reads enquiries" '"id"' "$(q "$O" "enquiries?select=id&limit=1")"
expect "owner sees the attention list" 'pay_NOORDER' "$(q "$O" "webhook_events?select=payload&processed=eq.false&event_id=eq.evt_2")"
expect "student cannot insert a membership" "row-level security" "$(curl -s -X POST "$API/rest/v1/memberships" -H "apikey: $PK" -H "Authorization: Bearer $A" -H "content-type: application/json" --data '{"member_id":1,"plan":"1 year","amount_paise":0,"source":"cash"}')"

echo
echo "passed $PASS, failed $FAIL"
[ "$FAIL" = 0 ]
