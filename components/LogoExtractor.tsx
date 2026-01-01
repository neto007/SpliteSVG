import React, { useState } from "react";
import {
  parseGrid,
  fileToImage,
  drawImageToCanvas,
  trimCanvas,
  extractLogosCanvas,
  downscaleCanvas,
  removeBackgroundByColor,
  removeBackgroundBiRefNet,
  checkBiRefNet,
  canvasToEmbeddedSVG,
  createZipFromSVGs,
} from "../utils/imageProcessing";
import { loadOnnxSession, removeBackgroundONNX } from "../utils/onnxRemoval";

const GRID_OPTIONS = [
  "4x4 (16 logos)",
  "4x3 (12 logos)",
  "3x4 (12 logos)",
  "3x3 (9 logos)",
  "5x4 (20 logos)",
  "4x5 (20 logos)",
  "2x2 (4 logos)",
];

export const LogoExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [grid, setGrid] = useState<string>("4x4 (16 logos)");
  const [trim, setTrim] = useState(true);
  const [tolerance, setTolerance] = useState(50);
  const [maxDim, setMaxDim] = useState(512);
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<{ name: string; pngUrl: string; svgUrl: string }[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"local" | "onnx" | "birefnet">("local");
  const [modelUrl, setModelUrl] = useState<string>("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string>("");
  const [birefnetUrl, setBirefnetUrl] = useState<string>(() => {
    const host = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
    return `http://${host}:8001`;
  });

  const handleProcess = async () => {
    try {
      if (!file) {
        setStatus("Por favor, selecione uma imagem.");
        return;
      }
      setStatus("Processando...");
      setItems([]);
      setZipUrl(null);
      const img = await fileToImage(file);
      let base = drawImageToCanvas(img);
      if (trim) base = trimCanvas(base, tolerance);
      const spec = parseGrid(grid.split(" ")[0]);
      const tiles = extractLogosCanvas(base, spec);
      const svgs: { name: string; content: string }[] = [];
      const localItems: { name: string; pngUrl: string; svgUrl: string }[] = [];
      let session: any = null;
      if (mode === "onnx") {
        if (!modelUrl) throw new Error("Informe o URL do modelo ONNX.");
        setStatus("Carregando modelo ONNX...");
        session = await loadOnnxSession(modelUrl);
        setStatus("Modelo ONNX carregado. Extraindo logos...");
      } else if (mode === "birefnet") {
        if (!birefnetUrl) throw new Error("Informe o Servidor BiRefNet URL.");
        setStatus("Verificando BiRefNet...");
        await checkBiRefNet(birefnetUrl);
        setStatus("BiRefNet OK. Extraindo logos...");
      }
      for (let i = 0; i < tiles.length; i++) {
        const s = tiles[i];
        let clean: HTMLCanvasElement;
        if (mode === "onnx" && session) {
          try {
            clean = await removeBackgroundONNX(s, session);
          } catch {
            clean = removeBackgroundByColor(s, tolerance);
          }
        } else if (mode === "birefnet") {
          clean = await removeBackgroundBiRefNet(s, birefnetUrl);
        } else {
          clean = removeBackgroundByColor(s, tolerance);
        }
        const name = `logo_${String(i).padStart(2, "0")}`;
        const svgStr = canvasToEmbeddedSVG(clean);
        svgs.push({ name: `${name}.svg`, content: svgStr });
        const pngUrl = clean.toDataURL("image/png");
        const svgUrl = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml" }));
        localItems.push({ name, pngUrl, svgUrl });
      }
      setItems(localItems);
      const zipBlob = await createZipFromSVGs(svgs);
      const url = URL.createObjectURL(zipBlob);
      setZipUrl(url);
      setStatus(`✅ ${svgs.length} logos extraídos com sucesso!`);
    } catch (e: any) {
      console.error(e);
      setStatus(e?.message || "Erro inesperado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-300"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("local")}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${mode === 'local' ? 'bg-esport-accent text-black' : 'bg-gray-800 text-gray-300'}`}
            >
              Local
            </button>
            <button
              onClick={() => setMode("onnx")}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${mode === 'onnx' ? 'bg-esport-accent text-black' : 'bg-gray-800 text-gray-300'}`}
            >
              ONNX
            </button>
            <button
              onClick={() => setMode("birefnet")}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${mode === 'birefnet' ? 'bg-esport-accent text-black' : 'bg-gray-800 text-gray-300'}`}
            >
              BiRefNet
            </button>
          </div>
          <select
            value={grid}
            onChange={(e) => setGrid(e.target.value)}
            className="w-full bg-esport-dark border border-gray-700 rounded-lg p-2 text-sm"
          >
            {GRID_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            ✂️ Auto Trim
          </label>
          {mode === "onnx" && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Modelo ONNX URL</label>
              <input
                type="text"
                placeholder="https://.../u2netp.onnx"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                className="w-full bg-esport-dark border border-gray-700 rounded-lg p-2 text-sm"
              />
            </div>
          )}
          {mode === "birefnet" && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Servidor BiRefNet URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="http://localhost:8001"
                  value={birefnetUrl}
                  onChange={(e) => setBirefnetUrl(e.target.value)}
                  className="w-full bg-esport-dark border border-gray-700 rounded-lg p-2 text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      setStatus("Verificando...");
                      await checkBiRefNet(birefnetUrl);
                      setStatus("BiRefNet OK");
                    } catch {
                      setStatus("Erro BiRefNet");
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition"
                >
                  Testar
                </button>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Tolerance</label>
            <input
              type="range"
              min={0}
              max={100}
              value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500">{tolerance}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Max Tile Dim</label>
            <input
              type="number"
              min={128}
              max={2048}
              value={maxDim}
              onChange={(e) => setMaxDim(parseInt(e.target.value))}
              className="w-full bg-esport-dark border border-gray-700 rounded-lg p-2 text-sm"
            />
          </div>
          <button
            onClick={handleProcess}
            className="w-full bg-esport-accent text-black font-bold rounded-lg py-2 hover:opacity-90 transition"
          >
            🚀 Extrair Logos (Frontend)
          </button>
          <div className="text-xs text-gray-500">{status}</div>
          {zipUrl && (
            <a
              href={zipUrl}
              download="logos.zip"
              className="inline-block mt-2 text-esport-accent underline text-xs"
            >
              📦 Baixar ZIP (SVGs)
            </a>
          )}
        </div>
        <div className="md:col-span-3">
          <div className="grid grid-cols-4 gap-2">
            {items.map((it, i) => (
              <div key={i} className="bg-esport-dark border border-gray-800 rounded-lg p-2 space-y-2">
                <img src={it.pngUrl} alt={`Logo ${i}`} className="w-full h-32 object-contain" />
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] text-gray-500">Logo {i}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setViewerUrl(it.pngUrl);
                        setViewerName(it.name);
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                    >
                      Expandir
                    </button>
                    <a
                      href={it.pngUrl}
                      download={`${it.name}.png`}
                      className="px-2 py-1 text-[10px] rounded bg-esport-accent text-black hover:opacity-90"
                    >
                      PNG
                    </a>
                    <a
                      href={it.svgUrl}
                      download={`${it.name}.svg`}
                      className="px-2 py-1 text-[10px] rounded bg-esport-accent/20 text-esport-accent hover:bg-esport-accent/30"
                    >
                      SVG
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {viewerUrl && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="max-w-[90vw] max-h-[90vh] bg-esport-dark border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-300">{viewerName}</div>
                  <button
                    onClick={() => setViewerUrl(null)}
                    className="px-2 py-1 text-[10px] rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                  >
                    Fechar
                  </button>
                </div>
                <img src={viewerUrl} alt={viewerName} className="w-[80vw] h-[80vh] object-contain" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
