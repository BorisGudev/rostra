// Headless harness for JavaScriptCore (macOS `jsc`). Stubs the browser and React, loads every
// src file in build order, then loads each test file given on the command line.
//   JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
//   $JSC tests/harness.js -- "$PWD/src" "$PWD/tests/core.test.js" [more.test.js ...]
// htm is stubbed: html`` returns {strings, vals}, so calling a component function directly
// evaluates every interpolation in its body (catching reference and type errors) without a DOM.
var SRC = arguments[0];
var EXTRA = arguments.slice(1);
var window = this;
var console = { log: function () { print.apply(null, arguments); }, error: function () { print.apply(null, ['ERR'].concat([].slice.call(arguments))); }, warn: function () {} };
var _ls = {};
var localStorage = { getItem: function (k) { return k in _ls ? _ls[k] : null; }, setItem: function (k, v) { _ls[k] = String(v); }, removeItem: function (k) { delete _ls[k]; } };
var sessionStorage = localStorage;
var location = { hash: '' };
var navigator = {};
var performance = { now: function () { return Date.now(); } };
['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'].forEach(function (n) { if (typeof window[n] === 'undefined') window[n] = function () { return 0; }; });
var requestAnimationFrame = function () { return 0; };
var cancelAnimationFrame = function () {};
var document = { getElementById: function () { return {}; }, documentElement: { style: { setProperty: function () {} } }, createElement: function () { return { getContext: function () { return null; }, style: {} }; }, addEventListener: function () {}, removeEventListener: function () {}, body: {} };
window.matchMedia = function () { return { matches: false, addEventListener: function () {}, removeEventListener: function () {} }; };
window.addEventListener = function () {};
window.removeEventListener = function () {};
window.innerWidth = 1280; window.innerHeight = 800; window.devicePixelRatio = 1;
var getComputedStyle = function () { return { getPropertyValue: function () { return ''; } }; };
var React = {
  createElement: function (t, p) { return { t: t, p: p }; },
  useState: function (v) { return [typeof v === 'function' ? v() : v, function () {}]; },
  useEffect: function () {}, useLayoutEffect: function () {},
  useRef: function (v) { return { current: v }; }, useMemo: function (f) { return f(); },
  useCallback: function (f) { return f; }, useId: function () { return ':r1:'; }, useReducer: function (r, i) { return [i, function () {}]; },
  memo: function (c) { return c; }, forwardRef: function (c) { return c; },
  createContext: function (v) { return { Provider: 'p', Consumer: 'c', _v: v }; }, useContext: function (c) { return c && c._v; },
  Fragment: 'frag', Component: function (p) { this.props = p; },
};
var htm = { bind: function () { return function (strings) { return { strings: strings, vals: [].slice.call(arguments, 1) }; }; } };
var ReactDOM = { createRoot: function () { return { render: function () {} }; } };

['data.js', 'engine.js', 'ui.js', 'kit.js', 'art.js', 'pages-core.js', 'pages-more.js', 'viva.js', 'gym.js', 'app.js'].forEach(function (f) { load(SRC + '/' + f); });

var fails = 0;
function check(name, fn) {
  try { var r = fn(); print('ok   ' + name + (r !== undefined ? '  ->  ' + (typeof r === 'string' ? r : JSON.stringify(r)) : '')); }
  catch (e) { fails++; print('FAIL ' + name + ': ' + (e && e.stack ? e.message + '\n' + e.stack.split('\n').slice(0, 4).join('\n') : JSON.stringify(e))); }
}
EXTRA.forEach(function (f) { load(f); });
print(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
