/* ================================================================
   Speech capture: the microphone path used by the oral exam (and anything else that records).
   - SpeechCapture.support(): what this browser can do.
   - SpeechCapture.start({lang, live, onLevel, onInterim}) -> handle; handle.stop() -> {blob, durationSec, liveText}
   - speechTranscribe(blob, {lang, liveText, doc}) -> {text, source}: server speech-to-text when the server has a
     provider, otherwise the browser's own live recognition text, otherwise nothing (the student types).
   - speechDelivery(blob, text) -> measured delivery (pace, pauses, filler words) from the recording, on the device.
   The audio itself is never stored or kept after the answer is processed.
   ================================================================ */
const SPEECH_MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const SPEECH_LANG = { en: 'en-US', bg: 'bg-BG' };

const SpeechCapture = {
  support() {
    let mic = false, live = false, recorder = false;
    try { mic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); } catch (e) { mic = false; }
    try { recorder = typeof window.MediaRecorder === 'function'; } catch (e) { recorder = false; }
    try { live = !!(window.SpeechRecognition || window.webkitSpeechRecognition); } catch (e) { live = false; }
    return { mic: mic && recorder, live };
  },
  mime() {
    try { return SPEECH_MIMES.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || ''; } catch (e) { return ''; }
  },
  /* Ask for the microphone once, early (at "Begin the exam"), so the first answer does not start with a permission box. */
  async permit() {
    const s = this.support();
    if (!s.mic) return { ok: false, reason: 'unsupported' };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.getTracks().forEach((t) => t.stop());
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'unavailable' };
    }
  },
  /* Start recording. live: also run the browser's speech recognition (used only when the server has no provider). */
  async start({ lang = 'en', live = false, onLevel, onInterim, onError } = {}) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = this.mime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const t0 = performance.now();
    let paused = 0, pauseAt = 0;
    /* Level meter, for the "we can hear you" bar. */
    let ac = null, analyser = null, raf = 0, data = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && onLevel) {
        ac = new AC();
        const src = ac.createMediaStreamSource(stream);
        analyser = ac.createAnalyser(); analyser.fftSize = 1024;
        src.connect(analyser);
        data = new Uint8Array(analyser.fftSize);
        const tickLevel = () => {
          if (!analyser) return;
          analyser.getByteTimeDomainData(data);
          let s = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; s += v * v; }
          onLevel(Math.min(1, Math.sqrt(s / data.length) * 4));
          raf = requestAnimationFrame(tickLevel);
        };
        raf = requestAnimationFrame(tickLevel);
      }
    } catch (e) { /* the meter is a nicety */ }
    /* Live recognition (browser engine). Chrome ends a session after a while, so restart while recording. */
    let recog = null, liveFinal = '', liveInterim = '', liveOn = false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (live && SR) {
      try {
        recog = new SR();
        recog.lang = SPEECH_LANG[lang] || lang;
        recog.continuous = true; recog.interimResults = true; recog.maxAlternatives = 1;
        recog.onresult = (ev) => {
          let interim = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            if (r.isFinal) liveFinal += (liveFinal ? ' ' : '') + r[0].transcript.trim(); else interim += r[0].transcript;
          }
          liveInterim = interim;
          if (onInterim) onInterim((liveFinal + ' ' + liveInterim).trim());
        };
        recog.onerror = (ev) => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { liveOn = false; if (onError) onError(ev.error); } };
        recog.onend = () => { if (liveOn) { try { recog.start(); } catch (e) { /* already running */ } } };
        recog.start(); liveOn = true;
      } catch (e) { recog = null; }
    }
    rec.start(1000);
    return {
      mime: rec.mimeType || mime,
      pause() { if (rec.state === 'recording') { rec.pause(); pauseAt = performance.now(); } },
      resume() { if (rec.state === 'paused') { rec.resume(); paused += performance.now() - pauseAt; } },
      get liveText() { return (liveFinal + ' ' + liveInterim).trim(); },
      stop() {
        return new Promise((resolve) => {
          liveOn = false;
          try { if (recog) recog.stop(); } catch (e) { /* ignore */ }
          if (raf) cancelAnimationFrame(raf);
          analyser = null;
          try { if (ac) ac.close(); } catch (e) { /* ignore */ }
          const finish = () => {
            stream.getTracks().forEach((t) => t.stop());
            const durationSec = (performance.now() - t0 - paused) / 1000;
            resolve({ blob: new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }), durationSec, liveText: (liveFinal + ' ' + liveInterim).trim() });
          };
          if (rec.state === 'inactive') finish(); else { rec.onstop = finish; try { rec.stop(); } catch (e) { finish(); } }
        });
      },
    };
  },
};

