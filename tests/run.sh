#!/bin/bash
# Full local integration run: resets the local Supabase database, seeds test
# users, starts the mock Resend server and the functions, then runs
# tests/functions.sh. Needs Docker and the Supabase CLI; `supabase start` must
# already be running (CI starts it).
#
#   bash tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."

supabase db reset --local >/dev/null

node tests/mock-resend.mjs >/tmp/vy-mock.log 2>&1 &
MOCK=$!
supabase functions serve --env-file tests/functions.env >/tmp/vy-serve.log 2>&1 &
SERVE=$!
trap 'kill $MOCK $SERVE 2>/dev/null; true' EXIT

# Wait for the functions runtime.
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS http://127.0.0.1:54321/functions/v1/submit-enquiry || true)
  [ "$code" = "204" ] && break
  sleep 1
done
[ "$code" = "204" ] || { echo "functions did not start"; tail -50 /tmp/vy-serve.log; exit 1; }

bash tests/seed.sh
bash tests/functions.sh
