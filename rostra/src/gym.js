/* ================================================================
   The Gym (palaestra): five stations, each its own small world.
   I   Triangle breathing  on a night stage, three lights, one breath
   II  Vocal warm-up       in the dressing-room mirror
   III Tongue twisters     a sing-along screen with a bouncing ball
   IV  Impromptu roulette  a game-show wheel, then the floor is yours
   V   Device lab          plain light in, a crafted line out
   Globals are prefixed gym / Gym / GYM_.
   ================================================================ */

Object.assign(ICONS, {
  gymWheel: [{ c: [12, 12, 9] }, { c: [12, 12, 2] }, 'M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5'],
  gymPrism: 'M12 4 20 18H4zM1.5 13.5 8.5 11.5M15.6 10.6l6.9-2.6M16.4 12.6l6.1.9M16.8 14.6l5.7 3.4',
  gymBell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0',
});

/* ---------- Stations ---------- */
const GYM_STATIONS = [
  { id: 'breath', roman: 'I', name: 'Triangle Breathing', short: 'Breathing', icon: 'wind', mins: '1–2 min', color: 'var(--ethos)', stat: 'rounds breathed', blurb: 'Follow a light around three sides of breath to steady your nerves before you speak.' },
  { id: 'warmup', roman: 'II', name: 'Vocal Warm-up', short: 'Warm-up', icon: 'mic', mins: '3 min', color: 'var(--gold)', stat: 'warm-ups done', blurb: 'Six guided exercises in the mirror: posture, lips, pitch, jaw, resonance and projection.' },
  { id: 'twisters', roman: 'III', name: 'Tongue Twisters', short: 'Twisters', icon: 'repeat', mins: '2 min', color: 'var(--logos)', stat: 'clean rounds', blurb: 'Say each word as it lights up. Stay clean to unlock faster tempos.' },
  { id: 'impromptu', roman: 'IV', name: 'Impromptu Roulette', short: 'Roulette', icon: 'gymWheel', mins: '3 min', color: 'var(--pathos)', stat: 'impromptus spoken', blurb: 'Spin for a topic, think for thirty seconds, then take the floor.' },
  { id: 'lab', roman: 'V', name: 'Device Lab', short: 'Device Lab', icon: 'gymPrism', mins: '2 min', color: 'var(--violet)', stat: 'lines crafted', blurb: 'Turn a plain sentence into one that lands, with a classic rhetorical device.' },
];
const gymStation = (id) => GYM_STATIONS.find((s) => s.id === id) || GYM_STATIONS[0];
const gymNextStation = (id) => { const i = GYM_STATIONS.findIndex((s) => s.id === id); return GYM_STATIONS[(i + 1) % GYM_STATIONS.length]; };

/* ---------- I. Breathing ---------- */
const GYM_BREATH_PRESETS = [
  { id: 'even', name: 'Even', phases: [4, 4, 4], note: 'Equal sides. Simple and steady, a good first try.' },
  { id: 'settle', name: 'Settle', phases: [4, 2, 6], note: 'A longer exhale than inhale, which can slow your heart rate.' },
  { id: 'deep', name: 'Deep calm', phases: [4, 7, 8], note: 'The classic 4-7-8. Slow, deep and very calming.' },
];
const GYM_BREATH_CUES = [
  { word: 'Breathe in', sub: 'through your nose', color: 'var(--stage-ethos)' },
  { word: 'Hold', sub: 'soft shoulders, still throat', color: 'var(--stage-logos)' },
  { word: 'Breathe out', sub: 'slowly, through your mouth', color: 'var(--stage-pathos)' },
];
const GYM_BREATH_LEAD = 3;
/* Inverted triangle: rise up the left side, hold across the top, fall down the right. */
const GYM_TRI = [[200, 330], [46, 64], [354, 64]];
const GYM_TRI_C = [200, (330 + 64 + 64) / 3];

/* ---------- II. Vocal warm-up ---------- */
const GYM_WARMUP = [
  { id: 'posture', title: 'Posture check', how: ['Stand with your feet hip-width apart and your knees soft.', 'Let your shoulders drop away from your ears.', 'Imagine a thread lifting the crown of your head.'], feel: 'You should feel tall and loose, with nothing locked.', say: 'Stand tall. Feet apart, knees soft. Let your shoulders drop, and imagine a thread lifting the top of your head.' },
  { id: 'trills', title: 'Lip trills', how: ['Close your lips loosely and blow air through them so they flutter.', 'Slide the sound up and down, like a motorboat changing gear.', 'If your lips stick, press a fingertip into each cheek.'], feel: 'A tickle on your lips means your breath is doing the work.', say: 'Blow air through loose lips so they flutter, like a motorboat. Slide the sound up and down.' },
  { id: 'siren', title: 'Humming siren', how: ['Hum on “mmm” at your lowest comfortable note.', 'Glide slowly up to your highest note, then back down.', 'Keep the glide smooth, with no jumps or breaks.'], feel: 'The buzz should travel from your chest up into your face.', say: 'Hum from your lowest note, glide slowly up to your highest, and back down, like a siren.' },
  { id: 'jaw', title: 'Jaw release', how: ['Rest your palms on your cheeks and massage slowly downwards.', 'Let your jaw hang open, heavy and relaxed.', 'Say “yah, yah, yah” with a loose, floppy jaw.'], feel: 'A loose jaw makes room for a fuller sound.', say: 'Palms on your cheeks. Massage downwards and let your jaw hang open. Say yah, yah, yah.' },
  { id: 'resonance', title: 'Resonance', how: ['Say “mum, mum, mum” and feel the buzz on your lips.', 'Then chant “mee, may, mah, moh, moo” on one note.', 'Aim the sound at the front of your face.'], feel: 'A forward buzz carries further without extra effort.', say: 'Say mum, mum, mum. Then mee, may, mah, moh, moo, on one note. Feel the buzz at the front of your face.' },
  { id: 'project', title: 'Projection count', how: ['Count from one to ten out loud.', 'Get a little louder on each number, powered from your belly.', 'Send “ten” to the back wall of the room.'], feel: 'Loud and relaxed is the goal. Ease off if your throat tightens.', say: 'Count from one to ten, a little louder each time, and send ten to the back wall.' },
];

