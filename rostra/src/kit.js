/* ================================================================
   Shared kit: extra icons, the klepsydra (water clock), Greek-key
   bars, text-to-speech and a countdown hook. Used by every module.
   ================================================================ */
Object.assign(ICONS, {
  scroll: 'M8 4h10a2 2 0 0 1 2 2v1.5h-4M8 4a2 2 0 0 0-2 2v12.5A1.5 1.5 0 0 0 7.5 20H16a2 2 0 0 0 2-2V7.5M8 4a2 2 0 0 1 2 2v12.5M11 10h4M11 14h4',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  dumbbell: 'M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11',
  hourglass: 'M6 3h12M6 21h12M7.5 3c0 4.5 9 4.5 9 9s-9 4.5-9 9M16.5 3c0 4.5-9 4.5-9 9s9 4.5 9 9',
  users: [{ c: [9, 8, 3.5] }, 'M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5'],
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z',
  image: [{ rect: [3, 4, 18, 16, 2] }, { c: [9, 10, 2] }, 'M21 16l-5-5-9 9'],
  mask: 'M4 5c5 2 11 2 16 0v6c0 5-3.5 9-8 9s-8-4-8-9zM8.5 11.5h2M13.5 11.5h2M9 15.5c1.8 1.2 4.2 1.2 6 0',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  help: [{ c: [12, 12, 9] }, 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.01'],
  feather: 'M20 4C11 4 6 10 5 19l-1 1M5 19c4-1 8-3 10-6M8.5 15.5h5M11 12h6',
});

/* ---------- Greek numerals: 6 is ϛʹ, the way an Athenian would have cut it. 1 to 999, otherwise plain digits. ---------- */
const GREEK_NUM = [['', 'α', 'β', 'γ', 'δ', 'ε', 'ϛ', 'ζ', 'η', 'θ'], ['', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ϟ'], ['', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'ϡ']];
function greekNumeral(n) {
  const v = Math.floor(Number(n));
  if (!(v >= 1 && v <= 999)) return String(n);
  return GREEK_NUM[2][Math.floor(v / 100)] + GREEK_NUM[1][Math.floor(v / 10) % 10] + GREEK_NUM[0][v % 10] + 'ʹ';
}

/* ---------- Scholion: a line that names its own figure of speech in the margin, like a scholar's note.
   Pass fig (a FIGURES key), or note, sub and def for a source instead of a figure. ---------- */
function scholionParts(text, marks) {
  if (typeof text !== 'string' || !marks || !marks.length) return text;
  const safe = marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return text.split(new RegExp('(' + safe.join('|') + ')')).filter(Boolean).map((part, i) => (marks.includes(part) ? html`<mark key=${i} className="scho-mark">${part}</mark>` : part));
}
function Scholion({ fig, note, sub, def, mark, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(false);
  const id = useId();
  const F = fig ? FIGURES[fig] : null;
  const top = note || (F && F.greek);
  if (!top) return html`<div className=${'scho ' + className}><p className="scho-line">${children}</p></div>`;
  return html`<div className=${'scho ' + className + (open ? ' is-open' : '') + (open || hot ? ' is-lit' : '')}>
    <p className="scho-line">${scholionParts(children, mark)}</p>
    <button type="button" className="scho-note" aria-expanded=${open} aria-controls=${id} onClick=${() => setOpen(!open)} onMouseEnter=${() => setHot(true)} onMouseLeave=${() => setHot(false)} onFocus=${() => setHot(true)} onBlur=${() => setHot(false)} title="What is this?"><span className="greek" lang="grc">${top}</span><span className="scho-en">${sub || (F && F.name)}</span></button>
    ${open ? html`<div className="scho-def" id=${id}><p>${def || (F && F.def)}</p>${F && F.lab ? html`<button type="button" className="scho-go" onClick=${() => go('gym', 'lab')}>Practice it in the Device Lab<${Icon} name="arrowR" size=${14} /></button>` : null}</div>` : null}
  </div>`;
}
/* ---------- Page head: the modern word in bold, the Greek one whispered above it ---------- */
function PageHead({ label, greek, title, fig, note, sub, def, mark, line, children, end }) {
  return html`<header className="page-head">
    <div className="page-head-text">
      <p className="page-whisper">${label ? html`<span className="page-label">${label}</span>` : null}<span className="greek" lang="grc">${greek}</span></p>
      <h1>${title}</h1>
      ${line ? html`<${Scholion} fig=${fig} note=${note} sub=${sub} def=${def} mark=${mark} className="page-line">${line}<//>` : null}
      ${children}
    </div>
    ${end || null}
  </header>`;
}

/* ---------- Countdown hook: returns seconds left (goes negative in overtime) ---------- */
function useCountdown({ seconds, running, resetKey, onEnd }) {
  const [left, setLeft] = useState(seconds);
  const leftRef = useRef(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => { leftRef.current = seconds; setLeft(seconds); }, [resetKey, seconds]);
  useEffect(() => {
    if (!running) return undefined;
    let last = performance.now();
    let fired = leftRef.current <= 0;
    const t = setInterval(() => {
      const now = performance.now();
      leftRef.current -= (now - last) / 1000;
      last = now;
      setLeft(leftRef.current);
      if (!fired && leftRef.current <= 0) { fired = true; if (endRef.current) endRef.current(); }
    }, 100);
    return () => clearInterval(t);
  }, [running, resetKey]);
  return left;
}

/* ---------- Klepsydra: the Athenian water clock that timed speeches in court ---------- */
const KLEP_UPPER = 'M20 12h60c1.5 0 2.4 1.6 1.6 2.9C75 26 63 36 56 47c-.6 1-1.7 1.6-2.9 1.6h-6.2c-1.2 0-2.3-.6-2.9-1.6C37 36 25 26 18.4 14.9 17.6 13.6 18.5 12 20 12z';
const KLEP_LOWER = 'M16 86h68v38c0 6.6-5.4 12-12 12H28c-6.6 0-12-5.4-12-12z';
function Klepsydra({ total, remaining, size = 120, running = false, label = true }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = clamp(total > 0 ? remaining / total : 0, 0, 1);
  const over = remaining < 0;
  const water = over ? 'var(--bad)' : f < 0.2 ? 'var(--warn)' : 'var(--ethos)';
  const upperTop = 12 + (1 - f) * 36.6;
  const lowerTop = 136 - (1 - f) * 50 - (over ? 4 : 0);
  const secs = Math.abs(remaining);
  return html`<div className="klep" style=${{ width: size }} role="timer" aria-label=${over ? `${fmtTime(secs)} over time` : `${fmtTime(secs)} remaining`}>
    <svg viewBox="0 0 100 146" width=${size} height=${size * 1.46} aria-hidden="true">
      <defs>
        <clipPath id=${'ku' + rid}><path d=${KLEP_UPPER} /></clipPath>
        <clipPath id=${'kl' + rid}><path d=${KLEP_LOWER} /></clipPath>
      </defs>
      <path d=${KLEP_UPPER} className="klep-vessel" />
      <g clipPath=${`url(#ku${rid})`}><rect x="0" y=${upperTop} width="100" height="60" className="klep-water" style=${{ fill: water }} /></g>
      <rect x="47.5" y="48.5" width="5" height="8" rx="1.5" className="klep-spout" />
      ${running && f > 0 ? html`<g className="klep-stream" style=${{ stroke: water }}>
        <line x1="50" y1="57" x2="50" y2=${lowerTop} />
        <circle cx="50" cy="62" r="1.6" className="klep-drop" style=${{ fill: water }} />
        <circle cx="50" cy="62" r="1.6" className="klep-drop d2" style=${{ fill: water }} />
      </g>` : null}
      <path d=${KLEP_LOWER} className="klep-vessel" />
      <g clipPath=${`url(#kl${rid})`}><rect x="0" y=${lowerTop} width="100" height="80" className="klep-water" style=${{ fill: water }} /></g>
      ${[0.25, 0.5, 0.75].map((m) => html`<line key=${m} x1="78" x2="84" y1=${136 - m * 50} y2=${136 - m * 50} className="klep-mark" />`)}
      <path d="M12 86h76" className="klep-rim" />
    </svg>
    ${label ? html`<span className=${'klep-time num' + (over ? ' over' : f < 0.2 ? ' low' : '')}>${over ? '+' : ''}${fmtTime(secs)}</span>` : null}
  </div>`;
}

/* ---------- Greek key (meander): progress bars and dividers ---------- */
const MEANDER_D = 'M0 17.5H20M2.5 17.5V4.5H17.5V14.5H7.5V8.5H12.5V11.5';
function MeanderBar({ value, color = 'var(--gold)', height = 16, label }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const v = clamp(value || 0, 0, 100);
  return html`<svg className="meander-bar" width="100%" height=${height} preserveAspectRatio="none" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(v)} aria-label=${label || 'Progress'}>
    <defs>
      <pattern id=${'mf' + rid} width=${height * (20 / 20)} height=${height} patternUnits="userSpaceOnUse" viewBox="0 0 20 20" preserveAspectRatio="none">
        <path d=${MEANDER_D} style=${{ fill: 'none', stroke: 'var(--line-2)', strokeWidth: 2.2, strokeLinecap: 'square' }} />
      </pattern>
      <pattern id=${'mo' + rid} width=${height} height=${height} patternUnits="userSpaceOnUse" viewBox="0 0 20 20" preserveAspectRatio="none">
        <path d=${MEANDER_D} style=${{ fill: 'none', stroke: color, strokeWidth: 2.6, strokeLinecap: 'square' }} />
      </pattern>
      <clipPath id=${'mc' + rid}><rect x="0" y="0" width=${v + '%'} height="100%" className="meander-clip" /></clipPath>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" style=${{ fill: `url(#mf${rid})` }} />
    <rect x="0" y="0" width="100%" height="100%" clipPath=${`url(#mc${rid})`} style=${{ fill: `url(#mo${rid})` }} />
  </svg>`;
}
function Meander({ className = '', height = 12 }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return html`<svg className=${'meander ' + className} width="100%" height=${height} aria-hidden="true">
    <defs><pattern id=${'md' + rid} width=${height} height=${height} patternUnits="userSpaceOnUse" viewBox="0 0 20 20"><path d=${MEANDER_D} style=${{ fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square' }} /></pattern></defs>
    <rect x="0" y="0" width="100%" height="100%" style=${{ fill: `url(#md${rid})` }} />
  </svg>`;
}

/* ---------- Voice: text-to-speech for examiners and drills (optional, feature-detected) ---------- */
const Voice = {
  get ok() { try { return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function'; } catch (e) { return false; } },
  enabled: true,
  voices() {
    try { const vs = window.speechSynthesis.getVoices(); const en = vs.filter((v) => /^en/i.test(v.lang)); return en.length ? en : vs; } catch (e) { return []; }
  },
  speak(text, opts = {}) {
    const { rate = 1, pitch = 1, voiceIndex = 0, onend } = opts;
    const done = () => { if (onend) onend(); };
    if (!this.ok || !this.enabled || !text) { done(); return; }
    try {
      window.speechSynthesis.cancel();
      const u = new window.SpeechSynthesisUtterance(text);
      const vs = this.voices();
      if (vs.length) u.voice = vs[Math.abs(voiceIndex) % vs.length];
      u.rate = rate; u.pitch = pitch;
      u.onend = done; u.onerror = done;
      window.speechSynthesis.speak(u);
    } catch (e) { done(); }
  },
  stop() { try { if (this.ok) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
};
