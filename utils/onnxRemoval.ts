type Ort = typeof import("onnxruntime-web");

function getOrt(): any {
  return (window as any).ort;
}

export async function loadOnnxSession(modelUrl: string): Promise<any> {
  const ort = getOrt();
  if (!ort) throw new Error("onnxruntime-web (ort) não carregado.");
  const resp = await fetch(modelUrl);
  if (!resp.ok) throw new Error(`Falha ao baixar modelo: ${resp.status}`);
  const buf = await resp.arrayBuffer();
  const session = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  return session;
}

export async function removeBackgroundONNX(canvas: HTMLCanvasElement, session: any): Promise<HTMLCanvasElement> {
  const ort = getOrt();
  const w = canvas.width, h = canvas.height;
  const size = 320;
  const tmp = document.createElement("canvas");
  tmp.width = size; tmp.height = size;
  tmp.getContext("2d")!.drawImage(canvas, 0, 0, w, h, 0, 0, size, size);
  const img = tmp.getContext("2d")!.getImageData(0, 0, size, size).data;
  const chw = new Float32Array(3 * size * size);
  let idx = 0, c0 = 0, c1 = size * size, c2 = 2 * size * size;
  for (let i = 0; i < img.length; i += 4) {
    const r = img[i] / 255, g = img[i + 1] / 255, b = img[i + 2] / 255;
    chw[c0 + idx] = r;
    chw[c1 + idx] = g;
    chw[c2 + idx] = b;
    idx++;
  }
  const inputName = session.inputNames ? session.inputNames[0] : "input";
  const feed = { [inputName]: new ort.Tensor("float32", chw, [1, 3, size, size]) };
  const out = await session.run(feed);
  const outputName = session.outputNames ? session.outputNames[0] : Object.keys(out)[0];
  const outTensor = out[outputName];
  const alpha = outTensor.data as Float32Array;
  const alphaCanvas = document.createElement("canvas");
  alphaCanvas.width = w; alphaCanvas.height = h;
  const ctx = alphaCanvas.getContext("2d")!;
  const src = canvas.getContext("2d")!.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const alW = size, alH = size;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const ax = Math.floor(x * alW / w);
      const ay = Math.floor(y * alH / h);
      const aidx = ay * alW + ax;
      dst.data[i] = src.data[i];
      dst.data[i + 1] = src.data[i + 1];
      dst.data[i + 2] = src.data[i + 2];
      dst.data[i + 3] = Math.max(0, Math.min(255, Math.floor(alpha[aidx] * 255)));
    }
  }
  ctx.putImageData(dst, 0, 0);
  return alphaCanvas;
}