/* ---------- III. Tongue twisters (traditional) ---------- */
const GYM_TIERS = [
  { id: 0, name: 'Warm', desc: 'Short and friendly' },
  { id: 1, name: 'Steady', desc: 'Classic workouts' },
  { id: 2, name: 'Fierce', desc: 'For nimble tongues' },
];
const GYM_TWISTERS = [
  { id: 't01', tier: 0, focus: 'R · L', text: 'Red lorry, yellow lorry.' },
  { id: 't02', tier: 0, focus: 'T · B', text: 'Toy boat, toy boat, toy boat.' },
  { id: 't03', tier: 0, focus: 'N · Y', text: 'Unique New York, unique New York, you know you need unique New York.' },
  { id: 't04', tier: 0, focus: 'R · L', text: 'Red leather, yellow leather.' },
  { id: 't05', tier: 0, focus: 'G · B · D', text: 'Good blood, bad blood.' },
  { id: 't06', tier: 0, focus: 'W · CH', text: 'Which witch is which?' },
  { id: 't07', tier: 0, focus: 'P · K', text: 'A proper copper coffee pot.' },
  { id: 't08', tier: 0, focus: 'F · SH', text: 'Fresh fried fish, fish fresh fried.' },
  { id: 't09', tier: 0, focus: 'L · V', text: 'Eleven benevolent elephants.' },
  { id: 't10', tier: 0, focus: 'R · L', text: 'Truly rural, truly rural.' },
  { id: 't11', tier: 1, focus: 'S · SH', text: 'She sells seashells by the seashore.' },
  { id: 't12', tier: 1, focus: 'P · K', text: 'Peter Piper picked a peck of pickled peppers.' },
  { id: 't13', tier: 1, focus: 'W · CH', text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?' },
  { id: 't14', tier: 1, focus: 'B · G', text: 'A big black bug bit a big black bear.' },
  { id: 't15', tier: 1, focus: 'S · SH', text: 'I saw Susie sitting in a shoeshine shop.' },
  { id: 't16', tier: 1, focus: 'B · R', text: 'Rubber baby buggy bumpers.' },
  { id: 't17', tier: 1, focus: 'R', text: 'Round the rugged rock the ragged rascal ran.' },
  { id: 't18', tier: 1, focus: 'S · L', text: 'Six slippery snails slid slowly seaward.' },
  { id: 't19', tier: 1, focus: 'F · T · D', text: 'Fred fed Ted bread, and Ted fed Fred bread.' },
  { id: 't20', tier: 1, focus: 'L · TH · W', text: 'Lesser leather never weathered wetter weather better.' },
  { id: 't21', tier: 2, focus: 'S · SH · K', text: 'The sixth sick sheikh’s sixth sheep’s sick.' },
  { id: 't22', tier: 2, focus: 'B · T', text: 'Betty Botter bought some butter, but she said the butter’s bitter.' },
  { id: 't23', tier: 2, focus: 'M · N · J', text: 'Imagine an imaginary menagerie manager managing an imaginary menagerie.' },
  { id: 't24', tier: 2, focus: 'B · R', text: 'Brisk brave brigadiers brandished broad bright blades.' },
  { id: 't25', tier: 2, focus: 'W · CH', text: 'If two witches were watching two watches, which witch would watch which watch?' },
  { id: 't26', tier: 2, focus: 'K · N', text: 'Can you can a can as a canner can can a can?' },
  { id: 't27', tier: 2, focus: 'Z · W', text: 'Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn’t fuzzy, was he?' },
  { id: 't28', tier: 2, focus: 'TH', text: 'The thirty-three thieves thought that they thrilled the throne throughout Thursday.' },
  { id: 't29', tier: 2, focus: 'M · N', text: 'Many an anemone sees an enemy anemone.' },
  { id: 't30', tier: 2, focus: 'S · W', text: 'Six sleek swans swam swiftly southwards.' },
  { id: 't31', tier: 2, focus: 'R · SW · CH', text: 'Irish wristwatch, Swiss wristwatch.' },
  { id: 't32', tier: 2, focus: 'V · L', text: 'Seventy-seven benevolent elephants.' },
];
const GYM_PACES = [
  { id: 'slow', name: 'Slow', sps: 2.5 },
  { id: 'steady', name: 'Steady', sps: 3.5 },
  { id: 'brisk', name: 'Brisk', sps: 4.5 },
  { id: 'quick', name: 'Quick', sps: 5.5 },
  { id: 'blaze', name: 'Blazing', sps: 6.5 },
];
const GYM_TW_REPS = 3;
const GYM_TW_STREAK = 2;
const GYM_REP_GAP_SYL = 2;
const gymWpm = (sps) => Math.round((sps * 60) / 1.45);
const gymVoiceRate = (sps) => clamp(sps / 3.6, 0.6, 1.8);

/* ---------- IV. Impromptu roulette ---------- */
const GYM_CATS = [
  { id: 'story', name: 'Story', c: 'var(--gym-w0)', structs: ['scr', 'ppf'] },
  { id: 'opinion', name: 'Opinion', c: 'var(--gym-w1)', structs: ['prep', 'wsn'] },
  { id: 'tribute', name: 'Tribute', c: 'var(--gym-w2)', structs: ['ppf', 'scr'] },
  { id: 'explain', name: 'Explain', c: 'var(--gym-w3)', structs: ['wsn', 'ppf', 'prep'] },
  { id: 'persuade', name: 'Persuade', c: 'var(--gym-w4)', structs: ['psb', 'prep'] },
  { id: 'future', name: 'Future', c: 'var(--gym-w5)', structs: ['ppf', 'wsn'] },
  { id: 'absurd', name: 'Absurd', c: 'var(--gym-w6)', structs: ['prep', 'scr', 'psb'] },
  { id: 'pitch', name: 'Pitch', c: 'var(--gym-w7)', structs: ['psb', 'prep'] },
  { id: 'toast', name: 'Toast', c: 'var(--gym-w8)', structs: ['ppf', 'scr'] },
  { id: 'debate', name: 'Debate', c: 'var(--gym-w9)', structs: ['prep', 'psb'] },
];
const GYM_PROMPTS = {
  story: [
    'Tell us about a time a plan failed and what it taught you.',
    'Describe the best meal you have ever eaten and who you shared it with.',
    'Tell the story of a small kindness from a stranger that you still remember.',
    'Tell us about the first time you felt completely out of your depth.',
    'Describe a journey that took much longer than planned.',
    'Tell us about an object you own that has a story behind it.',
    'Tell the story of a rule you broke and whether it was worth it.',
    'Describe a moment when you changed your mind about someone.',
    'Tell us about a skill you learned the hard way.',
  ],
  opinion: [
    'Is it better to be early or exactly on time? Pick a side.',
    'Which invention of the last hundred years would you un-invent, and why?',
    'Should homework exist? Give us your verdict.',
    'What is the most overrated piece of advice people give?',
    'Is it ever right to lie to protect someone’s feelings?',
    'What should every city have that most cities lack?',
    'Are meetings a tool or a trap? Make your case.',
    'What is one habit everyone should drop this year?',
    'Is ambition a virtue or a vice?',
  ],
  tribute: [
    'Pay tribute to a teacher who changed how you think.',
    'Honor an everyday hero most people overlook.',
    'Give a short tribute to a place that shaped you.',
    'Thank a friend who showed up when it mattered.',
    'Celebrate an invention that makes your day easier.',
    'Pay tribute to the person who taught you to cook something.',
    'Honor a book that kept you company.',
    'Thank the people behind something you use every day.',
    'Celebrate a pet, past or present, as if it were a gala dinner.',
  ],
  explain: [
    'Explain how a rainbow forms to a curious eight-year-old.',
    'Explain why we have time zones.',
    'Explain how you would plan a trip for ten friends with ten different budgets.',
    'Explain the rules of a game you love to someone who has never played it.',
    'Explain how a seed becomes a tree.',
    'Explain why bread rises.',
    'Explain what makes a good password, with no jargon.',
    'Explain how you make a hard decision, step by step.',
    'Explain how you would teach someone to ride a bike.',
  ],
  persuade: [
    'Convince us that Tuesdays deserve a public holiday.',
    'Persuade us to take the stairs for the rest of the week.',
    'Convince a skeptical friend to try a food they think they hate.',
    'Persuade the room to read one more book this month.',
    'Convince us that every office needs a nap room.',
    'Persuade your town to plant a thousand trees.',
    'Convince us to put our phones in another room tonight.',
    'Persuade us that handwriting is still worth teaching.',
    'Convince a teenager to call their grandparents this weekend.',
  ],
  future: [
    'Describe an ordinary Tuesday in the year 2070.',
    'What will people in fifty years find strange about us?',
    'Pitch a school subject that should exist by 2040.',
    'Describe the job you will have in ten years, in detail.',
    'What will replace the smartphone?',
    'Give the welcome speech for the first town on Mars.',
    'What problem will your generation finally solve?',
    'Describe the perfect home of the future, room by room.',
    'It is ten years from today. What are you proud of?',
  ],
  absurd: [
    'You are a pigeon giving a keynote about city life.',
    'Defend the honor of the humble paperclip.',
    'Announce the opening of the world’s first museum of socks.',
    'Explain to visiting aliens why humans clap with their hands.',
    'You are a toaster applying for a promotion.',
    'Give the safety briefing for a flight on a dragon.',
    'Launch a campaign to make the moon a national park.',
    'You are the last slice of pizza. Plead your case.',
    'Introduce a new sport played entirely with umbrellas.',
  ],
  pitch: [
    'Pitch an app that solves a problem you had this week.',
    'Pitch a new ice cream flavor to a panel of investors.',
    'Pitch your hometown as a holiday destination.',
    'Pitch a club you would start at work or school.',
    'Pitch a product that makes mornings easier.',
    'Pitch a tiny business you could run from your kitchen.',
    'Pitch a festival that does not exist yet.',
    'Pitch yourself for a job you would love.',
    'Pitch a better way to stand in line.',
  ],
  toast: [
    'Raise a toast to the friends you have not met yet.',
    'Give a toast at your best friend’s wedding. Keep it kind.',
    'Toast a colleague who is leaving for a new adventure.',
    'Raise a glass to the worst holiday you ever had.',
    'Toast the end of a long, hard project.',
    'Give a toast for a grandparent’s ninetieth birthday.',
    'Raise a toast to Mondays.',
    'Toast a team that lost the final but played their hearts out.',
    'Give a toast to welcome new neighbors to the street.',
  ],
  debate: [
    'Cities should ban cars from their centers. Argue for or against.',
    'Schools should teach money skills before algebra. Take a side.',
    'A four-day work week should be the norm. For or against?',
    'Social media does more harm than good. Argue one side.',
    'Space exploration is worth the cost. Make your case.',
    'Voting should be compulsory. For or against?',
    'Zoos should be closed for good. Argue one side.',
    'Robots should do all household chores. Take a side.',
    'Tipping should be abolished. Make your case.',
  ],
};
const GYM_STRUCTS = {
  prep: { id: 'prep', name: 'PREP', parts: [{ n: 'Point', h: 'Say your view in one line.' }, { n: 'Reason', h: 'Give the main reason.' }, { n: 'Example', h: 'One concrete example or story.' }, { n: 'Point', h: 'Repeat your view, sharper.' }] },
  ppf: { id: 'ppf', name: 'Past · Present · Future', parts: [{ n: 'Past', h: 'Where it started.' }, { n: 'Present', h: 'Where it stands now.' }, { n: 'Future', h: 'Where it goes next.' }] },
  psb: { id: 'psb', name: 'Problem · Solution · Benefit', parts: [{ n: 'Problem', h: 'Name the pain.' }, { n: 'Solution', h: 'Offer the fix.' }, { n: 'Benefit', h: 'Show the payoff.' }] },
  wsn: { id: 'wsn', name: 'What · So what · Now what', parts: [{ n: 'What', h: 'What it is or what happened.' }, { n: 'So what', h: 'Why it matters.' }, { n: 'Now what', h: 'What we should do.' }] },
  scr: { id: 'scr', name: 'Situation · Complication · Resolution', parts: [{ n: 'Situation', h: 'Set the scene.' }, { n: 'Complication', h: 'What went wrong.' }, { n: 'Resolution', h: 'How it ended, and the lesson.' }] },
};
const GYM_REVIEW_DIMS = [
  { id: 'structure', name: 'Structure', ask: 'Did it have a clear shape?', c: 'var(--ethos)' },
  { id: 'clarity', name: 'Clarity', ask: 'Could a stranger follow it?', c: 'var(--logos)' },
  { id: 'confidence', name: 'Confidence', ask: 'Did you sound sure of yourself?', c: 'var(--pathos)' },
  { id: 'pace', name: 'Pace', ask: 'Steady, with real pauses?', c: 'var(--gold)' },
];
const GYM_RATE_WORDS = ['', 'Rough', 'Shaky', 'Okay', 'Good', 'Great'];
const GYM_REVIEW_TIPS = {
  structure: { praise: 'Your round had a shape the audience could follow.', tip: (s) => `Next spin, say your ${s.parts[0].n.toLowerCase()} in the very first sentence, then announce each part as you reach it.` },
  clarity: { praise: 'You kept it clear enough for a stranger to follow.', tip: () => 'Next spin, pick one example and stay with it. One vivid example beats three quick ones.' },
  confidence: { praise: 'You sounded like you meant it.', tip: () => 'Next spin, plant your feet, look at one spot, and finish your first sentence before you think about the second.' },
  pace: { praise: 'Your pace gave the ideas room to land.', tip: () => 'Next spin, pause for a full breath after your opening line and before your last one.' },
};

/* ---------- V. Device lab ---------- */
const GYM_DEVICES = {
  anaphora: { name: 'Anaphora', greek: 'ἀναφορά', def: 'Repeating the same opening words at the start of each clause or sentence.', recipe: 'Pick a strong phrase and start three short sentences with it.', checks: ['Do two or more clauses start with the same words?', 'Do the repeated words carry the main idea?'] },
  epistrophe: { name: 'Epistrophe', greek: 'ἐπιστροφή', def: 'Repeating the same word or words at the end of each clause.', recipe: 'End two or three clauses on the same word so it rings.', checks: ['Do your clauses end on the same word?', 'Is that word the one you want them to remember?'] },
  antithesis: { name: 'Antithesis', greek: 'ἀντίθεσις', def: 'Setting opposite ideas side by side in balanced phrases.', recipe: 'Find the two opposites, then give both halves the same grammar.', checks: ['Are the two halves opposites?', 'Do both halves have the same shape and length?'] },
  chiasmus: { name: 'Chiasmus', greek: 'χιασμός', def: 'Repeating ideas in reverse order: A then B, then B then A.', recipe: 'Write the first half, then swap its two key words in the second half.', checks: ['Do two key words appear twice?', 'Does their order flip in the second half?'] },
  tricolon: { name: 'Tricolon', greek: 'τρίκωλον', def: 'A series of three parallel words, phrases or clauses.', recipe: 'Say it in three beats with the same shape, and put the strongest last.', checks: ['Are there exactly three items?', 'Do they share the same grammatical shape?'] },
  question: { name: 'Rhetorical question', greek: 'ἐρώτημα', def: 'A question asked for effect, where the answer is already clear.', recipe: 'Turn your claim into a question the audience can only answer one way.', checks: ['Is it a question?', 'Is there only one sensible answer?'] },
  hypophora: { name: 'Hypophora', greek: 'ὑποφορά', def: 'Asking a question and then answering it yourself.', recipe: 'Ask the question your audience is thinking, then answer it in one line.', checks: ['Do you ask a real question?', 'Do you answer it straight away?'] },
  metaphor: { name: 'Metaphor', greek: 'μεταφορά', def: 'Describing one thing as if it were another, to make it vivid.', recipe: 'Find a picture that shares the feeling, and say it is that picture.', checks: ['Do you say one thing is another, with no “like” or “as”?', 'Can the audience see the picture?'] },
  simile: { name: 'Simile', greek: null, def: 'Comparing two things using “like” or “as”.', recipe: 'Finish the line “it was like…” with something concrete and surprising.', checks: ['Do you use “like” or “as”?', 'Is the comparison concrete and fresh?'] },
  alliteration: { name: 'Alliteration', greek: null, def: 'Starting nearby words with the same sound.', recipe: 'Choose a sound and find three strong words that begin with it.', checks: ['Do three nearby words start with the same sound?', 'Does it still sound natural out loud?'] },
  climax: { name: 'Climax', greek: 'κλῖμαξ', def: 'Arranging ideas in order of rising importance, step by step.', recipe: 'List your steps from small to big, and let the last one land hardest.', checks: ['Does each step get bigger?', 'Is the last step the strongest?'] },
  asyndeton: { name: 'Asyndeton', greek: 'ἀσύνδετον', def: 'Leaving out the conjunctions between items to make them fast and urgent.', recipe: 'Cut every “and”, keep the commas, and speed up.', checks: ['Have you removed the “and”s?', 'Does it feel faster?'] },
  polysyndeton: { name: 'Polysyndeton', greek: 'πολυσύνδετον', def: 'Repeating “and” or “or” between items to build weight.', recipe: 'Join every item with “and” so the list feels endless.', checks: ['Is every item joined by “and” or “or”?', 'Does the list feel heavier?'] },
  litotes: { name: 'Litotes', greek: 'λιτότης', def: 'Understating something by denying its opposite.', recipe: 'Say it is “no small thing” or “not bad at all” instead of praising it outright.', checks: ['Do you deny the opposite (“no small”, “not bad”)?', 'Does the understatement make it stronger?'] },
};
const GYM_LAB = [
  { id: 'l01', device: 'anaphora', plain: 'We need to fix the roads, the schools and the hospitals.', model: 'We will fix the roads. We will fix the schools. We will fix the hospitals.', marks: ['We will fix'] },
  { id: 'l02', device: 'anaphora', plain: 'This team kept going through late nights, setbacks and doubts.', model: 'Through every late night, this team delivered. Through every setback, this team adapted. Through every doubt, this team believed.', marks: ['Through every'] },
  { id: 'l03', device: 'anaphora', plain: 'My hope for you is that you stay curious and kind, and that you have courage.', model: 'May you stay curious. May you stay kind. May you stay brave.', marks: ['May you stay'] },
  { id: 'l04', device: 'epistrophe', plain: 'We should plan, build and run this project as a group.', model: 'We plan it together, we build it together, and we run it together.', marks: ['together'] },
  { id: 'l05', device: 'epistrophe', plain: 'We are responsible for the problem and for what happens next.', model: 'The problem is ours. The choice is ours. The future is ours.', marks: ['is ours'] },
  { id: 'l06', device: 'antithesis', plain: 'Talking about the problem is easy, but solving it is difficult.', model: 'Talk is cheap; change is expensive.', marks: ['Talk is cheap', 'change is expensive'] },
  { id: 'l07', device: 'antithesis', plain: 'We should focus on lasting health instead of quick wins.', model: 'Quick wins fill a quarter; lasting health fills a decade.', marks: ['Quick wins fill a quarter', 'lasting health fills a decade'] },
  { id: 'l08', device: 'antithesis', plain: 'We should make decisions with evidence and not only with opinions.', model: 'Opinions start the conversation; evidence ends it.', marks: ['Opinions start', 'evidence ends'] },
  { id: 'l09', device: 'chiasmus', plain: 'Our values should guide our ambitions, and ambition should not change our values.', model: 'Let our values shape our ambitions, never our ambitions shape our values.', marks: ['values', 'ambitions'] },
  { id: 'l10', device: 'chiasmus', plain: 'Practicing makes you more confident, and being confident makes you want to practice.', model: 'Practice builds confidence, and confidence builds practice.', marks: ['practice', 'confidence'] },
  { id: 'l11', device: 'chiasmus', plain: 'You should eat to stay alive instead of living for food.', model: 'Eat to live; do not live to eat.', marks: ['eat', 'live'] },
  { id: 'l12', device: 'tricolon', plain: 'The new plan will save money and will also be quicker.', model: 'The new plan is cheaper, faster and simpler.', marks: ['cheaper', 'faster', 'simpler'] },
  { id: 'l13', device: 'tricolon', plain: 'Our volunteers gave a lot of their time to help.', model: 'They gave their evenings, their weekends and their hearts.', marks: ['their evenings', 'their weekends', 'their hearts'] },
  { id: 'l14', device: 'tricolon', plain: 'Exercise is good for your body and your mind.', model: 'Exercise strengthens the body, steadies the mind and lifts the spirit.', marks: ['strengthens the body', 'steadies the mind', 'lifts the spirit'] },
  { id: 'l15', device: 'question', plain: 'Nobody wants to waste two hours a day in traffic.', model: 'Who among us wants to spend two hours a day staring at brake lights?', marks: ['Who among us'] },
  { id: 'l16', device: 'question', plain: 'We cannot keep ignoring this problem.', model: 'How many more years can we afford to look away?', marks: ['How many more years'] },
  { id: 'l17', device: 'hypophora', plain: 'Remote work makes people more productive because they lose less time commuting.', model: 'Why does remote work make us more productive? Because the hour we once lost to commuting now goes into the work.', marks: ['Why does remote work make us more productive?', 'Because'] },
  { id: 'l18', device: 'metaphor', plain: 'The company is in trouble and needs to change direction soon.', model: 'We are a ship heading for the rocks, and the wheel is still in our hands.', marks: ['a ship heading for the rocks', 'the wheel is still in our hands'] },
  { id: 'l19', device: 'metaphor', plain: 'Reading gives children new opportunities.', model: 'Every book is a door, and every child deserves a key.', marks: ['Every book is a door', 'every child deserves a key'] },
  { id: 'l20', device: 'simile', plain: 'His speech was very boring.', model: 'His speech moved like a queue at the post office.', marks: ['like a queue at the post office'] },
  { id: 'l21', device: 'simile', plain: 'The news spread quickly around the office.', model: 'The news ran through the office like a spark through dry grass.', marks: ['like a spark through dry grass'] },
  { id: 'l22', device: 'alliteration', plain: 'The product is quick and easy to use.', model: 'It’s simple, swift and seamless.', marks: ['simple', 'swift', 'seamless'] },
  { id: 'l23', device: 'alliteration', plain: 'The weather was cold and the wind was strong.', model: 'The wild winter wind whipped through the streets.', marks: ['wild', 'winter', 'wind', 'whipped'] },
  { id: 'l24', device: 'climax', plain: 'This idea could help our town and maybe the whole country.', model: 'This idea can change a street, then a town, then a whole country.', marks: ['a street', 'a town', 'a whole country'] },
  { id: 'l25', device: 'climax', plain: 'If you practice, you will get better at speaking.', model: 'Practice builds skill, skill builds confidence, and confidence builds a voice people follow.', marks: ['skill', 'confidence', 'a voice people follow'] },
  { id: 'l26', device: 'asyndeton', plain: 'We tested the idea, and then we learned from it, and then we made it better.', model: 'We tested, we learned, we improved.', marks: ['We tested', 'we learned', 'we improved'] },
  { id: 'l27', device: 'polysyndeton', plain: 'We packed food, water, tents and maps.', model: 'We packed food and water and tents and maps, and still we felt unready.', marks: ['and'] },
  { id: 'l28', device: 'litotes', plain: 'Winning the regional final is a big achievement.', model: 'Winning the regional final is no small achievement.', marks: ['no small'] },
  { id: 'l29', device: 'litotes', plain: 'Her first speech was quite good.', model: 'Her first speech was not bad at all.', marks: ['not bad at all'] },
];

/* ================================================================
   Pure logic (tested in tests/gym.test.js)
   ================================================================ */
const gymEase = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1));
const gymLerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* Where are we in the breath? phases = [inhale, hold, exhale] seconds. */
function gymBreathPhase(elapsed, phases, rounds) {
  const ph = (phases || [4, 4, 4]).map((x) => Math.max(0, Number(x) || 0));
  const cycle = ph[0] + ph[1] + ph[2] || 1;
  const n = Math.max(1, rounds | 0);
  const total = cycle * n;
  const t = Math.max(0, Number(elapsed) || 0);
  if (t >= total) return { round: n - 1, idx: 2, frac: 1, left: 0, done: true, progress: 1, cycle, total };
  const round = Math.floor(t / cycle);
  let r = t - round * cycle;
  let idx = 0;
  while (idx < 2 && r >= ph[idx]) { r -= ph[idx]; idx++; }
  const len = ph[idx] || 1;
  return { round, idx, frac: clamp(r / len, 0, 1), left: Math.max(0, len - r), done: false, progress: t / total, cycle, total };
}
/* How full of air the lungs are, 0..1, for the swelling fill. */
function gymBreathLevel(ph) {
  if (!ph || ph.done) return 1;
  return ph.idx === 0 ? gymEase(ph.frac) : ph.idx === 1 ? 1 : 1 - gymEase(ph.frac);
}
/* Orb position on the inverted triangle. */
function gymOrbAt(ph) {
  if (!ph) return GYM_TRI[0];
  if (ph.done) return GYM_TRI[0];
  const a = GYM_TRI[ph.idx], b = GYM_TRI[(ph.idx + 1) % 3];
  return gymLerp(a, b, ph.idx === 1 ? ph.frac : gymEase(ph.frac) * 0.85 + ph.frac * 0.15);
}

/* Wheel: angle (deg, clockwise) of the wheel; the pointer is fixed at the top. */
function gymWheelIndex(angle, n) {
  const seg = 360 / n;
  const pos = ((-(Number(angle) || 0) % 360) + 360) % 360;
  return Math.min(n - 1, Math.floor(pos / seg + 1e-9));
}
/* Final angle that lands the pointer inside segment `index`, after at least `turns` full spins. */
function gymWheelLanding(from, index, n, rnd = Math.random, turns = 5) {
  const seg = 360 / n;
  const within = (0.18 + rnd() * 0.64) * seg;
  const target = -(index * seg + within);
  const base = from + 360 * turns;
  const k = Math.ceil((base - target) / 360);
  return target + 360 * k;
}
function gymArcPath(a0, a1, r) {
  const p = (a) => { const rad = (a * Math.PI) / 180; return [(r * Math.sin(rad)).toFixed(2), (-r * Math.cos(rad)).toFixed(2)]; };
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M0 0L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
}

