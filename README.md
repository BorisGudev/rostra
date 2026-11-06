# Rostra

An AI coach for speaking, built for schools. Rostra rehearses students for oral exams with an examiner who listens, follows up and grades, and gives feedback on speeches, all on Aristotle's three appeals: ethos, pathos and logos. Teachers set the work and see the results.

What the app does and who it is for: [rostra-product-description.md](rostra-product-description.md). The plan behind this version: [PLAN.md](PLAN.md). Lessons for the next person: [NOTES.md](NOTES.md).

## How it runs

```
Browser (one page, React + htm, self-hosted)  →  Netlify Functions (/api/*, Frankfurt)  →  Claude (Anthropic) · speech-to-text
                                              →  Supabase (Postgres + Auth, Frankfurt): accounts, classes, work, usage
```

- The Anthropic key lives only on the server. The browser calls `/api/ai` with the signed-in user's session.
- Students sign up with a class code, a name, a username and a password. No email is collected from them.
- Teachers sign up with their school's invite code. They create classes, set oral exams or speeches, and open each student's report.
- With no keys at all the whole app runs in **mock mode** (fixed AI answers, fixed transcripts, an in-memory database), which is what the tests use.

## Run it on your computer

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:8788. Without a `.env` you get mock AI and browser-only accounts. For the full flow locally:

```bash
MOCK_SUPABASE=1 MOCK_SEED=1 npm run dev
```

That serves an in-memory Supabase too: join as a teacher with invite code `DEMOSCHOOL`, create a class, then join as a student with its code.

To use real services, copy `.env.example` to `.env` and fill in what you have. Everything is optional; missing pieces fall back to mock or browser-only behaviour.

## Tests

```bash
npm test
```

Builds, runs the headless unit suites (grading, scoring, persistence, rendering of every screen), then the Playwright end-to-end tests: a teacher creates a class and sets an exam, a student joins and sits it out loud through a fake microphone, the teacher opens the report, a pasted speech gets a coached report, and an accessibility scan (axe, WCAG 2.2 AA) runs at 375 px light and 1440 px dark. The same command runs in GitHub Actions on every push.

Other useful commands:

```bash
node scripts/shots.mjs test-results/shots      # screenshots at 375 and 1440 px, light and dark (dev server must be running)
node scripts/cost-estimate.mjs                 # estimated AI cost of one oral exam from the real prompts
node scripts/cost-report.mjs 30                # measured cost from the usage table (needs Supabase keys)
node scripts/i18n-extract.mjs --check          # which interface strings still lack a Bulgarian translation
```

## Deploy

Netlify builds `main` with the settings in `netlify.toml` (nothing to configure by hand). Set the secrets under Project configuration → Environment variables; the list with explanations is in [.env.example](.env.example). The database schema is one file, [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql), to paste into the Supabase SQL editor once.

## Code layout

| Path | What it is |
|---|---|
| `rostra/src/*.js`, `*.css` | The app. Plain scripts concatenated in the order in `scripts/build.mjs` (one global scope; see NOTES.md). |
| `rostra/src/i18n.js`, `i18n-bg.js` | Translation layer and the Bulgarian dictionary (keys are the English strings). |
| `rostra/src/platform.js` | The browser's side of the backend: health, streamed AI calls, Supabase document store, sign-in. |
| `rostra/src/speech.js` | Microphone capture, transcription, on-device delivery measurement. |
| `rostra/src/auth.js`, `teacher.js` | Sign-in, account and privacy pages; classes, assignments, results. |
| `netlify/functions/*.mjs` | The API: `ai`, `transcribe`, `account`, `health`. `netlify/lib/` holds the shared pieces and the mock answers. |
| `supabase/migrations/` | Database schema with Row Level Security. |
| `scripts/` | Build, dev server, mock Supabase, screenshots, cost tools. |
| `tests/unit/`, `tests/e2e/` | Node test harness for the headless suites in `rostra/tests/`; Playwright flows. |

## Design

The look is called the Stoa: a colonnade at dusk, with the three appeals as three lights falling between the columns, each as bright as your score. Modern English carries the interface; ancient Greek sits quietly beside it. The art direction is in [rostra/tests/BRIEF.md](rostra/tests/BRIEF.md); two typefaces, self-hosted, with a Cyrillic companion for Bulgarian.
