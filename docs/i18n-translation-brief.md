# Bulgarian translation brief

You translate interface strings of Rostra, an AI speaking coach used in Bulgarian private schools by students aged
14–19 and their teachers. The tone is warm, direct, plain, second person. Buttons say what happens.

## Rules
- Input: a JSON array of English keys. Output: a JSON object `{ "English key": "Български превод", ... }` with EVERY
  key present, in the same order, written to the file you are told. Valid JSON, UTF-8, no comments, no trailing commas.
- Placeholders `{0}`, `{1}`… are values filled in at runtime (numbers, names, titles). Keep them, reorder them if Bulgarian
  word order needs it, never translate or drop them. A key that is only a placeholder or punctuation stays as it is.
- Keep Greek words (ἦθος, λόγος…), product names (Rostra, Claude, Supabase, Netlify, Deepgram), code-like tokens (XP, wpm,
  Ctrl, Enter, MP3…), and anything in Latin that is a term of art the app shows in Latin (e.g. "Bricolage").
- Address the user with the polite plural "вие" in lower case (modern UI style), consistently. Imperatives for buttons:
  "Запазете", "Изпратете". Short labels stay short.
- Typography: use the same special characters as the key: ’ for apostrophes where Bulgarian needs none just drop it,
  keep · and … and — as they are. Keep trailing punctuation.
- Numbers and plural: Bulgarian has different plural forms; where a key contains `{0}` followed by a noun, choose the
  form that reads best for "several" ("{0} въпроса", "{0} думи"), since the app shows the count.
- Do not translate keys that look like identifiers, CSS, icon names, Greek-only text, or empty strings: copy them unchanged.

## Glossary (use these everywhere)
- ethos / pathos / logos → етос / патос / логос (lower case, the three "appeals" → трите похвата; "appeal" → похват)
- oral exam → устен изпит; the exam room → изпитната зала; examiner → изпитващ; the panel → комисията
- follow-up (question) → допълнителен въпрос; probe → уточняващ въпрос; challenge → оспорване; extension → разширяване
- speech → реч; speech feedback → обратна връзка за реч; transcript → транскрипт (of speech) / препис; recording → запис
- coach → треньорът (the coach), "Ask the coach" → "Попитайте треньора"
- Prepare (a speech) → Подготовка (на реч); Analyze → Анализ; Learn → Учене; Library → Библиотека; Gym → Тренировъчна зала; Progress → Напредък; Trophies → Отличия
- lesson → урок; drill → упражнение; quest (daily) → дневна задача; streak → серия (от дни); badge → значка; level → ниво; XP → XP
- grade: Distinction → Отличие; Merit → Много добър; Pass → Издържан; Not yet → Още не; Incomplete → Незавършен
- rubric: Accuracy → Точност; Depth → Дълбочина; Reasoning → Разсъждение; Communication → Комуникация
- teacher → учител; student → ученик; class → клас; class code → код на класа; assignment → задание; school → училище; invite code → код за покана; sign in → вход; sign out → изход; username → потребителско име; password → парола; account → профил (the account page → Профил)
- delivery (how it was spoken) → изпълнение; pace → темпо; pause → пауза; filler words → паразитни думи; hedges → уговорки
- fallacy → логическа грешка; rhetorical device → реторичен похват; thesis → теза; audience → публика; occasion → повод
- "Think time" → Време за мислене; "Answer" (clock) → Отговор; warm-up → загрявка; closing question → заключителен въпрос
- key points → ключови точки; model answer → примерен отговор; gaps → пропуски; flashcards → карти за преговор; retake → повторен опит

## Check
After writing the file, run `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>` to be sure
it parses, and `node -e "const a=require(process.argv[1]),b=require(process.argv[2]);console.log(a.length, Object.keys(b).length, a.filter(k=>!(k in b)).length,'missing')" <keys file> <your file>`
to be sure every key is present.
