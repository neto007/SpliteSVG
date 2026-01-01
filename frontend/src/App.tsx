
import React, { useState, useEffect } from 'react';
import { Controls } from './features/generator/components/Controls';
import { Preview } from './features/generator/components/Preview';
import { generateEsportsLogo, generateLogoCollection, generateCharacterSheet } from './features/generator/services/geminiService';
import { GeneratedImage, GeneratorStatus, LogoOptions } from './types';
import { Gamepad2, Key, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from './components/ui/Button';
import { LogoExtractor } from './features/extractor/components/LogoExtractor';
import { ApiKeyModal } from './components/ui/ApiKeyModal';
import { PromptEditor } from './features/generator/components/PromptEditor';

const App: React.FC = () => {
  const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
  const [currentImages, setCurrentImages] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<LogoOptions['model']>('gemini-2.5-flash-image');

  // API Key State
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  // apiKeySelected now depends on userApiKey presence (or we keep it synced)

  useEffect(() => {
    // Load key from storage on mount
    const stored = localStorage.getItem("GEMINI_API_KEY");
    if (stored) {
      setUserApiKey(stored);
      setApiKeySelected(true);
    }
  }, []);

  const handleOpenKeySelection = () => {
    // Open modal instead of window.aistudio
    setIsKeyModalOpen(true);
  };

  const handleSaveKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem("GEMINI_API_KEY", trimmed);
      setUserApiKey(trimmed);
      setApiKeySelected(true);
      setIsKeyModalOpen(false);
    }
  };

  const handleGenerate = async (options: LogoOptions | LogoOptions[]) => {
    if (selectedModel === 'gemini-3-pro-image-preview' && !apiKeySelected) {
      setErrorMessage("Por favor, conecte sua chave API Pro para usar este modelo.");
      setStatus(GeneratorStatus.ERROR);
      return;
    }

    setStatus(GeneratorStatus.LOADING);
    setCurrentImages([]);
    setErrorMessage(null);

    try {
      let newImages: GeneratedImage[] = [];

      if (Array.isArray(options)) {
        const firstOpt = options[0];
        const sheetUrl = await generateLogoCollection(options, userApiKey);

        newImages = [{
          id: crypto.randomUUID(),
          url: sheetUrl,
          prompt: `Coleção: ${options.map(o => o.subject).join(', ')}`,
          createdAt: Date.now(),
        }];
      } else {
        let imageUrl = "";
        if (options.mode === 'characterSheet') {
          imageUrl = await generateCharacterSheet(options, userApiKey);
        } else {
          imageUrl = await generateEsportsLogo(options, userApiKey);
        }

        newImages = [{
          id: crypto.randomUUID(),
          url: imageUrl,
          prompt: options.subject + (options.mode === 'characterSheet' ? ' (Sheet)' : ''),
          createdAt: Date.now(),
        }];
      }

      setCurrentImages(newImages);
      setHistory(prev => [...newImages, ...prev]);
      setStatus(GeneratorStatus.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Erro inesperado.");
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleSelectHistory = (img: GeneratedImage) => {
    setCurrentImages([img]);
    setStatus(GeneratorStatus.IDLE);
    setErrorMessage(null);
  };

  const [extractorImage, setExtractorImage] = useState<File | null>(null);

  const handleSendToExtractor = async (img: GeneratedImage) => {
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const file = new File([blob], `generated-logo-${img.id}.png`, { type: blob.type });
      setExtractorImage(file);
      setView('extractor');
    } catch (e) {
      console.error("Failed to transfer image:", e);
      setErrorMessage("Erro ao enviar imagem para o extrator.");
    }
  };

  const [view, setView] = useState<'generator' | 'extractor' | 'prompts'>('generator');

  return (
    <div className="min-h-screen bg-esport-black text-white font-sans selection:bg-esport-accent selection:text-esport-black">
      <header className="border-b border-gray-800 bg-esport-black/90 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-esport-accent to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,255,157,0.3)]">
              <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-widest leading-none">
                Nano<span className="text-esport-accent">Gamer</span>
              </h1>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider">AI LOGO LAB</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => setView('generator')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${view === 'generator' ? 'bg-esport-accent text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                Generator
              </button>
              <button
                onClick={() => setView('extractor')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${view === 'extractor' ? 'bg-esport-accent text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                Extractor
              </button>
              <button
                onClick={() => setView('prompts')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${view === 'prompts' ? 'bg-esport-accent text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                Prompts
              </button>
            </div>
            <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase flex items-center gap-2 ${apiKeySelected ? 'border-esport-accent text-esport-accent' : 'border-gray-700 text-gray-500'}`}>
              <ShieldCheck className="w-3 h-3" />
              {apiKeySelected ? 'Chave Conectada' : 'Chave Pendente'}
            </div>
            <button onClick={handleOpenKeySelection} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white" title="Configurar Chave API">
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          onSave={handleSaveKey}
          currentKey={userApiKey}
        />
        {view === 'generator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <Controls
                onGenerate={handleGenerate}
                isGenerating={status === GeneratorStatus.LOADING}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />

              {selectedModel === 'gemini-3-pro-image-preview' && !apiKeySelected && (
                <div className="mt-4 p-4 rounded-lg bg-orange-950/20 border border-orange-900/40 text-[10px] text-orange-200 animate-pulse">
                  <p className="font-bold flex items-center gap-2 mb-1">
                    <Info className="w-3 h-3" /> ATENÇÃO
                  </p>
                  O modelo Pro exige uma chave de API própria. Clique no ícone de chave acima para configurar.
                </div>
              )}
            </div>

            <div className="lg:col-span-8">
              <Preview
                status={status}
                currentImages={currentImages}
                history={history}
                onSelectImage={handleSelectHistory}
                errorMessage={errorMessage}
                onSendToExtractor={handleSendToExtractor}
              />
            </div>
          </div>
        ) : view === 'extractor' ? (
          <LogoExtractor initialFile={extractorImage} />
        ) : (
          <PromptEditor />
        )}
      </main>
    </div>
  );
};

export default App;
