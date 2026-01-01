
import React from 'react';
import { GeneratedImage, GeneratorStatus } from '../../../types';
import { Download, Sparkles, AlertCircle, LayoutGrid, MonitorCheck, PlayCircle, Contact } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PreviewProps {
  status: GeneratorStatus;
  currentImages: GeneratedImage[];
  history: GeneratedImage[];
  onSelectImage: (img: GeneratedImage) => void;
  errorMessage?: string | null;
  onSendToExtractor?: (img: GeneratedImage) => void;
}

export const Preview: React.FC<PreviewProps> = ({ status, currentImages, history, onSelectImage, errorMessage, onSendToExtractor }) => {

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `esports-4k-asset-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isModelSheet = currentImages[0]?.prompt.includes('(Sheet)');

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Main Preview Area */}
      <div className="relative flex-1 bg-esport-dark rounded-xl border border-gray-800 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 shadow-2xl">

        {/* Decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>

        {status === GeneratorStatus.IDLE && currentImages.length === 0 && (
          <div className="text-center text-gray-500 z-10">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-bold mb-2 uppercase tracking-widest">Aguardando Projeto</h3>
            <p className="max-w-xs mx-auto text-sm">Pronto para gerar logos, grades ou model sheets em alta definição.</p>
          </div>
        )}

        {status === GeneratorStatus.LOADING && (
          <div className="text-center z-10 flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-2 border-esport-accent/20 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-t-esport-accent rounded-full animate-spin"></div>
            </div>
            <p className="text-esport-accent font-bold tracking-widest uppercase animate-pulse">
              Construindo Assets Pro...
            </p>
            <p className="text-[10px] text-gray-500 mt-2 uppercase">Gerações complexas de grade podem levar até 30 segundos</p>
          </div>
        )}

        {status === GeneratorStatus.ERROR && (
          <div className="text-center text-red-400 z-10 p-6">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <p className="font-bold uppercase">Erro na Geração</p>
            <p className="text-xs mt-2 opacity-70 bg-red-950/30 p-3 rounded border border-red-900/50 max-w-sm mx-auto">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Display Content */}
        {(status === GeneratorStatus.SUCCESS || (status === GeneratorStatus.IDLE && currentImages.length > 0)) && currentImages.length > 0 && (
          <div className="z-10 w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="relative group w-full max-w-3xl">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-esport-accent/50 text-esport-accent text-[10px] font-bold uppercase tracking-widest">
                {isModelSheet ? <Contact className="w-3 h-3" /> : <MonitorCheck className="w-3 h-3" />}
                {isModelSheet ? 'Character Reference Sheet (4K)' : 'Professional eSports Asset (4K)'}
              </div>
              <img
                src={currentImages[0].url}
                alt="generated"
                className="w-full h-auto rounded-lg shadow-2xl border border-gray-700 group-hover:border-esport-accent/50 transition-colors bg-esport-black"
              />
              <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => handleDownload(currentImages[0])} className="py-2 px-6 text-xs">
                  <Download className="w-4 h-4" /> Baixar Asset Original
                </Button>
                <Button
                  onClick={() => onSendToExtractor && onSendToExtractor(currentImages[0])}
                  className="py-2 px-6 text-xs bg-esport-dark border border-esport-accent text-white hover:bg-esport-accent hover:text-black"
                >
                  <PlayCircle className="w-4 h-4" /> Enviar para Extractor
                </Button>
              </div>
            </div>

            <p className="mt-4 text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
              {isModelSheet ? 'Visão: Frente • Lado • Costas • Detalhe' : 'Asset de Marca • Estilo Consistente'}
            </p>
          </div>
        )}
      </div>

      {/* History Strip */}
      {history.length > 0 && (
        <div className="h-32">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <LayoutGrid className="w-3 h-3" /> Biblioteca de Assets
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {history.map((img) => (
              <button
                key={img.id}
                onClick={() => onSelectImage(img)}
                className={`relative flex-shrink-0 w-24 h-24 rounded border-2 transition-all overflow-hidden ${currentImages[0]?.id === img.id ? 'border-esport-accent' : 'border-gray-800 hover:border-gray-600'
                  }`}
              >
                <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                {img.prompt.includes('(Sheet)') && (
                  <div className="absolute top-1 right-1">
                    <Contact className="w-3 h-3 text-esport-accent fill-black" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
