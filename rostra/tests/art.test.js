// Art engine checks: every component in every state, the pure logic, and the drawing code on a stub canvas.
function artAssert(c, msg) { if (!c) throw new Error(msg || 'assertion failed'); }

/* A 2D context that accepts every call, so render paths run without a browser. */
function artStubCtx(w, h) {
  var target = {
    canvas: { width: w, height: h },
    createImageData: function (iw, ih) { return { width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) }; },
    createLinearGradient: function () { return { addColorStop: function () {} }; },
    createRadialGradient: function () { return { addColorStop: function () {} }; },
    createPattern: function () { return {}; },
    measureText: function (s) { return { width: String(s).length * 10 }; },
  };
  return new Proxy(target, {
    get: function (t, k) { if (k in t) return t[k]; return function () {}; },
    set: function (t, k, v) { t[k] = v; return true; },
  });
}
function artStubCanvas(w, h) {
  var ctx = null;
  return {
    width: w || 300, height: h || 150, style: {},
    getContext: function () { if (!ctx) ctx = artStubCtx(this.width, this.height); return ctx; },
    toDataURL: function () { return 'data:image/png;base64,AAAA'; },
    toBlob: function (cb) { cb({ size: 1, type: 'image/png' }); },
  };
}
/* Runs fn with document.createElement handing out stub canvases, then restores it. */
function artWithCanvas(fn) {
  var was = document.createElement;
  document.createElement = function () { return artStubCanvas(); };
  try { return fn(); } finally { document.createElement = was; }
}
var ART_SC = { ethos: 72, pathos: 55, logos: 88 };

