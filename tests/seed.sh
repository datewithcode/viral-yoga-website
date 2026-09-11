#!/bin/bash
# Creates the two accounts used by tests/functions.sh: the studio owner (staff)
# and one ordinary signed-in user. Runs against the local stack only (keys from
# `supabase status`).
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"

mk() {
  curl -s -X POST "$API_URL/auth/v1/admin/users" -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "content-type: application/json" --data "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d)"
}
echo "user: $(mk '{"email":"user@example.com","password":"Passw0rd!x","email_confirm":true}')"
echo "owner: $(mk '{"email":"owner@test.local","password":"Passw0rd!x","email_confirm":true,"app_metadata":{"role":"staff"}}')"
echo "seeded"
