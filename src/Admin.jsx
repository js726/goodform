import { useCallback, useEffect, useState } from 'react'
import { Asterisk, LockKeyhole, Inbox, LogOut, Search, Mail, Link2, Printer, Download, ExternalLink, Send } from 'lucide-react'
import { supabase } from './supabase'
import { Btn, Pill, Field, Summary } from './ui'
import { NS } from './data'
import { Timeline, stagesFor, STAGE_STATUS } from './Timeline'

const STATUS = {
  new: ['New', 'g'], in_review: ['In review', 'b'], awaiting_reply: ['Awaiting reply', 'a'], proposal_sent: ['Proposal sent', 'n'],
  in_progress: ['In progress', 'b'], delivered: ['Delivered', 'g'], archived: ['Archived', 'n'],
}
const when = d => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const list = a => (a || []).filter(x => x !== NS).join(' · ') || '—'
const PRINT = '@media print{.side,.list,.noprint,.dev{display:none!important}.studio{display:block}}'

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
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'azure', options: { scopes: 'email', redirectTo: `${location.origin}${import.meta.env.BASE_URL}#/admin` } })
    if (error) setErr('Microsoft sign-in isn’t switched on yet. Check the Azure settings in Supabase.')
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--forest)', padding: 16 }}>
      <form onSubmit={go} className="card" style={{ width: 400, maxWidth: '100%' }}>
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

