#!/usr/bin/env python3
"""
Processador de imagem individual - remove fundo com BiRefNet.
Usado como subprocess pelo app principal para evitar acúmulo de memória.
"""

import sys
import os
from io import BytesIO
from PIL import Image
from rembg import remove, new_session

def process_single_image(input_path: str, output_path: str):
    """Processa uma única imagem e salva."""
    print(f"Carregando modelo BiRefNet...")
    session = new_session('birefnet-general')
    print(f"Modelo carregado. Processando {input_path}...")
    
    # Carregar imagem
    with open(input_path, 'rb') as f:
        input_data = f.read()
    
    # Remover fundo
    output_data = remove(input_data, session=session)
    
    # Salvar resultado
    with open(output_path, 'wb') as f:
        f.write(output_data)
    
    print(f"Salvo em {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python process_single.py <input.png> <output.png>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    process_single_image(input_path, output_path)
