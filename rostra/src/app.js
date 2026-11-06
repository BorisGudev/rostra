/* ================================================================
   App shell, routing and boot
   ================================================================ */
/* The two things schools buy sit first: the oral exam and speech feedback. Everything else supports them. */
const NAV = [
  { id: 'home', label: t('Home'), icon: 'home', greek: 'ἑστία', gloss: 'hestia: the hearth at the center of a Greek house', group: 'core' },
  { id: 'viva', label: t('Oral exam'), icon: 'scroll', greek: 'ἐξέτασις', gloss: 'exetasis: examination, the word behind Socrates’ unexamined life', group: 'core' },
  { id: 'analyze', label: t('Speech feedback'), icon: 'mic', greek: 'ἀνάλυσις', gloss: 'analysis: a loosening up, the source of our word', group: 'core' },
  { id: 'prepare', label: t('Prepare a speech'), icon: 'pen', greek: 'παρασκευή', gloss: 'paraskeuē: preparation', group: 'core' },
  { id: 'gym', label: t('Gym'), icon: 'dumbbell', greek: 'γυμνάσιον', gloss: 'gymnasion: the source of our word gym', group: 'train' },
  { id: 'learn', label: t('Learn'), icon: 'book', greek: 'μάθησις', gloss: 'mathēsis: learning', group: 'train' },
  { id: 'library', label: t('Library'), icon: 'columns', greek: 'βιβλιοθήκη', gloss: 'bibliothēkē: a place for books', group: 'train' },
  { id: 'trophies', label: t('Progress'), icon: 'trophy', greek: 'τρόπαιον', gloss: 'tropaion: a victory monument, the source of our word trophy', group: 'train' },
];
const TAB_OF = { home: 'home', analyze: 'analyze', report: 'analyze', prepare: 'prepare', learn: 'learn', lesson: 'learn', game: 'learn', library: 'library', speech: 'library', trophies: 'trophies', viva: 'viva', gym: 'gym', teacher: 'teacher', class: 'teacher', review: 'teacher', account: 'account', privacy: 'account' };
const BACK = { report: ['analyze', t('Speech feedback')], lesson: ['learn', t('Learn')], game: ['learn', t('Learn')], speech: ['library', t('Library')], class: ['teacher', t('Classes')], review: ['teacher', t('Classes')], privacy: ['account', t('Account')] };
const PAGES = { home: HomePage, analyze: AnalyzePage, report: ReportPage, prepare: PreparePage, learn: LearnPage, lesson: LessonPage, game: GamePage, library: LibraryPage, speech: SpeechPage, trophies: TrophiesPage, viva: VivaPage, gym: GymPage, teacher: TeacherPage, class: ClassPage, review: ReviewPage, account: AccountPage, privacy: PrivacyPage };
const NAV_TEACHER = { id: 'teacher', label: t('Classes'), icon: 'users', greek: 'τάξεις', gloss: 'taxeis: classes, ranks', group: 'core' };
const NAV_GROUPS = { core: '', train: t('Train') };
/* Teachers get Classes first; everyone gets the same practice pages. */
const navIsTeacher = () => { const u = typeof Platform !== 'undefined' ? Platform.user : null; return !!u && (u.role === 'teacher' || u.role === 'admin'); };
function navFor() {
  return navIsTeacher() ? [NAV.find((n) => n.id === 'home'), NAV_TEACHER, ...NAV.filter((n) => n.id !== 'home')] : NAV;
}

