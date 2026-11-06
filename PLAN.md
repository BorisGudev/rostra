# Rostra v2 plan

Written 6 November 2026, before building. The goal: a version of Rostra a teacher at a Bulgarian private school can use with a class next month.

## What is wrong today (verified against the code and the live site)

| Finding | Verified? | Detail |
|---|---|---|
| AI does not work on the live site | Yes | `engine.js` reaches Claude only through `window.claude.use('sample')`. On Netlify that object does not exist, so `Store.state.ai` is `'off'` and every AI feature falls back to templates and self-marking. |
| No backend | Yes | Everything lives in `localStorage` (`Persist` in `engine.js`); the "db" path also depended on `window.claude`. No accounts, no teacher view. |
| The exam cannot hear the student | Yes | Modes are "say it aloud, then jot notes", OS dictation into a textarea, or typing. No microphone code exists. |
| Grading fairness | Partly fixed already | Most REVIEW.md fixes are in the code (Incomplete grade, accuracy caps, no ±12 clamp, pushback, neutral reactions, difficulty weights). Stage 3 re-checks each finding and fixes what is still open. |
| Hard for a team | Yes | 13k lines in one global scope, React from a CDN, tests only on macOS `jsc`. |
| Privacy / EU law | Yes | Fonts from Google, scripts from cdnjs and jsdelivr. "Confidence", "expressiveness" and the video "presence" read infer inner states from voice and face, which the EU AI Act (Art. 5(1)(f)) bans in education. |
| English only | Yes | No translation layer anywhere. |
| Unclear centre | Yes | Eight equal navigation items; Home leads with the speech triangle. |
| Live site | Also | The live site answered **401** to an anonymous visit: Netlify site protection is on. Schools cannot open it until that is turned off. |

## Architecture

```
Browser (one static page, React 18 + htm, self-hosted)
   │  fetch /api/*  (Supabase session token in Authorization header)
   ▼
Netlify Functions (Node 20+, region fra, EU)
   ├─ /api/ai          Claude via @anthropic-ai/sdk, streamed (SSE), per-user limits, usage logged
   ├─ /api/transcribe  Speech-to-text (Deepgram EU by default; Whisper-compatible alternative; mock)
   ├─ /api/account     Sign-up with class/invite codes, account deletion (service role key, server only)
   └─ /api/health      Which services are configured; the client uses it to show honest states
   │
   ▼
Supabase (Postgres + Auth, EU region eu-central-1 Frankfurt)
   profiles · schools · classes · class_members · assignments · submissions · docs (jsonb) · usage
   Row Level Security: students see their own rows; teachers see their classes' students.
```

### Why these choices

- **Netlify Functions, not Supabase Edge Functions.** Functions deploy with `git push`, their secrets live in the Netlify UI Bobi already uses, and all settings fit in `netlify.toml`. Netlify's 60-second hard limit (docs, Nov 2026) is enough for one Claude call when the prompt asks for a compact answer; the server times out at 50 s and the client shows a clear message.
- **Supabase in Frankfurt.** Free tier is enough for a pilot (2 projects, 500 MB, 50k monthly users); Pro is $25/month. Postgres with Row Level Security is what makes "student data is safe" true rather than claimed. Region `eu-central-1` keeps data in the EU.
- **Keep the document model.** The old app stored JSON documents (profile, speeches, preps, vivas) in a per-user collection. The new `docs` table keeps that shape (`user_id, id, type, body jsonb`), so the 13k lines of app code keep working with a thin persistence adapter instead of a rewrite. Teachers read their students' documents through RLS.
- **No student emails.** Students join with a class code, a display name, a username and a password. Accounts are created server-side (`email_confirm: true` with a synthetic address), so no email ever goes out, Supabase's built-in SMTP limits never bite, and we collect the minimum. Teachers sign up with a real email through an invite code the school admin generates.
- **Models per task** (Anthropic prices, Oct 2026): exam planning, marking and the final report use `claude-opus-5-5` ($4 / $20 per million tokens) because grading fairness is the product; speech analysis, preparation coaching and chat use `claude-sonnet-5-5` ($2 / $10); short helpers (clarify, nudge, device lab) use `claude-haiku-5-5` ($0.10 / $0.50). All three are env-configurable. Every call's real token usage is written to the `usage` table so the cost per exam is measured, not guessed.
- **Speech-to-text.** Claude takes no audio, so transcription is separate. Default provider: Deepgram Nova-3 on its EU endpoint (`api.eu.deepgram.com`), which lists Bulgarian and costs about $0.005 per minute. A Whisper-compatible provider works by setting one env var. Without any key, the browser's own Web Speech API (Chrome, Edge, Safari) transcribes live for free, and typing stays as the last fallback. The microphone audio is also measured on the device for pace and pauses, as the Analyze page already does.
- **Mock mode.** With no keys at all, `/api/ai` returns deterministic, realistic JSON and `/api/transcribe` returns a fixed transcript, so the whole app, the tests and the deploy previews run without spending anything.
- **Code layout stays concatenated.** The existing `src/*.js` files share one global scope by design. Converting 13k lines to ES modules would be a week of risk with no visible benefit to schools. Instead: npm manages dependencies, a Node build script replaces `build.py`, tests run on Linux with `npm test`, and new code lives in clearly named new files. Modules can come later, file by file.

### Dropped or merged (and why)

- **Confidence and expressiveness scores, and the video "presence" read** are removed. They infer an inner state from voice or face, which is emotion recognition under the EU AI Act in an educational setting (banned since 2 Feb 2025). Pace, pauses, pitch range and volume range stay, shown as plain measurements.
- **"Say it aloud, then jot" and "speak into dictation"** merge into one **Speak** mode that records and transcribes. Typing stays as the fallback.
- **Direct joining of a class by id** is gone: students join only through `join_class()` with the class code, and teachers cannot add students by hand (they share the code, or make a new one). Admin accounts are no longer made by email match: the admin joins once with `ROSTRA_ADMIN_SETUP_CODE`.
- **The spoken answer is no longer sent to the examiner the moment it is transcribed.** The student sees the text first and can fix misheard words; the uncorrected version goes along, so the examiner can tell a correction from an addition.

## Build order (each stage leaves the app working and is committed)

0. Tooling: npm, Node build to `dist/`, self-hosted React/htm/fonts, Node test harness, Playwright, `netlify.toml`, GitHub Actions, this plan, `NOTES.md`.
1. Backend: functions, schema, mock mode, client adapter (`platform.js`) replacing `window.claude`.
2. Spoken exam: microphone, transcription, examiner responds to what was said, EN/BG.
3. Grading audit against REVIEW.md with unit tests.
4. Accounts, schools, classes, assignments, teacher dashboard, data deletion.
5. Redesign: exam and speech feedback at the centre, 375px, WCAG 2.2 AA, light and dark, screenshots reviewed.
6. Bulgarian: translation layer, dictionary, prompts answer in the student's language.
7. Privacy page, cost report, `.env.example`, README, final PR.

## Assumptions

- Bobi creates the Supabase project (the sandbox was not allowed to) and pastes keys into Netlify. Until then the deploy runs in mock mode and says so on screen.
- Private schools act as data controller; Rostra is the processor. The app collects from students only a display name, a username and their work.
- Age 14 is Bulgaria's age of digital consent (secondary source only; to confirm with the school's lawyer).
- Lessons and the speech library remain English-first content; the interface, exam, reports and coaching answer in Bulgarian when the student picks Bulgarian.
