# Notes for whoever works on Rostra next

One entry per lesson. Newest at the bottom. Read this before changing anything.

- **The live site returns 401.** Netlify "site protection" (password or team login) is on for `luxury-toffee-412afa.netlify.app`. Nobody outside the team can open it. Turn it off in Netlify under Site configuration → Access & security before showing a school.
- **`src/*.js` share one global scope.** Files are concatenated in the order in `scripts/build.mjs`. A top-level `const` in `data.js` is visible everywhere. Top-level code may only use names from earlier files; component bodies may use anything. Prefix new globals (`Viva*`, `Gym*`, `Platform*`, `t*`) to avoid collisions.
- **Never load anything from a third-party host at runtime.** Fonts and React are copied from `node_modules` into `dist/` by the build. Loading from Google or a CDN sends every student's IP address abroad, which German courts have already fined (LG München 2022).
- **Netlify Functions stop at 60 seconds, streaming or not.** Keep every Claude call short enough to finish in 50 s: ask for compact JSON, use `effort: 'low'` or `'medium'`, and never chain two calls in one function.
- **The Anthropic key only ever lives in Netlify environment variables.** The browser talks to `/api/ai` with the user's Supabase session token. If you see `sk-ant` anywhere in `src/`, it is a bug.
- **Everything must run with no keys.** `MOCK_AI=1` (or simply no `ANTHROPIC_API_KEY`) makes `/api/ai` answer with realistic fixed JSON. The tests depend on this. If you add a new prompt, add a mock answer for it in `netlify/lib/mock.mjs`.
- **Do not add emotion words to prompts or UI.** The EU AI Act bans inferring emotions in schools. "Pace 142 words per minute" is fine; "you sounded nervous" is not. That is why confidence, expressiveness and the video presence read were removed.
- **The research notes in `.research/` were gathered from inside a sandbox with limited network.** Items marked `[S]` or UNVERIFIED were not read from the primary source. Check them before quoting prices or legal text to a school.
