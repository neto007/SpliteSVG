import React, { useState, useEffect } from 'react';
import { X, Key, Check, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
    const [key, setKey] = useState(currentKey);

    useEffect(() => {
        setKey(currentKey);
    }, [currentKey, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#151520] border border-gray-700 rounded-2xl shadow-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-esport-accent/10 rounded-full flex items-center justify-center mb-4 text-esport-accent">
                        <Key className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Configurar API Key</h2>
                    <p className="text-sm text-gray-400 mt-1 text-center">
                        Insira sua chave da API do Google Gemini para desbloquear recursos Pro.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Sua Chave API
                        </label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Cole sua chave aqui..."
                            className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-esport-accent focus:ring-1 focus:ring-esport-accent transition-all font-mono text-sm"
                        />
                    </div>

                    <button
                        onClick={() => onSave(key)}
                        className="w-full bg-esport-accent hover:bg-emerald-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    >
                        <Check className="w-4 h-4" />
                        Salvar Chave
                    </button>

                    <div className="text-center pt-2">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-esport-accent flex items-center justify-center gap-1 transition-colors"
                        >
                            Não tem uma chave? Gere aqui <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
