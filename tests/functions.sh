#!/bin/bash
# Integration tests for the submit-enquiry function and the enquiries table,
# run against the local Supabase stack with the mock Resend server
# (tests/mock-resend.mjs). Each case prints PASS or FAIL; the script exits
# non-zero if anything failed.
set -uo pipefail
cd "$(dirname "$0")/.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|PUBLISHABLE_KEY)=')"
API=$API_URL; PK=$PUBLISHABLE_KEY

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL  $1"; echo "      got: $2"; }
# expect <name> <needle> <haystack>: pass when needle is found
expect() { case "$3" in *"$2"*) ok "$1";; *) bad "$1 (wanted '$2')" "$3";; esac; }
# expect_eq <name> <wanted> <got>
expect_eq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (wanted '$2')" "$3"; fi; }

tok() { curl -s -X POST "$API/auth/v1/token?grant_type=password" -H "apikey: $PK" -H "content-type: application/json" \
  --data "{\"email\":\"$1\",\"password\":\"Passw0rd!x\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))"; }
U=$(tok user@example.com); O=$(tok owner@test.local)

# fn <function> <token or ""> <json body> [extra curl args...]  -> body + " [status]"
fn() { local name=$1 token=$2 body=$3; shift 3
  if [ -n "$token" ]; then
    curl -s -w ' [%{http_code}]' -X POST "$API/functions/v1/$name" -H "apikey: $PK" -H "Authorization: Bearer $token" -H "content-type: application/json" "$@" --data "$body"
  else
    curl -s -w ' [%{http_code}]' -X POST "$API/functions/v1/$name" -H "apikey: $PK" -H "content-type: application/json" "$@" --data "$body"
  fi; }
q() { curl -s "$API/rest/v1/$2" -H "apikey: $PK" -H "Authorization: Bearer $1"; }
patch() { curl -s -X PATCH "$API/rest/v1/$2" -H "apikey: $PK" -H "Authorization: Bearer $1" -H "content-type: application/json" --data "$3" >/dev/null; }
sql() { bash tests/sql.sh "$1"; }
# enq <phone> [address] [name]: one contact-form message. The body is built with
# printf: inline JSON with \" escapes reaches the API mangled under macOS's bash 3.2.
enq() { fn submit-enquiry "" "$(printf '{"name":"%s","phone":"%s","message":"hi"}' "${3:-Test}" "$1")" -H "x-forwarded-for: ${2:-10.0.0.1}"; }
fn_exists() { sql "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = '$1'"; }

echo "== only enquiries are left"
expect_eq "the only table left is enquiries" "enquiries" "$(sql "select string_agg(table_name, ',' order by table_name) from information_schema.tables where table_schema = 'public'")"
for f in plan_end_date members_normalise memberships_fill_end_date; do
  expect_eq "the database function $f is gone" "0" "$(fn_exists "$f")"
done
expect_eq "submit_enquiry is still there" "1" "$(fn_exists submit_enquiry)"
for f in create-order verify-payment razorpay-webhook; do
  expect "the $f function is gone" "[404]" "$(fn "$f" "$U" '{}')"
done

echo "== the contact form"
expect "a valid enquiry is saved and emailed" '"email":"sent"' "$(enq 9111100020 10.0.0.50 'Test Person')"
expect_eq "it is stored once, with the phone in its stored form" "1" "$(sql "select count(*) from public.enquiries where phone = '919111100020' and name = 'Test Person'")"
expect "a missing name is refused" "[400]" "$(fn submit-enquiry "" '{"name":"","phone":"9111100021"}')"
expect "a bad phone number is refused" "[400]" "$(fn submit-enquiry "" '{"name":"Test","phone":"123"}')"
expect "a bad email is refused" "[400]" "$(fn submit-enquiry "" '{"name":"Test","phone":"9111100008","email":"nope"}')"
expect "honeypot silently accepted" '"ok":true' "$(fn submit-enquiry "" '{"name":"Bot","phone":"9111100000","message":"x","bot-field":"y"}')"
expect_eq "honeypot stored nothing" "0" "$(sql "select count(*) from public.enquiries where phone = '919111100000'")"
for i in 1 2 3; do enq 9111100001 >/dev/null; done
expect "fourth from one phone refused" "[429]" "$(enq 9111100001)"
for i in 2 3 4 5 6; do enq 911110000$i 10.0.0.9 >/dev/null; done
expect "sixth from one address refused" "[429]" "$(enq 9111100010 10.0.0.9)"
# Six at once from a new phone: the lock must let exactly three through.
for i in 1 2 3 4 5 6; do enq 9111100007 10.0.0.$i >/dev/null & done; wait
expect_eq "parallel burst: exactly three stored" "3" "$(sql "select count(*) from public.enquiries where phone = '919111100007'")"

echo "== who can read and change enquiries"
ANON=$(curl -s "$API/rest/v1/enquiries?select=id" -H "apikey: $PK")
case "$ANON" in "[]"|*"permission denied"*) ok "anon sees no enquiries";; *) bad "anon sees no enquiries" "$ANON";; esac
expect_eq "a signed-in visitor sees no enquiries" "[]" "$(q "$U" "enquiries?select=id")"
expect "the owner reads enquiries" '"id"' "$(q "$O" "enquiries?select=id&limit=1")"
EID=$(sql "select id from public.enquiries where phone = '919111100020'")
patch "$U" "enquiries?id=eq.$EID" '{"status":"done"}'
expect_eq "a signed-in visitor cannot mark one done" "new" "$(sql "select status from public.enquiries where id = $EID")"
patch "$O" "enquiries?id=eq.$EID" '{"status":"done"}'
expect_eq "the owner marks it done" "done" "$(sql "select status from public.enquiries where id = $EID")"
# Refused by the table grants on the live project and by row-level security on
# the local stack, which grants table access by default. Either way, refused.
DIRECT=$(curl -s -X POST "$API/rest/v1/enquiries" -H "apikey: $PK" -H "Authorization: Bearer $U" -H "content-type: application/json" --data '{"name":"x","phone":"919111100030"}')
case "$DIRECT" in *"row-level security"*|*"permission denied"*) ok "a signed-in visitor cannot add one except through the form";; *) bad "a signed-in visitor cannot add one except through the form" "$DIRECT";; esac

echo "== submit_enquiry can only be called by the function"
RPC='{"p_name":"x","p_phone":"919111100009","p_email":null,"p_studio":"","p_interest":"","p_message":"","p_ip":null}'
expect "anon cannot call it directly" "42501" "$(curl -s -X POST "$API/rest/v1/rpc/submit_enquiry" -H "apikey: $PK" -H "content-type: application/json" --data "$RPC")"
expect "a signed-in visitor cannot call it directly" "42501" "$(curl -s -X POST "$API/rest/v1/rpc/submit_enquiry" -H "apikey: $PK" -H "Authorization: Bearer $U" -H "content-type: application/json" --data "$RPC")"
expect_eq "and nothing was stored" "0" "$(sql "select count(*) from public.enquiries where phone = '919111100009'")"

echo
echo "passed $PASS, failed $FAIL"
[ "$FAIL" = 0 ]
