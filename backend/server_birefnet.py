from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import uvicorn

import onnxruntime as ort
import os

# Check available providers
available_providers = ort.get_available_providers()
providers = []

if "CUDAExecutionProvider" in available_providers:
    providers.append("CUDAExecutionProvider")
    print("🚀 GPU Detected! Using CUDAExecutionProvider")
    device = "gpu"
else:
    print("⚠️ GPU NOT Detected or CUDA unavailable. Using CPU.")
    device = "cpu"

providers.append("CPUExecutionProvider") # Fallback

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session = new_session("birefnet-general", providers=providers)

@app.post("/remove-bg")
async def remove_bg(image: UploadFile = File(...)):
    data = await image.read()
    out = remove(data, session=session)
    return Response(content=out, media_type="image/png")

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model": "birefnet-general", 
        "device": device,
        "providers": providers
    }

if __name__ == "__main__":
    uvicorn.run("server_birefnet:app", host="0.0.0.0", port=8001, reload=False)
