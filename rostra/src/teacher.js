/* ================================================================
   Teachers: classes, assignments and results. Everything reads and writes through the signed-in
   teacher's own Supabase client, so Row Level Security decides what they may see.
   Students: the assignments card on Home, and submissions when work is finished.
   ================================================================ */
const Teach = {
  sb() { return typeof Platform !== 'undefined' ? Platform.sb : null; },
  me() { return typeof Platform !== 'undefined' ? Platform.user : null; },
  async q(promise) {
    const { data, error } = await promise;
    if (error) { const e = new Error(error.message || t('The database did not answer')); e.code = error.code; throw e; }
    return data;
  },
  classes() { return this.q(this.sb().from('classes').select('*').eq('teacher_id', this.me().id).order('created_at', { ascending: true })); },
  createClass(name) { return this.q(this.sb().from('classes').insert({ name, teacher_id: this.me().id, school_id: this.me().schoolId }).select('*').single()); },
  archiveClass(id, archived) { return this.q(this.sb().from('classes').update({ archived }).eq('id', id)); },
  newCode(id) { return this.q(this.sb().from('classes').update({ code: teachCode() }).eq('id', id).select('code').single()); },
  removeStudent(classId, studentId) { return this.q(this.sb().from('class_members').delete().eq('class_id', classId).eq('student_id', studentId)); },
  students(classId) { return this.q(this.sb().from('teacher_students').select('*').eq('class_id', classId)); },
  assignments(classId) { return this.q(this.sb().from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false })); },
  createAssignment(a) { return this.q(this.sb().from('assignments').insert({ ...a, teacher_id: this.me().id }).select('*').single()); },
  deleteAssignment(id) { return this.q(this.sb().from('assignments').delete().eq('id', id)); },
  submissions(assignmentIds) { return assignmentIds.length ? this.q(this.sb().from('submissions').select('*').in('assignment_id', assignmentIds)) : Promise.resolve([]); },
  studentDocs(studentId) { return this.q(this.sb().from('docs').select('id, type, body, updated_at').eq('user_id', studentId)); },
  doc(studentId, docId) { return this.q(this.sb().from('docs').select('body').eq('user_id', studentId).eq('id', docId).maybeSingle()); },
  /* Students */
  myAssignments() { return this.q(this.sb().from('assignments').select('*, classes(name)').order('created_at', { ascending: false })); },
  mySubmissions() { return this.q(this.sb().from('submissions').select('*').eq('student_id', this.me().id)); },
};
/* Six upper-case letters or digits, made in the browser. The column is unique, so a clash fails loudly and the teacher presses again. */
function teachCode() { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => A[b % A.length]).join(''); }

/* What a finished piece of work tells the teacher. */
function teachSummaryOf(doc) {
  if (!doc) return null;
  if (doc.type === 'viva') {
    const r = doc.report || {};
    return { kind: 'viva', title: doc.subject || t('Oral exam'), percent: r.percent != null ? r.percent : null, grade: r.grade || null, source: r.source || null, finished: doc.finished || doc.updated || null, mode: doc.mode || null, micFallback: !!doc.micFallback };
  }
  if (doc.type === 'speech') {
    const sc = doc.scores || {};
    const vals = POLE_KEYS.map((k) => sc[k]).filter((v) => v != null);
    return { kind: 'speech', title: doc.title || t('Speech'), percent: vals.length ? Math.round(mean(vals)) : null, grade: null, scores: sc, finished: doc.date || doc.updated || null, words: doc.words || null };
  }
  return null;
}
function TeachPct({ value, grade, source }) {
  /* A self-assessed exam (the AI marking failed, so the student marked themselves) is practice, not a mark. */
  if (source === 'self') return html`<span className="teach-pct g-self" title=${t('The examiner could not mark this exam, so the student marked themselves. Practice only.')}>${t('Self-assessed')}${value != null ? html` <span className="num">${value}%</span>` : null}</span>`;
  const g = grade ? String(grade).toLowerCase().replace(/\s+/g, '-') : value == null ? 'none' : value >= 85 ? 'distinction' : value >= 70 ? 'merit' : value >= 55 ? 'pass' : 'not-yet';
  return html`<span className=${'teach-pct g-' + g} title=${grade || ''}>${value == null ? '–' : value + '%'}</span>`;
}
function TeachSpark({ values }) {
  const vs = (values || []).slice(-8);
  const max = Math.max(1, ...vs.map((v) => v || 0));
  return html`<span className="spark" aria-label=${vs.length ? t('Last results:') + ' ' + vs.join(', ') : t('No results yet')}>${vs.map((v, i) => html`<i key=${i} className=${i === vs.length - 1 ? 'on' : ''} style=${{ height: Math.max(3, Math.round(((v || 0) / max) * 22)) + 'px' }}></i>`)}</span>`;
}

