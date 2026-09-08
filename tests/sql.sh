#!/bin/bash
# Run one SQL statement against the local database. Usage: bash tests/sql.sh "select 1"
# Prints unaligned, tuples-only output.
set -euo pipefail
DB=$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1)
docker exec -i "$DB" psql -U postgres -d postgres -X -q -A -t -v ON_ERROR_STOP=1 -c "$1"
