
import React, { useMemo, useRef, useState } from 'react';
import { ModelMetrics, ProductionState, AlertStatus, DayProduction } from '../types';

interface Props {
  metrics: ModelMetrics[];
  state: ProductionState;
  remainingHours: number;
  totalPossibleHours: number;
  onClose: () => void;
}

const Report: React.FC<Props> = ({ metrics, state, remainingHours, totalPossibleHours, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalLoggedHours = useMemo(() => {
    let count = 0;
    (Object.values(state.productionData) as DayProduction[]).forEach(day => {
      const d = day as DayProduction;
      count += Object.keys(d.shift1).length;
      count += Object.keys(d.shift2).length;
    });
    return Math.max(1, count);
  }, [state.productionData]);

  const totalCompleted = metrics.reduce((acc, m) => acc + m.completed, 0);
  const totalDemand = metrics.reduce((acc, m) => acc + m.totalDemand, 0);
  const globalProgress = totalDemand > 0 ? (totalCompleted / totalDemand) * 100 : 0;

  const summary = useMemo(() => {
    const ok = metrics.filter(m => m.status === AlertStatus.OK).length;
    const attention = metrics.filter(m => m.status === AlertStatus.WARNING).length;
    const risk = metrics.filter(m => m.status === AlertStatus.CRITICAL).length;
    const avgSes = metrics.reduce((acc, m) => acc + m.sesRate, 0) / Math.max(1, metrics.length);
    return { ok, attention, risk, avgSes };
  }, [metrics]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    const element = reportRef.current;
    const opt = {
      margin: 0,
      filename: `RELATORIO_TECNICO_PRODUCAO_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const pdfLib = (window as any).html2pdf;
      await pdfLib().set(opt).from(element).save();
    } catch (e) { 
      console.error("Erro na exportação PDF:", e); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white border-4 border-zinc-800 rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* UI Header do Visualizador */}
        <header className="px-8 py-5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
               <i className="fas fa-file-invoice text-zinc-900"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">Exportação de Relatório Técnico</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Padrão A4 ISO 216 • Alta Definição</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-2.5 bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-black uppercase rounded-lg border border-zinc-700">Cancelar</button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGenerating} 
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase hover:bg-blue-500 transition-all shadow-xl flex items-center gap-3"
            >
              {isGenerating ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-print"></i>}
              {isGenerating ? 'Gerando Documento...' : 'Exportar para PDF'}
            </button>
          </div>
        </header>

        {/* Scroll View do A4 */}
        <div className="flex-1 overflow-y-auto p-10 bg-zinc-200 flex justify-center custom-scrollbar">
          
          {/* O DOCUMENTO A4 */}
          <div 
            ref={reportRef} 
            className="bg-white text-black font-sans shadow-[0_0_30px_rgba(0,0,0,0.2)] print-content"
            style={{ 
              width: '210mm', 
              height: '297mm',
              padding: '15mm 18mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              color: '#000000',
              backgroundColor: '#ffffff'
            }}
          >
            {/* CABEÇALHO CORPORATIVO */}
            <div className="border-b-4 border-zinc-900 pb-4 mb-6 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center">
                  <span className="text-white font-black text-2xl">C</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none" style={{ color: '#000000' }}>COLEPACK INDUSTRIAL</h1>
                  <p className="text-[9pt] font-black text-zinc-600 uppercase mt-1">Operational Audit & Performance Control</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[8pt] font-black px-3 py-1 bg-zinc-100 border border-zinc-200 text-black uppercase">Documento Técnico: #{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                <p className="text-[7pt] font-bold text-zinc-500 uppercase">Emitido em: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>

            {/* TÍTULO DO RELATÓRIO */}
            <div className="mb-6">
               <h2 className="text-xl font-black uppercase tracking-tight text-center border-y-2 border-zinc-200 py-3" style={{ color: '#000000' }}>
                 RELATÓRIO DE MONITORAMENTO E PREDICÇÃO DE PRODUTIVIDADE
               </h2>
            </div>

            {/* METADADOS DO PERÍODO */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="border-l-2 border-zinc-900 pl-3">
                <p className="text-[7pt] font-black text-zinc-400 uppercase">Janela Auditada</p>
                <p className="text-sm font-black text-black">Turno {state.selectedShift} | Hora {state.selectedHour}ª</p>
              </div>
              <div className="border-l-2 border-zinc-900 pl-3">
                <p className="text-[7pt] font-black text-zinc-400 uppercase">Progresso Global</p>
                <p className="text-sm font-black text-black">{globalProgress.toFixed(1)}% Cumprido</p>
              </div>
              <div className="border-l-2 border-zinc-900 pl-3">
                <p className="text-[7pt] font-black text-zinc-400 uppercase">Total Logado</p>
                <p className="text-sm font-black text-black">{totalLoggedHours}h de Operação</p>
              </div>
              <div className="border-l-2 border-zinc-900 pl-3 text-right">
                <p className="text-[7pt] font-black text-zinc-400 uppercase">Runway Restante</p>
                <p className="text-sm font-black text-blue-800">{remainingHours.toFixed(1)} Horas</p>
              </div>
            </div>

            {/* TABELA DE DADOS TÉCNICOS */}
            <div className="flex-1">
              <table className="w-full text-left border-collapse" style={{ border: '2px solid #000000' }}>
                <thead>
                  <tr className="bg-zinc-900">
                    <th className="p-2 border border-zinc-700 text-[7.5pt] font-black uppercase text-white w-[18%]">SKU / Modelo</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">Demanda</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">Produzido</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">%</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">SES Rate</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">Gap (h)</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">Meta Requerida</th>
                    <th className="p-2 border border-zinc-700 text-center text-[7.5pt] font-black uppercase text-white">Auditoria</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '8.5pt' }}>
                  {metrics.map((m, idx) => (
                    <tr key={m.id} className={`${idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}`} style={{ color: '#000000', borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-2 border-r border-zinc-300 font-black uppercase tracking-tight">{m.name}</td>
                      <td className="p-2 border-r border-zinc-300 text-center tabular-nums">{m.totalDemand.toLocaleString()}</td>
                      <td className="p-2 border-r border-zinc-300 text-center tabular-nums font-bold">{m.completed.toLocaleString()}</td>
                      <td className="p-2 border-r border-zinc-300 text-center tabular-nums">{( (m.completed / m.totalDemand) * 100 ).toFixed(1)}%</td>
                      <td className="p-2 border-r border-zinc-300 text-center tabular-nums">{m.sesRate.toFixed(1)}</td>
                      <td className={`p-2 border-r border-zinc-300 text-center tabular-nums font-black ${m.estimatedHoursGap > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {m.estimatedHoursGap > 0 ? `+${m.estimatedHoursGap.toFixed(1)}` : '0.0'}
                      </td>
                      <td className="p-2 border-r border-zinc-300 text-center tabular-nums font-black underline">{m.requiredTargetPerHour.toFixed(1)}</td>
                      <td className="p-2 text-center">
                        <span className={`text-[7pt] font-black uppercase px-2 py-0.5 rounded ${
                          m.status === AlertStatus.CRITICAL ? 'bg-red-100 text-red-900 border border-red-200' : 
                          m.status === AlertStatus.WARNING ? 'bg-amber-100 text-amber-900 border border-amber-200' : 
                          'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PARECER TÉCNICO E SUMÁRIO DE RISCO */}
            <div className="mt-8 pt-6 border-t-2 border-zinc-200">
               <div className="grid grid-cols-2 gap-10">
                 <div className="space-y-4">
                   <h3 className="text-[9pt] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-1">Sumário de Grade</h3>
                   <div className="grid grid-cols-3 gap-3">
                     <div className="p-3 bg-emerald-50 border border-emerald-100 text-center">
                       <p className="text-[7pt] font-bold text-emerald-800 uppercase">Estáveis</p>
                       <p className="text-xl font-black text-emerald-900">{summary.ok}</p>
                     </div>
                     <div className="p-3 bg-amber-50 border border-amber-100 text-center">
                       <p className="text-[7pt] font-bold text-amber-800 uppercase">Atenção</p>
                       <p className="text-xl font-black text-amber-900">{summary.attention}</p>
                     </div>
                     <div className="p-3 bg-red-50 border border-red-100 text-center">
                       <p className="text-[7pt] font-bold text-red-800 uppercase">Críticos</p>
                       <p className="text-xl font-black text-red-900">{summary.risk}</p>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <h3 className="text-[9pt] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-1">Parecer de Performance</h3>
                   <div className="text-[8.5pt] text-zinc-800 leading-relaxed font-medium">
                     <p>
                       A análise baseada em <strong>Média Suavizada Exponencial (SES)</strong> projeta um ritmo operacional consolidado de <strong>{summary.avgSes.toFixed(1)} u/h</strong>.
                     </p>
                     <p className="mt-2 italic">
                       {summary.risk > 0 
                         ? `ALERTA DE SISTEMA: Foi detectada incapacidade produtiva em ${summary.risk} modelos. Recomenda-se imediata intervenção técnica e possível realocação de carga para evitar déficit na janela Runway.` 
                         : `CONFIRMAÇÃO DE FLUXO: Todos os SKUs estão operando dentro da margem de segurança. Não há previsão de atrasos nas entregas para o ciclo atual.`}
                     </p>
                   </div>
                 </div>
               </div>
            </div>

            {/* RODAPÉ FINAL DE AUDITORIA */}
            <div className="mt-auto pt-6 border-t-4 border-zinc-900 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[7pt] font-black text-zinc-400 uppercase tracking-tighter">SISTEMA: IndusTrack Pro v4.0.2 - Industrial Core Engine</p>
                <p className="text-[7pt] font-bold text-zinc-400 uppercase tracking-tighter">CERTIFICAÇÃO: ISO-9001 COMPLIANT ALGORITHM</p>
              </div>
              <div className="text-right">
                <div className="inline-block border-2 border-black p-2 bg-zinc-50 mb-1">
                  <p className="text-[6pt] font-black text-zinc-400 uppercase leading-none">Status de Auditoria</p>
                  <p className="text-[10pt] font-black text-black uppercase leading-none mt-1">Sincronizado</p>
                </div>
                <p className="text-[6pt] font-bold text-zinc-300">Este documento é confidencial e destinado exclusivamente para fins de gestão interna.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 20px; }
        
        @media print {
          .print-content {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 15mm 18mm !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-zinc-900 { background-color: #18181b !important; }
          .bg-zinc-100 { background-color: #f4f4f5 !important; }
          .bg-zinc-50 { background-color: #fafafa !important; }
          .bg-emerald-50 { background-color: #ecfdf5 !important; }
          .bg-amber-50 { background-color: #fffbeb !important; }
          .bg-red-50 { background-color: #fef2f2 !important; }
          .text-white { color: #ffffff !important; }
          .text-black { color: #000000 !important; }
          .text-zinc-600 { color: #52525b !important; }
          .text-emerald-900 { color: #064e3b !important; }
          .text-red-900 { color: #7f1d1d !important; }
          .text-amber-900 { color: #78350f !important; }
        }
      `}</style>
    </div>
  );
};

export default Report;
