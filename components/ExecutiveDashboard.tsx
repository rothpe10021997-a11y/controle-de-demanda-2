
import React, { useState } from 'react';
import { ModelMetrics, Theme, AlertStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, ComposedChart, Line, LineChart
} from 'recharts';

interface Props {
  metrics: ModelMetrics[];
  historyTrend: any[];
  totalHours: number;
  remainingHours: number;
  theme: Theme;
}

const ExecutiveDashboard: React.FC<Props> = ({ metrics, historyTrend, totalHours, remainingHours, theme }) => {
  const isDark = theme === 'dark' || theme === 'cyber' || theme === 'industrial' || theme === 'eco';
  const [selectedModelTrend, setSelectedModelTrend] = useState<string>(metrics[0]?.name || '');

  const alertingSkus = metrics.filter(m => m.status !== AlertStatus.OK);
  const criticalCount = metrics.filter(m => m.status === AlertStatus.CRITICAL).length;
  const warningCount = metrics.filter(m => m.status === AlertStatus.WARNING).length;
  const healthScore = 100 - (criticalCount * (100 / Math.max(1, metrics.length)));

  const globalTotalDemand = metrics.reduce((acc, m) => acc + m.totalDemand, 0);
  const globalTotalCompleted = metrics.reduce((acc, m) => acc + m.completed, 0);
  const globalProgress = (globalTotalCompleted / Math.max(1, globalTotalDemand)) * 100;

  const cardClass = theme === 'cyber' 
    ? "bg-black border border-green-900/50 p-5 rounded-2xl shadow-[0_0_15px_rgba(0,255,0,0.05)]" 
    : theme === 'industrial'
    ? "bg-[#18181b] border border-zinc-800/60 p-5 rounded-2xl shadow-xl shadow-black/20"
    : theme === 'eco'
    ? "bg-[#064e3b]/30 backdrop-blur-md border border-emerald-800/40 p-5 rounded-2xl shadow-xl"
    : theme === 'light' 
    ? "bg-white border border-gray-100 shadow-sm p-5 rounded-2xl"
    : "bg-slate-900/60 border border-slate-800 p-5 rounded-2xl";

  const labelColor = theme === 'eco' ? "#065f46" : theme === 'industrial' ? "#52525b" : isDark ? "#64748b" : "#94a3b8";
  const textColor = theme === 'eco' ? "#d1fae5" : theme === 'industrial' ? "#f4f4f5" : isDark ? "#f1f5f9" : "#1e293b";

  const getStatusStyle = (status: AlertStatus) => {
    switch (status) {
      case AlertStatus.CRITICAL:
        return "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/20";
      case AlertStatus.WARNING:
        return "bg-amber-500 text-black border-amber-600 shadow-lg shadow-amber-900/20";
      default:
        return theme === 'eco' ? "bg-emerald-500 text-emerald-950 border-emerald-400 font-black" : "bg-emerald-500 text-white border-emerald-600 opacity-90";
    }
  };

  const volumeData = metrics.map(m => ({
    name: m.name,
    Realizado: m.completed,
    Restante: m.remaining
  }));

  const performanceData = metrics.map(m => ({
    name: m.name,
    'Ritmo SES': parseFloat(m.sesRate.toFixed(1)),
    'Equilíbrio': parseFloat(m.requiredTargetPerHour.toFixed(1))
  }));

  const trendChartData = historyTrend.map(step => ({
    timeLabel: step.timeLabel,
    SES: step[`${selectedModelTrend}_SES`],
    Meta: step[`${selectedModelTrend}_Meta`],
    Media: step[`${selectedModelTrend}_Avg`]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-700">
      
      {/* SIDEBAR ESQUERDA: KPIs e Resumo */}
      <div className="lg:col-span-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 custom-scrollbar">
        
        {/* Widget de Contagem de Alertas Proeminente */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${cardClass} border-none flex flex-col items-center justify-center transition-all ${criticalCount > 0 ? 'bg-rose-600 text-white shadow-xl' : 'opacity-20 grayscale scale-95'}`}>
            <i className="fas fa-bolt text-lg mb-1"></i>
            <span className="text-3xl font-black">{criticalCount}</span>
            <span className="text-[9px] font-black uppercase tracking-wider">Críticos</span>
          </div>
          <div className={`${cardClass} border-none flex flex-col items-center justify-center transition-all ${warningCount > 0 ? 'bg-amber-500 text-black shadow-xl' : 'opacity-20 grayscale scale-95'}`}>
            <i className="fas fa-exclamation-triangle text-lg mb-1"></i>
            <span className="text-3xl font-black">{warningCount}</span>
            <span className="text-[9px] font-black uppercase tracking-wider">Atenção</span>
          </div>
        </div>

        {/* Card de Saúde Master */}
        <div className={`${cardClass} flex flex-col items-center justify-center text-center py-6 relative overflow-hidden border-b-4 ${healthScore < 70 ? 'border-b-rose-600' : theme === 'eco' ? 'border-b-emerald-400' : 'border-b-emerald-500'}`}>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Eco-Health Index</p>
           <h2 className={`text-6xl font-black tracking-tighter ${
             healthScore < 70 ? 'text-rose-500' : 
             theme === 'eco' ? 'text-emerald-400' : 'text-emerald-500'
           }`}>
             {Math.round(healthScore)}<span className="text-2xl">%</span>
           </h2>
           <p className="text-[9px] font-bold mt-2 opacity-30 uppercase tracking-[0.2em]">Efficiency Consensus</p>
        </div>

        {/* Resumo Executivo Compacto */}
        <div className={`${cardClass} ${theme === 'eco' ? 'bg-emerald-400 text-emerald-950 font-black' : theme === 'industrial' ? 'bg-amber-600 text-zinc-950' : 'bg-blue-600 text-white'} border-none shadow-xl`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <i className={`fas ${theme === 'eco' ? 'fa-leaf' : 'fa-microchip'}`}></i> Green Analysis
          </h3>
          <p className="text-xs font-medium leading-relaxed opacity-95">
            {globalProgress.toFixed(0)}% da demanda cumprida. 
            {criticalCount > 0 
              ? ` Déficit de produtividade detectado. Reequilíbrio de carga via SES recomendado para otimizar recursos.` 
              : " Fluxo operacional sustentável. Produtividade nominal atingida em todos os SKUs ativos."}
          </p>
        </div>

        {/* Central de Alertas Lateral */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.3em]">Grade Intelligence</p>
            <span className="h-px bg-current opacity-10 flex-1 ml-4"></span>
          </div>
          {alertingSkus.length === 0 ? (
            <div className={`${cardClass} opacity-20 text-center py-8 italic text-[10px] uppercase tracking-widest`}>
              <i className="fas fa-check-double mr-2 text-emerald-500"></i> Grade em Equilíbrio
            </div>
          ) : (
            alertingSkus.map(m => (
              <div key={m.id} className={`${cardClass} border-l-4 ${m.status === AlertStatus.CRITICAL ? 'border-l-rose-600' : 'border-l-amber-500'} py-3 px-4 hover:translate-x-1 transition-transform cursor-default`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-black text-[11px] uppercase truncate max-w-[130px] tracking-tight">{m.name}</span>
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getStatusStyle(m.status)}`}>
                    {m.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                   <div className="text-[9px] font-bold opacity-70">
                     SES: <span className={m.status === AlertStatus.CRITICAL ? 'text-rose-500 font-black' : 'text-amber-500 font-black'}>{m.sesRate.toFixed(1)}</span>
                   </div>
                   <div className={`text-[9px] font-black ${m.estimatedHoursGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                     {m.estimatedHoursGap > 0 ? `+${m.estimatedHoursGap.toFixed(1)}h` : 'OK'}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: Gráficos (9 Colunas) */}
      <div className="lg:col-span-9 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)] pr-1 custom-scrollbar">
        
        {/* Barra Superior de KPIs Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
           <div className={cardClass}>
             <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em]">Eco-Runway</p>
             <p className={`text-2xl font-black ${theme === 'eco' ? 'text-emerald-400' : 'text-blue-500'} leading-none mt-1`}>{remainingHours.toFixed(1)}h</p>
           </div>
           <div className={cardClass}>
             <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em]">Efficiency Rate</p>
             <p className="text-2xl font-black leading-none mt-1">{globalProgress.toFixed(1)}%</p>
           </div>
           <div className={cardClass}>
             <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em]">Volume Produzido</p>
             <p className="text-2xl font-black leading-none mt-1">{globalTotalCompleted.toLocaleString()}</p>
           </div>
           <div className={cardClass}>
             <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em]">Carga Total</p>
             <p className="text-2xl font-black leading-none mt-1">{totalHours.toFixed(0)}h</p>
           </div>
        </div>

        {/* Linha de Gráficos de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={cardClass}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">Volume Operacional</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'eco' ? "#064e3b" : isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: 'rgba(52,211,153,0.05)' }} contentStyle={{ backgroundColor: theme === 'eco' ? '#022c22' : '#0f172a', borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Bar dataKey="Realizado" stackId="a" fill={theme === 'eco' ? "#10b981" : "#3b82f6"} radius={[0, 0, 0, 0]} barSize={12} />
                  <Bar dataKey="Restante" stackId="a" fill={theme === 'eco' ? "#064e3b" : "#1e293b"} radius={[0, 6, 6, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">Equilíbrio de Grade (SES)</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'eco' ? "#064e3b" : "#1e293b"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'eco' ? '#022c22' : '#0f172a', borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Bar dataKey="Ritmo SES" barSize={20}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry['Ritmo SES'] >= entry['Equilíbrio'] ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="Equilíbrio" stroke={theme === 'eco' ? "#34d399" : "#3b82f6"} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: isDark ? '#022c22' : '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico de Tendência Temporal */}
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Efficiency Trendline</h3>
              <p className="text-[8px] opacity-40 font-bold uppercase mt-0.5 tracking-widest">Predição SES Algorithm v4.0</p>
            </div>
            <div className="flex gap-2 overflow-x-auto max-w-[50%] no-scrollbar">
              {metrics.slice(0, 10).map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setSelectedModelTrend(m.name)}
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border whitespace-nowrap transition-all ${
                    selectedModelTrend === m.name 
                      ? theme === 'eco' ? 'bg-emerald-400 text-emerald-950 border-emerald-400' : 'bg-blue-600 text-white border-blue-600' 
                      : isDark ? 'border-emerald-900/40 text-emerald-700 hover:text-emerald-400' : 'border-gray-100 text-gray-500 hover:text-black'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            {historyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'eco' ? "#064e3b" : "#1e293b"} />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 9 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: labelColor, fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'eco' ? '#022c22' : '#0f172a', borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                  <Line name="SES Pulse" type="monotone" dataKey="SES" stroke={trendChartData[trendChartData.length - 1]?.SES >= trendChartData[trendChartData.length - 1]?.Meta ? "#10b981" : "#f43f5e"} strokeWidth={3} dot={{ r: 2 }} />
                  <Line name="Mean Efficiency" type="monotone" dataKey="Media" stroke={theme === 'eco' ? "#065f46" : "#7c3aed"} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                  <Line name="Target Grade" type="stepAfter" dataKey="Meta" stroke={theme === 'eco' ? "#34d399" : "#3b82f6"} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                <i className="fas fa-leaf text-4xl mb-3"></i>
                <p className="text-xs uppercase font-black tracking-widest">Aguardando dados horários para processar tendência sustentável</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(52, 211, 153, 0.2);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
};

export default ExecutiveDashboard;
