#!/bin/bash
# Checks on the built output that a type-check cannot catch, run the way a host
# builds the site: with no environment variables at all.
#
#   bash tests/build-checks.sh
#
# The header greeting reads the session straight out of browser storage, under a
# key derived from the Supabase project name. That name is baked in at build
# time. When it came out empty the header could never find a signed-in member,
# and nothing failed: no error, no warning, just a permanent "Sign in" button.
set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "PASS  $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL  $1"; echo "      got: $2"; }
expect_match() { if grep -q "$2" "$3" 2>/dev/null; then ok "$1"; else bad "$1" "no '$2' in $3"; fi; }

env -u PUBLIC_SUPABASE_URL -u PUBLIC_SUPABASE_PUBLISHABLE_KEY npm run build >/dev/null 2>&1 \
  || { echo "FAIL  the site does not build without environment variables"; exit 1; }
ok "builds with no environment variables"

# The bug: an empty project name silently disables the header greeting.
REF=$(grep -o 'const projectRef = "[^"]*"' dist/index.html | head -1 | sed 's/.*= "//;s/"//')
if [ -n "$REF" ]; then ok "header knows the project name ($REF)"; else bad "header knows the project name" "empty"; fi

# It has to be the same project the rest of the site talks to.
if grep -rq "$REF" dist/_astro/*.js 2>/dev/null; then
  ok "header and page agree on the project"
else
  bad "header and page agree on the project" "$REF is not in the shipped JavaScript"
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
