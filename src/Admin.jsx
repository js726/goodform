import { useCallback, useEffect, useRef, useState } from 'react'
import { Asterisk, LockKeyhole, Inbox, LogOut, Search, Mail, Link2, Printer, Download, ExternalLink, Send, X, HelpCircle, Undo2, ArrowLeft, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { supabase } from './supabase'
import { Btn, Field } from './ui'
import { NS } from './data'
import { Timeline, stagesFor, CLIENT_LABEL } from './Timeline'

const STATUS = {
  new: ['New', 'g'], in_review: ['In review', 'b'], awaiting_reply: ['Awaiting reply', 'a'], proposal_sent: ['Proposal sent', 'n'],
  in_progress: ['In progress', 'b'], delivered: ['Delivered', 'g'], archived: ['Archived', 'n'],
}
const statusName = s => STATUS[s]?.[0] || s
// One definition of "active" everywhere: still needs something from the studio or the client.
const isActive = r => !['delivered', 'archived'].includes(r.status)
const when = d => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const day = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
// Launch dates are free text from the brief; only reformat them when they are ISO dates.
const launchDate = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : v)
const today = () => new Date().toISOString().slice(0, 10)
const clean = a => (a || []).filter(x => x !== NS)
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`

// The landing page promises a reply within 2 working days.
const replyBy = created => {
  const d = new Date(created)
  for (let left = 2; left > 0;) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) left-- }
  return d
}
const ago = d => {
  const h = (Date.now() - new Date(d)) / 36e5
  if (h < 1) return 'Just now'
  if (h < 24) return `${Math.floor(h)}h ago`
  if (h < 24 * 14) return `${Math.floor(h / 24)}d ago`
  if (h < 24 * 7 * 8) return `${Math.floor(h / 24 / 7)}w ago`
  return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

// Every answer where the client chose "I'm not sure—help me decide" (or asked for help with content).
// Keys double as anchors into "The details", so the help box can link to each open question.
const HELP_FIELDS = [['project_type', 'Type of project'], ['goals', 'Goals'], ['pages', 'Pages'], ['features', 'Features'], ['feel', 'Visual direction'], ['budget', 'Budget']]
const helpWith = r => [
  ...HELP_FIELDS.filter(([k]) => (Array.isArray(r[k]) ? r[k].includes(NS) : r[k] === NS)),
  ...(r.ready === 'I need help with this' ? [['ready', 'Brand & content']] : []),
]
const asked = (r, k) => helpWith(r).some(([x]) => x === k)

// Whose move is it, and by when. Drives the agenda line, the list rows and the sort order.
// An open "help me decide" question keeps it the studio's move until a proposal goes out.
function nextStep(r) {
  const first = r.name.split(' ')[0]
  const now = new Date()
  const help = helpWith(r).length
  if (r.status === 'new' || (r.status === 'in_review' && !r.proposal_due)) {
    const by = replyBy(r.created_at)
    return { who: 'you', kind: 'reply', due: by, late: by < now, text: by < now ? `Reply overdue · was due ${day(by)}` : `Reply by ${day(by)}` }
  }
  if (r.status === 'in_review') {
    const by = new Date(r.proposal_due)
    return { who: 'you', kind: 'proposal', due: by, late: by < now, text: by < now ? `Proposal overdue · was due ${day(by)}` : `Proposal due ${day(by)}` }
  }
  if (r.status === 'awaiting_reply' && help) return { who: 'you', kind: 'help', text: `${first} needs your help deciding` }
  if (r.status === 'in_progress') return { who: 'you', kind: 'build', text: 'In progress' }
  if (r.status === 'awaiting_reply') return { who: 'client', text: `Waiting on ${first}’s reply` }
  if (r.status === 'proposal_sent') return { who: 'client', text: `Waiting on ${first}’s decision` }
  return { who: 'done', text: statusName(r.status) }
}
const RANK = { you: 0, client: 1, done: 2 }
const byUrgency = (a, b) => {
  const x = nextStep(a), y = nextStep(b)
  if (RANK[x.who] !== RANK[y.who]) return RANK[x.who] - RANK[y.who]
  if (x.due && y.due) return x.due - y.due
  if (x.due || y.due) return x.due ? -1 : 1
  return new Date(b.created_at) - new Date(a.created_at)
}

// Plain-language errors. The raw database message goes to the console for debugging, not to the owner.
const friendly = (what, error) => {
  if (error) console.error(error)
  return `Couldn’t ${what}. Check your connection and try again.`
}
const typing = el => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)

const MsLogo = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><path fill="#f25022" d="M1 1h9v9H1z" /><path fill="#7fba00" d="M11 1h9v9h-9z" /><path fill="#00a4ef" d="M1 11h9v9H1z" /><path fill="#ffb900" d="M11 11h9v9h-9z" /></svg>
)

function Login({ user }) {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  // Set VITE_ADMIN_PASSWORD_LOGIN=false in .env to hide the password form once Microsoft sign-in works.
  const passwordOn = import.meta.env.VITE_ADMIN_PASSWORD_LOGIN !== 'false'
  const go = async e => {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setErr('That email and password didn’t match.')
    setBusy(false)
  }
  const microsoft = async () => {
    setErr('')
    sessionStorage.setItem('gf-after-login', '1')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'azure', options: { scopes: 'email', redirectTo: `${location.origin}${import.meta.env.BASE_URL}` } })
    if (error) setErr('Microsoft sign-in isn’t switched on yet. Check the Azure settings in Supabase.')
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', background: 'var(--forest)', padding: 16 }}>
      <form onSubmit={go} className="card" style={{ width: '100%', maxWidth: 400 }}>
        <span className="mark"><Asterisk size={20} /></span>
        <div className="col g8"><h1 className="sg" style={{ fontSize: 30 }}>Studio sign in</h1><p className="muted" style={{ fontSize: 14 }}>Private workspace for Goodform briefs.</p></div>
        {user ? (
          <>
            <p style={{ fontSize: 14 }}>You’re signed in as <b>{user.email}</b>, but this account isn’t set up as an admin yet.</p>
            <Btn type="button" onClick={() => supabase.auth.signOut()}>Sign out <LogOut size={17} /></Btn>
          </>
        ) : (
          <>
            <Btn lg type="button" onClick={microsoft}><MsLogo />Sign in with Microsoft</Btn>
            {passwordOn && (
              <>
                <div className="between muted" style={{ fontSize: 12, gap: 12 }}><hr /><span>or</span><hr /></div>
                <Field label="Email"><input className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
                <Field label="Password"><input className="input" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></Field>
                <Btn p lg type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Btn>
              </>
            )}
            {err && <small style={{ color: '#b3261e', fontSize: 13 }}>{err}</small>}
          </>
        )}
      </form>
    </div>
  )
}


const Tags = ({ items }) => {
  const xs = clean(items)
  if (xs.length) return <span className="tags">{xs.map(x => <span key={x} className="tag">{x}</span>)}</span>
  return <span className="muted">{(items || []).includes(NS) ? 'Not sure yet' : '—'}</span>
}
const Fact = ({ id, label, ask, children }) => (
  <div className={`fact${ask ? ' ask' : ''}`} id={id} tabIndex={-1}>
    <dt>{label}</dt>
    <dd>{children}{ask && <span className="ask-tag"><HelpCircle size={13} aria-hidden="true" />Asked for your help</span>}</dd>
  </div>
)
const Said = ({ label, children }) => children ? <div className="said"><small>{label}</small><p>{children}</p></div> : null
const longDay = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

function StatusControl({ row, first, onSave }) {
  const [st, setSt] = useState(row.status), [due, setDue] = useState(row.proposal_due || '')
  const [saving, setSaving] = useState(false), [err, setErr] = useState('')
  const selRef = useRef(null)
  useEffect(() => { setSt(row.status); setDue(row.proposal_due || '') }, [row.status, row.proposal_due])

  const stChanged = st !== row.status
  const dueChanged = (due || null) !== (row.proposal_due || null)
  const dirty = stChanged || dueChanged
  const past = dueChanged && due && due < today()
  const stages = stagesFor(st, row.created_at, due || null)
  const active = stages.find(s => s.state === 'active')
  const next = nextStep(row)

  const cancel = () => { setSt(row.status); setDue(row.proposal_due || ''); setErr(''); selRef.current?.focus() }
  const confirm = async () => {
    const patch = {}
    if (stChanged) patch.status = st
    if (dueChanged) patch.proposal_due = due || null
    setSaving(true); setErr('')
    const e = await onSave(row, patch)
    setSaving(false)
    if (e) setErr(e); else selRef.current?.focus()
  }

  return (
    <section className="sec status" aria-label="Next step and status" onKeyDown={e => { if (e.key === 'Escape' && dirty) { e.preventDefault(); cancel() } }}>
      <div className="sec-head"><h3 className="sec-h">Next step</h3><span className={`nx ${next.late ? 'late' : next.who}`}>{next.text}</span></div>
      <div className="controls noprint">
        <label className="ctl">Status
          <select ref={selRef} className="input" value={st} onChange={e => { setErr(''); setSt(e.target.value) }}>
            {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="ctl">Proposal due
          <input type="date" className="input" min={dueChanged ? today() : undefined} value={due} onChange={e => { setErr(''); setDue(e.target.value) }} />
          <span className="ctl-hint">{due ? day(due) : 'Not set'}</span>
        </label>
      </div>
      <div className="preview">
        <div className="sec-head"><h4 className="pv-h">{dirty ? `What ${first} will see` : `What ${first} sees`}</h4><small className="noprint">{dirty ? 'Preview · not saved yet' : 'Their project page, right now'}</small></div>
        <Timeline bare stages={stages} />
      </div>
      <div role="status" aria-live="polite" className="noprint">
        {dirty && (
          <div className="confirm">
            <ul className="changes">
              {stChanged && <li>Status: <b>{statusName(row.status)}</b> → <b>{statusName(st)}</b>. {first}’s page will say <b>{CLIENT_LABEL[st]}</b>{active ? <> and “{active.title}: {active.text}”</> : null}.</li>}
              {dueChanged && <li>{due ? <>Proposal due <b>{day(due)}</b>. {first}’s page will promise it “By {longDay(due)}”.</> : <>Proposal date removed. {first}’s page will say “Date to be confirmed”.</>}</li>}
            </ul>
            {st === 'proposal_sent' && stChanged && <p className="warn">Only confirm once the proposal is in {first}’s inbox. Their page will say it has been sent.</p>}
            {st === 'archived' && stChanged && <p className="warn">Archived briefs show as “On hold” to {first}. Email them first if the project isn’t going ahead.</p>}
            {past && <p className="warn">That date is in the past. Pick today or later.</p>}
            <div className="btns">
              <Btn p onClick={confirm} disabled={saving || past}>{saving ? 'Updating…' : `Update ${first}’s page`}</Btn>
              <Btn onClick={cancel} disabled={saving}>Keep as it was</Btn>
            </div>
          </div>
        )}
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </section>
  )
}

function Note({ n, onEdit, onDelete }) {
  const [mode, setMode] = useState(null), [text, setText] = useState(n.body), [busy, setBusy] = useState(false)
  const run = async f => { setBusy(true); const ok = await f(); setBusy(false); if (ok) setMode(null) }
  if (mode === 'edit') return (
    <div className="note-i">
      <textarea className="input" aria-label="Edit note" value={text} onChange={e => setText(e.target.value)} autoFocus />
      <div className="btns"><Btn p disabled={busy || !text.trim()} onClick={() => run(() => onEdit(n.id, text.trim()))}>{busy ? 'Saving…' : 'Save note'}</Btn><Btn onClick={() => { setText(n.body); setMode(null) }}>Cancel</Btn></div>
    </div>
  )
  return (
    <div className="note-i">
      <p className="nt">{n.body}</p>
      <div className="note-meta">
        <small>{when(n.created_at)}</small>
        {mode === 'delete' ? (
          <span className="note-acts"><small>Delete this note?</small><button type="button" className="link danger" disabled={busy} onClick={() => run(() => onDelete(n.id))}>Delete</button><button type="button" className="link" onClick={() => setMode(null)}>Keep</button></span>
        ) : (
          <span className="note-acts"><button type="button" className="link" onClick={() => setMode('edit')}><Pencil size={13} aria-hidden="true" />Edit</button><button type="button" className="link" onClick={() => setMode('delete')}><Trash2 size={13} aria-hidden="true" />Delete</button></span>
        )}
      </div>
    </div>
  )
}

function Detail({ row, onSave, onBack }) {
  const [urls, setUrls] = useState({}), [notes, setNotes] = useState([]), [msg, setMsg] = useState('')
  const [err, setErr] = useState(''), [zipping, setZipping] = useState(false), [copied, setCopied] = useState(false), [posting, setPosting] = useState(false)
  const files = row.files || [], refs = row.refs || []

  useEffect(() => {
    let live = true
    const paths = files.map(f => f.path).filter(Boolean)
    if (paths.length) {
      supabase.storage.from('brief-files').createSignedUrls(paths, 3600, { download: true }).then(({ data }) => {
        if (live && data) setUrls(Object.fromEntries(data.filter(d => d.signedUrl).map(d => [d.path, d.signedUrl])))
      })
    }
    supabase.from('brief_notes').select('id, body, created_at').eq('brief_id', row.id).order('created_at', { ascending: false })
      .then(({ data }) => live && setNotes(data || []))
    return () => { live = false }
  }, [row.id])

  const addNote = async () => {
    const body = msg.trim(); if (!body || posting) return
    setPosting(true); setErr('')
    const { data, error } = await supabase.from('brief_notes').insert({ brief_id: row.id, body }).select('id, body, created_at').single()
    setPosting(false)
    if (error) return setErr(friendly('save the note', error))
    setNotes(n => [data, ...n]); setMsg('')
  }
  const editNote = async (id, body) => {
    setErr('')
    const { error } = await supabase.from('brief_notes').update({ body }).eq('id', id)
    if (error) { setErr(friendly('update the note', error)); return false }
    setNotes(ns => ns.map(n => (n.id === id ? { ...n, body } : n))); return true
  }
  const deleteNote = async id => {
    setErr('')
    const { error } = await supabase.from('brief_notes').delete().eq('id', id)
    if (error) { setErr(friendly('delete the note', error)); return false }
    setNotes(ns => ns.filter(n => n.id !== id)); return true
  }
  const zip = async () => {
    setZipping(true); setErr('')
    try {
      const { default: JSZip } = await import('jszip')
      const z = new JSZip(), used = new Set()
      for (const [i, f] of files.entries()) {
        if (!urls[f.path]) continue
        const name = used.has(f.name) ? `${i + 1}-${f.name}` : f.name
        used.add(name)
        z.file(name, await (await fetch(urls[f.path])).blob())
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(await z.generateAsync({ type: 'blob' }))
      a.download = `${row.project_code}-files.zip`; a.click()
    } catch { setErr('Could not build the ZIP. Try downloading the files one by one.') }
    setZipping(false)
  }
  const first = row.name.split(' ')[0]
  const help = helpWith(row)
  const type = row.project_type && row.project_type !== NS ? row.project_type : 'New brief'
  const words = [row.about, row.audience, row.success, row.avoid, row.func, row.driver, row.extra].some(Boolean)
  const fid = k => `f-${row.id}-${k}`
  // Hash routing owns location.hash, so jump to a detail row by scrolling rather than with an anchor link.
  const jump = k => { const el = document.getElementById(fid(k)); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus({ preventScroll: true }) }

  return (
    <article className="card detail" aria-label={`Brief from ${row.business}`}>
      <header className="dh">
        <button type="button" className="back link" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />All briefs</button>
        <h2 className="sg dh-t">{row.business}</h2>
        <p className="dh-meta">{row.name} · <a href={`mailto:${row.email}`}>{row.email}</a>{row.phone && ` · ${row.phone}`}</p>
        <p className="dh-sub">{row.project_code} · {type} · Received {when(row.created_at)}{row.industry && ` · ${row.industry}`}</p>
        <div className="btns noprint">
          <Btn p href={`mailto:${row.email}?subject=${encodeURIComponent(`Your project brief ${row.project_code}`)}`}>Email {first} <Mail size={17} /></Btn>
          <Btn onClick={() => navigator.clipboard.writeText(`${location.origin}${import.meta.env.BASE_URL}#/project?code=${row.project_code}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}>{copied ? 'Link copied' : 'Copy client link'} <Link2 size={17} /></Btn>
          <Btn onClick={() => window.print()}>Print / save as PDF <Printer size={17} /></Btn>
        </div>
        {help.length > 0 && (
          <div className="help">
            <HelpCircle size={18} aria-hidden="true" />
            <p><b>{first} asked for your help deciding</b>{' '}
              {help.map(([k, l], i) => <span key={k}>{i > 0 && ' · '}<button type="button" className="help-k" onClick={() => jump(k)}>{l}</button></span>)}
            </p>
          </div>
        )}
      </header>

      <StatusControl row={row} first={first} onSave={onSave} />

      <section className="sec letter">
        <div className="sec-head"><h3 className="sec-h">In {first}’s words</h3></div>
        {words ? (
          <>
            {row.about && <blockquote className="voice">{row.about}</blockquote>}
            <Said label="Who it’s for">{row.audience}</Said>
            <Said label="What success looks like">{row.success}</Said>
            <Said label="What to avoid">{row.avoid}</Said>
            <Said label="Anything else it needs to do">{row.func}</Said>
            <Said label="Why now">{row.driver}</Said>
            <Said label="Anything else">{row.extra}</Said>
            <p className="sign">{row.name}, {row.business}</p>
          </>
        ) : <p className="muted">{first} didn’t write anything in their own words. The details are below.</p>}
      </section>

      <section className="sec">
        <div className="sec-head"><h3 className="sec-h">The details</h3></div>
        <dl className="facts">
          {asked(row, 'project_type') && <Fact id={fid('project_type')} label="Type of project" ask><span className="muted">Not sure yet</span></Fact>}
          <Fact id={fid('budget')} label="Budget" ask={asked(row, 'budget')}>{row.budget && row.budget !== NS ? row.budget : <span className="muted">Not sure yet</span>}</Fact>
          <Fact label="Target launch">{launchDate(row.launch) || '—'}{row.flex && <span className="muted"> · {row.flex}</span>}</Fact>
          {[['goals', 'Goals'], ['pages', 'Pages'], ['features', 'Features'], ['feel', 'Visual direction']].map(([k, l]) => (
            <Fact key={k} id={fid(k)} label={l} ask={asked(row, k)}><Tags items={row[k]} /></Fact>
          ))}
          <Fact id={fid('ready')} label="Brand & content" ask={asked(row, 'ready')}>{row.ready || '—'}{row.ready_note && <span className="muted"> · {row.ready_note}</span>}</Fact>
          {row.site && <Fact label="Current site"><a className="lnk" href={/^https?:/.test(row.site) ? row.site : `https://${row.site}`} target="_blank" rel="noreferrer">{row.site} <ExternalLink size={14} aria-hidden="true" /></a></Fact>}
        </dl>
      </section>

      <section className="sec">
        <div className="sec-head"><h3 className="sec-h">Attachments</h3><small>{plural(files.length, 'file')}</small></div>
        {files.length === 0 ? <p className="muted">No files uploaded.</p> : (
          <ul className="rows">
            {files.map((f, i) => (
              <li key={i}>
                <span className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}><b className="nm">{f.name}</b><small>{f.type} · {f.size} MB</small></span>
                {urls[f.path] ? <a className="noprint ico" href={urls[f.path]} aria-label={`Download ${f.name}`}><Download size={18} /></a> : <small>{f.path ? 'Loading…' : 'Not uploaded'}</small>}
              </li>
            ))}
          </ul>
        )}
        {Object.keys(urls).length > 1 && <div className="noprint"><Btn onClick={zip} disabled={zipping}>{zipping ? 'Building ZIP…' : 'Download all as ZIP'} <Download size={17} /></Btn></div>}
      </section>

      <section className="sec">
        <div className="sec-head"><h3 className="sec-h">Websites {first} likes</h3><small>{plural(refs.length, 'link')}</small></div>
        {refs.length === 0 ? <p className="muted">No links shared.</p> : (
          <ul className="rows">
            {refs.map((r, i) => (
              <li key={i} className="col" style={{ alignItems: 'stretch', gap: 6 }}>
                <a href={r.url} target="_blank" rel="noreferrer" className="lnk ref-l">{r.title || r.url} <ExternalLink size={14} aria-hidden="true" /></a>
                {r.like ? <p className="voice-s">{r.like}</p> : <small>No note added.</small>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sec notes noprint">
        <div className="sec-head"><h3 className="sec-h">Private notes</h3><small className="between" style={{ gap: 6 }}><LockKeyhole size={13} aria-hidden="true" />Only you</small></div>
        <textarea className="input" aria-label="New note" placeholder="Add a note about this project…" value={msg} onChange={e => setMsg(e.target.value)} />
        <div><Btn p disabled={!msg.trim() || posting} onClick={addNote}>{posting ? 'Saving…' : 'Add note'} <Send size={17} /></Btn></div>
        {err && <p className="err" role="alert">{err}</p>}
        {notes.map(n => <Note key={n.id} n={n} onEdit={editNote} onDelete={deleteNote} />)}
      </section>
    </article>
  )
}

function Agenda({ rows }) {
  const steps = rows.filter(isActive).map(r => [r, nextStep(r)])
  const of = kind => steps.filter(([, s]) => s.kind === kind).sort((a, b) => (a[1].due || 0) - (b[1].due || 0))
  const replies = of('reply'), proposals = of('proposal'), helps = of('help')
  const waiting = steps.filter(([, s]) => s.who === 'client').length
  const late = steps.filter(([, s]) => s.late).length
  const parts = []
  if (replies.length) {
    const [r, s] = replies[0]
    const by = `${s.late ? 'was due' : 'by'} ${day(s.due)}`
    parts.push(replies.length === 1
      ? <span key="r"><b>1 reply due</b>: {r.business} {by}</span>
      : <span key="r"><b>{replies.length} replies due</b>, the first for {r.business} {by}</span>)
  }
  if (proposals.length) {
    const d = day(proposals[0][1].due)
    parts.push(<span key="p"><b>{plural(proposals.length, 'proposal')} due</b>{proposals.length === 1 ? ` ${d}` : `, the first ${d}`}</span>)
  }
  if (helps.length) parts.push(<span key="h"><b>{helps.length} {helps.length === 1 ? 'client needs' : 'clients need'}</b> your help deciding</span>)
  if (waiting) parts.push(<span key="w"><b>{waiting} waiting</b> on {waiting === 1 ? 'a client' : 'clients'}</span>)
  if (!parts.length) return <p className="agenda">Nothing needs you right now.</p>
  return <p className="agenda">{late > 0 && <span className="late"><b>{late} overdue</b></span>}{parts}</p>
}

const FILTERS = { active: ['Active briefs', isActive], you: ['Your move', r => nextStep(r).who === 'you'], client: ['Waiting on clients', r => nextStep(r).who === 'client'] }

function Toast({ t, onUndo, onClose }) {
  if (!t) return null
  const what = t.undone ? `Undone. ${t.first}’s page is back as it was.` : `${t.first}’s page now ${[
    'status' in t.patch && `says ${CLIENT_LABEL[t.patch.status]}`,
    'proposal_due' in t.patch && (t.patch.proposal_due ? `promises the proposal by ${day(t.patch.proposal_due)}` : 'says the proposal date is to be confirmed'),
  ].filter(Boolean).join(' and ')}.`
  return (
    <div className="toast noprint">
      <p><b>{t.business}</b> · {what}</p>
      {!t.undone && <button type="button" className="link on-dark" onClick={onUndo} disabled={t.busy}><Undo2 size={15} aria-hidden="true" />Undo</button>}
      <button type="button" className="toast-x" onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
    </div>
  )
}

function Studio({ user }) {
  const [rows, setRows] = useState(null), [err, setErr] = useState(''), [sel, setSel] = useState(null)
  const [q, setQ] = useState(''), [tab, setTab] = useState('active'), [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const searchRef = useRef(null), listRef = useRef(null), mainRef = useRef(null)
  const load = useCallback(async () => {
    setErr('')
    const { data, error } = await supabase.from('briefs').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) return setErr(friendly('load the briefs', error))
    setRows(data)
  }, [])
  useEffect(() => { load() }, [load])

  const all = rows || []
  const count = f => all.filter(f).length
  const test = FILTERS[tab]?.[1] || (r => r.status === tab)
  const needle = q.trim().toLowerCase()
  const shown = all.filter(test)
    .filter(r => !needle || [r.business, r.name, r.email, r.project_code, r.industry, r.project_type, r.about].join(' ').toLowerCase().includes(needle))
    .sort(byUrgency)
  // The open brief stays open until the owner picks another, even if a change moves it out of the current view.
  const cur = all.find(r => r.id === sel) || shown[0]
  useEffect(() => { if (cur && cur.id !== sel) setSel(cur.id) }, [cur?.id])

  const pick = (id, focus) => {
    setSel(id); setOpen(true)
    if (focus) requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${id}"]`)?.focus())
    else if (window.matchMedia('(max-width: 760px)').matches) requestAnimationFrame(() => mainRef.current?.scrollIntoView({ block: 'start' }))
  }
  const back = () => { setOpen(false); requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${cur?.id}"]`)?.focus()) }

  // Keyboard: / to search, J/K (or ↑/↓ inside the list) to move between briefs.
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const inList = listRef.current?.contains(document.activeElement)
      if (e.key === '/' && !typing(e.target)) { e.preventDefault(); searchRef.current?.focus(); return }
      const dir = { j: 1, k: -1 }[e.key] ?? (inList ? { ArrowDown: 1, ArrowUp: -1 }[e.key] : undefined)
      if (!dir || typing(e.target) || !shown.length) return
      e.preventDefault()
      const i = shown.findIndex(r => r.id === cur?.id)
      const nxt = shown[Math.min(shown.length - 1, Math.max(0, (i < 0 ? -1 : i) + dir))]
      if (nxt) pick(nxt.id, true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const patchRow = (id, p) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)))
  const save = async (row, patch) => {
    const prev = Object.fromEntries(Object.keys(patch).map(k => [k, row[k] ?? null]))
    const { error } = await supabase.from('briefs').update(patch).eq('id', row.id)
    if (error) return friendly(`update ${row.name.split(' ')[0]}’s page`, error)
    patchRow(row.id, patch)
    setToast({ id: row.id, business: row.business, first: row.name.split(' ')[0], prev, patch })
    return null
  }
  const undo = async () => {
    const t = toast; setToast({ ...t, busy: true })
    const { error } = await supabase.from('briefs').update(t.prev).eq('id', t.id)
    if (error) { setToast({ ...t, busy: false }); return setErr(friendly('undo that change', error)) }
    patchRow(t.id, t.prev); setToast({ ...t, undone: true })
  }
  useEffect(() => { if (!toast?.undone) return; const x = setTimeout(() => setToast(null), 5000); return () => clearTimeout(x) }, [toast])

  const needsYou = count(r => isActive(r) && nextStep(r).who === 'you')

  return (
    <div className="studio">
      <aside className="side">
        <a href="#/" className="side-logo"><Asterisk size={22} aria-hidden="true" /><b>goodform</b></a>
        <nav className="side-nav" aria-label="Studio">
          <a className="nav-i on" href="#/admin" aria-current="page"><Inbox size={18} aria-hidden="true" /><span>Brief inbox</span>{needsYou > 0 && <small title="Briefs where it’s your move">{needsYou}<span className="vh"> need you</span></small>}</a>
        </nav>
        <div className="side-foot">
          <span className="who">{user.email}</span>
          <button className="nav-i" onClick={() => supabase.auth.signOut()}><LogOut size={17} aria-hidden="true" />Sign out</button>
          <small className="priv"><LockKeyhole size={12} aria-hidden="true" />Private client information</small>
        </div>
      </aside>

      <main className="studio-main">
        <header className="inbox-head noprint">
          <div className="inbox-title"><h1 className="sg">The brief inbox</h1><span className="today">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
          {rows && rows.length > 0 && <Agenda rows={all} />}
        </header>
        {err && <p className="err" role="alert">{err} <button type="button" className="link" onClick={() => { setErr(''); load() }}>Try again</button></p>}
        {!rows && !err && <p className="muted" role="status">Loading briefs…</p>}
        {rows && rows.length === 0 && (
          <div className="card empty-inbox">
            <h2 className="sg">No briefs yet</h2>
            <p>When a client sends a brief, it lands here with a reply-by date two working days out, their own words first, and anything they asked you to help them decide.</p>
            <a className="lnk" href="#/brief">See the brief clients fill in <ArrowRight size={14} aria-hidden="true" /></a>
          </div>
        )}
        {rows && rows.length > 0 && (
          <div className={`studio-body${open ? ' open' : ''}`}>
            <div className="list card" ref={listRef}>
              <div className="list-tools">
                <label className="search"><Search size={16} aria-hidden="true" /><input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setQ(''); e.currentTarget.blur() } }} placeholder="Search briefs" aria-label="Search by name, business, email, industry or code" />
                  {q ? <button type="button" onClick={() => { setQ(''); searchRef.current?.focus() }} aria-label="Clear search"><X size={16} /></button> : <kbd aria-hidden="true">/</kbd>}
                </label>
                <select className="input" value={tab} onChange={e => setTab(e.target.value)} aria-label="Show">
                  {Object.entries(FILTERS).map(([k, [l, f]]) => <option key={k} value={k}>{l} ({count(f)})</option>)}
                  <optgroup label="By status">
                    {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l} ({count(r => r.status === k)})</option>)}
                  </optgroup>
                </select>
              </div>
              {shown.length === 0 && (
                <div className="list-empty"><p>No briefs match{needle ? ` “${q.trim()}”` : ''}.</p>{(needle || tab !== 'active') && <button type="button" className="link" onClick={() => { setQ(''); setTab('active') }}>Show all active briefs</button>}</div>
              )}
              <ul className="subs" aria-label="Briefs">
                {shown.map(r => {
                  const s = nextStep(r), h = helpWith(r).length, on = cur?.id === r.id
                  const st = statusName(r.status)
                  return (
                    <li key={r.id}>
                      <button data-id={r.id} className={`sub${on ? ' on' : ''}`} onClick={() => pick(r.id)} aria-current={on ? 'true' : undefined}>
                        <span className="sub-top"><b>{r.business}</b><small>{ago(r.created_at)}</small></span>
                        <small className="sub-who">{r.name} · {r.project_type && r.project_type !== NS ? r.project_type : 'New brief'}</small>
                        <span className={`nx ${s.late ? 'late' : s.who}`}>{st === s.text ? s.text : `${st} · ${s.text}`}</span>
                        {h > 0 && <span className="asks"><HelpCircle size={13} aria-hidden="true" />Help deciding {plural(h, 'thing')}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="keys" aria-hidden="true"><kbd>J</kbd><kbd>K</kbd> move · <kbd>/</kbd> search</p>
            </div>
            <div ref={mainRef} className="detail-wrap">
              {cur ? <Detail key={cur.id} row={cur} onSave={save} onBack={back} /> : null}
            </div>
          </div>
        )}
        <div aria-live="polite" role="status"><Toast t={toast} onUndo={undo} onClose={() => setToast(null)} /></div>
      </main>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)  // undefined = still checking
  useEffect(() => {
    if (!supabase) return setSession(null)
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!supabase) return <p style={{ padding: 40 }}>Supabase isn’t set up. Check your .env file and restart npm run dev.</p>
  if (session === undefined) return <p className="muted" style={{ padding: 40 }}>Loading…</p>
  if (!session) return <Login />
  if (session.user.app_metadata?.role !== 'admin') return <Login user={session.user} />
  return <Studio user={session.user} />
}
