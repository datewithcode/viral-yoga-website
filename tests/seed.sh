#!/bin/bash
# Creates the test accounts and walk-in members used by tests/functions.sh.
# Runs against the local stack only (keys from `supabase status`).
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"

mk() {
  curl -s -X POST "$API_URL/auth/v1/admin/users" -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "content-type: application/json" --data "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d)"
}
for u in asha bala chitra dev eve; do
  body=$(printf '{"email":"%s@example.com","password":"Passw0rd!x","email_confirm":true}' "$u")
  echo "$u: $(mk "$body")"
done
echo "owner: $(mk '{"email":"owner@test.local","password":"Passw0rd!x","email_confirm":true,"app_metadata":{"role":"staff"}}')"

# Walk-in members added by the studio: one with an email, one without.
bash tests/sql.sh "insert into public.members (name, phone, email) values ('Chitra Walk-in', '9000011111', 'chitra@example.com'), ('Phone Only', '9000022222', null);" >/dev/null
echo "seeded"
