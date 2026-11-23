import { useState } from 'react'
import { Mail, LockKeyhole, MessageCircle, Sparkles, ArrowLeft, ArrowRight, Check, CloudUpload, Plus, Link as LinkIcon, ExternalLink, Trash2, Pencil, Send } from 'lucide-react'
import { Logo, Btn, Chip, Field, Footer, FileCard, Pill, Photo, Summary } from './ui'
import { NS, opts } from './data'
import { submitBrief } from './submitBrief'

const STEPS = [['Your business', 'The people and the purpose'], ['Your website', 'Scope, style & practicalities'], ['Your inspiration', 'Images, files & links'], ['Review & send', 'Make sure it feels right']]
const HEAD = [
  ['First, tell me about you.', 'The best websites start with the people behind them. Let’s get to know your business and what you’d like your website to do.'],
  ['Let’s shape your website.', 'A wish list is enough for now. These answers help me recommend the right scope—not lock you into one.'],
  ['Share your inspiration.', 'Your inspiration doesn’t have to be polished. Share the things that will help me understand your vision. You can also skip this step and add them later.'],
  ['Looks like a good beginning.', 'Take a moment to check the details. When you’re happy, send your brief my way. This is a conversation starter, not a commitment.'],
]
const NEXT = ['Next: Your website', 'Next: Share your inspiration', 'Next: Review your brief', 'Send my project brief']
const Card = ({ n, t, sub, children }) => (
  <section className="card">
    <div className="col g8"><h3 className="sec-t"><small className="sg">{n}</small>{t}</h3>{sub && <p className="muted" style={{ fontSize: 14 }}>{sub}</p>}</div>
    {children}
  </section>
)
const Review = ({ t, go, children }) => (
  <section className="card"><div className="between"><h3 className="sec-t">{t}</h3><button className="between" onClick={go} style={{ gap: 6, color: '#244df0', fontSize: 13, fontWeight: 500 }}><Pencil size={14} />Edit</button></div>{children}</section>
)

