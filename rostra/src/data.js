/* ================================================================
   Static content: poles, levels, quests, badges, lessons, games,
   the library of annotated speeches, and the sample report.
   ================================================================ */

const POLE_KEYS = ['ethos', 'pathos', 'logos'];
const POLES = {
  ethos: {
    key: 'ethos', name: t('Ethos'), greek: 'ἦθος', short: t('Character'), icon: 'shield',
    color: 'var(--ethos)', soft: 'var(--ethos-soft)',
    ask: t('Why should they trust you?'),
    desc: t('Credibility and character. The audience believes the speaker before they believe the speech.'),
    subs: { credibility: t('Credibility'), goodwill: t('Goodwill'), composure: t('Composure') },
    subsGreek: { credibility: 'ἀξιοπιστία', goodwill: 'εὔνοια', composure: 'πραότης' },
  },
  pathos: {
    key: 'pathos', name: t('Pathos'), greek: 'πάθος', short: t('Emotion'), icon: 'heart',
    color: 'var(--pathos)', soft: 'var(--pathos-soft)',
    ask: t('Why should they care?'),
    desc: t('Emotion and imagination. Stories, images and a voice that moves people from agreeing to acting.'),
    subs: { story: t('Storytelling'), imagery: t('Vivid language'), connection: t('Connection') },
    subsGreek: { story: 'διήγησις', imagery: 'ἐνάργεια', connection: 'συμπάθεια' },
  },
  logos: {
    key: 'logos', name: t('Logos'), greek: 'λόγος', short: t('Logic'), icon: 'scale',
    color: 'var(--logos)', soft: 'var(--logos-soft)',
    ask: t('Why should they believe it?'),
    desc: t('Reason and evidence. A clear structure, real proof, and arguments that survive a skeptic.'),
    subs: { structure: t('Structure'), evidence: t('Evidence'), reasoning: t('Reasoning') },
    subsGreek: { structure: 'τάξις', evidence: 'τεκμήριον', reasoning: 'λογισμός' },
  },
};

const OCCASIONS = [
  { id: 'pitch', label: t('Pitch'), pace: [140, 170], hint: t('Investors, clients, demo day') },
  { id: 'presentation', label: t('Presentation'), pace: [130, 160], hint: t('Work, school, conference') },
  { id: 'public', label: t('Public speech'), pace: [120, 155], hint: t('Keynote, ceremony, rally') },
  { id: 'toast', label: t('Toast'), pace: [120, 150], hint: t('Wedding, birthday, farewell') },
  { id: 'tribute', label: t('Eulogy or tribute'), pace: [100, 135], hint: t('Honoring someone') },
  { id: 'debate', label: t('Debate'), pace: [140, 175], hint: t('Persuasive, competitive') },
  { id: 'meeting', label: t('Team update'), pace: [130, 165], hint: t('Stand-up, all-hands') },
  { id: 'exam', label: t('Oral exam'), pace: [110, 150], hint: t('Course orals, thesis defense, qualifying exams') },
];
const occasionOf = (id) => OCCASIONS.find((o) => o.id === id) || OCCASIONS[1];
const FOCUS_OPTIONS = [t('Persuasion'), t('Clarity'), t('Confidence'), t('Storytelling'), t('Structure'), t('Opening & close'), t('Handling objections')];

const LEVEL_TITLES = [t('Listener'), t('Speaker'), t('Rhetor'), t('Pleader'), t('Declaimer'), t('Tribune'), t('Consul'), t('Laureate'), t('Demosthenes'), t('Cicero'), t('Aristotle')];
const LEVEL_GREEK = ['ἀκροατής', 'ἀγορητής', 'ῥήτωρ', 'δικολόγος', 'μελετητής', 'δήμαρχος', 'ὕπατος', 'δαφνηφόρος', 'Δημοσθένης', 'Κικέρων', 'Ἀριστοτέλης'];
const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

const QUESTS = {
  analyze: { label: t('Analyze a speech'), target: 1, xp: 60, go: ['analyze'], icon: 'mic' },
  forge: { label: t('Write a section in Prepare'), target: 1, xp: 40, go: ['prepare'], icon: 'pen' },
  lesson: { label: t('Finish a lesson'), target: 1, xp: 40, go: ['learn'], icon: 'book' },
  drill: { label: t('Complete a drill'), target: 1, xp: 40, go: ['learn'], icon: 'bolt' },
  hunt: { label: t('Spot 5 fallacies in Fallacy Hunt'), target: 5, xp: 40, go: ['game', 'fallacy'], icon: 'target' },
  device: { label: t('Name 5 devices in Device Spotter'), target: 5, xp: 40, go: ['game', 'device'], icon: 'sparkles' },
  read: { label: t('Study a great speech'), target: 1, xp: 30, go: ['library'], icon: 'columns' },
  viva: { label: t('Answer 3 questions in an oral exam'), target: 3, xp: 50, go: ['viva'], icon: 'scroll' },
  warmup: { label: t('Do a warm-up in the Gym'), target: 1, xp: 30, go: ['gym', 'warmup'], icon: 'wind' },
  impromptu: { label: t('Spin and speak an impromptu topic'), target: 1, xp: 40, go: ['gym', 'impromptu'], icon: 'target' },
  revise: { label: t('Revise your exam flashcards'), target: 1, xp: 30, go: ['viva'], icon: 'repeat' },
};
const QUEST_POOLS = [['analyze', 'forge', 'drill', 'viva'], ['hunt', 'device', 'impromptu'], ['read', 'lesson', 'warmup', 'revise']];
const CHEST_XP = 60; // the lowest roll; see chestRoll in engine.js

const BADGES = [
  { id: 'first_words', name: t('First Words'), desc: t('Analyze your first speech'), icon: 'mic', tier: 'bronze' },
  { id: 'kindling', name: t('Kindling'), desc: t('Keep a 3-day streak'), icon: 'flame', tier: 'bronze' },
  { id: 'scholar', name: t('Scholar'), desc: t('Complete 5 lessons'), icon: 'book', tier: 'bronze' },
  { id: 'historian', name: t('Historian'), desc: t('Study 5 great speeches'), icon: 'columns', tier: 'bronze' },
  { id: 'clean_air', name: t('Clean Air'), desc: t('Speak a minute or more with under one filler word per minute'), icon: 'wind', tier: 'bronze' },
  { id: 'pillar', name: t('Pillar of Trust'), desc: t('Reach 80 Ethos in a speech'), icon: 'shield', tier: 'silver' },
  { id: 'silver_tongue', name: t('Silver Tongue'), desc: t('Reach 80 Pathos in a speech'), icon: 'heart', tier: 'silver' },
  { id: 'iron_logic', name: t('Iron Logic'), desc: t('Reach 80 Logos with no fallacies flagged'), icon: 'scale', tier: 'silver' },
  { id: 'pause_master', name: t('Master of the Pause'), desc: t('5+ deliberate pauses and no frozen silences'), icon: 'pause', tier: 'silver' },
  { id: 'fallacy_hunter', name: t('Fallacy Hunter'), desc: t('Spot 25 fallacies'), icon: 'target', tier: 'silver' },
  { id: 'wordsmith', name: t('Wordsmith'), desc: t('Name 25 rhetorical devices'), icon: 'sparkles', tier: 'silver' },
  { id: 'speechwright', name: t('Speechwright'), desc: t('Finish a speech in Prepare'), icon: 'pen', tier: 'silver' },
  { id: 'triple', name: t('Golden Triangle'), desc: t('Score 70+ on all three appeals in one speech'), icon: 'triangle', tier: 'gold' },
  { id: 'comeback', name: t('Comeback'), desc: t('Raise an appeal 15+ points over your previous speech'), icon: 'trend', tier: 'gold' },
  { id: 'unbroken', name: t('Unbroken'), desc: t('Hit a 10-answer combo in the Arcade'), icon: 'bolt', tier: 'gold' },
  { id: 'eternal_flame', name: t('Eternal Flame'), desc: t('Keep a 7-day streak'), icon: 'flame', tier: 'gold' },
  { id: 'viva_first', name: t('Viva Survivor'), desc: t('Complete your first oral exam'), icon: 'scroll', tier: 'bronze' },
  { id: 'zen', name: t('Steady Breath'), desc: t('Finish 10 rounds of triangle breathing'), icon: 'wind', tier: 'bronze' },
  { id: 'improviser', name: t('Improviser'), desc: t('Speak 5 impromptu topics'), icon: 'target', tier: 'silver' },
  { id: 'distinction', name: t('Distinction'), desc: t('Score 85+ in an examiner-marked oral exam'), icon: 'crown', tier: 'gold' },
  { id: 'fortnight', name: t('Fortnight Flame'), desc: t('Keep a 14-day streak'), icon: 'flame', tier: 'gold' },
  { id: 'perennial', name: t('Perennial Flame'), desc: t('Keep a 30-day streak'), icon: 'flame', tier: 'gold' },
];
const BADGE_XP = 25;

const ARCHETYPES = {
  orator: { name: t('The Orator'), greek: 'ὁ ῥήτωρ', fig: 'epistrophe', mark: ['all three'], blurb: t('Trust, feeling, reason: you hold all three. Now raise all three.') },
  ethos: { name: t('The Statesman'), greek: 'ὁ πολιτικός', fig: 'metaphor', mark: ['Spend'], blurb: t('People trust you before you’ve made your case. Spend that credibility on a story and a sharper argument.') },
  pathos: { name: t('The Storyteller'), greek: 'ὁ μυθολόγος', fig: 'metaphor', mark: ['Anchor'], blurb: t('You move people. Anchor the feeling with evidence so it outlasts the applause.') },
  logos: { name: t('The Analyst'), greek: 'ὁ ἀναλυτικός', fig: 'personification', mark: ['a human face'], blurb: t('Your arguments hold up. Give them a human face and a reason to trust the messenger.') },
  ethos_pathos: { name: t('The Leader'), greek: 'ὁ ἡγεμών', fig: 'anaphora', mark: ['They'], blurb: t('They trust you. They feel you. Now make them think.') },
  pathos_logos: { name: t('The Advocate'), greek: 'ὁ συνήγορος', fig: 'metonymy', mark: ['Heart'], blurb: t('Heart and argument together. Build your credibility so the case lands with authority.') },
  ethos_logos: { name: t('The Expert'), greek: 'ὁ ἐπιστήμων', fig: 'tricolon', mark: ['You know it.', 'They believe it.', 'Now make them feel it.'], blurb: t('You know it. They believe it. Now make them feel it.') },
  blank: { name: t('Your triangle'), greek: 'τὸ τρίγωνον', blurb: t('Analyze a speech to see where your strengths sit.') },
  emerging: { name: t('The Apprentice'), greek: 'ὁ μαθητής', fig: 'metaphor', mark: ['three lights'], blurb: t('Your three lights are still low. Pick the weakest and raise it first.') },
};

/* The figures of speech the app's own lines use. Each annotated line names one in its margin. */
const FIGURES = {
  metaphor: { greek: 'μεταφορά', name: t('Metaphor'), def: t('Describing one thing as if it were another, to make it vivid.'), lab: true },
  antithesis: { greek: 'ἀντίθεσις', name: t('Antithesis'), def: t('Setting opposite ideas side by side in balanced phrases.'), lab: true },
  anaphora: { greek: 'ἀναφορά', name: t('Anaphora'), def: t('Repeating the same opening words at the start of each clause.'), lab: true },
  epistrophe: { greek: 'ἐπιστροφή', name: t('Epistrophe'), def: t('Repeating the same words at the end of each clause, so they ring.'), lab: true },
  tricolon: { greek: 'τρίκωλον', name: t('Tricolon'), def: t('Three parallel beats, with the strongest last.'), lab: true },
  metonymy: { greek: 'μετωνυμία', name: t('Metonymy'), def: t('Naming a thing by something closely tied to it, as a heart stands for feeling and a laurel for honour.') },
  personification: { greek: 'προσωποποιία', name: t('Personification'), def: t('Giving a human face to something that has none. The Greek word means making a face.') },
  imitation: { greek: 'μίμησις', name: t('Imitation'), def: t('Reshaping a famous line so listeners hear the original behind yours. This one follows Socrates in Plato’s Apology: “The unexamined life is not worth living.”') },
};

