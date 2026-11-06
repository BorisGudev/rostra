# Grading fairness audit (6 November 2026)

Each numbered finding from `rostra/tests/REVIEW.md`, Report 1, checked against the code on this branch.
"Covered by" names the headless test in `rostra/tests/viva.test.js` that guards it.

| # | Finding | Status | Where | Covered by |
|---|---|---|---|---|
| 1 | Typing was the default | Fixed in v2 | Modes are Speak (default) and Type; `vivaNewDoc` | rehearsal: modes default to speaking |
| 2 | "Say it aloud, then jot" marked unverified notes | Replaced | The answer is recorded and transcribed; the examiner marks the transcript; `vivaEvalPrompt` | spoken: measured delivery reaches the metrics, the prompt and the report |
| 3 | Live score and labelled follow-ups leaked the verdict | Fixed earlier | `VivaMeter` only in practice mode; chip hides the type; neutral reactions | rehearsal: no judging reactions |
| 4 | No "defend your own work" mode | Fixed earlier | `basis: 'work'`, defense templates and prompt block | viva: setup offline, as a retake |
| 5 | Follow-up rules let correct answers pass unchallenged | Fixed earlier | Prompt rules, `vivaPushback` decided in code, `vivaOneQuestion`, forced first follow-up in `vivaAdvance` | rehearsal: pushback is decided in code; advance queues follow-up |
| 6 | Marking prompt invited inflation | Fixed earlier | Evidence-first JSON, marks hidden from the examiner, caps in `vivaNormEval` | rehearsal: marking caps and evidence-first prompt |
| 7 | Distinction after one easy question | Fixed earlier | `Incomplete` grade under 60% answered | rehearsal: stopping early is Incomplete |
| 8 | AI could move the mark ±12 | Fixed earlier | `vivaNormReport` keeps the computed percent; only a closing correction adds up to 4 | rehearsal: warm-up and closing stay out of the marks |
| 9 | Fluent but wrong passed; difficulty ignored | Fixed earlier | Accuracy and depth caps, difficulty weights, extensions cannot lower | rehearsal: fairness caps, difficulty weights |
| 10 | Clocks unlike an exam room | Fixed earlier | Shorter think on follow-ups, clock pauses while the examiner speaks, cut and nudge lines | rehearsal: clocks are shorter on follow-ups |
| 11 | Answer box off screen | Fixed earlier | Scroll and focus on phase change in `VivaRoom` | render checks |
| 12 | Fixed plan never searched for the ceiling | Fixed earlier | `vivaAdaptPlan` with a reserve of questions | rehearsal: adaptive plan |
| 13 | Pasted material partly dropped | Fixed earlier | `vivaMaterialWindows`, `vivaExcerpt` in every prompt | rehearsal: material reaches every prompt |
| 14 | No discipline calibration | Fixed earlier | `VIVA_DISCIPLINES` | render checks |
| 15 | Report never gave an examiner's conclusion | Fixed earlier | `examiner_conclusion` in prompt and report | rehearsal: examiner conclusion |
| 16 | No follow-up drill | Fixed earlier | Why ladder format | rehearsal: Why ladder format |
| 17 | No memory between exams | Partly | Prior questions are excluded; weak concepts listed. The "build my question bank" button was not built (suggestion). | viva: offline exam is grounded |
| 18 | Retakes dropped what went wrong | Fixed earlier | `vivaRetake`, `vivaRetakeCompare` | rehearsal: retakes keep what went wrong |
| 19 | No warm-up, no closing correction | Fixed earlier | Warm-up and closing turns | rehearsal: warm-up and closing |
| 20 | Help prompt leaked | Fixed earlier | Draft passed, key points private, concept hidden | rehearsal: help prompt uses the draft |
| 21 | "How you sounded" from text | Fixed in v2 | Spoken exams measure pace, silences and fillers from the recording; the "hear yourself" card only shows for typed exams | spoken: measured delivery |
| 22 | Room could be escaped without trace | Fixed earlier | Lockdown, leave counted, paste counted, hidden time counted | viva: live exam renders in every phase |
| 23 | Rewards fired mid-exam | Fixed earlier | `FX.hold` for the room | rehearsal: XP paid once at completion |
| 24 | Offline self-marking showed answers early | Fixed earlier | Self-mark after the last follow-up; no seal for self | rehearsal: self-marked exams are practice |
| 25 | MIT claim | Fixed earlier | No "MIT" string remains in the source | grep |

New in v2, so that the spoken mode stays fair:

- The communication mark comes from the transcript's structure and is lowered by at most 12 points per answer for filler words (1.5 each) and silences over two seconds (2 each). The report says so.
- If transcription fails, the student types what they said and the examiner is told the words were typed after the fact.
- The model is told, in the system prompt of every call, never to judge mood or feelings; it only sees measured facts.
