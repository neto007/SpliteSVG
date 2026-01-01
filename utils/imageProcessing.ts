export type GridSpec = { cols: number; rows: number };

export function parseGrid(grid: string): GridSpec {
  const [c, r] = grid.toLowerCase().split("x").map((x) => parseInt(x, 10));
  return { cols: c, rows: r };
}

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function drawImageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const c = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return c;
}

function colorDiff(a: Uint8ClampedArray, i: number, r0: number, g0: number, b0: number): number {
  const r = a[i], g = a[i + 1], b = a[i + 2];
  const dr = r - r0, dg = g - g0, db = b - b0;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function trimCanvas(canvas: HTMLCanvasElement, tolerance = 50): HTMLCanvasElement {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, w, h);
  const a = data.data;
  const r0 = a[0], g0 = a[1], b0 = a[2];
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const isContent = a[i + 3] > 10 || colorDiff(a, i, r0, g0, b0) > tolerance;
      if (isContent) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX || minY > maxY) return canvas;
  const left = Math.max(0, minX);
  const top = Math.max(0, minY);
  const right = Math.min(w - 1, maxX);
  const bottom = Math.min(h - 1, maxY);
  const outW = Math.max(1, right - left + 1);
  const outH = Math.max(1, bottom - top + 1);
  const out = createCanvas(outW, outH);
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(canvas, left, top, outW, outH, 0, 0, outW, outH);
  return out;
}

export function extractLogosCanvas(canvas: HTMLCanvasElement, grid: GridSpec): HTMLCanvasElement[] {
  const w = canvas.width, h = canvas.height;
  const xCuts: number[] = [];
  const yCuts: number[] = [];
  for (let i = 0; i <= grid.cols; i++) xCuts.push(Math.round((i * w) / grid.cols));
  for (let i = 0; i <= grid.rows; i++) yCuts.push(Math.round((i * h) / grid.rows));
  const out: HTMLCanvasElement[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const left = xCuts[col];
      const right = xCuts[col + 1];
      const top = yCuts[row];
      const bottom = yCuts[row + 1];
      const tw = Math.max(1, right - left);
      const th = Math.max(1, bottom - top);
      const c = createCanvas(tw, th);
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, left, top, tw, th, 0, 0, tw, th);
      out.push(c);
    }
  }
  return out;
}

export function downscaleCanvas(canvas: HTMLCanvasElement, maxDim = 512): HTMLCanvasElement {
  const w = canvas.width, h = canvas.height;
  const m = Math.max(w, h);
  if (m <= maxDim) return canvas;
  const scale = maxDim / m;
  const nw = Math.max(1, Math.floor(w * scale));
  const nh = Math.max(1, Math.floor(h * scale));
  const out = createCanvas(nw, nh);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, w, h, 0, 0, nw, nh);
  return out;
}

export function removeBackgroundByColor(canvas: HTMLCanvasElement, tolerance = 30): HTMLCanvasElement {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, w, h);
  const a = data.data;
  const r0 = a[0], g0 = a[1], b0 = a[2];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const d = colorDiff(a, i, r0, g0, b0);
      if (d <= tolerance) a[i + 3] = 0;
    }
  }
  const out = createCanvas(w, h);
  out.getContext("2d")!.putImageData(data, 0, 0);
  return out;
}

/* precise mode removed */

export function canvasToEmbeddedSVG(canvas: HTMLCanvasElement): string {
  const w = canvas.width, h = canvas.height;
  const png = canvas.toDataURL("image/png");
  const b64 = png.split(",")[1] || "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${w}" height="${h}" href="data:image/png;base64,${b64}"/>
</svg>`;
}

declare global {
  interface Window { JSZip?: any }
}

export async function createZipFromSVGs(files: { name: string; content: string }[]): Promise<Blob> {
  const JSZipCtor = (window as any).JSZip;
  if (!JSZipCtor) throw new Error("JSZip não carregado. Verifique o script CDN no index.html.");
  const zip = new JSZipCtor();
  for (const f of files) {
    zip.file(f.name, f.content);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export async function canvasToBlobPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Falha ao gerar PNG")), "image/png");
  });
}

export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return c;
}

export async function removeBackgroundBiRefNet(canvas: HTMLCanvasElement, serverUrl: string): Promise<HTMLCanvasElement> {
  const blob = await canvasToBlobPNG(canvas);
  const fd = new FormData();
  fd.append("image", blob, "logo.png");
  const base = serverUrl.trim();
  const normalized = base.endsWith("/remove-bg") ? base : `${base.replace(/\/$/, "")}/remove-bg`;
  const resp = await fetch(normalized, { method: "POST", body: fd });
  if (!resp.ok) throw new Error(`BiRefNet erro ${resp.status}`);
  const outBlob = await resp.blob();
  return await blobToCanvas(outBlob);
}

export async function checkBiRefNet(serverUrl: string): Promise<{ status: string; model: string }> {
  const base = serverUrl.trim();
  const root = base.endsWith("/remove-bg") ? base.replace(/\/remove-bg$/, "") : base.replace(/\/$/, "");
  const r = await fetch(`${root}/health`, { method: "GET" });
  if (!r.ok) throw new Error(`BiRefNet health ${r.status}`);
  return await r.json();
}
