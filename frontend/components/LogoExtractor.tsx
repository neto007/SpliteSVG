import React, { useState } from "react";
import {
  parseGrid,
  fileToImage,
  drawImageToCanvas,
  trimCanvas,
  extractLogosCanvas,
  removeBackgroundByColor,
  removeBackgroundBiRefNet,
  checkBiRefNet,
  canvasToEmbeddedSVG,
  createZipFromSVGs,
} from "../utils/imageProcessing";
import { Upload, X, FileUp, Download, Maximize2, Settings, Play, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [mode] = useState<"birefnet">("birefnet"); // Fixed mode
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string>("");
  const [birefnetUrl, setBirefnetUrl] = useState<string>(() => {
    const host = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
    return `http://${host}:8001`;
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

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

      if (mode === "birefnet") {
        if (!birefnetUrl) throw new Error("Informe o Servidor BiRefNet URL.");
        setStatus("Verificando BiRefNet...");
        await checkBiRefNet(birefnetUrl);
        setStatus("BiRefNet OK. Extraindo logos...");
      }

      for (let i = 0; i < tiles.length; i++) {
        const s = tiles[i];
        let clean: HTMLCanvasElement;

        if (mode === "birefnet") {
          clean = await removeBackgroundBiRefNet(s, birefnetUrl);
        } else {
          // Fallback unlikely to be reached given fixed mode
          clean = removeBackgroundByColor(s, tolerance);
        }

        const name = `logo_${String(i).padStart(2, "0")}`;
        const svgStr = canvasToEmbeddedSVG(clean);
        svgs.push({ name: `${name}.svg`, content: svgStr });
        const pngUrl = clean.toDataURL("image/png");
        const svgUrl = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml" }));

        // Add to local list for zip generation at the end
        localItems.push({ name, pngUrl, svgUrl });

        // Update UI incrementally
        setItems(prev => [...prev, { name, pngUrl, svgUrl }]);
      }
      // setItems(localItems); // Removed bulk update
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
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">

        {/* Upload Card */}
        <div className="bg-esport-dark border border-gray-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload
          </h3>

          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group
              ${isDragging ? 'border-esport-accent bg-esport-accent/10 scale-[1.02]' : 'border-gray-700 hover:border-esport-accent/50 hover:bg-gray-800/50'}
              ${file ? 'py-6' : 'py-12'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {file ? (
              <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-esport-dark rounded-lg mx-auto flex items-center justify-center border border-gray-700 shadow-lg">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg opacity-80"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="px-3 py-1 bg-red-500/10 text-red-500 text-xs rounded-full hover:bg-red-500/20 transition-colors flex items-center gap-1 mx-auto"
                >
                  <X className="w-3 h-3" /> Remover
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <FileUp className="w-6 h-6 text-gray-400 group-hover:text-esport-accent transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-300">
                  Arraste & Solte ou <span className="text-esport-accent underline">Clique</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG</p>
              </>
            )}
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-esport-dark border border-gray-800 rounded-xl p-5 shadow-lg space-y-5">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configurações
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Layout da Grade</label>
            <select
              value={grid}
              onChange={(e) => setGrid(e.target.value)}
              className="w-full bg-esport-black border border-gray-700 rounded-lg p-2.5 text-sm focus:border-esport-accent focus:outline-none transition-colors appearance-none"
            >
              {GRID_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={trim}
                onChange={(e) => setTrim(e.target.checked)}
                className="rounded border-gray-700 bg-esport-black text-esport-accent focus:ring-esport-accent focus:ring-offset-0"
              />
              <span>✂️ Auto Trim</span>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Tolerância</span>
              <span className="text-esport-accent font-mono">{tolerance}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={tolerance}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setTolerance(v);
              }}
              className="w-full accent-esport-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Dimensão Máx (px)</label>
            <input
              type="number"
              min={128}
              max={2048}
              value={maxDim}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setMaxDim(v);
              }}
              className="w-full bg-esport-black border border-gray-700 rounded-lg p-2.5 text-sm focus:border-esport-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-2 border-t border-gray-800">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-mono">BiRefNet URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={birefnetUrl}
                  onChange={(e) => setBirefnetUrl(e.target.value)}
                  className="flex-1 bg-esport-black border border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={!file}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wide shadow-lg transition-all duration-300
            ${file
              ? 'bg-esport-accent text-black hover:bg-esport-accent/90 hover:scale-[1.02] hover:shadow-esport-accent/20'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
          `}
        >
          {status === "Processando..." ? (
            <span className="animate-pulse">Processando...</span>
          ) : (
            <><Play className="w-4 h-4 fill-current" /> Extrair Logos</>
          )}
        </button>

        {status && (
          <div className={`
             text-xs font-medium p-3 rounded-lg border flex items-center gap-2
             ${status.includes('Erro') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}
           `}>
            {status.includes('Erro') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {status}
          </div>
        )}

      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between p-4 bg-esport-dark/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Resultados</h2>
              <p className="text-xs text-gray-500">{items.length > 0 ? `${items.length} logotipos encontrados` : 'Aguardando processamento'}</p>
            </div>
          </div>

          {zipUrl && (
            <a
              href={zipUrl}
              download="logos.zip"
              className="flex items-center gap-2 px-4 py-2 bg-esport-secondary text-white rounded-lg font-bold text-sm hover:bg-esport-secondary/80 transition-all shadow-lg shadow-esport-secondary/20"
            >
              <Download className="w-4 h-4" /> Baixar ZIP
            </a>
          )}
        </div>

        {/* Grid Results */}
        <div className={`
           min-h-[500px] rounded-xl border-2 border-dashed border-gray-800 bg-black/20 p-6 transition-all
           ${items.length === 0 ? 'flex flex-col items-center justify-center' : ''}
         `}>
          {items.length === 0 ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                <Settings className="w-10 h-10 text-gray-700 animate-spin-slow" />
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-medium">Nenhum resultado ainda</p>
                <p className="text-xs text-gray-600">Faça o upload de uma imagem e clique em Extrair</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500 slide-in-from-bottom-4">
              {items.map((it, i) => (
                <div key={i} className="group relative bg-esport-dark border border-gray-800 rounded-xl p-3 hover:border-esport-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="relative aspect-square bg-gray-900/50 rounded-lg mb-3 overflow-hidden">
                    <img src={it.pngUrl} alt={it.name} className="w-full h-full object-contain p-2" />

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                      <button
                        onClick={() => { setViewerUrl(it.pngUrl); setViewerName(it.name); }}
                        className="p-2 bg-white/10 rounded-full text-white hover:bg-esport-accent hover:text-black transition-colors"
                        title="Expandir"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <div className="flex gap-2">
                        <a href={it.pngUrl} download={`${it.name}.png`} className="px-2 py-1 bg-gray-800 rounded text-[10px] font-bold hover:bg-gray-700 cursor-pointer">PNG</a>
                        <a href={it.svgUrl} download={`${it.name}.svg`} className="px-2 py-1 bg-esport-accent rounded text-black text-[10px] font-bold hover:bg-esport-accent/80 cursor-pointer">SVG</a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] text-gray-500 font-mono uppercase truncate">{it.name}</span>
                    <div className="w-2 h-2 rounded-full bg-esport-accent/50"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Viewer */}
      {viewerUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="relative max-w-[90vw] max-h-[90vh] bg-esport-dark border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-4">
              <h3 className="text-lg font-bold text-white">{viewerName}</h3>
              <button
                onClick={() => setViewerUrl(null)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-center">
              <img src={viewerUrl} alt={viewerName} className="max-w-[80vw] max-h-[70vh] object-contain" />
            </div>
            <div className="flex justify-center mt-6">
              <a
                href={viewerUrl}
                download={`${viewerName}.png`}
                className="flex items-center gap-2 px-6 py-2 bg-esport-accent text-black rounded-full font-bold hover:bg-esport-accent/80 transition-transform hover:scale-105"
              >
                <Download className="w-4 h-4" /> Baixar PNG Original
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
