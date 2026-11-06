/* ================================================================
   UI primitives: icons, triangle, charts, medals, celebrations
   ================================================================ */
const { useState, useEffect, useRef, useMemo, useCallback, useId, Fragment } = React;
const html = htm.bind(React.createElement);

function useStore() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  useEffect(() => { Store.listeners.add(force); return () => Store.listeners.delete(force); }, []);
  return Store.state;
}
const Router = { go: () => {}, coach: () => {} };
const go = (page, param) => Router.go(page, param);

/* ---------- Icons (24px grid, stroked) ---------- */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7',
  pen: 'M15.5 4.5l4 4L9 19l-5 1 1-5zM13.5 6.5l4 4',
  book: 'M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5',
  columns: 'M3 21h18M5 18h14M6 10v8M10 10v8M14 10v8M18 10v8M3.5 10h17L12 3.5z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4.5A2.5 2.5 0 0 0 7 10.5M17 6h2.5A2.5 2.5 0 0 1 17 10.5',
  shield: 'M12 3l8 3v6c0 4.6-3.4 8.2-8 9-4.6-.8-8-4.4-8-9V6z',
  heart: 'M12 20s-7.5-4.6-9.2-9.4A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 9.2 4c-1.7 4.8-9.2 9.4-9.2 9.4z',
  scale: 'M12 4v16M7 20h10M5 7h14M5 7l-3 7a3.2 3.2 0 0 0 6 0zM19 7l-3 7a3.2 3.2 0 0 0 6 0z',
  bolt: 'M13 2 4.5 13.5H11L10 22l8.5-11.5H12z',
  sparkles: 'M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9zM18.5 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z',
  flame: 'M12 22a7 7 0 0 0 7-7c0-4.5-3.5-6.5-4.5-10.5C12.5 6.5 11.7 8.6 12 11c-1.4-.6-2.4-2-2.6-3.6C7 9.6 5 12 5 15a7 7 0 0 0 7 7z',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7',
  pause: 'M8 5v14M16 5v14',
  triangle: 'M12 3.5 21.5 20h-19z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  chevR: 'M9 5l7 7-7 7',
  chevL: 'M15 5l-7 7 7 7',
  arrowR: 'M4 12h16M14 6l6 6-6 6',
  arrowL: 'M20 12H4M10 6l-6 6 6 6',
  play: 'M7 4.5v15l12.5-7.5z',
  volume: 'M4 9.5v5h4l5 4.5v-14l-5 4.5zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11',
  volumeOff: 'M4 9.5v5h4l5 4.5v-14l-5 4.5zM17 9.5l5 5M22 9.5l-5 5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  lock: [{ rect: [5, 11, 14, 10, 2] }, 'M8 11V8a4 4 0 0 1 8 0v3'],
  clock: [{ c: [12, 12, 9] }, 'M12 7v5l3.5 2'],
  message: 'M4 5h16v11H10l-5 4v-4H4z',
  file: 'M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8zM14 3v5h5M9 13h6M9 17h4',
  wave: 'M3 12h1.5M7 8v8M10.5 4.5v15M14 9v6M17.5 6.5v11M21 12h-.5',
  trash: 'M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13.5h10L18 7',
  download: 'M12 4v11M7 10.5l5 5 5-5M4 20h16',
  refresh: 'M20 11.5A8 8 0 1 0 17.7 17M20 4v7.5h-7.5',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z',
  quote: 'M10 7H6.5A1.5 1.5 0 0 0 5 8.5V12h4v1c0 2-1 3.5-3 4.5M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12h4v1c0 2-1 3.5-3 4.5',
  slides: 'M3 4h18M4.5 4v11.5h15V4M12 15.5V19M8 21l4-2 4 2',
  plus: 'M12 5v14M5 12h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  info: [{ c: [12, 12, 9] }, 'M12 11v6M12 7.5v.01'],
  alert: 'M12 3.5 22 20.5H2zM12 10v4.5M12 17.5v.01',
  gift: 'M4 11h16v10H4zM3 7.5h18V11H3zM12 7.5V21M12 7.5C10.5 3.5 6.5 4 7.5 7.5M12 7.5c1.5-4 5.5-3.5 4.5 0',
  video: [{ rect: [3, 6, 13, 12, 2] }, 'M16 10.5l5-3v9l-5-3z'],
  cloud: 'M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 10z',
  laptop: [{ rect: [4, 5, 16, 11, 1.5] }, 'M2 19.5h20'],
  stop: [{ rect: [6, 6, 12, 12, 2] }],
  target: [{ c: [12, 12, 9] }, { c: [12, 12, 5] }, { c: [12, 12, 1.2] }],
  send: 'M4 12 20 4l-6 16-2.5-6.5zM11.5 13.5 20 4',
  type: 'M5 6V4h14v2M12 4v16M9 20h6',
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', { c: [12, 12, 3] }],
  lamp: 'M8 3h8l2.5 6h-13zM12 9v2M7 21l5-10 5 10',
  laurel: 'M12 21V9M12 9c-3-1-5-3.5-5-6.5 3 .5 5 3 5 6.5zM12 13c-3.2-.6-5.6-2.8-6-5.8 3.1.3 5.5 2.6 6 5.8zM12 13c3.2-.6 5.6-2.8 6-5.8-3.1.3-5.5 2.6-6 5.8zM12 9c3-1 5-3.5 5-6.5-3 .5-5 3-5 6.5z',
};
function Icon({ name, size = 20, stroke = 2, className = '', style }) {
  const def = ICONS[name] || ICONS.info;
  const parts = Array.isArray(def) ? def : [def];
  return html`<svg className=${'ic ' + className} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style=${style}>
    ${parts.map((p, i) => (typeof p === 'string'
      ? html`<path key=${i} d=${p} />`
      : p.c ? html`<circle key=${i} cx=${p.c[0]} cy=${p.c[1]} r=${p.c[2]} />`
        : html`<rect key=${i} x=${p.rect[0]} y=${p.rect[1]} width=${p.rect[2]} height=${p.rect[3]} rx=${p.rect[4]} />`))}
  </svg>`;
}
function LogoMark({ size = 30, ink = 'var(--ink)' }) {
  return html`<svg width=${size} height=${size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 5 27.5 25.5h-23z" style=${{ fill: 'none', stroke: ink, strokeWidth: 2.4, strokeLinejoin: 'round' }} />
    <circle cx="16" cy="5" r="3.7" style=${{ fill: 'var(--ethos)' }} />
    <circle cx="4.5" cy="25.5" r="3.7" style=${{ fill: 'var(--pathos)' }} />
    <circle cx="27.5" cy="25.5" r="3.7" style=${{ fill: 'var(--logos)' }} />
  </svg>`;
}

