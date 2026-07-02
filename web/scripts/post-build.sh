#!/bin/bash
# post-build script — copies static + public into standalone output
set -e

WEB_DIR="/root/.openclaw/workspace/parl/web"
STANDALONE="$WEB_DIR/.next/standalone/parl/web"

# Static files (JS, CSS chunks, fonts)
rm -rf "$STANDALONE/.next/static"
cp -r "$WEB_DIR/.next/static" "$STANDALONE/.next/static"

# Public assets (images, SVG, icons)
mkdir -p "$STANDALONE/public"
for f in "$WEB_DIR/public"/*; do
  cp "$f" "$STANDALONE/public/"
done

echo "✅ Static + public synced to standalone"
