from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import uvicorn

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session = new_session("birefnet-general")

@app.post("/remove-bg")
async def remove_bg(image: UploadFile = File(...)):
    data = await image.read()
    out = remove(data, session=session)
    return Response(content=out, media_type="image/png")

@app.get("/health")
async def health():
    return {"status": "ok", "model": "birefnet-general"}

if __name__ == "__main__":
    uvicorn.run("server_birefnet:app", host="0.0.0.0", port=8001, reload=False)
