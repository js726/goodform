import { useEffect, useState } from 'react'
import { Check, ChevronDown, FileText, Pencil, Plus, Send, ExternalLink, MailCheck, Mail } from 'lucide-react'
import { Logo, Btn, Pill, Summary, FileCard } from './ui'
import { NS } from './data'
import { supabase } from './supabase'
import { Timeline, stagesFor, CLIENT_LABEL } from './Timeline'

const DEMO = stagesFor('in_review', '2026-11-06T10:42:00Z', '2026-11-10')
const Panel = ({ t, aside, children }) => (
  <section className="card" style={{ gap: 22, padding: 28 }}>
    <div className="between"><h3 className="sg" style={{ fontSize: 25 }}>{t}</h3>{aside}</div>{children}
  </section>
)

export default function Project({ form: f }) {
  const [reply, setReply] = useState('An embedded booking experience would be ideal, if it works well on mobile. We’d love help polishing the copy for all six pages. I can share our current text.')
  const [sent, setSent] = useState(false)
  const first = f.name.split(' ')[0] || 'there'
  // Live progress, set by the studio in the admin. Falls back to a sample when there is no project code yet.
  // A personal link (#/project?code=GF-XXXXXX) works on any device; otherwise use the code saved in this browser.
  const urlCode = (location.hash.match(/[?&]code=([A-Za-z0-9-]+)/) || [])[1]?.toUpperCase()
  const code = urlCode || f.code
  const linked = urlCode && urlCode !== f.code
  const [prog, setProg] = useState(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!code || !supabase) return
    let live = true
    const get = () => supabase.rpc('project_progress', { p_code: code }).then(({ data }) => {
      if (!live) return
      if (data?.[0]) { setProg(data[0]); setMissing(false) } else setMissing(true)
    })
    get()
    const t = setInterval(get, 30000)
    return () => { live = false; clearInterval(t) }
  }, [code])
  const stages = prog ? stagesFor(prog.status, prog.created_at, prog.proposal_due) : DEMO
  const list = a => a.filter(x => x !== NS).join(' · ')
  if (linked) {
    return (
      <div>
        <header className="nav"><Logo /><small style={{ fontSize: 14 }}>Questions? Email Alex</small></header>
        <main className="col wrap pmain" style={{ gap: 32 }}>
          <div className="col" style={{ background: 'var(--tint)', borderRadius: 16, padding: 32, gap: 12 }}>
            <p className="eyebrow">Project {code}</p>
            <h1 className="sg" style={{ fontSize: 40 }}>{prog ? `Hi ${prog.first_name}. Here’s where ${prog.business} stands.` : missing ? 'We couldn’t find that project.' : 'Loading your project…'}</h1>
            <p className="lead">{missing ? 'Please check the link in your email, or reply to that email and I’ll help.' : 'This page updates as your project moves along. I’ll email you if I need anything from you.'}</p>
          </div>
          {prog && <Timeline stages={stages} />}
          <section className="card" style={{ gap: 14, padding: 28 }}>
            <h3 className="sg" style={{ fontSize: 25 }}>Questions or something to add?</h3>
            <p className="lead" style={{ fontSize: 15 }}>Reply to your confirmation email or write to <a href="mailto:hello@goodform.studio" style={{ color: '#244df0' }}>hello@goodform.studio</a>. You’ll hear back within 2 working days.</p>
          </section>
        </main>
        <footer className="foot"><span>© 2026 Goodform Studio</span><span>Private project space · Only you and your designer · Privacy policy</span></footer>
      </div>
    )
  }
  return (
    <div>
      <header className="nav"><Logo /><div className="between" style={{ gap: 24 }}><small style={{ fontSize: 14 }}>Questions? Email Alex</small><Btn>{first}’s project <ChevronDown size={17} /></Btn></div></header>
      <main className="col wrap pmain" style={{ gap: 32 }}>
        <div className="between okbar" style={{ gap: 24, background: 'var(--tint)', borderRadius: 16 }}>
          <span style={{ width: 60, height: 60, borderRadius: '50%', background: '#244df0', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}><Check size={30} /></span>
          <div className="col g12" style={{ flex: 1, gap: 10 }}>
            <p className="eyebrow">Brief successfully sent · {f.code || 'GF-2048'}</p>
            <h1 className="sg" style={{ fontSize: 40 }}>Thanks, {first}. It’s in good hands.</h1>
            <p className="lead">I’ve received your brief for {f.business}. This is your private project space—everything we need, in one place.</p>
          </div>
          <Pill t="b">{prog ? CLIENT_LABEL[prog.status] || prog.status : 'In review'}</Pill>
        </div>
        <div className="between phead">
          <div className="col g8"><h2 className="sg" style={{ fontSize: 34 }}>{f.business}</h2><small style={{ fontSize: 13 }}>Website {f.type.startsWith('Redesign') ? 'redesign' : 'project'} · Submitted 6 November 2026 at 10:42</small></div>
          <Btn href="#/brief">View submitted brief <FileText size={17} /></Btn>
        </div>
        <Timeline stages={stages} />

        <div className="proj">
          <div className="col g24">
            <Panel t="A couple of quick questions" aside={<Pill t="a">{sent ? 'Reply sent' : 'Your reply needed'}</Pill>}>
              <small style={{ fontSize: 13 }}>Alex Morgan · 6 Nov, 11:15</small>
              <p>“Thanks for such a thoughtful brief, {first}. Two details will help me put together the right proposal:”</p>
              <div className="col g12" style={{ background: 'var(--bg)', borderRadius: 10, padding: 20, fontSize: 14, gap: 14 }}>
                <p>1. Should the Little Hotelier booking engine open in a new tab, or would you prefer it embedded in the website?</p>
                <p>2. Would you like copywriting support for all six pages, or just a polish of your existing text?</p>
              </div>
              <div className="field"><label>Your reply</label><textarea className="input" value={reply} onChange={e => { setReply(e.target.value); setSent(false) }} /></div>
              <div className="between"><small style={{ fontSize: 12 }}>{sent ? 'Sent to Alex' : 'Draft reply · Not sent'}</small><Btn p onClick={() => setSent(true)}>Send reply to Alex <Send size={17} /></Btn></div>
            </Panel>
            <Panel t="Your brief, at a glance" aside={<a href="#/brief" className="between" style={{ gap: 6, color: '#244df0', fontSize: 13, fontWeight: 500 }}><Pencil size={14} />Request an update</a>}>
              <p className="lead" style={{ fontSize: 15 }}>{f.about}</p>
              <div className="row"><Summary label="Investment">{f.budget}</Summary><Summary label="Target launch">{f.launch} · {f.flex.split('· ')[1] || f.flex}</Summary></div>
              <Summary label={`${f.pages.filter(p => p !== NS).length} pages`}>{list(f.pages)}</Summary>
              <Summary label="Features">{list(f.features)}</Summary>
              <Summary label="Look & feel">{list(f.feel)}</Summary>
            </Panel>
            <Panel t="Your attachments" aside={<small style={{ fontSize: 12 }}>{f.files.length} files · {f.files.reduce((a, x) => a + x.size, 0).toFixed(1)} MB · Private</small>}>
              <div className="grid2">{f.files.map((x, i) => <FileCard key={x.name + i} f={x} />)}</div>
              <Btn onClick={() => (location.hash = '#/brief')}>Add a file <Plus size={17} /></Btn>
            </Panel>
            <Panel t="Your reference websites">
              {f.refs.map((r, i) => (
                <div key={r.url} className="col g8">
                  {i > 0 && <hr style={{ marginBottom: 14 }} />}
                  <a href={r.url} className="between" style={{ color: '#244df0', fontWeight: 500, fontSize: 14 }}>{r.url.replace(/^https?:\/\/(www\.)?/, '')}<ExternalLink size={16} /></a>
                  <p className="muted" style={{ fontSize: 14 }}>“{r.like}”</p>
                </div>
              ))}
            </Panel>
          </div>

          <aside className="col g24 side-col">
            <div className="dark col" style={{ borderRadius: 16, padding: 28, gap: 18 }}>
              <MailCheck size={28} />
              <h3 className="sg" style={{ fontSize: 27 }}>Your project.<br />One secure link.</h3>
              <small style={{ fontSize: 14, lineHeight: 1.55 }}>We’ve sent a private access link to:</small><span style={{ fontSize: 13 }}>{f.email}</span>
              <small style={{ fontSize: 13, lineHeight: 1.55 }}>Return any time from that email. No account or password to remember. Keep the link private—it’s just for you.</small>
              <Btn style={{ color: '#17201f' }}>Send me a new link <Mail size={17} /></Btn>
            </div>
            <Panel t="What happens next?">
              <div className="col g8" style={{ gap: 9 }}><p className="eyebrow">01 · A thoughtful review</p><small style={{ fontSize: 14, lineHeight: 1.55 }}>I’ll look through your brief, files and references and make sure I understand the details.</small></div><hr />
              <div className="col g8" style={{ gap: 9 }}><p className="eyebrow">02 · A tailored proposal</p><small style={{ fontSize: 14, lineHeight: 1.55 }}>Expect a clear scope, price and timeline within 2 working days. No obligation to go ahead.</small></div>
            </Panel>
            <section className="card" style={{ gap: 22, padding: 28 }}>
              <div className="between" style={{ justifyContent: 'flex-start', gap: 12 }}><span style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--sage)', color: '#25634b', display: 'grid', placeItems: 'center', font: '17px var(--sg)' }}>AM</span><div className="col" style={{ gap: 4 }}><b style={{ fontSize: 14 }}>Alex Morgan</b><small style={{ fontSize: 12 }}>Your designer, start to finish</small></div></div>
              <small style={{ fontSize: 14, lineHeight: 1.55 }}>Have a question or a new idea? Reply here or email me directly.</small>
              <a href="mailto:hello@goodform.studio" style={{ color: '#244df0', fontSize: 13 }}>hello@goodform.studio ↗</a>
            </section>
          </aside>
        </div>
      </main>
      <footer className="foot"><span>© 2026 Goodform Studio</span><span>Private project space · Only you and your designer · Privacy policy</span></footer>
    </div>
  )
}
