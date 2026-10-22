#!/bin/bash
# assemble.sh <variant-name> [outfile]
# Stitches build/head.html + versions/variants/<name>/hero.html + build/body.html
# into an index file and copies that variant's hero.css to css/hero.css.
set -eu
cd "$(dirname "$0")/.."
V="${1:-shopwindow}"
OUT="${2:-index.html}"
STAMP="$(date +%s)"
D="versions/variants/$V"
[ -f "$D/hero.html" ] || { echo "no such variant: $V"; exit 1; }
cat build/head.html "$D/hero.html" build/body.html | sed "s/__V__/$STAMP/g" > "$OUT"
cp "$D/hero.css" css/hero.css
echo "assembled $OUT from variant '$V' (v=$STAMP)"