function Rail({ tab }) {
  const { profile: p, backend, storageOk } = useStore();
  const li = levelInfo(p.xp);
  const fresh = (p.lessons || []).some((l) => !lessonDone(p, l.id));
  return html`<aside className="rail">
    <button className="logo" onClick=${() => go('home')} title=${t('Home')}><${LogoMark} size=${32} /><span><span className="logo-word">Rostra</span><span className="logo-sub" lang="grc">τέχνη ῥητορική</span></span></button>
    <nav className="stack" style=${{ gap: 4 }} aria-label=${t('Main')}>
      ${navFor().map((n, i, all) => html`<${Fragment} key=${n.id}>
        ${i > 0 && n.group !== all[i - 1].group ? html`<span className="nav-group" aria-hidden="true">${NAV_GROUPS[n.group] || ''}</span>` : null}
        <button className=${'nav-item' + (tab === n.id ? ' is-on' : '')} onClick=${() => go(n.id)} aria-current=${tab === n.id ? 'page' : undefined}><span className="nav-label">${n.label}${n.id === 'learn' && fresh ? html`<span className="nav-dot" title=${t('New lessons for you')}></span>` : null}</span><span className="greek nav-greek" lang="grc" title=${n.gloss}>${n.greek}</span></button>
      <//>`)}
    </nav>
    <div className="rail-foot">
      <button className="rail-level" onClick=${() => go('trophies')}>
        <div className="row" style=${{ gap: 10, flexWrap: 'nowrap' }}><${LevelBadge} level=${li.level} size=${42} /><div style=${{ minWidth: 0 }}><b style=${{ display: 'block' }}>${li.title}</b><span className="greek rail-rank" lang="grc">${li.greek}</span><span className="tiny muted num" style=${{ display: 'block' }}>${li.into} / ${li.need} XP</span></div></div>
        <${Bar} value=${li.progress * 100} className="bar-xp" />
      </button>
      <button className="nav-item" onClick=${() => Router.coach('')}><span className="nav-label">${t('Ask the coach')}</span><span className="greek nav-greek" lang="grc" title=${t('symboulos: adviser')}>σύμβουλος</span></button>
      <button className=${'nav-item' + (tab === 'account' ? ' is-on' : '')} onClick=${() => go('account')} aria-current=${tab === 'account' ? 'page' : undefined}><span className="nav-label">${typeof Platform !== 'undefined' && Platform.user ? Platform.user.displayName || t('Account') : t('Account')}</span><span className="greek nav-greek" lang="grc" title=${t('prosōpon: person')}>πρόσωπον</span></button>
      ${storageOk === false
        ? html`<div className="rail-store is-bad" title=${t('Browser storage is full or blocked, so your latest work may not survive a reload.')}><${Icon} name="alert" size=${14} />${t('Not saving')}</div>`
        : html`<div className="rail-store"><${Icon} name=${backend === 'db' ? 'cloud' : 'laptop'} size=${14} />${backend === 'db' ? t('Synced to your account') : t('Saved in this browser')}</div>`}
    </div>
  </aside>`;
}
function TopBar({ route }) {
  const { profile: p } = useStore();
  const li = levelInfo(p.xp);
  const live = liveStreak(p);
  const back = route.page === 'prepare' && route.param ? ['prepare', t('Drafts')] : BACK[route.page];
  const [snd, setSnd] = useState(Sound.enabled);
  useEffect(() => setSnd(p.settings.sound !== false), [p.settings.sound]);
  const toggleSound = () => { const v = !Sound.enabled; setSnd(v); setSoundOn(v); };
  return html`<header className="topbar">
    <div className="topbar-title">
      ${back ? html`<button className="btn btn-sm back" onClick=${() => go(back[0])}><${Icon} name="arrowL" size=${16} />${back[1]}</button>`
        : html`<button className="logo mobile-only" style=${{ padding: 0 }} onClick=${() => go('home')} title=${t('Home')}><${LogoMark} size=${28} /><span className="logo-word">Rostra</span></button>`}
    </div>
    <span className=${'stat-chip flame' + (live ? '' : ' cold')} title=${live ? t`${live}-day streak` : t('No active streak')}><${Icon} name="flame" size=${18} />${live}</span>
    <span id="xp-chip" className="stat-chip xp" title=${t('Total XP')}><${Icon} name="bolt" size=${18} />${p.xp.toLocaleString()}</span>
    <button className="lvl-pill" onClick=${() => go('trophies')} title=${t`Level ${li.level}: ${li.title}. Badges`}><span className="lvl-num" lang="grc">${greekNumeral(li.level)}</span><span className="lvl-title">${li.title}</span></button>
    <button className="btn btn-icon btn-ghost hide-sm" onClick=${toggleSound} aria-label=${snd ? t('Mute sounds') : t('Turn sounds on')}><${Icon} name=${snd ? 'volume' : 'volumeOff'} /></button>
    <button className="btn btn-ink hide-sm" onClick=${() => Router.coach('')}><${Icon} name="message" size=${17} />${t('Coach')}</button>
    <button className="btn btn-ink btn-icon show-sm" onClick=${() => Router.coach('')} aria-label=${t('Ask the coach')}><${Icon} name="message" size=${18} /></button>
  </header>`;
}
function setSoundOn(v) { Sound.enabled = v; Store.act((pp) => { pp.settings.sound = v; }); if (v) Sound.play('tap'); }
const TAB_IDS = ['home', 'viva', 'analyze', 'prepare'];
const TAB_LABEL = { home: t('Home'), viva: t('Exam'), analyze: t('Speech'), prepare: t('Prepare'), teacher: t('Classes') };
/* On a phone a teacher reaches Classes in one tap; Prepare moves to the More sheet for them. */
const tabIds = () => (navIsTeacher() ? TAB_IDS.map((id) => (id === 'prepare' ? 'teacher' : id)) : TAB_IDS);
const moreIds = () => (navIsTeacher() ? MORE_IDS.concat('prepare') : MORE_IDS);
const MORE_IDS = ['learn', 'gym', 'library', 'trophies', 'account'];
const NAV_MORE_EXTRA = { account: { id: 'account', label: t('Account'), icon: 'users', greek: 'πρόσωπον' } };
function MoreSheet({ tab, onClose }) {
  const { profile: p, storageOk } = useStore();
  const first = useRef(null);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    if (first.current && first.current.focus) first.current.focus();
    return () => window.removeEventListener('keydown', k);
  }, []);
  const soundOn = p.settings.sound !== false;
  const fresh = (p.lessons || []).some((l) => !lessonDone(p, l.id));
  return html`<div className="sheet-scrim" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label=${t('More')}>
      <div className="row-between"><h2 className="sheet-title">${t('More')}</h2><button className="btn btn-ghost btn-sm btn-icon" onClick=${onClose} aria-label=${t('Close')}><${Icon} name="x" size=${18} /></button></div>
      <nav className="stack" style=${{ gap: 4 }} aria-label=${t('More pages')}>
        ${moreIds().map((id) => NAV.find((n) => n.id === id) || NAV_MORE_EXTRA[id]).map((n, i) => html`<button key=${n.id} ref=${i === 0 ? first : null} className=${'nav-item' + (tab === n.id ? ' is-on' : '')} onClick=${() => { onClose(); go(n.id); }} aria-current=${tab === n.id ? 'page' : undefined}><${Icon} name=${n.icon} /><span className="nav-label">${n.label}${n.id === 'learn' && fresh ? html`<span className="nav-dot" title=${t('New lessons for you')}></span>` : null}</span><span className="greek nav-greek" lang="grc">${n.greek}</span></button>`)}
      </nav>
      <button className="nav-item sheet-toggle" role="switch" aria-checked=${soundOn} onClick=${() => setSoundOn(!soundOn)}><${Icon} name=${soundOn ? 'volume' : 'volumeOff'} />${t('Sound')}<span className="chip chip-sm">${soundOn ? t('On') : t('Off')}</span></button>
      ${typeof Platform !== 'undefined' && Platform.user ? html`<button className="nav-item sheet-toggle" onClick=${async () => { onClose(); await Platform.signOut(); }}><${Icon} name="vivaDoor" />${t('Sign out')}</button>` : null}
      ${storageOk === false ? html`<p className="hint">${t('Browser storage is full or blocked, so your latest work may not survive a reload.')}</p>` : null}
    </div>
  </div>`;
}
function TabBar({ tab }) {
  const [more, setMore] = useState(false);
  const moreBtn = useRef(null);
  const closeMore = () => { setMore(false); if (moreBtn.current && moreBtn.current.focus) moreBtn.current.focus(); };
  const moreOn = moreIds().includes(tab);
  return html`<${Fragment}>
    <nav className="tabbar" aria-label=${t('Main')}>
      ${tabIds().map((id) => NAV.find((n) => n.id === id) || NAV_TEACHER).map((n) => html`<button key=${n.id} className=${'tab' + (tab === n.id ? ' is-on' : '')} onClick=${() => go(n.id)} aria-current=${tab === n.id ? 'page' : undefined} aria-label=${n.label}><${Icon} name=${n.icon} size=${22} />${TAB_LABEL[n.id]}</button>`)}
      <button ref=${moreBtn} className=${'tab' + (moreOn ? ' is-on' : '')} onClick=${() => setMore(true)} aria-haspopup="dialog" aria-expanded=${more} aria-current=${moreOn ? 'page' : undefined}><${Icon} name="more" size=${22} stroke=${3} />${t('More')}</button>
    </nav>
    ${more ? html`<${MoreSheet} tab=${tab} onClose=${closeMore} />` : null}
  <//>`;
}
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('Rostra page error', err, info); }
  render() {
    if (this.state.err) {
      return html`<div className="card empty"><${Icon} name="alert" size=${30} /><h2>${t('Something broke on this page')}</h2><p className="small">${t('Your work is saved. Go back Home and try again.')}</p><button className="btn" onClick=${() => { this.setState({ err: null }); go('home'); }}>${t('Back to Home')}</button></div>`;
    }
    return this.props.children;
  }
}
const HOT = (window.claude && window.claude.hot) || null;
function App({ initial }) {
  useStore();
  /* Sign-ins and sign-outs re-render the shell; the door shows while accounts are required and nobody is in. */
  const [, authTick] = useState(0);
  useEffect(() => {
    if (typeof Platform === 'undefined') return undefined;
    return Platform.on((ev) => {
      if (ev === 'signin') Store.reboot();
      if (ev === 'signout') { Store.signOutLocal(); Router.go('home'); }
      authTick((x) => x + 1);
    });
  }, []);
  const [route, setRoute] = useState(() => {
    if (initial && initial.route && PAGES[initial.route.page]) return initial.route;
    let h = '';
    try { h = (location.hash || '').replace('#', ''); } catch (e) { h = ''; }
    return PAGES[h] && !['report', 'lesson', 'game', 'speech'].includes(h) ? { page: h } : { page: 'home' };
  });
  const [coach, setCoach] = useState(null);
  const routeRef = useRef(route);
  routeRef.current = route;
  Router.go = (page, param) => {
    setRoute({ page, param });
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    /* The address bar follows the page (one word, no ids), so reload and the back button land somewhere sensible. */
    try { if (location.hash !== '#' + page) history.pushState(null, '', '#' + page); } catch (e) { /* ignore */ }
  };
  Router.coach = (seed) => setCoach(seed || '');
  useEffect(() => {
    const onHash = () => {
      let h = '';
      try { h = (location.hash || '').replace('#', ''); } catch (e) { h = ''; }
      if (!PAGES[h] || ['report', 'lesson', 'game', 'speech', 'class', 'review'].includes(h)) h = h ? routeRef.current.page : 'home';
      if (h !== routeRef.current.page) setRoute({ page: h });
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('popstate', onHash); };
  }, []);
  useEffect(() => { try { if (HOT && HOT.snapshot) HOT.snapshot(() => ({ route: routeRef.current })); } catch (e) { /* optional */ } }, []);
  const tab = TAB_OF[route.page] || 'home';
  const door = typeof Platform !== 'undefined' && Platform.config && Platform.accountsRequired && !Platform.signedIn;
  if (door && route.page !== 'privacy') return html`<${Fragment}><${AuthPage} onDone=${(page) => { if (page) Router.go(page); }} /><${FxLayer} /><//>`;
  if (door) return html`<div className="app"><main className="main" id="main"><div className="page" style=${{ paddingTop: 24 }}><button className="btn btn-sm back" onClick=${() => Router.go('home')}><${Icon} name="arrowL" size=${16} />${t('Sign in')}</button><${PrivacyPage} /></div></main></div>`;
  const Page = PAGES[route.page] || HomePage;
  const key = route.page + ':' + (typeof route.param === 'string' ? route.param : route.param ? 'draft' : '');
  return html`<div className="app">
    <${Rail} tab=${tab} />
    <main className="main" id="main">
      <${TopBar} route=${route} />
      <div className="page" key=${key}><${ErrorBoundary} key=${key}><${Page} param=${route.param} id=${route.param} /><//></div>
    </main>
    <${TabBar} tab=${tab} />
    ${coach != null ? html`<${CoachDrawer} seed=${coach} onClose=${() => setCoach(null)} />` : null}
    <${FxLayer} />
  </div>`;
}
async function start(data) {
  /* On the web, find out first whether accounts are required, so the right first screen paints once. */
  if (!(window.claude && window.claude.use) && typeof Platform !== 'undefined') { try { await Platform.init(); } catch (e) { /* local mode */ } }
  bootStore();
  AI.init();
  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} initial=${data || {}} />`);
}
if (HOT && HOT.ready) HOT.ready(start); else start((HOT && HOT.data) || {});