/* ---------- Core curriculum ---------- */
const LESSONS = [
  {
    id: 'e1', pole: 'ethos', title: 'The three pillars of trust', minutes: 4,
    concept: [
      'Aristotle said audiences trust a speaker who shows three things: practical wisdom (phronesis), good character (arete) and goodwill toward the listeners (eunoia).',
      'Most speakers lean only on the first and list credentials. The strongest ethos shows in the details: a specific fact only an insider would know, an honest admission of what you don’t know, a clear signal that you have the audience’s interests at heart.',
    ],
    terms: [
      { term: 'Phronesis', def: 'Practical wisdom: you know what you are talking about.' },
      { term: 'Arete', def: 'Virtue: you are honest and fair, even about your weak spots.' },
      { term: 'Eunoia', def: 'Goodwill: you are on the audience’s side.' },
    ],
    example: { quote: 'I do not desire to live to distrust my faithful and loving people.', who: 'Elizabeth I, Tilbury, 1588', note: 'Before giving a single order, she declares goodwill toward the troops. Eunoia first, command second.' },
    quiz: [
      { q: 'A speaker says: “I’ve run this warehouse for nine years, and I’ve made this exact mistake twice.” Which pillars show up?', options: ['Phronesis and arete: experience plus candor', 'Eunoia only: goodwill toward the audience', 'None: admitting mistakes hurts credibility', 'It is pathos, not ethos'], answer: 0, why: 'Specific experience shows practical wisdom; admitting mistakes signals honesty. Together they build trust.' },
      { q: 'Which opener builds the most goodwill with a room of tired nurses at the end of a shift?', options: ['I have a doctorate in hospital administration.', 'You’ve been on your feet for twelve hours, so I’ll keep this to ten minutes and make it useful.', 'Studies show nurses are tired.', 'Let me start with a quick joke.'], answer: 1, why: 'It shows you’ve thought about their situation and will respect their time. That is eunoia.' },
    ],
    drill: 'Write the first two sentences of your next talk so they show (not claim) why you are worth listening to. Use one specific detail and one sign of goodwill toward the audience.',
  },
  {
    id: 'e2', pole: 'ethos', title: 'Trade fillers for pauses', minutes: 3,
    concept: [
      'Fillers (“um”, “uh”, “you know”, “like”) leak out when your mouth outruns your next thought. Listeners read them as uncertainty, and that drains credibility.',
      'The fix is to stop talking for a moment. A silent pause of one to two seconds feels endless to you and confident to the audience. Pause before a key point, after a question, and at every transition. In your notes, mark pauses with //.',
    ],
    terms: [{ term: 'The power pause', def: 'One to two seconds of deliberate silence before or after an important line.' }],
    example: { quote: 'we can not dedicate—we can not consecrate—we can not hallow—this ground.', who: 'Abraham Lincoln, Gettysburg, 1863', note: 'The dashes are breaths. Each pause lets the next phrase land harder than the last.' },
    quiz: [
      { q: 'Where does a pause add the most weight?', options: ['Right before your key sentence', 'In the middle of a word', 'Only at the very end of the talk', 'Nowhere: pauses look unprepared'], answer: 0, why: 'Silence before a key line creates anticipation, so the line lands with more force.' },
      { q: 'Roughly how long should a deliberate pause last?', options: ['A tenth of a second', 'One to two seconds', 'Five or six seconds', 'As long as possible'], answer: 1, why: 'One to two seconds reads as confident. Much longer starts to look like you’ve lost your place.' },
    ],
    drill: 'Write the opening three sentences of a talk you will give soon. Insert // wherever you will pause, and replace any “so”, “um” or “basically” starter with silence.',
  },
  {
    id: 'e3', pole: 'ethos', title: 'Own the first ten seconds', minutes: 3,
    concept: [
      'Audiences decide quickly whether a speaker is in command. Before you say a word: walk to your spot, plant your feet, find one friendly face, breathe out. Then speak your first sentence slowly.',
      'Never open with an apology, a technical check or throat-clearing (“So, um, I’m just going to…”). Your first line should be one you could put on a poster. Keep your hands in the “box” between shoulders and waist, gesturing on purpose.',
    ],
    terms: [{ term: 'Composure', def: 'Visible calm. It tells the audience you can be trusted with their attention.' }],
    example: { quote: 'This is preeminently the time to speak the truth, frankly and boldly.', who: 'Franklin D. Roosevelt, 1933', note: 'In a crisis, FDR’s first move is to promise candor. Composure and honesty in one line.' },
    quiz: [
      { q: 'What’s the best thing to do in your first three seconds on stage?', options: ['Start talking immediately to fill the silence', 'Plant your feet, find one face, breathe, then speak', 'Apologize for being nervous', 'Check that your slides work'], answer: 1, why: 'A grounded, silent start signals control. Everything else signals the opposite.' },
      { q: 'Your hands while speaking should mostly…', options: ['Stay in your pockets', 'Gesture within the box between shoulders and waist', 'Grip the lectern', 'Point at the audience'], answer: 1, why: 'Open, purposeful gestures in that zone look natural and confident on camera and on stage.' },
    ],
    drill: 'Write the exact first sentence you will say in your next talk. Keep it under 15 words, with no apology and no throat-clearing.',
  },
  {
    id: 'e4', pole: 'ethos', title: 'Answer the objection first', minutes: 4,
    concept: [
      'Prolepsis is raising the strongest objection to your point before the audience does, then answering it. It shows you’ve considered other views fairly, and that builds trust with the skeptics in the room.',
      'The trap is raising an objection and then not answering it. That plants a doubt you leave behind. If you name it, answer it with something concrete.',
    ],
    terms: [{ term: 'Prolepsis', def: 'Anticipating an objection and answering it in advance.' }],
    example: { quote: 'We have been persuaded by some that are careful of our safety, to take heed how we commit our selves to armed multitudes', who: 'Elizabeth I, Tilbury, 1588', note: 'She names the worry (that she shouldn’t trust the crowd) and dismantles it in the same breath.' },
    quiz: [
      { q: 'Prolepsis means…', options: ['Raising and answering an objection before the audience does', 'Repeating a word at the start of clauses', 'Ending on a question', 'Exaggerating for effect'], answer: 0, why: 'You anticipate the doubt and settle it on your terms.' },
      { q: 'Why does it build credibility?', options: ['It shows you’ve weighed other views fairly', 'It makes the speech longer', 'It confuses opponents', 'It hides your weak spots'], answer: 0, why: 'Fairness is part of arete, good character.' },
    ],
    drill: 'Name the strongest objection to the main point of your next talk. Write two sentences: state it fairly, then answer it with something concrete.',
  },
  {
    id: 'e5', pole: 'ethos', title: 'Laugh at yourself first', minutes: 4,
    concept: [
      'A little humor at your own expense tells the room you are secure. A speaker who doesn’t need to look perfect seems more honest, and an audience that has laughed with you has already relaxed its guard.',
      'Aim the joke at a harmless quirk: your height, your accent, your terrible slides from last year. Never aim it at your competence on the topic (“I have no idea what I’m doing”) and never at the audience. Keep it short, and let it lead straight into your point.',
    ],
    terms: [
      { term: 'Self-deprecation', def: 'Gentle humor at your own expense that signals confidence, not weakness.' },
      { term: 'Safe target', def: 'A small flaw that has nothing to do with your expertise on the subject.' },
    ],
    example: { quote: 'I do not look either very like a soldier or very like a convict, and yet I am both.', who: 'Emmeline Pankhurst, Hartford, 1913', note: 'She names how unlikely she looks in the role before anyone else can. The room laughs, and the line still delivers two serious facts about her.' },
    quiz: [
      { q: 'A new manager opens her first all-hands. Which line uses self-deprecation well?', options: ['Honestly, I have no idea what I’m doing in this job yet.', 'My kids rate my jokes two stars out of five, so lower your expectations for the next minute.', 'I’m sure you’ve all had worse bosses than me.', 'Let me start with a joke about the finance team.'], answer: 1, why: 'It pokes fun at a harmless habit, not her competence, and not anyone in the room.' },
      { q: 'Why does a joke at your own expense build ethos?', options: ['It shows you are secure enough not to need to look perfect', 'It makes the audience pity you', 'It proves your expertise', 'It fills time while you remember your notes'], answer: 0, why: 'Security reads as honesty and confidence, both parts of good character.' },
    ],
    drill: 'Write one line of gentle humor at your own expense for your next talk. Aim it at a harmless quirk, not your expertise, and make the next sentence lead into your first point.',
  },
  {
    id: 'p1', pole: 'pathos', title: 'The story spine', minutes: 4,
    concept: [
      'Stories make people feel, and feelings make them remember. Open with a moment. The improv teacher Kenn Adams’ “story spine” is a reliable skeleton: Once… Every day… Until one day… Because of that… Because of that… Until finally… Ever since then…',
      'Keep it short and specific: one person, one place, one change. Then connect the change to your point.',
    ],
    terms: [{ term: 'Inciting moment', def: 'The “until one day” where something changes. It is the hook of your story.' }],
    example: { quote: 'You all did see that on the Lupercal / I thrice presented him a kingly crown, / Which he did thrice refuse', who: 'Mark Antony, Julius Caesar (Shakespeare)', note: 'Antony doesn’t argue that Caesar wasn’t ambitious. He tells a scene the crowd witnessed and lets them conclude it.' },
    quiz: [
      { q: 'Which opening is a story moment?', options: ['Today I’ll talk about food waste.', 'At 11 p.m. behind a Lisbon restaurant, I watched a chef throw away forty kilos of vegetables.', 'Food waste is a major global problem.', 'Thank you so much for having me.'], answer: 1, why: 'A time, a place, a person and an action. The audience is in the scene.' },
      { q: 'In the story spine, “Until one day…” marks…', options: ['The change that sets the story moving', 'The moral', 'The setting', 'The ending'], answer: 0, why: 'It is the inciting moment that breaks the routine.' },
    ],
    drill: 'Tell a five-sentence story from your own life using the spine: Once… Every day… Until one day… Because of that… Until finally…',
  },
  {
    id: 'p2', pole: 'pathos', title: 'Concrete beats abstract', minutes: 3,
    concept: [
      'Abstract words (“efficiency”, “impact”, “challenges”) slide off the brain. Concrete ones (a smell, a name, a number at human scale) stick.',
      'Translate big numbers into things people can picture: eight tonnes is the weight of six cars. Replace “customers” with one customer and her name. Engage the senses: what did it look like, sound like, feel like?',
    ],
    terms: [{ term: 'Human-scale number', def: 'A statistic converted into something the audience can see or hold.' }],
    example: { quote: 'The next gale that sweeps from the north will bring to our ears the clash of resounding arms!', who: 'Patrick Henry, 1775', note: 'Not “conflict is likely”. Wind, sound and steel make the threat physical.' },
    quiz: [
      { q: 'Which line is the most concrete?', options: ['We had significant waste issues.', 'Forty kilos of tomatoes went into one bin, in one night.', 'Waste is bad for the planet.', 'There were many problems.'], answer: 1, why: 'Weight, object, container and time: you can picture it.' },
      { q: '“Eight tonnes of waste” becomes more vivid as…', options: ['A large amount of waste', 'The weight of six cars', 'Waste in the thousands of kilos', 'Over seven tonnes'], answer: 1, why: 'It converts an abstract figure into an image.' },
    ],
    drill: 'Take one abstract sentence from a talk of yours (for example “we improved efficiency”) and rewrite it three ways: with a sensory detail, with a human-scale number, and with a named person.',
  },
  {
    id: 'p3', pole: 'pathos', title: 'The four Ps of vocal variety', minutes: 3,
    concept: [
      'Pitch, pace, power and pause are the instruments of emotion. A monotone voice flattens even a great script.',
      'Slow down and drop your pitch for the line that matters. Speed up through context and lists. Lower your volume to draw people in; raise it to rally them. End statements with a downward pitch so they sound certain, not like questions.',
    ],
    terms: [{ term: 'Semitone', def: 'The musical step Rostra uses to measure how much your pitch moves. Under about 2 semitones of variation sounds monotone.' }],
    example: { quote: 'it is not light that is needed, but fire; it is not the gentle shower, but thunder.', who: 'Frederick Douglass, 1852', note: 'Written to build: each contrast asks the voice to rise in power.' },
    quiz: [
      { q: 'To make a key line land, you could…', options: ['Say it faster and quieter', 'Slow down, pause before it, and drop your pitch at the end', 'Raise your pitch at the end like a question', 'Keep exactly the same tone'], answer: 1, why: 'Slowing, pausing and a falling pitch all signal importance and certainty.' },
      { q: 'Pitch variation under about 2 semitones across a talk usually sounds…', options: ['Monotone', 'Expressive', 'Shouty', 'Musical'], answer: 0, why: 'Lively speakers usually move 3 to 5 semitones.' },
    ],
    drill: 'Write one important sentence from your talk and annotate it: CAPITALIZE the word to stress, mark // pauses, and add ↑ or ↓ where your pitch should rise or fall.',
  },
  {
    id: 'p4', pole: 'pathos', title: 'What is, what could be', minutes: 4,
    concept: [
      'Great persuasive talks move back and forth between the world as it is and the world as it could be. The gap between them creates tension, and tension makes people lean in.',
      'Describe the present honestly, paint the better future vividly, and end on that future with a role for the audience in getting there.',
    ],
    terms: [{ term: 'Contrast', def: 'Placing two states side by side so the difference does the persuading.' }],
    example: { quote: 'What, to the American slave, is your 4th of July?', who: 'Frederick Douglass, 1852', note: 'He sets the nation’s self-image against the reality of slavery, and the gap becomes the argument.' },
    quiz: [
      { q: 'Contrast in a speech creates…', options: ['Tension the audience wants resolved', 'Confusion', 'Boredom', 'Credibility only'], answer: 0, why: 'The distance between “is” and “could be” pulls people forward.' },
      { q: 'A strong close usually…', options: ['Summarizes every slide', 'Paints the future the audience can help create', 'Introduces a new topic', 'Apologizes for running long'], answer: 1, why: 'End on the better world and their part in it.' },
    ],
    drill: 'Write two sentences for your next talk: one that describes “what is” for your audience today, and one that describes “what could be” if they act on your idea.',
  },
  {
    id: 'p5', pole: 'pathos', title: 'One name beats a million', minutes: 4,
    concept: [
      'People are moved by one person more than by many. In a study by Deborah Small, George Loewenstein and Paul Slovic, people gave more to help a single named girl than to help millions of people described by statistics, and adding the statistics to her story made them give less.',
      'So lead with one person: a name, an age or a role, and one concrete detail. Then widen to the number, and the number inherits the feeling. If you use a real person, ask their permission; if you combine several people into one, say so.',
    ],
    terms: [
      { term: 'Identifiable victim effect', def: 'We respond more strongly to one specific person than to a statistic about many.' },
      { term: 'Psychic numbing', def: 'Paul Slovic’s term for how feeling fades as numbers grow.' },
    ],
    example: { quote: 'Looking Glass is dead. Too-hul-hul-sote is dead.', who: 'Chief Joseph, 1877', note: 'He gives no casualty count. He names the dead one by one, and each name lands harder than a number could.' },
    quiz: [
      { q: 'You are raising money for an adult literacy program. Which opening will move the room most?', options: ['Over 700 million adults worldwide cannot read.', 'Maria is 34. Last month she read a bedtime story to her son for the first time.', 'Literacy is a fundamental human right.', 'Our program has a 92% completion rate.'], answer: 1, why: 'One named person and one concrete moment. The big number can come next, and it will hit harder.' },
      { q: 'Where should your biggest statistic go?', options: ['After the story, so it inherits the feeling', 'Instead of the story', 'Only on the slide title', 'Nowhere: numbers kill emotion'], answer: 0, why: 'The story makes people care; the number then shows the scale. Numbers still matter, they just work better second.' },
    ],
    drill: 'Find the biggest number in your next talk. Write two sentences about one person behind it (a name or role, and one concrete detail), then reintroduce the number.',
  },
  {
    id: 'l1', pole: 'logos', title: 'One big idea', minutes: 3,
    concept: [
      'If you can’t say your talk in one sentence, the audience can’t either. A big idea is not a topic (“remote work”). It is a point of view with stakes (“remote teams need fewer meetings and better writing”).',
      'Write it in 15 words or fewer, with a subject and a verb. Then cut everything that doesn’t support it.',
    ],
    terms: [{ term: 'Big idea', def: 'Your point of view plus what’s at stake, in one sentence.' }],
    example: { quote: 'the only thing we have to fear is fear itself', who: 'Franklin D. Roosevelt, 1933', note: 'A whole economic speech compressed into a sentence people repeated for a century.' },
    quiz: [
      { q: 'Which is a big idea rather than a topic?', options: ['Remote work', 'Remote teams need fewer meetings and better writing.', 'Some thoughts about remote work', 'Remote work: pros and cons'], answer: 1, why: 'It takes a position and implies stakes.' },
      { q: 'A good big idea includes…', options: ['Your point of view and what’s at stake', 'Every detail of the talk', 'Only a statistic', 'A joke'], answer: 0, why: 'Position plus stakes is what makes it memorable and arguable.' },
    ],
    drill: 'Write the big idea of your next talk in one sentence of 15 words or fewer, with a clear point of view.',
  },
  {
    id: 'l2', pole: 'logos', title: 'Claim, reason, evidence', minutes: 4,
    concept: [
      'Every main point needs three parts: the claim (what you assert), the reason (because…), and the evidence (a number, an example, a source). Philosopher Stephen Toulmin added a fourth, the warrant: why that evidence supports that claim.',
      'Most weak arguments skip the evidence or let “everyone knows” stand in for it.',
    ],
    terms: [
      { term: 'Claim', def: 'The point you want accepted.' },
      { term: 'Evidence', def: 'Specific, checkable support: data, examples, testimony.' },
      { term: 'Warrant', def: 'The link explaining why the evidence proves the claim.' },
    ],
    example: { quote: 'He hath brought many captives home to Rome / Whose ransoms did the general coffers fill: / Did this in Caesar seem ambitious?', who: 'Mark Antony, Julius Caesar (Shakespeare)', note: 'Claim (Caesar wasn’t ambitious), evidence (he filled the public treasury), and the crowd supplies the warrant.' },
    quiz: [
      { q: '“Our app saves time because users finish onboarding in 3 minutes instead of 20.” What is the evidence?', options: ['Our app saves time', '3 minutes instead of 20', 'The word “because”', 'The users'], answer: 1, why: 'The specific, measurable comparison is the proof.' },
      { q: 'What’s missing in: “We should switch suppliers. Everyone agrees.”', options: ['A real reason and evidence', 'A claim', 'Emotion', 'A title'], answer: 0, why: 'Popularity isn’t a reason. Why switch, and what shows it’s better?' },
    ],
    drill: 'Write one main point from your talk as Claim → Reason → Evidence, using a concrete number or example.',
  },
  {
    id: 'l3', pole: 'logos', title: 'The rule of three and signposts', minutes: 3,
    concept: [
      'Listeners can’t scroll back. Help them track your structure out loud: “First… Second… Finally…”. These signposts feel obvious to you and are a relief to the audience.',
      'Groups of three feel complete and are easy to remember. Three points, three examples, three parallel phrases (a tricolon).',
    ],
    terms: [{ term: 'Tricolon', def: 'A series of three parallel words, phrases or clauses.' }],
    example: { quote: 'government of the people, by the people, for the people', who: 'Abraham Lincoln, 1863', note: 'Three parallel phrases, one rhythm, one of the most quoted lines in English.' },
    quiz: [
      { q: 'Why signpost more in a speech than in writing?', options: ['Listeners can’t scroll back', 'It sounds smarter', 'It fills time', 'It’s a formal requirement'], answer: 0, why: 'Speech is linear. Signposts are the table of contents your listeners can’t see.' },
      { q: 'A tricolon is…', options: ['A series of three parallel elements', 'A three-hour speech', 'A kind of fallacy', 'A slide layout'], answer: 0, why: 'Like “veni, vidi, vici”.' },
    ],
    drill: 'Outline your next talk as exactly three points, each in one sentence, with the signpost phrase you will say before each.',
  },
  {
    id: 'l4', pole: 'logos', title: 'Steelman, don’t strawman', minutes: 4,
    concept: [
      'A straw man attacks a weaker version of the other side. A steelman states the opposing view at its strongest, then answers it. Analytical listeners notice the difference immediately.',
      'Before you speak, scan your draft for the usual suspects: false dilemmas (“either… or…”), sweeping generalizations (“everyone”, “always”), appeals to popularity, and claims with no evidence.',
    ],
    terms: [
      { term: 'Steelman', def: 'The strongest fair version of an opposing argument.' },
      { term: 'False dilemma', def: 'Presenting two options as the only ones when others exist.' },
    ],
    example: { quote: 'give me liberty or give me death!', who: 'Patrick Henry, 1775', note: 'Rhetorically electric, logically a false dilemma. Great speakers sometimes use fallacies on purpose; make sure you know when you are.' },
    quiz: [
      { q: '“Either we launch this month or the company dies.” This is…', options: ['A false dilemma', 'Ad hominem', 'A red herring', 'Tu quoque'], answer: 0, why: 'It hides every option between the two extremes.' },
      { q: 'Steelmanning means…', options: ['Stating the opposing view in its strongest form before answering it', 'Attacking your opponent’s character', 'Using imagery of steel', 'Ignoring objections'], answer: 0, why: 'It shows fairness and makes your answer far more persuasive.' },
    ],
    drill: 'Write the strongest version of the argument against your next talk’s main point (the steelman), then your two-sentence response.',
  },
  {
    id: 'l5', pole: 'logos', title: 'Analogies and where they break', minutes: 4,
    concept: [
      'An analogy argues that two things alike in familiar ways are also alike in the way that matters. It turns the unfamiliar into something your audience already understands, which is why it persuades so fast.',
      'Every analogy breaks somewhere. Test yours: do the two things match in the exact respect your conclusion depends on? If not, it is a false analogy. The strongest move is to name the weak spot yourself and show your point survives it.',
    ],
    terms: [
      { term: 'Analogy', def: 'An argument that two things alike in some ways are alike in the way that matters.' },
      { term: 'False analogy', def: 'An analogy whose two sides differ in exactly the respect the conclusion depends on.' },
    ],
    example: { quote: 'if women have a pint and man a quart—why can’t she have her little pint full?', who: 'Sojourner Truth, Akron, 1851 (Anti-Slavery Bugle report)', note: 'She grants the doubters their smaller cup for the sake of argument and wins anyway: even a pint deserves to be full. The analogy concedes its own weak point and makes it irrelevant.' },
    quiz: [
      { q: '“A company is a family, so we should never let anyone go.” Where does the analogy break?', options: ['Families don’t need to stay solvent to exist, and solvency is exactly what the decision is about', 'Companies are bigger than families', 'Families have parents', 'It doesn’t break: it’s sound'], answer: 0, why: 'The two sides differ in the very respect the conclusion depends on. That makes it a false analogy.' },
      { q: 'What is the best way to handle your analogy’s weak spot?', options: ['Name it yourself and show your point still holds', 'Hope nobody notices', 'Stack three more analogies on top', 'Never use analogies'], answer: 0, why: 'Like Truth’s pint: concede the difference and show the conclusion survives it.' },
    ],
    drill: 'Write one analogy that explains the main idea of your next talk. Then write one sentence naming where it breaks, and one sentence showing why your point survives anyway.',
  },
];

