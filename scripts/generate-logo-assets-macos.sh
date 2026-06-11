#!/usr/bin/env bash

# Generate PNG logo sizes and web icons from a source SVG on macOS.
# Usage:
#   bash scripts/generate-logo-assets-macos.sh \
#     [source-svg] \
#     [output-root] \
#     [asset-name] \
#     [docs-public-logo-dir]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_SVG="${1:-docs/img/logo/qs-jwt-logo-square.svg}"
OUTPUT_ROOT="${2:-docs/img/logo/final}"
ASSET_NAME="${3:-$(basename "$SOURCE_SVG" .svg)}"
DOCS_PUBLIC_LOGO_DIR="${4:-}"
MASTER_SIZE=2048
PNG_SIZES=(16 32 48 64 96 128 180 192 256 384 512 1024)
SOCIAL_ASSET_NAME="qs-jwt-social-1200x630"
SOCIAL_WIDTH=1200
SOCIAL_HEIGHT=630
DEFAULT_DOCS_PUBLIC_LOGO_DIR="$REPO_ROOT/../qs-jwt-docs/docs/public/img/logo"

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
VIEW_BOX="$(grep -o 'viewBox="[^"]*"' "$SOURCE_SVG" | head -n 1 | sed 's/viewBox="//; s/"//')"

if [[ -z "$VIEW_BOX" ]]; then
    echo "Could not determine viewBox from $SOURCE_SVG" >&2
    exit 1
fi

read -r _ _ VIEW_WIDTH VIEW_HEIGHT <<<"$VIEW_BOX"

if [[ -z "${VIEW_WIDTH:-}" || -z "${VIEW_HEIGHT:-}" ]]; then
    echo "Could not parse viewBox dimensions from $SOURCE_SVG" >&2
    exit 1
fi

IS_SQUARE="$(awk -v width="$VIEW_WIDTH" -v height="$VIEW_HEIGHT" 'BEGIN { print (width == height ? 1 : 0) }')"

mkdir -p "$OUTPUT_ROOT" "$PNG_DIR" "$WEB_DIR"

echo "=== Generating logo assets ==="
echo "Source SVG : $SOURCE_SVG"
echo "Output root: $OUTPUT_ROOT"
echo "Asset name : $ASSET_NAME"

cp "$SOURCE_SVG" "$OUTPUT_ROOT/$ASSET_NAME.svg"

MASTER_PNG="$PNG_DIR/${ASSET_NAME}-${MASTER_SIZE}.png"

rsvg-convert -w "$MASTER_SIZE" "$SOURCE_SVG" > "$MASTER_PNG"

for size in "${PNG_SIZES[@]}"; do
    output_file="$PNG_DIR/${ASSET_NAME}-${size}.png"

    sips -Z "$size" "$MASTER_PNG" --out "$output_file" >/dev/null
done

generate_web_icon() {
    local source_file="$1"
    local output_file="$2"
    local canvas_size="$3"

    if [[ "$IS_SQUARE" == "1" ]]; then
        cp "$source_file" "$output_file"
        return
    fi

    magick "$source_file" -background none -gravity center -extent "${canvas_size}x${canvas_size}" "$output_file"
}

generate_web_icon "$PNG_DIR/${ASSET_NAME}-16.png" "$WEB_DIR/favicon-16x16.png" 16
generate_web_icon "$PNG_DIR/${ASSET_NAME}-32.png" "$WEB_DIR/favicon-32x32.png" 32
generate_web_icon "$PNG_DIR/${ASSET_NAME}-48.png" "$WEB_DIR/favicon-48x48.png" 48
generate_web_icon "$PNG_DIR/${ASSET_NAME}-180.png" "$WEB_DIR/apple-touch-icon.png" 180
generate_web_icon "$PNG_DIR/${ASSET_NAME}-192.png" "$WEB_DIR/android-chrome-192x192.png" 192
generate_web_icon "$PNG_DIR/${ASSET_NAME}-512.png" "$WEB_DIR/android-chrome-512x512.png" 512

sync_social_card_to_docs() {
    local target_dir="$1"

    mkdir -p "$target_dir"
    cp "$SOURCE_SVG" "$target_dir/${ASSET_NAME}.svg"
    rsvg-convert -w "$SOCIAL_WIDTH" -h "$SOCIAL_HEIGHT" "$SOURCE_SVG" > "$target_dir/${ASSET_NAME}.png"
}

if [[ "$ASSET_NAME" == "$SOCIAL_ASSET_NAME" ]]; then
    if [[ -z "$DOCS_PUBLIC_LOGO_DIR" && -d "$DEFAULT_DOCS_PUBLIC_LOGO_DIR" ]]; then
        DOCS_PUBLIC_LOGO_DIR="$DEFAULT_DOCS_PUBLIC_LOGO_DIR"
    fi

    if [[ -n "$DOCS_PUBLIC_LOGO_DIR" ]]; then
        sync_social_card_to_docs "$DOCS_PUBLIC_LOGO_DIR"
    fi
fi

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

if [[ "$ASSET_NAME" == "$SOCIAL_ASSET_NAME" && -n "$DOCS_PUBLIC_LOGO_DIR" ]]; then
    echo "- $DOCS_PUBLIC_LOGO_DIR/${ASSET_NAME}.svg"
    echo "- $DOCS_PUBLIC_LOGO_DIR/${ASSET_NAME}.png"
fi