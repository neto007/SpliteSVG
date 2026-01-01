#!/usr/bin/env bash
set -euo pipefail

INPUT="$1"

if [[ -z "${INPUT:-}" ]]; then
  echo "Uso: ./recreateSvg.sh logo.png"
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Arquivo não encontrado: $INPUT"
  exit 1
fi

# Detect Magick
if command -v magick >/dev/null 2>&1; then
  IM="magick"
elif command -v convert >/dev/null 2>&1; then
  IM="convert"
else
  echo "❌ ImageMagick não encontrado (magick/convert)"
  exit 1
fi

NAME=$(basename "$INPUT" .png)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="${SCRIPT_DIR}/work_${NAME}"
PROCESSED_PNG="${WORKDIR}/${NAME}_no_bg.png"

# Setup
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"

echo "[1/3] Removendo fundo com IA (BiRefNet)..."
# Use rembg with BiRefNet model (state-of-the-art quality)
./venv/bin/python -c "
from rembg import remove, new_session
from PIL import Image

input_path = '$INPUT'
output_path = '$PROCESSED_PNG'

# Use BiRefNet model for best quality
session = new_session('birefnet-general')

with open(input_path, 'rb') as f:
    input_data = f.read()

output_data = remove(input_data, session=session)

with open(output_path, 'wb') as f:
    f.write(output_data)

print('  -> Fundo removido com sucesso (BiRefNet)')
"

echo "[2/3] Convertendo para Base64..."
if command -v python3 >/dev/null 2>&1; then
    B64=$(python3 -c "import base64; print(base64.b64encode(open('$PROCESSED_PNG', 'rb').read()).decode('utf-8'))")
else
    B64=$(base64 -w 0 "$PROCESSED_PNG")
fi

echo "[3/3] Gerando SVG (Embedded Raster)..."

# Get dimensions of the PROCESSED image
DIMS=$($IM "$PROCESSED_PNG" -format "%w %h" info:)
WIDTH=$(echo "$DIMS" | cut -d' ' -f1)
HEIGHT=$(echo "$DIMS" | cut -d' ' -f2)

OUTPUT_SVG="${NAME}.svg"

cat > "$OUTPUT_SVG" <<EOF
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${WIDTH}" height="${HEIGHT}" href="data:image/png;base64,${B64}"/>
</svg>
EOF

echo
echo "✅ SVG (Raster Embedded) GERADO:"
echo "👉 $OUTPUT_SVG"

