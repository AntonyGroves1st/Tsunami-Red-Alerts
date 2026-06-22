import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Text, Pressable, Platform } from 'react-native';
import { Haptics } from '@/utils/haptics';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown } from 'lucide-react-native';
import Svg, { Line, Rect, Path, Defs, RadialGradient, Stop, Circle, LinearGradient } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { Candle, IndicatorResults } from '@/utils/calculations';
import { TradingLevelsData } from '@/components/TradingLevels';

const AXIS_W_SMALL = 42;
const AXIS_W_DEFAULT = 56;

interface TradingChartProps {
  candles: Candle[];
  indicators: IndicatorResults | null;
  indicatorToggles: Record<string, boolean>;
  width: number;
  mainHeight: number;
  oscHeight: number;
  tradingLevels?: TradingLevelsData | null;
}


const PAD = 1;
const MIN_VIS = 15;
const MAX_VIS = 250;
const RIGHT_PAD_RATIO = 0.25;

function clampVal(v: number, mn: number, mx: number): number {
  return Math.max(mn, Math.min(mx, v));
}

function fmtPrice(v: number): string {
  const a = Math.abs(v);
  if (a >= 10000) return v.toFixed(0);
  if (a >= 100) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  if (a >= 0.01) return v.toFixed(4);
  return v.toFixed(6);
}

function buildLinePath(
  arr: number[],
  offset: number,
  count: number,
  barW: number,
  yFn: (v: number) => number,
): string {
  let d = '';
  let on = false;
  for (let i = 0; i < count; i++) {
    const idx = offset + i;
    if (idx >= arr.length) break;
    const v = arr[idx];
    if (isNaN(v) || !isFinite(v)) continue;
    const x = PAD + i * barW + barW / 2;
    const y = yFn(v);
    d += on ? `L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`;
    on = true;
  }
  return d;
}

