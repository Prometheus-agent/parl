#!/bin/bash
# post-build script — copies static + public into standalone output
set -e

WEB_DIR="/root/.openclaw/workspace/parl/web"
STANDALONE="$WEB_DIR/.next/standalone"

# Static files (JS, CSS chunks, fonts)
rm -rf "$STANDALONE/.next/static" 2>/dev/null || true
cp -r "$WEB_DIR/.next/static" "$STANDALONE/.next/static" 2>/dev/null || echo "no static dir"

# Public assets (images, SVG, icons)
mkdir -p "$STANDALONE/public"
for f in "$WEB_DIR/public"/*; do
  [ -f "$f" ] && cp "$f" "$STANDALONE/public/" || true
done

echo "✅ Static + public synced to standalone"
