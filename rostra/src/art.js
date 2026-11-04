/* ================================================================
   Art & motion system: the stoa at dusk.
   Stoa             the signature stage: a colonnade, three hard-edged lights on stone
   Curtain          the bronze doors that open on a report
   Sound.applause   a synthesized crowd
   makePoster       the generative rhetorical fingerprint
   PosterModal      preview and save
   Canvas, audio and observer APIs are only touched inside effects and handlers.
   ================================================================ */

const ART_TAU = Math.PI * 2;
const ART_STAGE_FALLBACK = { ethos: [111, 140, 255], pathos: [255, 94, 138], logos: [47, 224, 182] };
const artSmooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function artCanvas(w, h) {
  try {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c && c.getContext ? c : null;
  } catch (e) { return null; }
}
/* Accepts #rgb, #rrggbb, rgb(1 2 3) and rgb(1, 2, 3). Returns [r, g, b]. */
function artParseRgb(str, fallback) {
  const s = String(str == null ? '' : str).trim();
  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return m[1].split('').map((h) => parseInt(h + h, 16));
  m = /^#([0-9a-f]{6})/i.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return fallback;
}
function artStageColors(el) {
  let cs = null;
  try { cs = getComputedStyle(el || document.documentElement); } catch (e) { cs = null; }
  const out = {};
  POLE_KEYS.forEach((k) => { out[k] = artParseRgb(cs ? cs.getPropertyValue('--stage-' + k) : '', ART_STAGE_FALLBACK[k]); });
  return out;
}

const ART_SPRITES = {};

/* ---------- The stoa ----------
   A colonnade at dusk, seen from the front. Each gap between columns lets in one light: ethos, pathos,
   logos. The edges are hard, and each light is as bright as your score. Plain SVG in real pixels. */
