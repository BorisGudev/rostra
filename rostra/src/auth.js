/* ================================================================
   Accounts: the sign-in screen, the account page and the small helpers around them.
   Students join with a class code, a name, a username and a password. No email is asked of them.
   Teachers join with their school's invite code and an email. Everything goes through Platform.
   ================================================================ */
const AUTH_MIN_PASSWORD = 8;

function authErrorText(e) {
  const c = e && e.code;
  if (c === 'bad_login') return 'That name or password is not right. Check both and try again.';
  if (c === 'bad_code') return e.message || 'That code is not right.';
  if (c === 'taken') return 'That username is taken. Try another.';
  if (c === 'weak_password') return `Use a password of at least ${AUTH_MIN_PASSWORD} characters.`;
  if (c === 'network') return 'The server could not be reached. Check your connection and try again.';
  if (c === 'unavailable') return 'Accounts are not set up on this server yet.';
  return (e && e.message) || 'Something went wrong. Try again.';
}

function LangSwitch({ className = '' }) {
  const [lang, setLang] = useState(() => (typeof Platform !== 'undefined' ? Platform.lang : 'en'));
  const pick = (l) => { setLang(l); if (typeof Platform !== 'undefined') Platform.setLang(l); };
  return html`<div className=${'seg lang-switch ' + className} role="group" aria-label="Language">
    <button type="button" className=${lang === 'en' ? 'is-on' : ''} aria-pressed=${lang === 'en'} onClick=${() => pick('en')} lang="en">English</button>
    <button type="button" className=${lang === 'bg' ? 'is-on' : ''} aria-pressed=${lang === 'bg'} onClick=${() => pick('bg')} lang="bg">Български</button>
  </div>`;
}

