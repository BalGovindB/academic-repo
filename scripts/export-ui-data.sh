#!/bin/sh
# Regenerates src/data/repository.json from the PostgreSQL database.
# Usage:  PGDATABASE=arm sh scripts/export-ui-data.sh
# (set PGHOST / PGUSER / PGPASSWORD as usual for psql if needed)
set -e
cd "$(dirname "$0")/.."
psql -X -At -v ON_ERROR_STOP=1 -f db/06_export_ui_data.sql | node scripts/format-json.mjs > src/data/repository.json
echo "Wrote src/data/repository.json"
