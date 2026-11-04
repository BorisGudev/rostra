/* Dev helper, not part of the build. Paste into the preview page's console (or inject it) to turn
   this browser into a returning user with real data, then reload. Run localStorage.clear() to undo.
   Uses the app's own constructors so the seeded docs have the same shape as real ones. */
(function seedReturning() {
  const DAY = 86400000;
  const now = Date.now();
  const days = [];
  for (let i = 11; i >= 0; i--) days.push(dayKey(new Date(now - i * DAY))); // twelve days, through today

  /* Speeches are clones of the sample report, so opening one renders a complete Report page */
  const speech = (id, title, occasion, ago, e, p, l, durationSec) => ({
    ...clone(getSample()), id, sample: false, title, occasion, date: now - ago * DAY, durationSec,
    scores: { ethos: e, pathos: p, logos: l }, archetype: archetypeOf({ ethos: e, pathos: p, logos: l }).name,
  });
  const speeches = [
    speech('s_6', 'Why our town should keep the night buses', 'public', 1, 66, 83, 57, 412),
    speech('s_5', 'Compost Club seed pitch', 'pitch', 4, 63, 80, 54, 305),
    speech('s_4', 'Best man toast for Daniel and Mei', 'toast', 9, 58, 78, 49, 248),
    speech('s_3', 'Quarterly roadmap for the whole company, with the migration timeline and what it means for support', 'meeting', 15, 57, 66, 52, 620),
    speech('s_2', 'Thesis proposal: first dry run', 'exam', 24, 52, 58, 50, 540),
    speech('s_1', 'Introducing myself at Toastmasters', 'public', 31, 47, 63, 46, 180),
  ];
  const trail = speeches.slice().reverse().map((s) => ({ e: s.scores.ethos, p: s.scores.pathos, l: s.scores.logos, t: s.date, id: s.id }));

  const profile = {
    ...defaultProfile(), name: 'Sasha', goal: 'presentation', onboarded: true, created: now - 32 * DAY, xp: 1180,
    streak: { count: 12, best: 17, last: dayKey(new Date(now)), days },
    skills: { ethos: 66, pathos: 83, logos: 57 },
    subs: {
      ethos: { credibility: 71, goodwill: 68, composure: 59 },
      pathos: { story: 88, imagery: 81, connection: 80 },
      logos: { structure: 62, evidence: 49, reasoning: 60 },
    },
    trail,
    badges: { first_words: now - 31 * DAY, kindling: now - 28 * DAY, scholar: now - 20 * DAY, silver_tongue: now - 4 * DAY, viva_first: now - 6 * DAY, eternal_flame: now - 10 * DAY, speechwright: now - 12 * DAY, fortnight: now - 14 * DAY },
    stats: { ...defaultProfile().stats, speeches: 6, minutes: 38, lessons: 7, drills: 11, fallacies: 18, devices: 9, bestCombo: 7, preps: 2, read: ['gettysburg', 'ihaveadream'], games: 6, best: { fallacy: 1240 }, vivas: 1, vivaBest: 74, vivaQuestions: 9, impromptus: 3, breaths: 4, twisters: 6 },
    done: {},
  };
  /* One quest done, one part-way and one untouched, so all three states show */
  const picks = pickQuests(dayKey(new Date(now)), profile);
  profile.quests = { day: dayKey(new Date(now)), picks, progress: { [picks[0]]: QUESTS[picks[0]].target, [picks[1]]: Math.min(2, QUESTS[picks[1]].target - 1) }, claimed: { [picks[0]]: true }, chest: false };

  const prep = { ...newPrep(profile), id: 'p_1', updated: now - DAY, brief: { occasion: 'presentation', title: 'Conference talk on mentoring junior engineers', audience: 'Engineering leads', goal: 'Get them to pair weekly', minutes: 12, material: '', stories: '' }, stage: 'brief' };
  const liveExam = vivaNewDoc({ id: 'v_live', subject: 'Organic chemistry: reaction mechanisms', topic: 'SN1 and SN2', status: 'live', updated: now - 2 * 3600000 });
  const doneExam = vivaNewDoc({ id: 'v_done', subject: 'Thermodynamics', topic: 'The second law', status: 'done', updated: now - 6 * DAY, report: { percent: 74, grade: 'Merit', summary: 'You explained entropy well and lost the thread on Carnot limits.', cards: [], rubric: { accuracy: 78, depth: 70, reasoning: 74, communication: 72 } } });

  const docs = { profile };
  [...speeches, prep, liveExam, doneExam].forEach((d) => { docs[d.id] = d; });
  Object.keys(localStorage).filter((k) => k.startsWith(LS)).forEach((k) => localStorage.removeItem(k));
  Object.entries(docs).forEach(([id, d]) => { lsSet('doc.' + id, d); });
  lsSet('index', Object.keys(docs));
  return Object.keys(docs).length;
})();
