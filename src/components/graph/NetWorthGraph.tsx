import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, PanResponder } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Circle,
  Group,
  DashPathEffect,
} from '@shopify/react-native-skia';
import type { SeriesPoint } from '@/types';

export interface ScrubInfo {
  ts: number;
  value: number;
  value2: number | null;
  x: number;
  y: number;
  y2: number | null;
}

interface Props {
  series: SeriesPoint[];
  series2?: SeriesPoint[];
  series2Style?: 'dashed' | 'solid';
  series2Color?: string;
  height?: number;
  padTop?: number;
  padBottom?: number;
  padX?: number;
  color?: string;
  fillGradient?: boolean;
  isDark?: boolean;
  showAxis?: boolean;
  showCrosshair?: boolean;
  onScrub?: (info: ScrubInfo | null) => void;
  thick?: number;
  yDomainFrom?: [number, number];
  showZero?: boolean;
}

// Catmull-Rom → cubic Bezier SVG path (same algorithm as design-reference/graph.jsx)
function smoothSvgPath(pts: [number, number][]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function NetWorthGraph({
  series,
  series2,
  series2Style = 'dashed',
  series2Color,
  height = 180,
  padTop = 16,
  padBottom = 18,
  padX = 12,
  color = '#3B82F6',
  fillGradient = true,
  isDark = false,
  showAxis = true,
  showCrosshair = true,
  onScrub,
  thick = 2.5,
  yDomainFrom,
  showZero = false,
}: Props) {
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number; y2: number | null } | null>(null);

  // Computed pixel positions for every series point
  const { pts, pts2 } = useMemo(() => {
    if (width === 0 || series.length === 0) {
      return { pts: [] as [number, number][], pts2: null };
    }

    const allVals = [
      ...series.map((p) => p.value),
      ...(series2 ? series2.map((p) => p.value) : []),
    ];
    let minV = Math.min(...allVals);
    let maxV = Math.max(...allVals);

    if (yDomainFrom) { minV = yDomainFrom[0]; maxV = yDomainFrom[1]; }
    if (showZero) { minV = Math.min(minV, 0); maxV = Math.max(maxV, 0); }

    const span = Math.max(1, maxV - minV);
    const yMin = minV - span * 0.08;
    const yMax = maxV + span * 0.08;

    const tMin = series[0].ts;
    const tMax = series[series.length - 1].ts;
    const tSpan = Math.max(1, tMax - tMin);

    const xOf = (ts: number) => padX + ((ts - tMin) / tSpan) * (width - padX * 2);
    const yOf = (v: number) =>
      padTop + (1 - (v - yMin) / (yMax - yMin)) * (height - padTop - padBottom);

    const pts = series.map((p) => [xOf(p.ts), yOf(p.value)] as [number, number]);
    const pts2 = series2
      ? series2.map((p) => [xOf(p.ts), yOf(p.value)] as [number, number])
      : null;

    return { pts, pts2 };
  }, [series, series2, width, height, padTop, padBottom, padX, yDomainFrom, showZero]);

  // Build Skia paths from computed pixel coords
  const { linePath, areaPath, line2Path, axisPath } = useMemo(() => {
    if (pts.length === 0) {
      // Flat axis line when no data
      const ap = Skia.Path.Make();
      ap.moveTo(padX, height - padBottom);
      ap.lineTo(width > 0 ? width - padX : 0, height - padBottom);
      return { linePath: null, areaPath: null, line2Path: null, axisPath: ap };
    }

    const svgLine = smoothSvgPath(pts);
    const svgArea = `${svgLine} L ${pts[pts.length - 1][0].toFixed(2)} ${(height - padBottom).toFixed(2)} L ${pts[0][0].toFixed(2)} ${(height - padBottom).toFixed(2)} Z`;

    const linePath = Skia.Path.MakeFromSVGString(svgLine);
    const areaPath = Skia.Path.MakeFromSVGString(svgArea);
    const line2Path = pts2 ? Skia.Path.MakeFromSVGString(smoothSvgPath(pts2)) : null;

    const axisPath = Skia.Path.Make();
    axisPath.moveTo(padX, height - padBottom);
    axisPath.lineTo(width - padX, height - padBottom);

    return { linePath, areaPath, line2Path, axisPath };
  }, [pts, pts2, width, height, padBottom, padX]);

  // Crosshair path (recomputed when hover changes)
  const crosshairPath = useMemo(() => {
    if (!hover) return null;
    const p = Skia.Path.Make();
    p.moveTo(hover.x, padTop);
    p.lineTo(hover.x, height - padBottom);
    return p;
  }, [hover, padTop, height, padBottom]);

  // Use refs so PanResponder (created once) always calls the latest versions
  const handleScrubRef = useRef<(x: number) => void>(() => {});
  const clearScrubRef = useRef<() => void>(() => {});

  handleScrubRef.current = useCallback(
    (x: number) => {
      if (pts.length === 0) return;
      let nearestI = 0;
      let nearestD = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.abs(pts[i][0] - x);
        if (d < nearestD) { nearestD = d; nearestI = i; }
      }
      const hx = pts[nearestI][0];
      const hy = pts[nearestI][1];
      const hy2 = pts2 ? pts2[nearestI][1] : null;
      setHover({ x: hx, y: hy, y2: hy2 });
      onScrub?.({
        ts: series[nearestI].ts,
        value: series[nearestI].value,
        value2: series2 ? series2[nearestI].value : null,
        x: hx, y: hy, y2: hy2,
      });
    },
    [pts, pts2, series, series2, onScrub]
  );

  clearScrubRef.current = useCallback(() => {
    setHover(null);
    onScrub?.(null);
  }, [onScrub]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleScrubRef.current(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleScrubRef.current(e.nativeEvent.locationX),
      onPanResponderRelease: () => clearScrubRef.current(),
      onPanResponderTerminate: () => clearScrubRef.current(),
    })
  ).current;

  const gradientTopColor = hexAlpha(color, isDark ? 0.45 : 0.32);
  const axisColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bgColor = isDark ? '#0B0B12' : '#FFFFFF';
  const sec2Color = series2Color ?? color;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
      style={{ width: '100%', height }}
    >
      {width > 0 && (
        <Canvas style={{ width, height }}>
          {/* Axis */}
          {showAxis && axisPath && (
            <Path path={axisPath} style="stroke" strokeWidth={1} color={axisColor} />
          )}

          {/* Area fill */}
          {fillGradient && areaPath && (
            <Path path={areaPath} style="fill">
              <LinearGradient
                start={vec(0, padTop)}
                end={vec(0, height - padBottom)}
                colors={[gradientTopColor, 'transparent']}
              />
            </Path>
          )}

          {/* Second line (behind primary) */}
          {line2Path && (
            <Path
              path={line2Path}
              style="stroke"
              strokeWidth={thick - 0.5}
              color={sec2Color}
              opacity={series2Style === 'dashed' ? 0.85 : 1}
            >
              {series2Style === 'dashed' && (
                <DashPathEffect intervals={[4, 4]} phase={0} />
              )}
            </Path>
          )}

          {/* Primary line */}
          {linePath && (
            <Path
              path={linePath}
              style="stroke"
              strokeWidth={thick}
              strokeJoin="round"
              strokeCap="round"
              color={color}
            />
          )}

          {/* Crosshair */}
          {showCrosshair && hover && crosshairPath && (
            <Group>
              <Path
                path={crosshairPath}
                style="stroke"
                strokeWidth={1}
                color={color}
                opacity={0.4}
              >
                <DashPathEffect intervals={[3, 3]} phase={0} />
              </Path>
              {/* Background circle (hides line behind dot) */}
              <Circle cx={hover.x} cy={hover.y} r={5} color={bgColor} />
              {/* Coloured ring */}
              <Circle
                cx={hover.x}
                cy={hover.y}
                r={5}
                style="stroke"
                strokeWidth={2}
                color={color}
              />
            </Group>
          )}
        </Canvas>
      )}
    </View>
  );
}
