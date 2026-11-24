import { useCallback, useEffect, useRef, useState } from 'react'
import { Asterisk, LockKeyhole, Inbox, LogOut, Search, Mail, Link2, Printer, Download, ExternalLink, Send, X, HelpCircle, Undo2 } from 'lucide-react'
import { supabase } from './supabase'
import { Btn, Pill, Field } from './ui'
import { NS } from './data'
import { Timeline, stagesFor, CLIENT_LABEL } from './Timeline'

const STATUS = {
  new: ['New', 'g'], in_review: ['In review', 'b'], awaiting_reply: ['Awaiting reply', 'a'], proposal_sent: ['Proposal sent', 'n'],
  in_progress: ['In progress', 'b'], delivered: ['Delivered', 'g'], archived: ['Archived', 'n'],
}
// One definition of "active" everywhere: still needs something from the studio or the client.
const isActive = r => !['delivered', 'archived'].includes(r.status)
const when = d => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const day = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const clean = a => (a || []).filter(x => x !== NS)
const PRINT = '@media print{.side,.list,.noprint,.dev{display:none!important}.studio{display:block}}'
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
  const n = Math.floor(h / 24)
  return n < 14 ? `${n}d ago` : day(d)
}

// Whose move is it, and by when. Drives the agenda line, the list rows and the sort order.
function nextStep(r) {
  const first = r.name.split(' ')[0]
  const now = new Date()
  if (r.status === 'new' || (r.status === 'in_review' && !r.proposal_due)) {
    const by = replyBy(r.created_at)
    return { who: 'you', kind: 'reply', due: by, late: by < now, text: by < now ? `Reply overdue · was due ${day(by)}` : `Reply by ${day(by)}` }
  }
  if (r.status === 'in_review') {
    const by = new Date(r.proposal_due)
    return { who: 'you', kind: 'proposal', due: by, late: by < now, text: by < now ? `Proposal overdue · was due ${day(by)}` : `Proposal due ${day(by)}` }
  }
  if (r.status === 'in_progress') return { who: 'you', kind: 'build', text: 'In progress' }
  if (r.status === 'awaiting_reply') return { who: 'client', text: `Waiting on ${first}’s reply` }
  if (r.status === 'proposal_sent') return { who: 'client', text: `Waiting on ${first}’s decision` }
  return { who: 'done', text: r.status === 'delivered' ? 'Delivered' : 'Archived' }
}
const RANK = { you: 0, client: 1, done: 2 }
const byUrgency = (a, b) => {
  const x = nextStep(a), y = nextStep(b)
  if (RANK[x.who] !== RANK[y.who]) return RANK[x.who] - RANK[y.who]
  if (x.due && y.due) return x.due - y.due
  if (x.due || y.due) return x.due ? -1 : 1
  return new Date(b.created_at) - new Date(a.created_at)
}

// Every answer where the client chose "I'm not sure—help me decide" (or asked for help with content).
const HELP_FIELDS = [['project_type', 'Type of project'], ['goals', 'Goals'], ['pages', 'Pages'], ['features', 'Features'], ['feel', 'Visual direction'], ['budget', 'Budget']]
const helpWith = r => [
  ...HELP_FIELDS.filter(([k]) => (Array.isArray(r[k]) ? r[k].includes(NS) : r[k] === NS)).map(([, l]) => l),
  ...(r.ready === 'I need help with this' ? ['Brand & content'] : []),
]

// Turn raw database errors into something the owner can act on.
const friendly = (what, error) => `Couldn’t ${what}. Check your connection and try again.${error?.message ? ` (${error.message})` : ''}`

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
const Fact = ({ label, children }) => <div className="fact"><dt>{label}</dt><dd>{children}</dd></div>
const Said = ({ label, children }) => children ? <div className="said"><small>{label}</small><p>{children}</p></div> : null