function Detail({ row, onPatch }) {
  const [urls, setUrls] = useState({}), [notes, setNotes] = useState([]), [msg, setMsg] = useState('')
  const [err, setErr] = useState(''), [zipping, setZipping] = useState(false), [copied, setCopied] = useState(false)
  const files = row.files || []

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

  const setStatus = async status => {
    setErr('')
    const { error } = await supabase.from('briefs').update({ status }).eq('id', row.id)
    if (error) setErr(error.message); else onPatch(row.id, { status })
  }
  const addNote = async () => {
    const body = msg.trim(); if (!body) return
    const { data, error } = await supabase.from('brief_notes').insert({ brief_id: row.id, body }).select('id, body, created_at').single()
    if (error) return setErr(error.message)
    setNotes(n => [data, ...n]); setMsg('')
  }
  const setDue = async v => {
    setErr('')
    const { error } = await supabase.from('briefs').update({ proposal_due: v || null }).eq('id', row.id)
    if (error) setErr(error.message); else onPatch(row.id, { proposal_due: v || null })
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
  const Sec = ({ t, aside, children }) => <section className="sec"><div className="between"><h3 className="sg" style={{ fontSize: 24 }}>{t}</h3><small style={{ fontSize: 12 }}>{aside}</small></div>{children}</section>

  return (
    <article className="card" style={{ flex: 1, minWidth: 0, padding: 0, gap: 0, overflow: 'hidden' }}>
      <div className="col" style={{ padding: 28, gap: 18 }}>
        <p className="eyebrow">{row.project_code} · {row.project_type || 'New brief'}</p>
        <div className="between"><h2 className="sg" style={{ fontSize: 34, flex: 1 }}>{row.business}</h2><Pill t={tone}>{label}</Pill></div>
        <small style={{ fontSize: 13 }}>{row.name} · {row.email}{row.phone && ` · ${row.phone}`} · Received {when(row.created_at)}</small>
        <div className="between noprint" style={{ justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <Btn p href={`mailto:${row.email}?subject=${encodeURIComponent(`Your project brief ${row.project_code}`)}`}>Email {first} <Mail size={17} /></Btn>
          <Btn onClick={() => window.print()}>Print / save as PDF <Printer size={17} /></Btn>
          <Btn onClick={() => navigator.clipboard.writeText(`${location.origin}${import.meta.env.BASE_URL}#/project?code=${row.project_code}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}>{copied ? 'Copied ✓' : 'Copy client link'} <Link2 size={17} /></Btn>
          <select className="input" style={{ width: 190, minHeight: 40, padding: '8px 12px' }} value={row.status} onChange={e => setStatus(e.target.value)} aria-label="Status">
            {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {err && <small style={{ color: '#b3261e', fontSize: 13 }}>{err}</small>}
        <div className="col" style={{ gap: 10, marginTop: 6 }}>
          <small style={{ fontSize: 12 }}>What {first} sees on their project page. Click a step to move the project along.</small>
          <Timeline stages={stagesFor(row.status, row.created_at, row.proposal_due)} onPick={i => setStatus(STAGE_STATUS[i])} />
          <label className="between noprint" style={{ justifyContent: 'flex-start', gap: 10, fontSize: 13 }}>Proposal due by
            <input type="date" className="input" style={{ width: 170, minHeight: 40, padding: '8px 12px' }} value={row.proposal_due || ''} onChange={e => setDue(e.target.value)} />
          </label>
        </div>
      </div>

      <Sec t="The project" aside={row.industry}>
        <p style={{ fontSize: 14, lineHeight: 1.55 }}>{row.about || '—'}</p>
        <div className="row"><Summary label="Budget">{row.budget || '—'}</Summary><Summary label="Target launch">{row.launch || '—'} · {row.flex || '—'}</Summary></div>
        <Summary label="Goals">{list(row.goals)}</Summary>
        <Summary label="Audience & success">{row.audience || '—'} {row.success}</Summary>
        <Summary label="Pages">{list(row.pages)}</Summary>
        <Summary label="Features">{list(row.features)}{row.func && `. ${row.func}`}</Summary>
        <Summary label="Visual direction">{list(row.feel)}{row.avoid && `. ${row.avoid}`}</Summary>
        <Summary label="Brand & content">{row.ready || '—'}{row.ready_note && `. ${row.ready_note}`}</Summary>
        {row.driver && <Summary label="Timing driver">{row.driver}</Summary>}
        {row.site && <a href={row.site} target="_blank" rel="noreferrer" style={{ color: '#244df0', fontSize: 13 }}>Current site: {row.site} ↗</a>}
      </Sec>

      <Sec t="Attachments" aside={`${files.length} file${files.length === 1 ? '' : 's'}`}>
        {files.length === 0 && <small>No files uploaded.</small>}
        {files.map((f, i) => (
          <div key={i} className="file">
            <div className="col" style={{ gap: 5, flex: 1, minWidth: 0 }}><b style={{ fontWeight: 500, fontSize: 14 }}>{f.name}</b><small style={{ fontSize: 12 }}>{f.type} · {f.size} MB</small></div>
            {urls[f.path] ? <a className="noprint" href={urls[f.path]} aria-label={`Download ${f.name}`}><Download size={18} color="#244df0" /></a> : <small style={{ fontSize: 11 }}>{f.path ? 'Loading…' : 'Not uploaded'}</small>}
          </div>
        ))}
        {row.extra && <small style={{ fontSize: 13, lineHeight: 1.55 }}>{row.extra}</small>}
        {Object.keys(urls).length > 0 && <div className="noprint"><Btn onClick={zip} disabled={zipping}>{zipping ? 'Building ZIP…' : 'Download all as ZIP'} <Download size={17} /></Btn></div>}
      </Sec>

      <Sec t="Reference websites" aside={`${(row.refs || []).length} links`}>
        {(row.refs || []).length === 0 && <small>No links shared.</small>}
        {(row.refs || []).map((r, i) => (
          <div key={i} className="col g8" style={{ background: 'var(--bg)', borderRadius: 8, padding: 16 }}>
            <a href={r.url} target="_blank" rel="noreferrer" className="between" style={{ color: '#244df0', fontSize: 14, fontWeight: 500 }}>{r.title || r.url}<ExternalLink size={16} /></a>
            <small style={{ fontSize: 13, lineHeight: 1.55 }}>{r.like || 'No note added.'}</small>
          </div>
        ))}
      </Sec>

      <div className="col noprint" style={{ background: 'var(--sand)', padding: 28, gap: 14 }}>
        <b className="between" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 13 }}><LockKeyhole size={15} />Private notes · Only you</b>
        <textarea className="input" placeholder="Add a note about this project…" value={msg} onChange={e => setMsg(e.target.value)} />
        <div><Btn p disabled={!msg.trim()} onClick={addNote}>Add note <Send size={17} /></Btn></div>
        {notes.map(n => <div key={n.id} className="col" style={{ gap: 4 }}><p style={{ fontSize: 13, lineHeight: 1.55 }}>{n.body}</p><small style={{ fontSize: 11 }}>{when(n.created_at)}</small></div>)}
      </div>
    </article>
  )
}

function Studio({ user }) {
  const [rows, setRows] = useState(null), [err, setErr] = useState(''), [sel, setSel] = useState(null)
  const [q, setQ] = useState(''), [tab, setTab] = useState('all')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('briefs').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) return setErr(error.message)
    setRows(data); setSel(s => s ?? data[0]?.id ?? null)
  }, [])
  useEffect(() => { load() }, [load])

  const all = rows || []
  const count = s => all.filter(r => r.status === s).length
  const shown = all.filter(r => (tab === 'all' ? r.status !== 'archived' : r.status === tab) && [r.business, r.name, r.email, r.project_code].join(' ').toLowerCase().includes(q.toLowerCase()))
  const cur = all.find(r => r.id === sel)
  const metrics = [[all.filter(r => !['delivered', 'archived'].includes(r.status)).length, 'Active briefs', 'Not yet delivered'], [count('new'), 'New to review', 'Waiting for you'], [count('awaiting_reply'), 'Awaiting reply', 'Follow-ups sent'], [count('proposal_sent'), 'Proposals sent', 'Ready for a decision']]

  return (
    <div className="studio">
      <style>{PRINT}</style>
      <aside className="side">
        <a href="#/" className="between" style={{ justifyContent: 'flex-start', gap: 8, color: '#fff' }}><Asterisk size={24} /><b style={{ font: '700 25px var(--sg)', letterSpacing: '-.04em' }}>goodform</b></a>
        <span className="between" style={{ justifyContent: 'flex-start', gap: 6, fontSize: 11, letterSpacing: '.12em' }}><LockKeyhole size={13} />STUDIO WORKSPACE</span>
        <div className="nav-i on"><Inbox size={18} /><span style={{ flex: 1 }}>Brief inbox</span><small style={{ fontSize: 11, color: '#e2e8ff' }}>{all.length}</small></div>
        <div className="col g12" style={{ marginTop: 'auto' }}>
          <span style={{ fontSize: 12, color: '#fff', wordBreak: 'break-all' }}>{user.email}</span>
          <button className="nav-i" onClick={() => supabase.auth.signOut()}><LogOut size={17} />Sign out</button>
          <span style={{ fontSize: 11, lineHeight: 1.55 }}>Private client information. Keep this workspace secure.</span>
        </div>
      </aside>

      <div className="col g28" style={{ flex: 1, minWidth: 0, padding: 32 }}>
        <div className="col noprint" style={{ gap: 9 }}>
          <p className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="sg" style={{ fontSize: 38 }}>The brief inbox</h1>
        </div>
        <div className="metrics noprint" style={{ display: 'flex', gap: 16 }}>{metrics.map(([n, t, s]) => <div key={t} className="metric"><span className="sg" style={{ fontSize: 34, fontWeight: 400, color: '#244df0' }}>{n}</span><div className="col" style={{ gap: 5 }}><b style={{ fontWeight: 500, fontSize: 13 }}>{t}</b><small style={{ fontSize: 11 }}>{s}</small></div></div>)}</div>
        {err && <p style={{ color: '#b3261e', fontSize: 14 }}>Couldn’t load briefs: {err}</p>}
        {!rows && !err && <p className="muted">Loading briefs…</p>}
        {rows && (
          <div className="studio-body" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div className="list card" style={{ width: 312, flex: 'none', padding: 0, gap: 0, overflow: 'hidden' }}>
              <div className="col" style={{ padding: 20, gap: 14 }}>
                <label className="between" style={{ justifyContent: 'flex-start', gap: 8, background: 'var(--bg)', borderRadius: 8, padding: 12 }}><Search size={16} color="#67716f" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email or business" style={{ border: 0, background: 'none', font: '12px Inter', flex: 1, outline: 0 }} /></label>
                <select className="input" style={{ minHeight: 40, padding: '8px 12px', fontSize: 13 }} value={tab} onChange={e => setTab(e.target.value)} aria-label="Filter by status">
                  <option value="all">All active briefs</option>
                  {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l} ({count(k)})</option>)}
                </select>
              </div>
              {shown.length === 0 && <p className="muted" style={{ padding: 20, fontSize: 13, borderTop: '1px solid var(--line)' }}>{all.length ? 'No briefs match.' : 'No briefs yet. They’ll appear here as soon as a client sends one.'}</p>}
              {shown.map(r => {
                const [l, t] = STATUS[r.status] || [r.status, 'n']
                return (
                  <button key={r.id} className={`sub${sel === r.id ? ' on' : ''}`} onClick={() => setSel(r.id)}>
                    <b style={{ fontSize: 16, color: sel === r.id ? '#244df0' : undefined }}>{r.business}</b>
                    <small style={{ fontSize: 12 }}>{r.name} · {r.project_type || 'New brief'}</small>
                    <span className="between" style={{ width: '100%', fontSize: 12 }}>{r.budget || '—'}<small style={{ fontSize: 11 }}>{when(r.created_at)}</small></span>
                    <Pill t={t}>{l}</Pill>
                  </button>
                )
              })}
            </div>
            {cur ? <Detail key={cur.id} row={cur} onPatch={(id, p) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)))} /> : <p className="muted">Select a brief to see the details.</p>}
          </div>
        )}
      </div>
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
