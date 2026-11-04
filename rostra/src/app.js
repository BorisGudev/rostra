/* ================================================================
   App shell, routing and boot
   ================================================================ */
const NAV = [
  { id: 'home', label: 'Home', icon: 'home', greek: 'ἑστία', gloss: 'hestia: the hearth at the center of a Greek house' },
  { id: 'analyze', label: 'Analyze', icon: 'mic', greek: 'ἀνάλυσις', gloss: 'analysis: a loosening up, the source of our word' },
  { id: 'prepare', label: 'Prepare', icon: 'pen', greek: 'παρασκευή', gloss: 'paraskeuē: preparation' },
  { id: 'viva', label: 'Oral exam', icon: 'scroll', greek: 'ἐξέτασις', gloss: 'exetasis: examination, the word behind Socrates’ unexamined life' },
  { id: 'gym', label: 'Gym', icon: 'dumbbell', greek: 'γυμνάσιον', gloss: 'gymnasion: the source of our word gym' },
  { id: 'learn', label: 'Learn', icon: 'book', greek: 'μάθησις', gloss: 'mathēsis: learning' },
  { id: 'library', label: 'Library', icon: 'columns', greek: 'βιβλιοθήκη', gloss: 'bibliothēkē: a place for books' },
  { id: 'trophies', label: 'Trophies', icon: 'trophy', greek: 'τρόπαιον', gloss: 'tropaion: a victory monument, the source of our word trophy' },
];
const TAB_OF = { home: 'home', analyze: 'analyze', report: 'analyze', prepare: 'prepare', learn: 'learn', lesson: 'learn', game: 'learn', library: 'library', speech: 'library', trophies: 'trophies', viva: 'viva', gym: 'gym' };
const BACK = { report: ['analyze', 'Analyze'], lesson: ['learn', 'Academy'], game: ['learn', 'Academy'], speech: ['library', 'Library'] };
const PAGES = { home: HomePage, analyze: AnalyzePage, report: ReportPage, prepare: PreparePage, learn: LearnPage, lesson: LessonPage, game: GamePage, library: LibraryPage, speech: SpeechPage, trophies: TrophiesPage, viva: VivaPage, gym: GymPage };