/* Which transcription path this page uses. */
function speechMode() {
  const server = typeof Platform !== 'undefined' && Platform.config ? Platform.config.transcription : 'browser';
  if (server && server !== 'browser' && server !== 'none') return 'server';
  return SpeechCapture.support().live ? 'live' : 'none';
}

/* Turn a recording into text. Prefers the server; falls back to the browser's live text. */
async function speechTranscribe(blob, { lang = 'en', liveText = '', doc = null, signal } = {}) {
  const mode = speechMode();
  if (mode === 'server' && blob && blob.size > 0) {
    try {
      const r = await Platform.transcribe(blob, { lang, doc, signal });
      if (r && typeof r.text === 'string' && r.text.trim()) return { text: r.text.trim(), source: r.provider || 'server', words: r.words || null, duration: r.duration || null };
      if (liveText) return { text: liveText, source: 'live' };
      return { text: '', source: r && r.provider ? r.provider : 'server', empty: true };
    } catch (e) {
      if (liveText) return { text: liveText, source: 'live', error: e };
      return { text: '', source: 'error', error: e };
    }
  }
  if (liveText) return { text: liveText, source: 'live' };
  return { text: '', source: 'none' };
}

/* Measure delivery from the recording on the device: pace, pauses, filler words. Never an emotion. */
async function speechDelivery(blob, text, durationSec) {
  const out = { durationSec: Math.round(durationSec || 0), words: wordsOf(text).length, wpm: null, pausesLong: null, pausesDeliberate: null, fillers: findFillers(text || '').length, pitchStd: null };
  if (out.words && durationSec > 2) out.wpm = Math.round(out.words / (durationSec / 60));
  try {
    if (blob && blob.size > 1000 && typeof analyzeAudio === 'function') {
      const m = await analyzeAudio(blob, () => {});
      if (m && m.pauses) { out.pausesLong = m.pauses.long; out.pausesDeliberate = m.pauses.deliberate; }
      if (m && m.pitch && typeof m.pitch.std === 'number') out.pitchStd = +m.pitch.std.toFixed(1);
      if (m && m.speakingSec && out.words) out.wpm = Math.round(out.words / (Math.max(m.speakingSec, 1) / 60));
    }
  } catch (e) { /* the transcript alone still gives pace and fillers */ }
  /* Nobody speaks 400 words a minute: a figure outside human range means the clip and the text do not match. */
  if (out.wpm != null && (out.wpm > 300 || out.wpm < 30)) out.wpm = null;
  return out;
}

/* One line of measured facts for the examiner's prompt. */
function speechDeliveryLine(d) {
  if (!d) return '';
  const parts = [];
  if (d.wpm) parts.push(`${d.wpm} words per minute`);
  if (d.pausesLong != null) parts.push(`${d.pausesLong} silence${d.pausesLong === 1 ? '' : 's'} over 2 seconds`);
  if (d.fillers != null) parts.push(`${d.fillers} filler word${d.fillers === 1 ? '' : 's'}`);
  if (d.durationSec) parts.push(`spoke for ${fmtTime(d.durationSec)}`);
  return parts.length ? `Measured delivery (facts from the recording, not judgments): ${parts.join('; ')}.` : '';
}