/* ---------- Numbers ---------- */
function CountUp({ value, dur = 1100, decimals = 0 }) {
  const [v, setV] = useState(value == null ? null : value * 0.35);
  const from = useRef(v == null ? 0 : v);
  useEffect(() => {
    if (value == null) { setV(null); return; }
    if (reducedMotion()) { setV(value); from.current = value; return; }
    const a = from.current ?? 0, start = performance.now();
    let raf;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = a + (value - a) * e;
      from.current = cur; setV(cur);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  if (v == null) return '–';
  return decimals ? v.toFixed(decimals) : String(Math.round(v));
}
function Ring({ value, size = 120, stroke = 12, color = 'var(--ink)', label }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(value ?? 0), 60); return () => clearTimeout(t); }, [value]);
  return html`<div className="ring" style=${{ width: size, height: size }}>
    <svg width=${size} height=${size}>
      <circle className="ring-track" cx=${size / 2} cy=${size / 2} r=${r} strokeWidth=${stroke} />
      <circle className="ring-val" cx=${size / 2} cy=${size / 2} r=${r} strokeWidth=${stroke} style=${{ stroke: color, strokeDasharray: c, strokeDashoffset: c * (1 - clamp(shown, 0, 100) / 100) }} />
    </svg>
    <div className="ring-center"><b style=${{ fontSize: Math.round(size * 0.3) }}><${CountUp} value=${value} /></b>${label ? html`<span className="tiny muted" style=${{ fontWeight: 700 }}>${label}</span>` : null}</div>
  </div>`;
}
function Bar({ value, color, className = '' }) {
  return html`<div className=${'bar ' + className}><i style=${{ width: clamp(value || 0, 0, 100) + '%', '--c': color }}></i></div>`;
}
function Delta({ value }) {
  if (value == null || value === 0) return null;
  return html`<span className=${'delta ' + (value > 0 ? 'up' : 'down')}>${value > 0 ? '▲' : '▼'} ${Math.abs(value)}</span>`;
}
function TierMedal({ score }) {
  const t = tierOf(score);
  return html`<span className="medal" style=${{ '--mc': t.color }}><i></i>${t.name}</span>`;
}

