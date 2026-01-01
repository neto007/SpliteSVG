#!/bin/bash
set -e

INPUT="${1:-/home/machine/repository/PENTEST/stackedit/esports-4k-logo-fa56a19f-45e3-4ab2-b7f2-204c6cfb03c5.png}"
GRID="${2:-4x4}"  # Padrão: 4x4. Pode ser 4x3, 3x3, 5x5, etc.

mkdir -p logos/png logos/svg tmp
rm -f logos/png/*.png logos/svg_high_quality/*.svg

echo "[+] Recortando imagem em grade $GRID..."

# convert "$INPUT" -crop 4x4@ +repage logos/png/logo_%02d.png
# Usando o método de recorte em grade personalizado
convert "$INPUT" -crop "${GRID}@" +repage logos/png/logo_%02d.png

# /usr/bin/python3 extract_objects.py "$INPUT" logos/png/

# echo "[+] Convertendo PNG -> SVG (potrace)..."
# 
# for img in logos/png/*.png; do
#   name=$(basename "$img" .png)
#   echo "    -> Processando $name"
# 
#   convert "$img" \
#     -resize 512x512 \
#     -colorspace Gray \
#     -threshold 60% \
#     "tmp/${name}.pbm"
# 
#   potrace "tmp/${name}.pbm" \
#     -s \
#     -O 0.2 \
#     -o "logos/svg/${name}.svg"
# done

echo "[✓] Finalizado com sucesso"
