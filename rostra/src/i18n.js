/* ================================================================
   Translation layer. English is the source language and the key; Bulgarian lives in i18n-bg.js.
     t('Sign in')                      -> 'Вход'
     t`You answered ${n} of ${m}`       -> key 'You answered {0} of {1}', values filled back in
   A missing translation falls back to the English text (and is counted, so a test can report coverage).
   The language is read once at load time from localStorage, so top-level constants translate too;
   changing it reloads the page. Loaded first, before data.js.
   ================================================================ */
const I18N = {
  lang: 'en',
  dict: { en: null, bg: {} },
  missing: new Set(),
  LANGS: { en: 'English', bg: 'Български' },
  key(strings, vals) {
    if (typeof strings === 'string') return strings;
    let k = '';
    for (let i = 0; i < strings.length; i++) { k += strings[i]; if (i < vals.length) k += '{' + i + '}'; }
    return k;
  },
  lookup(key) {
    if (this.lang === 'en') return key;
    const d = this.dict[this.lang];
    const v = d && d[key];
    if (typeof v === 'string' && v) return v;
    this.missing.add(key);
    return key;
  },
  fill(text, vals) {
    if (!vals.length) return text;
    /* Values that are not plain text (html nodes) cannot be joined into a string: return the parts instead. */
    const rich = vals.some((v) => v && typeof v === 'object');
    const parts = text.split(/\{(\d+)\}/);
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) { if (parts[i]) out.push(parts[i]); }
      else { const v = vals[Number(parts[i])]; out.push(v == null ? '' : v); }
    }
    return rich ? out : out.join('');
  },
  set(lang) {
    this.lang = this.LANGS[lang] ? lang : 'en';
    try { localStorage.setItem('rostra.v1.lang', JSON.stringify(this.lang)); } catch (e) { /* ignore */ }
    try { document.documentElement.lang = this.lang; } catch (e) { /* ignore */ }
  },
};
(function initLang() {
  let lang = null;
  try { const v = localStorage.getItem('rostra.v1.lang'); lang = v ? JSON.parse(v) : null; } catch (e) { lang = null; }
  if (!lang) { try { lang = /^bg/i.test(navigator.language || '') ? 'bg' : 'en'; } catch (e) { lang = 'en'; } }
  I18N.lang = I18N.LANGS[lang] ? lang : 'en';
  try { document.documentElement.lang = I18N.lang; } catch (e) { /* ignore */ }
})();
function t(strings, ...vals) {
  const key = I18N.key(strings, vals);
  return I18N.fill(I18N.lookup(key), typeof strings === 'string' ? [] : vals);
}
/* Plural helper that translates both forms: tn(n, 'word', 'words') */
function tn(n, one, many) { return `${n} ${n === 1 ? t(one) : t(many)}`; }
