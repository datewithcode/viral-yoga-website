#!/bin/bash
# Checks on the built output that a type-check cannot catch, run the way a host
# builds the site: with no environment variables at all.
#
#   bash tests/build-checks.sh
set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "PASS  $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL  $1"; echo "      got: $2"; }
expect_match() { if grep -q "$2" "$3" 2>/dev/null; then ok "$1"; else bad "$1" "no '$2' in $3"; fi; }

env -u PUBLIC_SUPABASE_URL -u PUBLIC_SUPABASE_PUBLISHABLE_KEY npm run build >/dev/null 2>&1 \
  || { echo "FAIL  the site does not build without environment variables"; exit 1; }
ok "builds with no environment variables"

# The contact form sends each enquiry to Supabase from the browser, so the
# project address must be baked into the shipped JavaScript. It comes from
# site.ts, which is what lets the site build with nothing configured.
SUPA=$(grep -o "supabaseUrl: '[^']*'" src/data/site.ts | sed "s/^supabaseUrl: '//;s/'$//")
if [ -n "$SUPA" ] && grep -rqF "$SUPA" dist/_astro/*.js 2>/dev/null; then
  ok "the contact form knows where to send enquiries ($SUPA)"
else
  bad "the contact form knows where to send enquiries" "'${SUPA:-no supabaseUrl in site.ts}' is not in the shipped JavaScript"
fi

# The phone menu must sit OUTSIDE <header>. The header carries a blur, and a blur
# makes an element the anchor for anything positioned inside it, so a menu left in
# there sizes itself against the 64px header rather than the screen and collapses
# to nothing. The markup looked fine; it only broke on a phone.
HEAD_AT=$(grep -bo "</header>" dist/index.html | head -1 | cut -d: -f1)
MENU_AT=$(grep -bo 'id="nav-mobile"' dist/index.html | head -1 | cut -d: -f1)
if [ -n "$HEAD_AT" ] && [ -n "$MENU_AT" ] && [ "$MENU_AT" -gt "$HEAD_AT" ]; then
  ok "phone menu sits outside the blurred header"
else
  bad "phone menu sits outside the blurred header" "it is inside <header>, so it collapses on a phone"
fi

expect_match "security headers ship with the site" "X-Frame-Options" dist/_headers
expect_match "a real 404 page is built" "Page not found" dist/404.html
expect_match "the address is not the retired host" "workers.dev" dist/index.html
if grep -q "startling-beignet" dist/index.html; then bad "no links to the retired host" "found netlify address"; else ok "no links to the retired host"; fi

echo
echo "passed $PASS, failed $FAIL"
[ "$FAIL" = 0 ]