export default function Brief({ form: f, set }) {
  const [step, setStep] = useState(1)
  const [ref, setRef] = useState('')
  const [err, setErr] = useState('')
  const [agree, setAgree] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendErr, setSendErr] = useState('')
  const up = p => set({ ...f, ...p })
  const bind = k => ({ value: f[k] ?? '', onChange: e => up({ [k]: e.target.value }) })
  const tog = (k, v) => up({ [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v] })
  // plain functions (not components) so inputs keep focus while typing
  const multi = (k, l) => <div className="chips">{[...l, NS].map(o => <Chip key={o} on={f[k].includes(o)} onClick={() => tog(k, o)}>{o}</Chip>)}</div>
  const one = (k, l, ns = true) => <div className="chips">{(ns ? [...l, NS] : l).map(o => <Chip radio key={o} on={f[k] === o} onClick={() => up({ [k]: o })}>{o}</Chip>)}</div>

  const add = list => {
    const files = [...list].slice(0, 10 - f.files.length).filter(x => x.size <= 50 * 2 ** 20).map(x => ({
      name: x.name, size: +(x.size / 2 ** 20).toFixed(1) || 0.1, type: (x.name.split('.').pop() || 'file').toUpperCase(),
      url: x.type.startsWith('image/') ? URL.createObjectURL(x) : null,
      file: x,
    }))
    up({ files: [...f.files, ...files] })
  }
  const addRef = () => {
    try {
      if (f.refs.length >= 5) return setErr('You can add up to 5 references.')
      const u = new URL(/^https?:\/\//.test(ref) ? ref : `https://${ref}`)
      up({ refs: [...f.refs, { url: u.href.replace(/\/$/, ''), title: u.hostname.replace('www.', ''), like: '' }] })
      setRef(''); setErr('')
    } catch { setErr('Please enter a valid public website link.') }
  }
  const send = async () => {
    if (!f.name.trim() || !f.business.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setSendErr('Please add your name, business name and a valid email on step 1.')
    setSending(true); setSendErr('')
    try {
      const code = await submitBrief(f)
      up({ code })
      location.hash = '#/project'
    } catch (e) {
      console.error(e)
      setSendErr('Sorry, your brief could not be sent. Your draft is saved, so please try again.')
    }
    setSending(false)
  }
  const total = f.files.reduce((a, x) => a + x.size, 0).toFixed(1)
  const join = a => a.filter(x => x !== NS).join(' · ')

  return (
    <div>
      <header className="nav"><Logo /><div className="between" style={{ gap: 24 }}><small style={{ fontSize: 14 }}>Questions? Email Alex</small><Btn>Save &amp; return later <Mail size={17} /></Btn></div></header>
      <div className="brief">
        <aside className="guide">
          <div className="col g14">
            <p className="eyebrow">Your project brief</p>
            <h2 className="sg" style={{ fontSize: 28 }}>A little context. A better website.</h2>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>Start with what you know. We can figure out the rest together.</p>
            <div className="bar">{[1, 2, 3, 4].map(i => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
            <small style={{ fontSize: 12 }}>Step {step} of 4 · About 8–10 minutes</small>
          </div>
          <div className="col g28">
            {STEPS.map(([t, s], i) => (
              <button key={t} className="step" onClick={() => setStep(i + 1)}>
                <span className={`dot${i + 1 <= step ? ' on' : ''}`}>{i + 1 < step ? <Check size={15} /> : i + 1}</span>
                <span className="col" style={{ gap: 4 }}><b style={{ fontSize: 14, fontWeight: i + 1 === step ? 600 : 500, color: i + 1 === step ? '#244df0' : 'inherit' }}>{t}</b><small style={{ fontSize: 12 }}>{s}</small></span>
              </button>
            ))}
          </div>
          <hr />
          <div className="col g12"><LockKeyhole size={20} color="#244df0" /><b style={{ fontSize: 14 }}>Just between us.</b>
            <small style={{ fontSize: 13, lineHeight: 1.55 }}>Your brief and uploads are private. Only you and Alex at Goodform can access them.</small>
            <small style={{ fontSize: 13, lineHeight: 1.55 }}>No account needed. Save a secure email link and pick up where you left off.</small></div>
          <div className="note sage" style={{ alignItems: 'flex-start', fontSize: 12 }}><MessageCircle size={20} />Not sure what you need? That’s exactly what I’m here for.</div>
        </aside>

        <div className="main">
          <header className="col g14">
            <p className="eyebrow">0{step} / 04 · {f.business || 'Your project'}</p>
            <h1 className="h3">{HEAD[step - 1][0]}</h1><p className="lead">{HEAD[step - 1][1]}</p>
          </header>

          {step === 1 && <>
            <div className="note"><Sparkles size={20} />Jump right in—no account needed. All fields are required unless marked optional.</div>
            <Card n="01" t="The people behind the project">
              <div className="row"><Field label="Your name"><input className="input" {...bind('name')} /></Field><Field label="Email address"><input className="input" type="email" {...bind('email')} /></Field></div>
              <Field label="Phone number  (optional)" hint="Only used if a call is easier than email."><input className="input" type="tel" {...bind('phone')} /></Field>
              <p className="hint" style={{ fontSize: 13 }}>I’ll use this email for your proposal and secure save-and-return link. No newsletters unless you ask.</p>
            </Card>
            <Card n="02" t="Your business, in a few words">
              <div className="row"><Field label="Business name"><input className="input" {...bind('business')} /></Field><Field label="Industry or type of business"><input className="input" {...bind('industry')} /></Field></div>
              <Field label="What do you do, and what makes it special?"><textarea className="input" {...bind('about')} /></Field>
              <Field label="Current website  (optional)" hint="Have a site already? Share the public link—never passwords or account details."><input className="input" type="url" {...bind('site')} /></Field>
              <Field label="What brings you here?">{one('type', opts.type)}</Field>
            </Card>
            <Card n="03" t="A website with a purpose" sub="Choose as many goals as you like. We’ll agree on priorities together.">
              {multi('goals', opts.goals)}
              <Field label="Who would you like to reach?"><textarea className="input" {...bind('audience')} /></Field>
              <Field label="What would a successful website change for you?"><textarea className="input" {...bind('success')} /></Field>
            </Card>
          </>}

          {step === 2 && <>
            <Card n="01" t="The pages & the useful bits" sub="What should visitors be able to explore and do? Select all that apply.">
              <Field label="Which pages do you have in mind?">{multi('pages', opts.pages)}</Field>
              <Field label="What does your website need to do?">{multi('features', opts.features)}</Field>
              <Field label="Anything specific about the functionality?"><textarea className="input" {...bind('func')} /></Field>
            </Card>
            <Card n="02" t="How should it feel?" sub="There’s no right answer. Choose the words that feel closest to your business.">
              {multi('feel', opts.feel)}
              <Field label="Any visual must-haves or things to avoid?"><textarea className="input" {...bind('avoid')} /></Field>
              <Field label="Where are you with your brand and content?" hint={f.readyNote}>{one('ready', opts.ready, false)}</Field>
            </Card>
            <Card n="03" t="The practical details" sub="A realistic range helps me suggest the best approach for your investment.">
              <Field label="What’s your approximate project budget?">{one('budget', opts.budget)}</Field>
              <div className="row">
                <Field label="Ideal launch date" hint="A target date, not a promise—yet."><input className="input" {...bind('launch')} /></Field>
                <Field label="How flexible is this date?"><select className="input" {...bind('flex')}>{opts.flex.map(o => <option key={o}>{o}</option>)}</select></Field>
              </div>
              <Field label="Anything driving that timing?  (optional)"><input className="input" {...bind('driver')} /></Field>
            </Card>
            <div className="note sage"><MessageCircle size={20} />Not sure about a page, feature or budget? Choose “I’m not sure—help me decide”. I’ll help you prioritise in the proposal.</div>
          </>}

          {step === 3 && <>
            <Card n="01" t="Your images & files" sub="Brand guidelines, photos, copy, sketches—anything that helps tell your story.">
              <label className="drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); add(e.dataTransfer.files) }}>
                <input type="file" multiple hidden accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.docx,.zip" onChange={e => { add(e.target.files); e.target.value = '' }} />
                <span className="up"><CloudUpload size={25} color="#244df0" /></span>
                <b style={{ fontSize: 17 }}>Drop your files here, or browse files</b>
                <small style={{ fontSize: 12 }}>JPG, PNG, WEBP, SVG, PDF, DOCX, ZIP · Up to 50 MB per file<br />Maximum 10 files</small>
                <span className="btn">Choose files <Plus size={17} /></span>
              </label>
              <div className="between"><b style={{ fontSize: 13 }}>Your files · {f.files.length} of 10</b><small style={{ fontSize: 12 }}>{total} MB</small></div>
              <div className="col g12" style={{ gap: 10 }}>{f.files.map((x, i) => <FileCard key={x.name + i} f={x} onX={() => up({ files: f.files.filter((_, j) => j !== i) })} />)}</div>
              <p className="hint between" style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}><LockKeyhole size={17} style={{ flex: 'none' }} />Private to you and your designer. Please don’t include passwords, payment details or other sensitive account information.</p>
            </Card>
            <Card n="02" t="Websites that inspire you" sub="Share a public website link and the details you love. A reference is a conversation starter, not something we’ll copy.">
              {f.refs.map((r, i) => (
                <div key={r.url} className="ref">
                  <div className="between"><div className="between" style={{ flex: 1, height: 48, padding: '0 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, justifyContent: 'flex-start', gap: 10 }}><LinkIcon size={17} color="#67716f" /><span style={{ flex: 1, fontSize: 14 }}>{r.url}</span><ExternalLink size={15} color="#244df0" /></div>
                    <button aria-label="Remove reference" onClick={() => up({ refs: f.refs.filter((_, j) => j !== i) })}><Trash2 size={18} color="#67716f" /></button></div>
                  <div className="between" style={{ justifyContent: 'flex-start', gap: 18 }}><Photo src={r.img} w={132} h={86} r={6} />
                    <div className="col" style={{ gap: 7, alignItems: 'flex-start' }}><b className="sg" style={{ fontSize: 21 }}>{r.title}</b>{r.meta && <small style={{ fontSize: 12 }}>{r.meta}</small>}<Pill>Link added</Pill></div></div>
                  <Field label="What do you like about this?"><textarea className="input" value={r.like} onChange={e => up({ refs: f.refs.map((x, j) => j === i ? { ...x, like: e.target.value } : x) })} /></Field>
                </div>
              ))}
              <div className="between addref" style={{ gap: 12 }}>
                <input className="input" style={{ flex: 1, minHeight: 48, height: 48 }} placeholder="https://a-website-you-love.com" value={ref} onChange={e => setRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRef()} />
                <Btn lg onClick={addRef}>Add reference <Plus size={17} /></Btn>
              </div>
              <p className="hint" style={{ color: err ? '#b3261e' : undefined }}>{err || `${f.refs.length} of 5 references added · Public website links only`}</p>
            </Card>
            <Field label="Anything else I should know about these files or links?  (optional)"><textarea className="input" {...bind('extra')} /></Field>
          </>}

          {step === 4 && <>
            <div className="between"><Pill>Ready to send</Pill><small style={{ fontSize: 12 }}>{f.business} · Draft GF-2048</small></div>
            <Review t="Your business & goals" go={() => setStep(1)}>
              <div className="row"><Summary label="Business">{f.business} · {f.industry}</Summary><Summary label="Your contact">{[f.name, f.email, f.phone].filter(Boolean).join(' · ')}</Summary></div>
              <Summary label="About the business">{f.about}</Summary>
              <Summary label="Website goals">{join(f.goals)}</Summary>
              <Summary label="Audience & success">{f.audience} {f.success}</Summary>
            </Review>
            <Review t="Your website" go={() => setStep(2)}>
              <Summary label="Project">{f.type}{f.site && ` · ${f.site}`}</Summary>
              <Summary label={`${f.pages.filter(p => p !== NS).length} pages`}>{join(f.pages)}</Summary>
              <Summary label="Features">{join(f.features)}. {f.func}</Summary>
              <Summary label="Visual direction">{join(f.feel)}. {f.avoid}</Summary>
              <Summary label="Brand & content">{f.ready}. {f.readyNote}</Summary>
              <hr />
              <div className="row"><Summary label="Budget">{f.budget}</Summary><Summary label="Target launch">{f.launch} · {f.flex}</Summary></div>
              {f.driver && <small style={{ fontSize: 13 }}>{f.driver}</small>}
            </Review>
            <Review t="Your files & inspiration" go={() => setStep(3)}>
              <div className="between"><b style={{ fontWeight: 500, fontSize: 14 }}>{f.files.length} files · {total} MB</b><small style={{ color: '#25634b', fontSize: 12 }}>All uploads complete</small></div>
              <div className="grid2">{f.files.map((x, i) => <FileCard key={x.name + i} f={x} />)}</div>
              {f.extra && <small style={{ fontSize: 13 }}>{f.extra}</small>}
              {f.refs.map(r => <div key={r.url} className="col g8"><b className="between" style={{ justifyContent: 'flex-start', gap: 10, fontSize: 15 }}><LinkIcon size={16} color="#244df0" />{r.title}</b><a href={r.url} style={{ color: '#244df0', fontSize: 12 }}>{r.url}</a><small style={{ fontSize: 14 }}>{r.like}</small></div>)}
            </Review>
            <div className="col g12" style={{ background: 'var(--tint)', borderRadius: 16, padding: 24, gap: 16 }}>
              <label className="between" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ width: 19, height: 19, accentColor: '#244df0', marginTop: 3 }} />
                I agree that Goodform can use these details to review my project and contact me about it. I’ve read the privacy policy.
              </label>
              <small className="between" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, fontSize: 13 }}><Mail size={17} style={{ flex: 'none' }} />You’ll receive a confirmation and a secure project link at {f.email}. Alex will reply within 2 working days.</small>
            </div>
          </>}

          <div className="between navrow">
            {step === 1 ? <Btn lg href="#/">Back to Goodform <ArrowLeft size={17} /></Btn> : <Btn lg onClick={() => { setStep(step - 1); scrollTo(0, 0) }}>Back <ArrowLeft size={17} /></Btn>}
            <div className="col navr" style={{ gap: 10, alignItems: 'flex-end' }}>
              <Btn p lg disabled={sending || (step === 4 && !agree)} onClick={() => { if (step < 4) { setStep(step + 1); scrollTo(0, 0) } else send() }}>{sending ? 'Sending…' : NEXT[step - 1]} {step === 4 ? <Send size={17} /> : <ArrowRight size={17} />}</Btn>
              {sendErr && <small style={{ fontSize: 12, color: '#b3261e' }}>{sendErr}</small>}
              <small style={{ fontSize: 12 }}>Draft saved just now · No account needed</small>
            </div>
          </div>
        </div>
      </div>
      <Footer right="Your information stays private.  ·  Privacy policy  ·  hello@goodform.studio" />
    </div>
  )
}