/* Tongue twister timing: each word lasts its syllables / syllables-per-second. */
function gymSyllables(word) {
  const n = String(word || '').toLowerCase().split(/[-–]/).reduce((sum, part) => {
    let w = part.replace(/[^a-z]/g, '');
    if (!w) return sum;
    if (w.length <= 3) return sum + 1;
    w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return sum + Math.max(1, m ? m.length : 1);
  }, 0);
  return Math.max(1, n);
}
function gymTwisterTiming(text, sps, reps = GYM_TW_REPS) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const rate = Math.max(0.5, Number(sps) || 3);
  const items = [];
  let t = 0;
  for (let r = 0; r < reps; r++) {
    words.forEach((w, i) => {
      const syl = gymSyllables(w);
      const dur = Math.max(0.16, syl / rate);
      let rest = 0;
      if (i < words.length - 1) {
        if (/[,;:]$/.test(w)) rest = 0.6 / rate;
        else if (/[.!?]$/.test(w)) rest = 1 / rate;
      }
      items.push({ w, i, rep: r, syl, start: t, dur });
      t += dur + rest;
    });
    if (r < reps - 1 && words.length) t += GYM_REP_GAP_SYL / rate;
  }
  return { items, total: t, words: words.length, reps };
}
/* Index of the word lit at time t; -1 before the start, items.length once finished. */
function gymWordAt(timing, t) {
  const it = timing.items;
  if (!it.length || t < 0) return -1;
  if (t >= timing.total) return it.length;
  let lo = 0, hi = it.length - 1, ans = 0;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (it[mid].start <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}

/* Prompt and structure draws. */
function gymPickPrompt(catId, rnd = Math.random, used = []) {
  const bank = GYM_PROMPTS[catId] || [];
  const fresh = bank.filter((q) => !used.includes(q));
  const pool = fresh.length ? fresh : bank;
  return pool.length ? pool[Math.floor(rnd() * pool.length) % pool.length] : '';
}
function gymPickStruct(catId, rnd = Math.random, not) {
  const cat = GYM_CATS.find((c) => c.id === catId);
  const ids = cat ? cat.structs : Object.keys(GYM_STRUCTS);
  const opts = ids.filter((i) => i !== not);
  const pool = opts.length ? opts : Object.keys(GYM_STRUCTS).filter((i) => i !== not);
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}
/* Pacing cue while speaking. */
function gymSpeakCue(left, total, struct) {
  const s = struct || GYM_STRUCTS.prep;
  const frac = clamp(1 - left / total, 0, 1);
  const closeAt = Math.max(10, Math.round(total * 0.2));
  if (left <= 0) return { key: 'time', text: 'Time. Finish your sentence and land it.' };
  if (left <= closeAt) return { key: 'close', text: 'Start your close. Bring it back to your point.' };
  if (frac >= 0.5 && frac < 0.62) return { key: 'half', text: 'Halfway. Move to your next part.' };
  if (frac < 0.1) return { key: 'open', text: `Open with your ${s.parts[0].n.toLowerCase()}. ${s.parts[0].h}` };
  const pi = Math.min(s.parts.length - 1, Math.floor(frac * s.parts.length));
  return { key: 'part' + pi, text: `${s.parts[pi].n}: ${s.parts[pi].h}` };
}
/* Offline coach notes, built from the speaker's own self-ratings. */
function gymReviewFallback(ratings, notes, struct) {
  const r = ratings || {};
  const dims = GYM_REVIEW_DIMS.map((d) => d.id);
  const v = (k) => clamp(Number(r[k]) || 3, 1, 5);
  const sorted = dims.slice().sort((a, b) => v(a) - v(b));
  const low = sorted[0], high = sorted[sorted.length - 1];
  const avg = mean(dims.map(v));
  const s = struct || GYM_STRUCTS.prep;
  const nWords = wordsOf(notes).length;
  const verdict = avg >= 4.25 ? 'You rated this a strong round. Bank it and spin again.' : avg >= 3 ? 'You rated this a solid round, with one clear thing to sharpen.' : 'A brave round. Pick one thing below and try it on the next spin.';
  const shape = s.parts.map((p) => p.n).join(', ');
  const structure = nWords >= 4
    ? `Check your notes against ${s.name}: ${shape}. Mark which line did each job. A missing part is your first fix.`
    : `Your scaffold was ${s.name}: ${shape}. Next time, jot one line per part straight after you finish.`;
  return {
    offline: true,
    verdict,
    structure,
    worked: v(high) >= 4 ? GYM_REVIEW_TIPS[high].praise : 'You finished the round. The next one gets easier.',
    next: GYM_REVIEW_TIPS[low].tip(s),
    opener: '',
  };
}
const gymStr = (v, max = 420) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max));
function gymNormFeedback(raw) {
  if (!raw || typeof raw !== 'object') throw { code: 'invalid_json' };
  const out = { verdict: gymStr(raw.verdict, 160), structure: gymStr(raw.structure), worked: gymStr(raw.worked || raw.strength), next: gymStr(raw.next), opener: gymStr(raw.opener, 200) };
  if (!out.verdict && !out.worked && !out.next) throw { code: 'invalid_json' };
  return out;
}
function gymNormLab(raw) {
  if (!raw || typeof raw !== 'object') throw { code: 'invalid_json' };
  const n = Number(raw.score);
  const out = { uses: raw.uses === true || raw.uses === 'true', score: clamp(Math.round(isFinite(n) ? n : 60), 0, 100), verdict: gymStr(raw.verdict, 160), worked: gymStr(raw.worked), next: gymStr(raw.next), example: gymStr(raw.example, 220) };
  if (!out.verdict && !out.worked && !out.next) throw { code: 'invalid_json' };
  return out;
}
function gymImpPrompt({ prompt, cat, struct, secs, ratings, notes }) {
  const r = ratings || {};
  return `You are Rostra, a warm and exact public-speaking coach. A speaker just gave a ${secs}-second impromptu talk out loud. You only have their own notes on what they said.
Topic (${cat}): ${prompt}
Suggested structure: ${struct.name} (${struct.parts.map((p) => p.n).join(', ')})
Their self-ratings out of 5: structure ${r.structure}, clarity ${r.clarity}, confidence ${r.confidence}, pace ${r.pace}
Their notes:
"""
${String(notes || '').slice(0, 2500)}
"""
Give short, specific feedback on the content and structure in their notes. Quote their words where you can. Do not write the speech for them. Plain words, second person, at most two sentences per field.
Reply with only JSON: {"verdict": "one short line", "structure": "how well the notes follow the structure, naming the strongest or missing part", "worked": "one thing that works, quoting them", "next": "one specific thing to try on the next spin", "opener": "a sharper first sentence in their voice, max 20 words"}`;
}
function gymLabPrompt(item, text) {
  const d = GYM_DEVICES[item.device];
  return `You are Rostra, a rhetoric coach judging one short practice line.
Device: ${d.name}. ${d.def}
Original plain sentence: "${item.plain}"
The speaker's rewrite:
"""
${String(text || '').slice(0, 800)}
"""
Judge whether the rewrite uses ${d.name} clearly and keeps the original meaning. Be warm, exact and brief. Quote their words. Do not rewrite their whole line.
Reply with only JSON: {"uses": true, "score": 0, "verdict": "one short line", "worked": "what works, quoting them", "next": "one specific improvement", "example": "one improved version in their own voice, max 25 words"}
score is 0-100 where 70 is a solid attempt.`;
}

/* Highlight device fragments in a model line. Returns [{t, k}] with k = mark index or -1. */
function gymSegments(text, marks) {
  const src = String(text || '');
  const lower = src.toLowerCase();
  const isW = (ch) => !!ch && /[a-z0-9]/.test(ch);
  const hits = [];
  (marks || []).forEach((m, k) => {
    const ml = String(m || '').toLowerCase();
    if (!ml) return;
    let from = 0;
    while ((from = lower.indexOf(ml, from)) !== -1) {
      const okL = !isW(ml[0]) || !isW(lower[from - 1]);
      const okR = !isW(ml[ml.length - 1]) || !isW(lower[from + ml.length]);
      if (okL && okR) hits.push({ s: from, e: from + ml.length, k });
      from += 1;
    }
  });
  hits.sort((a, b) => a.s - b.s || b.e - b.s - (a.e - a.s));
  const out = [];
  let pos = 0;
  for (const h of hits) {
    if (h.s < pos) continue;
    if (h.s > pos) out.push({ t: src.slice(pos, h.s), k: -1 });
    out.push({ t: src.slice(h.s, h.e), k: h.k });
    pos = h.e;
  }
  if (pos < src.length) out.push({ t: src.slice(pos), k: -1 });
  return out;
}

