
import React, { useMemo } from 'react';
import { ProductionState, DayProduction, Theme } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface Props {
  state: ProductionState;
  theme: Theme;
}

const HourlyHistory: React.FC<Props> = ({ state, theme }) => {
  const historyItems = useMemo(() => {
    const items: any[] = [];
    Object.entries(state.productionData).forEach(([dayKey, dayData]) => {
      const day = parseInt(dayKey);
      const typedDayData = dayData as DayProduction;
      
      Object.entries(typedDayData.shift1).forEach(([hourKey, logs]) => {
        items.push({ day, shift: 1, hour: parseInt(hourKey), logs });
      });

      Object.entries(typedDayData.shift2).forEach(([hourKey, logs]) => {
        items.push({ day, shift: 2, hour: parseInt(hourKey), logs });
      });
    });

    return items.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      if (a.shift !== b.shift) return a.shift - b.shift;
      return a.hour - b.hour;
    });
  }, [state.productionData]);

  // Cálculo de ociosidade (horas com produção zero)
  const zeroProductionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    state.models.forEach(model => {
      stats[model.id] = historyItems.filter(item => (item.logs[model.id] || 0) === 0).length;
    });
    return stats;
  }, [historyItems, state.models]);

  const chartData = useMemo(() => {
    return historyItems.map((item, idx) => {
      const entry: any = {
        timeLabel: `D${item.day}-T${item.shift}-H${item.hour}`,
        index: idx
      };
      state.models.forEach(model => {
        const prod = item.logs[model.id] || 0;
        const efficiency = (prod / Math.max(1, model.plannedTargetPerHour)) * 100;
        entry[model.name] = parseFloat(efficiency.toFixed(1));
      });
      return entry;
    });
  }, [historyItems, state.models]);

  const themeClasses = {
    dark: { card: "bg-slate-800 border-slate-700", header: "bg-slate-800/50 border-slate-700", tableHeader: "bg-slate-900 text-slate-500 border-slate-700", row: "border-slate-700/50 hover:bg-slate-700/20", col1: "bg-slate-900/20", textMain: "text-white", textSub: "text-slate-500", grid: "#1e293b", badgeZero: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    light: { card: "bg-white border-gray-200", header: "bg-gray-50 border-gray-200", tableHeader: "bg-gray-100 text-gray-500 border-gray-200", row: "border-gray-100 hover:bg-gray-50", col1: "bg-gray-50", textMain: "text-gray-900", textSub: "text-gray-400", grid: "#f1f5f9", badgeZero: "bg-rose-50 text-rose-600 border-rose-100" },
    cyber: { card: "bg-black border-green-900", header: "bg-black border-green-900", tableHeader: "bg-black text-green-900 border-green-900", row: "border-green-900/50 hover:bg-green-900/10", col1: "bg-black", textMain: "text-green-400", textSub: "text-green-900", grid: "#064e3b", badgeZero: "bg-black text-rose-500 border-rose-900" },
    industrial: { card: "bg-zinc-900 border-zinc-800", header: "bg-zinc-900 border-zinc-800", tableHeader: "bg-zinc-950 text-zinc-600 border-zinc-800", row: "border-zinc-800 hover:bg-zinc-800/30", col1: "bg-zinc-950/20", textMain: "text-zinc-200", textSub: "text-zinc-600", grid: "#27272a", badgeZero: "bg-zinc-950 text-rose-500 border-zinc-800" },
    eco: { card: "bg-[#064e3b]/50 border-emerald-900", header: "bg-[#064e3b] border-emerald-900", tableHeader: "bg-[#022c22] text-emerald-800 border-emerald-900", row: "border-emerald-900/30 hover:bg-emerald-900/10", col1: "bg-emerald-950/20", textMain: "text-emerald-50", textSub: "text-emerald-700", grid: "#064e3b", badgeZero: "bg-[#022c22] text-rose-400 border-emerald-900" }
  };

  const c = themeClasses[theme];
  const modelColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Sumário de Ociosidade (Zeros) */}
      <div className={`${c.card} border rounded-2xl shadow-xl p-6`}>
        <div className="mb-4">
          <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${c.textMain}`}>
            <i className="fas fa-exclamation-circle text-rose-500"></i> Relatório de Ociosidade (Produção Zero)
          </h3>
          <p className={`${c.textSub} text-[9px] font-bold uppercase tracking-widest mt-1`}>Total de janelas horárias sem registro de saída por SKU</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {state.models.map((model, idx) => {
            const zeros = zeroProductionStats[model.id] || 0;
            return (
              <div key={model.id} className={`${c.badgeZero} border p-3 rounded-xl flex flex-col items-center justify-center transition-all hover:scale-[1.02]`}>
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 truncate w-full text-center mb-1">{model.name}</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black tabular-nums">{zeros}</span>
                  <span className="text-[9px] font-bold opacity-40 mb-1">HORAS</span>
                </div>
                {zeros > 0 && <div className="w-full h-1 bg-rose-500/20 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (zeros / historyItems.length) * 100)}%` }}></div>
                </div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico de Eficiência */}
      <div className={`${c.card} border rounded-2xl shadow-xl p-6`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-black uppercase tracking-tight flex items-center gap-2 ${c.textMain}`}>
              <i className="fas fa-chart-line text-blue-500"></i> Eficiência de Ciclo por SKU
            </h3>
            <p className={`${c.textSub} text-[10px] font-bold uppercase tracking-widest`}>Monitoramento de Performance (%) Hora a Hora</p>
          </div>
          {historyItems.length > 0 && (
            <div className="text-right">
              <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${theme === 'industrial' ? 'bg-amber-600 text-black' : 'bg-blue-600 text-white'}`}>
                Sincronizado
              </span>
            </div>
          )}
        </div>

        <div className="h-[350px] w-full">
          {historyItems.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
                <XAxis 
                  dataKey="timeLabel" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: c.textSub, fontSize: 9, fontWeight: 'bold' }} 
                />
                <YAxis 
                  domain={[0, 150]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: c.textSub, fontSize: 9 }} 
                  unit="%" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'eco' ? '#022c22' : theme === 'industrial' ? '#18181b' : '#0f172a', 
                    border: 'none', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', paddingTop: '20px' }} 
                  iconType="circle"
                />
                {state.models.map((model, idx) => (
                  <Line 
                    key={model.id}
                    type="monotone" 
                    dataKey={model.name} 
                    stroke={modelColors[idx % modelColors.length]} 
                    strokeWidth={3} 
                    dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
              <i className="fas fa-chart-area text-5xl mb-4"></i>
              <p className="text-xs uppercase font-black tracking-widest">Sem dados de telemetria horária para renderização</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <div className={`${c.card} border rounded-2xl shadow-xl overflow-hidden`}>
        <div className={`p-6 border-b ${c.header}`}>
          <h3 className={`text-lg font-black uppercase tracking-tight flex items-center gap-2 ${c.textMain}`}>
            <i className={`fas ${theme === 'eco' ? 'fa-leaf' : 'fa-list-ol'} ${
              theme === 'cyber' ? 'text-green-500' : 
              theme === 'industrial' ? 'text-amber-500' : 
              theme === 'eco' ? 'text-emerald-400' : 'text-blue-500'
            }`}></i> Log de Auditoria Industrial
          </h3>
          <p className={`${c.textSub} text-xs mt-1`}>Fluxo contínuo de produção sincronizado com parâmetros de eficiência industrial</p>
        </div>
        
        <div className="overflow-x-auto max-h-[50vh] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 text-[10px] font-black uppercase tracking-widest z-10 ${c.tableHeader}`}>
              <tr>
                <th className="py-4 px-6 border-b">Janela de Tempo</th>
                {state.models.map(m => (
                  <th key={m.id} className="py-4 px-4 border-b text-center">
                    {m.name} <br/>
                    <span className="text-[8px] opacity-60">Meta: {m.plannedTargetPerHour}</span>
                  </th>
                ))}
                <th className="py-4 px-4 border-b text-right">Eficiência Média</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan={state.models.length + 2} className={`py-20 text-center italic ${c.textSub}`}>
                    Aguardando inicialização de fluxo de dados horários.
                  </td>
                </tr>
              ) : (
                historyItems.map((item, idx) => {
                  let totalProd = 0;
                  let totalTarget = 0;
                  
                  return (
                    <tr key={idx} className={`border-b transition-colors ${c.row}`}>
                      <td className={`py-4 px-6 ${c.col1}`}>
                        <div className="flex flex-col">
                          <span className={`text-xs font-black ${c.textMain}`}>Ciclo Dia {item.day}</span>
                          <span className={`text-[9px] uppercase font-bold ${c.textSub}`}>Turno {item.shift} • Slot {item.hour}</span>
                        </div>
                      </td>
                      {state.models.map(m => {
                        const prod = item.logs[m.id] || 0;
                        const belowTarget = prod < m.plannedTargetPerHour;
                        const isZero = prod === 0;
                        totalProd += prod;
                        totalTarget += m.plannedTargetPerHour;
                        
                        return (
                          <td key={m.id} className={`py-4 px-4 text-center font-mono ${
                            isZero ? 'text-rose-600 font-black scale-110' :
                            belowTarget 
                              ? 'text-rose-400 bg-rose-400/5 font-bold' 
                              : theme === 'cyber' ? 'text-green-600' : 
                                theme === 'industrial' ? 'text-amber-500' : 
                                theme === 'eco' ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {prod}
                            {belowTarget && !isZero && <i className="fas fa-arrow-down ml-1 text-[8px]"></i>}
                            {isZero && <i className="fas fa-exclamation-triangle ml-1 text-[8px]"></i>}
                          </td>
                        );
                      })}
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-black ${
                            totalProd >= totalTarget 
                              ? (theme === 'cyber' ? 'text-green-400' : theme === 'industrial' ? 'text-emerald-500' : 'text-emerald-400') 
                              : 'text-amber-500'
                          }`}>
                            {Math.round((totalProd / Math.max(1, totalTarget)) * 100)}%
                          </span>
                          <span className={`text-[9px] font-mono ${c.textSub}`}>{totalProd} / {totalTarget}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #52525b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default HourlyHistory;
