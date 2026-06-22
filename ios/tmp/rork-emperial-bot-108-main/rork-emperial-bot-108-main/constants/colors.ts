export const Colors = {
  bg0: '#04080d',
  bg1: '#070d14',
  bg2: '#0a1220',
  bg3: '#0f1a2e',
  border: '#132030',
  border2: '#1a2d45',
  amber: '#f59e0b',
  amber2: '#d97706',
  amberDim: 'rgba(245,158,11,0.1)',
  green: '#10b981',
  greenDim: 'rgba(16,185,129,0.1)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.1)',
  blue: '#38bdf8',
  purple: '#a78bfa',
  pink: '#f472b6',
  orange: '#fb923c',
  cyan: '#67e8f9',
  gold: '#fde68a',
  lightGreen: '#4ade80',
  lavender: '#c4b5fd',
  lightRed: '#fca5a5',
  paleGreen: '#86efac',
  text: '#cbd5e1',
  text2: '#94a3b8',
  text3: '#64748b',
  white: '#ffffff',
  glowGreen: 'rgba(16,185,129,0.35)',
  glowRed: 'rgba(239,68,68,0.35)',
  glowBlue: 'rgba(56,189,248,0.3)',
  glowAmber: 'rgba(245,158,11,0.3)',
  glowPurple: 'rgba(167,139,250,0.3)',
  glowPink: 'rgba(244,114,182,0.3)',
  glowCyan: 'rgba(103,232,249,0.3)',
  glowOrange: 'rgba(251,146,60,0.3)',
  glowGold: 'rgba(253,230,138,0.25)',
};

export type SignalType = 'bull' | 'bear' | 'neutral' | 'fire';

export function getSignalColor(type: SignalType): string {
  switch (type) {
    case 'bull': return Colors.green;
    case 'bear': return Colors.red;
    case 'neutral': return Colors.text2;
    case 'fire': return Colors.amber;
  }
}

export function getAssetColor(sym: string): string {
  if (['SPX','NDX','DJI','RUT','VIX','FTSE','DAX','N225','HSI','STOXX','FCHI','GSPC','NYA','SOX'].includes(sym)) return Colors.cyan;
  if (sym.startsWith('6') || sym === 'DX') return Colors.pink;
  if (['GC','MGC','SI','SIL','HG','MHG','PL','PA'].includes(sym)) return Colors.gold;
  if (['CL','MCL','QM','NG','QG','HO','RB'].includes(sym)) return Colors.orange;
  if (['ZN','ZB','ZT','ZF','GE','FF','SR3'].includes(sym)) return Colors.purple;
  if (['ZC','ZW','ZS','ZM','ZL','ZO','ZR','KE','MZC','MZW','MZS'].includes(sym)) return Colors.paleGreen;
  if (['CC','CT','KC','SB','OJ'].includes(sym)) return Colors.cyan;
  if (['LE','HE','GF'].includes(sym)) return Colors.lightRed;
  if (['BTC','MBT','ETH','MET','BNB','SOL','XRP','DOGE','ADA','AVAX','DOT','LINK','MATIC','ATOM','UNI','LTC','INJ','SUI','PEPE','SHIB','BONK','WIF'].includes(sym)) return Colors.lavender;
  if (sym.endsWith('_C')) return Colors.green;
  if (sym.endsWith('_P')) return Colors.red;
  return Colors.amber;
}