/* ---------- Teacher home: my classes ---------- */
function TeacherPage() {
  const me = Teach.me();
  const [classes, setClasses] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const load = async () => { try { setClasses(await Teach.classes()); } catch (e) { setErr(e.message); setClasses([]); } };
  useEffect(() => { if (me && Teach.sb()) load(); else setClasses([]); }, [me && me.id]);
  async function create(e) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setErr('');
    try { const c = await Teach.createClass(name.trim().slice(0, 60)); setName(''); setClasses((cs) => [...(cs || []), c]); toast(t`Class “${c.name}” created. Code: ${c.code}`, 'gold'); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }
  if (!me || !Teach.sb()) return html`<div className="card empty"><${Icon} name="users" size=${30} /><h2>${t('Classes need an account')}</h2><p className="small">${t('Sign in as a teacher to create classes and set work.')}</p></div>`;
  const live = (classes || []).filter((c) => !c.archived);
  const old = (classes || []).filter((c) => c.archived);
  return html`<div className="stack" style=${{ gap: 22 }}>
    <${PageHead} label=${t('Teacher')} greek="διδάσκαλος" title=${t('Your classes')} line=${t('Create a class, give students its code, set an exam or a speech, and watch the results come in.')} />
    <form className="card row" onSubmit=${create} style=${{ gap: 10, alignItems: 'end' }}>
      <div className="field" style=${{ flex: '1 1 240px' }}><label htmlFor="tc-name">${t('New class')}</label><input id="tc-name" className="input" value=${name} onInput=${(e) => setName(e.target.value)} placeholder=${t('e.g. 10B English, Debate club')} maxLength="60" /></div>
      <button className="btn-cta" type="submit" disabled=${busy || !name.trim()}><${Icon} name="plus" size=${17} />${t('Create class')}</button>
      ${err ? html`<span className="hint" style=${{ color: 'var(--bad)' }}>${err}</span>` : null}
    </form>
    ${classes == null ? html`<p className="muted">${t('Loading your classes…')}</p>` : !live.length ? html`<div className="card empty"><${Icon} name="users" size=${30} /><h2>${t('No classes yet')}</h2><p className="small">${t('Create one above. You get a six-character code; students join with it from the sign-in page.')}</p></div>`
      : html`<div className="teach-grid">${live.map((c) => html`<button key=${c.id} className="tile-btn teach-class" onClick=${() => go('class', c.id)}>
          <span className="tile-ic"><${Icon} name="users" /></span>
          <h3>${c.name}</h3>
          <span className="teach-code">${t`Code ${c.code}`}</span>
          <span className="small muted">${t`Created ${fmtDate(c.created_at)}`}</span>
        </button>`)}</div>`}
    ${old.length ? html`<details className="details"><summary><b>${t`Archived classes (${old.length})`}</b></summary><ul className="list-plain" style=${{ marginTop: 8 }}>${old.map((c) => html`<li key=${c.id} className="row-between"><span>${c.name}</span><button className="btn btn-sm" onClick=${async () => { await Teach.archiveClass(c.id, false); load(); }}>${t('Restore')}</button></li>`)}</ul></details>` : null}
  </div>`;
}