function stoaGeometry(W, H, opts) {
  const o = opts || {};
  const n = (v) => Math.round(v * 10) / 10;
  const from = o.from != null ? o.from : W * 0.5;
  const to = o.to != null ? o.to : W - Math.max(12, W * 0.016);
  const steps = o.steps != null ? o.steps : 66;
  const floor = H - steps;
  const gap = (to - from) / 6; /* four columns, three gaps: a column is three quarters of a gap */
  const col = gap * 0.75;
  const cornice = 9, frieze = 18, architrave = 11;
  const head = cornice + frieze + architrave;
  const abacus = Math.max(5, col * 0.14), echinus = Math.max(7, col * 0.2);
  const inset = col * 0.07;
  const under = head + abacus + echinus;
  const columns = [0, 1, 2, 3].map((i) => {
    const x = from + i * (col + gap);
    const flute = (f) => `M${n(x + inset + (col - 2 * inset) * f)} ${n(under)}L${n(x + col * f)} ${n(floor)}`;
    return {
      x: n(x), w: n(col),
      abacus: { x: n(x - col * 0.12), y: head, w: n(col * 1.24), h: n(abacus) },
      echinus: `M${n(x - col * 0.05)} ${n(head + abacus)}H${n(x + col * 1.05)}L${n(x + col - inset)} ${n(under)}H${n(x + inset)}Z`,
      shaft: `M${n(x + inset)} ${n(under)}H${n(x + col - inset)}L${n(x + col)} ${n(floor)}H${n(x)}Z`,
      flutes: [0.25, 0.5, 0.75].map(flute).join(''),
      edge: `M${n(x + col - inset)} ${n(under)}L${n(x + col)} ${n(floor)}`,
    };
  });
  const run = (floor - head) * 0.34; /* how far each light drifts left on its way down */
  const fall = steps * 0.5;
  const lights = POLE_KEYS.map((key, i) => {
    const x1 = from + i * (col + gap) + col, x2 = x1 + gap;
    return {
      key, edge: columns[i].edge,
      shaft: `M${n(x1)} ${head}H${n(x2)}L${n(x2 - run)} ${n(floor)}H${n(x1 - run)}Z`,
      pool: `M${n(x1 - run)} ${n(floor)}H${n(x2 - run)}L${n(x2 - run - fall)} ${n(H)}H${n(x1 - run - fall)}Z`,
    };
  });
  const third = steps / 3;
  return {
    W, H, floor, head, cornice, frieze, architrave, columns, lights,
    left: n(from - col * 0.34),
    treads: [0, 1, 2].map((i) => ({ y: n(floor + i * third), h: n(third) + 1 })),
  };
}
/* How bright one light burns. A selected appeal steps forward and the other two fall back. */
function stoaLevel(score, on, anyOn) {
  const f = score == null || !isFinite(score) ? 0.15 : clamp(Number(score), 0, 100) / 100;
  const base = 0.12 + 0.72 * Math.pow(f, 1.3);
  if (!anyOn) return Math.round(base * 100) / 100;
  return Math.round((on ? Math.min(1, base + 0.2) : base * 0.3) * 100) / 100;
}
function StoaScene({ scores, selected, from, to, steps, className = '' }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 1100, h: 560 });
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.getBoundingClientRect) return undefined;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      setBox((b) => (Math.abs(b.w - r.width) < 1 && Math.abs(b.h - r.height) < 1 ? b : { w: Math.round(r.width), h: Math.round(r.height) }));
    };
    read();
    if (typeof ResizeObserver !== 'function') { window.addEventListener('resize', read); return () => window.removeEventListener('resize', read); }
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sc = scores || {};
  const g = stoaGeometry(box.w, box.h, { from: from != null ? box.w * from : undefined, to: to != null ? box.w * to : undefined, steps });
  const lit = (k) => ({ opacity: stoaLevel(sc[k], selected === k, !!selected) });
  return html`<div ref=${ref} className=${'stoa-scene ' + className} aria-hidden="true"><svg width=${box.w} height=${box.h} viewBox=${`0 0 ${box.w} ${box.h}`}>
    <defs>
      ${g.lights.map((l) => html`<linearGradient key=${l.key} id=${'sl' + l.key + rid} gradientUnits="userSpaceOnUse" x1="0" y1=${g.head} x2="0" y2=${g.floor}><stop offset="0" style=${{ stopColor: `var(--stage-${l.key})` }} /><stop offset="1" style=${{ stopColor: `var(--stage-${l.key})`, stopOpacity: 0.5 }} /></linearGradient>`)}
      <pattern id=${'sk' + rid} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform=${`translate(0 ${g.cornice + 1})`}><path d="M0 14H16M2 14V3.600H14V11.600H6V6.800H10V9.200" className="stoa-key" /></pattern>
    </defs>
    ${g.lights.map((l, i) => html`<g key=${'s' + l.key} className="stoa-light" style=${{ ...lit(l.key), '--d': 0.25 + i * 0.45 + 's' }}><path d=${l.shaft} className="stoa-shaft" style=${{ fill: `url(#sl${l.key}${rid})`, animationDelay: i * -3.1 + 's' }} /></g>`)}
    ${g.columns.map((c, i) => html`<g key=${'c' + i} className="stoa-column"><path d=${c.shaft} className="stoa-col" /><path d=${c.flutes} className="stoa-flute" /><path d=${c.echinus} className="stoa-col" /><rect x=${c.abacus.x} y=${c.abacus.y} width=${c.abacus.w} height=${c.abacus.h} className="stoa-cap" /></g>`)}
    ${g.lights.map((l, i) => html`<g key=${'e' + l.key} className="stoa-light" style=${{ ...lit(l.key), '--d': 0.25 + i * 0.45 + 's' }}><path d=${l.edge} className="stoa-edge" style=${{ stroke: `var(--stage-${l.key})` }} /></g>`)}
    <rect x=${g.left} y="0" width=${g.W - g.left} height=${g.head} className="stoa-beam" />
    <rect x=${g.left} y=${g.cornice} width=${g.W - g.left} height=${g.frieze} style=${{ fill: `url(#sk${rid})` }} />
    ${g.treads.map((t, i) => html`<rect key=${'t' + i} y=${t.y} width=${g.W} height=${t.h} className=${'stoa-tread stoa-tread-' + i} />`)}
    ${g.lights.map((l, i) => html`<g key=${'p' + l.key} className="stoa-light" style=${{ ...lit(l.key), '--d': 0.25 + i * 0.45 + 's' }}><path d=${l.pool} className="stoa-pool" style=${{ fill: `var(--stage-${l.key})` }} /></g>`)}
  </svg></div>`;
}
/* The signature stage. scores = {ethos, pathos, logos} 0-100 (null allowed). HTML children sit on top. */
function Stoa({ scores, selected, height = 560, children }) {
  return html`<div className="stage stoa" style=${{ minHeight: height }}>
    <${StoaScene} className="stoa-scene-wide" scores=${scores} selected=${selected} />
    <div className="stoa-content">${children}</div>
  </div>`;
}

/* The additive mix of a score set. The primaries are white balanced, so equal lights give pure white
   at any level, and a single light keeps its own saturated color. Brightness follows the strongest
   light. Returns 'rgb(r g b)'. */
function limelightColor(scores) {
  const f = POLE_KEYS.map((k) => {
    const v = scores && scores[k];
    return v == null || v === '' || !isFinite(v) ? null : clamp(Number(v), 0, 100) / 100;
  });
  const peak = Math.max(...f.map((x) => x || 0));
  if (!(peak > 0)) return 'rgb(150 158 196)';
  const P = POLE_KEYS.map((k) => UI_LIGHTS[k]);
  const rgb = [0, 1, 2].map((c) => {
    const gain = P[0][c] + P[1][c] + P[2][c];
    return f.reduce((sum, x, i) => sum + P[i][c] * Math.pow(x || 0, 1.5), 0) / gain;
  });
  const top = Math.max(rgb[0], rgb[1], rgb[2]) || 1;
  const v = 0.68 + 0.32 * peak;
  return 'rgb(' + rgb.map((c) => Math.round((c / top) * 255 * v)).join(' ') + ')';
}

function artGrainTile() {
  if (ART_SPRITES.grain) return ART_SPRITES.grain;
  const T = 128, c = artCanvas(T, T);
  const x = c && c.getContext('2d');
  if (!x) return null;
  /* Math.random on purpose: a seeded congruential generator shows a faint lattice when tiled */
  const im = x.createImageData(T, T), d = im.data;
  for (let k = 0; k < d.length; k += 4) { const v = Math.random() * 255; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; }
  x.putImageData(im, 0, 0);
  ART_SPRITES.grain = c;
  return c;
}

/* ---------- Curtain ---------- */
const ART_CURTAIN_HOLD = 450, ART_CURTAIN_SWEEP = 1400;
/* Two bronze doors over the page. When play turns true they open, then call onDone. */
function Curtain({ play, onDone }) {
  const [gone, setGone] = useState(false);
  const fired = useRef(false);
  const cb = useRef(onDone);
  cb.current = onDone;
  const finish = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    setGone(true);
    try { if (cb.current) cb.current(); } catch (e) { /* a reveal callback must not trap the curtain */ }
  }, []);
  const still = reducedMotion();
  useEffect(() => {
    if (!play) { fired.current = false; setGone(false); return undefined; }
    if (fired.current) return undefined;
    if (still) { finish(); return undefined; }
    const t1 = setTimeout(finish, ART_CURTAIN_HOLD + ART_CURTAIN_SWEEP + 60);
    const t2 = setTimeout(finish, ART_CURTAIN_HOLD + ART_CURTAIN_SWEEP + 1400); /* never block the page */
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [play]);
  if (!play || gone || still) return null;
  const doors = html`<div className="art-curtain" aria-hidden="true" onClick=${finish}>
    <div className="art-curtain-panel art-curtain-l"></div>
    <div className="art-curtain-panel art-curtain-r"></div>
  </div>`;
  /* Pages animate in with a transform, which would trap a fixed overlay. Mounting directly under .app
     escapes that, and stays in the stacking context that keeps toasts and confetti above the doors. */
  const shell = typeof ReactDOM.createPortal === 'function' && document.querySelector ? document.querySelector('.app') : null;
  return shell ? ReactDOM.createPortal(doors, shell) : doors;
}

/* ---------- Applause ---------- */
/* Pure synthesis, separated from WebAudio so it can be tested. Each clap is a burst of white noise
   through its own bandpass. A crowd is a pool of people, each with a fixed hand timbre and seat. */
function artApplauseSamples(strength, sampleRate, rnd) {
  const s = clamp(isFinite(strength) && strength != null ? Number(strength) : 0.6, 0, 1);
  const sr = sampleRate;
  const dur = 2 + 2 * s;
  const len = Math.floor(sr * (dur + 0.3));
  const L = new Float32Array(len), R = new Float32Array(len);
  const clap = (t0, amp, freq, q, ms, pan) => {
    const start = Math.floor(t0 * sr), n = Math.floor((ms / 1000) * sr);
    if (start < 0 || start + n >= len) return;
    const w = (ART_TAU * freq) / sr, sw = Math.sin(w), al = sw / (2 * q), a0 = 1 + al;
    const b0 = al / a0, a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - al) / a0;
    const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
    const tau = n * 0.26, at = Math.max(1, Math.floor(sr * 0.0007));
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n; i++) {
      const env = (i < at ? i / at : 1) * Math.exp(-i / tau);
      const x = (rnd() * 2 - 1) * env;
      const y = b0 * x - b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      L[start + i] += y * amp * gl; R[start + i] += y * amp * gr;
    }
  };
  /* A few distant claps start it off: duller, quiet, off to the sides */
  const early = 3 + Math.floor(rnd() * 3 + s * 2);
  for (let i = 0; i < early; i++) {
    clap(0.02 + rnd() * 0.42, 0.16 + rnd() * 0.14, 950 + rnd() * 500, 1.1, 30 + rnd() * 10, (rnd() < 0.5 ? -1 : 1) * (0.4 + rnd() * 0.5));
  }
  /* Then the crowd swells and decays */
  const swell = (t) => { const x = t / dur; return artSmooth(0.04, 0.34, x) * Math.pow(1 - artSmooth(0.38, 1, x), 1.5); };
  const people = [];
  const seats = Math.round(12 + 48 * s);
  for (let i = 0; i < seats; i++) people.push({ freq: 1000 + rnd() * 2000, q: 1 + rnd() * 1.4, ms: 15 + rnd() * 25, pan: rnd() * 1.7 - 0.85, amp: 0.55 + rnd() * 0.45 });
  const target = Math.round(70 + 800 * s);
  let placed = 0, guard = 0;
  while (placed < target && guard++ < target * 12) {
    const t = 0.25 + rnd() * (dur - 0.25), e = swell(t);
    if (rnd() > e) continue;
    const p = people[Math.floor(rnd() * seats)];
    clap(t, p.amp * (0.4 + 0.6 * rnd()) * (0.5 + 0.5 * e), p.freq * (0.94 + rnd() * 0.12), p.q, p.ms, p.pan);
    placed++;
  }
  /* A soft room glues the claps together */
  [[0.019, 0.28], [0.033, 0.2], [0.051, 0.13]].forEach(([sec, g]) => {
    const dl = Math.floor(sec * sr);
    for (let i = len - 1; i >= dl; i--) { const a = L[i - dl], b = R[i - dl]; L[i] += b * g; R[i] += a * g; }
  });
  let peak = 0;
  for (let i = 0; i < len; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > peak) peak = a; if (b > peak) peak = b; }
  if (peak > 0) { const k = 0.9 / peak; for (let i = 0; i < len; i++) { L[i] *= k; R[i] *= k; } }
  return { L, R, dur, claps: placed + early };
}
/* Synthesized applause, strength 0..1. Respects Sound.enabled. */
Sound.applause = function applause(strength) {
  if (!Sound.enabled) return;
  try {
    const c = Sound.ensure();
    if (!c) return;
    const s = clamp(isFinite(strength) && strength != null ? Number(strength) : 0.6, 0, 1);
    const out = artApplauseSamples(s, c.sampleRate, Math.random);
    const buf = c.createBuffer(2, out.L.length, c.sampleRate);
    buf.getChannelData(0).set(out.L);
    buf.getChannelData(1).set(out.R);
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf;
    g.gain.value = 0.14 + 0.2 * s;
    src.connect(g); g.connect(c.destination);
    src.start(c.currentTime + 0.05);
  } catch (e) { /* audio is optional */ }
};

/* ---------- Poster: the rhetorical fingerprint ---------- */
const ART_POSTER_W = 1080, ART_POSTER_H = 1350;
function artTracked(ctx, text, x, y, track, align) {
  const chars = Array.from(String(text));
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * Math.max(0, chars.length - 1);
  let cur = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  const was = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, cur, y); cur += widths[i] + track; });
  ctx.textAlign = was;
  return total;
}
function artTrackedWidth(ctx, text, track) {
  const chars = Array.from(String(text));
  return chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + track * Math.max(0, chars.length - 1);
}
function artRgba(rgb, a, toWhite) {
  const w = toWhite || 0;
  return 'rgba(' + rgb.map((c) => Math.round(c + (255 - c) * w)).join(',') + ',' + a + ')';
}
/* Each light prints its own whorl of ridges. Crossing whorls interfere, and no two speakers match. */
function artPosterRidges(ctx, cx, cy, f, rgb, rnd) {
  const spacing = 8.2 + rnd() * 1.8, rMax = 130 + 350 * f;
  const rot = rnd() * ART_TAU, stretch = 1.06 + rnd() * 0.26, cr = Math.cos(rot), sr = Math.sin(rot);
  const ph = [rnd() * ART_TAU, rnd() * ART_TAU, rnd() * ART_TAU, rnd() * ART_TAU];
  const dx = (rnd() - 0.5) * 0.5, dy = (rnd() - 0.5) * 0.5;
  ctx.strokeStyle = artRgba(rgb, 1, 0.22);
  for (let rho = 10 + rnd() * 6; rho < rMax; rho += spacing) {
    const q = rho / rMax;
    ctx.globalAlpha = (0.05 + 0.5 * Math.pow(1 - q, 1.25)) * (0.4 + 0.6 * f);
    ctx.lineWidth = 1.1 + (1 - q) * 1;
    const steps = Math.floor(80 + rho * 0.9);
    const gapAt = rnd() * ART_TAU, gap = rnd() < 0.55 ? 0.05 + rnd() * 0.2 : 0;
    let pen = false;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const th = (s / steps) * ART_TAU;
      if ((th - gapAt + ART_TAU) % ART_TAU < gap) { pen = false; continue; }
      const warp = 1 + 0.11 * Math.sin(2 * th + ph[0] + rho * 0.012) + 0.055 * Math.sin(3 * th + ph[1] + rho * 0.019)
        + 0.024 * Math.sin(5 * th + ph[2] + rho * 0.03) + 0.009 * Math.sin(9 * th + ph[3] + rho * 0.05);
      const x0 = rho * warp * Math.cos(th), y0 = rho * warp * Math.sin(th) * stretch;
      const x = cx + dx * rho + x0 * cr - y0 * sr, y = cy + dy * rho + x0 * sr + y0 * cr;
      if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      pen = true;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
/* One side of the Greek-key border, drawn along +x from the current origin. */
function artPosterKeyBand(ctx, len, size) {
  const n = Math.max(1, Math.round(len / size)), s = len / n, k = size / 20;
  ctx.save();
  ctx.lineWidth = 2.2 * k; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const o = i * s;
    ctx.moveTo(o + 2.5 * k, 17.5 * k);
    ctx.lineTo(o + 2.5 * k, 4.5 * k); ctx.lineTo(o + 17.5 * k, 4.5 * k); ctx.lineTo(o + 17.5 * k, 14.5 * k);
    ctx.lineTo(o + 7.5 * k, 14.5 * k); ctx.lineTo(o + 7.5 * k, 8.5 * k); ctx.lineTo(o + 12.5 * k, 8.5 * k); ctx.lineTo(o + 12.5 * k, 11.5 * k);
  }
  ctx.moveTo(0, 17.5 * k); ctx.lineTo(len, 17.5 * k);
  ctx.moveTo(0, 1.2 * k); ctx.lineTo(len, 1.2 * k);
  ctx.stroke();
  ctx.restore();
}
function artPosterBorder(ctx, W, H, m, size, gold) {
  const corner = (x, y) => {
    ctx.fillStyle = gold; ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#05060F'; ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
    ctx.fillStyle = gold; ctx.fillRect(x + size * 0.38, y + size * 0.38, size * 0.24, size * 0.24);
  };
  ctx.save();
  ctx.strokeStyle = gold;
  const side = (x, y, angle, len) => { ctx.save(); ctx.translate(x, y); ctx.rotate(angle); artPosterKeyBand(ctx, len, size); ctx.restore(); };
  side(m + size, m, 0, W - 2 * (m + size));
  side(W - m, m + size, Math.PI / 2, H - 2 * (m + size));
  side(W - m - size, H - m, Math.PI, W - 2 * (m + size));
  side(m, H - m - size, -Math.PI / 2, H - 2 * (m + size));
  [[m, m], [W - m - size, m], [m, H - m - size], [W - m - size, H - m - size]].forEach(([x, y]) => corner(x, y));
  ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
  ctx.strokeRect(m + size + 7, m + size + 7, W - 2 * (m + size + 7), H - 2 * (m + size + 7));
  ctx.restore();
}
function artPosterFacts(profile, speeches, vivas) {
  const p = profile || {}, stats = p.stats || {}, skills = p.skills || {};
  const vals = POLE_KEYS.map((k) => { const v = skills[k]; return v == null || !isFinite(v) ? null : clamp(Number(v), 0, 100); });
  const first = vals.every((v) => v == null);
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'A speaker';
  const xp = Number(p.xp) || 0;
  const nSpeeches = Math.max(Array.isArray(speeches) ? speeches.length : 0, Number(stats.speeches) || 0);
  const nVivas = Math.max(Array.isArray(vivas) ? vivas.filter((v) => v && v.status === 'done').length : 0, Number(stats.vivas) || 0);
  const best = Number(p.streak && p.streak.best) || 0;
  return {
    vals, first, name, xp, nSpeeches, nVivas, best,
    level: levelInfo(xp),
    archetype: first ? 'Your stage is set' : archetypeOf(skills).name,
    seed: hashStr([name, vals.join(','), xp, nSpeeches, nVivas, best].join('|')),
  };
}
/* Paints the whole poster. Exposed separately from makePoster so tests can run it on a stub context. */
function artDrawPoster(ctx, facts, colors, dateText) {
  const W = ART_POSTER_W, H = ART_POSTER_H;
  const rnd = seeded(facts.seed);
  const gold = '#FFC64A', ink = '#F2F3FF', muted = '#9CA2CC', night = '#05060F';
  const display = '"Bricolage Grotesque", "Avenir Next", system-ui, sans-serif';
  const inscr = display;
  const greek = '"GFS Didot", "Times New Roman", serif';
  const lights = POLE_KEYS.map((k, i) => ({ key: k, rgb: colors[k], f: facts.first ? 0.42 : (facts.vals[i] == null ? 0 : facts.vals[i]) / 100 }));

  /* Dark stage */
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const bg = ctx.createRadialGradient(540, 500, 40, 540, 560, 960);
  bg.addColorStop(0, '#171B42'); bg.addColorStop(0.55, '#0B0D24'); bg.addColorStop(1, night);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  /* The triangle, in the same proportions as the app's */
  const C = [540, 548], R = 304;
  const dir = {};
  POLE_KEYS.forEach((k) => {
    const dx = TRI_V[k][0] - TRI_C[0], dy = TRI_V[k][1] - TRI_C[1], d = Math.hypot(dx, dy) || 1;
    dir[k] = [dx / d, dy / d];
  });
  const vertex = (k, s) => [C[0] + dir[k][0] * R * s, C[1] + dir[k][1] * R * s];

  /* Lamps above, beams down, lights landing near each vertex. All of it is additive. */
  ctx.globalCompositeOperation = 'lighter';
  const slots = shuffle([-1, 0, 1], rnd); /* the seed decides which lamp hangs where, so beams may cross */
  lights.forEach((l, i) => {
    const pull = 0.62 + 0.14 * l.f;
    const pos = vertex(l.key, pull);
    l.x = pos[0] + (rnd() - 0.5) * 36; l.y = pos[1] + (rnd() - 0.5) * 36;
    l.radius = 250 + 380 * l.f;
    l.power = 0.26 + 0.66 * l.f;
    const lx = 540 + slots[i] * (230 + rnd() * 130) + (rnd() - 0.5) * 70, ly = 40, hw = 40 + l.radius * 0.14;
    const fall = ctx.createLinearGradient(0, ly, 0, l.y);
    fall.addColorStop(0, artRgba(l.rgb, 0.3 + 0.5 * l.f));
    fall.addColorStop(1, artRgba(l.rgb, 0.1 + 0.2 * l.f));
    ctx.fillStyle = fall;
    ctx.beginPath(); ctx.moveTo(lx - hw, ly); ctx.lineTo(lx + hw, ly); ctx.lineTo(l.x + hw, l.y); ctx.lineTo(l.x - hw, l.y); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
    g.addColorStop(0, artRgba(l.rgb, 0.8 * l.power));
    g.addColorStop(0.22, artRgba(l.rgb, 0.46 * l.power));
    g.addColorStop(0.55, artRgba(l.rgb, 0.14 * l.power));
    g.addColorStop(1, artRgba(l.rgb, 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  lights.forEach((l) => artPosterRidges(ctx, l.x, l.y, l.f, l.rgb, rnd));
  /* Dust caught in the light, colored by the nearest lamp */
  for (let i = 0; i < 300; i++) {
    const x = 70 + rnd() * (W - 140), y = 90 + rnd() * 780, size = 0.5 + Math.pow(rnd(), 3) * 2.8;
    let best = lights[0], bd = Infinity;
    lights.forEach((l) => { const d = Math.hypot(x - l.x, y - l.y) / l.radius; if (d < bd) { bd = d; best = l; } });
    if (bd > 1) continue;
    ctx.globalAlpha = clamp((1 - bd) * (0.3 + rnd() * 0.7), 0, 1);
    ctx.fillStyle = artRgba(best.rgb, 1, 0.45);
    ctx.beginPath(); ctx.arc(x, y, size, 0, ART_TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* Darkness rises from the floor so the inscription sits on a calm ground */
  ctx.globalCompositeOperation = 'source-over';
  const ground = ctx.createLinearGradient(0, 780, 0, 960);
  ground.addColorStop(0, 'rgba(5,6,15,0)'); ground.addColorStop(0.7, 'rgba(5,6,15,.88)'); ground.addColorStop(1, 'rgba(5,6,15,.97)');
  ctx.fillStyle = ground; ctx.fillRect(0, 780, W, 180);
  ctx.fillStyle = 'rgba(5,6,15,.97)'; ctx.fillRect(0, 960, W, H - 960);
  /* Floorboards, barely there, for a sense of ground */
  ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
  for (let i = -16; i <= 16; i++) {
    ctx.beginPath(); ctx.moveTo(540 + i * 34, 900); ctx.lineTo(540 + i * 92, H); ctx.stroke();
  }

  /* The triangle, drawn precisely */
  const outline = (s) => { POLE_KEYS.forEach((k, i) => { const v = vertex(k, s); if (i) ctx.lineTo(v[0], v[1]); else ctx.moveTo(v[0], v[1]); }); ctx.closePath(); };
  ctx.save();
  ctx.lineJoin = 'round';
  [0.25, 0.5, 0.75].forEach((s) => {
    ctx.beginPath(); outline(s);
    ctx.setLineDash(s === 0.5 ? [] : [3, 7]);
    ctx.strokeStyle = 'rgba(4,5,16,.55)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.stroke();
  });
  ctx.setLineDash([]);
  POLE_KEYS.forEach((k) => {
    const v = vertex(k, 1);
    ctx.beginPath(); ctx.moveTo(C[0], C[1]); ctx.lineTo(v[0], v[1]);
    ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 1; ctx.stroke();
  });
  ctx.beginPath(); outline(1);
  ctx.strokeStyle = 'rgba(4,5,16,.6)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2; ctx.stroke();
  if (!facts.first) {
    const pts = POLE_KEYS.map((k, i) => vertex(k, (facts.vals[i] == null ? 0 : facts.vals[i]) / 100));
    const trace = () => { ctx.beginPath(); pts.forEach((p, i) => { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); };
    trace();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
    ctx.strokeStyle = 'rgba(4,5,16,.75)'; ctx.lineWidth = 8; ctx.stroke();
    ctx.shadowColor = limelightColor({ ethos: facts.vals[0], pathos: facts.vals[1], logos: facts.vals[2] }); ctx.shadowBlur = 26;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.shadowBlur = 0;
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, ART_TAU); ctx.fillStyle = night; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 7.5, 0, ART_TAU); ctx.fillStyle = artRgba(lights[i].rgb, 1, 0.1); ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 2.8, 0, ART_TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    });
  } else {
    ctx.font = '700 31px ' + inscr;
    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = 'rgba(4,5,16,.9)'; ctx.shadowBlur = 22;
    artTracked(ctx, 'FIRST LIGHT', C[0], C[1] + 34, 7, 'center');
    ctx.shadowBlur = 0;
  }
  /* Vertex labels */
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 25px ' + inscr;
  ctx.shadowColor = 'rgba(4,5,16,.95)'; ctx.shadowBlur = 16;
  const labelAt = { ethos: [C[0], C[1] - R - 22], pathos: [C[0] + dir.pathos[0] * R - 6, C[1] + dir.pathos[1] * R + 44], logos: [C[0] + dir.logos[0] * R + 6, C[1] + dir.logos[1] * R + 44] };
  POLE_KEYS.forEach((k) => {
    ctx.fillStyle = '#FFFFFF';
    artTracked(ctx, POLES[k].name.toUpperCase(), labelAt[k][0], labelAt[k][1], 6, 'center');
    artTracked(ctx, POLES[k].name.toUpperCase(), labelAt[k][0], labelAt[k][1], 6, 'center'); /* twice, for a denser shadow on bright light */
  });
  ctx.shadowBlur = 0;
  ctx.restore();

  /* Border and heading */
  const left = 96, right = W - 96, width = right - left;
  artPosterBorder(ctx, W, H, 32, 25, '#E0B25A');
  ctx.shadowColor = 'rgba(4,5,16,.95)'; ctx.shadowBlur = 14;
  ctx.fillStyle = ink;
  ctx.font = '700 38px ' + inscr;
  artTracked(ctx, 'ROSTRA', left, 124, 13, 'left');
  ctx.fillStyle = 'rgba(242,243,255,.92)';
  ctx.font = '600 19px ' + inscr;
  artTracked(ctx, 'RHETORICAL FINGERPRINT', right, 118, 5, 'right');
  ctx.fillStyle = 'rgba(242,243,255,.82)';
  ctx.font = 'italic 30px ' + greek;
  ctx.textAlign = 'left';
  ctx.fillText(POLE_KEYS.map((k) => POLES[k].greek).join(' · '), left, 166);
  ctx.shadowBlur = 0;

  /* Inscription */
  ctx.fillStyle = gold;
  ctx.font = '700 28px ' + inscr;
  artTracked(ctx, facts.archetype.toUpperCase(), left, 918, 7, 'left');
  const levelText = ('Level ' + facts.level.level + ' · ' + facts.level.title).toUpperCase();
  ctx.fillStyle = muted;
  ctx.font = '600 20px ' + inscr;
  let lvTrack = 3.5;
  if (artTrackedWidth(ctx, levelText, lvTrack) > width * 0.5) { ctx.font = '600 16px ' + inscr; lvTrack = 2; }
  artTracked(ctx, levelText, right, 916, lvTrack, 'right');
  let nameSize = 92;
  ctx.font = '800 ' + nameSize + 'px ' + display;
  while (nameSize > 40 && ctx.measureText(facts.name).width > width) { nameSize -= 4; ctx.font = '800 ' + nameSize + 'px ' + display; }
  let shown = facts.name;
  while (shown.length > 1 && ctx.measureText(shown + '…').width > width) shown = shown.slice(0, -1);
  if (shown !== facts.name) shown = shown.trim() + '…';
  ctx.fillStyle = ink;
  ctx.fillText(shown, left, 1006);

  /* Three scores */
  const cell = width / 3;
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.fillRect(left, 1040, width, 1);
  POLE_KEYS.forEach((k, i) => {
    const x = left + cell * i, v = facts.vals[i];
    ctx.fillStyle = artRgba(lights[i].rgb, 1);
    ctx.font = '700 19px ' + inscr;
    const w = artTracked(ctx, POLES[k].name.toUpperCase(), x, 1076, 4, 'left');
    ctx.fillStyle = muted;
    ctx.font = 'italic 23px ' + greek;
    ctx.fillText(POLES[k].greek, x + w + 12, 1076);
    ctx.font = '800 96px ' + display;
    ctx.fillStyle = artRgba(lights[i].rgb, 1, 0.12);
    ctx.shadowColor = artRgba(lights[i].rgb, 0.7); ctx.shadowBlur = 30;
    if (v == null) ctx.fillRect(x, 1134, 46, 5); /* no reading yet */
    else ctx.fillText(String(Math.round(v)), x - 3, 1166);
    ctx.shadowBlur = 0;
  });

  /* Record and date */
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.fillRect(left, 1194, width, 1);
  const stats = [
    facts.nSpeeches + ' ' + (facts.nSpeeches === 1 ? 'speech' : 'speeches') + ' analyzed',
    facts.nVivas + ' oral ' + (facts.nVivas === 1 ? 'exam' : 'exams'),
    'Best streak ' + facts.best,
  ].join('   ·   ').toUpperCase();
  let statSize = 19;
  ctx.font = '600 ' + statSize + 'px ' + inscr;
  while (statSize > 12 && artTrackedWidth(ctx, stats, 2) > width) { statSize -= 1; ctx.font = '600 ' + statSize + 'px ' + inscr; }
  ctx.fillStyle = 'rgba(242,243,255,.86)';
  artTracked(ctx, stats, left, 1230, 2, 'left');
  ctx.fillStyle = 'rgba(242,243,255,.74)';
  ctx.font = 'italic 25px ' + greek;
  ctx.fillText('Three lights. One voice.', left, 1266);
  ctx.fillStyle = muted;
  ctx.font = '600 16px ' + inscr;
  artTracked(ctx, String(dateText).toUpperCase(), right, 1264, 2.5, 'right');

  /* Fine grain keeps the dark gradients from banding */
  const grain = artGrainTile();
  if (grain) {
    const pat = ctx.createPattern(grain, 'repeat');
    if (pat) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.022;
      ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
function artPosterFonts() {
  const specs = ['700 38px "Bricolage Grotesque"', '800 92px "Bricolage Grotesque"', 'italic 30px "GFS Didot"'];
  try {
    const f = document.fonts;
    if (!f) return Promise.resolve();
    const loads = f.load ? specs.map((s) => Promise.resolve(f.load(s, 'ROSTRA ἦθος')).catch(() => null)) : [];
    const ready = Promise.all(loads).then(() => f.ready);
    return Promise.race([ready, new Promise((res) => setTimeout(res, 1800))]).catch(() => null);
  } catch (e) { return Promise.resolve(); }
}
/* Generative "rhetorical fingerprint" poster. Resolves a PNG Blob (1080x1350).
   Called as makePoster({ profile, speeches, vivas }). Always returns a promise, even with no canvas. */
function makePoster(args) {
  try {
    const { profile, speeches, vivas } = args || {};
    const canvas = artCanvas(ART_POSTER_W, ART_POSTER_H);
    /* A software canvas: the poster is drawn once and read back once, which is far faster off the GPU */
    const ctx = canvas && canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return Promise.reject(new Error('Canvas is not available'));
    const facts = artPosterFacts(profile, speeches, vivas);
    const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    return artPosterFonts().then(() => new Promise((resolve, reject) => {
      artDrawPoster(ctx, facts, artStageColors(), date);
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('The poster could not be encoded')); }, 'image/png');
    }));
  } catch (e) { return Promise.reject(e); }
}

/* Modal that previews the poster and offers to save it. */
function PosterModal({ onClose }) {
  const st = useStore();
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const blobRef = useRef(null);
  const triedData = useRef(false);
  /* A sandbox may refuse blob: images. A data URL is heavier but always displays. */
  const onImgError = () => {
    if (triedData.current || !blobRef.current) { setFailed(true); setUrl(null); return; }
    triedData.current = true;
    const r = new FileReader();
    r.onload = () => setUrl(r.result);
    r.onerror = () => { setFailed(true); setUrl(null); };
    r.readAsDataURL(blobRef.current);
  };
  useEffect(() => {
    let alive = true, made = null;
    Promise.resolve()
      .then(() => makePoster({ profile: st.profile, speeches: st.speeches, vivas: st.vivas }))
      .then((blob) => {
        if (!alive) return;
        blobRef.current = blob;
        made = URL.createObjectURL(blob);
        setUrl(made);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, []);
  const save = async () => {
    const blob = blobRef.current;
    if (!blob || saving) return;
    setNote('');
    setSaving(true);
    try {
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (!dl) { setNote('Saving isn’t available in this view. Right-click or long-press the image to keep it.'); return; }
      await dl.save({ filename: 'rostra-fingerprint.png', data: blob });
      Store.act((p) => { p.stats.posters = (p.stats.posters || 0) + 1; });
      toast('Saved');
    } catch (e) {
      if (!(e && e.code === 'declined')) setNote('The image didn’t save. Try again, or right-click or long-press it to keep it.');
    } finally { setSaving(false); }
  };
  return html`<${Modal} onClose=${onClose} wide=${true} label="Your rhetorical fingerprint">
    <div className="art-poster-head">
      <p className="eyebrow">Rhetorical fingerprint</p>
      <h2>Three lights, printed in your name</h2>
      <p className="small muted">Your scores set the size of each light. Your name and record shape the ridges, so no two speakers get the same print.</p>
    </div>
    <div className="art-poster-frame">
      ${url ? html`<img className="art-poster-img" src=${url} onError=${onImgError} alt="Your rhetorical fingerprint: three stage lights mixing over your rhetorical triangle, with your name, archetype, scores and record." />`
      : failed ? html`<div className="art-poster-wait"><p className="notice notice-warn">We couldn’t draw your poster in this browser. Everything else still works.</p></div>`
      : html`<div className="art-poster-wait" role="status">
          <span className="art-poster-lamps" aria-hidden="true"><i></i><i></i><i></i></span>
          <span className="inscr art-poster-working">Setting the lights</span>
        </div>`}
    </div>
    ${note ? html`<p className="notice" role="status">${note}</p>` : null}
    <div className="art-poster-actions">
      <button type="button" className="btn" onClick=${onClose}>Close</button>
      <button type="button" className="btn-cta gold" disabled=${!url || saving} onClick=${save}><${Icon} name="download" size=${18} />${saving ? 'Saving…' : 'Save image'}</button>
    </div>
  <//>`;
}
