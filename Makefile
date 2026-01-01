UV ?= uv
HOST ?= 0.0.0.0
PORT ?= 8001

.PHONY: birefnet birefnet-bg birefnet-stop birefnet-check dev build preview

birefnet:
	$(UV) run --with rembg --with fastapi --with uvicorn --with onnxruntime --with python-multipart uvicorn server_birefnet:app --host $(HOST) --port $(PORT)

birefnet-bg:
	nohup $(UV) run --with rembg --with fastapi --with uvicorn --with onnxruntime --with python-multipart uvicorn server_birefnet:app --host $(HOST) --port $(PORT) 

birefnet-stop:
	@if [ -f .birefnet.pid ]; then kill -9 `cat .birefnet.pid` && rm .birefnet.pid && echo "stopped"; else echo "no pid"; fi

birefnet-check:
	$(UV) run --with rembg --with fastapi --with uvicorn --with onnxruntime --with python-multipart python -c "import rembg,fastapi,uvicorn,onnxruntime,multipart;print('BiRefNet deps OK')"

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview
