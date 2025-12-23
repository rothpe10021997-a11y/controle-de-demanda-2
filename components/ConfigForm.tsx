
import React, { useState } from 'react';
import { ModelConfig, ProductionState, Theme } from '../types';

interface Props {
  onStart: (daysT1: number, daysT2: number, h1: number, h2: number, models: ModelConfig[]) => void;
  onImport: (state: ProductionState) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const ConfigForm: React.FC<Props> = ({ onStart, onImport, theme, onThemeChange }) => {
  const [daysT1, setDaysT1] = useState(5);
  const [daysT2, setDaysT2] = useState(3);
  const [h1, setH1] = useState(8);
  const [h2, setH2] = useState(8);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  
  const [models, setModels] = useState<ModelConfig[]>([
    { id: '1', name: 'Modelo A', plannedTargetPerHour: 100 },
    { id: '2', name: 'Modelo B', plannedTargetPerHour: 80 },
    { id: '3', name: 'Modelo C', plannedTargetPerHour: 120 },
    { id: '4', name: 'Modelo D', plannedTargetPerHour: 60 },
    { id: '5', name: 'Modelo E', plannedTargetPerHour: 150 },
  ]);

  const updateModelTarget = (id: string, target: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, plannedTargetPerHour: target } : m));
  };

  const updateModelName = (id: string, name: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(daysT1, daysT2, h1, h2, models);
  };

  const handleQuickImport = () => {
    try {
      const parsed = JSON.parse(importText);
      onImport(parsed);
    } catch (e) {
      alert("Erro ao importar.");
    }
  };

  const themeClasses = {
    dark: { bg: "bg-slate-900", card: "bg-slate-800 border-slate-700", input: "bg-slate-700 border-slate-600 text-white", text: "text-slate-100", label: "text-slate-500" },
    light: { bg: "bg-gray-100", card: "bg-white border-gray-200", input: "bg-gray-50 border-gray-300 text-gray-900", text: "text-gray-900", label: "text-gray-500" },
    cyber: { bg: "bg-black", card: "bg-black border-green-900", input: "bg-black border-green-900 text-green-400", text: "text-green-400", label: "text-green-900" },
    industrial: { bg: "bg-zinc-950", card: "bg-zinc-900 border-zinc-800", input: "bg-zinc-800 border-zinc-700 text-amber-500", text: "text-zinc-200", label: "text-zinc-600" },
    eco: { bg: "bg-[#022c22]", card: "bg-[#064e3b] border-emerald-900/50 shadow-[0_10px_40px_rgba(0,0,0,0.3)]", input: "bg-[#022c22] border-emerald-900 text-emerald-400", text: "text-emerald-50", label: "text-emerald-900" }
  };

  const c = themeClasses[theme];

  if (showImport) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${c.bg}`}>
        <div className={`p-8 rounded-xl shadow-2xl w-full max-w-xl border ${c.card}`}>
          <h2 className={`text-xl font-black mb-6 uppercase tracking-tighter ${
            theme === 'cyber' ? 'text-green-500' : 
            theme === 'industrial' ? 'text-amber-500' : 
            theme === 'eco' ? 'text-emerald-400' : 'text-purple-400'
          }`}>Importação Rápida</h2>
          <textarea 
            className={`w-full h-64 border rounded-lg p-3 text-xs font-mono mb-4 outline-none ${c.input}`}
            placeholder="Cole o JSON aqui..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex gap-4">
            <button onClick={() => setShowImport(false)} className={`flex-1 px-4 py-3 rounded-lg font-bold ${theme === 'light' ? 'bg-gray-200 text-gray-700' : 'bg-slate-700 text-white'}`}>Voltar</button>
            <button onClick={handleQuickImport} className={`flex-1 px-4 py-3 rounded-lg font-bold ${
              theme === 'cyber' ? 'bg-green-600 text-black' : 
              theme === 'industrial' ? 'bg-amber-600 text-black' : 
              theme === 'eco' ? 'bg-emerald-500 text-emerald-950' : 'bg-purple-600 text-white'
            }`}>Carregar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300 ${c.bg}`}>
      <div className={`p-8 rounded-xl shadow-2xl w-full max-w-2xl border animate-in fade-in zoom-in duration-500 ${c.card}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`${theme === 'industrial' ? 'bg-amber-500/10' : theme === 'eco' ? 'bg-emerald-400/10' : 'bg-blue-600/20'} p-2 rounded-lg`}>
               <i className={`fas ${theme === 'eco' ? 'fa-leaf' : 'fa-industry'} ${
                 theme === 'cyber' ? 'text-green-500' : 
                 theme === 'industrial' ? 'text-amber-500' : 
                 theme === 'eco' ? 'text-emerald-400' : 'text-blue-500'
               }`}></i>
            </div>
            <div>
              <h2 className={`text-2xl font-black uppercase tracking-tighter ${
                theme === 'cyber' ? 'text-green-500' : 
                theme === 'industrial' ? 'text-amber-500' :
                theme === 'eco' ? 'text-emerald-400' :
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>Setup de Produção</h2>
              <p className={`${c.label} text-[10px] font-bold uppercase mt-1`}>Foco em Eficiência e Sustentabilidade</p>
            </div>
          </div>
          <div className="flex gap-2">
             <div className="flex p-1 rounded-lg border bg-black/10">
                <button onClick={() => onThemeChange('dark')} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Dark"><i className="fas fa-moon text-[10px]"></i></button>
                <button onClick={() => onThemeChange('light')} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${theme === 'light' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Light"><i className="fas fa-sun text-[10px]"></i></button>
                <button onClick={() => onThemeChange('cyber')} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${theme === 'cyber' ? 'bg-green-600 text-black' : 'text-slate-500'}`} title="Cyber"><i className="fas fa-terminal text-[10px]"></i></button>
                <button onClick={() => onThemeChange('industrial')} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${theme === 'industrial' ? 'bg-amber-600 text-black' : 'text-slate-500'}`} title="Industrial"><i className="fas fa-screwdriver-wrench text-[10px]"></i></button>
                <button onClick={() => onThemeChange('eco')} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${theme === 'eco' ? 'bg-emerald-500 text-emerald-950' : 'text-emerald-800'}`} title="Eco-Pulse"><i className="fas fa-leaf text-[10px]"></i></button>
             </div>
             <button onClick={() => setShowImport(true)} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition uppercase ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-slate-700 text-slate-300'}`}>
              Importar
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-100' : theme === 'industrial' ? 'bg-zinc-800/50 border-zinc-700' : theme === 'eco' ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-slate-900/50 border-slate-700/50'}`}>
            <div className="space-y-4">
              <p className={`${theme === 'cyber' ? 'text-green-500' : theme === 'industrial' ? 'text-amber-500' : theme === 'eco' ? 'text-emerald-400' : 'text-blue-400'} text-[10px] font-black uppercase tracking-widest border-l-2 ${theme === 'cyber' ? 'border-green-500' : theme === 'industrial' ? 'border-amber-500' : theme === 'eco' ? 'border-emerald-500' : 'border-blue-500'} pl-2`}>Turno Dia (T1)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`${c.label} text-[9px] font-black uppercase mb-1`}>Dias</label>
                  <input type="number" value={daysT1} onChange={(e) => setDaysT1(Number(e.target.value))} className={`w-full rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 ${c.input}`} />
                </div>
                <div>
                  <label className={`${c.label} text-[9px] font-black uppercase mb-1`}>Horas/Dia</label>
                  <input type="number" value={h1} onChange={(e) => setH1(Number(e.target.value))} className={`w-full rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 ${c.input}`} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className={`${theme === 'cyber' ? 'text-green-900' : theme === 'industrial' ? 'text-zinc-600' : theme === 'eco' ? 'text-emerald-800' : 'text-purple-400'} text-[10px] font-black uppercase tracking-widest border-l-2 ${theme === 'cyber' ? 'border-green-900' : theme === 'industrial' ? 'border-zinc-700' : theme === 'eco' ? 'border-emerald-800' : 'border-purple-500'} pl-2`}>Turno Noite (T2)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`${c.label} text-[9px] font-black uppercase mb-1`}>Dias</label>
                  <input type="number" value={daysT2} onChange={(e) => setDaysT2(Number(e.target.value))} className={`w-full rounded p-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 ${c.input}`} />
                </div>
                <div>
                  <label className={`${c.label} text-[9px] font-black uppercase mb-1`}>Horas/Dia</label>
                  <input type="number" value={h2} onChange={(e) => setH2(Number(e.target.value))} className={`w-full rounded p-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 ${c.input}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`${c.text} font-black text-xs border-b ${theme === 'light' ? 'border-gray-100' : 'border-slate-700'} pb-2 uppercase tracking-widest flex justify-between`}>
              <span>Grade de SKUs</span>
              <span className="opacity-40 text-[9px]">Unid/Hora</span>
            </h3>
            {models.map(model => (
              <div key={model.id} className="grid grid-cols-3 gap-3 items-center">
                <input 
                  type="text" 
                  value={model.name} 
                  onChange={(e) => updateModelName(model.id, e.target.value)}
                  className={`col-span-2 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none ${c.input}`}
                />
                <input 
                  type="number" 
                  value={model.plannedTargetPerHour} 
                  onChange={(e) => updateModelTarget(model.id, Number(e.target.value))}
                  className={`w-full rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-right ${c.input}`}
                />
              </div>
            ))}
          </div>

          <button 
            type="submit"
            className={`w-full font-black py-4 rounded-xl transition-all shadow-lg uppercase tracking-widest mt-4 ${
              theme === 'cyber' ? 'bg-green-600 text-black hover:bg-green-500' : 
              theme === 'industrial' ? 'bg-amber-600 text-black hover:bg-amber-500' : 
              theme === 'eco' ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' :
              'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            Sincronizar Grade Operacional
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigForm;
