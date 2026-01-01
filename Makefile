UV ?= uv
HOST ?= 0.0.0.0
PORT ?= 8001

.PHONY: birefnet birefnet-bg birefnet-stop birefnet-check dev build preview

birefnet:
	cd backend && $(UV) run --with rembg --with fastapi --with uvicorn --with onnxruntime --with python-multipart uvicorn server_birefnet:app --host $(HOST) --port $(PORT)

birefnet-bg:
	cd backend && nohup $(UV) run --with "rembg[gpu]" --with fastapi --with uvicorn --with onnxruntime-gpu --with python-multipart uvicorn server_birefnet:app --host $(HOST) --port $(PORT) 

birefnet-stop:
	@cd backend && if [ -f .birefnet.pid ]; then kill -9 `cat .birefnet.pid` && rm .birefnet.pid && echo "stopped"; else echo "no pid"; fi

birefnet-check:
	cd backend && $(UV) run --with "rembg[gpu]" --with fastapi --with uvicorn --with onnxruntime-gpu --with python-multipart python -c "import rembg,fastapi,uvicorn,onnxruntime,multipart;print('BiRefNet deps OK')"

dev:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

preview:
	cd frontend && npm run preview
