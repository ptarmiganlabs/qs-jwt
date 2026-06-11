#!/usr/bin/env bash

# Generate PNG logo sizes and web icons from a source SVG on macOS.
# Usage:
#   bash scripts/generate-logo-assets-macos.sh \
#     [source-svg] \
#     [output-root] \
#     [asset-name]

set -euo pipefail

SOURCE_SVG="${1:-docs/img/logo/qs-jwt-logo-square.svg}"
OUTPUT_ROOT="${2:-docs/img/logo/final}"
ASSET_NAME="${3:-$(basename "$SOURCE_SVG" .svg)}"
MASTER_SIZE=2048
PNG_SIZES=(16 32 48 64 96 128 180 192 256 384 512 1024)

require_tool() {
    local tool_name="$1"

    if ! command -v "$tool_name" >/dev/null 2>&1; then
        echo "Missing required tool: $tool_name" >&2
        echo "Install it and run the script again." >&2
        if [[ "$tool_name" == "rsvg-convert" ]]; then
            echo "On macOS with Homebrew: brew install librsvg" >&2
        fi
        if [[ "$tool_name" == "magick" ]]; then
            echo "On macOS with Homebrew: brew install imagemagick" >&2
        fi
        exit 1
    fi
}

require_tool rsvg-convert
require_tool sips
require_tool magick

if [[ ! -f "$SOURCE_SVG" ]]; then
    echo "Source SVG not found: $SOURCE_SVG" >&2
    exit 1
fi

OUTPUT_ROOT="${OUTPUT_ROOT%/}"
PNG_DIR="$OUTPUT_ROOT/png"
WEB_DIR="$OUTPUT_ROOT/web/$ASSET_NAME"

mkdir -p "$OUTPUT_ROOT" "$PNG_DIR" "$WEB_DIR"

echo "=== Generating logo assets ==="
echo "Source SVG : $SOURCE_SVG"
echo "Output root: $OUTPUT_ROOT"
echo "Asset name : $ASSET_NAME"

cp "$SOURCE_SVG" "$OUTPUT_ROOT/$ASSET_NAME.svg"

MASTER_PNG="$PNG_DIR/${ASSET_NAME}-${MASTER_SIZE}.png"

rsvg-convert -w "$MASTER_SIZE" -h "$MASTER_SIZE" "$SOURCE_SVG" > "$MASTER_PNG"

for size in "${PNG_SIZES[@]}"; do
    output_file="$PNG_DIR/${ASSET_NAME}-${size}.png"

    if [[ "$size" -eq "$MASTER_SIZE" ]]; then
        continue
    fi

    sips -z "$size" "$size" "$MASTER_PNG" --out "$output_file" >/dev/null
done

cp "$PNG_DIR/${ASSET_NAME}-16.png" "$WEB_DIR/favicon-16x16.png"
cp "$PNG_DIR/${ASSET_NAME}-32.png" "$WEB_DIR/favicon-32x32.png"
cp "$PNG_DIR/${ASSET_NAME}-48.png" "$WEB_DIR/favicon-48x48.png"
cp "$PNG_DIR/${ASSET_NAME}-180.png" "$WEB_DIR/apple-touch-icon.png"
cp "$PNG_DIR/${ASSET_NAME}-192.png" "$WEB_DIR/android-chrome-192x192.png"
cp "$PNG_DIR/${ASSET_NAME}-512.png" "$WEB_DIR/android-chrome-512x512.png"

magick \
    "$WEB_DIR/favicon-16x16.png" \
    "$WEB_DIR/favicon-32x32.png" \
    "$WEB_DIR/favicon-48x48.png" \
    "$WEB_DIR/favicon.ico"

echo "Generated:"
echo "- $OUTPUT_ROOT/$ASSET_NAME.svg"
for size in "${PNG_SIZES[@]}"; do
    echo "- $PNG_DIR/${ASSET_NAME}-${size}.png"
done
echo "- $WEB_DIR/favicon.ico"
echo "- $WEB_DIR/favicon-16x16.png"
echo "- $WEB_DIR/favicon-32x32.png"
echo "- $WEB_DIR/favicon-48x48.png"
echo "- $WEB_DIR/apple-touch-icon.png"
echo "- $WEB_DIR/android-chrome-192x192.png"
echo "- $WEB_DIR/android-chrome-512x512.png"