# How to wrap user-facing strings for translation (brief for the wrapping pass)

Rostra's interface strings are English in the source; `t()` looks them up in the Bulgarian dictionary at runtime and
falls back to English. Your job is purely mechanical: wrap every piece of text a user can read, without changing any
English wording, any logic, or any test expectation (English is a passthrough, so all tests must stay green).

## The API (defined in `rostra/src/i18n.js`, loaded first; it is a global like everything else)
- `t('Sign in')` for a plain string.
- `` t`You answered ${n} of ${m} questions` `` for text with values. Interpolations become `{0} {1}` in the key.
- `tn(n, 'word', 'words')` returns `"3 words"` with both forms translated. Use it instead of `plural(n, 'word')` only
  where the call is in UI text (leave `plural` in prompts alone).

## Where to wrap (user-visible text)
1. Text inside `html\`...\`` templates: `<h2>Your classes</h2>` → `<h2>${t('Your classes')}</h2>`.
   A run of text with an interpolation: `<p>Code ${c.code} · ${n} students</p>` → `<p>${t\`Code ${c.code} · ${n} students\`}</p>`.
   Keep each sentence/phrase as one key; do not split a sentence into fragments. Trailing punctuation stays inside the key.
2. Attributes that users see or screen readers announce: `placeholder="..."`, `aria-label="..."`, `title="..."`,
   `alt="..."`: `placeholder=${t('Your first name')}`.
3. String literals in JS that end up on screen: `toast('Saved')` → `toast(t('Saved'))`; status objects, labels in
   arrays of options (`{ id: 'quick', label: 'Quick', desc: '...' }` → `label: t('Quick'), desc: t('...')`),
   ternaries that pick a text, `setErr('...')`, error texts returned from functions like `aiErrorText`.
4. Top-level constant tables are fine to wrap (`const X = [{ label: t('Quick') }]`): i18n.js loads before every other file.

## Where NOT to wrap
- Prompts sent to the AI (anything built for `AI.json` / `AI.text`, `vivaPlanPrompt`, `analysisPrompt`, etc.), their
  JSON shapes, and the mock answers. The AI is told the language separately.
- Keys, ids, CSS class names, icon names, regexes, `lang="grc"` Greek words, `console.*`, comments, URLs, data content
  in `data.js` other than the short labels listed in your task (lessons, library speeches and quiz content stay English).
- Markdown export builders are optional: wrap them only if trivial.
- `aria-pressed`, `aria-expanded` values, `role` values.

## htm gotchas (the templates are htm, not JSX)
- Inside a template, text and `${...}` must stay on one line as they are now; do not introduce line breaks inside a
  tag's children where there were none (htm trims whitespace containing newlines, which eats spaces).
- Never put a template literal containing a backtick inside another backtick string; `t\`...\`` inside `html\`...\``
  is fine because it is inside `${ }`.
- Keep real characters (’ — · …) exactly as they are in the key; the Bulgarian file will use the same key.
- Apostrophes: inside `t('...')` use the typographic ’ that the source already uses, or escape `\'` if an ASCII
  apostrophe appears in the string.

## Checking your work
Run from the repo root after each file: `node scripts/build.mjs && node --test "tests/unit/**/*.test.mjs"` (all
suites must pass) and `node scripts/i18n-extract.mjs` (prints how many keys exist; it should grow). If a test fails,
you broke a template or a logic branch: fix it, do not change the test. `node scripts/lint-i18n.mjs <file>` (if it
exists) prints template text that still looks unwrapped; use it as a hint, not a rule.
