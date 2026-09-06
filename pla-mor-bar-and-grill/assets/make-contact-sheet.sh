#!/bin/sh
# Rebuilds assets/contact-sheet.html: a numbered grid of every image in images/.
# Hayden picks hero / about / gallery by number from this sheet.
# Run from the site folder:  sh assets/make-contact-sheet.sh
set -e
cd "$(dirname "$0")/.."
OUT="assets/contact-sheet.html"
{
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Contact sheet</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:24px;background:#EFE7D8;color:#18211C;font:15px/1.4 -apple-system,Helvetica,Arial,sans-serif}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 20px;color:#66635A}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
figure{margin:0;background:#F6EFE2;border:1px solid #DCD2BF;padding:10px;border-radius:10px}
figure img{width:100%;aspect-ratio:4/3;object-fit:contain;display:block;border-radius:6px;background:#E5DBC7}
figcaption{margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:12px;word-break:break-all}
figcaption b{display:inline-block;min-width:28px;color:#B8241F;font-size:15px}
.dim{color:#66635A;font-size:11px}
</style></head><body>
<p>PROVISIONAL BATCH PICKS — photo permission and Hayden’s final selections pending.</p><h1>Contact sheet</h1>
HEAD
n=0
for f in images/*.jpg images/*.jpeg images/*.png images/*.webp images/*.gif images/*.JPG images/*.JPEG images/*.PNG; do
  [ -f "$f" ] || continue
  n=$((n+1))
done
echo "<p>$n images in images/ — say the number + the slot (“7 for hero, 3 and 12 for gallery”).</p><div class=\"grid\">"
i=0
for f in images/*.jpg images/*.jpeg images/*.png images/*.webp images/*.gif images/*.JPG images/*.JPEG images/*.PNG; do
  [ -f "$f" ] || continue
  i=$((i+1))
  name=$(basename "$f")
  dims=""
  if command -v sips >/dev/null 2>&1; then
    w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
    h=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
    [ -n "$w" ] && dims=" <span class=\"dim\">${w}×${h}</span>"
  fi
  echo "<figure><img src=\"../$f\" alt=\"$name\" loading=\"lazy\"><figcaption><b>$i</b> $name$dims</figcaption></figure>"
done
echo "</div></body></html>"
} > "$OUT"
echo "wrote $OUT ($i images)"