/* ---------- One class: students, assignments, results ---------- */
const TEACH_VIVA_FORMATS = ['quick', 'standard', 'qualifying'];
function teachNewAssignment(kind) {
  return kind === 'viva'
    ? { kind: 'viva', title: '', config: { subject: '', topic: '', level: 'school', format: 'quick', persona: 'socratic', discipline: 'general', material: '', mode: 'speak' } }
    : { kind: 'speech', title: '', config: { occasion: 'presentation', minutes: 3, brief: '' } };
}
function ClassPage({ id }) {
  const me = Teach.me();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [subs, setSubs] = useState([]);
  const [progress, setProgress] = useState({});
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState('');
  const [reset, setReset] = useState(null);
  const [err, setErr] = useState('');
  async function load() {
    try {
      const cs = await Teach.classes();
      const c = cs.find((x) => x.id === id) || null;
      setCls(c);
      if (!c) return;
      const [st, as] = await Promise.all([Teach.students(id), Teach.assignments(id)]);
      setStudents(st); setAssignments(as);
      setSubs(await Teach.submissions(as.map((a) => a.id)));
      /* Progress per student: every finished exam and speech, newest last. */
      const prog = {};
      await Promise.all(st.map(async (s) => {
        try {
          const docs = await Teach.studentDocs(s.student_id);
          const items = docs.map((d) => ({ id: d.id, ...teachSummaryOf({ ...d.body, type: d.type }), updated: d.updated_at })).filter((x) => x.kind).sort((a, b) => (a.finished || 0) - (b.finished || 0));
          prog[s.student_id] = items;
        } catch (e) { prog[s.student_id] = []; }
      }));
      setProgress(prog);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { if (me && Teach.sb()) load(); }, [id, me && me.id]);
  async function saveAssignment(e) {
    e.preventDefault();
    if (!draft || busy) return;
    const title = draft.title.trim() || (draft.kind === 'viva' ? t`Oral exam: ${draft.config.subject}` : t`Speech: ${occasionOf(draft.config.occasion).label}`);
    if (draft.kind === 'viva' && !draft.config.subject.trim()) { setErr(t('Name the subject of the exam.')); return; }
    setBusy('save'); setErr('');
    try { const a = await Teach.createAssignment({ class_id: id, kind: draft.kind, title: title.slice(0, 120), config: draft.config, due_at: draft.due || null }); setAssignments((as) => [a, ...(as || [])]); setDraft(null); toast(t('Assigned. Students see it on their Home page.'), 'gold'); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(''); }
  }
  async function remove(a) {
    if (busy || !window.confirm(t`Remove the assignment “${a.title}”? Its results list goes with it; students keep their own work.`)) return;
    setBusy('del' + a.id);
    try { await Teach.deleteAssignment(a.id); setAssignments((as) => as.filter((x) => x.id !== a.id)); }
    catch (ex) { toast(ex.message, 'bad'); }
    finally { setBusy(''); }
  }
  async function newCode() {
    if (busy || !window.confirm(t('Make a new class code? The old code stops working. Students already in the class stay.'))) return;
    setBusy('code');
    try { const r = await Teach.newCode(cls.id); setCls((c) => ({ ...c, code: r.code })); toast(t`New class code: ${r.code}`, 'gold'); }
    catch (ex) { toast(ex.message, 'bad'); }
    finally { setBusy(''); }
  }
  async function removeStudent(s) {
    if (busy || !window.confirm(t`Remove ${s.display_name} from this class? Their account and work stay; they can rejoin with the class code.`)) return;
    setBusy('rm' + s.student_id);
    try { await Teach.removeStudent(id, s.student_id); setStudents((st) => (st || []).filter((x) => x.student_id !== s.student_id)); }
    catch (ex) { toast(ex.message, 'bad'); }
    finally { setBusy(''); }
  }
  async function doReset(e) {
    e.preventDefault();
    if (!reset || busy) return;
    setBusy('reset');
    try { await Platform.account('reset', { username: reset.username, newPassword: reset.pw }); toast(t`New password set for ${reset.name}.`, 'gold'); setReset(null); }
    catch (ex) { toast(authErrorText(ex), 'bad'); }
    finally { setBusy(''); }
  }
  if (!me || !Teach.sb()) return html`<div className="card empty"><h2>${t('Sign in as a teacher')}</h2></div>`;
  if (cls === null && !err) return html`<p className="muted">${t('Loading…')}</p>`;
  if (!cls) return html`<div className="card empty"><h2>${t('That class isn’t yours')}</h2><button className="btn" onClick=${() => go('teacher')}>${t('All classes')}</button></div>`;
  const setC = (k, v) => setDraft((d) => ({ ...d, config: { ...d.config, [k]: v } }));
  const subsOf = (aid) => subs.filter((s) => s.assignment_id === aid);
  return html`<div className="stack" style=${{ gap: 22 }}>
    <${PageHead} label=${t('Class')} greek="τάξις" title=${cls.name} line=${t`Students join with the code ${cls.code} from the sign-in page.`} end=${html`<div className="row" style=${{ gap: 8 }}><span className="chip auth-code">${cls.code}</span><button className="btn btn-sm" onClick=${newCode} disabled=${busy === 'code'}>${t('New class code')}</button><button className="btn btn-sm" onClick=${async () => { await Teach.archiveClass(cls.id, true); go('teacher'); }}>${t('Archive class')}</button></div>`} />
    ${err ? html`<p className="notice notice-warn"><${Icon} name="alert" size=${18} /><span>${err}</span></p>` : null}

    <section className="stack" style=${{ gap: 12 }}>
      <div className="sec-head"><div><div className="eyebrow">${t('Set work')}</div><h2>${t('Assignments')}</h2></div>
        ${!draft ? html`<div className="row" style=${{ gap: 8 }}><button className="btn-cta" onClick=${() => setDraft(teachNewAssignment('viva'))}><${Icon} name="scroll" size=${17} />${t('Set an oral exam')}</button><button className="btn" onClick=${() => setDraft(teachNewAssignment('speech'))}><${Icon} name="mic" size=${16} />${t('Set a speech')}</button></div>` : null}</div>
      ${draft ? html`<form className="card teach-assign" onSubmit=${saveAssignment}>
        <div className="field"><label htmlFor="ta-title">${t('Title students see')}</label><input id="ta-title" className="input" value=${draft.title} onInput=${(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder=${draft.kind === 'viva' ? t('e.g. Photosynthesis, oral check') : t('e.g. Three-minute persuasive speech')} maxLength="120" /></div>
        ${draft.kind === 'viva' ? html`<${Fragment}>
          <div className="grid-2">
            <div className="field"><label htmlFor="ta-subject">${t('Subject')}</label><input id="ta-subject" className="input" value=${draft.config.subject} onInput=${(e) => setC('subject', e.target.value)} placeholder=${t('Photosynthesis')} maxLength="120" required /></div>
            <div className="field"><label htmlFor="ta-topic">${t('Topic focus (optional)')}</label><input id="ta-topic" className="input" value=${draft.config.topic} onInput=${(e) => setC('topic', e.target.value)} placeholder=${t('Light reactions and the Calvin cycle')} maxLength="300" /></div>
          </div>
          <div className="field"><span className="label">${t('Length')}</span><div className="row" style=${{ gap: 6 }}>${TEACH_VIVA_FORMATS.map((f) => html`<button key=${f} type="button" className="chip" aria-pressed=${draft.config.format === f} onClick=${() => setC('format', f)}>${t`${VIVA_FORMATS[f].label} · ${VIVA_FORMATS[f].n} questions`}</button>`)}</div></div>
          <div className="field"><span className="label">${t('Level')}</span><div className="row" style=${{ gap: 6 }}>${VIVA_LEVELS.map((l) => html`<button key=${l.id} type="button" className="chip" aria-pressed=${draft.config.level === l.id} onClick=${() => setC('level', l.id)}>${l.label}</button>`)}</div></div>
          <div className="field"><span className="label">${t('Examiner')}</span><div className="row" style=${{ gap: 6 }}>${Object.values(VIVA_PERSONAS).filter((p) => !p.examiners || p.examiners.length === 1 || draft.config.format === 'qualifying').map((p) => html`<button key=${p.id} type="button" className="chip" aria-pressed=${draft.config.persona === p.id} onClick=${() => setC('persona', p.id)}>${p.label}</button>`)}</div></div>
          <div className="field"><label htmlFor="ta-material">${t('Course material (optional)')}</label><textarea id="ta-material" className="textarea" rows="4" value=${draft.config.material} onInput=${(e) => setC('material', e.target.value.slice(0, VIVA_MATERIAL_MAX))} placeholder=${t('Paste notes or the syllabus section. Questions and marking follow it.')}></textarea></div>
          <div className="field"><span className="label">${t('How students answer')}</span><div className="row" style=${{ gap: 6 }}>${Object.values(VIVA_MODES).map((m) => html`<button key=${m.id} type="button" className="chip" aria-pressed=${draft.config.mode === m.id} onClick=${() => setC('mode', m.id)}><${Icon} name=${m.icon} size=${14} /> ${m.label}</button>`)}</div></div>
        <//>` : html`<${Fragment}>
          <div className="grid-2">
            <div className="field"><span className="label">${t('Occasion')}</span><div className="row" style=${{ gap: 6 }}>${OCCASIONS.map((o) => html`<button key=${o.id} type="button" className="chip" aria-pressed=${draft.config.occasion === o.id} onClick=${() => setC('occasion', o.id)}>${o.label}</button>`)}</div></div>
            <div className="field"><label htmlFor="ta-min">${t('Length in minutes')}</label><input id="ta-min" className="input" type="number" min="1" max="20" value=${draft.config.minutes} onInput=${(e) => setC('minutes', clamp(Number(e.target.value) || 3, 1, 20))} style=${{ maxWidth: 120 }} /></div>
          </div>
          <div className="field"><label htmlFor="ta-brief">${t('The task, in your words')}</label><textarea id="ta-brief" className="textarea" rows="3" value=${draft.config.brief} onInput=${(e) => setC('brief', e.target.value.slice(0, 2000))} placeholder=${t('Persuade the class to adopt a four-day school week. Use at least one number.')}></textarea></div>
        <//>`}
        <div className="field"><label htmlFor="ta-due">${t('Due (optional)')}</label><input id="ta-due" className="input" type="date" value=${draft.due || ''} onInput=${(e) => setDraft((d) => ({ ...d, due: e.target.value }))} style=${{ maxWidth: 200 }} /></div>
        <div className="row" style=${{ gap: 8 }}><button className="btn-cta" type="submit" disabled=${busy === 'save'}>${busy === 'save' ? t('Saving…') : t('Assign to the class')}</button><button className="btn" type="button" onClick=${() => setDraft(null)}>${t('Cancel')}</button></div>
      </form>` : null}
      ${assignments == null ? html`<p className="muted">${t('Loading…')}</p>` : !assignments.length ? html`<p className="small muted">${t('Nothing set yet. Students can still practise on their own; you will see that too.')}</p>` : assignments.map((a) => {
        const ss = subsOf(a.id);
        const pct = ss.map((s) => s.summary && s.summary.percent).filter((v) => v != null);
        return html`<div key=${a.id} className="card assign-card">
          <div className="row-between"><div><div className="eyebrow">${a.kind === 'viva' ? t('Oral exam') : t('Speech')}${a.due_at ? t` · due ${fmtDate(a.due_at)}` : ''}</div><h3>${a.title}</h3></div>
            <div className="row" style=${{ gap: 8 }}><span className="chip chip-sm">${t`${new Set(ss.map((s) => s.student_id)).size} of ${(students || []).length} done`}</span>${pct.length ? html`<span className="chip chip-sm">${t`avg ${Math.round(mean(pct))}%`}</span>` : null}<button className="btn btn-sm btn-ghost" onClick=${() => remove(a)} disabled=${busy === 'del' + a.id} aria-label=${t('Remove assignment')}><${Icon} name="trash" size=${14} /></button></div></div>
          ${ss.length ? html`<div className="teach-table-wrap"><table className="teach-table"><thead><tr><th>${t('Student')}</th><th>${t('Result')}</th><th>${t('When')}</th><th></th></tr></thead><tbody>
            ${ss.map((s) => { const st = (students || []).find((x) => x.student_id === s.student_id); const sm = s.summary || {}; return html`<tr key=${s.id}><td>${st ? st.display_name : t('A student')}</td><td><${TeachPct} value=${sm.percent} grade=${sm.grade} source=${sm.source} />${sm.micFallback || sm.mode === 'write' ? html` <span className="tiny muted" title=${sm.micFallback ? t('The microphone or transcription failed, so the student typed their answers.') : t('Set as a written exam.')}>${t('typed')}</span>` : null}</td><td className="muted">${fmtDate(s.created_at)}</td><td><button className="btn btn-sm" onClick=${() => go('review', { student: s.student_id, doc: s.doc_id, name: st ? st.display_name : '' })}>${t('Open report')}</button></td></tr>`; })}
          </tbody></table></div>` : null}
        </div>`;
      })}
    </section>

    <section className="stack" style=${{ gap: 12 }}>
      <div className="sec-head"><div><div className="eyebrow">${t('Progress')}</div><h2>${t('Students')}</h2></div></div>
      ${students == null ? html`<p className="muted">${t('Loading…')}</p>` : !students.length ? html`<div className="card empty"><${Icon} name="users" size=${28} /><h2>${t('Nobody has joined yet')}</h2><p className="small">${t('Write the code')} <b>${cls.code}</b> ${t('on the board. Students pick “Join as a student” on the sign-in page.')}</p></div>`
        : html`<div className="card teach-table-wrap"><table className="teach-table">
          <thead><tr><th>${t('Student')}</th><th>${t('Latest exam')}</th><th>${t('Trend')}</th><th>${t('Exams')}</th><th>${t('Speeches')}</th><th>${t('Last active')}</th><th></th></tr></thead>
          <tbody>${students.map((s) => {
            const items = progress[s.student_id] || [];
            const exams = items.filter((x) => x.kind === 'viva' && x.percent != null);
            const last = exams[exams.length - 1];
            return html`<tr key=${s.student_id}>
              <td><b>${s.display_name}</b><span className="tiny muted" style=${{ display: 'block' }}>${s.username || ''}</span></td>
              <td>${last ? html`<button className="btn btn-sm btn-ghost" style=${{ padding: 0 }} onClick=${() => go('review', { student: s.student_id, doc: last.id, name: s.display_name })}><${TeachPct} value=${last.percent} grade=${last.grade} source=${last.source} /> <span className="small">${last.title}</span></button>` : html`<${TeachPct} value=${null} />`}</td>
              <td><${TeachSpark} values=${exams.map((x) => x.percent)} /></td>
              <td className="num">${s.exams_done != null ? s.exams_done : exams.length}</td>
              <td className="num">${s.speeches != null ? s.speeches : items.filter((x) => x.kind === 'speech').length}</td>
              <td className="muted">${s.last_active ? fmtDate(s.last_active) : '–'}</td>
              <td><div className="row" style=${{ gap: 4, flexWrap: 'nowrap' }}><button className="btn btn-sm btn-ghost" onClick=${() => setReset({ username: s.username, name: s.display_name, pw: '' })}>${t('Reset password')}</button><button className="btn btn-sm btn-ghost" onClick=${() => removeStudent(s)} disabled=${busy === 'rm' + s.student_id}>${t('Remove from class')}</button></div></td>
            </tr>`;
          })}</tbody></table></div>`}
      ${reset ? html`<form className="card row" onSubmit=${doReset} style=${{ gap: 10, alignItems: 'end' }}>
        <div className="field" style=${{ flex: '1 1 220px' }}><label htmlFor="tr-pw">${t`New password for ${reset.name}`}</label><input id="tr-pw" className="input" type="text" value=${reset.pw} onInput=${(e) => setReset((r) => ({ ...r, pw: e.target.value }))} minLength=${AUTH_MIN_PASSWORD} placeholder=${t('At least 8 characters')} autoComplete="off" /></div>
        <button className="btn-cta" type="submit" disabled=${busy === 'reset' || reset.pw.length < AUTH_MIN_PASSWORD}>${t('Set password')}</button><button className="btn" type="button" onClick=${() => setReset(null)}>${t('Cancel')}</button>
      </form>` : null}
    </section>
  </div>`;
}

/* ---------- A student's report, read-only, for the teacher ---------- */
function ReviewPage({ param }) {
  const p = param && typeof param === 'object' ? param : {};
  const [doc, setDoc] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let alive = true;
    (async () => {
      try { const row = await Teach.doc(p.student, p.doc); if (!alive) return; if (row && row.body) { setDoc(row.body); setState('ok'); } else setState('missing'); }
      catch (e) { if (alive) setState('error'); }
    })();
    return () => { alive = false; };
  }, [p.student, p.doc]);
  if (state === 'loading') return html`<p className="muted">${t('Loading the report…')}</p>`;
  if (state !== 'ok') return html`<div className="card empty"><h2>${t('That report isn’t available')}</h2><p className="small">${t('It may have been deleted by the student, or you may not teach their class.')}</p><button className="btn" onClick=${() => go('teacher')}>${t('Back to classes')}</button></div>`;
  const s = teachSummaryOf(doc);
  return html`<div className="teach-review stack" style=${{ gap: 14 }}>
    <div className="notice teach-review-note"><${Icon} name="users" size=${18} /><span>${t('You are reading')} <b>${p.name || t('a student')}</b>${s && s.kind === 'viva' ? t('’s exam report. Nothing here changes it.') : t('’s speech report. Nothing here changes it.')}</span></div>
    ${doc.type === 'viva' && doc.report ? html`<${VivaReport} doc=${doc} />` : doc.type === 'viva' ? html`<div className="card"><h2>${doc.subject}</h2><p className="small muted">${t('This exam is not finished yet.')}</p></div>` : doc.type === 'speech' ? html`<${TeachSpeechSummary} sp=${doc} />` : html`<div className="card"><p>${t('Unknown document.')}</p></div>`}
  </div>`;
}
function TeachSpeechSummary({ sp }) {
  const ai = sp.ai || null;
  return html`<div className="stack" style=${{ gap: 14 }}>
    <section className="card stack" style=${{ gap: 10 }}>
      <div className="eyebrow">${occasionOf(sp.occasion).label} · ${fmtDate(sp.date || Date.now())}</div>
      <h2>${sp.title || t('Speech')}</h2>
      <div className="row" style=${{ gap: 12 }}>${POLE_KEYS.map((k) => html`<span key=${k} className="chip" style=${{ color: POLES[k].color }}>${POLES[k].name} ${sp.scores && sp.scores[k] != null ? sp.scores[k] : '–'}</span>`)}<${MiniTriangle} scores=${sp.scores || {}} size=${56} /></div>
      ${ai && ai.summary ? html`<p>${ai.summary}</p>` : null}
      ${ai && ai.coach_note ? html`<p className="small muted">${ai.coach_note}</p>` : null}
    </section>
    ${ai ? html`<section className="grid-2">
      <div className="card"><div className="eyebrow">${t('Strengths')}</div><ul className="list-check">${(ai.strengths || []).map((s, i) => html`<li key=${i}>${s}</li>`)}</ul></div>
      <div className="card"><div className="eyebrow">${t('Next moves')}</div><ul className="list-check">${(ai.growth || []).map((s, i) => html`<li key=${i}>${s}</li>`)}</ul></div>
    </section>` : null}
    ${sp.transcript ? html`<details className="card details"><summary><b>${t('Transcript')}</b> · ${tn(sp.words || wordsOf(sp.transcript).length, 'word', 'words')}</summary><p className="small" style=${{ whiteSpace: 'pre-wrap', marginTop: 10 }}>${sp.transcript}</p></details>` : null}
  </div>`;
}

/* ---------- Students: assignments on Home ---------- */
function AssignmentsCard() {
  const me = Teach.me();
  const [items, setItems] = useState(null);
  const [subs, setSubs] = useState([]);
  useEffect(() => {
    let alive = true;
    if (!me || !Teach.sb() || me.role !== 'student') { setItems([]); return undefined; }
    (async () => {
      try { const [as, ss] = await Promise.all([Teach.myAssignments(), Teach.mySubmissions()]); if (alive) { setItems(as); setSubs(ss); } }
      catch (e) { if (alive) setItems([]); }
    })();
    return () => { alive = false; };
  }, [me && me.id]);
  if (!me || me.role !== 'student' || !items || !items.length) return null;
  const done = (a) => subs.find((s) => s.assignment_id === a.id);
  const open = items.filter((a) => !done(a));
  const finished = items.filter((a) => done(a));
  function start(a) {
    if (a.kind === 'viva') {
      const c = a.config || {};
      const doc = Store.saveViva(vivaNewDoc({ subject: c.subject || a.title, topic: c.topic || '', level: c.level || 'school', format: VIVA_FORMATS[c.format] ? c.format : 'quick', persona: c.persona || 'socratic', discipline: c.discipline || 'general', material: c.material || '', mode: c.mode === 'write' ? 'write' : 'speak', assignmentId: a.id, assignmentTitle: a.title }), 0);
      go('viva', doc.id);
    } else {
      const c = a.config || {};
      Platform.pendingAssignment = { id: a.id, title: a.title };
      go('analyze', { title: a.title, occasion: c.occasion || 'presentation', brief: c.brief || '', minutes: c.minutes || null });
    }
  }
  return html`<section className="card stack assign-list" style=${{ gap: 6 }} aria-labelledby="assign-title">
    <div className="sec-head"><div><div className="eyebrow">${t('From your teacher')} <span className="greek" lang="grc">ἔργα</span></div><h2 id="assign-title">${open.length ? t`${tn(open.length, 'assignment', 'assignments')} to do` : t('All assignments done')}</h2></div></div>
    ${open.map((a) => html`<div key=${a.id} className="assign-row">
      <div><b>${a.title}</b><span className="small muted" style=${{ display: 'block' }}>${a.kind === 'viva' ? t('Oral exam') : t('Speech')}${a.classes && a.classes.name ? ' · ' + a.classes.name : ''}${a.due_at ? ' · ' + t`due ${fmtDate(a.due_at)}` : ''}${a.kind === 'speech' && a.config && a.config.brief ? ' · ' + vivaClip(a.config.brief, 90) : ''}</span></div>
      <button className="btn-cta" onClick=${() => start(a)}><${Icon} name=${a.kind === 'viva' ? 'scroll' : 'mic'} size=${16} />${a.kind === 'viva' ? t('Sit the exam') : t('Start')}</button>
    </div>`)}
    ${finished.map((a) => { const s = done(a); const sm = (s && s.summary) || {}; return html`<div key=${a.id} className="assign-row"><div><b>${a.title}</b><span className="small muted" style=${{ display: 'block' }}>${t`Done ${fmtDate(s.created_at)}`}</span></div><${TeachPct} value=${sm.percent} grade=${sm.grade} source=${sm.source} /></div>`; })}
  </section>`;
}
