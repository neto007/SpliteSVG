# SpliteSVG - AI Logo Generator & Extractor

**SpliteSVG** é uma ferramenta poderosa e moderna para criação e extração de logotipos e assets de eSports, alimentada por Inteligência Artificial.

O projeto combina um **Generator** baseado no modelo **Gemini (Google DeepMind)** para criar designs exclusivos e um **Extractor** robusto que utiliza **BiRefNet** e visão computacional para remover fundos, recortar e vetorizar imagens automaticamente.

![SpliteSVG Banner](https://placehold.co/1200x400/0a0a0f/00ff9d?text=SpliteSVG+AI+Logo+Lab)

## 🚀 Funcionalidades

### 🎨 AI Generator
*   **Geração de Logos**: Crie logotipos de eSports profissionais com prompts simples.
*   **Prompt Engineering Automático**: O sistema otimiza seus prompts para estilos como Mascote, Minimalista, Cyberpunk, etc.
*   **Coleções em Grade**: Gere múltiplos conceitos de uma vez (ex: 4x4, 3x3).
*   **Model Sheets**: Criação de folhas de referência de personagens (frente, lado, costas) para modelagem 3D.
*   **Integração Direta**: Envie imagens geradas diretamente para o Extractor com um clique.

### ✂️ Logo Extractor
*   **Remoção de Fundo (SOTA)**: Utiliza **BiRefNet** para remoção de fundo com precisão de estado da arte.
*   **Grid Slicing Inteligente**: Detecta e recorta automaticamente logotipos individuais de uma grade (Grid Layout 1x1 até 5x5).
*   **Vetorização (SVG)**: Converte imagens rasterizadas em SVGs embutidos prontos para uso.
*   **Auto-Trim**: Remove espaços vazios automaticamente.
*   **Exportação em Lote**: Baixe todos os logos extraídos em um arquivo ZIP.

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura moderna dividida em Frontend e Backend:

### Frontend (`/frontend`)
*   **Framework**: React (Vite) + TypeScript.
*   **Estilização**: TailwindCSS + Design System customizado (Glassmorphism/Neon).
*   **Estrutura**: Clean Architecture / Feature-based (`src/features/generator`, `src/features/extractor`).

### Backend (`/backend`)
*   **Framework**: FastAPI (Python).
*   **Core**: `rembg` (com suporte a GPU/CUDA), `onnxruntime`, `Pillow`.
*   **Função**: Processamento pesado de imagens (remoção de fundo, processamento neural).

---

## 🐳 Instalação com Docker (Recomendado)

A maneira mais fácil de rodar o SpliteSVG é usando Docker Compose.

### Pré-requisitos
*   Docker & Docker Compose instalados.
*   (Opcional) NVIDIA Drivers & NVIDIA Container Toolkit para suporte a GPU.

### Passos
1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/neto007/SpliteSVG.git
    cd SpliteSVG
    ```

2.  **Inicie os serviços:**
    ```bash
    docker-compose up --build
    ```

3.  **Acesse:**
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Backend API: [http://localhost:8001](http://localhost:8001)

---

## 🛠️ Instalação Manual (Desenvolvimento)

Para desenvolvimento local sem Docker.

### 1. Backend (Python/FastAPI)
```bash
cd backend
# Crie um ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python server_birefnet.py
# O servidor rodará em http://localhost:8001
```

### 2. Frontend (React)
```bash
cd frontend
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
# O frontend rodará em http://localhost:5173 (ou porta definida pelo Vite)
```

> **Nota:** Certifique-se de configurar a URL do backend no frontend se não estiver usando o proxy do Vite ou Nginx.

---

## 🔑 Configuração da API Key

Para usar o gerador de imagens, você precisa de uma chave de API do Google Gemini.
1.  Obtenha sua chave em: [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  No app, clique no ícone de **Chave (🔑)** no canto superior direito.
3.  Cole sua chave para salvar localmente no navegador.

---

## 📂 Estrutura de Diretórios

```
SpliteSVG/
├── backend/                # Serviço Python/FastAPI
│   ├── server_birefnet.py  # Entry point da API
│   ├── requirements.txt    # Dependências Python
│   └── Dockerfile          # Configuração Docker Backend
│
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/ui/  # Componentes genéricos
│   │   ├── features/       # Módulos funcionais
│   │   │   ├── generator/  # Lógica do Gerador
│   │   │   └── extractor/  # Lógica do Extrator
│   │   ├── App.tsx         # Componente Raiz
│   │   └── main.tsx        # Entry Point
│   ├── nginx.conf          # Configuração Nginx Frontend
│   └── Dockerfile          # Configuração Docker Frontend
│
└── docker-compose.yml      # Orquestração dos serviços
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou Pull Requests para melhorias, correções de bugs ou novas funcionalidades.

## 📄 Licença

Este projeto é desenvolvido para fins educacionais e demonstrativos.
