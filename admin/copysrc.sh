#!/bin/bash
set -e

SRC_BASE="/mnt/c/Users/ericl/Downloads/fff"
TARGET_DIR="$(pwd)"

for src in "$SRC_BASE"/*; do
  [ -d "$src" ] || continue

  echo "Processing: $src"

  # backend
  if [ -d "$src/backend" ]; then
    mkdir -p "$TARGET_DIR/backend"
    cp -r "$src/backend/"* "$TARGET_DIR/backend/"
  fi

  # frontend
  if [ -d "$src/frontend" ]; then
    mkdir -p "$TARGET_DIR/frontend"
    cp -r "$src/frontend/"* "$TARGET_DIR/frontend/"
  fi
done

echo "✅ Copy completed."