/* ---------- The triangle ---------- */
const TRI_V = { ethos: [210, 74], pathos: [52, 348], logos: [368, 348] };
const TRI_C = [(210 + 52 + 368) / 3, (74 + 348 + 348) / 3];
function triPoint(k, s) {
  const [vx, vy] = TRI_V[k];
  const f = clamp(s == null ? 0 : s, 0, 104) / 100;
  return [TRI_C[0] + (vx - TRI_C[0]) * f, TRI_C[1] + (vy - TRI_C[1]) * f];
}
function triPath(sc) {
  return POLE_KEYS.map((k, i) => (i ? 'L' : 'M') + triPoint(k, sc ? sc[k] : 0).map((n) => n.toFixed(1)).join(' ')).join(' ') + 'Z';
}
function stylePoint(sc) {
  const vals = POLE_KEYS.map((k) => (sc[k] == null ? 0 : sc[k]));
  const m = mean(vals);
  const w = vals.map((v) => Math.exp((v - m) / 12));
  const sw = w.reduce((a, b) => a + b, 0);
  let x = 0, y = 0;
  POLE_KEYS.forEach((k, i) => { x += (TRI_V[k][0] * w[i]) / sw; y += (TRI_V[k][1] * w[i]) / sw; });
  return [TRI_C[0] + (x - TRI_C[0]) * 0.8, TRI_C[1] + (y - TRI_C[1]) * 0.8];
}
function sectorPath(k) {
  const i = POLE_KEYS.indexOf(k);
  const a = TRI_V[k], b = TRI_V[POLE_KEYS[(i + 1) % 3]], c = TRI_V[POLE_KEYS[(i + 2) % 3]];
  const mab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], mac = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
  return `M${TRI_C[0]} ${TRI_C[1]} L${mab[0]} ${mab[1]} L${a[0]} ${a[1]} L${mac[0]} ${mac[1]} Z`;
}
const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function useAnimatedScores(target, dur = 1000) {
  const key = POLE_KEYS.map((k) => (target && target[k] != null ? target[k] : 'n')).join(',');
  const init = () => { const o = {}; POLE_KEYS.forEach((k) => { o[k] = target && target[k] != null ? target[k] * 0.62 : 0; }); return o; };
  const [val, setVal] = useState(init);
  const cur = useRef(val);
  useEffect(() => {
    const goal = {}; POLE_KEYS.forEach((k) => { goal[k] = target && target[k] != null ? target[k] : 0; });
    if (reducedMotion()) { cur.current = goal; setVal(goal); return; }
    const from = { ...cur.current }, start = performance.now();
    let raf;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1), e = easeOutBack(t);
      const v = {}; POLE_KEYS.forEach((k) => { v[k] = from[k] + (goal[k] - from[k]) * e; });
      cur.current = v; setVal(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [key]);
  return val;
}
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/* Three stage lights mixing additively: equal and bright reads as white light (the balanced orator),
   one dominant light tints the mix. Pure; returns an rgb() string. Prefers the art module's mixer. */
const UI_LIGHTS = { ethos: [64, 108, 255], pathos: [255, 52, 92], logos: [28, 226, 168] };
const UI_STAGE_COLOR = { ethos: 'var(--stage-ethos)', pathos: 'var(--stage-pathos)', logos: 'var(--stage-logos)' };
function uiLightColor(sc, whiten = 0.78) {
  const f = POLE_KEYS.map((k) => clamp(sc && sc[k] != null && isFinite(sc[k]) ? sc[k] / 100 : 0, 0, 1));
  const w = f.map((x) => x * x);
  let rgb = [0, 0, 0];
  POLE_KEYS.forEach((k, i) => { for (let c = 0; c < 3; c++) rgb[c] += UI_LIGHTS[k][c] * w[i]; });
  const mx = Math.max(rgb[0], rgb[1], rgb[2]);
  if (!(mx > 0)) return 'rgb(150 158 196)';
  rgb = rgb.map((v) => (v / mx) * 255);
  const hi = Math.max(...f), lo = Math.min(...f);
  const balance = hi > 0 ? 1 - (hi - lo) / hi : 0;
  const white = Math.pow(clamp(balance, 0, 1), 1.6) * whiten;
  return 'rgb(' + rgb.map((v) => Math.round(v + (255 - v) * white)).join(' ') + ')';
}
function triLight(sc) {
  try {
    if (typeof limelightColor === 'function') { const c = limelightColor(sc); if (typeof c === 'string' && c) return c; }
  } catch (e) { /* fall back to the local mixer */ }
  return uiLightColor(sc);
}
function triTicks(k) {
  const [vx, vy] = TRI_V[k];
  const dx = vx - TRI_C[0], dy = vy - TRI_C[1], len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  return [25, 50, 75].map((v) => { const [x, y] = triPoint(k, v); return `M${(x - nx * 4.5).toFixed(1)} ${(y - ny * 4.5).toFixed(1)}L${(x + nx * 4.5).toFixed(1)} ${(y + ny * 4.5).toFixed(1)}`; }).join('');
}
function Triangle({ scores, ghost, trail, mode = 'now', selected, onSelect, size = 'lg' }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sc = scores || {};
  const anim = useAnimatedScores(sc);
  const shape = triPath(anim);
  const sp = stylePoint(anim);
  const light = triLight(sc);
  const measured = POLE_KEYS.some((k) => sc[k] != null);
  const pick = (k) => onSelect && onSelect(selected === k ? null : k);
  const trailPts = mode === 'journey' && trail ? trail.map((t) => stylePoint({ ethos: t.e, pathos: t.p, logos: t.l })) : [];
  const label = POLE_KEYS.map((k) => `${POLES[k].name} ${sc[k] == null ? t('not measured') : Math.round(sc[k])}`).join(', ');
  const full = triPath({ ethos: 100, pathos: 100, logos: 100 });
  return html`<div className=${'tri tri-' + size + (selected ? ' has-sel' : '') + (measured ? '' : ' is-empty')} style=${{ '--tri-light': light }}>
    <svg viewBox="0 0 420 420" role="img" aria-label=${t`Rhetorical triangle: ${label}`}>
      <defs>
        <clipPath id=${'clip' + rid}><path d=${shape} /></clipPath>
        <filter id=${'glow' + rid} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20" /></filter>
        <linearGradient id=${'plinth' + rid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="tri-plinth-a" /><stop offset="1" className="tri-plinth-b" /></linearGradient>
        <linearGradient id=${'sweep' + rid} x1="0" y1="0" x2="1" y2="0"><stop offset="0" style=${{ stopColor: 'var(--light)', stopOpacity: 0 }} /><stop offset=".5" style=${{ stopColor: 'var(--light)', stopOpacity: 0.6 }} /><stop offset="1" style=${{ stopColor: 'var(--light)', stopOpacity: 0 }} /></linearGradient>
        ${POLE_KEYS.map((k) => html`<radialGradient key=${k} id=${'lamp' + k + rid} cx=".36" cy=".32" r=".75"><stop offset="0" style=${{ stopColor: 'var(--light)' }} /><stop offset=".45" style=${{ stopColor: POLES[k].color }} /><stop offset="1" style=${{ stopColor: `color-mix(in srgb, ${POLES[k].color} 62%, var(--shade))` }} /></radialGradient>`)}
      </defs>
      <path d=${full} className="tri-outer" style=${{ fill: `url(#plinth${rid})` }} />
      ${[75, 50, 25].map((v) => html`<path key=${v} d=${triPath({ ethos: v, pathos: v, logos: v })} className=${'tri-grid' + (v === 50 ? ' is-mid' : '')} />`)}
      ${POLE_KEYS.map((k) => html`<line key=${k} x1=${TRI_C[0]} y1=${TRI_C[1]} x2=${TRI_V[k][0]} y2=${TRI_V[k][1]} className=${'tri-axis' + (selected === k ? ' is-on' : '')} style=${selected === k ? { stroke: POLES[k].color } : null} />`)}
      <path d=${POLE_KEYS.map(triTicks).join('')} className="tri-ticks" />
      ${ghost ? html`<path d=${triPath(ghost)} className="tri-ghost" />` : null}
      ${measured ? html`<path d=${shape} className="tri-glow" filter=${`url(#glow${rid})`} style=${{ fill: light }} />` : null}
      <g clipPath=${`url(#clip${rid})`}>
        <foreignObject x="0" y="0" width="420" height="420"><div className="tri-fill"></div></foreignObject>
        <g className="tri-sweep"><rect x="-190" y="0" width="150" height="420" style=${{ fill: `url(#sweep${rid})` }} /></g>
      </g>
      <path d=${shape} className="tri-shape" />
      <path d=${full} className="tri-edge" />
      ${[25, 50, 75].map((v) => { const [x, y] = triPoint('ethos', v); return html`<text key=${v} x=${x + 10} y=${y + 4} className="tri-tick">${v}</text>`; })}
      ${POLE_KEYS.map((k) => html`<path key=${'hit' + k} d=${sectorPath(k)} className="tri-hit" onClick=${() => pick(k)}><title>${POLES[k].name}</title></path>`)}
      ${POLE_KEYS.map((k) => {
        const [x, y] = triPoint(k, anim[k]); const on = selected === k;
        return html`<g key=${'d' + k} className=${'tri-lamp' + (on ? ' is-on' : '')} style=${{ pointerEvents: 'none' }}>
          <circle cx=${x} cy=${y} r=${on ? 24 : 16} className="tri-halo" style=${{ fill: POLES[k].color }} />
          <circle cx=${x} cy=${y} r=${on ? 9.5 : 7} className="tri-dot" style=${{ fill: `url(#lamp${k}${rid})` }} />
        </g>`;
      })}
      ${mode === 'now' && sc[POLE_KEYS[0]] != null ? html`<g transform=${`translate(${sp[0].toFixed(1)} ${sp[1].toFixed(1)})`} style=${{ pointerEvents: 'none' }}><circle r="15" className="tri-style-ring" /><circle r="6" className="tri-style-core" /></g>` : null}
      ${trailPts.length ? html`<g>
        <path d=${smoothPath(trailPts)} className="tri-trail" />
        ${trailPts.map((p, i) => html`<circle key=${'t' + i} cx=${p[0]} cy=${p[1]} r=${i === trailPts.length - 1 ? 8 : 5} className=${'tri-trail-dot' + (i === trailPts.length - 1 ? ' is-last' : '')}><title>${`Speech ${i + 1}: E ${trail[i].e ?? '–'} · P ${trail[i].p ?? '–'} · L ${trail[i].l ?? '–'}`}</title></circle>`)}
        <text x=${trailPts[0][0] + 10} y=${trailPts[0][1] + 16} className="tri-trail-label">${t('Start')}</text>
        <text x=${trailPts[trailPts.length - 1][0] + 12} y=${trailPts[trailPts.length - 1][1] - 10} className="tri-trail-label">${t('Now')}</text>
      </g>` : null}
    </svg>
    ${POLE_KEYS.map((k) => html`<button key=${k} type="button" className=${'tri-label tri-label-' + k + (selected === k ? ' is-on' : '')} onClick=${() => pick(k)} aria-pressed=${selected === k} style=${{ '--c': POLES[k].color }}>
      <span className="tri-label-name"><i className="tri-lens" aria-hidden="true"></i><span className="inscr">${POLES[k].name}</span></span>
      <span className="tri-label-num">${sc[k] == null ? '–' : Math.round(anim[k])}</span>
      <span className="greek">${POLES[k].greek}</span>
    </button>`)}
  </div>`;
}
function MiniTriangle({ scores, size = 44 }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sc = scores || {};
  return html`<svg className="mini-tri" width=${size} height=${size} viewBox="36 56 348 312" aria-hidden="true">
    <defs>
      <linearGradient id=${'v' + rid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style=${{ stopColor: 'var(--ethos)' }} /><stop offset="1" style=${{ stopColor: 'var(--ethos)', stopOpacity: 0.2 }} /></linearGradient>
      <linearGradient id=${'h' + rid} x1="0" y1="0" x2="1" y2="0"><stop offset="0" style=${{ stopColor: 'var(--pathos)' }} /><stop offset="1" style=${{ stopColor: 'var(--logos)' }} /></linearGradient>
    </defs>
    <path d=${triPath({ ethos: 100, pathos: 100, logos: 100 })} style=${{ fill: 'var(--surface-2)', stroke: 'var(--line-2)', strokeWidth: 10, strokeLinejoin: 'round' }} />
    <path d=${triPath(sc)} style=${{ fill: `url(#h${rid})` }} />
    <path d=${triPath(sc)} style=${{ fill: `url(#v${rid})`, opacity: 0.8 }} />
    <path d=${triPath(sc)} style=${{ fill: 'none', stroke: 'var(--surface)', strokeWidth: 9, strokeLinejoin: 'round' }} />
  </svg>`;
}

/* ---------- Charts ---------- */
function Sparkline({ values, color, w = 280, h = 56 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values) - 6, max = Math.max(...values) + 6;
  const pts = values.map((v, i) => [4 + (i / (values.length - 1)) * (w - 8), h - 8 - ((v - min) / (max - min)) * (h - 16)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return html`<svg viewBox=${`0 0 ${w} ${h}`} width="100%" height=${h} preserveAspectRatio="none" aria-label=${t`Trend from ${values[0]} to ${values[values.length - 1]}`}>
    <path d=${`${d} L${last[0]} ${h} L${pts[0][0]} ${h} Z`} style=${{ fill: color, opacity: 0.12 }} />
    <path d=${d} style=${{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' }} vectorEffect="non-scaling-stroke" />
    <circle cx=${last[0]} cy=${last[1]} r="4" style=${{ fill: color, stroke: 'var(--surface)', strokeWidth: 2 }} />
  </svg>`;
}
function Waveform({ wave, duration, pauses }) {
  const W = 960, H = 84, n = wave.length, bw = W / n;
  return html`<svg className="wave" viewBox=${`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label=${t('Waveform of the recording with pauses marked')}>
    ${(pauses || []).filter((p) => p.d >= 0.7).map((p, i) => html`<rect key=${'p' + i} x=${(p.t / duration) * W} y="0" width=${Math.max(3, (p.d / duration) * W)} height=${H} rx="3" className=${p.d > 2 ? 'wave-pause-l' : 'wave-pause-d'} />`)}
    ${wave.map((v, i) => { const hh = Math.max(1.2, (v / 100) * (H / 2 - 3)); return html`<rect key=${i} x=${i * bw + bw * 0.18} y=${H / 2 - hh} width=${bw * 0.64} height=${hh * 2} rx=${bw * 0.3} className="wave-bar" />`; })}
  </svg>`;
}
function curve(points) {
  const segs = []; let cur = [];
  points.forEach((p) => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
  if (cur.length) segs.push(cur);
  return segs.map((s) => (s.length > 1 ? smoothPath(s) : '')).join(' ');
}
function ArcChart({ timeline, duration }) {
  const W = 960, H = 180, pl = 6, pr = 6, pt = 14, pb = 30;
  const n = timeline.length;
  const x = (i) => pl + ((W - pl - pr) * i) / Math.max(1, n - 1);
  const series = [];
  if (timeline.some((b) => b.loud != null)) series.push({ key: 'loud', label: t('Energy'), color: 'var(--pathos)', min: 0, max: 1, area: true });
  if (timeline.some((b) => b.pitch != null)) { const vs = timeline.map((b) => b.pitch).filter((v) => v != null); const mx = Math.max(3, ...vs.map(Math.abs)); series.push({ key: 'pitch', label: t('Pitch'), color: 'var(--ethos)', min: -mx, max: mx }); }
  if (timeline.some((b) => b.rate)) { const vs = timeline.map((b) => b.rate).filter(Boolean); series.push({ key: 'rate', label: t('Pace'), color: 'var(--logos)', min: Math.min(...vs) * 0.85, max: Math.max(...vs) * 1.1, dash: '6 6' }); }
  const y = (v, s) => pt + (H - pt - pb) * (1 - (v - s.min) / Math.max(1e-6, s.max - s.min));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ f, t: (timeline[0] ? timeline[0].t : 0) + f * ((timeline[n - 1] ? timeline[n - 1].t : duration) - (timeline[0] ? timeline[0].t : 0)) }));
  return html`<div>
    <svg className="chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${t('How energy, pitch and pace moved through the speech')}>
      ${[0.25, 0.5, 0.75].map((f) => html`<line key=${f} x1=${pl} x2=${W - pr} y1=${pt + (H - pt - pb) * f} y2=${pt + (H - pt - pb) * f} className="chart-grid" strokeDasharray="2 6" />`)}
      ${series.map((s) => {
        const pts = timeline.map((b, i) => (b[s.key] == null ? null : [x(i), y(b[s.key], s)]));
        const d = curve(pts);
        const firstI = pts.findIndex(Boolean), lastI = pts.length - 1 - [...pts].reverse().findIndex(Boolean);
        return html`<g key=${s.key}>
          ${s.area && firstI >= 0 ? html`<path d=${`${d} L${x(lastI)} ${H - pb} L${x(firstI)} ${H - pb} Z`} style=${{ fill: s.color, opacity: 0.1 }} />` : null}
          <path d=${d} style=${{ fill: 'none', stroke: s.color, strokeWidth: 2.5, strokeLinecap: 'round', strokeDasharray: s.dash || 'none' }} />
        </g>`;
      })}
      <line x1=${pl} x2=${W - pr} y1=${H - pb} y2=${H - pb} className="chart-grid" />
      ${ticks.map((tk) => html`<text key=${tk.f} x=${pl + (W - pl - pr) * tk.f} y=${H - 8} className="chart-label" textAnchor=${tk.f === 0 ? 'start' : tk.f === 1 ? 'end' : 'middle'}>${fmtTime(tk.t)}</text>`)}
    </svg>
    <div className="legend" style=${{ marginTop: 6 }}>${series.map((s) => html`<span key=${s.key}><i style=${{ background: s.color }}></i>${s.label}</span>`)}<span>${t('Relative to your own range')}</span></div>
  </div>`;
}
function Gauge({ value, min, max, band }) {
  const f = (v) => clamp((v - min) / (max - min), 0, 1) * 100;
  return html`<div className="gauge" aria-hidden="true">
    <div className="band" style=${{ left: f(band[0]) + '%', width: f(band[1]) - f(band[0]) + '%' }}></div>
    ${value != null ? html`<div className="mark" style=${{ left: f(value) + '%' }}></div>` : null}
  </div>`;
}

/* ---------- Badges & laurels ---------- */
function laurelLeaves(cx, cy, R, count, rx, ry, color, start = 22, step = 24) {
  const out = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < count; i++) {
      const phi = start + i * step;
      const rad = (phi * Math.PI) / 180;
      const x = cx + side * R * Math.sin(rad), y = cy + R * Math.cos(rad);
      const rot = side === 1 ? -phi - 22 : phi + 22;
      out.push(html`<ellipse key=${side + '_' + i} cx=${x.toFixed(2)} cy=${y.toFixed(2)} rx=${rx} ry=${ry} transform=${`rotate(${rot.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})`} style=${{ fill: color }} />`);
    }
  }
  return out;
}
const TIER_COLOR = { bronze: 'var(--bronze)', silver: 'var(--silver)', gold: 'var(--gold)' };
function iconShapes(def) {
  const parts = Array.isArray(def) ? def : [def];
  return parts.map((p, i) => (typeof p === 'string' ? html`<path key=${i} d=${p} />` : p.c ? html`<circle key=${i} cx=${p.c[0]} cy=${p.c[1]} r=${p.c[2]} />` : html`<rect key=${i} x=${p.rect[0]} y=${p.rect[1]} width=${p.rect[2]} height=${p.rect[3]} rx=${p.rect[4]} />`));
}
/* Sixteen thin rays behind a gold medal: the laurel catches the light */
const MEDAL_RAYS = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 22.5 * Math.PI) / 180, w = 0.07, r = 35;
  const p = (ang) => `${(36 + Math.sin(ang) * r).toFixed(2)} ${(36 - Math.cos(ang) * r).toFixed(2)}`;
  return `M36 36L${p(a - w)}L${p(a + w)}Z`;
}).join('');
const GLINT_D = (x, y, s) => `M${x} ${y - s}l${s * 0.28} ${s * 0.72} ${s * 0.72} ${s * 0.28}-${s * 0.72} ${s * 0.28}-${s * 0.28} ${s * 0.72}-${s * 0.28}-${s * 0.72}-${s * 0.72}-${s * 0.28} ${s * 0.72}-${s * 0.28}z`;
function metalStops(col) {
  return {
    hi: `color-mix(in srgb, ${col} 38%, var(--light))`,
    mid: col,
    lo: `color-mix(in srgb, ${col} 58%, var(--shade))`,
    deep: `color-mix(in srgb, ${col} 30%, var(--shade))`,
  };
}
function BadgeMedal({ badge, earned = true, size = 72 }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const b = badge || {};
  const col = TIER_COLOR[b.tier] || 'var(--gold)';
  const m = metalStops(col);
  const shapes = iconShapes(ICONS[b.icon] || ICONS.star);
  const delay = { animationDelay: -((hashStr(String(b.id || b.name || 'x')) % 5500) / 1000).toFixed(2) + 's' };
  return html`<svg width=${size} height=${size} viewBox="0 0 72 72" aria-hidden="true" className=${'medal-svg tier-' + (b.tier || 'gold') + (earned ? ' is-earned' : ' locked')}>
    <defs>
      <linearGradient id=${'ml' + rid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style=${{ stopColor: m.hi }} /><stop offset=".5" style=${{ stopColor: m.mid }} /><stop offset="1" style=${{ stopColor: m.lo }} /></linearGradient>
      <linearGradient id=${'mr' + rid} x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" style=${{ stopColor: m.hi }} /><stop offset=".45" style=${{ stopColor: m.mid }} /><stop offset="1" style=${{ stopColor: m.lo }} /></linearGradient>
      <radialGradient id=${'mf' + rid} cx=".36" cy=".28" r=".85"><stop offset="0" style=${{ stopColor: `color-mix(in srgb, ${col} 22%, var(--light))` }} /><stop offset=".55" style=${{ stopColor: `color-mix(in srgb, ${col} 72%, var(--light))` }} /><stop offset="1" style=${{ stopColor: m.mid }} /></radialGradient>
      <linearGradient id=${'ms' + rid} x1="0" y1="0" x2="1" y2="0"><stop offset="0" style=${{ stopColor: 'var(--light)', stopOpacity: 0 }} /><stop offset=".5" style=${{ stopColor: 'var(--light)', stopOpacity: 0.8 }} /><stop offset="1" style=${{ stopColor: 'var(--light)', stopOpacity: 0 }} /></linearGradient>
      <clipPath id=${'mc' + rid}><circle cx="36" cy="36" r="21" /></clipPath>
    </defs>
    ${earned && b.tier === 'gold' ? html`<path d=${MEDAL_RAYS} className="medal-rays" style=${{ fill: col, ...delay }} />` : null}
    ${laurelLeaves(36, 36, 30, 6, 5.6, 2.5, `url(#ml${rid})`)}
    <circle cx="36" cy="37.4" r="21.6" style=${{ fill: m.deep, opacity: 0.45 }} />
    <circle cx="36" cy="36" r="21" style=${{ fill: `url(#mr${rid})` }} />
    <circle cx="36" cy="36" r="19.3" style=${{ fill: 'none', stroke: m.hi, strokeWidth: 0.8, strokeDasharray: '0.4 1.9', strokeLinecap: 'round', opacity: 0.9 }} />
    <circle cx="36" cy="36" r="17.3" style=${{ fill: `url(#mf${rid})`, stroke: m.lo, strokeWidth: 0.8 }} />
    <g transform="translate(26.64 27.3) scale(.78)" style=${{ fill: 'none', stroke: m.hi, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.85 }}>${shapes}</g>
    <g transform="translate(26.64 26.64) scale(.78)" style=${{ fill: 'none', stroke: m.deep, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}>${shapes}</g>
    ${earned ? html`<g clipPath=${`url(#mc${rid})`}><g transform="rotate(22 36 36)"><rect className="medal-sheen" x="-34" y="-10" width="16" height="92" style=${{ fill: `url(#ms${rid})`, ...delay }} /></g></g>
      <path className="medal-glint" d=${GLINT_D(22.5, 21.5, 4.2)} style=${{ fill: 'var(--light)', ...delay }} />` : null}
    ${!earned ? html`<g transform="translate(46 46)"><circle cx="9" cy="9" r="9" style=${{ fill: 'var(--surface)', stroke: 'var(--line-2)', strokeWidth: 1.5 }} /><g transform="translate(3.5 3.5) scale(.46)" style=${{ fill: 'none', stroke: 'var(--muted)', strokeWidth: 2.6, strokeLinecap: 'round' }}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g></g>` : null}
  </svg>`;
}
function LaurelLevel({ level }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const m = metalStops('var(--gold)');
  return html`<div className="laurel-level">
    <svg viewBox="0 0 170 170" aria-hidden="true">
      <defs>
        <radialGradient id=${'lh' + rid}><stop offset="0" style=${{ stopColor: 'var(--gold)', stopOpacity: 0.32 }} /><stop offset=".6" style=${{ stopColor: 'var(--gold)', stopOpacity: 0.08 }} /><stop offset="1" style=${{ stopColor: 'var(--gold)', stopOpacity: 0 }} /></radialGradient>
        <linearGradient id=${'ll' + rid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style=${{ stopColor: m.hi }} /><stop offset=".55" style=${{ stopColor: m.mid }} /><stop offset="1" style=${{ stopColor: m.lo }} /></linearGradient>
      </defs>
      <circle cx="85" cy="85" r="84" className="laurel-halo" style=${{ fill: `url(#lh${rid})` }} />
      <g className="laurel-wreath">${laurelLeaves(85, 85, 70, 8, 12, 5.2, `url(#ll${rid})`, 18, 19)}</g>
      <path d="M85 150c-5-4-12-5-15 0 4 2 9 2 15 0zm0 0c5-4 12-5 15 0-4 2-9 2-15 0zm-3 1-6 15 6-3 3 4 3-4 6 3-6-15z" style=${{ fill: m.lo }} />
      <circle cx="85" cy="151" r="3.2" style=${{ fill: m.hi }} />
      <path className="laurel-glint" d=${GLINT_D(38, 46, 7)} style=${{ fill: 'var(--light)' }} />
      <path className="laurel-glint g2" d=${GLINT_D(134, 64, 5)} style=${{ fill: 'var(--light)' }} />
    </svg>
    <b className="laurel-num" lang="grc">${greekNumeral(level)}</b>
  </div>`;
}
function LevelBadge({ level, size = 44 }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const m = metalStops('var(--stage-gold)');
  return html`<svg width=${size} height=${size} viewBox="0 0 72 72" aria-hidden="true" className="level-badge">
    <defs>
      <linearGradient id=${'lb' + rid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style=${{ stopColor: m.hi }} /><stop offset=".55" style=${{ stopColor: m.mid }} /><stop offset="1" style=${{ stopColor: m.lo }} /></linearGradient>
      <radialGradient id=${'ld' + rid} cx=".4" cy=".28" r=".85"><stop offset="0" style=${{ stopColor: 'var(--stage-bg-2)' }} /><stop offset="1" style=${{ stopColor: 'var(--stage-bg)' }} /></radialGradient>
    </defs>
    ${laurelLeaves(36, 36, 29, 6, 5.4, 2.4, `url(#lb${rid})`)}
    <circle cx="36" cy="36" r="19.5" style=${{ fill: `url(#ld${rid})`, stroke: 'var(--stage-gold)', strokeWidth: 1.4 }} />
    <circle cx="36" cy="36" r="16.4" style=${{ fill: 'none', stroke: 'var(--stage-gold)', strokeWidth: 0.7, strokeDasharray: '0.4 1.8', strokeLinecap: 'round', opacity: 0.55 }} />
    <text x="36" y="42.500" textAnchor="middle" style=${{ fill: 'var(--stage-gold)', fontFamily: 'var(--font-greek)', fontSize: level > 99 ? 14 : level > 9 ? 17 : 20 }}>${greekNumeral(level)}</text>
  </svg>`;
}

/* ---------- Confetti (triangles, of course) ---------- */
const Confetti = {
  canvas: null, parts: [], raf: 0,
  mount(c) { this.canvas = c; },
  colors() {
    const cs = getComputedStyle(document.documentElement);
    return ['--ethos', '--pathos', '--logos', '--gold'].map((v) => cs.getPropertyValue(v).trim() || '#888');
  },
  burst(opts = {}) {
    if (!this.canvas || reducedMotion()) return;
    const W = window.innerWidth, H = window.innerHeight;
    const x = opts.x != null ? opts.x : W / 2, y = opts.y != null ? opts.y : H * 0.32;
    const count = opts.count || 110, power = opts.power || 1;
    const cols = this.colors();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * 10) * power;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 7 * power, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, s: 5 + Math.random() * 7, c: cols[i % cols.length], life: 0, tri: Math.random() < 0.65 });
    }
    if (!this.raf) this.raf = requestAnimationFrame(() => this.loop());
  },
  loop() {
    const c = this.canvas; if (!c) { this.raf = 0; return; }
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of this.parts) {
      p.vy += 0.3; p.vx *= 0.986; p.vy *= 0.986; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.life / 150); ctx.fillStyle = p.c;
      if (p.tri) { ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.lineTo(p.s * 0.87, p.s * 0.5); ctx.lineTo(-p.s * 0.87, p.s * 0.5); ctx.closePath(); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    this.parts = this.parts.filter((p) => p.life < 150 && p.y < H + 40);
    if (this.parts.length) this.raf = requestAnimationFrame(() => this.loop());
    else { this.raf = 0; ctx.clearRect(0, 0, W, H); }
  },
};
const celebrate = (opts) => Confetti.burst(opts);

/* ---------- Celebration layer ---------- */
function Modal({ onClose, wide, children, label }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return html`<div className="modal-scrim" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className=${'modal' + (wide ? ' modal-wide' : '')} role="dialog" aria-modal="true" aria-label=${label}>${children}</div>
  </div>`;
}
function FxLayer() {
  const [toasts, setToasts] = useState([]);
  const [floats, setFloats] = useState([]);
  const [queue, setQueue] = useState([]);
  const canvasRef = useRef(null);
  useEffect(() => {
    Confetti.mount(canvasRef.current);
    return FX.on((type, d) => {
      if (type === 'toast') {
        const id = uid();
        setToasts((t) => [...t.slice(-2), { id, ...d }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), d.kind === 'bad' || d.kind === 'warn' ? 5200 : 3200);
      } else if (type === 'xp') {
        const chip = document.getElementById('xp-chip');
        const r = chip && chip.getBoundingClientRect();
        const id = uid();
        const x = r && r.width ? r.left + r.width / 2 : window.innerWidth - 120;
        const y = r && r.height ? r.bottom + 8 : 70;
        setFloats((f) => [...f, { id, x, y, amount: d.amount }]);
        setTimeout(() => setFloats((f) => f.filter((v) => v.id !== id)), 1600);
        if (chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
        Sound.play('xp');
      } else if (type === 'quest') {
        FX.emit('toast', { text: t`Quest complete: ${d.label} · +${d.xp} XP`, kind: 'gold' });
        Sound.play('quest');
        celebrate({ count: 50, power: 0.7, y: window.innerHeight * 0.85 });
      } else if (type === 'chest' || type === 'badge' || type === 'levelup') {
        setQueue((q) => [...q, { type, d, id: uid() }]);
      }
    });
  }, []);
  const cur = queue[0];
  useEffect(() => {
    if (!cur) return;
    if (cur.type === 'levelup') { Sound.play('level'); celebrate({ count: 160, power: 1.2 }); }
    else if (cur.type === 'badge') { Sound.play('badge'); celebrate({ count: 90 }); }
    else { Sound.play('quest'); celebrate({ count: 130 }); }
  }, [cur && cur.id]);
  const close = useCallback(() => setQueue((q) => q.slice(1)), []);
  return html`<${Fragment}>
    <canvas ref=${canvasRef} className="fx-canvas" aria-hidden="true"></canvas>
    <div className="toasts" role="status" aria-live="polite">
      ${toasts.map((ty) => html`<div key=${ty.id} className=${'toast ' + (ty.kind || '')}>${ty.kind === 'gold' ? html`<${Icon} name="check" size=${18} />` : ty.kind === 'bad' || ty.kind === 'warn' ? html`<${Icon} name="alert" size=${18} />` : null}<span>${ty.text}</span></div>`)}
    </div>
    ${floats.map((f) => html`<div key=${f.id} className="xp-float" style=${{ left: f.x, top: f.y }}>+${f.amount} XP</div>`)}
    ${cur ? html`<${Modal} onClose=${close} label=${t('Celebration')}>
      ${cur.type === 'levelup' ? html`<${Fragment}>
        <div className="eyebrow">${t('Level up')}</div>
        <${LaurelLevel} level=${cur.d.level} />
        <h2>${t`You are now ${/^[AEIOU]/.test(cur.d.info.title) ? t('an') : t('a')} ${cur.d.info.title}`}</h2>
        <p className="muted">${t`${(cur.d.info.need - cur.d.info.into).toLocaleString()} XP to the next title.`}</p>
        <button className="btn-cta gold wide" onClick=${close}>${t('Continue')}</button>
      <//>` : cur.type === 'badge' ? html`<${Fragment}>
        <div className="eyebrow">${t`Badge earned · +${BADGE_XP} XP`}</div>
        <div style=${{ animation: 'pop .6s cubic-bezier(.3,1.6,.5,1)' }} className="shine"><${BadgeMedal} badge=${cur.d} size=${140} /></div>
        <h2>${cur.d.name}</h2>
        <p className="muted">${cur.d.desc}</p>
        <button className="btn-cta wide" onClick=${close}>${t('Continue')}</button>
      <//>` : html`<${Fragment}>
        <div className="eyebrow">${t('All quests complete')}</div>
        <div className="tile-ic shine" style=${{ width: 96, height: 96, borderRadius: 28, background: 'var(--gold)', color: 'var(--on-accent)' }}><${Icon} name="gift" size=${52} /></div>
        <h2>${t('The laurel chest is open')}</h2>
        <p className="muted">${t`+${cur.d.xp} XP for finishing every quest today. New quests arrive tomorrow.`}</p>
        <button className="btn-cta gold wide" onClick=${close}>${t('Continue')}</button>
      <//>`}
    <//>` : null}
  <//>`;
}