/* Offline quick check: does the rewrite show the device's fingerprint? ok: true | false | null (judge it yourself). */
const GYM_SMALL = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'is', 'it', 'its', 'for', 'we', 'you', 'i', 'our', 'my', 'your', 'be', 'but', 'with', 'that', 'this', 'are', 'was', 'as', 'by']);
function gymClauses(t) {
  return String(t).split(/[.;:!?]+|,\s*(?:and|or|but)?\s*|\s+(?:and|but)\s+/i).map((s) => s.trim()).filter((s) => wordsOf(s).length > 0);
}
function gymDeviceCheck(dev, text, plain) {
  const t = String(text || '').trim();
  const words = wordsOf(t);
  const lw = words.map((w) => w.toLowerCase().replace(/[’']/g, ''));
  if (words.length < 3) return { ok: null, note: 'Write a full line first, then check it.' };
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (plain && norm(t) === norm(plain)) return { ok: false, note: 'That matches the original. Change the shape of the sentence.' };
  const clauses = gymClauses(t);
  const commas = (t.match(/,/g) || []).length;
  const count = (re) => (t.match(re) || []).length;
  const repeated = (arr) => { const c = Object.create(null); let best = null; arr.forEach((x) => { if (!x) return; c[x] = (c[x] || 0) + 1; if (!best || c[x] > c[best]) best = x; }); return best ? { w: best, n: c[best] } : { w: '', n: 0 }; };
  switch (dev) {
    case 'anaphora': {
      const heads = repeated(clauses.map((c) => wordsOf(c).slice(0, wordsOf(c).length > 2 ? 2 : 1).join(' ').toLowerCase()));
      const firsts = repeated(clauses.map((c) => (wordsOf(c)[0] || '').toLowerCase()));
      if (heads.n >= 2) return { ok: true, note: `${heads.n} clauses open with “${heads.w}”.` };
      if (firsts.n >= 2 && !GYM_SMALL.has(firsts.w)) return { ok: true, note: `${firsts.n} clauses open with “${firsts.w}”.` };
      return { ok: false, note: 'Start at least two clauses with the same words.' };
    }
    case 'epistrophe': {
      const tails = repeated(clauses.map((c) => { const w = wordsOf(c); return (w[w.length - 1] || '').toLowerCase(); }));
      if (tails.n >= 2) return { ok: true, note: `${tails.n} clauses end on “${tails.w}”.` };
      return { ok: false, note: 'End at least two clauses on the same word.' };
    }
    case 'tricolon': {
      if (clauses.length === 3 || commas >= 2) return { ok: true, note: 'Three beats. Check that they share a shape.' };
      return { ok: false, note: 'Look for three items or clauses in a row.' };
    }
    case 'question':
      return /\?/.test(t) ? { ok: true, note: 'It’s a question. Make sure the answer is obvious.' } : { ok: false, note: 'Turn the claim into a question.' };
    case 'hypophora':
      return /\?\s*\S/.test(t) ? { ok: true, note: 'You ask, then you answer.' } : /\?/.test(t) ? { ok: false, note: 'Now answer your own question in the next line.' } : { ok: false, note: 'Ask the question first, then answer it.' };
    case 'alliteration': {
      const content = lw.filter((w) => !GYM_SMALL.has(w));
      let best = { ch: '', n: 0 };
      for (let i = 0; i < content.length; i++) {
        const ch = content[i][0];
        const n = content.slice(i, i + 5).filter((w) => w[0] === ch).length;
        if (n > best.n) best = { ch, n };
      }
      return best.n >= 3 ? { ok: true, note: `${best.n} nearby words start with “${best.ch}”.` } : { ok: false, note: 'Find three nearby words that start with the same sound.' };
    }
    case 'asyndeton':
      if (/\b(and|or)\b/i.test(t)) return { ok: false, note: 'Cut the “and” and keep the commas.' };
      return commas >= 2 ? { ok: true, note: 'No conjunctions, just commas. Fast and urgent.' } : { ok: false, note: 'List at least three items with commas only.' };
    case 'polysyndeton': {
      const n = count(/\b(and|or|nor)\b/gi);
      return n >= 3 ? { ok: true, note: `“And” ${n} times. The list piles up.` } : { ok: false, note: 'Join each item with “and”, at least three times.' };
    }
    case 'chiasmus': {
      const pos = Object.create(null);
      lw.forEach((w, i) => { if (w.length > 2 && !GYM_SMALL.has(w)) (pos[w] = pos[w] || []).push(i); });
      const twice = Object.keys(pos).filter((w) => pos[w].length >= 2);
      for (const a of twice) for (const b of twice) {
        if (a === b) continue;
        const [a1, a2] = [pos[a][0], pos[a][pos[a].length - 1]], [b1, b2] = [pos[b][0], pos[b][pos[b].length - 1]];
        if (a1 < b1 && b2 < a2 && b1 < b2) return { ok: true, note: `“${a} … ${b}” flips to “${b} … ${a}”.` };
      }
      return { ok: false, note: 'Use two key words twice, and flip their order the second time.' };
    }
    case 'simile':
      return /\blike\b|\bas\s+\w+\s+as\b/i.test(t) ? { ok: true, note: 'There’s your “like” or “as”.' } : { ok: false, note: 'Add a comparison with “like” or “as”.' };
    case 'metaphor':
      if (/\blike\b|\bas\s+\w+\s+as\b/i.test(t)) return { ok: false, note: 'That reads like a simile. Drop “like” and say it is the thing.' };
      return { ok: null, note: 'No “like” or “as”, good. Now ask: can they see the picture?' };
    case 'litotes':
      return /\b(no|not|never|hardly|nothing)\s+(\w+\s+)?(small|bad|easy|minor|little|short|unusual|un\w+|less|shabby|trivial)\b/i.test(t) ? { ok: true, note: 'You deny the opposite. Understated and strong.' } : { ok: false, note: 'Try “no small…” or “not bad…”.' };
    case 'antithesis':
      if (/;|\bnot\b|\bbut\b|\byet\b|\bnever\b|\binstead\b|\bwhile\b/i.test(t) && clauses.length >= 2) return { ok: null, note: 'Two halves in tension. Check they mirror each other.' };
      return { ok: false, note: 'Put two opposite ideas side by side.' };
    case 'climax':
      if (count(/\bthen\b/gi) >= 2 || clauses.length >= 3) return { ok: null, note: 'Three or more steps. Check that each one is bigger.' };
      return { ok: false, note: 'Build at least three steps, small to large.' };
    default:
      return { ok: null, note: 'Judge it against the recipe.' };
  }
}

/* ---------- Profile helpers (call inside Store.act) ---------- */
function gymEnsure(p) {
  const g = p.gym && typeof p.gym === 'object' ? p.gym : {};
  p.gym = g;
  if (!g.tw || typeof g.tw !== 'object') g.tw = {};
  if (!Array.isArray(g.imps)) g.imps = [];
  g.warmups = g.warmups || 0;
  g.crafted = g.crafted || 0;
  const today = dayKey();
  if (g.day !== today || !g.done || typeof g.done !== 'object') { g.day = today; g.done = {}; }
  return g;
}
function gymMark(p, id) { const g = gymEnsure(p); g.done[id] = (g.done[id] || 0) + 1; return g; }
function gymRead(p) {
  const g = (p && p.gym) || {};
  return { tw: g.tw || {}, imps: Array.isArray(g.imps) ? g.imps : [], warmups: g.warmups || 0, crafted: g.crafted || 0, done: g.day === dayKey() && g.done ? g.done : {} };
}

/* ---------- Sound: soft cues (all optional, all respect the mute) ---------- */
const GymSfx = {
  t(f, s, d, type, g) { if (!Sound.enabled) return; try { Sound.tone(f, s, d, type, g); } catch (e) { /* audio is optional */ } },
  tick() { this.t(2600, 0, 0.016, 'square', 0.01); this.t(1300, 0, 0.03, 'triangle', 0.03); },
  breath(idx) {
    if (idx === 0) { this.t(392, 0, 1.6, 'sine', 0.03); this.t(587.33, 0.16, 1.8, 'sine', 0.022); }
    else if (idx === 1) { this.t(659.25, 0, 2.2, 'sine', 0.018); this.t(987.77, 0.02, 2.2, 'sine', 0.007); }
    else { this.t(587.33, 0, 1.6, 'sine', 0.026); this.t(392, 0.16, 2.2, 'sine', 0.022); }
  },
  bowl() { [[220, 3.6, 0.034], [440.6, 3, 0.02], [661.5, 2.4, 0.012], [884.4, 1.8, 0.008]].forEach(([f, d, g]) => this.t(f, 0, d, 'sine', g)); },
  beat(accent) { this.t(accent ? 1568 : 1046.5, 0, 0.06, 'triangle', accent ? 0.04 : 0.028); },
  step() { this.t(783.99, 0, 0.5, 'sine', 0.04); this.t(1174.66, 0.08, 0.7, 'sine', 0.03); },
  land() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.t(f, i * 0.07, 0.5, 'triangle', 0.045)); this.t(1567.98, 0.32, 1, 'sine', 0.035); },
  unlock() { [659.25, 830.61, 987.77, 1318.51].forEach((f, i) => this.t(f, i * 0.06, 0.45, 'triangle', 0.04)); },
  soft() { this.t(880, 0, 0.7, 'sine', 0.03); },
  bell() { this.t(1318.51, 0, 1.3, 'sine', 0.04); this.t(659.25, 0, 1.5, 'sine', 0.03); },
  stumble() { this.t(311.13, 0, 0.25, 'triangle', 0.03); this.t(261.63, 0.1, 0.35, 'triangle', 0.03); },
  shimmer() { [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => this.t(f, i * 0.05, 0.6, 'sine', 0.022)); },
  clap(strength) { if (!Sound.enabled) return; try { Sound.applause(strength); } catch (e) { /* optional */ } },
  /* A soft surf of filtered noise that swells with the breath. */
  pad: {
    nodes: null,
    start() {
      if (!Sound.enabled || this.nodes) return;
      const c = Sound.ensure && Sound.ensure();
      if (!c) return;
      try {
        const len = Math.floor(c.sampleRate * 3);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
        const fade = Math.floor(c.sampleRate * 0.25);
        for (let i = 0; i < fade; i++) { const k = i / fade; d[i] *= k; d[len - 1 - i] *= k; }
        const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 280;
        const g = c.createGain(); g.gain.value = 0.0001;
        src.connect(f); f.connect(g); g.connect(c.destination); src.start();
        this.nodes = { c, src, f, g };
      } catch (e) { this.nodes = null; }
    },
    set(level) {
      const n = this.nodes; if (!n) return;
      try { const t = n.c.currentTime; n.g.gain.setTargetAtTime(0.01 + level * 0.05, t, 0.25); n.f.frequency.setTargetAtTime(240 + level * 900, t, 0.3); } catch (e) { /* ignore */ }
    },
    stop() {
      const n = this.nodes; if (!n) return;
      this.nodes = null;
      try { const t = n.c.currentTime; n.g.gain.setTargetAtTime(0.0001, t, 0.2); n.src.stop(t + 1); } catch (e) { /* ignore */ }
    },
  },
};
const gymBurstAt = (el, count = 40, power = 0.6) => {
  try { const b = el && el.getBoundingClientRect(); if (b && b.width) celebrate({ x: b.left + b.width / 2, y: b.top + b.height / 2, count, power }); else celebrate({ count, power }); } catch (e) { /* decorative */ }
};

/* ================================================================
   Shared UI
   ================================================================ */
function GymHead({ id, title, lead, children }) {
  const st = gymStation(id);
  return html`<header className=${'gym-head gym-head-' + id} style=${{ '--sc': st.color }}>
    <button className="btn btn-sm gym-back" onClick=${() => go('gym')}><${Icon} name="arrowL" size=${16} />Gym</button>
    <div className="gym-head-row">
      <span className="gym-head-num" aria-hidden="true">${st.roman}</span>
      <div className="gym-head-text">
        <div className="eyebrow">Station ${st.roman} · ${st.short}</div>
        <h1>${title}</h1>
        ${lead ? html`<p className="lead">${lead}</p>` : null}
      </div>
      ${children}
    </div>
  </header>`;
}
function GymLaurel({ size = 92 }) {
  return html`<svg className="gym-laurel" width=${size} height=${size} viewBox="0 0 72 72" aria-hidden="true">
    ${laurelLeaves(36, 38, 27, 6, 5.2, 2.3, 'var(--gold)')}
    <path d="M36 22 47 41H25z" className="gym-laurel-tri" />
    <circle cx="36" cy="22" r="3" style=${{ fill: 'var(--ethos)' }} /><circle cx="25" cy="41" r="3" style=${{ fill: 'var(--pathos)' }} /><circle cx="47" cy="41" r="3" style=${{ fill: 'var(--logos)' }} />
  </svg>`;
}
function GymFinish({ id, xp, title, children, onAgain, again = 'Go again' }) {
  const nx = gymNextStation(id);
  return html`<div className="gym-finish" role="status">
    <${GymLaurel} />
    <h2>${title}</h2>
    ${children}
    ${xp ? html`<span className="xp-earned"><${Icon} name="bolt" size=${16} />+${xp} XP</span>` : null}
    <div className="gym-finish-actions">
      ${onAgain ? html`<button className="btn" onClick=${onAgain}><${Icon} name="refresh" size=${16} />${again}</button>` : null}
      <button className="btn-cta" onClick=${() => go('gym', nx.id)}>Next: ${nx.short}<${Icon} name="arrowR" size=${18} /></button>
    </div>
  </div>`;
}
function gymSoundOn() {
  Sound.enabled = true;
  Store.act((pp) => { pp.settings.sound = true; });
  try { Sound.ensure(); Sound.play('tap'); } catch (e) { /* audio is optional */ }
}
function GymToggle({ on, onClick, icon, children, disabled }) {
  return html`<button type="button" className="chip gym-toggle" aria-pressed=${!!on} onClick=${onClick} disabled=${disabled}><${Icon} name=${icon} size=${14} />${children}</button>`;
}

/* ---------- Tile art for the Gym home ---------- */
function GymArtBreath() {
  return html`<svg viewBox="0 0 200 170" className="gym-art gym-art-breath" aria-hidden="true">
    <defs>
      <radialGradient id="gymAbG" cx="50%" cy="40%" r="60%"><stop offset="0" style=${{ stopColor: 'var(--stage-ink)', stopOpacity: 0.55 }} /><stop offset="1" style=${{ stopColor: 'var(--stage-ink)', stopOpacity: 0 }} /></radialGradient>
    </defs>
    <path d="M100 150 23 18h154z" className="gym-ab-fill" style=${{ fill: 'url(#gymAbG)' }} />
    <path d="M100 150 23 18" className="gym-ab-side" style=${{ stroke: 'var(--stage-ethos)' }} />
    <path d="M23 18h154" className="gym-ab-side" style=${{ stroke: 'var(--stage-logos)' }} />
    <path d="M177 18 100 150" className="gym-ab-side" style=${{ stroke: 'var(--stage-pathos)' }} />
    <circle r="11" className="gym-ab-halo" /><circle r="5" className="gym-ab-orb" />
  </svg>`;
}
function GymArtWheel() {
  const n = GYM_CATS.length, seg = 360 / n;
  return html`<svg viewBox="-110 -110 220 220" className="gym-art gym-art-wheel" aria-hidden="true">
    <circle r="108" className="gym-aw-rim" />
    <g className="gym-aw-spin">${GYM_CATS.map((c, i) => html`<path key=${c.id} d=${gymArcPath(i * seg, (i + 1) * seg, 96)} style=${{ fill: c.c }} />`)}
      ${GYM_CATS.map((c, i) => { const a = (i * seg * Math.PI) / 180; return html`<line key=${'l' + i} x1="0" y1="0" x2=${(96 * Math.sin(a)).toFixed(1)} y2=${(-96 * Math.cos(a)).toFixed(1)} className="gym-aw-sep" />`; })}
    </g>
    ${Array.from({ length: 16 }).map((_, i) => { const a = (i / 16) * Math.PI * 2; return html`<circle key=${'b' + i} cx=${(102 * Math.sin(a)).toFixed(1)} cy=${(-102 * Math.cos(a)).toFixed(1)} r="3" className=${'gym-aw-bulb' + (i % 2 ? ' b' : '')} />`; })}
    <circle r="20" className="gym-aw-hub" />
    <path d="M0 -10 9 6H-9z" className="gym-aw-tri" />
    <path d="M-124 -11-100 0-124 11z" className="gym-aw-ptr" />
  </svg>`;
}
const GYM_BULBS = (() => {
  const out = [];
  for (let i = 0; i < 5; i++) out.push([10 + i * 20, 0]);
  for (let i = 0; i < 3; i++) out.push([100, 22 + i * 28]);
  for (let i = 4; i >= 0; i--) out.push([10 + i * 20, 100]);
  for (let i = 2; i >= 0; i--) out.push([0, 22 + i * 28]);
  return out;
})();
function GymArtMirror() {
  return html`<div className="gym-art gym-art-mirror" aria-hidden="true">
    <div className="gym-am-frame">
      <div className="gym-am-bulbs">${GYM_BULBS.map(([x, y], i) => html`<i key=${i} className="gym-am-bulb" style=${{ left: x + '%', top: y + '%', '--d': (i * 0.17).toFixed(2) + 's' }}></i>`)}</div>
      <div className="gym-am-glass">
        <svg viewBox="0 0 100 100"><circle cx="50" cy="38" r="13" className="gym-am-line" /><path d="M28 92c2-18 10-28 22-28s20 10 22 28" className="gym-am-line" /><path d="M64 26c6 4 9 10 9 17" className="gym-am-sheen" /></svg>
      </div>
    </div>
  </div>`;
}
function GymArtLyric() {
  return html`<div className="gym-art gym-art-lyric" aria-hidden="true">
    <div className="gym-al-line"><span style=${{ '--i': 0 }}>Red</span><span style=${{ '--i': 1 }}>lorry,</span><span style=${{ '--i': 2 }}>yellow</span><span style=${{ '--i': 3 }}>lorry.</span><i className="gym-al-ball"></i></div>
    <div className="gym-al-speeds"><b></b><b></b><b></b><b className="off"></b><b className="off"></b></div>
  </div>`;
}
function GymArtPrism() {
  return html`<svg viewBox="0 0 220 120" className="gym-art gym-art-prism" aria-hidden="true">
    <path d="M0 66H86" className="gym-ap-in" />
    <path d="M128 60 220 24" pathLength="100" className="gym-ap-out" style=${{ stroke: 'var(--ethos)' }} />
    <path d="M130 64 220 64" pathLength="100" className="gym-ap-out" style=${{ stroke: 'var(--logos)', animationDelay: '.25s' }} />
    <path d="M128 68 220 104" pathLength="100" className="gym-ap-out" style=${{ stroke: 'var(--pathos)', animationDelay: '.5s' }} />
    <path d="M110 22 146 92H74z" className="gym-ap-glass" />
    <path d="M110 22 146 92" className="gym-ap-edge" />
  </svg>`;
}
const GYM_ART = { breath: GymArtBreath, warmup: GymArtMirror, twisters: GymArtLyric, impromptu: GymArtWheel, lab: GymArtPrism };

/* ================================================================
   Gym home
   ================================================================ */
function GymTile({ st, tally, quest, done }) {
  const Art = GYM_ART[st.id] || GymArtBreath;
  return html`<button className=${'gym-tile gym-tile-' + st.id + (done ? ' is-done' : '')} style=${{ '--sc': st.color }} onClick=${() => go('gym', st.id)}>
    <div className="gym-tile-art"><${Art} /></div>
    <div className="gym-tile-body">
      <div className="gym-tile-top"><span className="gym-tile-num">${st.roman}</span><span className="gym-tile-mins">${st.mins}</span>${quest ? html`<span className="gym-quest"><${Icon} name="bolt" size=${12} />Quest +${quest}</span>` : null}</div>
      <h3>${st.name}</h3>
      <p>${st.blurb}</p>
      <div className="gym-tile-foot">
        <span className="gym-tile-tally"><b className="num">${tally}</b> ${st.stat}</span>
        ${done ? html`<span className="gym-done-tick"><${Icon} name="check" size=${14} stroke=${3} />Done today</span>` : html`<span className="gym-go">Enter<${Icon} name="arrowR" size=${16} /></span>`}
      </div>
    </div>
  </button>`;
}
function GymHome() {
  const { profile: p } = useStore();
  const g = gymRead(p);
  const s = p.stats || {};
  const picks = (p.quests && p.quests.picks) || [];
  const claimed = (p.quests && p.quests.claimed) || {};
  const open = (k) => picks.includes(k) && !claimed[k] && QUESTS[k] ? QUESTS[k].xp : 0;
  const questFor = (id) => (id === 'breath' || id === 'warmup' || id === 'twisters' ? open('warmup') : id === 'impromptu' ? open('impromptu') : id === 'lab' ? open('drill') : 0);
  const tally = { breath: s.breaths || 0, warmup: g.warmups, twisters: s.twisters || 0, impromptu: s.impromptus || 0, lab: g.crafted };
  const doneN = GYM_STATIONS.filter((st) => g.done[st.id]).length;
  const honours = [
    { id: 'zen', v: s.breaths || 0, max: 10, unit: 'rounds' },
    { id: 'improviser', v: s.impromptus || 0, max: 5, unit: 'impromptus' },
  ].map((h) => ({ ...h, b: BADGES.find((b) => b.id === h.id) })).filter((h) => h.b);
  return html`<div className="gym gym-home">
    <section className="stage gym-hero">
      <div className="gym-hero-text">
        <p className="page-whisper"><span className="page-label">Gym</span><span className="greek" lang="grc">γυμνάσιον</span></p>
        <h1>Warm up the voice before it has to work</h1>
        <p className="lead">Five short stations for breath, voice, diction, quick thinking and craft. Ten minutes here makes the real speech feel lighter.</p>
        <${Scholion} note="Πλούταρχος" sub="Plutarch" def="The pebbles are in Plutarch, Life of Demosthenes 11. The sea is in Cicero, On Ends 5.5." className="page-line">Demosthenes practiced with pebbles in his mouth and spoke over the roar of the sea.<//>
      </div>
      <div className="gym-plinths">
        ${GYM_STATIONS.map((st) => html`<div key=${st.id} className="gym-plinth" style=${{ '--sc': st.color }}>
          <span className="gym-plinth-cap" aria-hidden="true"></span>
          <b className="num"><${CountUp} value=${tally[st.id]} /></b>
          <span>${st.stat}</span>
        </div>`)}
      </div>
    </section>
    <div className="gym-grid">
      ${GYM_STATIONS.map((st) => html`<${GymTile} key=${st.id} st=${st} tally=${tally[st.id]} quest=${questFor(st.id)} done=${!!g.done[st.id]} />`)}
    </div>
    <div className="gym-lower">
      <section className="card gym-callsheet">
        <div className="row-between">
          <div><div className="eyebrow">Today’s call sheet</div><h2>${doneN >= GYM_STATIONS.length ? 'All five done' : 'Do all five stations'}</h2></div>
          <span className="gym-cs-count num" aria-label=${`${doneN} of ${GYM_STATIONS.length} stations done today`}>${doneN}<small>/${GYM_STATIONS.length}</small></span>
        </div>
        <ol className="gym-cs-list">
          ${GYM_STATIONS.map((st) => html`<li key=${st.id}><button className=${'gym-cs-row' + (g.done[st.id] ? ' is-done' : '')} style=${{ '--sc': st.color }} onClick=${() => go('gym', st.id)}>
            <span className="gym-cs-n">${st.roman}</span><span className="gym-cs-name">${st.name}</span><span className="gym-cs-dots" aria-hidden="true"></span>
            <span className="gym-cs-state">${g.done[st.id] ? html`<${Fragment}><${Icon} name="check" size=${15} stroke=${3} />Done<//>` : st.mins}</span>
          </button></li>`)}
        </ol>
        <p className="small muted">${doneN >= GYM_STATIONS.length ? 'Every station today. Take a bow.' : 'Go top to bottom before a big talk. The sheet resets at midnight.'}</p>
      </section>
      <section className="card gym-honours">
        <div><div className="eyebrow">Gym honours</div><h2>Badges in reach</h2></div>
        ${honours.map((h) => html`<div key=${h.id} className=${'gym-honour' + (p.badges[h.id] ? ' is-earned' : '')}>
          <${BadgeMedal} badge=${h.b} earned=${!!p.badges[h.id]} size=${58} />
          <div className="gym-honour-body">
            <b>${h.b.name}</b><span className="small muted">${h.b.desc}</span>
            <${MeanderBar} value=${(Math.min(h.v, h.max) / h.max) * 100} color="var(--gold)" height=${12} label=${h.b.name + ' progress'} />
            <span className="tiny muted num">${p.badges[h.id] ? 'Earned' : `${Math.min(h.v, h.max)} / ${h.max} ${h.unit}`}</span>
          </div>
        </div>`)}
      </section>
    </div>
  </div>`;
}

/* ================================================================
   I. Triangle breathing
   ================================================================ */
function GymTriGlyph({ phases }) {
  const w = (s) => 1.2 + s * 0.42;
  return html`<svg width="44" height="40" viewBox="0 0 44 40" aria-hidden="true" className="gym-glyph">
    <path d="M22 36 4 5" style=${{ stroke: 'var(--ethos)', strokeWidth: w(phases[0]) }} />
    <path d="M4 5h36" style=${{ stroke: 'var(--logos)', strokeWidth: w(phases[1]) }} />
    <path d="M40 5 22 36" style=${{ stroke: 'var(--pathos)', strokeWidth: w(phases[2]) }} />
  </svg>`;
}
const GYM_DUST = Array.from({ length: 16 }).map((_, i) => ({ x: (i * 37 + 11) % 100, y: (i * 53 + 7) % 100, s: 1 + (i % 3), d: 14 + (i % 5) * 3, delay: -((i * 2.3) % 14) }));
function GymBreathStage({ status, ph, level, lights, sides, rounds, cueWord, cueSub, count, cueColor }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = 0.2 + 0.72 * clamp(level, 0, 1);
  const inner = GYM_TRI.map(([x, y]) => [GYM_TRI_C[0] + (x - GYM_TRI_C[0]) * s, GYM_TRI_C[1] + (y - GYM_TRI_C[1]) * s]);
  const innerD = 'M' + inner.map((q) => q.map((n) => n.toFixed(1)).join(' ')).join('L') + 'Z';
  const outerD = 'M' + GYM_TRI.map((q) => q.join(' ')).join('L') + 'Z';
  const L = 308;
  const sideCol = ['var(--stage-ethos)', 'var(--stage-logos)', 'var(--stage-pathos)'];
  const mids = GYM_TRI.map((a, i) => gymLerp(a, GYM_TRI[(i + 1) % 3], 0.5));
  const orb = status === 'idle' ? GYM_TRI[0] : gymOrbAt(ph);
  const active = status === 'run' || status === 'paused' ? ph.idx : -1;
  const orbCol = active >= 0 ? sideCol[active] : 'var(--stage-ink)';
  return html`<div className=${'stage gym-breath-stage is-' + status} style=${{ '--lvl': level.toFixed(3) }}>
    <div className="gym-beams" aria-hidden="true">
      ${sideCol.map((c, i) => html`<div key=${i} className=${'gym-beam gym-beam-' + i} style=${{ '--c': c, opacity: (0.18 + lights[i] * 0.6).toFixed(2) }}></div>`)}
    </div>
    <div className="gym-dust" aria-hidden="true">${GYM_DUST.map((d, i) => html`<i key=${i} style=${{ left: d.x + '%', top: d.y + '%', width: d.s, height: d.s, animationDuration: d.d + 's', animationDelay: d.delay + 's' }}></i>`)}</div>
    <div className="gym-breath-top">
      <div className="gym-pips" role="img" aria-label=${status === 'done' ? `All ${rounds} rounds complete` : `Round ${ph.round + 1} of ${rounds}`}>
        ${Array.from({ length: rounds }).map((_, r) => html`<i key=${r} className=${status === 'done' || (status !== 'idle' && r < ph.round) ? 'is-done' : status !== 'idle' && r === ph.round ? 'is-now' : ''}></i>`)}
      </div>
      <span className="gym-breath-round num">${status === 'done' ? 'Complete' : status === 'idle' ? `${rounds} rounds` : `Round ${ph.round + 1} of ${rounds}`}</span>
    </div>
    <svg className="gym-breath-svg" viewBox="0 0 400 360" role="img" aria-label="Breathing triangle">
      <defs>
        ${sideCol.map((c, i) => html`<radialGradient key=${i} id=${'gbl' + i + rid}><stop offset="0" style=${{ stopColor: c, stopOpacity: 0.95 }} /><stop offset="0.55" style=${{ stopColor: c, stopOpacity: 0.35 }} /><stop offset="1" style=${{ stopColor: c, stopOpacity: 0 }} /></radialGradient>`)}
        <radialGradient id=${'gbo' + rid}><stop offset="0" style=${{ stopColor: 'var(--stage-ink)', stopOpacity: 1 }} /><stop offset="0.35" style=${{ stopColor: orbCol, stopOpacity: 0.85 }} /><stop offset="1" style=${{ stopColor: orbCol, stopOpacity: 0 }} /></radialGradient>
        <clipPath id=${'gbc' + rid}><path d=${innerD} /></clipPath>
        <filter id=${'gbf' + rid} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id=${'gbh' + rid} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
      </defs>
      <path d=${innerD} className="gym-halo" filter=${`url(#gbh${rid})`} style=${{ opacity: (0.15 + level * 0.4).toFixed(2) }} />
      <path d=${outerD} className="gym-tri-track" />
      <g clipPath=${`url(#gbc${rid})`} className="gym-fill">
        <rect x="0" y="0" width="400" height="360" className="gym-fill-base" />
        ${mids.map((m, i) => html`<circle key=${i} cx=${m[0]} cy=${m[1]} r="250" style=${{ fill: `url(#gbl${i}${rid})`, opacity: (0.3 + lights[i] * 0.7).toFixed(2), mixBlendMode: 'screen' }} />`)}
      </g>
      <path d=${innerD} className="gym-fill-edge" />
      ${GYM_TRI.map((a, i) => { const b = GYM_TRI[(i + 1) % 3]; const lit = sides[i]; return html`<g key=${i}>
        ${i === active ? html`<line x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} className="gym-side-glow" filter=${`url(#gbf${rid})`} style=${{ stroke: sideCol[i], strokeDasharray: `${L} ${L}`, strokeDashoffset: (L * (1 - lit)).toFixed(1) }} />` : null}
        <line x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} className="gym-side" style=${{ stroke: sideCol[i], strokeDasharray: `${L} ${L}`, strokeDashoffset: (L * (1 - lit)).toFixed(1), opacity: i === active || status === 'done' ? 1 : 0.75 }} />
      </g>`; })}
      ${GYM_TRI.map((v, i) => html`<circle key=${'v' + i} cx=${v[0]} cy=${v[1]} r="5" className="gym-vertex" />`)}
      <g transform=${`translate(${orb[0].toFixed(1)} ${orb[1].toFixed(1)})`} className="gym-orb">
        <circle r="30" style=${{ fill: `url(#gbo${rid})` }} />
        <circle r="6.5" className="gym-orb-core" />
      </g>
    </svg>
    <div className="gym-cue" aria-live="polite">
      <div className="gym-cue-word" key=${cueWord} style=${{ '--cc': cueColor || 'var(--stage-ink)' }}>${cueWord}</div>
      <div className="gym-cue-sub">${cueSub}${count != null ? html`<b className="gym-cue-count num" key=${'c' + count}>${count}</b>` : null}</div>
    </div>
  </div>`;
}
function GymBreath({ init }) {
  useStore();
  const I = init || {};
  const [preset, setPreset] = useState(I.preset || 'even');
  const [rounds, setRounds] = useState(I.rounds || 5);
  const [status, setStatus] = useState(I.status || 'idle');
  const [elapsed, setElapsed] = useState(I.elapsed != null ? I.elapsed : -GYM_BREATH_LEAD);
  const [chimes, setChimes] = useState(true);
  const [ocean, setOcean] = useState(false);
  const [voice, setVoice] = useState(false);
  const [earned, setEarned] = useState(I.earned || 0);
  const elRef = useRef(elapsed);
  const keyRef = useRef('');
  const optsRef = useRef({});
  optsRef.current = { chimes, ocean, voice };
  const P = GYM_BREATH_PRESETS.find((x) => x.id === preset) || GYM_BREATH_PRESETS[0];
  const cycle = P.phases[0] + P.phases[1] + P.phases[2];
  const total = cycle * rounds;
  const ph = gymBreathPhase(Math.max(0, elapsed), P.phases, rounds);
  const lead = (status === 'run' || status === 'paused') && elapsed < 0;
  const level = status === 'done' ? 1 : status === 'idle' ? 0.6 : lead ? 0.12 : gymBreathLevel(ph);
  const lights = status === 'done' ? [1, 1, 1] : status === 'idle' ? [0.5, 0.5, 0.5] : lead ? [0.15, 0.15, 0.15] : [0, 1, 2].map((i) => (i === ph.idx ? 1 : 0.3));
  const sides = status === 'done' || status === 'idle' ? [1, 1, 1] : lead ? [0, 0, 0] : [0, 1, 2].map((i) => (i < ph.idx ? 1 : i === ph.idx ? ph.frac : 0));
  const cue = GYM_BREATH_CUES[ph.idx];
  let cueWord, cueSub, count = null, cueColor = null;
  if (status === 'idle') { cueWord = 'Ready when you are'; cueSub = `${P.name} · ${P.phases.join(' · ')} seconds · ${fmtTime(total)}`; }
  else if (status === 'done') { cueWord = 'Steady.'; cueSub = 'Three lights, one breath. Your voice is ready.'; }
  else if (lead) { cueWord = 'Settle in'; cueSub = 'Sit tall. Soften your shoulders.'; count = Math.max(1, Math.ceil(-elapsed)); }
  else { cueWord = status === 'paused' ? 'Paused' : cue.word; cueSub = status === 'paused' ? 'Resume when you’re ready.' : cue.sub; count = status === 'paused' ? null : Math.max(1, Math.ceil(ph.left - 1e-6)); cueColor = status === 'paused' ? null : cue.color; }

  function complete() {
    setStatus('done');
    GymSfx.pad.stop();
    GymSfx.bowl();
    const xp = Math.min(30, 5 * rounds);
    setEarned(xp);
    Store.act((pp, ctx) => { pp.stats.breaths = (pp.stats.breaths || 0) + rounds; gymMark(pp, 'breath'); ctx.xp(xp, 'Breathing'); ctx.quest('warmup'); });
  }
  useEffect(() => {
    if (status !== 'run') return undefined;
    let raf = 0;
    const t0 = performance.now() - elRef.current * 1000;
    const step = (now) => {
      const e = (now - t0) / 1000;
      elRef.current = e;
      if (e >= total) { setElapsed(total); complete(); return; }
      setElapsed(e);
      if (e >= 0) {
        const q = gymBreathPhase(e, P.phases, rounds);
        const key = q.round + ':' + q.idx;
        if (key !== keyRef.current) {
          keyRef.current = key;
          if (optsRef.current.chimes) GymSfx.breath(q.idx);
          if (optsRef.current.voice) Voice.speak(GYM_BREATH_CUES[q.idx].word, { rate: 0.8, pitch: 0.9 });
        }
        GymSfx.pad.set(gymBreathLevel(q));
      } else {
        const key = 'lead' + Math.ceil(e);
        if (key !== keyRef.current) { keyRef.current = key; if (optsRef.current.chimes) GymSfx.t(523.25, 0, 0.25, 'sine', 0.018); }
        GymSfx.pad.set(0.1);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [status, preset, rounds]);
  useEffect(() => { if (ocean && status === 'run') GymSfx.pad.start(); else GymSfx.pad.stop(); }, [ocean, status]);
  useEffect(() => () => { GymSfx.pad.stop(); Voice.stop(); }, []);

  const start = () => { elRef.current = -GYM_BREATH_LEAD; keyRef.current = ''; setElapsed(-GYM_BREATH_LEAD); setEarned(0); setStatus('run'); try { Sound.ensure(); } catch (e) { /* optional */ } };
  const stop = () => { setStatus('idle'); elRef.current = -GYM_BREATH_LEAD; setElapsed(-GYM_BREATH_LEAD); Voice.stop(); };
  const busy = status === 'run' || status === 'paused';
  return html`<div className="gym gym-breath">
    <${GymHead} id="breath" title="Triangle breathing" lead="Follow the light. Breathe in up the blue side, hold across the green, and breathe out down the red." />
    <div className="gym-breath-layout">
      <${GymBreathStage} status=${status} ph=${ph} level=${level} lights=${lights} sides=${sides} rounds=${rounds} cueWord=${cueWord} cueSub=${cueSub} count=${count} cueColor=${cueColor} />
      <aside className="card gym-panel">
        ${status === 'done' ? html`<${GymFinish} id="breath" xp=${earned} title=${`${rounds} rounds, steady`} onAgain=${stop} again="Breathe again"><p className="muted small">${rounds * cycle} seconds of slow breathing. Speak while the calm lasts.</p><//>` : html`<${Fragment}>
          <div className="field">
            <span className="label">Pattern</span>
            <div className="gym-presets" role="radiogroup" aria-label="Breathing pattern">
              ${GYM_BREATH_PRESETS.map((x) => html`<button key=${x.id} role="radio" aria-checked=${x.id === preset} className=${'gym-preset' + (x.id === preset ? ' is-on' : '')} disabled=${busy} onClick=${() => setPreset(x.id)}>
                <${GymTriGlyph} phases=${x.phases} /><b>${x.name}</b><span className="num">${x.phases.join(' · ')}</span>
              </button>`)}
            </div>
            <p className="hint">${P.note}</p>
          </div>
          <div className="field">
            <span className="label">Rounds</span>
            <div className="row" style=${{ gap: 10 }}>
              <div className="seg">${[3, 5, 8].map((n) => html`<button key=${n} aria-pressed=${rounds === n} disabled=${busy} onClick=${() => setRounds(n)}>${n}</button>`)}</div>
              <span className="hint num">${fmtTime(total)} in all</span>
            </div>
          </div>
          <div className="field">
            <span className="label">Sound</span>
            <div className="row" style=${{ gap: 6 }}>
              <${GymToggle} on=${chimes} icon="gymBell" onClick=${() => setChimes(!chimes)}>Chimes<//>
              <${GymToggle} on=${ocean} icon="wave" onClick=${() => setOcean(!ocean)}>Surf<//>
              ${Voice.ok ? html`<${GymToggle} on=${voice} icon="volume" onClick=${() => setVoice(!voice)}>Spoken cues<//>` : null}
            </div>
            ${!Sound.enabled ? html`<span className="hint row" style=${{ gap: 8 }}>Sounds are muted.<button type="button" className="btn btn-sm" onClick=${gymSoundOn}><${Icon} name="volume" size=${14} />Turn sounds on</button></span>` : null}
          </div>
          ${status === 'idle' ? html`<button className="btn-cta wide" onClick=${start}><${Icon} name="play" size=${18} />Begin ${rounds} rounds</button>`
            : html`<div className="gym-ctl">
              ${status === 'run' ? html`<button className="btn-cta wide" onClick=${() => setStatus('paused')}><${Icon} name="pause" size=${18} />Pause</button>` : html`<button className="btn-cta wide" onClick=${() => setStatus('run')}><${Icon} name="play" size=${18} />Resume</button>`}
              <button className="btn" onClick=${stop}><${Icon} name="stop" size=${16} />Stop</button>
            </div>`}
        <//>`}
      </aside>
    </div>
    <section className="gym-why">
      <${Icon} name="info" size=${18} />
      <div><b>Why it works</b><p>A slow breath with a long exhale switches on your body’s calming system and can lower your heart rate. A calmer body gives you a steadier voice for your first sentence.</p></div>
    </section>
  </div>`;
}

/* ================================================================
   II. Vocal warm-up: the dressing-room mirror
   ================================================================ */
function GymWarmArt({ kind }) {
  const ink = { className: 'gym-wa-ink' };
  switch (kind) {
    case 'posture': return html`<svg viewBox="0 0 200 200" className="gym-wa gym-wa-posture" aria-hidden="true">
      <path d="M100 6v30" className="gym-wa-thread" /><path d="M93 15l7-9 7 9" className="gym-wa-thread solid" />
      <g className="gym-wa-rise">
        <circle cx="100" cy="56" r="15" ...${ink} />
        <path d="M100 71v62M70 90c9-6 51-6 60 0M72 92l-5 38M128 92l5 38M100 133l-14 49M100 133l14 49" ...${ink} />
      </g>
      <path d="M58 186h84" className="gym-wa-floor" /><path d="M76 160h48" className="gym-wa-guide" />
    </svg>`;
    case 'trills': return html`<svg viewBox="0 0 200 200" className="gym-wa gym-wa-trills" aria-hidden="true">
      <text x="100" y="52" textAnchor="middle" className="gym-wa-say">brrrrr</text>
      <g className="gym-wa-flutter">
        <path d="M46 104c16-20 34-22 54-12 20-10 38-8 54 12-18 22-36 26-54 24-18 2-36-2-54-24z" className="gym-wa-lips" />
        <path d="M48 104c30 6 74 6 104 0" ...${ink} />
      </g>
      <path d="M30 92c-6 6-6 18 0 24M18 84c-10 11-10 29 0 40M170 92c6 6 6 18 0 24M182 84c10 11 10 29 0 40" className="gym-wa-buzz" />
      <path d="M70 150q8-8 16 0t16 0t16 0t16 0" className="gym-wa-air" /><path d="M78 168q8-8 16 0t16 0t16 0" className="gym-wa-air d2" />
    </svg>`;
    case 'siren': return html`<svg viewBox="0 0 200 200" className="gym-wa gym-wa-siren" aria-hidden="true">
      <path d="M22 40h156M22 100h156M22 160h156" className="gym-wa-staff" />
      <text x="24" y="34" className="gym-wa-tag">HIGH</text><text x="24" y="176" className="gym-wa-tag">LOW</text>
      <path d="M22 160C62 160 70 40 100 40S138 160 178 160" className="gym-wa-curve-bg" />
      <path d="M22 160C62 160 70 40 100 40S138 160 178 160" className="gym-wa-curve" pathLength="100" />
      <text x="100" y="128" textAnchor="middle" className="gym-wa-say">mmmmm</text>
    </svg>`;
    case 'jaw': return html`<svg viewBox="0 0 200 200" className="gym-wa gym-wa-jaw" aria-hidden="true">
      <path d="M58 100c0-38 18-62 42-62s42 24 42 62" ...${ink} />
      <path d="M82 88q6 5 12 0M106 88q6 5 12 0" ...${ink} />
      <g className="gym-wa-drop"><path d="M58 100c2 34 20 60 42 60s40-26 42-60" ...${ink} /><ellipse cx="100" cy="128" rx="12" ry="9" className="gym-wa-mouth" /></g>
      <path d="M40 76c-10 22-8 46 4 66M160 76c10 22 8 46-4 66" className="gym-wa-hand" />
      <path d="M30 112v24l-6-7M30 136l6-7M170 112v24l-6-7M170 136l6-7" className="gym-wa-arrow" />
      <text x="100" y="192" textAnchor="middle" className="gym-wa-say small">yah · yah · yah</text>
    </svg>`;
    case 'resonance': return html`<svg viewBox="0 0 200 200" className="gym-wa gym-wa-resonance" aria-hidden="true">
      <circle cx="100" cy="100" r="34" className="gym-wa-ring r1" /><circle cx="100" cy="100" r="54" className="gym-wa-ring r2" /><circle cx="100" cy="100" r="76" className="gym-wa-ring r3" />
      <path d="M100 74l-8 26h12" ...${ink} /><path d="M86 118q14 8 28 0" ...${ink} /><path d="M86 118q14-3 28 0" ...${ink} />
      <text x="100" y="192" textAnchor="middle" className="gym-wa-say small">mum · mum · mum</text>
    </svg>`;
    default: {
      const xs = [12, 25, 39, 54, 70, 87, 105, 124, 144, 165];
      return html`<svg viewBox="0 0 200 200" className="gym-wa gym-wa-project" aria-hidden="true">
        <path d="M194 30v140" className="gym-wa-wall" />
        ${xs.map((x, i) => html`<text key=${i} x=${x} y=${150 - i * 7} textAnchor="middle" className="gym-wa-num" style=${{ fontSize: 11 + i * 2.2, '--i': i }}>${i + 1}</text>`)}
        <path d="M186 66q6 34 0 68M179 74q5 26 0 52" className="gym-wa-buzz" />
        <path d="M10 170h184" className="gym-wa-floor" />
      </svg>`;
    }
  }
}
function GymMirror({ kind, progress, flash, title }) {
  const lit = Math.round(clamp(progress, 0, 1) * GYM_BULBS.length);
  return html`<div className=${'gym-mirror' + (flash ? ' is-flash' : '')}>
    <div className="gym-mirror-bulbs" aria-hidden="true">${GYM_BULBS.map(([x, y], i) => html`<i key=${i} className=${'gym-bulb' + (i < lit ? ' is-lit' : '') + (i === lit ? ' is-next' : '')} style=${{ left: x + '%', top: y + '%', '--d': (i * 0.06).toFixed(2) + 's' }}></i>`)}</div>
    <div className="gym-glass">
      <div className="gym-glass-sheen" aria-hidden="true"></div>
      <${GymWarmArt} kind=${kind} key=${kind} />
      <span className="gym-glass-label inscr">${title}</span>
    </div>
  </div>`;
}
/* The warm-up pays once a day, and only when at least half its running time really passed. */
const GYM_WARMUP_XP = 20;
function gymWarmupXp(spentSecs, secsPerStep, doneToday) {
  if (!(spentSecs >= secsPerStep * GYM_WARMUP.length * 0.5)) return { xp: 0, why: 'short' };
  return doneToday ? { xp: 0, why: 'repeat' } : { xp: GYM_WARMUP_XP, why: 'full' };
}
const GYM_WARMUP_NOTES = {
  full: 'Your voice is warmed up. Go speak.',
  repeat: 'Your voice is warmed up. Go speak. You already earned today’s warm-up XP, so this one is practice.',
  short: 'You skipped most of it, so this one earned no XP. Run at least half the time to earn it.',
};
function GymWarmup({ init }) {
  useStore();
  const I = init || {};
  const last = GYM_WARMUP.length - 1;
  const [idx, setIdx] = useState(I.idx || 0);
  const [running, setRunning] = useState(!!I.running);
  const [started, setStarted] = useState(!!I.started || !!I.running);
  const [done, setDone] = useState(!!I.done);
  const [short, setShort] = useState(!!I.short);
  const [auto, setAuto] = useState(true);
  const [voice, setVoice] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const timer = useRef(0);
  const awarded = useRef(false);
  const spent = useRef(0);
  const runT0 = useRef(0);
  const [outcome, setOutcome] = useState(I.outcome || { xp: GYM_WARMUP_XP, why: 'full' });
  const step = GYM_WARMUP[clamp(idx, 0, last)];
  const secs = short ? 15 : 30;
  function finish() {
    clearTimeout(timer.current);
    setRunning(false); setDone(true);
    Sound.play('reveal');
    if (awarded.current) return;
    awarded.current = true;
    const total = spent.current + (runT0.current ? (performance.now() - runT0.current) / 1000 : 0);
    const out = gymWarmupXp(total, secs, !!gymRead(Store.state.profile).done.warmup);
    setOutcome(out);
    if (out.why === 'short') return;
    Store.act((pp, ctx) => { const g = gymMark(pp, 'warmup'); g.warmups += 1; ctx.xp(out.xp, 'Vocal warm-up'); ctx.quest('warmup'); });
  }
  function stepEnd() {
    GymSfx.step();
    if (idx >= last) { finish(); return; }
    if (auto) { clearTimeout(timer.current); timer.current = setTimeout(() => setIdx((i) => Math.min(i + 1, last)), 900); }
    else setRunning(false);
  }
  const left = useCountdown({ seconds: secs, running: running && !done, resetKey: idx + ':' + secs + ':' + runKey, onEnd: stepEnd });
  const shown = Math.max(0, left);
  const frac = clamp(1 - shown / secs, 0, 1);
  const progress = done ? 1 : (idx + (started ? frac : 0)) / GYM_WARMUP.length;
  useEffect(() => { if (voice && running && !done) Voice.speak(step.title + '. ' + step.say, { rate: 0.95 }); }, [idx, running, voice]);
  useEffect(() => () => { clearTimeout(timer.current); Voice.stop(); }, []);
  useEffect(() => {
    if (!running || done) return undefined;
    runT0.current = performance.now();
    return () => { spent.current += (performance.now() - runT0.current) / 1000; runT0.current = 0; };
  }, [running, done]);
  const go2 = (i) => { clearTimeout(timer.current); setIdx(clamp(i, 0, last)); setRunKey((k) => k + 1); };
  const begin = () => { setStarted(true); setRunning(true); setDone(false); awarded.current = false; try { Sound.ensure(); } catch (e) { /* optional */ } };
  const again = () => { setDone(false); setStarted(false); setRunning(false); setIdx(0); setRunKey((k) => k + 1); awarded.current = false; spent.current = 0; };
  return html`<div className="gym gym-warm">
    <${GymHead} id="warmup" title="Vocal warm-up" lead="Six exercises, about thirty seconds each. Do them out loud, standing if you can." />
    <div className="gym-warm-layout">
      <${GymMirror} kind=${done ? 'project' : step.id} progress=${progress} flash=${done} title=${done ? 'Curtain up' : `${idx + 1} · ${step.title}`} />
      <section className="card gym-panel gym-warm-panel">
        ${done ? html`<${GymFinish} id="warmup" xp=${outcome.xp} title=${outcome.why === 'short' ? 'Warm-up ended early' : 'Warm, loose and ready'} onAgain=${again} again="Warm up again"><p className="muted small">${GYM_WARMUP_NOTES[outcome.why] || GYM_WARMUP_NOTES.full}</p><//>` : html`<${Fragment}>
          <div className="gym-warm-step">
            <div className="row-between">
              <div><div className="eyebrow">Exercise ${idx + 1} of ${GYM_WARMUP.length}</div><h2>${step.title}</h2></div>
              <${Klepsydra} total=${secs} remaining=${started ? shown : secs} size=${78} running=${running} />
            </div>
            <ol className="gym-how">${step.how.map((h, i) => html`<li key=${i}><span className="gym-how-n num">${i + 1}</span><span>${h}</span></li>`)}</ol>
            <p className="gym-feel"><${Icon} name="sparkles" size=${16} />${step.feel}</p>
          </div>
          <div className="gym-ctl">
            ${!started ? html`<button className="btn-cta wide gold" onClick=${begin}><${Icon} name="play" size=${18} />Start the warm-up</button>`
              : html`<${Fragment}>
                <button className="btn btn-icon" onClick=${() => go2(idx - 1)} disabled=${idx === 0} aria-label="Previous exercise"><${Icon} name="chevL" /></button>
                ${running ? html`<button className="btn-cta gold wide" onClick=${() => setRunning(false)}><${Icon} name="pause" size=${18} />Pause</button>` : html`<button className="btn-cta gold wide" onClick=${() => { if (shown <= 0) { if (idx >= last) { finish(); return; } go2(idx + 1); } setRunning(true); }}><${Icon} name="play" size=${18} />${shown <= 0 ? (idx >= last ? 'Finish' : 'Next exercise') : 'Resume'}</button>`}
                <button className="btn btn-icon" onClick=${() => (idx >= last ? finish() : go2(idx + 1))} aria-label=${idx >= last ? 'Finish the warm-up' : 'Next exercise'}><${Icon} name=${idx >= last ? 'check' : 'chevR'} /></button>
              <//>`}
          </div>
          <div className="row" style=${{ gap: 6 }}>
            <div className="seg" aria-label="Length">
              <button aria-pressed=${short} onClick=${() => { setShort(true); setRunKey((k) => k + 1); }}>Short · 1½ min</button>
              <button aria-pressed=${!short} onClick=${() => { setShort(false); setRunKey((k) => k + 1); }}>Full · 3 min</button>
            </div>
            <${GymToggle} on=${auto} icon="repeat" onClick=${() => setAuto(!auto)}>Auto-advance<//>
            ${Voice.ok ? html`<${GymToggle} on=${voice} icon="volume" onClick=${() => setVoice(!voice)}>Read aloud<//>` : null}
          </div>
        <//>`}
        <ol className="gym-steps" aria-label="Exercises">
          ${GYM_WARMUP.map((s, i) => html`<li key=${s.id}><button className=${'gym-steps-b' + (done || i < idx ? ' is-done' : i === idx ? ' is-now' : '')} onClick=${() => { if (done) again(); go2(i); }} aria-current=${i === idx && !done ? 'step' : undefined}>
            <span className="gym-steps-n">${done || i < idx ? html`<${Icon} name="check" size=${13} stroke=${3} />` : i + 1}</span><span>${s.title}</span>
          </button></li>`)}
        </ol>
      </section>
    </div>
  </div>`;
}

/* ================================================================
   III. Tongue twisters: the sing-along screen
   ================================================================ */
function GymMetronome({ sps, on }) {
  return html`<div className=${'gym-metro' + (on ? ' is-on' : '')} style=${{ '--beat': (2 / sps).toFixed(3) + 's' }} aria-hidden="true">
    <svg viewBox="0 0 40 52"><path d="M12 2h16l10 48H2z" className="gym-metro-body" /><path d="M8 40h24" className="gym-metro-line" /><g className="gym-metro-arm"><path d="M20 44V8" /><rect x="16" y="14" width="8" height="6" rx="1.5" /></g></svg>
  </div>`;
}
function GymTwisters({ init }) {
  const { profile: p } = useStore();
  const I = init || {};
  const g = gymRead(p);
  const [twId, setTwId] = useState(I.twId || 't01');
  const tw = GYM_TWISTERS.find((x) => x.id === twId) || GYM_TWISTERS[0];
  const [tier, setTier] = useState(I.tier != null ? I.tier : tw.tier);
  const rec = g.tw[tw.id] || { best: -1, clean: 0 };
  const best = typeof rec.best === 'number' ? rec.best : -1;
  const maxPace = Math.min(GYM_PACES.length - 1, best + 1);
  const [pace, setPace] = useState(I.pace != null ? I.pace : maxPace);
  const pc = clamp(pace, 0, maxPace);
  const sps = GYM_PACES[pc].sps;
  const [phase, setPhase] = useState(I.phase || 'ready');
  const [k, setK] = useState(I.k != null ? I.k : -1);
  const [count, setCount] = useState(3);
  const [streak, setStreak] = useState(I.streak || 0);
  const [flash, setFlash] = useState(I.flash || null);
  const timing = useMemo(() => gymTwisterTiming(tw.text, sps, GYM_TW_REPS), [tw.id, sps]);
  const words = useMemo(() => tw.text.split(/\s+/).filter(Boolean), [tw.id]);
  const wordRefs = useRef([]);
  const ballRef = useRef(null);
  const posRef = useRef([]);
  const rafRef = useRef(0);
  const timers = useRef([]);
  const cleanRef = useRef(null);
  const cur = k >= 0 && k < timing.items.length ? timing.items[k] : null;
  const rep = phase === 'mark' ? GYM_TW_REPS : cur ? cur.rep : 0;
  const busy = phase === 'count' || phase === 'run';
  const measure = () => {
    posRef.current = words.map((_, i) => { const el = wordRefs.current[i]; return el ? { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop } : { x: 0, y: 0 }; });
    placeBall(-1, 0);
  };
  function placeBall(kk, t) {
    const el = ballRef.current, pos = posRef.current, it = timing.items;
    if (!el || !pos.length || !it.length) return;
    let x, y, sq = 1;
    if (kk < 0 || kk >= it.length) { const q = pos[kk < 0 ? 0 : it[it.length - 1].i] || pos[0]; x = q.x; y = q.y - 14; }
    else {
      const a = it[kk], b = it[kk + 1];
      const from = pos[a.i] || pos[0], to = b ? pos[b.i] || from : from;
      const span = b ? b.start - a.start : a.dur;
      const f = clamp((t - a.start) / (span || 1), 0, 1);
      if (reducedMotion()) { x = from.x; y = from.y - 14; }
      else {
        const dx = to.x - from.x, h = 16 + Math.min(34, Math.abs(dx) * 0.12) + (to.y !== from.y ? 18 : 0);
        x = from.x + dx * f;
        y = from.y + (to.y - from.y) * f - 14 - Math.sin(Math.PI * f) * h;
        sq = f < 0.1 ? 0.72 + f * 2.8 : 1;
      }
    }
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 / sq).toFixed(2)}, ${sq.toFixed(2)})`;
  }
  useEffect(() => {
    measure();
    const r = () => measure();
    window.addEventListener('resize', r);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(r); } catch (e) { /* ignore */ }
    return () => window.removeEventListener('resize', r);
  }, [tw.id]);
  const stopAll = () => { cancelAnimationFrame(rafRef.current); timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => { stopAll(); Voice.stop(); }, []);
  function run() {
    setPhase('run');
    measure();
    const t0 = performance.now();
    let lastK = -2;
    const step = (now) => {
      const t = (now - t0) / 1000;
      const kk = gymWordAt(timing, t);
      if (kk !== lastK) { lastK = kk; setK(kk); }
      placeBall(kk, t);
      if (t >= timing.total + 0.3) { setK(timing.items.length); setPhase('mark'); placeBall(timing.items.length, t); return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }
  function start() {
    if (busy) return;
    stopAll(); Voice.stop();
    setFlash(null); setK(-1); setPhase('count'); setCount(3);
    try { Sound.ensure(); } catch (e) { /* optional */ }
    const beat = Math.max(0.42, 2 / sps) * 1000;
    [0, 1, 2].forEach((i) => timers.current.push(setTimeout(() => { setCount(3 - i); GymSfx.beat(i === 0); }, i * beat)));
    timers.current.push(setTimeout(run, 3 * beat));
  }
  function cancel() { stopAll(); setPhase('ready'); setK(-1); placeBall(-1, 0); }
  function choose(id) {
    if (busy) cancel();
    const t = GYM_TWISTERS.find((x) => x.id === id);
    if (!t) return;
    const r = g.tw[id] || {};
    setTwId(id); setTier(t.tier); setPhase('ready'); setK(-1); setStreak(0); setFlash(null);
    setPace(Math.min(GYM_PACES.length - 1, (typeof r.best === 'number' ? r.best : -1) + 1));
  }
  function shuffleTw() {
    const pool = GYM_TWISTERS.filter((x) => x.tier === tier && x.id !== tw.id);
    if (pool.length) choose(pool[Math.floor(Math.random() * pool.length)].id);
  }
  function mark(clean) {
    const ns = clean ? streak + 1 : 0;
    const willUnlock = clean && ns >= GYM_TW_STREAK && pc > best;
    Store.act((pp, ctx) => {
      const gg = gymMark(pp, 'twisters');
      const r = (gg.tw[tw.id] = Object.assign({ best: -1, clean: 0 }, gg.tw[tw.id]));
      if (clean) {
        r.clean += 1;
        pp.stats.twisters = (pp.stats.twisters || 0) + 1;
        let xp = 4;
        if (willUnlock) { r.best = Math.max(r.best, pc); xp += 10; }
        ctx.xp(xp, 'Tongue twister');
      }
      ctx.quest('warmup');
    });
    setStreak(willUnlock ? 0 : ns);
    setPhase('ready'); setK(-1); placeBall(-1, 0);
    if (clean) {
      if (willUnlock) {
        const nxt = GYM_PACES[pc + 1];
        GymSfx.unlock();
        gymBurstAt(cleanRef.current, 70, 0.8);
        setFlash({ kind: 'unlock', text: nxt ? `${GYM_PACES[pc].name} cleared. ${nxt.name} unlocked.` : `${GYM_PACES[pc].name} cleared. You have mastered this one.` });
        if (nxt) setPace(pc + 1);
      } else {
        Sound.play('correct');
        gymBurstAt(cleanRef.current, 26, 0.5);
        const need = GYM_TW_STREAK - ns;
        const goal = GYM_PACES[pc + 1] ? `unlock ${GYM_PACES[pc + 1].name}` : 'master this twister';
        setFlash({ kind: 'clean', text: pc <= best ? 'Clean. Nicely done.' : `Clean. ${need} more clean ${need === 1 ? 'round' : 'rounds'} in a row to ${goal}.` });
      }
    } else {
      GymSfx.stumble();
      setFlash({ kind: 'stumble', text: pc > 0 ? 'Stumbles are the workout. Exaggerate the consonants, or drop one pace and build back up.' : 'Stumbles are the workout. Exaggerate every consonant and try again.' });
    }
  }
  const mastered = best >= GYM_PACES.length - 1;
  const tierItems = GYM_TWISTERS.filter((x) => x.tier === tier);
  const tierClean = tierItems.filter((x) => g.tw[x.id] && g.tw[x.id].best >= 0).length;
  return html`<div className="gym gym-tw">
    <${GymHead} id="twisters" title="Tongue twisters" lead="Say each word out loud as it lights up. Three times through, then tell us honestly how it went." />
    <section className=${'stage gym-sing is-' + phase}>
      <div className="gym-sing-top">
        <div className="gym-sing-meta">
          <span className="inscr">${GYM_TIERS[tw.tier].name} · ${tw.focus}</span>
          <span className="gym-reps" aria-label=${`Repetition ${Math.min(rep + 1, GYM_TW_REPS)} of ${GYM_TW_REPS}`}>${Array.from({ length: GYM_TW_REPS }).map((_, r) => html`<i key=${r} className=${r < rep ? 'is-done' : r === rep && phase === 'run' ? 'is-now' : ''}></i>`)}</span>
        </div>
        <div className="gym-sing-tempo"><span className="num">${GYM_PACES[pc].name} · ${sps} syl/s · ≈${gymWpm(sps)} wpm</span><${GymMetronome} sps=${sps} on=${busy} /></div>
      </div>
      <p className="gym-sr">${tw.text}</p>
      <div className="gym-lyric" aria-hidden="true">
        ${words.map((w, i) => html`<span key=${tw.id + i} ref=${(el) => { wordRefs.current[i] = el; }} className=${'gym-w' + (phase === 'mark' ? ' is-past' : cur && cur.i > i ? ' is-past' : cur && cur.i === i ? ' is-now' : '')}>${w}</span>`)}
        <span className="gym-ball" ref=${ballRef}><svg viewBox="0 0 20 18"><path d="M10 1.5 18.5 16.5h-17z" /></svg></span>
        ${phase === 'count' ? html`<span className="gym-count num" key=${count}>${count}</span>` : null}
      </div>
      <div className="gym-sing-foot" aria-live="polite">
        ${phase === 'mark' ? html`<div className="gym-mark">
          <span className="gym-mark-q">How did that go?</span>
          <button className="btn-cta logos" ref=${cleanRef} onClick=${() => mark(true)}><${Icon} name="check" size=${18} stroke=${3} />Clean</button>
          <button className="btn-cta gym-stumble" onClick=${() => mark(false)}><${Icon} name="refresh" size=${18} />Stumbled</button>
        </div>` : phase === 'ready' ? html`<div className="gym-ready">
          ${flash ? html`<span className=${'gym-flash is-' + flash.kind}>${flash.text}</span>` : html`<span className="muted">Press start, then speak with the light. Three repetitions without a pause.</span>`}
        </div>` : html`<div className="gym-ready"><span className="muted">${phase === 'count' ? 'Get ready…' : `Repetition ${rep + 1} of ${GYM_TW_REPS}`}</span><button className="btn btn-sm" onClick=${cancel}>Stop</button></div>`}
      </div>
    </section>
    <div className="gym-tw-layout">
      <section className="card gym-panel">
        <div className="field">
          <span className="label">Pace</span>
          <div className="gym-paces" role="radiogroup" aria-label="Pace">
            ${GYM_PACES.map((x, i) => { const locked = i > maxPace; return html`<button key=${x.id} role="radio" aria-checked=${i === pc} className=${'gym-pace' + (i === pc ? ' is-on' : '') + (i <= best ? ' is-cleared' : '') + (locked ? ' is-locked' : '')} disabled=${locked || busy || phase === 'mark'} onClick=${() => { setPace(i); setStreak(0); setFlash(null); }}>
              <span className="gym-pace-gauge" style=${{ '--n': i }}>${locked ? html`<${Icon} name="lock" size=${14} />` : i <= best ? html`<${Icon} name="check" size=${14} stroke=${3} />` : html`<b className="num">${x.sps}</b>`}</span>
              <span className="gym-pace-name">${x.name}</span>
            </button>`; })}
          </div>
          <span className="hint">${mastered ? 'Mastered at every pace. Try a fiercer twister.' : `${GYM_TW_STREAK} clean rounds in a row unlock the next pace.`} Streak: <b className="num">${streak}</b>/${GYM_TW_STREAK}</span>
        </div>
        <div className="gym-ctl">
          ${busy ? html`<button className="btn-cta logos wide" onClick=${cancel}><${Icon} name="stop" size=${18} />Stop</button>` : html`<button className="btn-cta logos wide" onClick=${start} disabled=${phase === 'mark'}><${Icon} name="play" size=${18} />${phase === 'mark' ? 'Mark your round first' : 'Start'}</button>`}
          ${Voice.ok ? html`<button className="btn" onClick=${() => Voice.speak(tw.text, { rate: gymVoiceRate(sps) })} disabled=${busy}><${Icon} name="volume" size=${16} />Hear it</button>` : null}
          <button className="btn btn-icon" onClick=${shuffleTw} disabled=${busy} aria-label="Another twister from this tier"><${Icon} name="refresh" size=${16} /></button>
        </div>
      </section>
      <section className="card gym-shelf">
        <div className="row-between">
          <div className="seg" role="tablist" aria-label="Difficulty">${GYM_TIERS.map((t) => html`<button key=${t.id} role="tab" aria-selected=${tier === t.id} aria-pressed=${tier === t.id} onClick=${() => setTier(t.id)}>${t.name}</button>`)}</div>
          <span className="tiny muted num">${tierClean}/${tierItems.length} cleared</span>
        </div>
        <div className="gym-shelf-grid">
          ${tierItems.map((x) => { const r = g.tw[x.id]; const b = r && typeof r.best === 'number' ? r.best : -1; return html`<button key=${x.id} className=${'gym-shelf-item' + (x.id === tw.id ? ' is-on' : '')} onClick=${() => choose(x.id)} aria-pressed=${x.id === tw.id}>
            <span className="gym-shelf-text">${x.text}</span>
            <span className="gym-shelf-foot"><span className="tiny muted">${x.focus}</span><span className="gym-shelf-pips" aria-label=${b >= 0 ? `Cleared up to ${GYM_PACES[b].name}` : 'Not cleared yet'}>${GYM_PACES.map((_, i) => html`<i key=${i} className=${i <= b ? 'on' : ''}></i>`)}</span></span>
          </button>`; })}
        </div>
      </section>
    </div>
  </div>`;
}

/* ================================================================
   IV. Impromptu roulette: the game show
   ================================================================ */
const GYM_RIM_BULBS = 24;
function GymWheel({ angleRef, gRef, pointerRef, spinning, landed, flash, onSpin }) {
  const n = GYM_CATS.length, seg = 360 / n, R = 186;
  return html`<div className=${'gym-wheel' + (spinning ? ' is-spinning' : '') + (flash ? ' is-flash' : '') + (landed >= 0 && !spinning ? ' is-landed' : '')}>
    <div className="gym-pointer" ref=${pointerRef} aria-hidden="true">
      <svg viewBox="0 0 44 58"><path d="M22 56 6 18a17 17 0 1 1 32 0z" className="gym-pointer-body" /><circle cx="22" cy="17" r="6" className="gym-pointer-pin" /></svg>
    </div>
    <button className="gym-wheel-btn" onClick=${onSpin} disabled=${spinning} aria-label="Spin the wheel">
      <svg viewBox="-212 -212 424 424" aria-hidden="true">
        <circle r="210" className="gym-rim" />
        <circle r="192" className="gym-rim-inner" />
        ${Array.from({ length: GYM_RIM_BULBS }).map((_, i) => { const a = (i / GYM_RIM_BULBS) * Math.PI * 2; return html`<circle key=${'b' + i} cx=${(201 * Math.sin(a)).toFixed(1)} cy=${(-201 * Math.cos(a)).toFixed(1)} r="4.6" className=${'gym-rim-bulb' + (i % 2 ? ' b' : '')} />`; })}
        <g ref=${gRef} transform=${`rotate(${(angleRef.current || 0).toFixed(2)})`}>
          ${GYM_CATS.map((c, i) => html`<path key=${c.id} d=${gymArcPath(i * seg, (i + 1) * seg, R)} className=${'gym-seg' + (landed === i && !spinning ? ' is-win' : '')} style=${{ fill: c.c }} />`)}
          ${GYM_CATS.map((c, i) => { const a = (i * seg * Math.PI) / 180; return html`<line key=${'s' + i} x1="0" y1="0" x2=${(R * Math.sin(a)).toFixed(1)} y2=${(-R * Math.cos(a)).toFixed(1)} className="gym-seg-sep" />`; })}
          ${GYM_CATS.map((c, i) => { const a = (i * seg * Math.PI) / 180; return html`<circle key=${'p' + i} cx=${(176 * Math.sin(a)).toFixed(1)} cy=${(-176 * Math.cos(a)).toFixed(1)} r="4.2" className="gym-peg" />`; })}
          ${GYM_CATS.map((c, i) => html`<g key=${'t' + i} transform=${`rotate(${(i + 0.5) * seg})`}><text x="0" y="-112" transform="rotate(90 0 -112)" textAnchor="middle" dominantBaseline="central" className="gym-seg-label">${c.name}</text></g>`)}
        </g>
        <circle r="48" className="gym-hub" />
        <circle r="40" className="gym-hub-in" />
        <path d="M0 -19 17 11H-17z" className="gym-hub-tri" />
        <circle cx="0" cy="-19" r="4.5" style=${{ fill: 'var(--stage-ethos)' }} /><circle cx="-17" cy="11" r="4.5" style=${{ fill: 'var(--stage-pathos)' }} /><circle cx="17" cy="11" r="4.5" style=${{ fill: 'var(--stage-logos)' }} />
      </svg>
    </button>
  </div>`;
}
function GymScaffold({ struct, active = -1 }) {
  return html`<ol className="gym-scaffold" aria-label=${'Structure: ' + struct.name}>
    ${struct.parts.map((pt, i) => html`<li key=${i} className=${i === active ? 'is-now' : active > i ? 'is-done' : ''}>
      <span className="gym-scaffold-n num">${i + 1}</span>
      <span className="gym-scaffold-body"><b>${pt.n}</b><span>${pt.h}</span></span>
    </li>`)}
  </ol>`;
}
function GymFeedback({ fb }) {
  if (!fb) return null;
  const rows = [['Structure', fb.structure], ['What worked', fb.worked], ['Try next', fb.next], ['A sharper opener', fb.opener]].filter((r) => r[1]);
  return html`<div className="gym-fb">
    <div className="gym-fb-head"><span className="coach-avatar"><${Icon} name=${fb.offline ? 'scale' : 'sparkles'} size=${20} /></span><div><span className="eyebrow">${fb.offline ? 'Coach notes from your self-review' : 'Coach feedback'}</span><p className="gym-fb-verdict">${fb.verdict}</p></div></div>
    <dl className="gym-fb-rows">${rows.map(([k, v]) => html`<div key=${k}><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
  </div>`;
}
/* An impromptu round has to last long enough to be a round. */
const GYM_IMP_XP = 30;
const gymImpCounts = (secs, speakSecs) => secs >= Math.min(20, speakSecs / 3);
function GymRoulette({ init }) {
  const { profile: p, ai } = useStore();
  const I = init || {};
  const g = gymRead(p);
  const [phase, setPhase] = useState(I.phase || 'wheel');
  const [catIdx, setCatIdx] = useState(I.catIdx != null ? I.catIdx : -1);
  const [prompt, setPrompt] = useState(I.prompt || '');
  const [structId, setStructId] = useState(I.structId || 'prep');
  const [prepSecs, setPrepSecs] = useState(30);
  const [speakSecs, setSpeakSecs] = useState(I.speakSecs || 60);
  const [flash, setFlash] = useState(false);
  const [ratings, setRatings] = useState(I.ratings || { structure: 3, clarity: 3, confidence: 3, pace: 3 });
  const [notes, setNotes] = useState(I.notes || '');
  const [fb, setFb] = useState(I.fb || null);
  const [busy, setBusy] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const [spoke, setSpoke] = useState(I.spoke || 0);
  const [tooShort, setTooShort] = useState(I.tooShort != null ? I.tooShort : null);
  const angleRef = useRef(I.angle || -18);
  const gRef = useRef(null);
  const pointerRef = useRef(null);
  const rafRef = useRef(0);
  const usedRef = useRef([]);
  const lastCat = useRef(-1);
  const cueRef = useRef('');
  const speakT0 = useRef(0);
  const flashT = useRef(0);
  const burstT = useRef(0);
  const coachRun = useRef(0);
  const ctlRef = useRef(null);
  const cardRef = useRef(null);
  const notesId = useId();
  const cat = catIdx >= 0 ? GYM_CATS[catIdx] : null;
  const struct = GYM_STRUCTS[structId] || GYM_STRUCTS.prep;
  const timed = phase === 'prep' || phase === 'speak';
  const left = useCountdown({ seconds: phase === 'prep' ? prepSecs : speakSecs, running: timed, resetKey: phase + ':' + roundKey, onEnd: () => { if (phase === 'prep') beginSpeak(); else GymSfx.bell(); } });
  const cue = phase === 'speak' ? gymSpeakCue(left, speakSecs, struct) : null;
  const partIdx = phase === 'speak' ? Math.min(struct.parts.length - 1, Math.floor(clamp(1 - left / speakSecs, 0, 0.999) * struct.parts.length)) : -1;
  useEffect(() => {
    if (!cue) { cueRef.current = ''; return; }
    if (cue.key !== cueRef.current) { const prev = cueRef.current; cueRef.current = cue.key; if (prev && (cue.key === 'half' || cue.key === 'close')) GymSfx.soft(); }
  }, [cue && cue.key]);
  useEffect(() => { if (phase === 'speak' && left <= -20) endSpeak(); }, [phase === 'speak' && left <= -20]);
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); clearTimeout(flashT.current); clearTimeout(burstT.current); coachRun.current += 1; }, []);

  const applyAngle = (a) => { angleRef.current = a; if (gRef.current) gRef.current.setAttribute('transform', `rotate(${a.toFixed(2)})`); };
  const flick = () => { const el = pointerRef.current; if (el && el.animate && !reducedMotion()) { try { el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-26deg)', offset: 0.3 }, { transform: 'rotate(0deg)' }], { duration: 150, easing: 'ease-out' }); } catch (e) { /* decorative */ } } };
  function land(idx) {
    const c = GYM_CATS[idx];
    const q = gymPickPrompt(c.id, Math.random, usedRef.current);
    usedRef.current = [...usedRef.current, q].slice(-40);
    lastCat.current = idx;
    setCatIdx(idx); setPrompt(q); setStructId(gymPickStruct(c.id)); setPhase('landed'); setFb(null); setNotes(''); setTooShort(null);
    GymSfx.land();
    gymBurstAt(pointerRef.current, 60, 0.75);
    setFlash(true); clearTimeout(flashT.current); flashT.current = setTimeout(() => setFlash(false), 1800);
    clearTimeout(burstT.current);
    burstT.current = setTimeout(() => { try { if (cardRef.current && cardRef.current.scrollIntoView && window.innerWidth < 860) cardRef.current.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* ignore */ } }, reducedMotion() ? 60 : 1100);
  }
  function spin() {
    if (phase === 'spinning') return;
    const n = GYM_CATS.length;
    let target = Math.floor(Math.random() * n);
    if (target === lastCat.current) target = (target + 1 + Math.floor(Math.random() * (n - 1))) % n;
    const from = angleRef.current;
    const to = gymWheelLanding(from, target, n, Math.random, 5 + Math.floor(Math.random() * 2));
    setPhase('spinning'); setFlash(false);
    try { Sound.ensure(); } catch (e) { /* optional */ }
    if (reducedMotion()) { applyAngle(to); land(target); return; }
    const wind = 280, dur = 5200, t0 = performance.now();
    let lastIdx = gymWheelIndex(from, n), lastTick = 0;
    const step = (now) => {
      const el = now - t0;
      let a;
      if (el < wind) a = from - 10 * Math.sin(((el / wind) * Math.PI) / 2);
      else { const u = clamp((el - wind) / dur, 0, 1); a = from - 10 + (to - from + 10) * (1 - Math.pow(1 - u, 4)); }
      applyAngle(a);
      const idx = gymWheelIndex(a, n);
      if (idx !== lastIdx) { lastIdx = idx; if (now - lastTick > 28) { lastTick = now; GymSfx.tick(); flick(); } }
      if (el < wind + dur) rafRef.current = requestAnimationFrame(step);
      else { applyAngle(to); land(target); }
    };
    rafRef.current = requestAnimationFrame(step);
  }
  function redraw() { if (!cat) return; const q = gymPickPrompt(cat.id, Math.random, usedRef.current.concat(prompt)); usedRef.current = [...usedRef.current, q].slice(-40); setPrompt(q); Sound.play('tap'); }
  function reshape() { if (!cat) return; setStructId(gymPickStruct(cat.id, Math.random, structId)); Sound.play('tap'); }
  function beginPrep() { setTooShort(null); setRoundKey((k) => k + 1); setPhase('prep'); Sound.play('tap'); }
  function beginSpeak() { setRoundKey((k) => k + 1); setPhase('speak'); speakT0.current = performance.now(); GymSfx.bell(); }
  function endSpeak() {
    if (phase !== 'speak') return;
    const secs = Math.round((performance.now() - speakT0.current) / 1000);
    setSpoke(secs); setFb(null);
    if (!gymImpCounts(secs, speakSecs)) {
      setTooShort(secs); setPhase('landed');
      toast('Speak for at least 20 seconds to count this round.', 'warn');
      return;
    }
    setTooShort(null); setPhase('review');
    GymSfx.clap(0.5);
    burstT.current = setTimeout(() => celebrate({ count: 90, power: 0.9 }), 120);
    Store.act((pp, ctx) => {
      pp.stats.impromptus = (pp.stats.impromptus || 0) + 1;
      const gg = gymMark(pp, 'impromptu');
      gg.imps = [...gg.imps, { t: Date.now(), cat: cat ? cat.id : '', prompt, secs, r: null }].slice(-12);
      ctx.xp(GYM_IMP_XP, 'Impromptu');
      ctx.quest('impromptu');
    });
  }
  function saveRatings() {
    Store.act((pp) => { const gg = gymEnsure(pp); const last = gg.imps[gg.imps.length - 1]; if (last && last.prompt === prompt) last.r = { ...ratings }; });
  }
  async function coach() {
    saveRatings();
    const enough = wordsOf(notes).length >= 4;
    if (ai === 'off' || !enough) { setFb({ ...gymReviewFallback(ratings, notes, struct), hint: ai !== 'off' && !enough }); return; }
    const run = ++coachRun.current;
    setBusy(true);
    try {
      const raw = await AI.json(gymImpPrompt({ prompt, cat: cat ? cat.name : 'Impromptu', struct, secs: speakSecs, ratings, notes }), { cache: false, modelTier: 'default' });
      if (run !== coachRun.current) return;
      setFb(gymNormFeedback(raw));
    } catch (e) {
      if (run !== coachRun.current) return;
      if (e && e.code !== 'cancelled') toast(aiErrorText(e), 'bad');
      setFb(gymReviewFallback(ratings, notes, struct));
    }
    setBusy(false);
  }
  function again() { coachRun.current += 1; setBusy(false); if (phase === 'review') saveRatings(); setPhase('wheel'); setFb(null); setNotes(''); setRatings({ structure: 3, clarity: 3, confidence: 3, pace: 3 }); }
  const wheelish = phase === 'wheel' || phase === 'spinning' || phase === 'landed';
  const recent = g.imps.slice(-4).reverse();
  return html`<div className="gym gym-imp">
    <${GymHead} id="impromptu" title="Impromptu roulette" lead="Spin the wheel. You get a topic and a structure, a short think, and then the floor is yours. Speak out loud." />
    <section className=${'stage gym-show is-' + phase}>
      <div className="gym-show-lights" aria-hidden="true"><i></i><i></i><i></i></div>
      ${wheelish ? html`<div className="gym-show-grid">
        <div className="gym-wheel-col">
          <div className="gym-rays" aria-hidden="true"></div>
          <${GymWheel} angleRef=${angleRef} gRef=${gRef} pointerRef=${pointerRef} spinning=${phase === 'spinning'} landed=${phase === 'landed' ? catIdx : -1} flash=${flash} onSpin=${spin} />
          <button className="btn-cta gold gym-spin-btn" onClick=${spin} disabled=${phase === 'spinning'}><${Icon} name="gymWheel" size=${20} />${phase === 'spinning' ? 'Spinning…' : phase === 'landed' ? 'Spin again' : 'Spin the wheel'}</button>
        </div>
        <div className="gym-card-col" ref=${cardRef} aria-live="polite">
          ${phase === 'landed' && cat ? html`<div className="gym-prompt" key=${prompt}>
            <span className="gym-cat-tag" style=${{ '--c': cat.c }}>${cat.name}</span>
            <p className="gym-prompt-text">${prompt}</p>
            ${tooShort != null ? html`<p className="gym-too-short" role="status"><b>Too short to count.</b> That round lasted ${fmtTime(tooShort)}, so it earned no XP. Speak for at least 20 seconds.</p>` : null}
            <div className="gym-struct-head"><span className="inscr">Structure · ${struct.name}</span></div>
            <${GymScaffold} struct=${struct} />
            <div className="row" style=${{ gap: 6 }}>
              <button className="btn btn-sm" onClick=${redraw}><${Icon} name="refresh" size=${14} />New topic</button>
              <button className="btn btn-sm" onClick=${reshape}><${Icon} name="columns" size=${14} />Other structure</button>
            </div>
            <div className="gym-times">
              <span className="gym-times-l">Think</span><div className="seg gym-seg-stage">${[15, 30, 60].map((s) => html`<button key=${s} aria-pressed=${prepSecs === s} onClick=${() => setPrepSecs(s)}>${s}s</button>`)}</div>
              <span className="gym-times-l">Speak</span><div className="seg gym-seg-stage">${[60, 90, 120].map((s) => html`<button key=${s} aria-pressed=${speakSecs === s} onClick=${() => setSpeakSecs(s)}>${fmtTime(s)}</button>`)}</div>
            </div>
            <button className="btn-cta wide gym-go-btn" onClick=${beginPrep}><${Icon} name="hourglass" size=${18} />Start ${prepSecs}-second think</button>
          </div>` : html`<div className="gym-rules">
            <span className="inscr gym-rules-kicker">How it works</span>
            <h2 className="gym-rules-title"><span>Spin.</span> <span>Think.</span> <span>Speak.</span></h2>
            <ol className="gym-rules-list">
              <li><b>Spin</b><span>Ten categories, ninety topics.</span></li>
              <li><b>Think</b><span>${prepSecs} seconds with a ready-made structure.</span></li>
              <li><b>Speak</b><span>${fmtTime(speakSecs)} out loud, with cues to keep you on track.</span></li>
            </ol>
            <div className="gym-legend">${GYM_CATS.map((c) => html`<span key=${c.id}><i style=${{ background: c.c }}></i>${c.name}</span>`)}</div>
          </div>`}
        </div>
      </div>` : timed ? html`<div className="gym-spot">
        <div className="gym-spot-clock">
          <${Klepsydra} total=${phase === 'prep' ? prepSecs : speakSecs} remaining=${left} size=${132} running=${true} />
          <span className="inscr">${phase === 'prep' ? 'Thinking time' : 'Speaking time'}</span>
        </div>
        <div className="gym-spot-body">
          ${cat ? html`<span className="gym-cat-tag" style=${{ '--c': cat.c }}>${cat.name}</span>` : null}
          <p className="gym-prompt-text">${prompt}</p>
          <${GymScaffold} struct=${struct} active=${partIdx} />
          ${phase === 'speak' && cue ? html`<p className=${'gym-cue-banner is-' + cue.key} key=${cue.key}>${cue.text}</p>` : html`<p className="gym-cue-banner">Pick your point first. Then find one example. That’s enough.</p>`}
          <div className="gym-ctl" ref=${ctlRef}>
            ${phase === 'prep' ? html`<button className="btn-cta gold wide" onClick=${beginSpeak}><${Icon} name="mic" size=${18} />I’m ready, start speaking</button>` : html`<button className="btn-cta pathos wide" onClick=${endSpeak}><${Icon} name="check" size=${18} stroke=${3} />I’m done</button>`}
            <button className="btn" onClick=${() => setPhase('landed')}>Cancel</button>
          </div>
        </div>
      </div>` : html`<div className="gym-bravo">
        <${GymLaurel} size=${74} />
        <div><span className="inscr">Applause</span><h2>You held the floor for ${fmtTime(spoke)}</h2><p className="gym-bravo-prompt">${cat ? cat.name + ' · ' : ''}${prompt}</p></div>
        <span className="xp-earned"><${Icon} name="bolt" size=${16} />+${GYM_IMP_XP} XP</span>
      </div>`}
    </section>
    ${phase === 'review' ? html`<section className="card gym-review">
      <div><div className="eyebrow">Self-review</div><h2>How did that round feel?</h2><p className="small muted">Be honest. The coach works from what you tell it.</p></div>
      <div className="gym-sliders">
        ${GYM_REVIEW_DIMS.map((d) => html`<label key=${d.id} className="gym-slider" style=${{ '--c': d.c }}>
          <span className="gym-slider-top"><b>${d.name}</b><span className="gym-slider-val">${GYM_RATE_WORDS[ratings[d.id]]}</span></span>
          <input type="range" min="1" max="5" step="1" value=${ratings[d.id]} onChange=${(e) => setRatings({ ...ratings, [d.id]: Number(e.target.value) })} aria-valuetext=${GYM_RATE_WORDS[ratings[d.id]]} />
          <span className="hint">${d.ask}</span>
        </label>`)}
      </div>
      <div className="field">
        <label htmlFor=${notesId}>What did you say? <span className="muted" style=${{ fontWeight: 500 }}>Optional, a few lines is plenty</span></label>
        <textarea id=${notesId} className="textarea" rows="4" value=${notes} onInput=${(e) => setNotes(e.target.value)} placeholder="My point was… My example was… I closed with…"></textarea>
      </div>
      <div className="gym-ctl">
        <button className="btn-cta" onClick=${coach} disabled=${busy}>${busy ? html`<span className="spin"></span>Reading your notes…` : html`<${Icon} name="sparkles" size=${18} />${ai === 'off' ? 'See coach notes' : 'Get coach feedback'}`}</button>
        <button className="btn" onClick=${again}><${Icon} name="gymWheel" size=${16} />Spin again</button>
      </div>
      ${fb && fb.hint ? html`<p className="hint">Jot at least a sentence or two about what you said to get feedback on your content. Here are notes from your ratings.</p>` : null}
      <${GymFeedback} fb=${fb} />
    </section>` : null}
    ${wheelish && recent.length ? html`<section className="card gym-recent">
      <div className="eyebrow">Your last spins</div>
      <ul>${recent.map((r, i) => { const c = GYM_CATS.find((x) => x.id === r.cat); const avg = r.r ? mean(GYM_REVIEW_DIMS.map((d) => r.r[d.id] || 3)) : null; return html`<li key=${r.t + ':' + i}>
        <i className="gym-recent-dot" style=${{ background: c ? c.c : 'var(--line-2)' }}></i>
        <span className="gym-recent-text"><b>${c ? c.name : 'Topic'}</b> ${r.prompt}</span>
        <span className="tiny muted num">${avg != null ? avg.toFixed(1) + ' / 5 · ' : ''}${fmtDate(r.t)}</span>
      </li>`; })}</ul>
    </section>` : null}
  </div>`;
}

/* ================================================================
   V. Device lab: plain light in, a crafted line out
   ================================================================ */
function GymPrism({ lit }) {
  return html`<div className=${'gym-prism' + (lit ? ' is-lit' : '')} aria-hidden="true">
    <svg className="gym-prism-in" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 20H100" vectorEffect="non-scaling-stroke" /></svg>
    <svg className="gym-prism-glass" viewBox="0 0 70 64"><path d="M35 4 66 60H4z" className="gym-prism-body" /><path d="M35 4 66 60" className="gym-prism-edge" /></svg>
    <svg className="gym-prism-out" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path d="M0 18 100 3" vectorEffect="non-scaling-stroke" style=${{ stroke: 'var(--ethos)' }} />
      <path d="M0 20H100" vectorEffect="non-scaling-stroke" style=${{ stroke: 'var(--logos)' }} />
      <path d="M0 22 100 37" vectorEffect="non-scaling-stroke" style=${{ stroke: 'var(--pathos)' }} />
    </svg>
  </div>`;
}
function GymModelLine({ item }) {
  const segs = gymSegments(item.model, item.marks);
  let n = 0;
  return html`<p className="gym-model-text">${segs.map((s, i) => (s.k < 0 ? html`<span key=${i}>${s.t}</span>` : html`<mark key=${i} className=${'gym-mk k' + (s.k % 3)} style=${{ '--i': n++ }}>${s.t}</mark>`))}</p>`;
}
function GymLab({ init }) {
  const { ai } = useStore();
  const I = init || {};
  const devIds = Object.keys(GYM_DEVICES).filter((d) => GYM_LAB.some((x) => x.device === d));
  const [filter, setFilter] = useState(I.filter || 'all');
  const [itemId, setItemId] = useState(I.itemId || GYM_LAB[hashStr(dayKey()) % GYM_LAB.length].id);
  const [text, setText] = useState(I.text || '');
  const [revealed, setRevealed] = useState(!!I.revealed);
  const [fb, setFb] = useState(I.fb || null);
  const [selfOk, setSelfOk] = useState(I.selfOk != null ? I.selfOk : null);
  const [busy, setBusy] = useState(false);
  const [play, setPlay] = useState(0);
  const awarded = useRef({});
  const coachRun = useRef(0);
  const taRef = useRef(null);
  const modelRef = useRef(null);
  const textId = useId();
  const item = GYM_LAB.find((x) => x.id === itemId) || GYM_LAB[0];
  const dev = GYM_DEVICES[item.device];
  const check = useMemo(() => gymDeviceCheck(item.device, text, item.plain), [item.id, text]);
  const nWords = wordsOf(text).length;
  const attempted = nWords >= 3;
  useEffect(() => () => { coachRun.current += 1; }, []);
  function award(bonus) {
    if (!awarded.current[item.id]) {
      awarded.current[item.id] = true;
      Store.act((pp, ctx) => { const gg = gymMark(pp, 'lab'); gg.crafted += 1; ctx.xp(6, 'Device Lab'); ctx.quest('drill'); });
    }
    if (bonus && !awarded.current[item.id + ':bonus']) {
      awarded.current[item.id + ':bonus'] = true;
      Store.act((pp, ctx) => ctx.xp(6, 'Sharp device'));
    }
  }
  function load(id) { coachRun.current += 1; setBusy(false); setItemId(id); setText(''); setRevealed(false); setFb(null); setSelfOk(null); }
  function nextItem(f = filter) {
    const pool = GYM_LAB.filter((x) => (f === 'all' || x.device === f) && x.id !== item.id);
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : item;
    load(pick.id);
    Sound.play('tap');
  }
  function pickFilter(f) {
    setFilter(f);
    if (f !== 'all' && item.device !== f) nextItem(f);
  }
  function reveal() {
    setRevealed(true); setPlay((x) => x + 1);
    GymSfx.shimmer();
    if (attempted) award(false);
    setTimeout(() => { try { if (modelRef.current && modelRef.current.scrollIntoView && window.innerWidth < 700) modelRef.current.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' }); } catch (e) { /* ignore */ } }, 60);
  }
  async function coach() {
    if (!attempted) return;
    if (ai === 'off') { setFb({ offline: true }); setSelfOk(null); return; }
    const run = ++coachRun.current;
    setBusy(true);
    try {
      const raw = await AI.json(gymLabPrompt(item, text), { cache: false, modelTier: 'quick' });
      if (run !== coachRun.current) return;
      const r = gymNormLab(raw);
      setFb(r);
      award(r.score >= 80);
      if (r.score >= 80) { GymSfx.shimmer(); celebrate({ count: 70, power: 0.8 }); } else Sound.play('xp');
    } catch (e) {
      if (run !== coachRun.current) return;
      if (e && e.code !== 'cancelled') toast(aiErrorText(e), 'bad');
      setFb({ offline: true });
    }
    setBusy(false);
  }
  function selfMark(ok) {
    setSelfOk(ok);
    if (ok) { award(false); Sound.play('correct'); }
    else { try { taRef.current && taRef.current.focus(); } catch (e) { /* ignore */ } }
  }
  const meter = check.ok === true ? 3 : check.ok === null && attempted ? 2 : attempted ? 1 : 0;
  return html`<div className="gym gym-lab">
    <${GymHead} id="lab" title="Device lab" lead="Rewrite a plain sentence using one rhetorical device, then compare it with ours." />
    <div className="gym-chiprail" role="toolbar" aria-label="Choose a device">
      <button className="chip" aria-pressed=${filter === 'all'} onClick=${() => pickFilter('all')}>Any device</button>
      ${devIds.map((d) => html`<button key=${d} className="chip" aria-pressed=${filter === d} onClick=${() => pickFilter(d)}>${GYM_DEVICES[d].name}</button>`)}
    </div>
    <section className="gym-bench">
      <div className="gym-label-card">
        <div className="gym-label-top"><span className="inscr">Specimen · ${dev.name}</span>${dev.greek ? html`<span className="greek">${dev.greek}</span>` : null}</div>
        <p className="gym-label-def">${dev.def}</p>
        <p className="gym-label-recipe"><b>Recipe</b> ${dev.recipe}</p>
      </div>
      <div className="gym-plain">
        <span className="gym-tag">Plain</span>
        <p className="gym-plain-text">${item.plain}</p>
      </div>
      <${GymPrism} key=${'p' + play} lit=${revealed} />
      <div className="gym-rewrite">
        <label className="gym-tag" htmlFor=${textId}>Your rewrite · ${dev.name}</label>
        <textarea id=${textId} ref=${taRef} className="textarea gym-rewrite-ta" rows="3" value=${text} onInput=${(e) => { coachRun.current += 1; setBusy(false); setText(e.target.value); if (fb) setFb(null); setSelfOk(null); }} placeholder=${'Rewrite the plain sentence using ' + dev.name.toLowerCase() + '…'}></textarea>
        <div className="gym-meter" aria-live="polite">
          <span className="gym-meter-lights" aria-hidden="true">${[0, 1, 2].map((i) => html`<i key=${i} className=${'k' + i + (i < meter ? ' on' : '')}></i>`)}</span>
          <span className="small">${attempted ? (check.ok === true ? 'Quick check: ' : check.ok === false ? 'Not yet: ' : 'Your call: ') + check.note : 'Write your version first. The quick check reads it as you type.'}</span>
        </div>
      </div>
      <div className="gym-ctl">
        <button className="btn-cta" onClick=${reveal} disabled=${!attempted && !revealed}><${Icon} name="gymPrism" size=${18} />${revealed ? 'Replay the reveal' : 'Reveal our version'}</button>
        <button className="btn btn-ink" onClick=${coach} disabled=${!attempted || busy}>${busy ? html`<span className="spin"></span>Judging…` : html`<${Icon} name="sparkles" size=${16} />${ai === 'off' ? 'Check it myself' : 'Get coach feedback'}`}</button>
        <button className="btn" onClick=${() => nextItem()}><${Icon} name="refresh" size=${16} />New sentence</button>
      </div>
      ${!attempted && !revealed ? html`<button className="btn btn-ghost btn-sm gym-peek" onClick=${reveal}>Show me an example first</button>` : null}
      ${revealed ? html`<div className="gym-model" ref=${modelRef} key=${'m' + play}>
        <div className="row-between"><span className="gym-tag lit">Crafted · ${dev.name}</span>${Voice.ok ? html`<button className="btn btn-sm btn-ghost" onClick=${() => Voice.speak(item.model, { rate: 0.95 })}><${Icon} name="volume" size=${14} />Hear it</button>` : null}</div>
        <${GymModelLine} item=${item} />
        <p className="small muted">${dev.recipe}</p>
      </div>` : null}
      ${fb && !fb.offline ? html`<div className="gym-fb gym-lab-fb">
        <div className="gym-fb-head">
          <span className=${'gym-score num' + (fb.score >= 80 ? ' hi' : fb.score >= 60 ? ' mid' : '')}>${fb.score}</span>
          <div><span className="eyebrow">${fb.uses ? `Uses ${dev.name.toLowerCase()}` : `Not quite ${dev.name.toLowerCase()} yet`}</span><p className="gym-fb-verdict">${fb.verdict}</p></div>
        </div>
        <dl className="gym-fb-rows">${[['What works', fb.worked], ['Try next', fb.next], ['One sharper version', fb.example]].filter((r) => r[1]).map(([k, v]) => html`<div key=${k}><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
      </div>` : null}
      ${fb && fb.offline ? html`<div className="gym-fb gym-selfcheck">
        <div className="gym-fb-head"><span className="coach-avatar"><${Icon} name="scale" size=${20} /></span><div><span className="eyebrow">Self-check</span><p className="gym-fb-verdict">Read your line out loud, then answer honestly.</p></div></div>
        <ul className="gym-checks">${dev.checks.map((c, i) => html`<li key=${i}><${Icon} name="help" size=${16} />${c}</li>`)}</ul>
        ${selfOk == null ? html`<div className="row" style=${{ gap: 8 }}>
          <button className="btn-cta logos" onClick=${() => selfMark(true)}><${Icon} name="check" size=${16} stroke=${3} />Yes, it lands</button>
          <button className="btn" onClick=${() => selfMark(false)}>Not yet, let me revise</button>
          ${!revealed ? html`<button className="btn btn-ghost" onClick=${reveal}>Compare with ours</button>` : null}
        </div>` : html`<p className="small">${selfOk ? 'Logged. Try another device while you’re warm.' : 'Good call. Change one thing and check again.'}</p>`}
      </div>` : null}
    </section>
  </div>`;
}

/* ================================================================
   Router
   ================================================================ */
function GymPage({ param }) {
  const sub = typeof param === 'string' ? param : '';
  switch (sub) {
    case 'breath': return html`<${GymBreath} />`;
    case 'warmup': return html`<${GymWarmup} />`;
    case 'twisters': return html`<${GymTwisters} />`;
    case 'impromptu': case 'roulette': return html`<${GymRoulette} />`;
    case 'lab': return html`<${GymLab} />`;
    default: return html`<${GymHome} />`;
  }
}