check('Stoa renders in every state', function () {
  Stoa({ scores: ART_SC, height: 560, children: { x: 1 } });
  Stoa({ scores: {}, children: null });
  Stoa({ scores: { ethos: null, pathos: 40, logos: null }, selected: 'pathos' });
  var out = Stoa({});
  artAssert(out && out.strings, 'no template');
  artAssert(out.strings.join('').indexOf('stoa-content') > 0, 'no content overlay');
  var scene = StoaScene({ scores: ART_SC, selected: 'ethos', from: 0.03, to: 0.97, steps: 42, className: 'stoa-scene-narrow' });
  artAssert(scene.strings.join('').indexOf('<svg') > 0, 'no svg');
});
check('Curtain: play false renders nothing, play true renders the doors', function () {
  artAssert(Curtain({ play: false, onDone: function () {} }) === null, 'should be null when idle');
  var open = Curtain({ play: true, onDone: function () {} });
  artAssert(open && open.strings.join('').indexOf('art-curtain') > 0, 'no curtain markup');
  Curtain({ play: true });
});
check('Curtain with reduced motion renders nothing', function () {
  var was = window.matchMedia;
  window.matchMedia = function () { return { matches: true }; };
  try { artAssert(Curtain({ play: true, onDone: function () {} }) === null, 'should skip'); }
  finally { window.matchMedia = was; }
});
check('Curtain mounts in the app shell when portals are available, so a page transform cannot trap it', function () {
  var portalWas = ReactDOM.createPortal, queryWas = document.querySelector, into = null;
  var shell = { className: 'app' };
  ReactDOM.createPortal = function (node, target) { into = target; return { portal: node }; };
  document.querySelector = function (sel) { return sel === '.app' ? shell : null; };
  try {
    var out = Curtain({ play: true, onDone: function () {} });
    artAssert(out && out.portal && into === shell, 'not portaled');
    document.querySelector = function () { return null; };
    artAssert(Curtain({ play: true }).strings, 'no fallback when the shell is missing');
  } finally { ReactDOM.createPortal = portalWas; document.querySelector = queryWas; }
});
check('PosterModal renders', function () {
  var out = PosterModal({ onClose: function () {} });
  artAssert(out && out.strings, 'no template');
});
check('limelightColor: three full lights are white', function () {
  artAssert(limelightColor({ ethos: 100, pathos: 100, logos: 100 }) === 'rgb(255 255 255)', limelightColor({ ethos: 100, pathos: 100, logos: 100 }));
});
check('limelightColor: equal lights have no hue at any level', function () {
  var m = /rgb\((\d+) (\d+) (\d+)\)/.exec(limelightColor({ ethos: 40, pathos: 40, logos: 40 }));
  artAssert(m && m[1] === m[2] && m[2] === m[3], 'tinted');
});
check('limelightColor: one light keeps its own hue', function () {
  function channels(sc) { return /rgb\((\d+) (\d+) (\d+)\)/.exec(limelightColor(sc)).slice(1).map(Number); }
  var e = channels({ ethos: 100, pathos: 0, logos: 0 }), p = channels({ ethos: 0, pathos: 100, logos: 0 }), l = channels({ ethos: 0, pathos: 0, logos: 100 });
  artAssert(e[2] > e[0] && e[2] > e[1], 'ethos should be blue: ' + e);
  artAssert(p[0] > p[1] && p[0] > p[2], 'pathos should be red: ' + p);
  artAssert(l[1] > l[0] && l[1] > l[2], 'logos should be green: ' + l);
});
check('limelightColor: nulls and garbage still give a valid color', function () {
  var inputs = [null, undefined, {}, { ethos: null, pathos: null, logos: null }, { ethos: 0, pathos: 0, logos: 0 }, { ethos: 80, pathos: null, logos: 20 }, { ethos: NaN, pathos: 'x', logos: 400 }, { ethos: -20, pathos: 50, logos: 50 }];
  var outs = inputs.map(limelightColor);
  outs.forEach(function (c) {
    var m = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(c);
    artAssert(m, 'bad color ' + c);
    artAssert(+m[1] <= 255 && +m[2] <= 255 && +m[3] <= 255, 'out of range ' + c);
  });
  return outs.join(', ');
});
check('triLight prefers limelightColor', function () {
  artAssert(triLight({ ethos: 100, pathos: 100, logos: 100 }) === 'rgb(255 255 255)', 'not routed');
});
check('artParseRgb reads every token format', function () {
  artAssert(artParseRgb('#6F8CFF', null).join() === '111,140,255', 'hex6');
  artAssert(artParseRgb(' #fff ', null).join() === '255,255,255', 'hex3');
  artAssert(artParseRgb('rgb(1 2 3)', null).join() === '1,2,3', 'space');
  artAssert(artParseRgb('rgba(1, 2, 3, .5)', null).join() === '1,2,3', 'comma');
  artAssert(artParseRgb('', [9, 9, 9]).join() === '9,9,9', 'fallback');
});
check('stoaGeometry keeps four columns and three lights on stage at phone and desktop sizes', function () {
  [[343, 400, 0.03, 0.97, 42], [640, 460, 0.5, null, 66], [1000, 480, null, null, 66], [1600, 620, null, null, 66]].forEach(function (s) {
    var g = stoaGeometry(s[0], s[1], { from: s[2] != null ? s[0] * s[2] : undefined, to: s[3] != null ? s[0] * s[3] : undefined, steps: s[4] });
    artAssert(g.columns.length === 4, 'columns ' + g.columns.length);
    artAssert(g.lights.map(function (l) { return l.key; }).join() === POLE_KEYS.join(), 'lights');
    artAssert(g.floor > g.head && g.floor < s[1], 'floor ' + g.floor);
    g.columns.forEach(function (c) { artAssert(c.x >= 0 && c.x + c.w <= s[0], 'column off stage: ' + c.x); });
    artAssert(g.treads.length === 3 && g.treads[2].y + g.treads[2].h >= s[1], 'steps stop short');
  });
});
check('stoaLevel: a stronger appeal burns brighter, and selecting one lets the others fall back', function () {
  artAssert(stoaLevel(90) > stoaLevel(40), 'score');
  artAssert(stoaLevel(40, true, true) > stoaLevel(40), 'selected');
  artAssert(stoaLevel(40, false, true) < stoaLevel(40), 'others');
  [null, undefined, NaN, 'x', -20, 400].forEach(function (v) { var l = stoaLevel(v); artAssert(l >= 0 && l <= 1, 'range ' + v + ' ' + l); });
});
check('applause samples: length, level and density scale with strength', function () {
  var quiet = artApplauseSamples(0.1, 8000, seeded(1)), loud = artApplauseSamples(1, 8000, seeded(1));
  artAssert(quiet.dur >= 2 && loud.dur <= 4 && loud.dur > quiet.dur, 'duration ' + quiet.dur + ' ' + loud.dur);
  artAssert(loud.claps > quiet.claps * 2, 'density ' + quiet.claps + ' ' + loud.claps);
  var peak = 0, energy = 0;
  for (var i = 0; i < loud.L.length; i++) { peak = Math.max(peak, Math.abs(loud.L[i]), Math.abs(loud.R[i])); energy += loud.L[i] * loud.L[i]; }
  artAssert(peak > 0.5 && peak <= 0.91, 'peak ' + peak);
  artAssert(energy > 0, 'silent');
  /* it swells: the first tenth is quieter than the middle */
  function rms(a, from, to) { var s = 0; for (var j = from; j < to; j++) s += a[j] * a[j]; return s / (to - from); }
  var n = loud.L.length;
  artAssert(rms(loud.L, 0, Math.floor(n * 0.1)) < rms(loud.L, Math.floor(n * 0.25), Math.floor(n * 0.45)), 'no swell');
  return { quiet: quiet.claps, loud: loud.claps };
});
check('applause never throws: no audio, sound off, garbage strength', function () {
  Sound.applause(1); Sound.applause(0); Sound.applause(); Sound.applause('loud'); Sound.applause(NaN);
  var was = Sound.enabled;
  Sound.enabled = false;
  Sound.applause(1);
  Sound.enabled = was;
  var ensure = Sound.ensure;
  Sound.ensure = function () { throw new Error('no audio'); };
  Sound.applause(0.5);
  Sound.ensure = ensure;
});
check('applause schedules one buffer through WebAudio', function () {
  var started = 0, ensure = Sound.ensure, was = Sound.enabled;
  Sound.enabled = true;
  Sound.ensure = function () {
    return {
      sampleRate: 8000, currentTime: 0, destination: {},
      createBuffer: function (ch, len) { var d = new Float32Array(len); return { getChannelData: function () { return d; } }; },
      createBufferSource: function () { return { connect: function () {}, start: function () { started++; } }; },
      createGain: function () { return { gain: { value: 0 }, connect: function () {} }; },
    };
  };
  try { Sound.applause(0.7); } finally { Sound.ensure = ensure; Sound.enabled = was; }
  artAssert(started === 1, 'started ' + started);
});
check('makePoster returns a rejected promise without a canvas, and never throws', function () {
  var settled = { rejected: 0 };
  [undefined, null, {}, { profile: null }, { profile: { name: 'Ada', skills: ART_SC, xp: 1200 }, speeches: [], vivas: [] }].forEach(function (a) {
    var p = makePoster(a);
    artAssert(p && typeof p.then === 'function', 'not a promise');
    p.then(function () { throw new Error('should reject'); }, function () { settled.rejected++; });
  });
  if (typeof drainMicrotasks === 'function') { drainMicrotasks(); artAssert(settled.rejected === 5, 'rejected ' + settled.rejected); }
});
check('artPosterFacts handles empty and full profiles', function () {
  var empty = artPosterFacts(null, null, null);
  artAssert(empty.first && empty.name === 'A speaker' && empty.archetype === 'Your stage is set', 'empty facts');
  artAssert(artPosterFacts({ name: '   ' }).name === 'A speaker', 'blank name');
  var full = artPosterFacts({ name: 'Ada', xp: 1200, skills: ART_SC, streak: { best: 9 }, stats: { speeches: 2, vivas: 1 } }, [{}, {}, {}], [{ status: 'done' }, { status: 'live' }]);
  artAssert(!full.first && full.nSpeeches === 3 && full.nVivas === 1 && full.best === 9, JSON.stringify(full));
  artAssert(full.archetype === archetypeOf(ART_SC).name, 'archetype');
  artAssert(full.seed !== artPosterFacts({ name: 'Grace', xp: 1200, skills: ART_SC, streak: { best: 9 }, stats: { speeches: 2, vivas: 1 } }, [{}, {}, {}], [{ status: 'done' }]).seed, 'same seed for different speakers');
});
check('poster draws on a stub canvas for first light, a full profile and a very long name', function () {
  artWithCanvas(function () {
    var colors = artStageColors();
    [
      artPosterFacts(null, null, null),
      artPosterFacts({ name: 'Ada', xp: 1200, skills: ART_SC, streak: { best: 9 } }, [{}], []),
      artPosterFacts({ name: 'Wolfeschlegelsteinhausenbergerdorff the Elder of Rhodes', xp: 99999, skills: { ethos: 100, pathos: 0, logos: null } }, [], []),
    ].forEach(function (f) { artDrawPoster(artStubCtx(1080, 1350), f, colors, 'October 30, 2026'); });
  });
});
check('makePoster resolves a blob on a stub canvas', function () {
  var got = null;
  artWithCanvas(function () {
    makePoster({ profile: { name: 'Ada', skills: ART_SC }, speeches: [], vivas: [] }).then(function (b) { got = b; });
    if (typeof drainMicrotasks === 'function') drainMicrotasks();
  });
  if (typeof drainMicrotasks === 'function') artAssert(got && got.type === 'image/png', 'no blob');
});
