from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import uvicorn
import onnxruntime as ort
import os
import gc

# Optional torch import for VRAM clearing
try:
    import torch
except ImportError:
    torch = None

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

# NOTE: Global session removed to save VRAM.
# session = new_session("birefnet-general", providers=providers)

@app.post("/remove-bg")
async def remove_bg(image: UploadFile = File(...)):
    session = None
    try:
        print("🔄 Loading model session (On-Demand)...")
        # Initialize session for this request only
        session = new_session("birefnet-general", providers=providers)
        
        data = await image.read()
        print("⚡ Processing image...")
        out = remove(data, session=session)
        print("✅ Processing complete.")
        return Response(content=out, media_type="image/png")
    
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return Response(content=str(e), status_code=500)
    
    finally:
        print("🧹 Cleaning up VRAM...")
        # Force cleanup
        if session:
            del session
        
        # Force Garbage Collection
        gc.collect()
        
        # Clear CUDA Cache if available
        if torch and torch.cuda.is_available():
            torch.cuda.empty_cache()
            print("✨ CUDA Cache cleared.")
        
        print("✨ VRAM Cleanup done.")

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model": "birefnet-general (on-demand)", 
        "device": device,
        "providers": providers
    }

if __name__ == "__main__":
    uvicorn.run("server_birefnet:app", host="0.0.0.0", port=8001, reload=False)
