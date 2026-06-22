export interface IndicatorParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface IndicatorSettingsDef {
  id: string;
  params: IndicatorParam[];
}

export interface IndicatorSettingsValues {
  [indicatorId: string]: Record<string, number>;
}

export const INDICATOR_SETTINGS: IndicatorSettingsDef[] = [
  {
    id: 'ema_cross',
    params: [
      { key: 'shortPeriod', label: 'Short EMA', min: 2, max: 50, step: 1, defaultValue: 5 },
      { key: 'longPeriod', label: 'Long EMA', min: 5, max: 200, step: 1, defaultValue: 32 },
      { key: 'stopPct', label: 'Stop %', min: 1, max: 20, step: 0.5, defaultValue: 5.5 },
      { key: 'takePct', label: 'Take %', min: 2, max: 40, step: 0.5, defaultValue: 11 },
    ],
  },
  {
    id: 'stepped_ema',
    params: [
      { key: 'period', label: 'EMA Period', min: 2, max: 100, step: 1, defaultValue: 14 },
    ],
  },
  {
    id: 'mp_v1',
    params: [
      { key: 'shortPeriod', label: 'Short EMA', min: 2, max: 50, step: 1, defaultValue: 14 },
      { key: 'longPeriod', label: 'Long EMA', min: 5, max: 100, step: 1, defaultValue: 28 },
    ],
  },
  {
    id: 'combined',
    params: [
      { key: 'shortPeriod', label: 'MA Short', min: 2, max: 50, step: 1, defaultValue: 9 },
      { key: 'longPeriod', label: 'MA Long', min: 5, max: 100, step: 1, defaultValue: 21 },
      { key: 'atrPeriod', label: 'ATR Period', min: 2, max: 50, step: 1, defaultValue: 14 },
      { key: 'tp1Mult', label: 'TP1 Mult', min: 0.5, max: 10, step: 0.5, defaultValue: 2.0 },
      { key: 'tp2Mult', label: 'TP2 Mult', min: 0.5, max: 10, step: 0.5, defaultValue: 3.0 },
      { key: 'tp3Mult', label: 'TP3 Mult', min: 0.5, max: 10, step: 0.5, defaultValue: 4.0 },
      { key: 'slMult', label: 'SL Mult', min: 0.5, max: 5, step: 0.25, defaultValue: 1.5 },
    ],
  },
  {
    id: 'refined_mp',
    params: [
      { key: 'smoothPeriod', label: 'Smooth EMA', min: 2, max: 50, step: 1, defaultValue: 10 },
    ],
  },
  {
    id: 'cloud',
    params: [
      { key: 'shortPeriod', label: 'EMA Short', min: 2, max: 50, step: 1, defaultValue: 9 },
      { key: 'longPeriod', label: 'EMA Long', min: 5, max: 100, step: 1, defaultValue: 21 },
      { key: 'smaPeriod', label: 'SMA Period', min: 10, max: 200, step: 1, defaultValue: 50 },
    ],
  },
  {
    id: 'fib',
    params: [
      { key: 'lookback', label: 'Lookback Bars', min: 20, max: 500, step: 10, defaultValue: 100 },
      { key: 'level1', label: 'Level 1', min: 0.01, max: 0.99, step: 0.01, defaultValue: 0.236 },
      { key: 'level2', label: 'Level 2', min: 0.01, max: 0.99, step: 0.01, defaultValue: 0.382 },
      { key: 'level3', label: 'Level 3', min: 0.01, max: 0.99, step: 0.01, defaultValue: 0.5 },
      { key: 'level4', label: 'Level 4', min: 0.01, max: 0.99, step: 0.01, defaultValue: 0.618 },
      { key: 'level5', label: 'Level 5', min: 0.01, max: 0.99, step: 0.01, defaultValue: 0.786 },
    ],
  },
  {
    id: 'mps',
    params: [
      { key: 'smaPeriod', label: 'SMA Period', min: 2, max: 50, step: 1, defaultValue: 5 },
    ],
  },
];

export function getDefaultSettings(): IndicatorSettingsValues {
  const defaults: IndicatorSettingsValues = {};
  INDICATOR_SETTINGS.forEach((ind) => {
    const vals: Record<string, number> = {};
    ind.params.forEach((p) => {
      vals[p.key] = p.defaultValue;
    });
    defaults[ind.id] = vals;
  });
  return defaults;
}
