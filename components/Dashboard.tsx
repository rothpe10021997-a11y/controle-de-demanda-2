
import React, { useState, useEffect } from 'react';
import { ProductionState, ModelMetrics, AlertStatus, Theme, ModelConfig } from '../types';

interface Props {
  state: ProductionState;
  metrics: ModelMetrics[];
  totalHours: number;
  remainingHours: number;
  onLog: (day: number, shift: 1 | 2, hour: number, logs: Record<string, number>) => void;
  onUpdateSelection: (day: number, shift: 1 | 2, hour: number) => void;
  onUpdateModel: (modelId: string, updates: Partial<ModelConfig>) => void;
  onUpdateTime: (updates: { daysShift1?: number; daysShift2?: number; hoursShift1?: number; hoursShift2?: number }) => void;
  theme: Theme;
}

const Dashboard: React.FC<Props> = ({ state, metrics, totalHours, remainingHours, onLog, onUpdateSelection, onUpdateModel, onUpdateTime, theme }) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [tempDemand, setTempDemand] = useState<string>('');
  const [tempExtra, setTempExtra] = useState<string>('');
  const [showTimeConfig, setShowTimeConfig] = useState(false);

  useEffect(() => {
    const existingData = state.productionData[state.selectedDay]?.[state.selectedShift === 1 ? 'shift1' : 'shift2']?.[state.selectedHour];
    const newInputs: Record<string, string> = {};
    state.models.forEach(m => {
      newInputs[m.id] = existingData ? (existingData[m.id]?.toString() || '') : '';
    });
    setInputValues(newInputs);
  }, [state.selectedDay, state.selectedShift, state.selectedHour, state.productionData, state.models]);

  const handleInputChange = (modelId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [modelId]: value }));
  };

  const handleLaunch = () => {
    const hourLogs: Record<string, number> = {};
    let valid = true;
    state.models.forEach(m => {
      const val = parseInt(inputValues[m.id]);
      if (isNaN(val) || val < 0) valid = false;
      hourLogs[m.id] = val;
    });
    if (!valid) { alert("Valores inválidos detectados."); return; }
    
    onLog(state.selectedDay, state.selectedShift, state.selectedHour, hourLogs);
    
    let nextHour = state.selectedHour + 1;
    let nextShift = state.selectedShift;
    let nextDay = state.selectedDay;
    const currentShiftLimit = state.selectedShift === 1 ? state.hoursShift1 : state.hoursShift2;
    
    if (nextHour > currentShiftLimit) {
      nextHour = 1;
      if (nextShift === 1 && nextDay <= state.daysShift2) {
        nextShift = 2;
      } else {
        nextShift = 1;
        nextDay++;
      }
    }
    const finalMaxDay = nextShift === 1 ? state.daysShift1 : state.daysShift2;
    if (nextDay <= finalMaxDay) {
      onUpdateSelection(nextDay, nextShift as 1 | 2, nextHour);
    }
  };

  const openAdjustmentModal = (metric: ModelMetrics) => {
    const model = state.models.find(m => m.id === metric.id);
    setEditingModelId(metric.id);
    setTempDemand(metric.totalDemand.toString());
    setTempExtra((model?.extraProduction || 0).toString());
  };

  const saveAdjustments = () => {
    if (editingModelId) {
      const newDemand = parseInt(tempDemand);
      const newExtra = parseInt(tempExtra);
      onUpdateModel(editingModelId, { 
        manualTotalDemand: !isNaN(newDemand) ? newDemand : undefined,
        extraProduction: !isNaN(newExtra) ? newExtra : 0
      });
      setEditingModelId(null);
    }
  };

  const getThemeColors = () => {
    switch(theme) {
      case 'eco': return { accent: 'emerald-400', bg: 'bg-[#064e3b]/40', border: 'border-emerald-800/40', text: 'text-emerald-400', btn: 'bg-emerald-500' };
      case 'industrial': return { accent: 'amber-500', bg: 'bg-zinc-900/60', border: 'border-zinc-800/60', text: 'text-amber-500', btn: 'bg-amber-600' };
      case 'cyber': return { accent: 'green-500', bg: 'bg-black', border: 'border-green-900/40', text: 'text-green-500', btn: 'bg-green-600' };
      case 'light': return { accent: 'blue-600', bg: 'bg-white', border: 'border-gray-200', text: 'text-blue-600', btn: 'bg-blue-600' };
      default: return { accent: 'blue-500', bg: 'bg-slate-900/40', border: 'border-slate-800/60', text: 'text-blue-400', btn: 'bg-blue-600' };
    }
  };

  const tc = getThemeColors();
  const criticalCount = metrics.filter(m => m.status === AlertStatus.CRITICAL).length;
  const globalProgress = ( (totalHours - remainingHours) / totalHours ) * 100;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* 1. TOPO: KPIs ESTRATÉGICOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-4 flex flex-col justify-center items-center text-white shadow-xl transition-all ${criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Status Geral</p>
          <h2 className="text-xl font-black uppercase tracking-tighter">
            {criticalCount > 0 ? 'Crítico' : 'Estável'}
          </h2>
        </div>

        <div className={`${tc.bg} border ${tc.border} rounded-2xl p-4 flex flex-col items-center justify-center shadow-md`}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Janela Runway</p>
          <h2 className="text-2xl font-black tabular-nums">{remainingHours.toFixed(1)}h</h2>
        </div>

        <div className={`${tc.bg} border ${tc.border} rounded-2xl p-4 flex flex-col items-center justify-center shadow-md`}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Forecast Global</p>
          <h2 className="text-2xl font-black tabular-nums">{globalProgress.toFixed(1)}%</h2>
        </div>

        <div className={`${tc.bg} border ${tc.border} rounded-2xl p-4 flex flex-col items-center justify-center shadow-md`}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Produção Real</p>
          <h2 className="text-2xl font-black tabular-nums">{metrics.reduce((a, b) => a + b.completed, 0).toLocaleString()}</h2>
        </div>
      </div>

      {/* 2. CENTRO: MONITORAMENTO DE PERFORMANCE (LISTA VERTICAL) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
            <div className={`w-1.5 h-4 ${tc.btn} rounded-full`}></div>
            Monitoramento de Performance
          </h3>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Lista de SKUs Ativos</p>
        </div>

        <div className="flex flex-col gap-3">
          {metrics.map(metric => {
            const isCritical = metric.status === AlertStatus.CRITICAL;
            const isWarning = metric.status === AlertStatus.WARNING;
            
            return (
              <div 
                key={metric.id} 
                className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border-2 transition-all hover:translate-x-1 ${
                  isCritical ? 'bg-red-950/20 border-red-500/50' : 
                  isWarning ? 'bg-amber-950/20 border-amber-500/50' : 
                  `${tc.bg} border-white/5`
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="lg:w-1/4 min-w-0">
                    <h4 className="text-xl font-black uppercase tracking-tighter text-white truncate mb-1">{metric.name}</h4>
                    <div className="flex gap-2">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                         isCritical ? 'bg-red-600 text-white' : 
                         isWarning ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'
                       }`}>
                         {metric.status}
                       </span>
                       <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest self-center">
                         Produzido: {metric.completed.toLocaleString()} / {metric.totalDemand.toLocaleString()}
                       </span>
                       {metric.extraCompleted > 0 && (
                         <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                           Extra: {metric.extraCompleted}
                         </span>
                       )}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-30 mb-1 tracking-widest">Ritmo Real (SES)</p>
                      <p className="text-2xl font-black text-white">{metric.sesRate.toFixed(1)}<span className="text-[10px] ml-1 opacity-40">u/h</span></p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-30 mb-1 tracking-widest">Meta Requerida</p>
                      <p className={`text-2xl font-black ${isCritical ? 'text-red-500' : 'text-white'}`}>{metric.requiredTargetPerHour.toFixed(1)}<span className="text-[10px] ml-1 opacity-40">u/h</span></p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-30 mb-1 tracking-widest">Gap Janela</p>
                      <p className={`text-2xl font-black ${metric.estimatedHoursGap > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                        {metric.estimatedHoursGap > 0 ? `+${metric.estimatedHoursGap.toFixed(1)}h` : 'ESTÁVEL'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-30 mb-1 tracking-widest">Concluído</p>
                      <p className="text-2xl font-black text-white">{Math.round((metric.completed / metric.totalDemand) * 100)}%</p>
                    </div>
                  </div>

                  <div className="lg:w-1/5 space-y-3">
                    <div className="h-3 bg-black/40 rounded-full border border-white/5 relative overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${metric.isViable ? 'bg-emerald-500' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(100, (metric.completed / metric.totalDemand) * 100)}%` }}
                      ></div>
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white/40 z-10"
                        style={{ left: `${globalProgress}%` }}
                      ></div>
                    </div>
                    <button 
                      onClick={() => openAdjustmentModal(metric)}
                      className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                    >
                      <i className="fas fa-sliders-h text-[8px]"></i> Ajustar Plano / Extra
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. RODAPÉ: TERMINAL DE LANÇAMENTO */}
      <div className={`${tc.bg} border ${tc.border} rounded-3xl p-8 shadow-xl mt-4 relative overflow-hidden`}>
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="lg:w-1/4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fas fa-terminal opacity-30"></i> Console Operacional
              </h3>
              <button 
                onClick={() => setShowTimeConfig(!showTimeConfig)}
                className={`p-2 rounded-lg transition-all ${showTimeConfig ? `${tc.btn} text-white` : 'bg-white/5 opacity-40 hover:opacity-100'}`}
                title="Configurar Grade de Dias/Horas"
              >
                <i className="fas fa-cog text-xs"></i>
              </button>
            </div>
            
            {showTimeConfig ? (
              <div className="space-y-4 animate-in slide-in-from-left-2 duration-300 bg-black/30 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Parametrização de Ciclo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold opacity-30 uppercase">Dias T1</label>
                    <input type="number" value={state.daysShift1} onChange={(e) => onUpdateTime({ daysShift1: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded h-8 text-center text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold opacity-30 uppercase">Horas T1</label>
                    <input type="number" value={state.hoursShift1} onChange={(e) => onUpdateTime({ hoursShift1: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded h-8 text-center text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold opacity-30 uppercase">Dias T2</label>
                    <input type="number" value={state.daysShift2} onChange={(e) => onUpdateTime({ daysShift2: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded h-8 text-center text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold opacity-30 uppercase">Horas T2</label>
                    <input type="number" value={state.hoursShift2} onChange={(e) => onUpdateTime({ hoursShift2: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded h-8 text-center text-xs outline-none" />
                  </div>
                </div>
                <button onClick={() => setShowTimeConfig(false)} className="w-full py-1.5 bg-white/5 rounded text-[8px] font-black uppercase mt-2">Salvar Parâmetros</button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                    <label className="text-[9px] font-black uppercase opacity-40 tracking-widest block mb-1">Turno</label>
                    <select 
                      value={state.selectedShift} 
                      onChange={(e) => onUpdateSelection(state.selectedDay, parseInt(e.target.value) as 1 | 2, state.selectedHour)}
                      className="w-full h-10 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-black px-3 outline-none focus:border-white/30"
                    >
                      <option value={1}>Turno 1</option>
                      <option value={2}>Turno 2</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="text-[9px] font-black uppercase opacity-40 tracking-widest block mb-1">Dia</label>
                      <select 
                        value={state.selectedDay} 
                        onChange={(e) => onUpdateSelection(parseInt(e.target.value), state.selectedShift, state.selectedHour)}
                        className="w-full h-10 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-black px-3 outline-none focus:border-white/30"
                      >
                        {Array.from({length: state.selectedShift === 1 ? state.daysShift1 : state.daysShift2}, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Dia {d}</option>
                        ))}
                      </select>
                  </div>
                  <div>
                      <label className="text-[9px] font-black uppercase opacity-40 tracking-widest block mb-1">Hora</label>
                      <select 
                        value={state.selectedHour} 
                        onChange={(e) => onUpdateSelection(state.selectedDay, state.selectedShift, parseInt(e.target.value))}
                        className="w-full h-10 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-black px-3 outline-none focus:border-white/30"
                      >
                        {Array.from({length: state.selectedShift === 1 ? state.hoursShift1 : state.hoursShift2}, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}ª Hora</option>
                        ))}
                      </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
              {state.models.map(model => (
                <div key={model.id} className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                  <p className="text-[8px] font-black uppercase truncate opacity-50 tracking-tighter">{model.name}</p>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={inputValues[model.id] || ''} 
                    onChange={(e) => handleInputChange(model.id, e.target.value)} 
                    className="w-full h-8 rounded-lg bg-black/50 border border-white/5 focus:border-white/40 text-center font-mono text-base font-black outline-none transition-all text-white"
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={handleLaunch} 
              className={`w-full py-5 rounded-2xl ${tc.btn} text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3`}
            >
              <i className="fas fa-check-circle text-sm"></i> Validar Lançamento {state.selectedHour}h
            </button>
          </div>
        </div>
      </div>

      {/* MODAL UNIFICADO DE AJUSTE (DEMANDA + EXTRA) */}
      {editingModelId && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className={`${tc.bg} border ${tc.border} p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl`}>
            <div className="text-center mb-8">
               <h4 className="text-xl font-black uppercase tracking-tighter">Gestão de Volume</h4>
               <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em] mt-2">SKU: {state.models.find(m => m.id === editingModelId)?.name}</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase opacity-40 mb-2 block text-center">Demanda Total do Ciclo</label>
                <input 
                  type="number" 
                  autoFocus
                  value={tempDemand} 
                  onChange={e => setTempDemand(e.target.value)} 
                  className="w-full h-16 rounded-xl bg-black/60 text-center text-3xl font-black outline-none border-2 border-white/5 focus:border-white/20 transition-all text-white" 
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="text-[9px] font-black uppercase opacity-40 mb-2 block text-center text-blue-400">Produção Extra / Rework</label>
                <input 
                  type="number" 
                  value={tempExtra} 
                  onChange={e => setTempExtra(e.target.value)} 
                  className="w-full h-16 rounded-xl bg-black/60 text-center text-3xl font-black outline-none border-2 border-blue-900/20 focus:border-blue-500/40 transition-all text-blue-400" 
                />
                <p className="text-[8px] opacity-30 mt-2 text-center uppercase font-bold italic">Soma-se ao realizado sem afetar médias horárias</p>
              </div>

              <div className="flex gap-4 mt-8">
                 <button onClick={() => setEditingModelId(null)} className="flex-1 bg-white/5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                 <button onClick={saveAdjustments} className={`flex-1 ${tc.btn} text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg`}>Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
