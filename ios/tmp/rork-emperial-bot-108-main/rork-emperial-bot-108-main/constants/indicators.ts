export interface IndicatorDef {
  id: string;
  name: string;
  color: string;
  on: boolean;
}

export const INDICATORS: IndicatorDef[] = [
  { id: 'ema_cross',   name: 'EMA Cross 5/32',       color: '#38bdf8', on: true },
  { id: 'stepped_ema', name: 'Stepped EMA 14',        color: '#f59e0b', on: true },
  { id: 'mp_v1',       name: 'Market Pressure (EMA)', color: '#a78bfa', on: true },
  { id: 'combined',    name: 'ATR Strategy (9/21)',    color: '#fb923c', on: true },
  { id: 'refined_mp',  name: 'Refined Pressure',      color: '#f472b6', on: true },
  { id: 'cloud',       name: 'MA Cloud + Pivots',     color: '#4ade80', on: true },
  { id: 'fib',         name: 'Fibonacci Retracement',  color: '#fde68a', on: true },
  { id: 'mps',         name: 'Pressure Simple (SMA)', color: '#67e8f9', on: true },
];
