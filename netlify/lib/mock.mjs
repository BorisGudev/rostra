/* Mock answers for every prompt the app sends, so the whole product runs and tests pass with no API key.
   The prompt is recognised by phrases the prompt builders in rostra/src use. Answers are deterministic and
   realistic in shape; the app's normalizers validate every field, so a mock that drifts shows up in tests.
   If you add a prompt to the app, add a case here (NOTES.md). */

function quote(prompt, label) {
  const m = prompt.match(new RegExp(label + '\\s*"""\\s*([\\s\\S]*?)"""'));
  return m ? m[1].trim() : '';
}
const words = (s) => String(s || '').match(/[A-Za-zÀ-ɏЀ-ӿ0-9'’-]+/g) || [];
const firstWords = (s, n) => words(s).slice(0, n).join(' ');
const bg = (prompt) => /Bulgarian|български|Reply in Bulgarian|Answer in Bulgarian/i.test(prompt);

export function mockJson(prompt) {
  const p = String(prompt);
  const isBg = bg(p);

  /* ---- Oral exam ---- */
  if (/preparing a live oral examination/i.test(p)) {
    const subject = (p.match(/Subject:\s*([^\n.]+)/i) || [])[1] || 'the subject';
    const ids = (p.match(/asked by (\w+)|examiner whose role fits it: ([\w, ]+)/) || []);
    const ex = ids[1] || (ids[2] ? ids[2].split(',')[0].trim() : 'elenchos');
    const n = Number((p.match(/Write exactly (\d+) questions/) || [])[1]) || 1;
    const bank = isBg ? [
      ['Какво е фотосинтеза и защо е важна за живота на Земята?', 'Основна идея', 1, ['Превръщане на светлинна енергия в химична', 'Произвежда кислород и глюкоза', 'Основа на хранителните вериги']],
      ['Обяснете ролята на хлорофила в светлинната фаза.', 'Светлинна фаза', 1, ['Поглъща светлина', 'Възбудени електрони', 'Синтез на АТФ и НАДФН']],
      ['Какво се случва в цикъла на Калвин?', 'Тъмнинна фаза', 2, ['Фиксиране на CO2', 'Използване на АТФ и НАДФН', 'Образуване на захари']],
      ['Как температурата влияе на скоростта на фотосинтезата?', 'Фактори', 2, ['Ензимна активност', 'Оптимум и спад', 'Връзка със светлина и CO2']],
      ['Какво би се случило с растение без светлина в продължение на седмица?', 'Приложение', 2, ['Спира фотосинтезата', 'Използва резерви', 'Етиолация']],
      ['Сравнете фотосинтезата и клетъчното дишане.', 'Връзки', 3, ['Противоположни уравнения', 'Енергиен поток', 'Взаимна зависимост']],
      ['Как бихте проверили експериментално, че растението отделя кислород?', 'Експеримент', 3, ['Воден елодея опит', 'Събиране на газ', 'Контрола']],
      ['Защо C4 растенията са по-ефективни при горещини?', 'Адаптации', 3, ['Пространствено разделяне', 'Фотореспирация', 'Примери']],
      ['Какво ограничава фотосинтезата при ниска концентрация на CO2?', 'Лимитиращи фактори', 2, ['Закон на минимума', 'Рубиско', 'Графика']],
      ['Обяснете защо листата са зелени.', 'Пигменти', 1, ['Отражение на зелена светлина', 'Поглъщане на синя и червена', 'Спектър']],
    ] : [
      [`In your own words, what is ${subject} and why does it matter?`, 'Core idea', 1, ['A one-sentence definition', 'Why it matters in practice', 'A concrete example']],
      [`Explain the central mechanism behind ${subject} step by step.`, 'Mechanism', 1, ['Each step in order', 'What drives each step', 'The end result']],
      [`Give me a worked example of ${subject} with rough numbers.`, 'Worked example', 2, ['A specific case', 'Numbers with units', 'A sanity check']],
      [`What is the most common misconception about ${subject}?`, 'Misconception', 2, ['A real misconception', 'Why it is tempting', 'The correct picture']],
      [`What happens to ${subject} when the main assumption fails?`, 'Assumptions', 3, ['The assumption named', 'What breaks', 'A real situation']],
      [`How does ${subject} connect to the wider field?`, 'Connections', 2, ['A prerequisite idea', 'A dependent idea', 'Why it matters']],
      [`What is the strongest objection to the standard account of ${subject}?`, 'Objection', 3, ['A serious objection', 'Evidence for it', 'A fair response']],
      [`Predict what changes in ${subject} if one input doubles.`, 'Prediction', 3, ['Which input', 'Direction of change', 'Reasoning']],
      [`Where would you see ${subject} outside a textbook?`, 'Application', 2, ['A real setting', 'How it shows', 'Limits']],
      [`Define the key term in ${subject} precisely enough for a classmate.`, 'Definition', 1, ['Precise wording', 'Scope', 'Example']],
    ];
    const questions = bank.slice(0, Math.min(n, bank.length)).map(([q, concept, difficulty, key_points]) => ({ q, concept, difficulty, key_points, examiner: ex }));
    return { title: isBg ? `Устен изпит: ${subject}` : `Oral exam: ${subject}`, opening: isBg ? 'Добре дошли. Ще задавам прости въпроси, а после ще питам защо.' : 'Welcome. I will ask simple questions, and then I will ask why.', questions };
  }
  if (/Evaluate the latest answer/i.test(p)) {
    const ans = quote(p, '(?:Candidate’s answer[^\\n]*:)') || quote(p, 'Candidate.s answer[^"]*');
    const n = words(ans).length;
    const empty = n < 4 || /no answer given|no notes given/i.test(ans);
    const strong = n >= 60;
    const aloud = /NOTES ONLY/.test(p);
    const examiner = (p.match(/"examiner":"(\w+)"/) || [])[1] || 'elenchos';
    const follows = Number((p.match(/Follow-ups already asked on this main question: (\d+)/) || [])[1]) || 0;
    const limitReached = /The limit is reached/.test(p);
    const scores = empty ? { accuracy: 8, depth: 5, reasoning: 10, communication: 15 } : strong ? { accuracy: 82, depth: 74, reasoning: 78, communication: 80 } : { accuracy: 58, depth: 46, reasoning: 55, communication: 62 };
    if (aloud) scores.communication = null;
    const followQ = isBg ? 'Защо се получава така? Обяснете механизма с една стъпка по-дълбоко.' : 'Why does that happen? Take it one level deeper.';
    return {
      evidence: empty ? [] : [firstWords(ans, 8)],
      covered: empty ? [] : strong ? ['A one-sentence definition', 'Why it matters in practice'] : ['A one-sentence definition'],
      missing: empty ? ['A one-sentence definition', 'Why it matters in practice', 'A concrete example'] : strong ? ['A concrete example'] : ['Why it matters in practice', 'A concrete example'],
      misconception: '',
      notes: empty ? 'No substantive answer was given.' : strong ? 'Clear definition and a reason; the example was thin.' : 'The outline was right but the reasoning stopped at what, not why.',
      scores, answer_first: !empty,
      reaction: isBg ? 'Разбирам.' : 'Noted.',
      next: limitReached || follows >= 1 ? { action: 'move_on', type: 'probe', question: '', examiner } : { action: 'followup', type: strong ? 'extend' : 'probe', question: followQ, examiner },
    };
  }
  if (/asks for clarification/i.test(p)) return { reply: isBg ? 'Питам за основната идея: отговорете с едно изречение, после обяснете защо.' : 'I am asking for the core idea: answer in one sentence, then tell me why.' };
  if (/help me reason through it/i.test(p)) return { reply: isBg ? 'Нормално е още да не знаете. Какъв вид нещо е това: величина, процес или правило?' : 'Not knowing yet is fine. What kind of thing is this: a quantity, a process or a rule?' };
  if (/chaired a live oral examination/i.test(p)) {
    const pct = Number((p.match(/computed from the per-answer scores: (\d+)%/) || [])[1]) || 60;
    const strong = pct >= 70;
    return {
      summary: isBg ? `Отговорихте на въпросите с ${strong ? 'ясна' : 'частична'} увереност. Най-силни бяхте в определенията; при последващите въпроси обяснението спираше на „какво“, без „защо“.` : `You answered with ${strong ? 'clear' : 'partial'} command of the material. Definitions were your strength; under follow-up the explanation stopped at what and rarely reached why.`,
      examiner_conclusion: { outcome: pct >= 70 ? 'would pass comfortably' : pct >= 55 ? 'would pass' : pct >= 45 ? 'borderline' : 'would fail', why: isBg ? 'Под натиск отговорът „защо се получава така“ остана без механизъм.' : 'Under pressure the answer to "why does that happen" never named a mechanism.', first_doubt: isBg ? 'Механизмът зад основната идея.' : 'The mechanism behind the core idea.', ceiling: isBg ? 'Определението и един пример; спряхте при предсказването.' : 'The definition and one example; you stopped at prediction.' },
      strengths: isBg ? ['Започвахте с отговора в първото изречение.', 'Използвахте точни термини.'] : ['You led with the answer in your first sentence.', 'You used precise terms throughout.'],
      gaps: [{ concept: isBg ? 'Механизъм' : 'Mechanism', what_was_missing: isBg ? 'Стъпките, които свързват причината с резултата.' : 'The steps that connect cause to result.', model_answer_outline: isBg ? ['Назовете входа', 'Опишете всяка стъпка', 'Кажете какво се получава', 'Дайте пример'] : ['Name the input', 'Describe each step in order', 'State the result', 'Give one example'] }],
      communication: isBg ? ['Отговор първо, после причина: добре.', 'Малко свързващи думи като „защото“ и „например“.'] : ['Answer first, then reason: good.', 'Few signposts such as "because" and "for example".'],
      panel: ['elenchos', 'akribeia', 'eunoia', 'theoria', 'praxis', 'skepsis'].map((id) => ({ examiner: id, comment: isBg ? 'Отговорите ви показаха какво знаете; следващия път кажете и защо.' : 'Your answers showed what you know; next time say why as well.' })),
      next_steps: isBg ? ['Обяснете механизма на глас за една минута.', 'Запишете едно изречение с „защото“ за всяко понятие.', 'Повторете изпита след два дни.'] : ['Explain the mechanism aloud in one minute.', 'Write one "because" sentence for every concept.', 'Retake this exam in two days.'],
      flashcards: Array.from({ length: 6 }, (_, i) => ({ q: isBg ? `Карта ${i + 1}: назовете стъпка ${i + 1} от механизма.` : `Card ${i + 1}: name step ${i + 1} of the mechanism.`, a: isBg ? `Стъпка ${i + 1} с причината зад нея.` : `Step ${i + 1}, with the reason behind it.` })),
      correction_credit: 0,
    };
  }

  /* ---- Speech analysis ---- */
  if (/Analyze the speech transcript below/i.test(p)) {
    const transcript = quote(p, 'TRANSCRIPT');
    const w = words(transcript);
    const q = (i, n) => w.slice(i, i + n).join(' ');
    const pick = (i, n) => (transcript.includes(q(i, n)) ? q(i, n) : '');
    const highlights = [
      { quote: pick(0, 6), kind: 'strength', label: isBg ? 'Силно начало' : 'Strong opening', pole: 'pathos', note: isBg ? 'Конкретна сцена, която слушателят вижда.' : 'A concrete scene the listener can see.', fix: '' },
      { quote: pick(Math.floor(w.length / 3), 7), kind: 'vague', label: isBg ? 'Общо твърдение' : 'Sweeping claim', pole: 'logos', note: isBg ? 'Няма число или източник зад твърдението.' : 'No number or source stands behind the claim.', fix: isBg ? 'Добавете една конкретна цифра.' : 'Add one specific figure.' },
      { quote: pick(Math.floor(w.length / 2), 8), kind: 'device', label: isBg ? 'Анафора' : 'Anaphora', pole: 'pathos', note: isBg ? 'Повторението придава ритъм.' : 'The repetition gives the line a beat.', fix: '' },
      { quote: pick(Math.max(0, w.length - 12), 6), kind: 'weak', label: isBg ? 'Слаб завършек' : 'Soft ending', pole: 'ethos', note: isBg ? 'Последното изречение не казва какво да направят.' : 'The last sentence does not say what to do.', fix: isBg ? 'Завършете с едно ясно действие.' : 'End with one clear action.' },
    ].filter((h) => h.quote);
    return {
      title: isBg ? 'Реч: ' + firstWords(transcript, 3) : firstWords(transcript, 4) || 'Untitled speech',
      summary: isBg ? 'Речта има ясна история и слаба доказателствена част. Публиката разбира целта, но не чува защо да повярва.' : 'The speech has a clear story and a thin evidence section. The audience understands the goal but does not hear why to believe it.',
      scores: { ethos: 62, pathos: 71, logos: 54 },
      subscores: { ethos: { credibility: 60, goodwill: 68, composure: 58 }, pathos: { story: 76, imagery: 70, connection: 67 }, logos: { structure: 60, evidence: 44, reasoning: 58 } },
      structure: [
        { part: isBg ? 'Начало' : 'Opening', verdict: 'strong', quote: pick(0, 5), note: isBg ? 'Сцена вместо тема.' : 'A scene instead of a topic.' },
        { part: isBg ? 'Теза' : 'Thesis', verdict: 'solid', quote: pick(Math.floor(w.length / 4), 5), note: isBg ? 'Ясна, но късна.' : 'Clear, but late.' },
        { part: isBg ? 'Доказателства' : 'Evidence', verdict: 'weak', quote: pick(Math.floor(w.length / 2), 5), note: isBg ? 'Едно число би помогнало.' : 'One number would help.' },
        { part: isBg ? 'Призив' : 'Call to action', verdict: 'missing', quote: '', note: isBg ? 'Липсва ясно действие.' : 'No clear action is asked for.' },
      ],
      highlights,
      strengths: isBg ? ['Започвате с конкретна сцена.', 'Говорите на публиката като на „вие“.', 'Ритъмът на изреченията е естествен.'] : ['You open with a concrete scene.', 'You address the audience directly as "you".', 'Your sentence rhythm sounds natural.'],
      growth: isBg ? ['Добавете едно число към основното твърдение.', 'Кажете призива в последното изречение.', 'Съкратете средната част с една трета.'] : ['Add one number to your central claim.', 'Put the call to action in the last sentence.', 'Cut the middle third by a third.'],
      lessons: [
        { title: isBg ? 'Едно число убеждава' : 'One number persuades', pole: 'logos', why: isBg ? 'Основното твърдение няма доказателство.' : 'Your central claim carries no evidence.', concept: isBg ? 'Конкретна цифра прави твърдението проверимо. Изберете една, която публиката може да си представи.' : 'A specific figure makes a claim checkable. Pick one the audience can picture.', example: isBg ? '„Всеки месец изхвърляме 40 килограма зеленчуци.“' : '"Every month we throw away forty kilos of vegetables."', drill: isBg ? 'Напишете три версии на тезата си, всяка с различно число.' : 'Write three versions of your thesis, each with a different number.' },
        { title: isBg ? 'Призивът в края' : 'The ask at the end', pole: 'ethos', why: isBg ? 'Речта спира без действие.' : 'The speech stops without an action.', concept: isBg ? 'Последното изречение казва какво да направи публиката утре.' : 'The last sentence says what the audience should do tomorrow.', example: isBg ? '„Утре попитайте готвача си какво изхвърля.“' : '"Tomorrow, ask your chef what gets thrown away."', drill: isBg ? 'Напишете пет възможни последни изречения.' : 'Write five possible last sentences.' },
        { title: isBg ? 'Режете средата' : 'Cut the middle', pole: 'pathos', why: isBg ? 'Средната част повтаря началото.' : 'The middle repeats the opening.', concept: isBg ? 'Всеки абзац трябва да носи нова картина или нов факт.' : 'Every paragraph must carry a new image or a new fact.', example: isBg ? 'Задраскайте всяко изречение, което казва нещо вече казано.' : 'Strike every sentence that says something already said.', drill: isBg ? 'Съкратете речта с 20% без да губите нито една идея.' : 'Cut the speech by 20% without losing a single idea.' },
      ],
      coach_note: isBg ? 'Имате история, която хората ще запомнят. Сега ѝ дайте едно число и едно действие, и тя ще ги раздвижи.' : 'You have a story people will remember. Now give it one number and one action, and it will move them.',
    };
  }

  /* ---- Lessons and gym ---- */
  if (/grading a short practice exercise/i.test(p)) {
    const ans = quote(p, 'The speaker wrote:');
    return { score: words(ans).length < 5 ? 25 : 72, verdict: isBg ? 'Солиден опит.' : 'A solid attempt.', worked: isBg ? `Фразата „${firstWords(ans, 5)}“ е конкретна.` : `"${firstWords(ans, 5)}" is concrete.`, next: isBg ? 'Добавете една картина, която публиката вижда.' : 'Add one image the audience can see.', example: isBg ? 'Представете си кухнята в единайсет вечерта.' : 'Picture the kitchen at eleven at night.' };
  }
  if (/impromptu talk out loud/i.test(p)) return { verdict: isBg ? 'Ясна структура.' : 'A clear structure.', structure: isBg ? 'Бележките следват началото и средата; завършекът липсва.' : 'Your notes follow the opening and middle; the close is missing.', worked: isBg ? 'Започнахте с твърдение.' : 'You opened with a claim.', next: isBg ? 'Завършете с едно изречение, което повтаря тезата.' : 'End with one sentence that restates the thesis.', opener: isBg ? 'Ето една истина, която рядко казваме на глас.' : 'Here is a truth we rarely say out loud.' };
  if (/judging one short practice line/i.test(p)) {
    const line = quote(p, 'The speaker’s rewrite:') || quote(p, "The speaker's rewrite:");
    return { uses: words(line).length > 3, score: words(line).length > 3 ? 74 : 30, verdict: isBg ? 'Похватът се чува.' : 'The device comes through.', worked: isBg ? `„${firstWords(line, 4)}“ носи ритъм.` : `"${firstWords(line, 4)}" carries the beat.`, next: isBg ? 'Съкратете втората половина.' : 'Shorten the second half.', example: isBg ? 'Не питайте какво ще загубим; питайте какво вече губим.' : 'Do not ask what we might lose; ask what we are already losing.' };
  }

  /* ---- Prepare ---- */
  if (/Propose three genuinely different approaches/i.test(p)) {
    const n = (name, approach, thesis, mix, beats) => ({ name, approach, thesis, beats, mix, fits: isBg ? 'Използва силата ви в разказването.' : 'Leans on your strength in storytelling.', risk: isBg ? 'Може да стане дълго.' : 'It can run long.' });
    return { angles: [
      n(isBg ? 'Една кухня' : 'One kitchen', 'story-led', isBg ? 'Една нощ зад ресторанта показва целия проблем.' : 'One night behind a restaurant shows the whole problem.', { ethos: 25, pathos: 55, logos: 20 }, isBg ? ['Сцена', 'Проблем', 'Решение', 'Призив'] : ['Scene', 'Problem', 'Solution', 'Ask']),
      n(isBg ? 'Числата говорят' : 'The numbers talk', 'problem-solution', isBg ? 'Четиридесет килограма на нощ е бизнес, не отпадък.' : 'Forty kilos a night is a business, not waste.', { ethos: 30, pathos: 20, logos: 50 }, isBg ? ['Факт', 'Цена', 'План', 'Доказателство', 'Призив'] : ['Fact', 'Cost', 'Plan', 'Proof', 'Ask']),
      n(isBg ? 'Обратното' : 'The contrarian', 'contrarian', isBg ? 'Компостът не е благотворителност, а печалба.' : 'Compost is not charity; it is profit.', { ethos: 45, pathos: 25, logos: 30 }, isBg ? ['Мит', 'Обрат', 'Пример', 'Призив'] : ['Myth', 'Turn', 'Example', 'Ask']),
    ], questions: isBg ? ['Кой момент ви накара да се заемете с това?', 'В какво вярва публиката сега?', 'Кое изречение трябва да запомнят?'] : ['What moment made you care?', 'What does your audience believe right now?', 'Which sentence should they remember?'] };
  }
  if (/Build a speaking outline/i.test(p)) return { core: isBg ? 'Изхвърлената храна е печалба, която още не сме прибрали.' : 'Wasted food is profit we have not collected yet.', sections: [
    { name: isBg ? 'Кука' : 'Hook', pole: 'pathos', seconds: 30, purpose: isBg ? 'Покажете сцената.' : 'Show the scene.', technique: isBg ? 'Конкретна картина: място, час, число.' : 'Concrete image: place, time, number.', frame: isBg ? 'В [час] на [място] видях [нещо].' : 'At [time] in [place] I saw [thing].', prompts: isBg ? ['Къде бяхте?', 'Какво видяхте?'] : ['Where were you?', 'What did you see?'] },
    { name: isBg ? 'Проблем' : 'Problem', pole: 'logos', seconds: 60, purpose: isBg ? 'Дайте мащаба с число.' : 'Give the scale with a number.', technique: isBg ? 'Едно число, един източник.' : 'One number, one source.', frame: isBg ? '[Число] [единица] всяка [период].' : '[Number] [unit] every [period].', prompts: isBg ? ['Кое число знаете със сигурност?'] : ['Which number do you know for sure?'] },
    { name: isBg ? 'Решение' : 'Solution', pole: 'ethos', seconds: 90, purpose: isBg ? 'Покажете, че сте го правили.' : 'Show you have done it.', technique: isBg ? 'Доказателство от опит.' : 'Proof from experience.', frame: isBg ? 'Ние вече [направихме], и [резултат].' : 'We already [did], and [result].', prompts: isBg ? ['Какво сте опитали?'] : ['What have you tried?'] },
    { name: isBg ? 'Призив' : 'Close', pole: 'pathos', seconds: 30, purpose: isBg ? 'Кажете едно действие.' : 'Ask for one action.', technique: isBg ? 'Императив в последното изречение.' : 'An imperative in the last sentence.', frame: isBg ? 'Утре [направете това].' : 'Tomorrow, [do this].', prompts: isBg ? ['Какво да направят утре?'] : ['What should they do tomorrow?'] },
  ], pitfalls: isBg ? ['Прекалено много числа наведнъж.', 'Призив без конкретика.'] : ['Too many numbers at once.', 'An ask with no specific action.'] };
  if (/reviewing ONE section of a speech/i.test(p)) {
    const draft = quote(p, 'Their draft:');
    return { scores: { ethos: 58, pathos: 64, logos: 52 }, verdict: isBg ? 'Добро начало, липсва число.' : 'A good start; a number is missing.', keep: isBg ? `„${firstWords(draft, 5)}“: конкретно и ясно.` : `"${firstWords(draft, 5)}": concrete and clear.`, improve: isBg ? 'Добавете една цифра към основното твърдение.' : 'Add one figure to the main claim.', flags: [], question: isBg ? 'Какво точно ще загуби публиката, ако не действа?' : 'What exactly does the audience lose by not acting?' };
  }
  if (/stuck writing one section/i.test(p)) return { questions: isBg ? ['Кое е най-изненадващото, което знаете по темата?', 'Какво би казал скептик?'] : ['What is the most surprising thing you know about this?', 'What would a skeptic say?'], starters: isBg ? ['Миналата седмица видях…', 'Повечето хора мислят, че…', 'Числото, което не ми дава мира, е…'] : ['Last week I saw…', 'Most people think that…', 'The number I cannot shake is…'] };
  if (/lean slide outline/i.test(p)) return { slides: [
    { title: isBg ? 'Една нощ, една кухня' : 'One night, one kitchen', visual: isBg ? 'Снимка на задния вход на ресторант' : 'Photo of a restaurant back door', text: '', notes: isBg ? 'Разкажете сцената.' : 'Tell the scene.', pole: 'pathos' },
    { title: isBg ? '40 кг на нощ' : '40 kg a night', visual: isBg ? 'Голямо число на тъмен фон' : 'A big number on a dark slide', text: '40 kg', notes: isBg ? 'Числото.' : 'The number.', pole: 'logos' },
    { title: isBg ? 'Какво направихме' : 'What we did', visual: isBg ? 'Три икони' : 'Three icons', text: '', notes: isBg ? 'Доказателство от опит.' : 'Proof from experience.', pole: 'ethos' },
    { title: isBg ? 'Утре' : 'Tomorrow', visual: isBg ? 'Едно изречение' : 'One sentence', text: isBg ? 'Попитайте готвача си.' : 'Ask your chef.', notes: isBg ? 'Призивът.' : 'The ask.', pole: 'pathos' },
  ] };

  /* ---- Unknown prompt: say so loudly, so a missing mock shows up in tests ---- */
  return { mock: true, note: 'No mock answer matches this prompt. Add one in netlify/lib/mock.mjs.', prompt_head: p.slice(0, 120) };
}

export function mockText(turns) {
  const last = [...turns].reverse().find((t) => t.role === 'user');
  const text = typeof last?.content === 'string' ? last.content : '';
  const isBg = /[А-Яа-я]/.test(text) || /Bulgarian/i.test(turns.map((t) => (typeof t.content === 'string' ? t.content : '')).join(' '));
  return isBg
    ? `Добър въпрос. Започнете с **една конкретна картина**, после кажете защо има значение. Опитайте: „В единайсет вечерта, зад ресторанта…“. Коя е сцената, която само вие сте виждали?`
    : `Good question. Start with **one concrete picture**, then say why it matters. Try: "At eleven at night, behind the restaurant…". What is the scene only you have seen?`;
}

/* Fixed transcripts for the transcription endpoint in mock mode. */
export function mockTranscript(lang = 'en', seconds = 20) {
  const bgText = 'Фотосинтезата е процес, при който растенията превръщат светлинната енергия в химична. Това е важно, защото произвежда кислород и глюкоза, които са основата на хранителните вериги. Например, едно дърво за един ден може да произведе кислород за няколко души.';
  const enText = 'Photosynthesis is the process by which plants turn light energy into chemical energy. It matters because it produces the oxygen we breathe and the sugars at the base of every food chain. For example, a single tree can make enough oxygen in a day for several people, because the chloroplasts in its leaves capture light and split water.';
  const text = lang.startsWith('bg') ? bgText : enText;
  const ws = text.split(' ');
  const step = seconds / ws.length;
  return { text, language: lang.startsWith('bg') ? 'bg' : 'en', duration: seconds, words: ws.map((w, i) => ({ word: w, start: +(i * step).toFixed(2), end: +((i + 1) * step).toFixed(2) })), provider: 'mock' };
}
