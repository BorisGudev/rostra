# Skills in this repo

All skills live in `.claude/skills/`. Claude Code picks them up automatically when you open this repo. Type `/<name>` to use one.
None of them change the app itself.

## Planning and thinking (Matt Pocock)

- **ask-matt** – not sure which skill to use? Ask this one and it points you to the right one.
- **grill-me** – asks you tough questions until your plan is clear.
- **grilling** – same idea: stress-tests a plan or idea with hard questions.
- **grill-with-docs** – tough questions, and writes down the decisions as it goes.
- **wait-what** – "that didn't make sense": makes Claude explain its last message again, more simply.
- **to-questionnaire** – turns an open question into a questionnaire for someone else to fill in.
- **teach** – teaches you a new skill or idea, step by step.
- **research** – looks up a question in trusted sources and saves the answer as a note.
- **wayfinder** – plans a very big job as a map of smaller decisions.
- **chief-of-staff** – runs a long job by handing parts to helper agents.

## Building and fixing code (Matt Pocock)

- **to-spec** – turns the chat into a written plan (spec).
- **to-tickets** – breaks a plan into small to-do tickets.
- **implement** – builds something from a plan or tickets.
- **implement-spec** – builds what `/to-spec` and `/to-tickets` wrote.
- **prototype** – makes a quick throwaway version to try an idea.
- **tdd** – builds features "test first", so you know they work.
- **diagnosing-bugs** – a careful step-by-step way to find hard bugs.
- **code-review** – checks recent changes for mistakes and style problems.
- **domain-modeling** – agrees on the words and ideas the project uses (a glossary).
- **codebase-design** – helps design clean, simple building blocks in the code.
- **improve-codebase-architecture** – scans the code and suggests structure improvements.
- **pr** – writes the description for a pull request.
- **git-guardrails-claude-code** – blocks risky git commands (like force-push) before they run.
- **setup-matt-pocock-skills** – one-time setup so the skills above know where tickets and docs go.

## Hand-offs and wrap-ups (Matt Pocock)

- **handoff** – sums up the chat into a note another agent can continue from.
- **claude-handoff** – hands the chat to a fresh background agent that keeps going.
- **retro** – looks back at a work session: what went well, what to improve.
- **wizard** – makes a step-by-step script for things only a human can do (logins, dashboards).
- **writing-for-agents** – how to write good instructions for AI agents (skills, CLAUDE.md).

## Design: avoid the "AI look"

- **impeccable** – design, critique, audit and polish a UI so it looks hand-made (pbakaus/impeccable).
- **design-taste-frontend** – a strong design "taste" guide plus a big kit of ready visual assets (Leonxlnx/taste-skill).
- **anti-slop-design** – spots and removes generic "AI-made" design patterns (Ferousco-dev/anti-slop-design).
- **design-mobile-apps** – designs phone screens with the paid Sleek service. Needs a `SLEEK_API_KEY`; not set up yet.

## Animation and polish (Emil Kowalski)

- **emil-design-eng** – Emil Kowalski's rules for small details that make UI feel great.
- **animate** – builds one animation the right way, from scratch.
- **choreograph** – times several things that move together.
- **improve-animations** – reviews all animations and lists what to fix first.
- **review-animations** – checks animation code against a high quality bar.
- **find-animation-opportunities** – finds places that should animate (and ones that shouldn't).
- **remove-animations** – removes animations that just get in the way.
- **animation-performance** – keeps animations smooth and not laggy.
- **animation-vocabulary** – gives the right name for a motion effect you describe.
- **apple-design** – Apple-style smooth, physical motion for the web.
- **mobile-native** – small fixes so the web app feels like a real phone app.
- **break-ui** – tries to break a screen with extreme data (very long names, empty fields).
- **pick-ui-library** – picks the best ready-made library for a UI job.
- **ask-sonner** – guide to Sonner, a library for pop-up notifications.
- **animate-expo** – animations for React Native / Expo apps (not used by Rostra today).
- **write-swift** – writing Swift for iOS apps (not used by Rostra today).

## Not installed here (needs a manual step)

- **ux-skill** (Laith0003/ux-skill, AI-slop checker) – it is a full Claude Code plugin, not a single skill.
  To add it, run these two commands inside Claude Code:
  `/plugin marketplace add Laith0003/ux-skill` then `/plugin install ux@ux-skill`.