/* ---------- Arcade banks ---------- */
const FALLACIES = [
  { text: 'Why should we listen to Dana’s budget plan? She can’t even keep her own desk tidy.', answer: 'Ad hominem', why: 'It attacks the person instead of the plan.' },
  { text: 'My opponent wants to trim the defense budget. Clearly he wants to leave the country defenseless.', answer: 'Straw man', why: 'It replaces a modest position with an extreme one that is easier to attack.' },
  { text: 'Either we launch the app this month, or the company is finished.', answer: 'False dilemma', why: 'Only two extreme options are offered when many others exist.' },
  { text: 'If we let people work from home on Fridays, soon nobody will come in at all and the company will collapse.', answer: 'Slippery slope', why: 'It assumes a chain of consequences without showing why each step follows.' },
  { text: 'I tried two vegan restaurants and both were bland. Vegan food just isn’t good.', answer: 'Hasty generalization', why: 'Two examples are too few to support a claim about all vegan food.' },
  { text: 'A famous actor says this supplement cures anxiety, so it must work.', answer: 'Appeal to authority', why: 'The authority cited has no expertise in the subject.' },
  { text: 'Sales went up the week after we changed the logo, so the new logo boosted sales.', answer: 'Post hoc', why: 'Coming after something doesn’t mean being caused by it.' },
  { text: 'Everyone is buying this coin, so it must be a smart investment.', answer: 'Bandwagon', why: 'Popularity is not evidence of quality.' },
  { text: 'This is the best strategy because no other strategy is better than it.', answer: 'Circular reasoning', why: 'The conclusion is just restated as the reason.' },
  { text: 'Asked about the delayed release, the CEO spoke at length about how passionate the team is about innovation.', answer: 'Red herring', why: 'It changes the subject to dodge the actual question.' },
  { text: 'Think of the children. How could anyone vote against this bill?', answer: 'Appeal to emotion', why: 'It uses feelings in place of reasons about the bill itself.' },
  { text: 'You tell me to exercise more, but you never go to the gym yourself.', answer: 'Tu quoque', why: 'Pointing out hypocrisy doesn’t make the advice wrong.' },
  { text: 'We’ve always run the meeting this way, so there’s no reason to change it.', answer: 'Appeal to tradition', why: 'Something being old isn’t proof that it’s right.' },
  { text: 'Have you stopped wasting the marketing budget?', answer: 'Loaded question', why: 'Any direct answer accepts the hidden accusation.' },
  { text: 'No one has proven our mattress doesn’t improve sleep, so it does.', answer: 'Appeal to ignorance', why: 'A lack of disproof isn’t proof.' },
  { text: 'Every player on the team is a star, so the team will surely be the best in the league.', answer: 'Composition', why: 'What’s true of the parts isn’t necessarily true of the whole.' },
  { text: 'No real entrepreneur takes weekends off.', answer: 'No true Scotsman', why: 'It redefines the group to dismiss counterexamples.' },
  { text: 'We’ve already spent two years on this project. We can’t stop now.', answer: 'Sunk cost', why: 'Past costs that can’t be recovered shouldn’t drive the next decision.' },
  { text: 'My grandfather smoked every day and lived to 95, so smoking can’t be that bad.', answer: 'Anecdotal evidence', why: 'One story can’t outweigh large-scale data.' },
  { text: 'Look at these three glowing reviews. Clearly customers love us. (We have 200 reviews.)', answer: 'Cherry picking', why: 'It selects only the evidence that fits.' },
  { text: 'That idea came from a junior intern, so it can’t be any good.', answer: 'Genetic fallacy', why: 'An idea’s origin doesn’t determine whether it is true.' },
  { text: 'One engineer says the bridge is safe, another says it’s dangerous, so it’s probably somewhat safe.', answer: 'Middle ground', why: 'The truth isn’t automatically halfway between two claims.' },
  { text: 'Cities that sell more ice cream have more drownings, so ice cream causes drowning.', answer: 'False cause', why: 'Both rise with hot weather. Correlation isn’t causation.' },
  { text: 'A feather is light. Whatever is light cannot be dark. So a feather cannot be dark.', answer: 'Equivocation', why: '“Light” shifts meaning from weight to brightness mid-argument.' },
  { text: 'The new scheduling system cut patient wait times by a third. “Sure, but people still wait, so it doesn’t really work.”', answer: 'Moving the goalposts', why: 'Once the evidence clears the bar, the bar is raised.' },
  { text: 'This cleaning spray is made only from natural plant oils, so it must be safe to use around pets.', answer: 'Appeal to nature', why: 'Natural isn’t the same as safe; many natural substances are harmful.' },
  { text: 'The coin has landed heads five times in a row, so tails is due.', answer: 'Gambler’s fallacy', why: 'Each flip is independent; past results don’t change the odds.' },
  { text: 'Our company is the most profitable in the industry, so every one of its departments must be making money.', answer: 'Division', why: 'What’s true of the whole isn’t necessarily true of each part.' },
  { text: 'I can’t see how something as heavy as a jumbo jet stays in the air, so I don’t trust flying.', answer: 'Personal incredulity', why: 'Finding something hard to imagine isn’t evidence that it’s false.' },
  { text: 'Everyone on the team has to hit the Friday deadline. Mine slipped, but that’s different: I had a lot on.', answer: 'Special pleading', why: 'The speaker applies the rule to everyone else and exempts themselves without a relevant reason.' },
  { text: 'Employees are like machines: run them harder and you get more output.', answer: 'False analogy', why: 'People and machines differ in exactly the way that matters here: people tire, burn out and quit.' },
  { text: 'Before you hear from the next speaker, remember that he’s been wrong about everything for years.', answer: 'Poisoning the well', why: 'It discredits the speaker in advance, so nothing he says gets a fair hearing.' },
  { text: 'This app came out last month, so it must be better than the one we’ve used for years.', answer: 'Appeal to novelty', why: 'New isn’t the same as better.' },
  { text: 'Out of 500 stocks, I found four whose prices rose after every full moon. Clearly the moon moves the market.', answer: 'Texas sharpshooter', why: 'It finds a pattern in random data after the fact and draws the target around it.' },
  { text: 'Your case for the bike lane used a made-up statistic, so bike lanes must be a bad idea.', answer: 'Fallacy fallacy', why: 'A badly argued claim can still be true.' },
  { text: 'That study can’t be right, because if it were, we’d have to change our whole business model.', answer: 'Appeal to consequences', why: 'Whether a claim is true doesn’t depend on whether its consequences are welcome.' },
  { text: 'Every old building left in town is solid and beautiful, so builders back then must have been better than today’s.', answer: 'Survivorship bias', why: 'The flimsy old buildings were torn down long ago. You only see the survivors.' },
  { text: 'She suggested testing the feature with ten users before launch. So she wants to delay the launch forever?', answer: 'Straw man', why: 'A modest proposal is swapped for an extreme one that is easier to attack.' },
];
const DEVICES = [
  { text: 'We can not dedicate—we can not consecrate—we can not hallow—this ground.', who: 'Abraham Lincoln', answer: 'Anaphora', why: 'The same words open each successive clause.' },
  { text: 'Ask not what your country can do for you—ask what you can do for your country.', who: 'John F. Kennedy', answer: 'Chiasmus', why: 'The second half reverses the structure of the first.' },
  { text: 'Let us never negotiate out of fear. But let us never fear to negotiate.', who: 'John F. Kennedy', answer: 'Chiasmus', why: '“Negotiate… fear” flips to “fear… negotiate”.' },
  { text: 'The world will little note, nor long remember what we say here, but it can never forget what they did here.', who: 'Abraham Lincoln', answer: 'Antithesis', why: 'Opposing ideas in parallel structure: what we say vs. what they did.' },
  { text: 'It was the best of times, it was the worst of times.', who: 'Charles Dickens', answer: 'Antithesis', why: 'Contrasting ideas balanced in parallel clauses.' },
  { text: 'Government of the people, by the people, for the people.', who: 'Abraham Lincoln', answer: 'Tricolon', why: 'Three parallel phrases of matching rhythm.' },
  { text: 'Is life so dear, or peace so sweet, as to be purchased at the price of chains and slavery?', who: 'Patrick Henry', answer: 'Rhetorical question', why: 'Asked for effect; the answer is already implied.' },
  { text: 'Did this in Caesar seem ambitious?', who: 'Shakespeare, Julius Caesar', answer: 'Rhetorical question', why: 'Antony lets the crowd answer in their heads.' },
  { text: 'When I was a child, I spake as a child, I understood as a child, I thought as a child.', who: '1 Corinthians, King James Bible', answer: 'Epistrophe', why: 'The same words close each successive clause.' },
  { text: 'I came, I saw, I conquered.', who: 'Julius Caesar', answer: 'Asyndeton', why: 'Conjunctions are left out to make it quick and punchy.' },
  { text: 'And the rain descended, and the floods came, and the winds blew, and beat upon that house.', who: 'Matthew 7, King James Bible', answer: 'Polysyndeton', why: 'Repeated “and” piles events on top of each other.' },
  { text: 'From forth the fatal loins of these two foes…', who: 'Shakespeare, Romeo and Juliet', answer: 'Alliteration', why: 'Repeated initial “f” sounds bind the line together.' },
  { text: 'The torch has been passed to a new generation of Americans.', who: 'John F. Kennedy', answer: 'Metaphor', why: 'Leadership is described as a torch, without “like” or “as”.' },
  { text: 'O my Luve is like a red, red rose.', who: 'Robert Burns', answer: 'Simile', why: 'A comparison made explicit with “like”.' },
  { text: 'Will all great Neptune’s ocean wash this blood clean from my hand?', who: 'Shakespeare, Macbeth', answer: 'Hyperbole', why: 'Deliberate exaggeration to express overwhelming guilt.' },
  { text: 'I am… a citizen of no mean city.', who: 'Acts 21, King James Bible', answer: 'Litotes', why: 'Understatement by negating the opposite: “no mean city” means a great one.' },
  { text: 'I won’t even mention my opponent’s three failed businesses.', who: 'Classroom example', answer: 'Apophasis', why: 'Raising a point by claiming not to raise it.' },
  { text: 'Words, words, words.', who: 'Shakespeare, Hamlet', answer: 'Epizeuxis', why: 'The same word repeated in immediate succession.' },
  { text: 'We need data; data drives decisions; decisions drive results.', who: 'Classroom example', answer: 'Anadiplosis', why: 'The last word of one clause starts the next.' },
  { text: 'What, to the American slave, is your 4th of July? I answer: a day that reveals to him… the gross injustice and cruelty to which he is the constant victim.', who: 'Frederick Douglass', answer: 'Hypophora', why: 'The speaker asks a question and answers it himself.' },
  { text: 'When well-apparell’d April on the heel / Of limping winter treads…', who: 'Shakespeare, Romeo and Juliet', answer: 'Personification', why: 'April and winter are given human clothing and gait.' },
  { text: 'Tribulation worketh patience; and patience, experience; and experience, hope.', who: 'Romans 5, King James Bible', answer: 'Climax', why: 'Each term steps up to the next in rising order.' },
  { text: 'Looking Glass is dead. Too-hul-hul-sote is dead. The old men are all dead.', who: 'Chief Joseph, 1877', answer: 'Epistrophe', why: 'Each sentence ends on the same word, so “dead” tolls like a bell.' },
  { text: 'Milton! thou should’st be living at this hour: / England hath need of thee…', who: 'William Wordsworth, London, 1802', answer: 'Apostrophe', why: 'The poet speaks directly to someone who cannot hear him: a man long dead.' },
  { text: 'Parting is such sweet sorrow / That I shall say good night till it be morrow.', who: 'Shakespeare, Romeo and Juliet', answer: 'Oxymoron', why: '“Sweet sorrow” fuses two opposites into one phrase.' },
  { text: 'The only thing we have to fear is fear itself.', who: 'Franklin D. Roosevelt', answer: 'Paradox', why: 'It sounds self-contradictory but holds a truth: panic is the real danger.' },
  { text: 'Miss Bolo rose from the table considerably agitated, and went straight home, in a flood of tears and a sedan-chair.', who: 'Charles Dickens, The Pickwick Papers', answer: 'Zeugma', why: 'One word, “in”, does two jobs at once: an emotional state and a vehicle.' },
  { text: 'Love is not love / Which alters when it alteration finds', who: 'Shakespeare, Sonnet 116', answer: 'Polyptoton', why: 'The same root returns in a new form: alters, alteration.' },
  { text: 'The sceptre shall not depart from Judah…', who: 'Genesis 49, King James Bible', answer: 'Metonymy', why: 'The sceptre, an object linked to kings, stands for royal power itself.' },
  { text: 'Give us this day our daily bread.', who: 'Matthew 6, King James Bible', answer: 'Synecdoche', why: 'Bread, one part of a meal, stands for all the food a day requires.' },
  { text: 'The hour of departure has arrived, and we go our ways—I to die, and you to live.', who: 'Plato, Apology (Jowett translation)', answer: 'Antithesis', why: 'Opposites set in matching form: I to die, you to live.' },
  { text: 'I have plowed and reaped and husked and chopped and mowed…', who: 'Sojourner Truth, 1851', answer: 'Polysyndeton', why: 'The repeated “and” piles the labor up, verb on verb.' },
  { text: 'Why do I mention this? Because I am going to explain to you why I have such an evil name.', who: 'Plato, Apology (Jowett translation)', answer: 'Hypophora', why: 'Socrates asks a question and answers it himself straight away.' },
  { text: 'I am that gadfly which God has attached to the state', who: 'Plato, Apology (Jowett translation)', answer: 'Metaphor', why: 'He says he is a gadfly, with no “like” or “as”: small, irritating, and there to wake the horse.' },
];

