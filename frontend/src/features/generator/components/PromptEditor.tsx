import React, { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, PenTool, CheckCircle2, Download, Upload, Trash2, Plus } from 'lucide-react';
import { getStylePrompts, saveStylePrompt, resetStylePrompts, deleteStylePrompt, DEFAULT_STYLES } from '../services/promptService';

export const PromptEditor: React.FC = () => {
    const [styles, setStyles] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New Style State
    const [newStyleName, setNewStyleName] = useState('');
    const [newStylePrompt, setNewStylePrompt] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setStyles(getStylePrompts());
    }, []);

    const handleChange = (key: string, value: string) => {
        setStyles(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = (key: string) => {
        saveStylePrompt(key, styles[key]);
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
    };

    const handleReset = () => {
        if (confirm("Tem certeza que deseja restaurar todos os prompts para o padrão?")) {
            const defaults = resetStylePrompts();
            setStyles(defaults);
        }
    };

    const handleAddStyle = (e: React.FormEvent) => {
        e.preventDefault();
        const key = newStyleName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!key || !newStylePrompt.trim()) return;

        if (styles[key]) {
            alert("Já existe um estilo com esse nome!");
            return;
        }

        const updated = saveStylePrompt(key, newStylePrompt);
        setStyles(updated);
        setNewStyleName('');
        setNewStylePrompt('');
        setIsCreating(false);
    };

    const handleDelete = (key: string) => {
        if (DEFAULT_STYLES[key]) {
            alert("Não é possível deletar estilos padrão do sistema.");
            return;
        }
        if (confirm(`Tem certeza que deseja deletar o estilo "${key}"?`)) {
            const updated = deleteStylePrompt(key);
            setStyles(updated);
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(styles, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "splitesvg-prompts.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedStyles = JSON.parse(content);
                // Validate keys
                const validKeys = Object.keys(DEFAULT_STYLES);
                const merged = { ...DEFAULT_STYLES };
                let count = 0;

                Object.keys(importedStyles).forEach(key => {
                    if (validKeys.includes(key) && typeof importedStyles[key] === 'string') {
                        merged[key] = importedStyles[key];
                        saveStylePrompt(key, importedStyles[key]);
                        count++;
                    }
                });

                setStyles(merged);
                alert(`${count} prompts importados com sucesso!`);
            } catch (err) {
                alert("Erro ao ler arquivo JSON. Verifique o formato.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f] text-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-esport-accent/10 rounded-xl flex items-center justify-center border border-esport-accent/20">
                        <PenTool className="w-6 h-6 text-esport-accent" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-display uppercase tracking-wider">Editor de Prompts</h1>
                        <p className="text-gray-500 text-sm">Personalize os prompts usados para cada estilo de logo.</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all text-xs font-bold uppercase tracking-widest ${isCreating ? 'bg-esport-accent text-black border-esport-accent' : 'bg-gray-800 text-white border-gray-700 hover:border-white'}`}
                    >
                        <Plus className="w-4 h-4" /> Novo Estilo
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        className="hidden"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all" title="Importar JSON">
                        <Upload className="w-4 h-4" />
                    </button>
                    <button onClick={handleExport} className="p-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all" title="Backup (Exportar)">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={handleReset} className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all" title="Restaurar Padrões">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Create New Style Form */}
            {isCreating && (
                <form onSubmit={handleAddStyle} className="mb-8 bg-gray-900/50 border border-esport-accent/30 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-esport-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Novo Estilo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome do Estilo (ID)</label>
                            <input
                                type="text"
                                value={newStyleName}
                                onChange={e => setNewStyleName(e.target.value)}
                                placeholder="ex: pixel-art"
                                className="w-full bg-[#050508] border border-gray-700 rounded-lg p-3 text-sm focus:border-esport-accent outline-none font-mono"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Prompt do Sistema</label>
                            <input
                                type="text"
                                value={newStylePrompt}
                                onChange={e => setNewStylePrompt(e.target.value)}
                                placeholder="ex: 8-bit retro pixel art style, arcade game aesthetic..."
                                className="w-full bg-[#050508] border border-gray-700 rounded-lg p-3 text-sm focus:border-esport-accent outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-xs font-bold uppercase text-gray-500 hover:text-white">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-esport-accent text-black rounded-lg text-xs font-bold uppercase hover:bg-esport-accent/90">Salvar Estilo</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
                {Object.keys(styles).map(key => (
                    <div key={key} className="bg-esport-dark border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group relative">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-esport-accent font-bold uppercase tracking-widest text-sm bg-esport-accent/5 px-2 py-1 rounded">
                                    {key}
                                </span>
                                {!DEFAULT_STYLES[key] && (
                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Custom</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {styles[key] !== DEFAULT_STYLES[key] && !!DEFAULT_STYLES[key] && (
                                    <span className="text-[10px] text-gray-500 font-mono">* Editado</span>
                                )}
                                {!DEFAULT_STYLES[key] && (
                                    <button
                                        onClick={() => handleDelete(key)}
                                        className="text-gray-600 hover:text-red-500 transition-colors p-1"
                                        title="Excluir Estilo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <textarea
                            value={styles[key] || ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full h-32 bg-[#050508] border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:text-white focus:border-esport-accent focus:outline-none transition-all resize-none font-mono leading-relaxed"
                            placeholder={`Prompt para estilo ${key}...`}
                        />

                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={() => handleSave(key)}
                                className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                    ${saved === key
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-gray-800 text-gray-400 hover:bg-esport-accent hover:text-black hover:border-esport-accent border border-gray-700'}
                                `}
                            >
                                {saved === key ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3" /> Salvo
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3 h-3" /> Salvar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
