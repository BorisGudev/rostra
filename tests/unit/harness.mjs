/* Headless harness for Node. Stubs the browser and React, loads every src file in build order into one
   vm context (the same single global scope the page has), and returns that context.
   htm is stubbed: html`` returns {strings, vals}, so calling a component function directly evaluates every
   interpolation in its body (catching reference and type errors) without a DOM. Hooks return their initial
   values and effects never run. Ported from the macOS JavaScriptCore harness so the suites run on Linux. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { SCRIPTS } from '../../scripts/build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');
export const SRC = path.join(ROOT, 'rostra', 'src');

export function makeContext({ log = () => {} } = {}) {
  const ctx = {};
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.self = ctx;
  ctx.console = { log, error: (...a) => log('ERR', ...a), warn: () => {}, info: () => {}, debug: () => {} };
  const ls = {};
  ctx._ls = ls; // the legacy persist suite wipes storage through this
  /* jsc has drainMicrotasks(); Node has only the undocumented process._tickCallback(). Guarded, because a future Node may drop it. */
  ctx.drainMicrotasks = () => { try { if (typeof process._tickCallback === 'function') process._tickCallback(); } catch (e) { /* ignore */ } };
  ctx.localStorage = { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; }, clear: () => { for (const k of Object.keys(ls)) delete ls[k]; } };
  ctx.sessionStorage = ctx.localStorage;
  ctx.location = { hash: '', pathname: '/', search: '', origin: 'http://localhost', href: 'http://localhost/' };
  ctx.history = { replaceState() {}, pushState() {} };
  ctx.navigator = { language: 'en', languages: ['en'], mediaDevices: undefined, userAgent: 'node' };
  ctx.performance = { now: () => Date.now() };
  ctx.setTimeout = () => 0; ctx.clearTimeout = () => {}; ctx.setInterval = () => 0; ctx.clearInterval = () => {};
  ctx.requestAnimationFrame = () => 0; ctx.cancelAnimationFrame = () => {};
  ctx.queueMicrotask = (f) => { try { f(); } catch (e) { /* ignore */ } };
  ctx.document = {
    getElementById: () => ({}), querySelector: () => null, querySelectorAll: () => [],
    documentElement: { style: { setProperty() {} }, dataset: {}, lang: 'en', setAttribute() {}, removeAttribute() {} },
    createElement: () => ({ getContext: () => null, style: {}, setAttribute() {}, appendChild() {}, remove() {} }),
    addEventListener() {}, removeEventListener() {}, body: { appendChild() {}, removeChild() {} }, visibilityState: 'visible', title: '',
  };
  ctx.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  ctx.addEventListener = () => {}; ctx.removeEventListener = () => {};
  ctx.innerWidth = 1280; ctx.innerHeight = 800; ctx.devicePixelRatio = 1;
  ctx.getComputedStyle = () => ({ getPropertyValue: () => '' });
  ctx.fetch = async () => { throw new Error('no network in the harness'); };
  ctx.TextEncoder = TextEncoder; ctx.TextDecoder = TextDecoder; ctx.URL = URL; ctx.Blob = Blob;
  ctx.AbortController = AbortController;
  ctx.structuredClone = structuredClone;
  ctx.React = {
    createElement: (t, p) => ({ t, p }),
    useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
    useEffect() {}, useLayoutEffect() {},
    useRef: (v) => ({ current: v }), useMemo: (f) => f(),
    useCallback: (f) => f, useId: () => ':r1:', useReducer: (r, i) => [i, () => {}],
    memo: (c) => c, forwardRef: (c) => c,
    createContext: (v) => ({ Provider: 'p', Consumer: 'c', _v: v }), useContext: (c) => c && c._v,
    Fragment: 'frag', Component: function Component(p) { this.props = p; },
  };
  ctx.htm = { bind: () => (strings, ...vals) => ({ strings, vals }) };
  ctx.ReactDOM = { createRoot: () => ({ render() {} }) };
  ctx.supabase = undefined; // no account backend in the harness
  vm.createContext(ctx);
  for (const f of SCRIPTS) {
    const file = path.join(SRC, f);
    let code;
    try { code = readFileSync(file, 'utf8'); } catch (e) { continue; }
    vm.runInContext(code, ctx, { filename: file });
  }
  return ctx;
}

/* Run one legacy suite (tests/*.test.js style, using the global check(name, fn)). Returns {fails, lines}. */
export function runSuite(ctx, files) {
  const lines = [];
  let fails = 0;
  ctx.print = (...a) => lines.push(a.join(' '));
  ctx.readFile = (p) => readFileSync(p, 'utf8');
  ctx.SRC = SRC;
  ctx.check = (name, fn) => {
    try { const r = fn(); lines.push('ok   ' + name + (r !== undefined ? '  ->  ' + (typeof r === 'string' ? r : JSON.stringify(r)) : '')); }
    catch (e) { fails++; lines.push('FAIL ' + name + ': ' + (e && e.stack ? e.message + '\n' + e.stack.split('\n').slice(0, 4).join('\n') : JSON.stringify(e))); }
  };
  for (const f of files) vm.runInContext(readFileSync(f, 'utf8'), ctx, { filename: f });
  return { fails, lines };
}