/* ---------- Library of great speeches (public-domain texts) ---------- */
const LIBRARY = [
  {
    id: 'gettysburg', title: 'The Gettysburg Address', speaker: 'Abraham Lincoln', year: 1863,
    occasion: 'Dedication of a military cemetery during the American Civil War', minutes: 2,
    mix: { ethos: 30, pathos: 42, logos: 28 },
    intro: '272 words, about two minutes. The speaker before Lincoln talked for two hours. Lincoln used his two minutes to redefine what the war was for.',
    text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\n\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\n\nBut, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us—that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion—that we here highly resolve that these dead shall not have died in vain—that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth.',
    notes: [
      { quote: 'Four score and seven years ago our fathers brought forth', kind: 'ethos', label: 'Biblical cadence', note: '“Four score” echoes the King James Bible. It borrows the gravity of scripture and places the speech in sacred time.' },
      { quote: 'conceived in Liberty, and dedicated to the proposition', kind: 'pathos', label: 'Birth metaphor', note: 'The nation is born, conceived and dedicated like a child. The metaphor returns at the end as a “new birth of freedom”.' },
      { quote: 'testing whether that nation, or any nation so conceived and so dedicated, can long endure', kind: 'logos', label: 'The stakes, stated', note: 'The war becomes a test of a proposition, not just a fight between states. That is the logical frame of the whole speech.' },
      { quote: 'we can not dedicate—we can not consecrate—we can not hallow—this ground', kind: 'device', label: 'Anaphora + tricolon', note: 'Three verbs rising in holiness, each opened with the same words. A perfect place for two deliberate pauses.' },
      { quote: 'The world will little note, nor long remember what we say here, but it can never forget what they did here', kind: 'device', label: 'Antithesis', note: 'Say vs. did. Lincoln turns humility into the speech’s most memorable claim (and the world did remember what he said).' },
      { quote: 'It is for us the living, rather, to be dedicated here to the unfinished work', kind: 'ethos', label: 'Turn to the audience', note: 'The pivot from the dead to “us the living” gives the listeners a job. Goodwill becomes shared duty.' },
      { quote: 'that these dead shall not have died in vain', kind: 'pathos', label: 'Emotional climax', note: 'The long final sentence builds clause on clause, each opened with “that”, until it peaks here.' },
      { quote: 'government of the people, by the people, for the people', kind: 'device', label: 'Tricolon', note: 'Three prepositions, one noun. The rhythm made it unforgettable.' },
    ],
    steal: ['Keep it short when everyone else runs long.', 'Structure time: past, present, future.', 'End with a tricolon the audience can repeat.'],
  },
  {
    id: 'tilbury', title: 'Speech to the Troops at Tilbury', speaker: 'Elizabeth I', year: 1588,
    occasion: 'Rallying the English army as the Spanish Armada approached', minutes: 2,
    mix: { ethos: 52, pathos: 33, logos: 15 },
    intro: 'A queen addressing soldiers who might doubt a woman could lead them in war. She meets the doubt head-on.',
    text: 'My loving people,\n\nWe have been persuaded by some that are careful of our safety, to take heed how we commit our selves to armed multitudes, for fear of treachery; but I assure you I do not desire to live to distrust my faithful and loving people. Let tyrants fear. I have always so behaved myself that, under God, I have placed my chiefest strength and safeguard in the loyal hearts and good-will of my subjects; and therefore I am come amongst you, as you see, at this time, not for my recreation and disport, but being resolved, in the midst and heat of the battle, to live and die amongst you all; to lay down for my God, and for my kingdom, and my people, my honour and my blood, even in the dust.\n\nI know I have the body of a weak and feeble woman; but I have the heart and stomach of a king, and of a king of England too, and think foul scorn that Parma or Spain, or any prince of Europe, should dare to invade the borders of my realm; to which rather than any dishonour shall grow by me, I myself will take up arms, I myself will be your general, judge, and rewarder of every one of your virtues in the field.',
    notes: [
      { quote: 'My loving people', kind: 'ethos', label: 'Goodwill first', note: 'Not “soldiers” or “subjects”. She opens with affection (eunoia) before authority.' },
      { quote: 'We have been persuaded by some that are careful of our safety', kind: 'logos', label: 'Prolepsis', note: 'She raises the advisers’ objection (it’s unsafe to stand among armed men) so she can overturn it.' },
      { quote: 'I do not desire to live to distrust my faithful and loving people', kind: 'ethos', label: 'Trust as proof of character', note: 'Standing among them is the argument. Her presence demonstrates what her words claim.' },
      { quote: 'Let tyrants fear.', kind: 'device', label: 'Short sentence after long', note: 'Three words after a 45-word sentence. The contrast in length is the punch.' },
      { quote: 'not for my recreation and disport, but being resolved, in the midst and heat of the battle, to live and die amongst you all', kind: 'pathos', label: 'Shared risk', note: 'Leaders who share danger earn the right to ask for sacrifice.' },
      { quote: 'I know I have the body of a weak and feeble woman; but I have the heart and stomach of a king', kind: 'device', label: 'Concession + antithesis', note: 'She says the doubt out loud, then flips it. The concession makes the reversal land.' },
      { quote: 'I myself will take up arms, I myself will be your general, judge, and rewarder', kind: 'device', label: 'Anaphora', note: '“I myself” repeated: personal commitment, then a tricolon of roles.' },
    ],
    steal: ['Name the doubt about you before the audience does.', 'Follow a long sentence with a very short one.', 'Show commitment by naming what you risk.'],
  },
  {
    id: 'antony', title: 'Mark Antony’s Funeral Oration', speaker: 'William Shakespeare (Julius Caesar, Act 3)', year: 1599,
    occasion: 'Antony turns a crowd that has just cheered Caesar’s assassins', minutes: 3,
    mix: { ethos: 25, pathos: 45, logos: 30 },
    intro: 'Fiction, but the most studied piece of persuasion in English. Antony is allowed to speak only if he doesn’t blame the conspirators. He never does, and he destroys them anyway.',
    text: 'Friends, Romans, countrymen, lend me your ears;\nI come to bury Caesar, not to praise him.\nThe evil that men do lives after them;\nThe good is oft interred with their bones;\nSo let it be with Caesar. The noble Brutus\nHath told you Caesar was ambitious:\nIf it were so, it was a grievous fault,\nAnd grievously hath Caesar answer’d it.\n[…]\nHe was my friend, faithful and just to me:\nBut Brutus says he was ambitious;\nAnd Brutus is an honourable man.\nHe hath brought many captives home to Rome\nWhose ransoms did the general coffers fill:\nDid this in Caesar seem ambitious?\nWhen that the poor have cried, Caesar hath wept:\nAmbition should be made of sterner stuff:\nYet Brutus says he was ambitious;\nAnd Brutus is an honourable man.\nYou all did see that on the Lupercal\nI thrice presented him a kingly crown,\nWhich he did thrice refuse: was this ambition?\nYet Brutus says he was ambitious;\nAnd, sure, he is an honourable man.\nI speak not to disprove what Brutus spoke,\nBut here I am to speak what I do know.',
    verse: true,
    notes: [
      { quote: 'Friends, Romans, countrymen, lend me your ears', kind: 'device', label: 'Tricolon of address', note: 'Three widening circles of belonging: friends, then citizens, then the whole nation.' },
      { quote: 'I come to bury Caesar, not to praise him.', kind: 'device', label: 'Apophasis', note: 'He promises not to praise Caesar, then spends the speech doing exactly that.' },
      { quote: 'And Brutus is an honourable man.', kind: 'device', label: 'Ironic repetition', note: 'Each repetition sits next to more evidence against Brutus, until “honourable” means its opposite.' },
      { quote: 'He hath brought many captives home to Rome\nWhose ransoms did the general coffers fill', kind: 'logos', label: 'Evidence', note: 'A concrete fact that contradicts the charge of ambition: Caesar enriched the public, not himself.' },
      { quote: 'Did this in Caesar seem ambitious?', kind: 'logos', label: 'Rhetorical question', note: 'He never states the conclusion. The crowd reaches it, so they own it.' },
      { quote: 'When that the poor have cried, Caesar hath wept', kind: 'pathos', label: 'Empathy image', note: 'Caesar as a man who wept for the poor. Pure pathos, aimed at the poor in the crowd.' },
      { quote: 'You all did see that on the Lupercal\nI thrice presented him a kingly crown,\nWhich he did thrice refuse', kind: 'logos', label: 'Shared witness', note: '“You all did see.” The best evidence is what the audience already knows to be true.' },
      { quote: 'I speak not to disprove what Brutus spoke', kind: 'ethos', label: 'Disarming modesty', note: 'Another apophasis. By disclaiming the attack, he stays inside the rules while breaking their spirit.' },
    ],
    steal: ['Let the audience draw the conclusion.', 'Use evidence they witnessed themselves.', 'Repeat a phrase until its meaning flips.'],
  },
  {
    id: 'henry', title: 'Give Me Liberty or Give Me Death', speaker: 'Patrick Henry', year: 1775,
    occasion: 'Virginia Convention, urging armed resistance to Britain', minutes: 2,
    mix: { ethos: 22, pathos: 58, logos: 20 },
    intro: 'Reconstructed from listeners’ memories decades later. A study in urgency and in how a famous line can also be a fallacy.',
    text: 'It is in vain, sir, to extenuate the matter. Gentlemen may cry, Peace, Peace—but there is no peace. The war is actually begun! The next gale that sweeps from the north will bring to our ears the clash of resounding arms! Our brethren are already in the field! Why stand we here idle? What is it that gentlemen wish? What would they have? Is life so dear, or peace so sweet, as to be purchased at the price of chains and slavery? Forbid it, Almighty God! I know not what course others may take; but as for me, give me liberty or give me death!',
    notes: [
      { quote: 'Gentlemen may cry, Peace, Peace—but there is no peace.', kind: 'logos', label: 'Refutation', note: 'He states the opponents’ position in their own words and contradicts it. It also echoes the prophet Jeremiah, borrowing moral authority.' },
      { quote: 'The next gale that sweeps from the north will bring to our ears the clash of resounding arms!', kind: 'pathos', label: 'Sensory image', note: 'Wind and the sound of steel. The threat becomes physical, close and audible.' },
      { quote: 'Why stand we here idle? What is it that gentlemen wish? What would they have?', kind: 'device', label: 'Question cascade', note: 'Three rapid questions build pressure on the room without naming anyone.' },
      { quote: 'Is life so dear, or peace so sweet, as to be purchased at the price of chains and slavery?', kind: 'pathos', label: 'Loaded question', note: 'The framing makes peace equal to slavery. Powerful, and worth noticing as a framing move.' },
      { quote: 'give me liberty or give me death!', kind: 'fallacy', label: 'False dilemma', note: 'Only two options are offered. It is electrifying rhetoric and logically a false dilemma, a reminder that great lines aren’t always sound arguments.' },
    ],
    steal: ['Quote the other side fairly, then answer it.', 'Make threats and stakes sensory.', 'Know when you are using a dilemma for effect.'],
  },
  {
    id: 'douglass', title: 'What to the Slave Is the Fourth of July?', speaker: 'Frederick Douglass', year: 1852,
    occasion: 'Independence Day address in Rochester, New York', minutes: 3,
    mix: { ethos: 30, pathos: 48, logos: 22 },
    intro: 'Invited to celebrate the Fourth of July, Douglass turned the occasion into an indictment. The excerpts show him deliberately choosing fire over argument.',
    text: 'Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here to-day? What have I, or those I represent, to do with your national independence?\n[…]\nAt a time like this, scorching irony, not convincing argument, is needed. O! had I the ability, and could I reach the nation’s ear, I would, to-day, pour out a fiery stream of biting ridicule, blasting reproach, withering sarcasm, and stern rebuke. For it is not light that is needed, but fire; it is not the gentle shower, but thunder. We need the storm, the whirlwind, and the earthquake. The feeling of the nation must be quickened; the conscience of the nation must be roused; the propriety of the nation must be startled; the hypocrisy of the nation must be exposed; and its crimes against God and man must be proclaimed and denounced.\n\nWhat, to the American slave, is your 4th of July? I answer: a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim.',
    notes: [
      { quote: 'why am I called upon to speak here to-day?', kind: 'ethos', label: 'Questioning the invitation', note: 'He speaks from outside the celebration. The question establishes his standing to say what follows.' },
      { quote: 'your national independence', kind: 'pathos', label: 'Pronoun shift', note: '“Your”, not “our”. One word draws the line between the audience and the enslaved.' },
      { quote: 'scorching irony, not convincing argument, is needed', kind: 'logos', label: 'Choosing the appeal', note: 'He explains his rhetorical strategy out loud: the facts are known, so feeling must be stirred. Pathos chosen on purpose.' },
      { quote: 'it is not light that is needed, but fire; it is not the gentle shower, but thunder', kind: 'device', label: 'Antithesis', note: 'Paired contrasts that escalate: light to fire, shower to thunder.' },
      { quote: 'We need the storm, the whirlwind, and the earthquake.', kind: 'device', label: 'Tricolon, rising', note: 'Three natural forces, each larger than the last.' },
      { quote: 'The feeling of the nation must be quickened; the conscience of the nation must be roused', kind: 'device', label: 'Parallelism', note: 'The same frame repeated five times: a drumbeat building toward the indictment.' },
      { quote: 'What, to the American slave, is your 4th of July? I answer:', kind: 'device', label: 'Hypophora', note: 'He asks the question the whole speech exists for, then answers it himself.' },
    ],
    steal: ['Turn the occasion itself into your argument.', 'Escalate contrasts: small to large.', 'Ask the question, then answer it.'],
  },
  {
    id: 'fdr', title: 'First Inaugural Address', speaker: 'Franklin D. Roosevelt', year: 1933,
    occasion: 'Taking office at the depth of the Great Depression', minutes: 2,
    mix: { ethos: 45, pathos: 33, logos: 22 },
    intro: 'A frightened country, a quarter of workers unemployed. FDR’s opening minutes are a masterclass in ethos under pressure.',
    text: 'I am certain that my fellow Americans expect that on my induction into the Presidency I will address them with a candor and a decision which the present situation of our Nation impels. This is preeminently the time to speak the truth, frankly and boldly. Nor need we shrink from honestly facing conditions in our country today. This great Nation will endure as it has endured, will revive and will prosper. So, first of all, let me assert my firm belief that the only thing we have to fear is fear itself—nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance.',
    notes: [
      { quote: 'with a candor and a decision which the present situation of our Nation impels', kind: 'ethos', label: 'Promise of candor', note: 'He opens by promising honesty and decisiveness, the two things a scared audience most needs from a leader.' },
      { quote: 'This is preeminently the time to speak the truth, frankly and boldly.', kind: 'ethos', label: 'Arete', note: 'Character on display: he will not sugarcoat.' },
      { quote: 'will endure as it has endured, will revive and will prosper', kind: 'device', label: 'Tricolon + polyptoton', note: '“Endure… endured” repeats the root in a new form; then three verbs climb from survival to prosperity.' },
      { quote: 'the only thing we have to fear is fear itself', kind: 'device', label: 'Paradox', note: 'Fear turned back on itself. A memorable, repeatable line that reframes the crisis.' },
      { quote: 'nameless, unreasoning, unjustified terror', kind: 'pathos', label: 'Naming the emotion', note: 'Three adjectives describe the panic in order to shrink it. Naming a feeling helps an audience manage it.' },
      { quote: 'convert retreat into advance', kind: 'pathos', label: 'Military metaphor', note: 'Recovery framed as a battle the country can win.' },
    ],
    steal: ['In a crisis, promise candor first.', 'Name the audience’s emotion out loud.', 'Compress your message into one repeatable line.'],
  },
  {
    id: 'jfk', title: 'Inaugural Address', speaker: 'John F. Kennedy', year: 1961,
    occasion: 'Inauguration of the youngest elected U.S. president', minutes: 3,
    mix: { ethos: 35, pathos: 40, logos: 25 },
    intro: 'Fourteen minutes, almost entirely made of quotable lines. Notice how much of it is built from mirrored structures.',
    text: 'Let the word go forth from this time and place, to friend and foe alike, that the torch has been passed to a new generation of Americans—born in this century, tempered by war, disciplined by a hard and bitter peace, proud of our ancient heritage.\n[…]\nLet every nation know, whether it wishes us well or ill, that we shall pay any price, bear any burden, meet any hardship, support any friend, oppose any foe, in order to assure the survival and the success of liberty.\n[…]\nSo let us begin anew—remembering on both sides that civility is not a sign of weakness, and sincerity is always subject to proof. Let us never negotiate out of fear. But let us never fear to negotiate.\n[…]\nAnd so, my fellow Americans: ask not what your country can do for you—ask what you can do for your country.',
    notes: [
      { quote: 'the torch has been passed to a new generation of Americans', kind: 'ethos', label: 'Metaphor as credential', note: 'His youth was a liability. The torch metaphor turns it into legitimacy.' },
      { quote: 'born in this century, tempered by war, disciplined by a hard and bitter peace', kind: 'device', label: 'Tricolon', note: 'Three participles describe the generation, and implicitly the speaker.' },
      { quote: 'pay any price, bear any burden, meet any hardship, support any friend, oppose any foe', kind: 'pathos', label: 'Anaphora + asyndeton', note: 'Five commitments with no “and”. The pace itself feels resolute.' },
      { quote: 'civility is not a sign of weakness, and sincerity is always subject to proof', kind: 'logos', label: 'Balanced reasoning', note: 'Two qualifications that make the call for negotiation sound tough-minded, not naive.' },
      { quote: 'Let us never negotiate out of fear. But let us never fear to negotiate.', kind: 'device', label: 'Chiasmus', note: 'The words swap places and the meaning sharpens.' },
      { quote: 'ask not what your country can do for you—ask what you can do for your country', kind: 'device', label: 'Chiasmus as call to action', note: 'The most famous close in modern politics is a reversal plus a direct ask.' },
    ],
    steal: ['Turn a weakness into a credential with one image.', 'Use mirrored lines for your key message.', 'End with a direct ask.'],
  },
  {
    id: 'pericles', title: 'Funeral Oration', speaker: 'Pericles, as written by Thucydides', year: '431 BC',
    occasion: 'Public funeral for the Athenians who fell in the first year of the Peloponnesian War', minutes: 3,
    mix: { ethos: 34, pathos: 33, logos: 33 },
    intro: 'Asked to praise the war dead, Pericles spends most of his time praising the city they died for, and makes the case that Athens itself is their monument. Thucydides wrote the speech down years later, so read it as Pericles in Thucydides’ words. Translation by Richard Crawley (1874).',
    text: 'Most of my predecessors in this place have commended him who made this speech part of the law, telling us that it is well that it should be delivered at the burial of those who fall in battle. For myself, I should have thought that the worth which had displayed itself in deeds would be sufficiently rewarded by honours also shown by deeds; such as you now see in this funeral prepared at the people’s cost.\n[…]\nFor men can endure to hear others praised only so long as they can severally persuade themselves of their own ability to equal the actions recounted: when this point is passed, envy comes in and with it incredulity.\n[…]\nOur constitution does not copy the laws of neighbouring states; we are rather a pattern to others than imitators ourselves. Its administration favours the many instead of the few; this is why it is called a democracy.\n[…]\nWe cultivate refinement without extravagance and knowledge without effeminacy; wealth we employ more for use than for show, and place the real disgrace of poverty not in owning to the fact but in declining the struggle against it. Our public men have, besides politics, their private affairs to attend to, and our ordinary citizens, though occupied with the pursuits of industry, are still fair judges of public matters; for, unlike any other nation, regarding him who takes no part in these duties not as unambitious but as useless, we Athenians are able to judge at all events if we cannot originate, and, instead of looking on discussion as a stumbling-block in the way of action, we think it an indispensable preliminary to any wise action at all.\n[…]\nIn short, I say that as a city we are the school of Hellas, while I doubt if the world can produce a man who, where he has only himself to depend upon, is equal to so many emergencies, and graced by so happy a versatility, as the Athenian.\n[…]\nFor heroes have the whole earth for their tomb; and in lands far from their own, where the column with its epitaph declares it, there is enshrined in every breast a record unwritten with no tablet to preserve it, except that of the heart. These take as your model and, judging happiness to be the fruit of freedom and freedom of valour, never decline the dangers of war.',
    notes: [
      { quote: 'I should have thought that the worth which had displayed itself in deeds would be sufficiently rewarded by honours also shown by deeds', kind: 'ethos', label: 'Doubting his own task', note: 'The most famous speaker in Athens opens by wondering whether a speech is the right tribute at all. Modesty about words makes the audience trust the words that follow.' },
      { quote: 'men can endure to hear others praised only so long as they can severally persuade themselves of their own ability to equal the actions recounted', kind: 'logos', label: 'Reading the audience', note: 'Before he praises anyone, he explains how praise backfires: overdo it and listeners turn envious and doubtful. He names the trap so he can stay out of it.' },
      { quote: 'Its administration favours the many instead of the few; this is why it is called a democracy.', kind: 'logos', label: 'Definition first', note: 'A fact, then the name it earns. Defining the key word up front means everyone is praising the same thing.' },
      { quote: 'place the real disgrace of poverty not in owning to the fact but in declining the struggle against it', kind: 'pathos', label: 'Moving the shame', note: 'Poverty is no disgrace; giving up is. He shifts shame from a condition people can’t help to a choice they can make, which comforts and challenges in one line.' },
      { quote: 'instead of looking on discussion as a stumbling-block in the way of action, we think it an indispensable preliminary to any wise action at all', kind: 'logos', label: 'The case for debate', note: 'Talking first is what makes action wise. A whole theory of democracy in one clause, and a good line to remember before any meeting.' },
      { quote: 'as a city we are the school of Hellas', kind: 'device', label: 'Metaphor', note: 'Athens as the teacher of all Greece. Civic pride compressed into a phrase other people could repeat.' },
      { quote: 'For heroes have the whole earth for their tomb', kind: 'pathos', label: 'Consolation image', note: 'The bodies lie in one grave, but their memory has no borders. Grief widens into pride.' },
      { quote: 'judging happiness to be the fruit of freedom and freedom of valour', kind: 'device', label: 'Anadiplosis', note: '“Freedom” ends one link and starts the next: happiness comes from freedom, and freedom from courage. The chain makes the logic feel unbreakable.' },
    ],
    steal: ['Praise the cause, and the people who served it rise with it.', 'Define your key word before you argue for it.', 'Name the way your speech could go wrong, then steer around it out loud.'],
  },
  {
    id: 'socrates', title: 'The Apology', speaker: 'Socrates, as written by Plato', year: '399 BC',
    occasion: 'Socrates defends himself before an Athenian jury of 500 against charges of impiety and corrupting the young', minutes: 3,
    mix: { ethos: 45, pathos: 15, logos: 40 },
    intro: 'The original oral examination. Seventy years old and facing a death sentence, Socrates answers his accusers with plain talk, careful questions and a joke or two. Plato was in the courtroom and wrote the defense afterward. Translation by Benjamin Jowett.',
    text: 'How you, O Athenians, have been affected by my accusers, I cannot tell; but I know that they almost made me forget who I was—so persuasively did they speak; and yet they have hardly uttered a word of truth. But of the many falsehoods told by them, there was one which quite amazed me;—I mean when they said that you should be upon your guard and not allow yourselves to be deceived by the force of my eloquence. To say this, when they were certain to be detected as soon as I opened my lips and proved myself to be anything but a great speaker, did indeed appear to me most shameless—unless by the force of eloquence they mean the force of truth; for if such is their meaning, I admit that I am eloquent.\n[…]\nSo I left him, saying to myself, as I went away: Well, although I do not suppose that either of us knows anything really beautiful and good, I am better off than he is,—for he knows nothing, and thinks that he knows; I neither know nor think that I know. In this latter particular, then, I seem to have slightly the advantage of him.\n[…]\nFor if you kill me you will not easily find a successor to me, who, if I may use such a ludicrous figure of speech, am a sort of gadfly, given to the state by God; and the state is a great and noble steed who is tardy in his motions owing to his very size, and requires to be stirred into life.\n[…]\nAnd I have a sufficient witness to the truth of what I say—my poverty.\n[…]\nSome one will say: Yes, Socrates, but cannot you hold your tongue, and then you may go into a foreign city, and no one will interfere with you? Now I have great difficulty in making you understand my answer to this. For if I tell you that to do as you say would be a disobedience to the God, and therefore that I cannot hold my tongue, you will not believe that I am serious; and if I say again that daily to discourse about virtue, and of those other things about which you hear me examining myself and others, is the greatest good of man, and that the unexamined life is not worth living, you are still less likely to believe me.\n[…]\nThe hour of departure has arrived, and we go our ways—I to die, and you to live. Which is better God only knows.',
    notes: [
      { quote: 'they almost made me forget who I was—so persuasively did they speak; and yet they have hardly uttered a word of truth', kind: 'ethos', label: 'Praise, then the cut', note: 'He compliments his accusers’ skill, then says it served falsehood. Granting their talent makes the charge of dishonesty land harder.' },
      { quote: 'unless by the force of eloquence they mean the force of truth; for if such is their meaning, I admit that I am eloquent', kind: 'device', label: 'Turning the charge', note: 'They warned the jury about his eloquence. He accepts the word and redefines it, and the accusation becomes a compliment.' },
      { quote: 'for he knows nothing, and thinks that he knows; I neither know nor think that I know', kind: 'logos', label: 'Precise humility', note: 'His only advantage is knowing where his knowledge stops. In any oral exam, saying exactly where you are unsure earns more trust than bluffing.' },
      { quote: 'am a sort of gadfly, given to the state by God', kind: 'device', label: 'Metaphor', note: 'Athens is a big, sleepy horse and he is the fly that stings it awake. He even apologizes for the image, which makes it stick.' },
      { quote: 'And I have a sufficient witness to the truth of what I say—my poverty.', kind: 'ethos', label: 'Evidence of character', note: 'He announces a witness, then reveals it is his empty purse. Nobody who taught for money would be this poor.' },
      { quote: 'Some one will say: Yes, Socrates, but cannot you hold your tongue', kind: 'ethos', label: 'Prolepsis', note: 'He voices the jury’s easiest way out (just go quiet and leave) and answers it before anyone can offer it.' },
      { quote: 'the unexamined life is not worth living', kind: 'logos', label: 'The thesis, compressed', note: 'His whole defense in seven words, tucked inside a long sentence. It became the most quoted line of the trial.' },
      { quote: 'I to die, and you to live. Which is better God only knows.', kind: 'pathos', label: 'The last word', note: 'Death for him, life for them, and a calm doubt about which is better. He doesn’t plead, and that is what moves.' },
    ],
    steal: ['Turn the charge against you into a word you can accept.', 'Say exactly where your knowledge ends.', 'Voice the easy way out, then explain why you won’t take it.'],
  },
  {
    id: 'truth', title: 'Speech at the Woman’s Rights Convention', speaker: 'Sojourner Truth', year: 1851,
    occasion: 'Woman’s Rights Convention, Akron, Ohio', minutes: 2,
    mix: { ethos: 35, pathos: 25, logos: 40 },
    intro: 'This is the report Marius Robinson printed in the Anti-Slavery Bugle on June 21, 1851, a few weeks after he heard it, as transcribed by the Sojourner Truth Project. The famous refrain “Ain’t I a woman?” comes from a version Frances Gage published twelve years later and does not appear here. Spelling and punctuation follow that transcription, including “cant” and “dont”.',
    text: 'May I say a few words?\n[…]\nI want to say a few words about this matter. I am a woman’s rights. I have as much muscle as any man, and can do as much work as any man. I have plowed and reaped and husked and chopped and mowed, and can any man do more than that? I have heard much about the sexes being equal; I can carry as much as any man, and can eat as much too, if I can get it. I am as strong as any man that is now.\n\nAs for intellect, all I can say is, if women have a pint and man a quart—why can’t she have her little pint full? You need not be afraid to give us our rights for fear we will take too much, for we cant take more than our pint’ll hold. The poor men seem to be all in confusion, and dont know what to do. Why children, if you have woman’s rights, give it to her and you will feel better. You will have your own rights, and they wont be so much trouble.\n\nI cant read, but I can hear. I have heard the bible and have learned that Eve caused man to sin. Well if woman upset the world, do give her a chance to set it right side up again. The Lady has spoken about Jesus, how he never spurned woman from him, and she was right. When Lazarus died, Mary and Martha came to him with faith and love and besought him to raise their brother. And Jesus wept—and Lazarus came forth. And how came Jesus into the world? Through God who created him and woman who bore him. Man, where is your part? But the women are coming up blessed be God and a few of the men are coming up with them. But man is in a tight place, the poor slave is on him, woman is coming on him, and he is surely between-a hawk and a buzzard.',
    notes: [
      { quote: 'May I say a few words?', kind: 'ethos', label: 'Asking permission', note: 'She asks the convention’s president before she speaks. The room meets her courtesy before it meets her argument.' },
      { quote: 'I am a woman’s rights.', kind: 'ethos', label: 'Herself as the case', note: 'Printed exactly like this. Read literally, she presents herself as the cause in person, and her own working life becomes the evidence.' },
      { quote: 'I have plowed and reaped and husked and chopped and mowed', kind: 'device', label: 'Polysyndeton', note: 'Five verbs of farm labor chained by “and”. The list feels as long and heavy as the work.' },
      { quote: 'if women have a pint and man a quart—why can’t she have her little pint full?', kind: 'logos', label: 'Analogy with a concession', note: 'She grants the doubters their claim (a smaller cup) for the sake of argument and wins anyway: even a pint deserves to be full.' },
      { quote: 'The poor men seem to be all in confusion, and dont know what to do.', kind: 'pathos', label: 'Humor', note: 'Mock sympathy for the confused men. A room that is laughing with you is already halfway to your side.' },
      { quote: 'if woman upset the world, do give her a chance to set it right side up again', kind: 'logos', label: 'Turning their story', note: 'Eve was a standard argument against women’s rights. She accepts the premise and flips the conclusion: whoever upset the world can set it right.' },
      { quote: 'And how came Jesus into the world? Through God who created him and woman who bore him.', kind: 'device', label: 'Hypophora', note: 'She asks the question and answers it herself, and the answer leaves man out entirely. “Man, where is your part?” needs no reply.' },
      { quote: 'he is surely between-a hawk and a buzzard', kind: 'pathos', label: 'A folk image to close', note: 'A country saying for being caught between two threats. The slave on one side, woman on the other: she ends on a laugh that is also a warning.' },
    ],
    steal: ['Let your own life be the evidence.', 'Grant the other side’s premise, then show your conclusion survives it.', 'End on an image the room can laugh at and remember.'],
  },
  {
    id: 'joseph', title: 'I Will Fight No More Forever', speaker: 'Chief Joseph (Hin-mah-too-yah-lat-kekt) of the Nez Perce', year: 1877,
    occasion: 'Surrender to the U.S. Army at the Bear Paw Mountains, Montana Territory', minutes: 1,
    mix: { ethos: 30, pathos: 55, logos: 15 },
    intro: 'After a fighting retreat of more than a thousand miles, the Nez Perce were trapped short of the Canadian border. Joseph’s reply was translated and written down by the army; this is the text in General Howard’s official report, and historians still debate how close it is to his own words. Almost every word is one or two syllables.',
    text: 'Tell General Howard I know his heart. What he told me before I have in my heart. I am tired of fighting. Our chiefs are killed. Looking Glass is dead. Too-hul-hul-sote is dead. The old men are all dead. It is the young men who say yes or no. He who led on the young men is dead.\n\nIt is cold and we have no blankets. The little children are freezing to death. My people, some of them, have run away to the hills, and have no blankets, no food; no one knows where they are—perhaps freezing to death. I want to have time to look for my children and see how many of them I can find. Maybe I shall find them among the dead.\n\nHear me, my chiefs. I am tired; my heart is sick and sad. From where the sun now stands I will fight no more forever.',
    notes: [
      { quote: 'Tell General Howard I know his heart.', kind: 'ethos', label: 'Respect for the opponent', note: 'His first words honor the general who has hunted him for months. Dignity in defeat gives everything after it authority.' },
      { quote: 'I am tired of fighting.', kind: 'pathos', label: 'Plain feeling', note: 'Five words, no ornament. Stating a feeling plainly can hit harder than describing it.' },
      { quote: 'Looking Glass is dead. Too-hul-hul-sote is dead. The old men are all dead.', kind: 'device', label: 'Epistrophe', note: 'Each sentence ends on “dead”. He names the fallen one by one instead of counting them.' },
      { quote: 'It is the young men who say yes or no. He who led on the young men is dead.', kind: 'logos', label: 'The reasoning', note: 'Two sentences explain why there is no one left to lead the fight. The surrender is argued, not only felt.' },
      { quote: 'The little children are freezing to death.', kind: 'pathos', label: 'The image that decides it', note: 'Cold and children. The audience feels the reason for surrender before he states it.' },
      { quote: 'I want to have time to look for my children and see how many of them I can find.', kind: 'logos', label: 'A concrete ask', note: 'Inside the surrender is a specific request: time to search for his people. A specific ask is easier to grant than a general plea.' },
      { quote: 'Hear me, my chiefs.', kind: 'device', label: 'Turn of address', note: 'He turns from the general to his own people. The final vow is made to them.' },
      { quote: 'From where the sun now stands I will fight no more forever.', kind: 'pathos', label: 'A vow fixed to the sky', note: 'He ties the promise to where the sun is at that moment. Quiet, exact and impossible to forget.' },
    ],
    steal: ['Short words carry the heaviest weight.', 'Name people. Numbers fade.', 'Tie your final promise to a concrete moment.'],
  },
  {
    id: 'pankhurst', title: 'Freedom or Death', speaker: 'Emmeline Pankhurst', year: 1913,
    occasion: 'Fundraising speech in Hartford, Connecticut, between prison sentences in Britain', minutes: 3,
    mix: { ethos: 30, pathos: 25, logos: 45 },
    intro: 'The leader of Britain’s militant suffragettes crossed the Atlantic to raise money and explain to American audiences why women had turned to window-smashing and hunger strikes. She makes her case with analogies, humor and her listeners’ own history.',
    text: 'I am here as a soldier who has temporarily left the field of battle in order to explain—it seems strange it should have to be explained—what civil war is like when civil war is waged by women.\n[…]\nSo you see there is some special interest in hearing so unusual a person address you. I dare say, in the minds of many of you—you will perhaps forgive me this personal touch—that I do not look either very like a soldier or very like a convict, and yet I am both.\n[…]\nYou have two babies very hungry and wanting to be fed. One baby is a patient baby, and waits indefinitely until its mother is ready to feed it. The other baby is an impatient baby and cries lustily, screams and kicks and makes everybody unpleasant until it is fed. Well, we know perfectly well which baby is attended to first. That is the whole history of politics.\n[…]\nWomen are very slow to rouse, but once they are aroused, once they are determined, nothing on earth and nothing in heaven will make women give way; it is impossible.\n[…]\nNow, I want to say to you who think women cannot succeed, we have brought the government of England to this position, that it has to face this alternative: either women are to be killed or women are to have the vote.\n[…]\nYou won your freedom in America when you had the revolution, by bloodshed, by sacrificing human life.\n[…]\nHuman life for us is sacred, but we say if any life is to be sacrificed it shall be ours; we won’t do it ourselves, but we will put the enemy in the position where they will have to choose between giving us freedom or giving us death.',
    notes: [
      { quote: 'I am here as a soldier who has temporarily left the field of battle', kind: 'device', label: 'Extended metaphor', note: 'Right at the start she makes the campaign a war and herself a soldier on leave from the front. Prison, hunger strikes and every later point fit inside that frame.' },
      { quote: 'I do not look either very like a soldier or very like a convict, and yet I am both.', kind: 'ethos', label: 'Self-deprecating humor', note: 'She names the gap between how she looks and what she is before anyone else can. The laugh disarms the room, and the line still delivers two serious facts.' },
      { quote: 'You have two babies very hungry and wanting to be fed.', kind: 'logos', label: 'Homely analogy', note: 'A theory of politics explained with a nursery. Everyone in the room has seen it happen, so the logic arrives already accepted.' },
      { quote: 'That is the whole history of politics.', kind: 'logos', label: 'The leap', note: 'One domestic scene becomes a law of all politics. Short and confident, and worth questioning: analogies persuade partly by what they leave out.' },
      { quote: 'nothing on earth and nothing in heaven will make women give way', kind: 'device', label: 'Parallelism', note: 'Earth and heaven, the whole universe in two matched phrases. Absolute language for an absolute resolve.' },
      { quote: 'either women are to be killed or women are to have the vote', kind: 'logos', label: 'A dilemma by design', note: 'Just before this, she argues that the government’s third option, releasing hunger strikers and re-arresting them, has failed. Compare it with Patrick Henry’s dilemma and decide how real each one is.' },
      { quote: 'You won your freedom in America when you had the revolution, by bloodshed', kind: 'ethos', label: 'Their own precedent', note: 'She reminds Americans that they fought for their own freedom. Her movement becomes a version of their founding story.' },
      { quote: 'choose between giving us freedom or giving us death', kind: 'pathos', label: 'The title line', note: 'Compare Patrick Henry’s “give me liberty or give me death”. Here the women refuse to kill, so the choice between freedom and death passes to the government.' },
    ],
    steal: ['Joke about the gap between how you look and what you are.', 'Explain an abstract strategy with a scene everyone has lived.', 'Tie your cause to your audience’s own history.'],
  },
];
/* Library years are numbers for CE dates and strings like '431 BC' for ancient speeches. Use this to sort. */
const libraryYear = (s) => (typeof s.year === 'number' ? s.year : (/BC/.test(String(s.year)) ? -1 : 1) * (parseInt(s.year, 10) || 0));
const MODERN = [
  { title: 'Do schools kill creativity?', speaker: 'Sir Ken Robinson', year: 2006, url: 'https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity', watch: 'Humor as ethos. He wins the room with self-deprecating stories before making a serious argument.', pole: 'ethos' },
  { title: 'The power of vulnerability', speaker: 'Brené Brown', year: 2010, url: 'https://www.ted.com/talks/brene_brown_the_power_of_vulnerability', watch: 'A researcher confessing her own breakdown. Data and personal story braided together.', pole: 'pathos' },
  { title: 'We need to talk about an injustice', speaker: 'Bryan Stevenson', year: 2012, url: 'https://www.ted.com/talks/bryan_stevenson_we_need_to_talk_about_an_injustice', watch: 'Opens with his grandmother, not statistics. The numbers come later and hit harder for it.', pole: 'pathos' },
  { title: 'How great leaders inspire action', speaker: 'Simon Sinek', year: 2009, url: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action', watch: 'One big idea, one simple diagram, repeated until it sticks.', pole: 'logos' },
  { title: 'Stanford commencement address', speaker: 'Steve Jobs', year: 2005, url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc', watch: '“Three stories.” A signposted structure announced in the first minute.', pole: 'logos' },
  { title: 'The danger of a single story', speaker: 'Chimamanda Ngozi Adichie', year: 2009, url: 'https://www.ted.com/talks/chimamanda_ngozi_adichie_the_danger_of_a_single_story', watch: 'Anecdote after anecdote, each one a step in an argument she only states at the end.', pole: 'ethos' },
  { title: 'The best stats you’ve ever seen', speaker: 'Hans Rosling', year: 2006, url: 'https://www.ted.com/talks/hans_rosling_the_best_stats_you_ve_ever_seen', watch: 'He jokes that chimpanzees would beat top Swedish students on his quiz, then narrates moving bubble charts like a sports commentator. Data turned into a race.', pole: 'logos' },
  { title: 'How to speak so that people want to listen', speaker: 'Julian Treasure', year: 2013, url: 'https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen', watch: 'As he names each vocal tool (register, timbre, prosody, pace) he demonstrates it with his own voice. Listen to him do what he describes.', pole: 'pathos' },
  { title: 'The power of introverts', speaker: 'Susan Cain', year: 2012, url: 'https://www.ted.com/talks/susan_cain_the_power_of_introverts', watch: 'A quiet speaker with a real suitcase of books on stage. She opens with the suitcase her mother packed for summer camp and closes by asking you to open your own.', pole: 'ethos' },
  { title: 'Inside the mind of a master procrastinator', speaker: 'Tim Urban', year: 2016, url: 'https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator', watch: 'Self-deprecation does the setup: a 90-page thesis written in 72 hours. Then a calendar of a 90-year life in weekly boxes turns the laughter serious.', pole: 'ethos' },
];

/* ---------- Fallback scaffolds for Prepare (used when the AI coach is off) ---------- */
const FALLBACK_ANGLES = [
  { name: 'Start with a moment', approach: 'Story-led', thesis: 'Open on one vivid moment from your experience and let it carry the message to the ask.', beats: ['A specific moment', 'What it revealed', 'Why it matters to this audience', 'What you propose', 'The ask, tied back to the moment'], mix: { ethos: 25, pathos: 50, logos: 25 }, fits: 'Builds connection fast and suits almost any occasion.', risk: 'The story can swallow the point. Keep it under a minute.' },
  { name: 'Make the case', approach: 'Problem → solution', thesis: 'Define the problem crisply, prove it with evidence, show the solution and answer the strongest objection.', beats: ['The problem in one line', 'Evidence it is real', 'The cost of doing nothing', 'Your solution', 'The strongest objection, answered', 'The ask'], mix: { ethos: 25, pathos: 20, logos: 55 }, fits: 'Persuades analytical listeners and decision-makers.', risk: 'It can feel cold. Put one human example inside the evidence.' },
  { name: 'Be the guide', approach: 'Shared values', thesis: 'Show why you are trustworthy on this, connect to what the audience already values, and invite them along a clear path.', beats: ['Why you, briefly', 'What we share', 'Where we are now', 'The path forward', 'An invitation'], mix: { ethos: 50, pathos: 30, logos: 20 }, fits: 'Strong when the audience needs to trust you before they act.', risk: 'Too much “me” reads as bragging. Keep the focus on them.' },
];
const BEAT_SCAFFOLD = {
  'A specific moment': { pole: 'pathos', purpose: 'Drop the audience into a scene so they feel it before they think about it.', technique: 'Start mid-action: time, place, one sensory detail.', frame: 'It was [time] in [place], and I [action].', prompts: ['When did you first feel this problem personally?', 'What did you see, hear or say in that moment?'] },
  'What it revealed': { pole: 'logos', purpose: 'Turn the story into an insight.', technique: 'One sentence that starts with “That’s when I realized…”.', frame: 'That’s when I realized [insight].', prompts: ['What did that moment teach you that others miss?'] },
  'Why it matters to this audience': { pole: 'ethos', purpose: 'Connect your insight to their world and interests.', technique: 'Use “you” more than “I”.', frame: 'For you, this means [consequence].', prompts: ['What does the audience lose or gain here?', 'What do they already care about that this touches?'] },
  'What you propose': { pole: 'logos', purpose: 'Give the solution or idea in plain terms.', technique: 'Rule of three: say it in three simple steps.', frame: 'Here’s what we do: [step one], [step two], [step three].', prompts: ['How would you explain this to a smart 12-year-old?'] },
  'The ask, tied back to the moment': { pole: 'pathos', purpose: 'Close the loop and ask for one specific action.', technique: 'Callback to your opening image, then a direct ask.', frame: 'Remember [opening image]? With your [action], it becomes [new ending].', prompts: ['What exactly should they do tomorrow?', 'How does the opening scene end differently if they act?'] },
  'The problem in one line': { pole: 'logos', purpose: 'Name the problem so clearly no one can miss it.', technique: 'One sentence, no jargon, with a number if you have one.', frame: 'Right now, [who] [suffers what], and it costs [amount].', prompts: ['Who has this problem, and how often?'] },
  'Evidence it is real': { pole: 'logos', purpose: 'Prove the problem with specifics.', technique: 'Claim → reason → evidence. Cite your source.', frame: 'We know this because [evidence], according to [source].', prompts: ['What is the strongest fact you have?', 'Where does it come from?'] },
  'The cost of doing nothing': { pole: 'pathos', purpose: 'Make the stakes felt.', technique: 'Make it concrete: a human-scale number or a person.', frame: 'If nothing changes, by [time] [consequence].', prompts: ['What happens in a year if nobody acts?'] },
  'Your solution': { pole: 'logos', purpose: 'Show how your idea solves it.', technique: 'Show it working once: an example or a pilot result.', frame: 'Our answer is [solution]. When we tried it with [example], [result].', prompts: ['What proof do you have that it works?'] },
  'The strongest objection, answered': { pole: 'ethos', purpose: 'Win the skeptics by being fair.', technique: 'Prolepsis: state their best objection, then answer it with evidence.', frame: 'You might be thinking [objection]. Here’s why [answer].', prompts: ['What would your toughest critic say?', 'What concrete fact answers it?'] },
  'The ask': { pole: 'ethos', purpose: 'Ask for one clear action.', technique: 'Say the ask, then pause for two seconds.', frame: 'I’m asking you to [action] by [date].', prompts: ['What single action matters most?'] },
  'Why you, briefly': { pole: 'ethos', purpose: 'Earn the right to be heard in under 30 seconds.', technique: 'Show, don’t claim: one specific credential-revealing detail.', frame: 'I’ve spent [time] [doing what], and I’ve learned [lesson].', prompts: ['What experience makes you credible here?', 'What have you got wrong before?'] },
  'What we share': { pole: 'pathos', purpose: 'Find common ground with the audience.', technique: 'Name a value or experience you share.', frame: 'Like you, I [shared value or experience].', prompts: ['What does everyone in the room want?'] },
  'Where we are now': { pole: 'logos', purpose: 'Describe the current situation honestly.', technique: 'What is: one fact, one image.', frame: 'Today, [current reality].', prompts: ['What would an honest snapshot of today include?'] },
  'The path forward': { pole: 'logos', purpose: 'Lay out the steps.', technique: 'Signpost: first, second, finally.', frame: 'First, [step]. Second, [step]. Finally, [step].', prompts: ['What are the three steps, in order?'] },
  'An invitation': { pole: 'pathos', purpose: 'Invite rather than command.', technique: 'What could be: paint the future they help create.', frame: 'Imagine [future]. Let’s [action] together.', prompts: ['What does success look like in a year?'] },
};

/* ---------- Sample report (for the example state) ---------- */
function seeded(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const SAMPLE_TRANSCRIPT = `Um, good morning everyone. Three years ago I stood behind a restaurant in Lisbon at eleven at night, watching a chef throw away forty kilos of perfectly good vegetables. Forty kilos. In one night. From one kitchen.

That moment is why we started Compost Club.

Here's the problem. Restaurants in this city throw out about a third of the food they buy. That's money in the bin, and it's methane in the air. And honestly, you know, everyone knows the big waste companies don't care about this, so nothing is going to change unless we do it.

Our solution is simple. We collect food scraps from restaurants by e-bike every evening, we turn them into compost at our urban farm, and we sell that compost back to the city's rooftop gardens. The restaurants pay less than they pay for landfill pickup. The gardens get soil that is, like, ridiculously rich. And the scraps never touch a landfill.

In our pilot we signed twelve restaurants in four months. Twelve. They diverted eight tonnes of waste, and every single one of them renewed.

Now, some people say composting at this scale can't be profitable. But either we build this now, or the city's waste problem will be unsolvable for a generation.

We're raising four hundred thousand euros to grow from fifteen restaurants to one hundred and fifty by the end of next year. Um, that's basically it for the numbers.

So picture that chef again. Same kitchen, same eleven p.m., same forty kilos. Except this time, it becomes the soil for the tomatoes on his own menu.

Help us close the loop. Thank you.`;

function makeSampleMetrics() {
  const r = seeded(11);
  const duration = 112;
  const pauseList = [
    [6.1, 0.8], [12.4, 0.9], [14.2, 0.75], [19.0, 1.4], [27.5, 0.5], [33.8, 0.9], [41.0, 0.4], [47.3, 1.1], [58.6, 0.6],
    [66.0, 0.45], [70.5, 1.0], [74.2, 2.6], [83.1, 0.6], [90.4, 0.9], [99.8, 0.5], [106.0, 1.2], [112.5, 0.4], [119.3, 1.0], [125.6, 0.6],
  ];
  const pauses = pauseList.map(([t, d]) => ({ t: +(t * 0.85).toFixed(1), d }));
  const inPause = (sec) => pauses.some((p) => sec >= p.t && sec <= p.t + p.d);
  const wave = [];
  for (let i = 0; i < 480; i++) {
    const sec = (i / 480) * duration;
    if (sec < 1.6 || sec > 110 || inPause(sec)) { wave.push(Math.round(2 + r() * 3)); continue; }
    const phrase = 0.55 + 0.45 * Math.abs(Math.sin(sec * 0.9));
    wave.push(Math.round(18 + 70 * Math.pow(r(), 0.7) * phrase));
  }
  const timeline = [];
  for (let b = 0; b < 40; b++) {
    const t = ((b + 0.5) / 40) * duration;
    const arc = Math.sin((b / 39) * Math.PI);
    const loud = 0.45 + 0.25 * arc + (b > 34 ? 0.15 : 0) + (r() - 0.5) * 0.12;
    const pitch = -1 + 2.4 * arc + (r() - 0.5) * 1.6 + (b < 4 ? 1.2 : 0);
    const rate = 158 + (r() - 0.5) * 30 + (b > 20 && b < 26 ? 18 : 0);
    timeline.push({ t, loud: Math.max(0.1, Math.min(1, loud)), pitch, rate: Math.round(rate) });
  }
  return {
    source: 'audio', duration, spanSec: 108.4, speakingSec: 89.1, wpmEst: 154, syllables: 405,
    pauses: summarizePauses(pauses), pitch: { median: 176, std: 3.1, range: 8.4, points: 912 },
    loudness: { std: 4.6, range: 12.8 }, timeline, wave,
  };
}

const SAMPLE_AI = {
  title: 'Compost Club seed pitch',
  summary: 'A pitch for a restaurant composting service that opens and closes on a memorable image. The story carries it; the argument wobbles when it meets the profitability question.',
  scores: { ethos: 58, pathos: 80, logos: 52 },
  subscores: {
    ethos: { credibility: 62, goodwill: 60, composure: 52 },
    pathos: { story: 88, imagery: 82, connection: 70 },
    logos: { structure: 68, evidence: 50, reasoning: 38 },
  },
  structure: [
    { part: 'Opening', verdict: 'strong', quote: 'Three years ago I stood behind a restaurant', note: 'A story hook with a vivid image, slightly blunted by the “um” at the very start.' },
    { part: 'Problem', verdict: 'solid', quote: "Here's the problem.", note: 'A clear signpost, but the evidence is unsourced and leans on “everyone knows”.' },
    { part: 'Solution', verdict: 'strong', quote: 'Our solution is simple.', note: 'A three-step model that’s easy to picture.' },
    { part: 'Traction', verdict: 'strong', quote: 'In our pilot we signed twelve restaurants', note: 'Specific numbers and a 100% renewal rate. Your best proof.' },
    { part: 'Objection', verdict: 'weak', quote: 'Now, some people say composting', note: 'Raised but not answered, then replaced with a false dilemma.' },
    { part: 'Ask & close', verdict: 'solid', quote: "We're raising four hundred thousand euros", note: 'A clear ask and a great callback, but the numbers conflict and the trailing filler weakens it.' },
  ],
  highlights: [
    { quote: 'Three years ago I stood behind a restaurant in Lisbon at eleven at night', kind: 'strength', label: 'Story hook', pole: 'pathos', note: 'Opening on a specific moment (a time, a place, an image) pulls the audience in before you ask anything of them.' },
    { quote: 'Forty kilos. In one night. From one kitchen.', kind: 'device', label: 'Tricolon', pole: 'pathos', note: 'Three short fragments, each narrowing the frame. The rhythm makes the number stick.' },
    { quote: 'throw out about a third of the food they buy', kind: 'vague', label: 'Unsourced statistic', pole: 'logos', note: 'A big number with no source. Investors will want to know where it comes from.', fix: 'Cite it (“the city’s 2023 waste audit found…”) or use a figure from your own pilot.' },
    { quote: "everyone knows the big waste companies don't care about this", kind: 'fallacy', label: 'Bandwagon', pole: 'logos', note: '“Everyone knows” substitutes popularity for proof, and the claim about competitors is unsupported.', fix: 'Name one checkable fact, such as how many restaurants the big haulers serve without a composting option.' },
    { quote: 'The restaurants pay less than they pay for landfill pickup.', kind: 'strength', label: 'Clear value proposition', pole: 'logos', note: 'A concrete, comparative benefit the audience can verify.' },
    { quote: 'In our pilot we signed twelve restaurants in four months. Twelve.', kind: 'strength', label: 'Traction as evidence', pole: 'ethos', note: 'Specific traction is your strongest proof, and the one-word repetition gives it room to land.' },
    { quote: "some people say composting at this scale can't be profitable", kind: 'fallacy', label: 'Red herring', pole: 'logos', note: 'You raise the profitability objection, then pivot to urgency instead of answering it. For investors this is the key question.', fix: 'Answer with unit economics: revenue per restaurant, cost per pickup, and when you break even.' },
    { quote: "either we build this now, or the city's waste problem will be unsolvable for a generation", kind: 'fallacy', label: 'False dilemma', pole: 'logos', note: 'Two extremes presented as the only options. It sounds urgent but invites eye-rolls from analytical listeners.', fix: 'Make the urgency concrete instead: what specifically changes in the next 12 months if you don’t scale?' },
    { quote: 'grow from fifteen restaurants to one hundred and fifty', kind: 'inconsistency', label: 'Conflicting numbers', pole: 'ethos', note: 'Earlier you said twelve restaurants; here it’s fifteen. Small mismatches cost credibility in a pitch.', fix: 'Use one number everywhere, or explain the change (“twelve in the pilot, fifteen today”).' },
    { quote: "Um, that's basically it for the numbers.", kind: 'weak', label: 'Trailing transition', pole: 'ethos', note: 'Trailing off right after your ask undercuts it. Investors hear uncertainty.', fix: 'Cut it. Let the ask sit in two seconds of silence, then move to your close.' },
    { quote: 'Same kitchen, same eleven p.m., same forty kilos.', kind: 'device', label: 'Anaphora + callback', pole: 'pathos', note: 'Repeating “same” while returning to your opening image closes the loop emotionally.' },
    { quote: 'Help us close the loop.', kind: 'strength', label: 'Memorable call to action', pole: 'ethos', note: 'A short ask that doubles as the company’s purpose. A strong last line.' },
  ],
  strengths: [
    'Your opening puts us behind the restaurant at 11 p.m. with a specific, visual detail.',
    'Pilot traction (twelve restaurants, eight tonnes, every one renewed) is concrete proof.',
    'The callback ending returns to the chef and makes the ask feel inevitable.',
  ],
  growth: [
    'Answer the profitability objection with unit economics instead of pivoting to urgency.',
    'Source your big statistics, and make sure your numbers match (twelve vs. fifteen restaurants).',
    'Cut the opening “um” and the closing “that’s basically it” so you start and land with authority.',
  ],
  lessons: [
    { title: 'Answer the objection you raise', pole: 'logos', why: 'You raised “can’t be profitable” and moved on without answering it.', concept: 'Prolepsis means naming the strongest objection before the audience does and answering it head-on. Done well, it signals confidence and fairness. Done halfway, it plants a doubt you then leave behind.', example: '“You might be thinking compost doesn’t pay. Here’s our math: each restaurant brings in €210 a month and costs €140 to serve.”', drill: 'Write the profitability objection in one sentence, then answer it in two sentences using one specific number.' },
    { title: 'Evidence over “everyone knows”', pole: 'logos', why: '“Everyone knows the big waste companies don’t care” asks the audience to trust popularity instead of proof.', concept: 'Replace sweeping claims with one verifiable fact. Specific evidence persuades skeptics; appeals to what “everyone” thinks only persuade people who already agree.', example: '“Of the city’s four licensed haulers, none offers restaurant composting.”', drill: 'Rewrite the “everyone knows” sentence as a specific, checkable claim, and note where you would source it.' },
    { title: 'Land the ask in silence', pole: 'ethos', why: '“Um, that’s basically it for the numbers” trails off right after your ask.', concept: 'The moment after the ask is the most powerful silence in a pitch. Fillers there read as doubt. Say the ask, hold eye contact, count two seconds, then move on.', example: '“We’re raising €400,000 to reach 150 restaurants by next December.” // “So picture that chef again…”', drill: 'Write your ask as one sentence with the amount, the goal and the deadline. Mark // where you will pause.' },
  ],
  coach_note: 'You have a storyteller’s instincts: that chef at 11 p.m. is what investors will remember on the way home. Now earn the analytical half of the room. Answer the money question directly and make every number match.',
};
const SAMPLE_PROFILE = {
  scores: { ethos: 61, pathos: 79, logos: 55 },
  first: { ethos: 47, pathos: 63, logos: 46 },
  trail: [
    { e: 47, p: 63, l: 46, t: 1 }, { e: 52, p: 70, l: 49, t: 2 }, { e: 56, p: 74, l: 48, t: 3 }, { e: 61, p: 79, l: 55, t: 4 },
  ],
};
