import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import Svg, { Line, Rect, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface ChartLine {
  data: number[];
  color: string;
  label: string;
  dashed?: boolean;
}

interface ScalableChartProps {
  candles?: { o: number; h: number; l: number; c: number }[];
  lines?: ChartLine[];
  width: number;
  height: number;
  showCandles?: boolean;
}

function getDistance(touches: { pageX: number; pageY: number }[]): { dx: number; dy: number } {
  if (touches.length < 2) return { dx: 0, dy: 0 };
  return {
    dx: Math.abs(touches[0].pageX - touches[1].pageX),
    dy: Math.abs(touches[0].pageY - touches[1].pageY),
  };
}

function hexToGlow(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ScalableChartInner({ candles, lines, width, height, showCandles = true }: ScalableChartProps) {
  const [scaleX, setScaleX] = useState<number>(1);
  const [scaleY, setScaleY] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);

  const baseScaleX = useRef<number>(1);
  const baseScaleY = useRef<number>(1);
  const initDist = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const initPanX = useRef<number>(0);
  const gestureType = useRef<'none' | 'pan' | 'pinch'>('none');
  const currentScaleX = useRef<number>(1);
  const currentScaleY = useRef<number>(1);
  const currentPanX = useRef<number>(0);

  currentScaleX.current = scaleX;
  currentScaleY.current = scaleY;
  currentPanX.current = panX;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          gestureType.current = 'none';
          if (touches && touches.length >= 2) {
            gestureType.current = 'pinch';
            baseScaleX.current = currentScaleX.current;
            baseScaleY.current = currentScaleY.current;
            initDist.current = getDistance(touches as any);
          } else {
            gestureType.current = 'pan';
            initPanX.current = currentPanX.current;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          if (touches && touches.length >= 2 && gestureType.current === 'pinch') {
            const dist = getDistance(touches as any);
            const initD = initDist.current;

            if (initD.dx > 10) {
              const ratioX = dist.dx / initD.dx;
              setScaleX(Math.max(0.5, Math.min(5, baseScaleX.current * ratioX)));
            }
            if (initD.dy > 10) {
              const ratioY = dist.dy / initD.dy;
              setScaleY(Math.max(0.5, Math.min(5, baseScaleY.current * ratioY)));
            }
          } else if (gestureType.current === 'pan') {
            setPanX(initPanX.current + gestureState.dx);
          }
        },
        onPanResponderRelease: () => {
          gestureType.current = 'none';
        },
      }),
    []
  );

  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return null;

    const totalBars = candles.length;
    const visibleBars = Math.max(5, Math.floor(totalBars / scaleX));
    const maxOffset = Math.max(0, totalBars - visibleBars);
    const rawOffset = Math.floor(-panX / (width / visibleBars));
    const offset = Math.max(0, Math.min(maxOffset, Math.floor(totalBars - visibleBars) - rawOffset));
    const slice = candles.slice(offset, offset + visibleBars);

    if (slice.length === 0) return null;

    let minVal = Infinity;
    let maxVal = -Infinity;
    slice.forEach((c) => {
      minVal = Math.min(minVal, c.l);
      maxVal = Math.max(maxVal, c.h);
    });

    if (lines) {
      lines.forEach((line) => {
        const lineSlice = line.data.slice(offset, offset + visibleBars);
        lineSlice.forEach((v) => {
          if (!isNaN(v) && isFinite(v)) {
            minVal = Math.min(minVal, v);
            maxVal = Math.max(maxVal, v);
          }
        });
      });
    }

    const range = maxVal - minVal;
    const yPadding = range * 0.1 * (1 / scaleY);
    const adjMin = minVal - yPadding;
    const adjMax = maxVal + yPadding;
    const adjRange = adjMax - adjMin;

    const chartPad = 2;
    const barW = (width - chartPad * 2) / slice.length;

    return { slice, offset, visibleBars, adjMin, adjRange, barW, chartPad };
  }, [candles, scaleX, scaleY, panX, width, lines]);

  const toY = useCallback(
    (val: number) => {
      if (!chartData) return 0;
      return height - ((val - chartData.adjMin) / chartData.adjRange) * height;
    },
    [chartData, height]
  );

  if (!chartData || !candles) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noData}>No data</Text>
      </View>
    );
  }

  const { slice, offset, barW, chartPad } = chartData;

  const candleElements: React.ReactNode[] = [];
  if (showCandles) {
    slice.forEach((c, i) => {
      const x = chartPad + i * barW + barW / 2;
      const isBull = c.c >= c.o;
      const color = isBull ? Colors.green : Colors.red;
      const glowCol = hexToGlow(color, 0.18);
      const bodyTop = toY(Math.max(c.o, c.c));
      const bodyBot = toY(Math.min(c.o, c.c));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      const wickTop = toY(c.h);
      const wickBot = toY(c.l);
      const bw = Math.max(1, barW * 0.6);
      const glowW = bw + 3;

      candleElements.push(
        <React.Fragment key={`c-${i}`}>
          <Rect
            x={x - glowW / 2}
            y={bodyTop - 1}
            width={glowW}
            height={bodyH + 2}
            fill={glowCol}
            rx={1.5}
          />
          <Line x1={x} y1={wickTop} x2={x} y2={wickBot} stroke={color} strokeWidth={1} opacity={0.9} />
          <Rect
            x={x - bw / 2}
            y={bodyTop}
            width={bw}
            height={bodyH}
            fill={color}
            opacity={isBull ? 0.85 : 0.92}
          />
          <Rect
            x={x - bw / 2 + 0.5}
            y={bodyTop + 0.5}
            width={Math.max(0, bw - 1)}
            height={Math.max(0, bodyH * 0.25)}
            fill="#ffffff"
            opacity={isBull ? 0.07 : 0.03}
          />
        </React.Fragment>
      );
    });
  }

  const lineElements: React.ReactNode[] = [];
  if (lines) {
    lines.forEach((line, li) => {
      const lineSlice = line.data.slice(offset, offset + slice.length);
      let pathD = '';
      let started = false;
      lineSlice.forEach((v, i) => {
        if (isNaN(v) || !isFinite(v)) return;
        const x = chartPad + i * barW + barW / 2;
        const y = toY(v);
        if (!started) {
          pathD += `M${x},${y}`;
          started = true;
        } else {
          pathD += `L${x},${y}`;
        }
      });
      if (pathD) {
        lineElements.push(
          <Path
            key={`lineg3-${li}`}
            d={pathD}
            stroke={hexToGlow(line.color, 0.07)}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
        lineElements.push(
          <Path
            key={`lineg2-${li}`}
            d={pathD}
            stroke={hexToGlow(line.color, 0.14)}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
        lineElements.push(
          <Path
            key={`line-${li}`}
            d={pathD}
            stroke={line.color}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray={line.dashed ? '4,3' : undefined}
            opacity={0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
    });
  }

  return (
    <View style={[styles.container, { width, height }]} {...panResponder.panHandlers}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="scBgGlow" cx="50%" cy="40%" rx="60%" ry="50%">
            <Stop offset="0%" stopColor="#0a1e3a" stopOpacity={0.5} />
            <Stop offset="100%" stopColor={Colors.bg0} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={Colors.bg0} rx={6} />
        <Rect x={0} y={0} width={width} height={height} fill="url(#scBgGlow)" rx={6} />
        {[0.25, 0.5, 0.75].map((pct) => (
          <Line
            key={`grid-${pct}`}
            x1={0}
            y1={height * pct}
            x2={width}
            y2={height * pct}
            stroke={Colors.border2}
            strokeWidth={0.4}
            strokeDasharray="2,6"
            opacity={0.5}
          />
        ))}
        {candleElements}
        {lineElements}
      </Svg>
      <View style={styles.scaleIndicator}>
        <Text style={styles.scaleText}>
          {scaleX.toFixed(1)}x / {scaleY.toFixed(1)}x
        </Text>
      </View>
    </View>
  );
}

const ScalableChart = React.memo(ScalableChartInner);
export default ScalableChart;

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.bg0,
  },
  noData: {
    color: Colors.text3,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
  },
  scaleIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(4,8,13,0.75)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: Colors.border2,
  },
  scaleText: {
    color: Colors.amber,
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
