#!/bin/bash
set -e

# Use the input file if provided, otherwise default (defined in extract_logos.sh)
INPUT_FILE="$1"

# 1. Extract logos
echo "🚀 Iniciando extração de logos..."
if [ -n "$INPUT_FILE" ]; then
    bash extract_logos.sh "$INPUT_FILE"
else
    bash extract_logos.sh
fi

# 2. Process each extracted PNG
echo "🎨 Iniciando recriação em SVG de alta qualidade..."
mkdir -p logos/svg_high_quality

for img in logos/png/*.png; do
    [ -e "$img" ] || continue
    
    echo "---------------------------------------------------"
    echo "Processando: $img"
    
    # Run recreateSvg.sh
    bash recreateSvg.sh "$img"
    
    # Move the result to a dedicated folder
    BASENAME=$(basename "$img" .png)
    if [ -f "${BASENAME}.svg" ]; then
        mv "${BASENAME}.svg" "logos/svg_high_quality/"
        echo "✨ Salvo em logos/svg_high_quality/${BASENAME}.svg"
    else
        echo "⚠️ Falha ao criar SVG para $BASENAME"
    fi
    
    # Cleanup temporary work directory from recreateSvg.sh if desired
    # rm -rf "work_${BASENAME}"
done

echo "🎉 Tudo pronto! Verifique a pasta logos/svg_high_quality"
