#!/usr/bin/env python3
"""
Logo Extractor - Extração e processamento de logos com IA
Converte uma imagem com múltiplos logos em SVGs individuais.
"""

import os
import gc
import base64
import tempfile
import shutil
from pathlib import Path
from typing import List, Tuple, Optional
from io import BytesIO
import zipfile
import gradio as gr
from PIL import Image, ImageChops
from rembg import remove, new_session
import threading

_REM_BG_SESSION = None
_REM_BG_INIT_LOCK = threading.Lock()
_SESSION_IDS = set()
_SESSION_INIT_COUNT = 0
MAX_TILE_DIM = int(os.environ.get("MAX_TILE_DIM", "512"))
MAX_SVG_BYTES = int(os.environ.get("MAX_SVG_BYTES", str(5_000_000)))

def get_birefnet_session():
    global _REM_BG_SESSION
    global _SESSION_INIT_COUNT
    with _REM_BG_INIT_LOCK:
        if _REM_BG_SESSION is None:
            _REM_BG_SESSION = new_session('birefnet-general')
            _SESSION_INIT_COUNT += 1
            _SESSION_IDS.add(id(_REM_BG_SESSION))
            print(f"[BiRefNet] session initialized count={_SESSION_INIT_COUNT} id={id(_REM_BG_SESSION)}", flush=True)
    return _REM_BG_SESSION

def downscale_image(image: Image.Image, max_dim: int = MAX_TILE_DIM) -> Image.Image:
    w, h = image.size
    if max(w, h) <= max_dim:
        return image
    img = image.copy()
    img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    return img

