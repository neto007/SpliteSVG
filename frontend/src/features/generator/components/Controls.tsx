
import React, { useState, useRef } from 'react';
import { LogoOptions, CollectionItem, CollectionImportData } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Shield, Zap, Type, Circle, Palette, AlignLeft, User, LayoutGrid, FileText, Eraser, Plus, Trash2, Layers, ScanFace, PersonStanding, Component, Upload, Cpu, Sparkles, FileJson, Boxes, Sword, Binary, Chrome, PlayCircle, Ghost, Contact, Image as ImageIcon, X, Grid3X3, Move } from 'lucide-react';

interface ControlsProps {
  onGenerate: (options: LogoOptions | LogoOptions[]) => void;
  isGenerating: boolean;
  selectedModel: LogoOptions['model'];
  onModelChange: (model: LogoOptions['model']) => void;
}

export const Controls: React.FC<ControlsProps> = ({ onGenerate, isGenerating, selectedModel, onModelChange }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'collection' | 'characterSheet'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);
  const poseImageInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState('');
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState<LogoOptions['style']>('mascot');
  const [composition, setComposition] = useState<LogoOptions['composition']>('head');
  const [noBackground, setNoBackground] = useState(false);
  const [resolution, setResolution] = useState<LogoOptions['resolution']>('1K');

  const [singleDescription, setSingleDescription] = useState('');
  const [singleSubject, setSingleSubject] = useState('');

  // Character Sheet specific states
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [poseImage, setPoseImage] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<string>('2x2');
  const [customViews, setCustomViews] = useState<string[]>([
    'VISTA FRONTAL (NEUTRA)',
    'VISTA LATERAL (PERFIL)',
    'VISTA TRASEIRA (COSTAS)',
    'DETALHE / CLOSE-UP (ROSTO)'
  ]);
  const [newView, setNewView] = useState('');

  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([
    { id: '1', subject: '', description: '' },
    { id: '2', subject: '', description: '' }
  ]);

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePoseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPoseImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addCustomView = () => {
    if (newView.trim()) {
      setCustomViews([...customViews, newView.trim().toUpperCase()]);
      setNewView('');
    }
  };

  const removeCustomView = (index: number) => {
    setCustomViews(customViews.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as CollectionImportData;
        if (data.items && Array.isArray(data.items)) {
          const newItems = data.items.map(item => ({
            id: crypto.randomUUID(),
            subject: item.subject,
            description: item.description || ''
          }));
          setCollectionItems(newItems);
          if (data.theme) setTheme(data.theme);
          if (data.details) setDetails(data.details);
          if (data.style) setStyle(data.style);
          if (data.composition) setComposition(data.composition);
          if (data.noBackground !== undefined) setNoBackground(data.noBackground);
          setActiveTab('collection');
        }
      } catch (err) { alert("Erro ao ler o arquivo JSON."); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseOptions = {
      details,
      theme: theme || 'Cores vibrantes de eSports',
      style,
      composition: activeTab === 'characterSheet' ? 'body' : composition,
      noBackground,
      model: selectedModel,
      resolution: selectedModel === 'gemini-3-pro-image-preview' ? resolution : '1K',
      mode: activeTab,
      referenceImage: referenceImage || undefined,
      poseImage: poseImage || undefined,
      customViews: activeTab === 'characterSheet' ? customViews : undefined,
      gridSize: activeTab === 'characterSheet' ? gridSize : undefined
    };

    if (activeTab === 'single' || activeTab === 'characterSheet') {
      if (!singleSubject.trim() && !referenceImage && !poseImage) return;
      onGenerate({ ...baseOptions, subject: singleSubject || 'Character based on reference', description: singleDescription } as LogoOptions);
    } else {
      const validItems = collectionItems.filter(i => i.subject.trim() !== '');
      if (validItems.length === 0) return;
      onGenerate(validItems.map(item => ({ ...baseOptions, subject: item.subject, description: item.description })) as LogoOptions[]);
    }
  };

  return (
    <div className="bg-esport-dark p-6 rounded-xl border border-gray-800 shadow-2xl h-fit space-y-6">

      {/* Model Selector */}
      <div>
        <label className="text-[10px] font-bold text-esport-accent mb-2 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-3 h-3" /> Motor de IA
        </label>
        <div className="grid grid-cols-2 gap-2 bg-esport-black p-1 rounded-lg border border-gray-700">
          <button type="button" onClick={() => onModelChange('gemini-2.5-flash-image')} className={`flex items-center justify-center gap-2 py-2 rounded transition-all ${selectedModel === 'gemini-2.5-flash-image' ? 'bg-gray-800 text-white border border-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
            <Zap className={`w-3.5 h-3.5 ${selectedModel === 'gemini-2.5-flash-image' ? 'text-yellow-400' : ''}`} />
            <span className="text-[10px] font-bold uppercase">Flash (1K)</span>
          </button>
          <button type="button" onClick={() => onModelChange('gemini-3-pro-image-preview')} className={`flex items-center justify-center gap-2 py-2 rounded transition-all ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-esport-accent/10 text-esport-accent border border-esport-accent/30' : 'text-gray-500 hover:text-gray-300'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Pro (4K)</span>
          </button>
        </div>
      </div>

      {/* Resolution Selector for PRO model */}
      {selectedModel === 'gemini-3-pro-image-preview' && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Resolução Pro</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1K', '2K', '4K'] as const).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res)}
                className={`py-1.5 text-[10px] font-black rounded border transition-all ${resolution === res ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'
                  }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-esport-black p-1 rounded-lg border border-gray-700">
        <button onClick={() => setActiveTab('single')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'single' ? 'bg-esport-dark text-white' : 'text-gray-500'}`}>Logo</button>
        <button onClick={() => setActiveTab('collection')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-2 ${activeTab === 'collection' ? 'bg-esport-dark text-esport-accent' : 'text-gray-500'}`}><Layers className="w-3 h-3" /> Grade</button>
        <button onClick={() => setActiveTab('characterSheet')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-2 ${activeTab === 'characterSheet' ? 'bg-esport-dark text-esport-accent shadow-inner' : 'text-gray-500'}`}><Contact className="w-3 h-3" /> Model Sheet</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Universal Settings Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 mb-1 uppercase block tracking-widest">Estilo & Cores</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'mascot', icon: Zap, label: 'Mascote' },
              { id: 'minimalist', icon: Circle, label: 'Minimal' },
              { id: 'badge', icon: Shield, label: 'Brasão' },
              { id: 'cyber', icon: Binary, label: 'Cyber' },
              { id: 'fantasy', icon: Sword, label: 'Épico' },
              { id: 'glossy', icon: Chrome, label: 'Glossy' },
              { id: 'typography', icon: Type, label: 'Texto' },
              { id: 'monogram', icon: Boxes, label: 'Mono' }
            ].map(opt => (
              <button key={opt.id} type="button" onClick={() => setStyle(opt.id as any)} className={`flex flex-col items-center p-2 rounded-lg border transition-all ${style === opt.id ? 'bg-esport-accent/10 border-esport-accent text-white shadow-[0_0_10px_rgba(0,255,157,0.2)]' : 'bg-esport-black border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                <opt.icon className={`w-4 h-4 mb-1 ${style === opt.id ? 'text-esport-accent' : ''}`} />
                <span className="text-[8px] font-bold uppercase leading-none">{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 uppercase block">Tema de Cores</label>
              <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: Roxo Elétrico..." className="w-full bg-esport-black border border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-esport-accent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 uppercase block">Composição</label>
              <div className="flex gap-1 bg-esport-black p-1 rounded border border-gray-700">
                {(['head', 'body', 'symbol'] as const).map(comp => (
                  <button key={comp} type="button" disabled={activeTab === 'characterSheet'} onClick={() => setComposition(comp)} className={`flex-1 py-1 text-[8px] font-bold uppercase rounded ${composition === comp || (activeTab === 'characterSheet' && comp === 'body') ? 'bg-gray-800 text-white' : 'text-gray-500'} disabled:opacity-30`}>
                    {comp === 'head' ? 'Cab' : comp === 'body' ? 'Corp' : 'Simb'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab-specific Content */}
        {activeTab === 'characterSheet' ? (
          <div className="space-y-4 border-t border-gray-800 pt-4 animate-in fade-in slide-in-from-bottom-2">

            {/* Grid Size Selection */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Grid3X3 className="w-3 h-3" /> Layout da Grade
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['1x2', '2x2', '3x4', '4x3', '4x4'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setGridSize(size)}
                    className={`py-1.5 text-[9px] font-bold rounded border transition-all ${gridSize === size ? 'bg-esport-accent/20 border-esport-accent text-white' : 'bg-esport-black border-gray-800 text-gray-500 hover:border-gray-700'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Images Inputs */}
            <div className="grid grid-cols-2 gap-3">
              {/* Character Reference */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-esport-accent uppercase tracking-widest flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Design Base
                </label>
                {!referenceImage ? (
                  <button
                    type="button"
                    onClick={() => refImageInputRef.current?.click()}
                    className="w-full h-20 border border-dashed border-gray-800 rounded flex flex-col items-center justify-center text-gray-600 hover:border-esport-accent transition-all"
                  >
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[7px] font-bold uppercase">Logo/Identidade</span>
                  </button>
                ) : (
                  <div className="relative w-full h-20 rounded overflow-hidden border border-esport-accent">
                    <img src={referenceImage} alt="Ref" className="w-full h-full object-contain bg-black" />
                    <button onClick={() => setReferenceImage(null)} className="absolute top-1 right-1 p-0.5 bg-red-600 rounded-full hover:bg-red-700"><X className="w-2.5 h-2.5 text-white" /></button>
                  </div>
                )}
                <input type="file" ref={refImageInputRef} onChange={handleRefImageUpload} accept="image/*" className="hidden" />
              </div>

              {/* Pose Reference */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-esport-secondary uppercase tracking-widest flex items-center gap-1">
                  <Move className="w-3 h-3" /> Ref. de Pose
                </label>
                {!poseImage ? (
                  <button
                    type="button"
                    onClick={() => poseImageInputRef.current?.click()}
                    className="w-full h-20 border border-dashed border-gray-800 rounded flex flex-col items-center justify-center text-gray-600 hover:border-esport-secondary transition-all"
                  >
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[7px] font-bold uppercase">Postura/Ação</span>
                  </button>
                ) : (
                  <div className="relative w-full h-20 rounded overflow-hidden border border-esport-secondary">
                    <img src={poseImage} alt="Pose" className="w-full h-full object-contain bg-black" />
                    <button onClick={() => setPoseImage(null)} className="absolute top-1 right-1 p-0.5 bg-red-600 rounded-full hover:bg-red-700"><X className="w-2.5 h-2.5 text-white" /></button>
                  </div>
                )}
                <input type="file" ref={poseImageInputRef} onChange={handlePoseImageUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* Custom Views Manager */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>Vistas do Turnaround</span>
                <span className="text-esport-accent">{customViews.length} Painéis</span>
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {customViews.map((view, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-esport-black border border-gray-800 rounded text-[8px] font-bold text-gray-400">
                    {view}
                    <button type="button" onClick={() => removeCustomView(idx)} className="hover:text-red-500"><X className="w-2 h-2" /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newView}
                  onChange={e => setNewView(e.target.value)}
                  placeholder="Nova vista (ex: Pulo)"
                  className="flex-1 bg-esport-black border border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-esport-accent"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomView())}
                />
                <button type="button" onClick={addCustomView} className="p-1.5 bg-gray-800 rounded border border-gray-700 text-esport-accent hover:bg-esport-accent hover:text-black"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-widest">Descrição do Personagem</label>
              <input
                type="text"
                value={singleSubject}
                onChange={e => setSingleSubject(e.target.value)}
                placeholder="Ex: Ninja Cibernético de Elite"
                className="w-full bg-esport-black border border-gray-700 rounded p-3 text-sm font-bold outline-none focus:border-esport-accent"
              />
            </div>
          </div>
        ) : activeTab === 'single' ? (
          <div className="space-y-3">
            <input type="text" value={singleSubject} onChange={e => setSingleSubject(e.target.value)} placeholder="Elemento Principal (ex: Cyber Knight)" className="w-full bg-esport-black border border-gray-700 rounded p-3 text-sm font-bold outline-none focus:border-esport-accent" required />
            <input type="text" value={singleDescription} onChange={e => setSingleDescription(e.target.value)} placeholder="Texto na Logo (ex: NOME DO TIME)" className="w-full bg-esport-black border border-gray-700 rounded p-2 text-xs outline-none focus:border-gray-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Itens da Coleção</label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-[10px] font-bold text-esport-accent hover:text-white transition-colors uppercase"><FileJson className="w-3 h-3" /> Importar JSON</button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
            </div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
              {collectionItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-center bg-esport-black p-2 rounded border border-gray-800 group">
                  <span className="text-[9px] text-gray-600 font-bold w-4">{idx + 1}</span>
                  <input type="text" value={item.subject} onChange={e => setCollectionItems(collectionItems.map(i => i.id === item.id ? { ...i, subject: e.target.value } : i))} placeholder="Elemento (ex: Ninja)" className="flex-1 bg-transparent border-none text-xs outline-none focus:text-esport-accent font-bold" />
                  <button type="button" onClick={() => setCollectionItems(collectionItems.filter(i => i.id !== item.id))} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setCollectionItems([...collectionItems, { id: crypto.randomUUID(), subject: '', description: '' }])} className="w-full py-2 text-[9px] font-bold uppercase text-gray-500 border border-dashed border-gray-700 rounded hover:border-esport-accent hover:text-esport-accent transition-all"><Plus className="w-3 h-3 inline mr-1" /> Adicionar Item</button>
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isGenerating} className="w-full">
          {activeTab === 'single' ? 'Gerar Logo' : activeTab === 'collection' ? 'Gerar Grade de Logos' : 'Gerar Model Sheet (4K)'}
        </Button>
      </form>
    </div>
  );
};