function Rail({ tab }) {
  const { profile: p, backend, storageOk } = useStore();
  const li = levelInfo(p.xp);
  const fresh = (p.lessons || []).some((l) => !lessonDone(p, l.id));
  return html`<aside className="rail">
    <button className="logo" onClick=${() => go('home')} aria-label="Rostra home"><${LogoMark} size=${32} /><span><span className="logo-word">Rostra</span><span className="logo-sub" lang="grc">τέχνη ῥητορική</span></span></button>
    <nav className="stack" style=${{ gap: 4 }} aria-label="Main">
      ${NAV.map((n) => html`<button key=${n.id} className=${'nav-item' + (tab === n.id ? ' is-on' : '')} onClick=${() => go(n.id)} aria-current=${tab === n.id ? 'page' : undefined}><span className="nav-label">${n.label}${n.id === 'learn' && fresh ? html`<span className="nav-dot" title="New lessons for you"></span>` : null}</span><span className="greek nav-greek" lang="grc" title=${n.gloss}>${n.greek}</span></button>`)}
    </nav>
    <div className="rail-foot">
      <button className="rail-level" onClick=${() => go('trophies')}>
        <div className="row" style=${{ gap: 10, flexWrap: 'nowrap' }}><${LevelBadge} level=${li.level} size=${42} /><div style=${{ minWidth: 0 }}><b style=${{ display: 'block' }}>${li.title}</b><span className="greek rail-rank" lang="grc">${li.greek}</span><span className="tiny muted num" style=${{ display: 'block' }}>${li.into} / ${li.need} XP</span></div></div>
        <${Bar} value=${li.progress * 100} className="bar-xp" />
      </button>
      <button className="nav-item" onClick=${() => Router.coach('')}><span className="nav-label">Ask the coach</span><span className="greek nav-greek" lang="grc" title="symboulos: adviser">σύμβουλος</span></button>
      ${storageOk === false
        ? html`<div className="rail-store is-bad" title="Browser storage is full or blocked, so your latest work may not survive a reload."><${Icon} name="alert" size=${14} />Not saving</div>`
        : html`<div className="rail-store"><${Icon} name=${backend === 'db' ? 'cloud' : 'laptop'} size=${14} />${backend === 'db' ? 'Synced to your account' : 'Saved in this browser'}</div>`}
    </div>
  </aside>`;
}
function TopBar({ route }) {
  const { profile: p } = useStore();
  const li = levelInfo(p.xp);
  const live = liveStreak(p);
  const back = route.page === 'prepare' && route.param ? ['prepare', 'Drafts'] : BACK[route.page];
  const [snd, setSnd] = useState(Sound.enabled);
  useEffect(() => setSnd(p.settings.sound !== false), [p.settings.sound]);
  const toggleSound = () => { const v = !Sound.enabled; setSnd(v); setSoundOn(v); };
  return html`<header className="topbar">
    <div className="topbar-title">
      ${back ? html`<button className="btn btn-sm back" onClick=${() => go(back[0])}><${Icon} name="arrowL" size=${16} />${back[1]}</button>`
        : html`<button className="logo mobile-only" style=${{ padding: 0 }} onClick=${() => go('home')} aria-label="Rostra home"><${LogoMark} size=${28} /><span className="logo-word">Rostra</span></button>`}
    </div>
    <span className=${'stat-chip flame' + (live ? '' : ' cold')} title=${live ? `${live}-day streak` : 'No active streak'}><${Icon} name="flame" size=${18} />${live}</span>
    <span id="xp-chip" className="stat-chip xp" title="Total XP"><${Icon} name="bolt" size=${18} />${p.xp.toLocaleString()}</span>
    <button className="lvl-pill" onClick=${() => go('trophies')} title=${`Level ${li.level}: ${li.title}. Badges`}><span className="lvl-num" lang="grc">${greekNumeral(li.level)}</span><span className="lvl-title">${li.title}</span></button>
    <button className="btn btn-icon btn-ghost hide-sm" onClick=${toggleSound} aria-label=${snd ? 'Mute sounds' : 'Turn sounds on'}><${Icon} name=${snd ? 'volume' : 'volumeOff'} /></button>
    <button className="btn btn-ink hide-sm" onClick=${() => Router.coach('')}><${Icon} name="message" size=${17} />Coach</button>
    <button className="btn btn-ink btn-icon show-sm" onClick=${() => Router.coach('')} aria-label="Ask the coach"><${Icon} name="message" size=${18} /></button>
  </header>`;
}
function setSoundOn(v) { Sound.enabled = v; Store.act((pp) => { pp.settings.sound = v; }); if (v) Sound.play('tap'); }
const TAB_IDS = ['home', 'analyze', 'prepare', 'viva'];
const MORE_IDS = ['learn', 'gym', 'library', 'trophies'];
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
    <div className="sheet" role="dialog" aria-modal="true" aria-label="More">
      <div className="row-between"><h2 className="sheet-title">More</h2><button className="btn btn-ghost btn-sm btn-icon" onClick=${onClose} aria-label="Close"><${Icon} name="x" size=${18} /></button></div>
      <nav className="stack" style=${{ gap: 4 }} aria-label="More pages">
        ${MORE_IDS.map((id) => NAV.find((n) => n.id === id)).map((n, i) => html`<button key=${n.id} ref=${i === 0 ? first : null} className=${'nav-item' + (tab === n.id ? ' is-on' : '')} onClick=${() => { onClose(); go(n.id); }} aria-current=${tab === n.id ? 'page' : undefined}><${Icon} name=${n.icon} /><span className="nav-label">${n.label}${n.id === 'learn' && fresh ? html`<span className="nav-dot" title="New lessons for you"></span>` : null}</span><span className="greek nav-greek" lang="grc">${n.greek}</span></button>`)}
      </nav>
      <button className="nav-item sheet-toggle" role="switch" aria-checked=${soundOn} onClick=${() => setSoundOn(!soundOn)}><${Icon} name=${soundOn ? 'volume' : 'volumeOff'} />Sound<span className="chip chip-sm">${soundOn ? 'On' : 'Off'}</span></button>
      ${storageOk === false ? html`<p className="hint">Browser storage is full or blocked, so your latest work may not survive a reload.</p>` : null}
    </div>
  </div>`;
}
function TabBar({ tab }) {
  const [more, setMore] = useState(false);
  const moreBtn = useRef(null);
  const closeMore = () => { setMore(false); if (moreBtn.current && moreBtn.current.focus) moreBtn.current.focus(); };
  const moreOn = MORE_IDS.includes(tab);
  return html`<${Fragment}>
    <nav className="tabbar" aria-label="Main">
      ${NAV.filter((n) => TAB_IDS.includes(n.id)).map((n) => html`<button key=${n.id} className=${'tab' + (tab === n.id ? ' is-on' : '')} onClick=${() => go(n.id)} aria-current=${tab === n.id ? 'page' : undefined}><${Icon} name=${n.icon} size=${22} />${n.label}</button>`)}
      <button ref=${moreBtn} className=${'tab' + (moreOn ? ' is-on' : '')} onClick=${() => setMore(true)} aria-haspopup="dialog" aria-expanded=${more} aria-current=${moreOn ? 'page' : undefined}><${Icon} name="more" size=${22} stroke=${3} />More</button>
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
      return html`<div className="card empty"><${Icon} name="alert" size=${30} /><h2>Something broke on this page</h2><p className="small">Your work is saved. Go back Home and try again.</p><button className="btn" onClick=${() => { this.setState({ err: null }); go('home'); }}>Back to Home</button></div>`;
    }
    return this.props.children;
  }
}
const HOT = (window.claude && window.claude.hot) || null;
function App({ initial }) {
  useStore();
  const [route, setRoute] = useState(() => {
    if (initial && initial.route && PAGES[initial.route.page]) return initial.route;
    let h = '';
    try { h = (location.hash || '').replace('#', ''); } catch (e) { h = ''; }
    return PAGES[h] && !['report', 'lesson', 'game', 'speech'].includes(h) ? { page: h } : { page: 'home' };
  });
  const [coach, setCoach] = useState(null);
  const routeRef = useRef(route);
  routeRef.current = route;
  Router.go = (page, param) => { setRoute({ page, param }); try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } };
  Router.coach = (seed) => setCoach(seed || '');
  useEffect(() => { try { if (HOT && HOT.snapshot) HOT.snapshot(() => ({ route: routeRef.current })); } catch (e) { /* optional */ } }, []);
  const tab = TAB_OF[route.page] || 'home';
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
function start(data) {
  bootStore();
  AI.init();
  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} initial=${data || {}} />`);
}
if (HOT && HOT.ready) HOT.ready(start); else start((HOT && HOT.data) || {});
