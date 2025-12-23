
import React, { useState, useMemo } from 'react';
import { ModelConfig, ProductionState, ModelMetrics, AlertStatus, DayProduction, AppTab, Theme, ShiftProduction } from './types';
import ConfigForm from './components/ConfigForm';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import HourlyHistory from './components/HourlyHistory';
import ScenarioManager from './components/ScenarioManager';
import ExecutiveDashboard from './components/ExecutiveDashboard';

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('executive');
  const [theme, setTheme] = useState<Theme>('industrial');
  
  const [state, setState] = useState<ProductionState>({
    daysShift1: 0,
    daysShift2: 0,
    hoursShift1: 0,
    hoursShift2: 0,
    models: [],
    productionData: {},
    selectedDay: 1,
    selectedShift: 1,
    selectedHour: 1
  });

  const totalPossibleHours = useMemo(() => {
    return (state.daysShift1 * state.hoursShift1) + (state.daysShift2 * state.hoursShift2);
  }, [state.daysShift1, state.daysShift2, state.hoursShift1, state.hoursShift2]);

  const { completedHours, metrics, trendHistory } = useMemo(() => {
    let countHours = 0;
    const modelCompleted: Record<string, number> = {};
    const modelHistory: Record<string, number[]> = {};
    
    state.models.forEach(m => {
      modelCompleted[m.id] = 0;
      modelHistory[m.id] = [];
    });

    const history: {day: number, shift: number, hour: number, logs: Record<string, number>}[] = [];

    Object.entries(state.productionData).forEach(([dayKey, dayData]) => {
      const day = parseInt(dayKey);
      const typedDayData = dayData as DayProduction;
      [
        { key: 'shift1' as const, shift: 1 },
        { key: 'shift2' as const, shift: 2 }
      ].forEach(s => {
        Object.entries(typedDayData[s.key]).forEach(([hourKey, logs]) => {
          history.push({ day, shift: s.shift, hour: parseInt(hourKey), logs });
        });
      });
    });

    history.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      if (a.shift !== b.shift) return a.shift - b.shift;
      return a.hour - b.hour;
    });

    const trendSteps: any[] = [];
    const runningCompleted: Record<string, number> = {};
    const runningSes: Record<string, number> = {};
    state.models.forEach(m => {
      runningCompleted[m.id] = 0;
      runningSes[m.id] = 0;
    });

    history.forEach((item, index) => {
      countHours++;
      const elapsed = index + 1;
      const remainingGlobal = Math.max(0, totalPossibleHours - elapsed);
      const step: any = { timeLabel: `H${elapsed}` };

      state.models.forEach(m => {
        const prod = item.logs[m.id] || 0;
        modelCompleted[m.id] += prod;
        modelHistory[m.id].push(prod);
        
        runningCompleted[m.id] += prod;
        
        if (elapsed === 1) {
          runningSes[m.id] = prod;
        } else {
          runningSes[m.id] = 0.2 * prod + (1 - 0.2) * runningSes[m.id];
        }

        const totalDemand = m.manualTotalDemand !== undefined 
          ? m.manualTotalDemand 
          : (totalPossibleHours * m.plannedTargetPerHour);
        
        const remainingAtStep = Math.max(0, totalDemand - (runningCompleted[m.id] + (m.extraProduction || 0)));
        const reqTargetAtStep = remainingGlobal > 0 ? remainingAtStep / remainingGlobal : 0;

        step[`${m.name}_SES`] = parseFloat(runningSes[m.id].toFixed(1));
        step[`${m.name}_Meta`] = parseFloat(reqTargetAtStep.toFixed(1));
        step[`${m.name}_Avg`] = parseFloat((runningCompleted[m.id] / elapsed).toFixed(1));
      });
      trendSteps.push(step);
    });

    const plantHoursLogged = Math.max(1, countHours);
    const remainingGlobalHours = Math.max(0, totalPossibleHours - countHours);

    const metricsList: ModelMetrics[] = state.models.map(model => {
      const isManual = model.manualTotalDemand !== undefined;
      const totalDemand = isManual ? (model.manualTotalDemand as number) : (totalPossibleHours * model.plannedTargetPerHour);
      
      const shiftCompleted = modelCompleted[model.id];
      const extraCompleted = model.extraProduction || 0;
      const completed = shiftCompleted + extraCompleted;
      
      const remaining = Math.max(0, totalDemand - completed);
      const requiredTarget = remainingGlobalHours > 0 ? remaining / remainingGlobalHours : 0;

      const avgPerHour = completed / plantHoursLogged;
      const alpha = 0.2;
      let sesRate = 0;
      const h = modelHistory[model.id];
      if (h.length > 0) {
        sesRate = h[0];
        for(let i = 1; i < h.length; i++) {
          sesRate = alpha * h[i] + (1 - alpha) * sesRate;
        }
      }

      const projectionRate = h.length > 0 ? sesRate : model.plannedTargetPerHour;
      const hoursNeeded = projectionRate > 0 ? remaining / projectionRate : (remaining > 0 ? 999 : 0);
      const estimatedHoursGap = hoursNeeded - remainingGlobalHours;
      const isViable = estimatedHoursGap <= 0;

      let status = AlertStatus.OK;
      if (requiredTarget > model.plannedTargetPerHour * 1.5) {
        status = AlertStatus.CRITICAL;
      } else if (requiredTarget > model.plannedTargetPerHour) {
        status = AlertStatus.WARNING;
      }

      return {
        id: model.id,
        name: model.name,
        totalDemand,
        completed,
        extraCompleted,
        remaining,
        requiredTargetPerHour: requiredTarget,
        plannedTarget: model.plannedTargetPerHour,
        status,
        isManualDemand: isManual,
        avgPerHour,
        sesRate,
        last4Avg: 0,
        trendDelta: 0,
        estimatedHoursGap,
        isViable,
        estimatedFinalOutput: completed + (projectionRate * remainingGlobalHours)
      };
    });

    return { completedHours: countHours, metrics: metricsList, trendHistory: trendSteps };
  }, [state, totalPossibleHours]);

  const handleStart = (daysT1: number, daysT2: number, h1: number, h2: number, models: ModelConfig[]) => {
    setState({
      daysShift1: daysT1,
      daysShift2: daysT2,
      hoursShift1: h1,
      hoursShift2: h2,
      models,
      productionData: {},
      selectedDay: 1,
      selectedShift: 1,
      selectedHour: 1
    });
    setIsConfigured(true);
  };

  const handleLogProduction = (day: number, shift: 1 | 2, hour: number, logs: Record<string, number>) => {
    setState(prev => {
      const dayData = prev.productionData[day] || { shift1: {}, shift2: {} };
      const shiftKey = shift === 1 ? 'shift1' : 'shift2';
      return {
        ...prev,
        productionData: {
          ...prev.productionData,
          [day]: { ...dayData, [shiftKey]: { ...dayData[shiftKey], [hour]: logs } }
        }
      };
    });
  };

  const handleUpdateModel = (modelId: string, updates: Partial<ModelConfig>) => {
    setState(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === modelId ? { ...m, ...updates } : m)
    }));
  };

  const handleUpdateTime = (updates: any) => setState(prev => ({ ...prev, ...updates }));

  const themeStyles = {
    dark: { bg: "bg-slate-950", text: "text-slate-100", header: "bg-slate-950 border-slate-800", nav: "bg-slate-900 border-slate-800", navActive: "bg-blue-600 text-white shadow-lg", navInactive: "text-slate-500 hover:text-white" },
    light: { bg: "bg-gray-50", text: "text-gray-900", header: "bg-white border-gray-200", nav: "bg-gray-100 border-gray-200", navActive: "bg-blue-600 text-white shadow-md", navInactive: "text-gray-500 hover:text-gray-900" },
    cyber: { bg: "bg-black", text: "text-green-400", header: "bg-black border-green-900", nav: "bg-black border-green-900", navActive: "bg-green-600 text-black font-black", navInactive: "text-green-900 hover:text-green-500" },
    industrial: { bg: "bg-[#121212]", text: "text-zinc-200", header: "bg-[#18181b] border-zinc-800", nav: "bg-[#18181b] border-zinc-800", navActive: "bg-amber-600 text-zinc-950 font-black shadow-[0_0_15px_rgba(217,119,6,0.2)]", navInactive: "text-zinc-600 hover:text-amber-500" },
    eco: { bg: "bg-[#022c22]", text: "text-emerald-50", header: "bg-[#064e3b] border-emerald-900", nav: "bg-[#064e3b] border-emerald-900", navActive: "bg-emerald-400 text-emerald-950 font-black shadow-[0_0_15px_rgba(52,211,153,0.3)]", navInactive: "text-emerald-800 hover:text-emerald-400" }
  };

  const s = themeStyles[theme];

  if (!isConfigured) {
    return <ConfigForm onStart={handleStart} onImport={(st) => { setState(st); setIsConfigured(true); }} theme={theme} onThemeChange={setTheme} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${s.bg} ${s.text} px-4 py-3 md:px-6 font-sans`}>
      <header className={`flex flex-col lg:flex-row justify-between items-center mb-4 gap-4 border-b pb-3 ${s.header}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`${theme === 'cyber' ? 'bg-green-600/20' : theme === 'industrial' ? 'bg-amber-600/20' : theme === 'eco' ? 'bg-emerald-400/20' : 'bg-blue-600/20'} p-2 rounded-xl`}>
              <i className={`fas ${theme === 'eco' ? 'fa-leaf' : 'fa-industry'} text-lg ${theme === 'industrial' ? 'text-amber-500' : theme === 'eco' ? 'text-emerald-400' : ''}`}></i>
            </div>
            <div>
              <h1 className={`text-xl font-black uppercase tracking-tighter leading-none ${
                theme === 'cyber' ? 'text-green-500' : 
                theme === 'industrial' ? 'text-amber-500' :
                theme === 'eco' ? 'text-emerald-400' :
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>IndusTrack Pro</h1>
              <p className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5 ${
                theme === 'cyber' ? 'text-green-900' : 
                theme === 'industrial' ? 'text-zinc-600' : 
                theme === 'eco' ? 'text-emerald-900' : 'text-slate-500'
              }`}>Operational Intelligence</p>
            </div>
          </div>
          <div className={`flex p-0.5 rounded-lg border ${s.nav}`}>
            <button onClick={() => setTheme('dark')} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Dark"><i className="fas fa-moon text-[10px]"></i></button>
            <button onClick={() => setTheme('light')} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${theme === 'light' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Light"><i className="fas fa-sun text-[10px]"></i></button>
            <button onClick={() => setTheme('cyber')} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${theme === 'cyber' ? 'bg-green-600 text-black' : 'text-slate-500'}`} title="Cyber"><i className="fas fa-terminal text-[10px]"></i></button>
            <button onClick={() => setTheme('industrial')} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${theme === 'industrial' ? 'bg-amber-600 text-zinc-950' : 'text-zinc-600'}`} title="Industrial"><i className="fas fa-screwdriver-wrench text-[10px]"></i></button>
            <button onClick={() => setTheme('eco')} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${theme === 'eco' ? 'bg-emerald-400 text-emerald-950' : 'text-emerald-800'}`} title="Eco-Pulse"><i className="fas fa-leaf text-[10px]"></i></button>
          </div>
        </div>
        <nav className={`flex p-0.5 rounded-lg border shadow-lg ${s.nav}`}>
          <button onClick={() => setActiveTab('executive')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'executive' ? s.navActive : s.navInactive}`}>Executivo</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'dashboard' ? s.navActive : s.navInactive}`}>Painel</button>
          <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? s.navActive : s.navInactive}`}>Histórico</button>
          <button onClick={() => setActiveTab('scenarios')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'scenarios' ? s.navActive : s.navInactive}`}>Cenários</button>
        </nav>
        <div className="flex gap-2">
          <button onClick={() => setShowReport(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition flex items-center gap-2 ${theme === 'industrial' ? 'bg-zinc-700 text-amber-500' : theme === 'eco' ? 'bg-emerald-900 text-emerald-400 border border-emerald-800' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}><i className="fas fa-file-pdf"></i> PDF</button>
          <button onClick={() => setIsConfigured(false)} className="px-3 py-1.5 rounded-lg text-[10px] font-black transition border flex items-center gap-2 bg-red-950/30 text-red-400 border-red-900/50"><i className="fas fa-power-off"></i> RESET</button>
        </div>
      </header>
      <main className="max-w-full mx-auto">
        {activeTab === 'executive' && (
          <ExecutiveDashboard 
            metrics={metrics} 
            historyTrend={trendHistory}
            totalHours={totalPossibleHours}
            remainingHours={totalPossibleHours - completedHours}
            theme={theme}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard 
            state={state} metrics={metrics} totalHours={totalPossibleHours} remainingHours={totalPossibleHours - completedHours}
            onLog={handleLogProduction} onUpdateSelection={(d, s, h) => setState(prev => ({ ...prev, selectedDay: d, selectedShift: s, selectedHour: h }))}
            onUpdateModel={handleUpdateModel} onUpdateTime={handleUpdateTime} theme={theme}
          />
        )}
        {activeTab === 'history' && <HourlyHistory state={state} theme={theme} />}
        {activeTab === 'scenarios' && <ScenarioManager state={state} onImport={(st) => setState(st)} />}
      </main>
      {showReport && (
        <Report metrics={metrics} state={state} remainingHours={totalPossibleHours - completedHours} totalPossibleHours={totalPossibleHours} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default App;
