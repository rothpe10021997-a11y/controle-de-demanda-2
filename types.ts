
export interface ModelConfig {
  id: string;
  name: string;
  plannedTargetPerHour: number;
  manualTotalDemand?: number; // Campo para override de demanda total
  extraProduction?: number;   // Produção adicionada manualmente fora do fluxo horário
}

export interface ShiftProduction {
  [hour: number]: Record<string, number>; // hourIndex -> modelId -> quantity
}

export interface DayProduction {
  shift1: ShiftProduction;
  shift2: ShiftProduction;
}

export interface ProductionState {
  daysShift1: number;
  daysShift2: number;
  hoursShift1: number;
  hoursShift2: number;
  models: ModelConfig[];
  productionData: Record<number, DayProduction>; // dayIndex -> DayProduction
  selectedDay: number;
  selectedShift: 1 | 2;
  selectedHour: number;
}

export enum AlertStatus {
  OK = 'OK',
  WARNING = 'ATENÇÃO',
  CRITICAL = 'CRÍTICO'
}

export interface ModelMetrics {
  id: string;
  name: string;
  totalDemand: number;
  completed: number;
  extraCompleted: number;
  remaining: number;
  requiredTargetPerHour: number;
  plannedTarget: number;
  status: AlertStatus;
  isManualDemand: boolean;
  // Campos para predição individual
  estimatedHoursGap: number;
  isViable: boolean;
  avgPerHour: number;
  sesRate: number; // Média Suavizada Exponencial (SES)
  last4Avg: number; // Média dos últimos 4 lançamentos
  trendDelta: number; // Percentual de melhora ou queda comparado à média
  estimatedFinalOutput: number; // Projeção de entrega final (EAC) baseada em SES
}

export type AppTab = 'dashboard' | 'history' | 'scenarios' | 'executive';
export type Theme = 'dark' | 'light' | 'cyber' | 'industrial' | 'eco';