/* The door: shown instead of the app while accounts are required and nobody is signed in. */
function AuthPage({ onDone }) {
  const [tab, setTab] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ login: '', password: '', classCode: '', inviteCode: '', displayName: '', username: '', email: '' });
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); if (err) setErr(''); };
  const tabs = [['signin', 'Sign in'], ['student', 'Join as a student'], ['teacher', 'Join as a teacher']];
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    try {
      if (tab === 'signin') await Platform.signIn({ login: f.login, password: f.password });
      else if (tab === 'student') await Platform.signUp({ kind: 'student', classCode: f.classCode, displayName: f.displayName, username: f.username, password: f.password, lang: Platform.lang });
      else await Platform.signUp({ kind: 'teacher', inviteCode: f.inviteCode, email: f.email, displayName: f.displayName, password: f.password, lang: Platform.lang });
      if (onDone) onDone();
    } catch (ex) { setErr(authErrorText(ex)); }
    finally { setBusy(false); }
  }
  const pw = html`<div className="field"><label htmlFor="au-pw">Password</label><input id="au-pw" className="input" type="password" value=${f.password} onInput=${set('password')} autoComplete=${tab === 'signin' ? 'current-password' : 'new-password'} minLength=${tab === 'signin' ? undefined : AUTH_MIN_PASSWORD} required />${tab !== 'signin' ? html`<span className="hint">At least ${AUTH_MIN_PASSWORD} characters. Pick one you will remember: there is no email to reset it with.</span>` : null}</div>`;
  return html`<div className="auth">
    <div className="auth-stage stage" aria-hidden="true">
      <${Stoa} scores=${{ ethos: 72, pathos: 64, logos: 80 }} height=${320} interactive=${false} intensity=${0.9} />
    </div>
    <main className="auth-main" id="main">
      <header className="auth-head">
        <span className="logo" style=${{ padding: 0 }}><${LogoMark} size=${30} /><span><span className="logo-word">Rostra</span><span className="logo-sub" lang="grc">τέχνη ῥητορική</span></span></span>
        <${LangSwitch} />
      </header>
      <section className="auth-card card" aria-labelledby="auth-title">
        <div className="eyebrow">Speak better <span className="greek" lang="grc">λέγειν εὖ</span></div>
        <h1 id="auth-title" className="auth-title">Rehearse the exam. Hear the verdict.</h1>
        <p className="lead">An examiner who listens, follows up and grades. Feedback on every speech. Built for schools.</p>
        <div className="seg auth-tabs" role="tablist" aria-label="Sign in or join">
          ${tabs.map(([id, label]) => html`<button key=${id} type="button" role="tab" aria-selected=${tab === id} className=${tab === id ? 'is-on' : ''} onClick=${() => { setTab(id); setErr(''); }}>${label}</button>`)}
        </div>
        <form className="stack auth-form" onSubmit=${submit} noValidate=${false}>
          ${tab === 'signin' ? html`<${Fragment}>
            <div className="field"><label htmlFor="au-login">Username or email</label><input id="au-login" className="input" value=${f.login} onInput=${set('login')} autoComplete="username" required autoFocus /></div>
            ${pw}
          <//>` : null}
          ${tab === 'student' ? html`<${Fragment}>
            <div className="field"><label htmlFor="au-code">Class code from your teacher</label><input id="au-code" className="input auth-code" value=${f.classCode} onInput=${set('classCode')} placeholder="A1B2C3" autoComplete="off" autoCapitalize="characters" maxLength="12" required autoFocus /></div>
            <div className="field"><label htmlFor="au-name">Your name, as your teacher knows it</label><input id="au-name" className="input" value=${f.displayName} onInput=${set('displayName')} autoComplete="name" maxLength="60" required /></div>
            <div className="field"><label htmlFor="au-user">Username</label><input id="au-user" className="input" value=${f.username} onInput=${set('username')} autoComplete="username" placeholder="e.g. maria.p" maxLength="32" required /><span className="hint">Letters, digits, dots. You sign in with this, so no email is needed.</span></div>
            ${pw}
          <//>` : null}
          ${tab === 'teacher' ? html`<${Fragment}>
            <div className="field"><label htmlFor="au-invite">School invite code</label><input id="au-invite" className="input auth-code" value=${f.inviteCode} onInput=${set('inviteCode')} placeholder="From your school’s Rostra contact" autoComplete="off" autoCapitalize="characters" maxLength="12" required autoFocus /></div>
            <div className="field"><label htmlFor="au-tname">Your name</label><input id="au-tname" className="input" value=${f.displayName} onInput=${set('displayName')} autoComplete="name" maxLength="60" required /></div>
            <div className="field"><label htmlFor="au-email">School email</label><input id="au-email" className="input" type="email" value=${f.email} onInput=${set('email')} autoComplete="email" required /></div>
            ${pw}
          <//>` : null}
          ${err ? html`<p className="notice notice-warn auth-err" role="alert"><${Icon} name="alert" size=${18} /><span>${err}</span></p>` : null}
          <button className="btn-cta wide" type="submit" disabled=${busy}>${busy ? html`<span className="spin"></span>One moment…` : tab === 'signin' ? 'Sign in' : tab === 'student' ? 'Join my class' : 'Create my teacher account'}</button>
        </form>
        <p className="tiny muted auth-foot">Rostra stores your name, username and your work, in the EU, for your school. Nothing else. <a href="#privacy" onClick=${(e) => { e.preventDefault(); if (onDone) onDone('privacy'); }}>How your data is handled</a>.</p>
      </section>
    </main>
  </div>`;
}

/* Account page: who you are, language, join another class, delete everything. */
function AccountPage() {
  const { profile: p, backend } = useStore();
  const user = typeof Platform !== 'undefined' ? Platform.user : null;
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState('');
  const [school, setSchool] = useState('');
  const [created, setCreated] = useState(null);
  const [classes, setClasses] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user || !Platform.sb || user.role !== 'student') return;
      try {
        const { data } = await Platform.sb.from('class_members').select('class_id, classes(name, code)').eq('student_id', user.id);
        if (alive) setClasses((data || []).map((r) => (r.classes ? r.classes : { name: 'A class', code: '' })));
      } catch (e) { if (alive) setClasses([]); }
    })();
    return () => { alive = false; };
  }, [user && user.id]);
  async function join(e) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy('join'); setMsg('');
    try {
      const { data, error } = await Platform.sb.rpc('join_class', { p_code: code.trim() });
      if (error || !data) throw new Error('That class code is not right.');
      setMsg('You joined the class.'); setCode('');
      setClasses(null);
    } catch (ex) { setMsg(ex.message || 'That did not work.'); }
    finally { setBusy(''); }
  }
  async function erase() {
    setBusy('delete');
    try {
      if (user) await Platform.deleteAccount();
      await Store.resetAll();
      Store.signOutLocal();
      toast('Your account and all your work were deleted.');
      go('home');
    } catch (ex) { toast(authErrorText(ex), 'bad'); }
    finally { setBusy(''); setConfirm(false); }
  }
  async function createSchool(e) {
    e.preventDefault();
    if (!school.trim() || busy) return;
    setBusy('school');
    try { const r = await Platform.account('create-school', { name: school.trim() }); setCreated(r.school); setSchool(''); }
    catch (ex) { toast(authErrorText(ex), 'bad'); }
    finally { setBusy(''); }
  }
  return html`<div className="stack" style=${{ gap: 22 }}>
    <${PageHead} label="Account" greek="πρόσωπον" title=${user ? user.displayName || p.name || 'Your account' : p.name || 'Your account'} line=${user ? `${user.role === 'teacher' ? 'Teacher' : user.role === 'admin' ? 'School admin' : 'Student'}${user.username ? ' · ' + user.username : user.email ? ' · ' + user.email : ''}` : 'Saved in this browser only. Sign in to keep your work across devices.'} />
    <section className="grid-2">
      <div className="card stack" style=${{ gap: 12 }}>
        <div className="eyebrow">Language <span className="greek" lang="grc">γλῶσσα</span></div>
        <p className="small muted">The interface, the examiner and the coach answer in this language.</p>
        <${LangSwitch} />
      </div>
      <div className="card stack" style=${{ gap: 12 }}>
        <div className="eyebrow">Where your work lives</div>
        <p className="small">${backend === 'db' ? 'In your school’s Rostra account, stored in the EU (Frankfurt). Your teachers can see your exams and speeches for the classes you are in.' : 'In this browser only. Clearing the browser removes it.'}</p>
        ${user ? html`<button className="btn" onClick=${async () => { await Platform.signOut(); }}><${Icon} name="vivaDoor" size=${16} />Sign out</button>` : null}
      </div>
    </section>
    ${user && user.role === 'student' ? html`<section className="card stack" style=${{ gap: 12 }}>
      <div className="eyebrow">Your classes</div>
      ${classes == null ? html`<p className="small muted">Loading…</p>` : classes.length ? html`<ul className="list-plain">${classes.map((c, i) => html`<li key=${i}><b>${c.name}</b></li>`)}</ul>` : html`<p className="small muted">You are not in a class yet.</p>`}
      <form className="row" onSubmit=${join} style=${{ gap: 8 }}>
        <input className="input auth-code" value=${code} onInput=${(e) => setCode(e.target.value)} placeholder="Class code" aria-label="Class code" maxLength="12" style=${{ maxWidth: 180 }} />
        <button className="btn" type="submit" disabled=${busy === 'join' || !code.trim()}>Join a class</button>
        ${msg ? html`<span className="hint">${msg}</span>` : null}
      </form>
    </section>` : null}
    ${user && (user.role === 'admin' || !user.schoolId) && user.email ? html`<section className="card stack" style=${{ gap: 12 }}>
      <div className="eyebrow">For the Rostra team</div>
      <p className="small muted">Create a school and get the invite code its teachers use to join. Only the admin emails set on the server can do this.</p>
      <form className="row" onSubmit=${createSchool} style=${{ gap: 8 }}>
        <input className="input" value=${school} onInput=${(e) => setSchool(e.target.value)} placeholder="School name" aria-label="School name" style=${{ maxWidth: 280 }} />
        <button className="btn" type="submit" disabled=${busy === 'school' || !school.trim()}>Create school</button>
      </form>
      ${created ? html`<p className="notice notice-gold"><${Icon} name="gift" size=${18} /><span><b>${created.name}</b> is ready. Teacher invite code: <code className="auth-code-out">${created.invite_code}</code></span></p>` : null}
    </section>` : null}
    <section className="card stack" style=${{ gap: 12 }}>
      <div className="eyebrow">Your data</div>
      <p className="small">You can delete everything Rostra holds about you: your profile, speeches, drafts and exams${user ? ', and your login' : ''}. This cannot be undone.</p>
      ${confirm ? html`<div className="row" style=${{ gap: 8 }}><button className="btn btn-ink" onClick=${erase} disabled=${busy === 'delete'}>${busy === 'delete' ? 'Deleting…' : 'Yes, delete everything'}</button><button className="btn" onClick=${() => setConfirm(false)}>Keep my work</button></div>`
        : html`<button className="btn" onClick=${() => setConfirm(true)}><${Icon} name="trash" size=${16} />Delete my account and data</button>`}
      <p className="tiny muted"><a href="#privacy" onClick=${(e) => { e.preventDefault(); go('privacy'); }}>How your data is handled</a></p>
    </section>
  </div>`;
}

/* Plain-words privacy page: what is stored, where, who sees it, how to delete it. */
function PrivacyPage() {
  const user = typeof Platform !== 'undefined' ? Platform.user : null;
  return html`<div className="stack prose-page" style=${{ gap: 18 }}>
    <${PageHead} label="Privacy" greek="ἀπόρρητον" title="How Rostra handles your data" line="Short, in plain words. Ask your teacher or the Rostra team if anything is unclear." />
    <div className="card prose">
      <h2>What we store</h2>
      <p>Your display name, your username and your work: speeches you analyze, drafts you write, oral exams you sit and the reports they produce. Teachers also give an email address. Students do not.</p>
      <h2>What we do not keep</h2>
      <p>The audio of your spoken answers. It is turned into text, measured for pace and pauses on your device, and discarded. Rostra does not read emotions from your voice or face, and does not use cameras.</p>
      <h2>Where it lives</h2>
      <p>In a database in Frankfurt, Germany (European Union), run by Supabase for Rostra. The AI examiner and coach run on Anthropic’s Claude; only the text of your answers and speeches is sent, under Rostra’s account, never your name or email. Transcription, when a server service is used, receives only the audio of one answer at a time.</p>
      <h2>Who can see it</h2>
      <p>You. The teachers of the classes you are in, who see your exams, speeches and progress as part of their teaching. Nobody else, and nothing is sold or used for advertising.</p>
      <h2>Your rights</h2>
      <p>You can delete everything from the Account page at any time. Your school is the data controller; Rostra processes data on its behalf. For questions, write to your school’s Rostra contact.</p>
      ${user ? html`<p><button className="btn" onClick=${() => go('account')}>Go to my account</button></p>` : null}
    </div>
  </div>`;
}