function StatusControl({ row, first, onPatch }) {
  const [pending, setPending] = useState(null), [saving, setSaving] = useState(false)
  const [done, setDone] = useState(null), [err, setErr] = useState(''), [dueSaved, setDueSaved] = useState(false)
  const shown = pending || row.status
  const stages = stagesFor(shown, row.created_at, row.proposal_due)
  const seen = stages.find(s => s.state === 'active') || [...stages].reverse().find(s => s.state === 'done') || stages[0]
  const sees = s => `${CLIENT_LABEL[s]}`

  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(null), 10000); return () => clearTimeout(t) }, [done])

  const save = async (to, from) => {
    setSaving(true); setErr('')
    const { error } = await supabase.from('briefs').update({ status: to }).eq('id', row.id)
    setSaving(false)
    if (error) return setErr(friendly('change the status', error))
    onPatch(row.id, { status: to }); setPending(null)
    setDone(from ? { from, to } : null)
  }
  const setDue = async v => {
    setErr(''); setDueSaved(false)
    const { error } = await supabase.from('briefs').update({ proposal_due: v || null }).eq('id', row.id)
    if (error) return setErr(friendly('save the proposal date', error))
    onPatch(row.id, { proposal_due: v || null }); setDueSaved(true); setTimeout(() => setDueSaved(false), 2500)
  }

  return (
    <section className="sec status">
      <div className="sec-head"><h3 className="sec-h">{pending ? `What ${first} will see` : `What ${first} sees`}</h3><small>{pending ? 'Preview · not saved yet' : 'Their project page, right now'}</small></div>
      <Timeline bare stages={stages} />
      <div className="controls noprint">
        <label className="ctl">Status
          <select className="input" value={shown} onChange={e => { setDone(null); setPending(e.target.value === row.status ? null : e.target.value) }}>
            {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="ctl">Proposal due
          <input type="date" lang="en-GB" className="input" value={row.proposal_due || ''} onChange={e => setDue(e.target.value)} />
        </label>
        {dueSaved && <small className="ok" role="status">Date saved</small>}
      </div>
      {pending && (
        <div className="confirm noprint">
          <p>Move from <b>{STATUS[row.status]?.[0] || row.status}</b> to <b>{STATUS[pending][0]}</b>? {first} will see “{seen.title}: {seen.text}” and the label <b>{sees(pending)}</b>.</p>
          {pending === 'proposal_sent' && <p className="warn">Only confirm once the proposal is in {first}’s inbox. Their page will say it has been sent.</p>}
          <div className="btns">
            <Btn p onClick={() => save(pending, row.status)} disabled={saving}>{saving ? 'Updating…' : `Update ${first}’s page`}</Btn>
            <Btn onClick={() => setPending(null)} disabled={saving}>Keep as {STATUS[row.status]?.[0] || row.status}</Btn>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite" className="noprint">
        {done && (
          <p className="done"><span>Saved. {first} now sees <b>{sees(done.to)}</b>.</span>
            <button type="button" className="link" onClick={() => save(done.from, null)} disabled={saving}><Undo2 size={15} />Undo</button>
          </p>
        )}
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </section>
  )
}

function Detail({ row, onPatch }) {
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
  const [label, tone] = STATUS[row.status] || [row.status, 'n']
  const first = row.name.split(' ')[0]
  const help = helpWith(row)
  const type = row.project_type && row.project_type !== NS ? row.project_type : 'New brief'
  const words = [row.about, row.audience, row.success, row.avoid, row.func, row.driver, row.extra].some(Boolean)

  return (
    <article className="card detail">
      <header className="dh">
        <div className="dh-top"><h2 className="sg dh-t">{row.business}</h2><Pill t={tone}>{label}</Pill></div>
        <p className="dh-meta">{row.name} · <a href={`mailto:${row.email}`}>{row.email}</a>{row.phone && ` · ${row.phone}`}</p>
        <p className="dh-sub">{row.project_code} · {type} · Received {when(row.created_at)}{row.industry && ` · ${row.industry}`}</p>
        <div className="btns noprint">
          <Btn p href={`mailto:${row.email}?subject=${encodeURIComponent(`Your project brief ${row.project_code}`)}`}>Email {first} <Mail size={17} /></Btn>
          <Btn onClick={() => navigator.clipboard.writeText(`${location.origin}${import.meta.env.BASE_URL}#/project?code=${row.project_code}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}>{copied ? 'Link copied' : 'Copy client link'} <Link2 size={17} /></Btn>
          <Btn onClick={() => window.print()}>Print / save as PDF <Printer size={17} /></Btn>
        </div>
        {help.length > 0 && (
          <div className="help"><HelpCircle size={18} aria-hidden="true" /><p><b>{first} asked for your help deciding</b> {help.join(' · ')}</p></div>
        )}
      </header>

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

      <StatusControl row={row} first={first} onPatch={onPatch} />

      <section className="sec">
        <div className="sec-head"><h3 className="sec-h">The details</h3></div>
        <dl className="facts">
          <Fact label="Budget">{row.budget && row.budget !== NS ? row.budget : <span className="muted">Not sure yet</span>}</Fact>
          <Fact label="Target launch">{row.launch || '—'}{row.flex && <span className="muted"> · {row.flex}</span>}</Fact>
          <Fact label="Goals"><Tags items={row.goals} /></Fact>
          <Fact label="Pages"><Tags items={row.pages} /></Fact>
          <Fact label="Features"><Tags items={row.features} /></Fact>
          <Fact label="Visual direction"><Tags items={row.feel} /></Fact>
          <Fact label="Brand & content">{row.ready || '—'}{row.ready_note && <span className="muted"> · {row.ready_note}</span>}</Fact>
          {row.site && <Fact label="Current site"><a className="lnk" href={/^https?:/.test(row.site) ? row.site : `https://${row.site}`} target="_blank" rel="noreferrer">{row.site} <ExternalLink size={14} /></a></Fact>}
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
                <a href={r.url} target="_blank" rel="noreferrer" className="lnk">{r.title || r.url} <ExternalLink size={14} /></a>
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
        {notes.map(n => <div key={n.id} className="col" style={{ gap: 4 }}><p className="nt">{n.body}</p><small>{when(n.created_at)}</small></div>)}
      </section>
    </article>
  )
}

function Agenda({ rows }) {
  const steps = rows.filter(isActive).map(r => [r, nextStep(r)])
  const replies = steps.filter(([, s]) => s.kind === 'reply').sort((a, b) => a[1].due - b[1].due)
  const proposals = steps.filter(([, s]) => s.kind === 'proposal').sort((a, b) => a[1].due - b[1].due)
  const waiting = steps.filter(([, s]) => s.who === 'client').length
  const late = steps.filter(([, s]) => s.late).length
  const parts = []
  if (replies.length) {
    const [r, s] = replies[0]
    parts.push(<span key="r"><b>{plural(replies.length, 'reply', 'replies')} due</b>, the next for {r.business} {s.late ? 'was due' : 'by'} {day(s.due)}</span>)
  }
  if (proposals.length) parts.push(<span key="p"><b>{plural(proposals.length, 'proposal')} due</b>, the next {day(proposals[0][1].due)}</span>)
  if (waiting) parts.push(<span key="w"><b>{waiting} waiting</b> on {waiting === 1 ? 'a client' : 'clients'}</span>)
  if (!rows.length) return <p className="agenda">No briefs yet. They’ll appear here as soon as a client sends one.</p>
  if (!parts.length) return <p className="agenda">Nothing needs you right now.</p>
  return (
    <p className="agenda">
      {late > 0 && <span className="late"><b>{late} overdue</b></span>}
      {parts}
    </p>
  )
}

const FILTERS = { active: ['Active briefs', isActive], you: ['Your move', r => nextStep(r).who === 'you'], client: ['Waiting on clients', r => nextStep(r).who === 'client'] }

function Studio({ user }) {
  const [rows, setRows] = useState(null), [err, setErr] = useState(''), [sel, setSel] = useState(null)
  const [q, setQ] = useState(''), [tab, setTab] = useState('active')
  const detailRef = useRef(null)
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
  const cur = shown.find(r => r.id === sel) || shown[0]
  const pick = id => {
    setSel(id)
    if (window.matchMedia('(max-width: 960px)').matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="studio">
      <style>{PRINT}</style>
      <aside className="side">
        <a href="#/" className="side-logo"><Asterisk size={22} aria-hidden="true" /><b>goodform</b></a>
        <nav className="side-nav" aria-label="Studio">
          <a className="nav-i on" href="#/admin" aria-current="page"><Inbox size={18} aria-hidden="true" /><span>Brief inbox</span><small aria-label={`${count(isActive)} active`}>{count(isActive)}</small></a>
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
          {rows && <Agenda rows={all} />}
        </header>
        {err && <p className="err" role="alert">{err} <button type="button" className="link" onClick={load}>Try again</button></p>}
        {!rows && !err && <p className="muted">Loading briefs…</p>}
        {rows && rows.length > 0 && (
          <div className="studio-body">
            <div className="list card">
              <div className="list-tools">
                <label className="search"><Search size={16} aria-hidden="true" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search briefs" aria-label="Search by name, business, email, industry or code" />
                  {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
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
              <ul className="subs">
                {shown.map(r => {
                  const s = nextStep(r), h = helpWith(r).length, on = cur?.id === r.id
                  return (
                    <li key={r.id}>
                      <button className={`sub${on ? ' on' : ''}`} onClick={() => pick(r.id)} aria-current={on ? 'true' : undefined}>
                        <span className="sub-top"><b>{r.business}</b><small>{ago(r.created_at)}</small></span>
                        <small className="sub-who">{r.name} · {r.project_type && r.project_type !== NS ? r.project_type : 'New brief'}</small>
                        <span className="sub-next">
                          <span className={`nx ${s.late ? 'late' : s.who}`}>{STATUS[r.status]?.[0] === s.text ? s.text : `${STATUS[r.status]?.[0]} · ${s.text}`}</span>
                          {h > 0 && <span className="asks" title={`Asked for help with ${plural(h, 'thing')}`}><HelpCircle size={13} aria-hidden="true" />{h}<span className="vh"> {h === 1 ? 'question' : 'questions'} for you</span></span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div ref={detailRef} className="detail-wrap">
              {cur ? <Detail key={cur.id} row={cur} onPatch={(id, p) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)))} /> : null}
            </div>
          </div>
        )}
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