function hexToGlow(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SL_COLOR = '#ef4444';
const TS_COLOR = '#f97316';
const TP1_COLOR = '#22c55e';
const TP2_COLOR = '#14b8a6';
const TP3_COLOR = '#06b6d4';
const ENTRY_COLOR = '#eab308';

function TradingChartInner({
  candles,
  indicators,
  indicatorToggles,
  width,
  mainHeight,
  oscHeight,
  tradingLevels,
}: TradingChartProps) {
  const AXIS_W = width < 360 ? AXIS_W_SMALL : AXIS_W_DEFAULT;
  const chartW = width - AXIS_W;
  const [visCnt, setVisCnt] = useState<number>(80);
  const [scrollOff, setScrollOff] = useState<number | null>(null);
  const [scaleY, setScaleY] = useState<number>(1);
  const [selBar, setSelBar] = useState<number | null>(null);
  const prevTotalRef = useRef<number>(0);

  const gr = useRef({
    mode: 'idle' as string,
    sScroll: 0,
    sVis: 0,
    sScaleY: 1,
    sDistX: 0,
    sDistY: 0,
    timer: null as ReturnType<typeof setTimeout> | null,
    accumDx: 0,
  });

  const total = candles.length;
  const vis = clampVal(visCnt, MIN_VIS, Math.min(MAX_VIS, total));
  const rightPadBars = Math.floor(vis * RIGHT_PAD_RATIO);
  const minOff = -rightPadBars;
  const maxOff = Math.max(0, total - vis);

  const resolvedScrollOff = scrollOff === null ? minOff : scrollOff;

  if (prevTotalRef.current > 0 && total > prevTotalRef.current && resolvedScrollOff <= 0) {
    // keep view pinned when new candles arrive and user is near the latest
  }
  prevTotalRef.current = total;

  const off = clampVal(resolvedScrollOff, minOff, maxOff);
  const effectiveOff = Math.max(0, off);
  const rightShiftBars = off < 0 ? Math.abs(off) : 0;
  const startI = Math.max(0, total - effectiveOff - vis);
  const endI = Math.min(total, total - effectiveOff);

  const slice = useMemo(
    () => candles.slice(startI, endI),
    [candles, startI, endI],
  );

  const totalSlots = slice.length + rightShiftBars;
  const barW = totalSlots > 0 ? (chartW - PAD * 2) / totalSlots : 1;

  const { pMin, pMax, pRange, volMax } = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    let vm = 0;
    slice.forEach((c) => {
      mn = Math.min(mn, c.l);
      mx = Math.max(mx, c.h);
      vm = Math.max(vm, c.v);
    });

    if (indicators) {
      const overlays: number[][] = [];
      if (indicatorToggles['ema_cross'] !== false) {
        overlays.push(indicators.emaShort, indicators.emaLong);
      }
      if (indicatorToggles['stepped_ema'] !== false) {
        overlays.push(indicators.emaRaw, indicators.emaStepped);
      }
      if (indicatorToggles['combined'] !== false) {
        overlays.push(indicators.combShort, indicators.combLong);
      }
      if (indicatorToggles['cloud'] !== false) {
        overlays.push(indicators.advShort, indicators.advLong, indicators.advSma);
      }
      overlays.forEach((arr) => {
        for (let i = startI; i < endI && i < arr.length; i++) {
          const v = arr[i];
          if (!isNaN(v) && isFinite(v)) {
            mn = Math.min(mn, v);
            mx = Math.max(mx, v);
          }
        }
      });
    }

    if (!isFinite(mn) || !isFinite(mx)) {
      mn = 0;
      mx = 1;
    }
    const r = mx - mn || 1;
    const basePad = r * 0.06;
    const yZoomPad = (r * 0.5) * (1 / scaleY - 1);
    const pad = basePad + Math.max(0, yZoomPad);
    const center = (mn + mx) / 2;
    const halfRange = ((r + basePad * 2) / 2) / scaleY;
    return { pMin: center - halfRange, pMax: center + halfRange, pRange: halfRange * 2, volMax: vm || 1 };
  }, [slice, indicators, indicatorToggles, startI, endI, scaleY]);

  const toY = useCallback(
    (v: number) => mainHeight - ((v - pMin) / pRange) * mainHeight,
    [mainHeight, pMin, pRange],
  );

  const toX = useCallback(
    (i: number) => PAD + i * barW + barW / 2,
    [barW],
  );

  const oscInfo = useMemo(() => {
    if (!indicators)
      return { min: -1, max: 1, range: 2, lines: [] as { arr: number[]; color: string }[] };
    const lines: { arr: number[]; color: string }[] = [];
    if (indicatorToggles['mp_v1'] !== false)
      lines.push({ arr: indicators.marketPressure, color: Colors.purple });
    if (indicatorToggles['refined_mp'] !== false)
      lines.push({ arr: indicators.rmpSmoothed, color: Colors.pink });
    if (indicatorToggles['mps'] !== false)
      lines.push({ arr: indicators.mpsSmoothed, color: Colors.cyan });

    let mn = 0;
    let mx = 0;
    lines.forEach((l) => {
      for (let i = startI; i < endI && i < l.arr.length; i++) {
        const v = l.arr[i];
        if (!isNaN(v) && isFinite(v)) {
          mn = Math.min(mn, v);
          mx = Math.max(mx, v);
        }
      }
    });
    const r = mx - mn || 1;
    const p = r * 0.15;
    return { min: mn - p, max: mx + p, range: r + p * 2, lines };
  }, [indicators, indicatorToggles, startI, endI]);

  const toOscY = useCallback(
    (v: number) => oscHeight - ((v - oscInfo.min) / oscInfo.range) * oscHeight,
    [oscHeight, oscInfo.min, oscInfo.range],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
        onPanResponderGrant: (evt) => {
          const g = gr.current;
          g.sScroll = off;
          g.sVis = vis;
          g.mode = 'idle';
          if (g.timer) clearTimeout(g.timer);
          const touches = evt.nativeEvent.touches;
          if (touches && touches.length >= 2) {
            g.mode = 'pinch';
            const t = touches as any[];
            g.sDistX = Math.abs(t[0].pageX - t[1].pageX);
            g.sDistY = Math.abs(t[0].pageY - t[1].pageY);
            g.sScaleY = scaleY;
          } else {
            g.timer = setTimeout(() => {
              if (g.mode === 'idle') {
                g.mode = 'crosshair';
                const lx = (evt.nativeEvent as any).locationX ?? 0;
                const ci = clampVal(Math.floor((lx - PAD) / barW), 0, slice.length - 1);
                setSelBar(startI + ci);
              }
            }, 350);
          }
        },
        onPanResponderMove: (evt, gs) => {
          const g = gr.current;
          const touches = evt.nativeEvent.touches;

          if (g.mode === 'idle') {
            if (touches && touches.length >= 2) {
              if (g.timer) clearTimeout(g.timer);
              g.mode = 'pinch';
              const t = touches as any[];
              g.sDistX = Math.abs(t[0].pageX - t[1].pageX);
              g.sDistY = Math.abs(t[0].pageY - t[1].pageY);
              g.sScaleY = scaleY;
            } else if (Math.abs(gs.dx) > 2) {
              if (g.timer) clearTimeout(g.timer);
              g.mode = 'pan';
            }
          }

          if (g.mode === 'pan') {
            const rawBars = gs.dx / barW;
            const speedMult = 1.8;
            const dBars = Math.round(rawBars * speedMult);
            setScrollOff(clampVal(g.sScroll + dBars, minOff, maxOff));
          } else if (g.mode === 'pinch' && touches && touches.length >= 2) {
            const t = touches as any[];
            const distX = Math.abs(t[0].pageX - t[1].pageX);
            const distY = Math.abs(t[0].pageY - t[1].pageY);
            if (g.sDistX > 20) {
              const ratio = g.sDistX / distX;
              const dampedRatio = 1 + (ratio - 1) * 0.6;
              setVisCnt(clampVal(Math.round(g.sVis * dampedRatio), MIN_VIS, MAX_VIS));
            }
            if (g.sDistY > 20) {
              const ratioY = distY / g.sDistY;
              const dampedRatioY = 1 + (ratioY - 1) * 0.6;
              setScaleY(clampVal(g.sScaleY * dampedRatioY, 0.3, 5));
            }
          } else if (g.mode === 'crosshair') {
            const lx = (evt.nativeEvent as any).locationX ?? gs.moveX;
            const ci = clampVal(Math.floor((lx - PAD) / barW), 0, slice.length - 1);
            setSelBar(startI + ci);
          }
        },
        onPanResponderRelease: () => {
          const g = gr.current;
          if (g.timer) clearTimeout(g.timer);
          if (g.mode === 'crosshair') {
            setTimeout(() => setSelBar(null), 2500);
          }
          g.mode = 'idle';
        },
      }),
    [off, vis, barW, maxOff, minOff, slice.length, startI, scaleY],
  );

  const defsSvg = useMemo(() => (
    <Defs>
      <RadialGradient id="bgGlow" cx="50%" cy="40%" rx="60%" ry="50%">
        <Stop offset="0%" stopColor="#0a1e3a" stopOpacity={0.6} />
        <Stop offset="100%" stopColor={Colors.bg0} stopOpacity={0} />
      </RadialGradient>
      <LinearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor={Colors.border2} stopOpacity={0.4} />
        <Stop offset="50%" stopColor={Colors.border} stopOpacity={0.2} />
        <Stop offset="100%" stopColor={Colors.border2} stopOpacity={0.4} />
      </LinearGradient>
      <LinearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor={Colors.green} stopOpacity={0.15} />
        <Stop offset="50%" stopColor={Colors.green} stopOpacity={0.04} />
        <Stop offset="100%" stopColor={Colors.green} stopOpacity={0} />
      </LinearGradient>
      <LinearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor={Colors.red} stopOpacity={0} />
        <Stop offset="50%" stopColor={Colors.red} stopOpacity={0.04} />
        <Stop offset="100%" stopColor={Colors.red} stopOpacity={0.15} />
      </LinearGradient>
    </Defs>
  ), []);

  const gridSvg = useMemo(() => {
    const els: React.ReactNode[] = [];
    els.push(
      <Rect key="bgGlowRect" x={0} y={0} width={chartW} height={mainHeight} fill="url(#bgGlow)" />
    );
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = (mainHeight / steps) * i;
      els.push(
        <Line
          key={`g${i}`}
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={Colors.border2}
          strokeWidth={0.4}
          strokeDasharray="2,8"
          opacity={0.5}
        />,
      );
    }
    for (let i = 1; i < 4; i++) {
      const x = (chartW / 4) * i;
      els.push(
        <Line
          key={`gv${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={mainHeight}
          stroke={Colors.border}
          strokeWidth={0.3}
          strokeDasharray="1,12"
          opacity={0.3}
        />,
      );
    }
    return els;
  }, [mainHeight, chartW]);

  const volumeSvg = useMemo(() => {
    const vH = mainHeight * 0.14;
    return slice.map((c, i) => {
      const h = (c.v / volMax) * vH;
      if (h < 0.5) return null;
      const x = PAD + i * barW;
      const bull = c.c >= c.o;
      const baseColor = bull ? Colors.green : Colors.red;
      const bw = Math.max(0.5, barW - 1);
      return (
        <React.Fragment key={`v${i}`}>
          <Rect
            x={x + 0.5}
            y={mainHeight - h}
            width={bw}
            height={h}
            fill={baseColor}
            opacity={0.06}
          />
          <Rect
            x={x + bw * 0.2}
            y={mainHeight - h * 0.7}
            width={bw * 0.6}
            height={h * 0.7}
            fill={baseColor}
            opacity={0.1}
          />
        </React.Fragment>
      );
    });
  }, [slice, barW, volMax, mainHeight]);

  const cloudSvg = useMemo(() => {
    if (!indicators || indicatorToggles['cloud'] === false) return null;
    const sArr = indicators.advShort;
    const lArr = indicators.advLong;

    let bullD = '';
    let bearD = '';
    let segType: boolean | null = null;
    let segPts: { x: number; yS: number; yL: number }[] = [];

    const flush = () => {
      if (segPts.length < 2 || segType === null) {
        segPts = [];
        return;
      }
      let d = '';
      for (let j = 0; j < segPts.length; j++) {
        d +=
          j === 0
            ? `M${segPts[j].x.toFixed(1)},${segPts[j].yS.toFixed(1)}`
            : `L${segPts[j].x.toFixed(1)},${segPts[j].yS.toFixed(1)}`;
      }
      for (let j = segPts.length - 1; j >= 0; j--) {
        d += `L${segPts[j].x.toFixed(1)},${segPts[j].yL.toFixed(1)}`;
      }
      d += 'Z';
      if (segType) bullD += d;
      else bearD += d;
      segPts = [];
    };

    for (let i = 0; i < slice.length; i++) {
      const idx = startI + i;
      if (idx >= sArr.length || idx >= lArr.length) break;
      const sv = sArr[idx];
      const lv = lArr[idx];
      if (isNaN(sv) || isNaN(lv)) continue;
      const bull = sv >= lv;
      if (segType !== null && bull !== segType) {
        segPts.push({ x: toX(i), yS: toY(sv), yL: toY(lv) });
        flush();
      }
      segType = bull;
      segPts.push({ x: toX(i), yS: toY(sv), yL: toY(lv) });
    }
    flush();

    return (
      <>
        {bullD ? (
          <>
            <Path d={bullD} fill={Colors.green} opacity={0.04} />
            <Path d={bullD} fill={Colors.green} opacity={0.08} />
            <Path d={bullD} stroke={Colors.green} strokeWidth={0.5} fill="none" opacity={0.15} />
          </>
        ) : null}
        {bearD ? (
          <>
            <Path d={bearD} fill={Colors.red} opacity={0.04} />
            <Path d={bearD} fill={Colors.red} opacity={0.08} />
            <Path d={bearD} stroke={Colors.red} strokeWidth={0.5} fill="none" opacity={0.15} />
          </>
        ) : null}
      </>
    );
  }, [indicators, indicatorToggles, slice.length, startI, toX, toY]);

  const fibSvg = useMemo(() => {
    if (!indicators || indicatorToggles['fib'] === false) return null;
    const lastIdx = Math.min(endI - 1, indicators.fib500.length - 1);
    if (lastIdx < 0) return null;
    const levels = [
      { val: indicators.fib236[lastIdx], color: '#fde68a' },
      { val: indicators.fib382[lastIdx], color: '#fbbf24' },
      { val: indicators.fib500[lastIdx], color: '#f59e0b' },
      { val: indicators.fib618[lastIdx], color: '#d97706' },
      { val: indicators.fib786[lastIdx], color: '#b45309' },
    ];
    const els: React.ReactNode[] = [];
    levels.forEach((lv, i) => {
      if (isNaN(lv.val)) return;
      const y = toY(lv.val);
      if (y < -5 || y > mainHeight + 5) return;
      els.push(
        <Line
          key={`fibg${i}`}
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={hexToGlow(lv.color, 0.1)}
          strokeWidth={3}
        />
      );
      els.push(
        <Line
          key={`fib${i}`}
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={lv.color}
          strokeWidth={0.7}
          strokeDasharray="4,4"
          opacity={0.55}
        />
      );
    });
    return els;
  }, [indicators, indicatorToggles, endI, toY, mainHeight, chartW]);

  const candleSvg = useMemo(() => {
    return slice.map((c, i) => {
      const x = toX(i);
      const bull = c.c >= c.o;
      const col = bull ? Colors.green : Colors.red;
      const glowCol = bull ? hexToGlow(Colors.green, 0.2) : hexToGlow(Colors.red, 0.2);
      const bTop = toY(Math.max(c.o, c.c));
      const bBot = toY(Math.min(c.o, c.c));
      const bH = Math.max(1, bBot - bTop);
      const wTop = toY(c.h);
      const wBot = toY(c.l);
      const bw = Math.max(1, barW * 0.55);
      const glowW = bw + 4;
      return (
        <React.Fragment key={`c${i}`}>
          <Rect
            x={x - glowW / 2}
            y={bTop - 2}
            width={glowW}
            height={bH + 4}
            fill={glowCol}
            rx={2}
          />
          <Line x1={x} y1={wTop} x2={x} y2={wBot} stroke={col} strokeWidth={1} opacity={0.9} />
          <Rect
            x={x - bw / 2}
            y={bTop}
            width={bw}
            height={bH}
            fill={col}
            opacity={bull ? 0.9 : 0.95}
          />
          <Rect
            x={x - bw / 2 + 0.5}
            y={bTop + 0.5}
            width={Math.max(0, bw - 1)}
            height={Math.max(0, bH * 0.3)}
            fill="#ffffff"
            opacity={bull ? 0.08 : 0.04}
          />
        </React.Fragment>
      );
    });
  }, [slice, barW, toX, toY]);

  const overlayLinesSvg = useMemo(() => {
    if (!indicators) return null;
    const lines: { arr: number[]; color: string; dash?: boolean }[] = [];

    if (indicatorToggles['ema_cross'] !== false) {
      lines.push({ arr: indicators.emaShort, color: '#38bdf8' });
      lines.push({ arr: indicators.emaLong, color: '#64748b', dash: true });
    }
    if (indicatorToggles['stepped_ema'] !== false) {
      lines.push({ arr: indicators.emaRaw, color: '#f59e0b' });
      lines.push({ arr: indicators.emaStepped, color: '#fbbf24', dash: true });
    }
    if (indicatorToggles['combined'] !== false) {
      lines.push({ arr: indicators.combShort, color: '#fb923c' });
      lines.push({ arr: indicators.combLong, color: '#fdba74', dash: true });
    }
    if (indicatorToggles['cloud'] !== false) {
      lines.push({ arr: indicators.advShort, color: '#4ade80' });
      lines.push({ arr: indicators.advLong, color: '#86efac', dash: true });
      lines.push({ arr: indicators.advSma, color: '#fde68a', dash: true });
    }

    const els: React.ReactNode[] = [];
    lines.forEach((l, i) => {
      const d = buildLinePath(l.arr, startI, slice.length, barW, toY);
      if (!d) return;
      els.push(
        <Path
          key={`olg3-${i}`}
          d={d}
          stroke={hexToGlow(l.color, 0.08)}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      els.push(
        <Path
          key={`olg2-${i}`}
          d={d}
          stroke={hexToGlow(l.color, 0.15)}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      els.push(
        <Path
          key={`ol${i}`}
          d={d}
          stroke={l.color}
          strokeWidth={1.4}
          fill="none"
          strokeDasharray={l.dash ? '4,3' : undefined}
          opacity={0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
    return els;
  }, [indicators, indicatorToggles, startI, slice.length, barW, toY]);

  const signalsSvg = useMemo(() => {
    if (!indicators) return null;
    const marks: React.ReactNode[] = [];
    for (let i = 0; i < slice.length; i++) {
      const idx = startI + i;
      if (idx >= candles.length) break;
      const x = toX(i);
      const c = slice[i];
      let buy = false;
      let sell = false;

      if (indicatorToggles['ema_cross'] !== false) {
        if (indicators.emaCrossLong[idx]) buy = true;
        if (indicators.emaCrossShort[idx]) sell = true;
      }
      if (indicatorToggles['combined'] !== false) {
        if (indicators.combBuy[idx]) buy = true;
        if (indicators.combSell[idx]) sell = true;
      }
      if (indicatorToggles['cloud'] !== false) {
        if (indicators.goldenCross[idx]) buy = true;
        if (indicators.deathCross[idx]) sell = true;
      }

      if (buy) {
        const y = toY(c.l) + 6;
        marks.push(
          <Circle
            key={`buyg1-${idx}`}
            cx={x}
            cy={y + 2}
            r={8}
            fill={hexToGlow(Colors.green, 0.2)}
          />
        );
        marks.push(
          <Circle
            key={`buyg2-${idx}`}
            cx={x}
            cy={y + 2}
            r={5}
            fill={hexToGlow(Colors.green, 0.3)}
          />
        );
        marks.push(
          <Path
            key={`buy-${idx}`}
            d={`M${x - 4},${y + 6}L${x},${y}L${x + 4},${y + 6}Z`}
            fill={Colors.green}
            opacity={0.95}
          />,
        );
      }
      if (sell) {
        const y = toY(c.h) - 6;
        marks.push(
          <Circle
            key={`sellg1-${idx}`}
            cx={x}
            cy={y - 2}
            r={8}
            fill={hexToGlow(Colors.red, 0.2)}
          />
        );
        marks.push(
          <Circle
            key={`sellg2-${idx}`}
            cx={x}
            cy={y - 2}
            r={5}
            fill={hexToGlow(Colors.red, 0.3)}
          />
        );
        marks.push(
          <Path
            key={`sell-${idx}`}
            d={`M${x - 4},${y - 6}L${x},${y}L${x + 4},${y - 6}Z`}
            fill={Colors.red}
            opacity={0.95}
          />,
        );
      }
    }
    return marks;
  }, [indicators, indicatorToggles, slice, startI, candles.length, toX, toY]);

  const priceLineSvg = useMemo(() => {
    if (slice.length === 0) return null;
    const last = slice[slice.length - 1];
    const y = toY(last.c);
    const col = last.c >= last.o ? Colors.green : Colors.red;
    return (
      <>
        <Line
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={hexToGlow(col, 0.15)}
          strokeWidth={4}
        />
        <Line
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={col}
          strokeWidth={0.8}
          strokeDasharray="3,4"
          opacity={0.9}
        />
      </>
    );
  }, [slice, toY, chartW]);

  const tradingLevelsSvg = useMemo(() => {
    if (!tradingLevels) return null;
    const els: React.ReactNode[] = [];

    const drawLevel = (price: number, color: string, label: string, dashArr: string) => {
      if (price <= 0) return;
      const y = toY(price);
      if (y < -10 || y > mainHeight + 10) return;
      els.push(
        <Line
          key={`tlg-${label}`}
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={hexToGlow(color, 0.12)}
          strokeWidth={4}
        />,
      );
      els.push(
        <Line
          key={`tl-${label}`}
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={color}
          strokeWidth={1}
          strokeDasharray={dashArr}
          opacity={0.85}
        />,
      );
      els.push(
        <Rect
          key={`tlbg-${label}`}
          x={2}
          y={y - 8}
          width={label.length * 5.5 + 10}
          height={16}
          fill={hexToGlow(color, 0.2)}
          rx={3}
        />,
      );
    };

    if (tradingLevels.entry > 0) {
      drawLevel(tradingLevels.entry, ENTRY_COLOR, 'ENTRY', '4,3');
    }
    if (tradingLevels.stopLoss.enabled && tradingLevels.stopLoss.price > 0) {
      drawLevel(tradingLevels.stopLoss.price, SL_COLOR, 'SL', '6,3');
    }
    if (tradingLevels.trailingStop.enabled && tradingLevels.trailingStop.price > 0 && tradingLevels.entry > 0) {
      const tsPrice = tradingLevels.entry - tradingLevels.trailingStop.price;
      if (tsPrice > 0) drawLevel(tsPrice, TS_COLOR, 'TS', '3,3,6,3');
    }
    if (tradingLevels.tp1.enabled && tradingLevels.tp1.price > 0) {
      drawLevel(tradingLevels.tp1.price, TP1_COLOR, 'TP1', '6,2');
    }
    if (tradingLevels.tp2.enabled && tradingLevels.tp2.price > 0) {
      drawLevel(tradingLevels.tp2.price, TP2_COLOR, 'TP2', '6,2');
    }
    if (tradingLevels.tp3.enabled && tradingLevels.tp3.price > 0) {
      drawLevel(tradingLevels.tp3.price, TP3_COLOR, 'TP3', '6,2');
    }

    return els.length > 0 ? els : null;
  }, [tradingLevels, toY, mainHeight, chartW]);

  const crosshairSvg = useMemo(() => {
    if (selBar === null) return null;
    const vi = selBar - startI;
    if (vi < 0 || vi >= slice.length) return null;
    const x = toX(vi);
    const c = slice[vi];
    const y = toY(c.c);
    return (
      <>
        <Line
          x1={x}
          y1={0}
          x2={x}
          y2={mainHeight}
          stroke={Colors.amber}
          strokeWidth={0.5}
          strokeDasharray="2,3"
          opacity={0.6}
        />
        <Line
          x1={0}
          y1={y}
          x2={chartW}
          y2={y}
          stroke={Colors.amber}
          strokeWidth={0.5}
          strokeDasharray="2,3"
          opacity={0.6}
        />
        <Circle cx={x} cy={y} r={8} fill={hexToGlow(Colors.amber, 0.15)} />
        <Circle cx={x} cy={y} r={4} fill={hexToGlow(Colors.amber, 0.3)} />
        <Circle cx={x} cy={y} r={2.5} fill={Colors.amber} opacity={0.9} />
      </>
    );
  }, [selBar, startI, slice, toX, toY, mainHeight, chartW]);

  const infoBar = useMemo(() => {
    const vi =
      selBar !== null ? selBar - startI : slice.length - 1;
    const c = slice[clampVal(vi, 0, Math.max(0, slice.length - 1))];
    if (!c) return null;
    const bull = c.c >= c.o;
    return { o: c.o, h: c.h, l: c.l, c: c.c, v: c.v, bull };
  }, [selBar, startI, slice]);

  const priceLabels = useMemo(() => {
    const labels: { y: number; text: string }[] = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = (mainHeight / steps) * i;
      const price = pMax - (pRange / steps) * i;
      labels.push({ y, text: fmtPrice(price) });
    }
    return labels;
  }, [mainHeight, pMax, pRange]);

  const oscSvg = useMemo(() => {
    if (oscInfo.lines.length === 0) return null;
    const zeroY = toOscY(0);
    const els: React.ReactNode[] = [];
    els.push(
      <Line
        key="oscZero"
        x1={0}
        y1={zeroY}
        x2={chartW}
        y2={zeroY}
        stroke={Colors.border2}
        strokeWidth={0.5}
        opacity={0.6}
      />
    );
    oscInfo.lines.forEach((l, i) => {
      const d = buildLinePath(l.arr, startI, slice.length, barW, toOscY);
      if (!d) return;
      els.push(
        <Path
          key={`oscg3-${i}`}
          d={d}
          stroke={hexToGlow(l.color, 0.08)}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
        />
      );
      els.push(
        <Path
          key={`oscg2-${i}`}
          d={d}
          stroke={hexToGlow(l.color, 0.15)}
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
      );
      els.push(
        <Path
          key={`osc${i}`}
          d={d}
          stroke={l.color}
          strokeWidth={1.4}
          fill="none"
          opacity={0.9}
          strokeLinecap="round"
        />
      );
    });
    return els;
  }, [oscInfo, startI, slice.length, barW, toOscY, chartW]);

  const oscCrosshairSvg = useMemo(() => {
    if (selBar === null) return null;
    const vi = selBar - startI;
    if (vi < 0 || vi >= slice.length) return null;
    const x = toX(vi);
    return (
      <Line
        x1={x}
        y1={0}
        x2={x}
        y2={oscHeight}
        stroke={Colors.text2}
        strokeWidth={0.5}
        strokeDasharray="2,2"
      />
    );
  }, [selBar, startI, slice.length, toX, oscHeight]);

  if (slice.length === 0) {
    return (
      <View style={[styles.container, { width, height: mainHeight + oscHeight + 30 }]}>
        <Text style={styles.noData}>Loading chart data...</Text>
      </View>
    );
  }

  const lastCandle = slice[slice.length - 1];
  const lastY = toY(lastCandle.c);
  const lastBull = lastCandle.c >= lastCandle.o;
  const infoColor = infoBar?.bull ? Colors.green : Colors.red;

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.ohlcBar}>
        {infoBar && (
          <>
            <Text style={styles.ohlcItem}>
              <Text style={styles.ohlcKey}>O </Text>
              <Text style={[styles.ohlcVal, { color: infoColor }]}>
                {fmtPrice(infoBar.o)}
              </Text>
            </Text>
            <Text style={styles.ohlcItem}>
              <Text style={styles.ohlcKey}>H </Text>
              <Text style={[styles.ohlcVal, { color: infoColor }]}>
                {fmtPrice(infoBar.h)}
              </Text>
            </Text>
            <Text style={styles.ohlcItem}>
              <Text style={styles.ohlcKey}>L </Text>
              <Text style={[styles.ohlcVal, { color: infoColor }]}>
                {fmtPrice(infoBar.l)}
              </Text>
            </Text>
            <Text style={styles.ohlcItem}>
              <Text style={styles.ohlcKey}>C </Text>
              <Text style={[styles.ohlcVal, { color: infoColor }]}>
                {fmtPrice(infoBar.c)}
              </Text>
            </Text>
            <Text style={styles.ohlcItem}>
              <Text style={styles.ohlcKey}>V </Text>
              <Text style={styles.ohlcVolVal}>
                {Math.round(infoBar.v).toLocaleString()}
              </Text>
            </Text>
          </>
        )}
      </View>

      <View style={styles.chartRow} {...panResponder.panHandlers}>
        <Svg width={chartW} height={mainHeight}>
          <Rect x={0} y={0} width={chartW} height={mainHeight} fill={Colors.bg0} />
          {defsSvg}
          {gridSvg}
          {volumeSvg}
          {cloudSvg}
          {fibSvg}
          {candleSvg}
          {overlayLinesSvg}
          {signalsSvg}
          {priceLineSvg}
          {tradingLevelsSvg}
          {crosshairSvg}
        </Svg>
        <View style={[styles.priceAxis, { height: mainHeight, width: AXIS_W }]}>
          {priceLabels.map((pl, i) => (
            <Text key={`pl${i}`} style={[styles.axisLabel, { top: pl.y - 6 }]}>
              {pl.text}
            </Text>
          ))}
          <View
            style={[
              styles.currentTag,
              {
                top: clampVal(lastY - 9, 0, mainHeight - 18),
                backgroundColor: lastBull ? Colors.green : Colors.red,
              },
            ]}
          >
            <Text style={styles.currentTagText}>{fmtPrice(lastCandle.c)}</Text>
          </View>
          {tradingLevels && tradingLevels.entry > 0 && (
            <View
              style={[
                styles.levelTag,
                {
                  top: clampVal(toY(tradingLevels.entry) - 7, 0, mainHeight - 14),
                  backgroundColor: ENTRY_COLOR,
                },
              ]}
            >
              <Text style={styles.levelTagText}>EN</Text>
            </View>
          )}
          {tradingLevels?.stopLoss.enabled && tradingLevels.stopLoss.price > 0 && (
            <View
              style={[
                styles.levelTag,
                {
                  top: clampVal(toY(tradingLevels.stopLoss.price) - 7, 0, mainHeight - 14),
                  backgroundColor: SL_COLOR,
                },
              ]}
            >
              <Text style={styles.levelTagText}>SL</Text>
            </View>
          )}
          {tradingLevels?.trailingStop.enabled && tradingLevels.trailingStop.price > 0 && tradingLevels.entry > 0 && (
            <View
              style={[
                styles.levelTag,
                {
                  top: clampVal(toY(tradingLevels.entry - tradingLevels.trailingStop.price) - 7, 0, mainHeight - 14),
                  backgroundColor: TS_COLOR,
                },
              ]}
            >
              <Text style={styles.levelTagText}>TS</Text>
            </View>
          )}
          {tradingLevels?.tp1.enabled && tradingLevels.tp1.price > 0 && (
            <View
              style={[
                styles.levelTag,
                {
                  top: clampVal(toY(tradingLevels.tp1.price) - 7, 0, mainHeight - 14),
                  backgroundColor: TP1_COLOR,
                },
              ]}
            >
              <Text style={styles.levelTagText}>T1</Text>
            </View>
          )}
          {tradingLevels?.tp2.enabled && tradingLevels.tp2.price > 0 && (
            <View
              style={[
                styles.levelTag,
                {
                  top: clampVal(toY(tradingLevels.tp2.price) - 7, 0, mainHeight - 14),
                  backgroundColor: TP2_COLOR,
                },
              ]}
            >
              <Text style={styles.levelTagText}>T2</Text>
            </View>
          )}
          {tradingLevels?.tp3.enabled && tradingLevels.tp3.price > 0 && (
            <View
              style={[
                styles.levelTag,
                {
                  top: clampVal(toY(tradingLevels.tp3.price) - 7, 0, mainHeight - 14),
                  backgroundColor: TP3_COLOR,
                },
              ]}
            >
              <Text style={styles.levelTagText}>T3</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sep} />

      <View style={styles.chartRow}>
        <Svg width={chartW} height={oscHeight}>
          <Rect x={0} y={0} width={chartW} height={oscHeight} fill={Colors.bg0} />
          {oscSvg}
          {oscCrosshairSvg}
        </Svg>
        <View style={[styles.priceAxis, { height: oscHeight, width: AXIS_W }]}>
          <Text style={[styles.axisLabel, { top: 2 }]}>
            {oscInfo.max.toFixed(3)}
          </Text>
          <Text style={[styles.axisLabel, { top: oscHeight / 2 - 6 }]}>0</Text>
          <Text style={[styles.axisLabel, { top: oscHeight - 14 }]}>
            {oscInfo.min.toFixed(3)}
          </Text>
        </View>
      </View>

      <View style={styles.zoomBar}>
        <View style={styles.zoomControls}>
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              setVisCnt(clampVal(visCnt - 10, MIN_VIS, MAX_VIS));
            }}
            style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
          >
            <ZoomIn size={12} color={Colors.text2} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              setVisCnt(clampVal(visCnt + 10, MIN_VIS, MAX_VIS));
            }}
            style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
          >
            <ZoomOut size={12} color={Colors.text2} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              setScaleY(clampVal(scaleY + 0.2, 0.3, 5));
            }}
            style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
          >
            <ChevronUp size={12} color={Colors.text2} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              setScaleY(clampVal(scaleY - 0.2, 0.3, 5));
            }}
            style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
          >
            <ChevronDown size={12} color={Colors.text2} />
          </Pressable>
        </View>
        <Text style={styles.zoomText}>
          {vis} bars · H:{visCnt !== 80 ? `${(80 / visCnt).toFixed(1)}x` : '1.0x'} · V:{scaleY.toFixed(1)}x
        </Text>
      </View>
    </View>
  );
}

const TradingChart = React.memo(TradingChartInner);
export default TradingChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg0,
  },
  noData: {
    color: Colors.text3,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
  ohlcBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 10,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  ohlcItem: {
    fontSize: 9,
  },
  ohlcKey: {
    color: Colors.text3,
    fontWeight: '600' as const,
    fontSize: 9,
  },
  ohlcVal: {
    fontWeight: '700' as const,
    fontSize: 9,
  },
  ohlcVolVal: {
    color: Colors.text2,
    fontWeight: '600' as const,
    fontSize: 9,
  },
  chartRow: {
    flexDirection: 'row',
  },
  priceAxis: {
    backgroundColor: Colors.bg1,
    borderLeftWidth: 0.5,
    borderLeftColor: Colors.border,
  },
  axisLabel: {
    position: 'absolute' as const,
    right: 4,
    fontSize: 8,
    color: Colors.text2,
    fontWeight: '500' as const,
  },
  currentTag: {
    position: 'absolute' as const,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  currentTagText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: '700' as const,
  },
  levelTag: {
    position: 'absolute' as const,
    left: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  levelTagText: {
    fontSize: 7,
    color: Colors.white,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.border,
  },
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.bg1,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  zoomBtn: {
    width: 24,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnPressed: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border2,
  },
  zoomDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: 3,
  },
  zoomText: {
    fontSize: 8,
    color: Colors.text3,
    textAlign: 'right',
    fontWeight: '500' as const,
  },
});
