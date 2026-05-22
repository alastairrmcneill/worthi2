// graph.jsx — Worthi shared line/area graph with scrub interaction
// Renders a smooth line over a series of {ts, value} samples.
// Configurable color, gradient fill, dashed second line, dark mode.
// Reports the hovered ts/value via onScrub(null) to clear.

function LineGraph({
  series,            // [{ts, value}] primary
  series2,          // optional 2nd line
  series2Style = 'dashed', // 'dashed' | 'solid'
  series2Color,
  width = 360,
  height = 180,
  padTop = 16,
  padBottom = 18,
  padX = 12,
  color = '#3B82F6',
  fillGradient = true,
  dark = false,
  showAxis = true,
  showCrosshair = true,
  onScrub,           // (info | null) => void
  rangeKey,          // shown as label on left (optional)
  thick = 2.5,
  yDomainFrom,       // optional [min, max] override
  showZero = false,
}) {
  const svgRef = React.useRef(null);
  const [hoverX, setHoverX] = React.useState(null);

  // Combined series for y-domain
  const allVals = series.map(p => p.value).concat(series2 ? series2.map(p => p.value) : []);
  let minV = Math.min(...allVals), maxV = Math.max(...allVals);
  if (yDomainFrom) { minV = yDomainFrom[0]; maxV = yDomainFrom[1]; }
  if (showZero) { minV = Math.min(minV, 0); maxV = Math.max(maxV, 0); }
  // Padding the y-domain so the line doesn't kiss the edges
  const span = Math.max(1, maxV - minV);
  const yMin = minV - span * 0.08;
  const yMax = maxV + span * 0.08;

  const tMin = series[0]?.ts ?? 0;
  const tMax = series[series.length - 1]?.ts ?? 1;

  const xOf = (ts) => padX + ((ts - tMin) / Math.max(1, tMax - tMin)) * (width - padX * 2);
  const yOf = (v) => padTop + (1 - (v - yMin) / (yMax - yMin)) * (height - padTop - padBottom);

  // Smoothed Catmull-Rom → cubic Bezier path
  function smoothPath(pts) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }

  const pts = series.map(p => [xOf(p.ts), yOf(p.value)]);
  const pts2 = series2 ? series2.map(p => [xOf(p.ts), yOf(p.value)]) : null;
  const linePath = smoothPath(pts);
  const line2Path = pts2 ? smoothPath(pts2) : null;
  const areaPath = linePath
    ? `${linePath} L ${pts[pts.length - 1][0].toFixed(2)} ${(height - padBottom).toFixed(2)} L ${pts[0][0].toFixed(2)} ${(height - padBottom).toFixed(2)} Z`
    : '';

  // Scrub handler
  function handlePointer(e) {
    if (!svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const xPx = e.clientX - r.left;
    const x = (xPx / r.width) * width;
    if (x < padX || x > width - padX) { setHoverX(null); onScrub && onScrub(null); return; }
    // Find nearest sample
    let nearestI = 0, nearestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i][0] - x);
      if (d < nearestD) { nearestD = d; nearestI = i; }
    }
    setHoverX(pts[nearestI][0]);
    onScrub && onScrub({
      ts: series[nearestI].ts,
      value: series[nearestI].value,
      value2: series2 ? series2[nearestI].value : null,
      x: pts[nearestI][0],
      y: pts[nearestI][1],
      y2: pts2 ? pts2[nearestI][1] : null,
    });
  }

  function handleLeave() { setHoverX(null); onScrub && onScrub(null); }

  // Build a unique gradient id
  const gid = React.useMemo(() => 'g' + Math.random().toString(36).slice(2, 8), []);
  const axisColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

  // Hover info
  const hover = hoverX !== null ? (() => {
    let nearestI = 0, nearestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i][0] - hoverX);
      if (d < nearestD) { nearestD = d; nearestI = i; }
    }
    return { x: pts[nearestI][0], y: pts[nearestI][1] };
  })() : null;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height={height}
      style={{ display: 'block', touchAction: 'pan-y', cursor: 'crosshair' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') handlePointer(e); else if (hoverX !== null) handlePointer(e); }}
      onPointerLeave={handleLeave}
      onPointerUp={handleLeave}
      onPointerCancel={handleLeave}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={dark ? 0.45 : 0.32} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Hover guidelines drawn under the line for low visual weight */}
      {showAxis && (
        <line x1={padX} x2={width - padX} y1={height - padBottom} y2={height - padBottom}
          stroke={axisColor} strokeWidth="1" />
      )}

      {fillGradient && <path d={areaPath} fill={`url(#${gid})`} />}

      {line2Path && (
        <path d={line2Path} fill="none" stroke={series2Color || color} strokeWidth={thick - 0.5}
          strokeDasharray={series2Style === 'dashed' ? '4 4' : undefined}
          strokeOpacity={series2Style === 'dashed' ? 0.85 : 1} />
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={thick} strokeLinejoin="round" strokeLinecap="round" />

      {/* Crosshair */}
      {showCrosshair && hover && (
        <g>
          <line x1={hover.x} x2={hover.x} y1={padTop} y2={height - padBottom}
            stroke={color} strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={hover.x} cy={hover.y} r={5} fill={dark ? '#0B0B0F' : '#fff'} stroke={color} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

// Compact range pill selector
function RangePicker({ value, onChange, dark, style = 'vibrant' }) {
  const baseFg = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const activeBg = style === 'vibrant'
    ? (dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)')
    : (dark ? 'rgba(255,255,255,0.10)' : '#1A1714');
  const activeFg = style === 'vibrant'
    ? (dark ? '#fff' : '#111')
    : (dark ? '#FAF9F6' : '#FAF9F6');
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {RANGES.map(r => {
        const active = r.key === value;
        return (
          <button key={r.key} onClick={() => onChange(r.key)}
            style={{
              appearance: 'none', border: 0, cursor: 'pointer',
              padding: '5px 10px', borderRadius: 8,
              background: active ? activeBg : 'transparent',
              color: active ? activeFg : baseFg,
              fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
              fontFamily: 'inherit',
            }}>{r.label}</button>
        );
      })}
    </div>
  );
}

Object.assign(window, { LineGraph, RangePicker });
