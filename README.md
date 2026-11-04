# Rostra

An AI coach for speaking. Rostra prepares you for a speech, rehearses you for an oral exam with AI examiners, and shows your progress over time, all built on Aristotle's three appeals: ethos, pathos and logos.

What it does and who it is for: [rostra-product-description.md](rostra-product-description.md).

## Try it on your computer

You need Python 3, which comes with macOS.

```bash
sh rostra/preview.sh
```

Then open `rostra/.preview/index.html` in a browser. The app runs fully on your machine and saves to that browser. The AI features (coach, exam questions, grading) only work inside Claude, so here they fall back to offline mode: template questions and self-marking.

## How it is built

Rostra is one self-contained HTML page: React 18 and htm from a CDN, no build tools beyond Python.

| Path | What it is |
|---|---|
| `rostra/src/*.js`, `rostra/src/*.css` | The source, concatenated in a fixed order |
| `rostra/build.py` | Joins the source into `rostra/rostra.html`, the page that gets published |
| `rostra/preview.sh` | Builds, then wraps the page so it opens in a normal browser |
| `rostra/tests/` | Headless tests and the brief every contributor follows |

Rebuild after editing anything in `src/`:

```bash
cd rostra && python3 build.py
```

Run the tests (macOS, using JavaScriptCore):

```bash
cd rostra && for t in art content gym persist visual viva; do /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/harness.js -- "$PWD/src" "$PWD/tests/core.test.js" "$PWD/tests/$t.test.js"; done
```

## Design

The look is called the Stoa: a colonnade at dusk, with the three appeals as three lights falling between the columns, each as bright as your score. Modern English carries the interface; ancient Greek sits quietly beside it. Key lines name the figure of speech they use in the margin, like a scholar's note. The full art direction is in [rostra/tests/BRIEF.md](rostra/tests/BRIEF.md).