def trim_image(image: Image.Image, tolerance: int = 50) -> Image.Image:
    """
    Remove bordas uniformes (branco/preto/transparente) da imagem com tolerância.
    """
    # Converter para RGBA se não for
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Pegar cor do topo esquerdo
    bg = Image.new(image.mode, image.size, image.getpixel((0,0)))
    
    # Calcular diferença
    diff = ImageChops.difference(image, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    
    # Threshold manual
    # Se a diferença for pequena, considera como fundo
    bbox = diff.getbbox()
    
    if bbox:
        # Adicionar um pequeno padding (margem) de 10px para não cortar colado
        left, top, right, bottom = bbox
        width, height = image.size
        
        # Ajustar com padding mas sem sair da imagem
        left = max(0, left - 10)
        top = max(0, top - 10)
        right = min(width, right + 10)
        bottom = min(height, bottom + 10)
        
        return image.crop((left, top, right, bottom))
        
    return image


def extract_logos(image: Image.Image, grid: str = "4x4", apply_trim: bool = True) -> List[Image.Image]:
    """
    Recorta a imagem em uma grade.
    
    Args:
        image: Imagem PIL
        grid: Grade no formato "CxL"
        apply_trim: Se True, remove bordas antes de cortar
    """
    if apply_trim:
        original_size = image.size
        # Tenta trim em branco
        image = trim_image(image)
        print(f"Trim aplicado: {original_size} -> {image.size}", flush=True)

    cols, rows = map(int, grid.lower().split('x'))
    
    width, height = image.size
    tile_width = width // cols
    tile_height = height // rows
    
    logos = []
    for row in range(rows):
        for col in range(cols):
            left = col * tile_width
            top = row * tile_height
            right = left + tile_width
            bottom = top + tile_height
            
            tile = image.crop((left, top, right, bottom))
            logos.append(tile)
    
    return logos


def remove_background_inprocess(image: Image.Image) -> Image.Image:
    session = get_birefnet_session()
    print(f"[BiRefNet] using session id={id(session)}", flush=True)
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    out = remove(buf.getvalue(), session=session)
    return Image.open(BytesIO(out))


def image_to_svg(image: Image.Image) -> str:
    """
    Converte uma imagem PIL para SVG (raster embedded).
    
    Args:
        image: Imagem PIL com fundo transparente
    
    Returns:
        Conteúdo SVG como string
    """
    # Recortar espaço vazio
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    
    width, height = image.size
    def encode_png_b64(img: Image.Image) -> Tuple[str, int]:
        buf = BytesIO()
        img.save(buf, format='PNG', optimize=True, compress_level=9)
        buf.seek(0)
        raw = buf.read()
        return base64.b64encode(raw).decode('utf-8'), len(raw)
    b64_data, raw_size = encode_png_b64(image)
    print(f"[SVG] PNG raw size={raw_size/1024/1024:.2f}MB dims={width}x{height}", flush=True)
    if raw_size > MAX_SVG_BYTES:
        scale = 0.75
        while raw_size > MAX_SVG_BYTES and max(width, height) > 128:
            new_w = max(128, int(width * scale))
            new_h = max(128, int(height * scale))
            tmp = image.copy()
            tmp.thumbnail((new_w, new_h), Image.LANCZOS)
            width, height = tmp.size
            b64_data, raw_size = encode_png_b64(tmp)
            print(f"[SVG] downscaled -> {width}x{height} size={raw_size/1024/1024:.2f}MB", flush=True)
            image = tmp
    
    # Criar SVG
    svg = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="{width}" height="{height}" href="data:image/png;base64,{b64_data}"/>
</svg>'''
    
    return svg


def process_image(
    image: Image.Image,
    grid: str = "4x4",
    apply_trim: bool = True,
    progress: Optional[gr.Progress] = None
) -> Tuple[List[Image.Image], List[str], str]:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "temp_processing")
    os.makedirs(output_dir, exist_ok=True)
    for f in os.listdir(output_dir):
        os.remove(os.path.join(output_dir, f))
    if progress:
        progress(0.1, desc="Recortando imagem...")
    logos = extract_logos(image, grid, apply_trim)
    processed_images = []
    svg_paths = []
    total = len(logos)
    for i, tile in enumerate(logos):
        if progress:
            progress((i + 1) / total * 0.8 + 0.1, desc=f"Processando logo {i+1}/{total}...")
        small = downscale_image(tile, MAX_TILE_DIM)
        clean_logo = remove_background_inprocess(small)
        svg_content = image_to_svg(clean_logo)
        svg_path = os.path.join(output_dir, f"logo_{i:02d}.svg")
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        svg_paths.append(svg_path)
        png_path = os.path.join(output_dir, f"logo_{i:02d}.png")
        clean_logo.save(png_path, 'PNG')
        thumb = clean_logo.copy()
        thumb.thumbnail((256, 256))
        processed_images.append(thumb)
        del tile
        del small
        del clean_logo
        gc.collect()
    if progress:
        progress(1.0, desc="Concluído!")
    return processed_images, svg_paths, output_dir


def create_zip(svg_paths: List[str], output_dir: str) -> str:
    zip_path = os.path.join(output_dir, "logos.zip")
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for p in svg_paths:
            zf.write(p, arcname=os.path.basename(p))
    return zip_path


# ============== INTERFACE GRADIO ==============

def process_and_display(image, grid, apply_trim, progress=gr.Progress()):
    """Função principal chamada pela interface Gradio."""
    if image is None:
        return None, None, "Por favor, faça upload de uma imagem."
    
    # Converter para PIL se necessário
    if isinstance(image, str):
        image = Image.open(image)
    
    # Processar
    processed_images, svg_paths, output_dir = process_image(image, grid, apply_trim, progress)
    
    # Criar ZIP
    zip_path = create_zip(svg_paths, output_dir)
    
    # Converter imagens para formato Gradio
    gallery_images = [(img, f"Logo {i}") for i, img in enumerate(processed_images)]
    
    return gallery_images, zip_path, f"✅ {len(processed_images)} logos extraídos com sucesso!"


# Opções de grade
GRID_OPTIONS = [
    "4x4 (16 logos)",
    "4x3 (12 logos)",
    "3x4 (12 logos)",
    "3x3 (9 logos)",
    "5x4 (20 logos)",
    "4x5 (20 logos)",
    "2x2 (4 logos)",
]


def parse_grid(grid_option: str) -> str:
    """Extrai o valor da grade da opção selecionada."""
    return grid_option.split()[0]


def main():
    with gr.Blocks(
        title="Logo Extractor",
    ) as app:
        gr.Markdown("""
        # 🎨 Logo Extractor
        
        Extraia múltiplos logos de uma única imagem com remoção de fundo por IA (BiRefNet).
        
        **Como usar:**
        1. Faça upload da imagem contendo os logos
        2. Selecione a grade correspondente ao layout dos logos
        3. Clique em "Extrair Logos"
        4. Baixe os SVGs gerados
        """)
        
        with gr.Row():
            with gr.Column(scale=1):
                input_image = gr.Image(
                    label="Imagem de Entrada",
                    type="pil",
                    height=400
                )
                
                grid_dropdown = gr.Dropdown(
                    choices=GRID_OPTIONS,
                    value="4x4 (16 logos)",
                    label="Grade de Recorte",
                    info="Selecione quantas colunas x linhas de logos existem"
                )
                
                trim_checkbox = gr.Checkbox(
                    value=True,
                    label="✂️ Remover bordas brancas (Auto Trim)",
                    info="Remove margens brancas da imagem antes de aplicar a grade"
                )
                
                extract_btn = gr.Button(
                    "🚀 Extrair Logos",
                    variant="primary",
                    size="lg"
                )
                
                status_text = gr.Textbox(
                    label="Status",
                    interactive=False
                )
                
                download_file = gr.File(
                    label="📦 Download (ZIP com todos os SVGs)",
                    visible=True
                )
            
            with gr.Column(scale=2):
                output_gallery = gr.Gallery(
                    label="Logos Extraídos",
                    columns=4,
                    rows=4,
                    height=600,
                    object_fit="contain"
                )
        
        # Conectar eventos
        extract_btn.click(
            fn=lambda img, grid, trim: process_and_display(img, parse_grid(grid), trim),
            inputs=[input_image, grid_dropdown, trim_checkbox],
            outputs=[output_gallery, download_file, status_text]
        )
        
        gr.Markdown("""
        ---
        **Tecnologias:** BiRefNet (IA para remoção de fundo) | Pillow | Gradio
        """)
    
    return app


if __name__ == "__main__":
    app = main()
    app.launch(
        server_name="0.0.0.0",
        server_port=7861,
        share=False,
        theme=gr.themes.Soft(
            primary_hue="purple",
            secondary_hue="blue",
        )
    )
