import { useState } from 'react'
import { ArrowUpRight, MoveUpRight, Check, PanelsTopLeft, RefreshCw, Sprout, LockKeyhole, NotebookPen, Images, Link, Star, Quote, Minus, Plus, Asterisk } from 'lucide-react'
import { Logo, Btn, Footer, Photo } from './ui'

const services = [
  [PanelsTopLeft, 'A fresh start', 'A complete website for a new business or a new direction. Clear thinking, distinctive design and a confident launch.', 'Website strategy · Design · Development', 'New websites from £3,500'],
  [RefreshCw, 'A better next chapter', 'Outgrown your current site? Let’s keep what works and rethink what doesn’t, with your customers at the centre.', 'Website audit · Redesign · Migration', 'Redesigns from £2,500'],
  [Sprout, 'Room to grow', 'The useful extras that make a website work harder. From a simple shop to booking, content and ongoing care.', 'E-commerce · Integrations · Support', 'Scoped around your needs'],
]
const work = [
  ['#e5ebe6', 'forma®', ['Spaces for life,', 'not just living.'], 'forma', 'Forma Architecture', 'Architecture · Strategy, design & Webflow', 'A clearer story. A stronger first impression.'],
  ['#ebe8f1', 'common ground', ['Better coffee.', 'Good company.'], 'common-ground', 'Common Ground', 'Food & drink · E-commerce design & build', '+42% online orders in the first three months.'],
]
const ingredients = [[NotebookPen, 'Your business & your goals', 'Who it’s for, what it needs to do, what’s next.'], [Images, 'Images, brand assets & documents', 'Photos, logos, copy, a sketch on a napkin.'], [Link, 'Websites that catch your eye', 'Share the link and tell me what you like.']]
const steps = [['Tell me your story', 'Share your goals, wish list and inspiration in a short guided brief.', '8–10 minutes'], ['Let’s find the fit', 'I’ll read everything and come back with thoughtful questions or a quick call.', 'Within 2 working days'], ['A clear way forward', 'You’ll get a tailored proposal with scope, timeline and a fixed project price.', 'No surprises'], ['Make something good', 'We’ll design, build and launch together, with you involved at every key step.', 'Usually 4–8 weeks']]
const faqs = [
  ['Do I need to know exactly what I want?', 'Not at all. Bring the pieces you have: a few goals, images or websites you like. You can choose “I’m not sure—help me decide” in the brief. We’ll shape the right scope together.'],
  ['What does a website usually cost?', 'New websites start from £3,500 and redesigns from £2,500. Your proposal includes a fixed project price.'],
  ['Can you work with my existing brand and content?', 'Yes. Share your brand guidelines, logo and any existing copy in the brief.'],
  ['What happens after I send the brief?', 'I’ll reply within 2 working days with questions or a quick call, then send a tailored proposal.'],
  ['Who can see my files and information?', 'Only you and Alex at Goodform. Your brief and uploads are private.'],
]
const BriefBtn = ({ lg, children }) => <Btn p lg={lg} href="#/brief">{children} <ArrowUpRight size={17} /></Btn>

export default function Landing() {
  const [open, setOpen] = useState(0)
  return (
    <div style={{ background: '#fff' }}>
      <header className="nav">
        <Logo />
        <nav className="between navlinks" style={{ gap: 30, fontSize: 14 }}><a href="#work">Selected work</a><a href="#services">Services</a><a href="#how">How it works</a><BriefBtn>Start your brief</BriefBtn></nav>
      </header>

      <section className="hero">
        <div className="col g24" style={{ flex: 1, minWidth: 0, gap: 25 }}>
          <p className="eyebrow">Small studio. Thoughtful websites.</p>
          <h1 className="h1">Good websites. Built around your business.</h1>
          <p className="lead" style={{ fontSize: 18 }}>You bring the idea. I’ll turn it into a website that feels like you, works beautifully, and makes your next chapter possible.</p>
          <div className="between" style={{ justifyContent: 'flex-start', gap: 18 }}><BriefBtn lg>Tell me about your website</BriefBtn><MoveUpRight size={34} color="#244df0" strokeWidth={1.25} /></div>
          <small style={{ fontSize: 12 }}>8–10 minutes · No account needed · No commitment</small>
          <div className="between" style={{ justifyContent: 'flex-start', gap: 9, paddingTop: 12 }}><span className="pill g">Booking for January 2027</span><small style={{ fontSize: 12 }}>Alex Morgan · Bristol, UK</small></div>
        </div>
        <div className="showcase">
          <div className="between"><small style={{ fontSize: 11, letterSpacing: '.1em' }}>CONSIDERED DESIGN, REAL RESULTS</small><Asterisk size={22} color="#244df0" /></div>
          <div className="prev">
            <div className="between pad" style={{ height: 44, fontFamily: 'Lora' }}><span style={{ fontSize: 20 }}>fieldwork</span><span style={{ fontSize: 8, font: '8px Inter' }}>OUR PLACES · THE SLOW LIFE · BOOK A STAY ↗</span></div>
            <Photo src="countryside" h={247} />
            <div className="between pad stk" style={{ padding: 22, gap: 20 }}>
              <p style={{ font: '29px/1.05 Lora' }}>Somewhere to<br />slow down.</p>
              <div className="col sm-w" style={{ gap: 10, fontSize: 9 }}><span className="muted">Thoughtful places for unhurried days. A collection of stays, close to nature.</span><span>FIND YOUR PLACE ↗</span></div>
            </div>
          </div>
          <div className="between" style={{ fontSize: 12 }}><span>Fieldwork Stays · Brand-led website</span><b style={{ color: '#244df0' }}>+38% direct enquiries ↗</b></div>
        </div>
      </section>

      <div className="between wrap trust" style={{ borderBlock: '1px solid var(--line)', fontSize: 13 }}>
        <small style={{ fontSize: 13 }}>For independent businesses with something to say.</small>
        {['One designer, start to finish', 'Strategy before pixels', 'Made to grow with you'].map(t => <span key={t} className="between" style={{ gap: 8 }}><Check size={16} color="#25634b" />{t}</span>)}
      </div>

      <section id="work" className="sect col g28" style={{ gap: 36 }}>
        <div className="between head1">
          <div className="col g14" style={{ maxWidth: 720 }}><p className="eyebrow">A few good collaborations</p><h2 className="h2">Different businesses. The same thoughtful approach.</h2></div>
          <a href="#work" style={{ color: '#244df0', fontSize: 14 }}>Explore selected work ↗</a>
        </div>
        <div className="cols" style={{ gap: 28 }}>
          {work.map(([bg, brand, t, img, name, meta, result]) => (
            <article key={name} className="col g20">
              <div style={{ background: bg, borderRadius: 16, padding: '32px 32px 0', height: 392, overflow: 'hidden' }}>
                <div style={{ background: '#fff', borderRadius: '8px 8px 0 0', overflow: 'hidden', color: '#142320' }}>
                  <div className="between pad" style={{ height: 40, padding: '0 20px' }}><b className="sg" style={{ fontSize: 17 }}>{brand}</b><span style={{ fontSize: 8 }}>ABOUT · OUR WORK · GET IN TOUCH ↗</span></div>
                  <div className="between" style={{ padding: '18px 20px' }}><p className="sg" style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-.05em', lineHeight: 1.04 }}>{t[0]}<br />{t[1]}</p><ArrowUpRight size={36} strokeWidth={1.25} /></div>
                  <Photo src={img} h={236} />
                </div>
              </div>
              <div className="between" style={{ alignItems: 'flex-start' }}><div className="col" style={{ gap: 7 }}><b className="sg" style={{ fontSize: 25 }}>{name}</b><small style={{ fontSize: 13 }}>{meta}</small></div><ArrowUpRight size={24} /></div>
              <span style={{ color: '#244df0', fontSize: 13 }}>{result}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className="col sect-b" style={{ gap: 72 }}>
        <div className="col" style={{ gap: 36 }}>
          <div className="between head2">
            <div className="col g14" style={{ flex: 1 }}><p className="eyebrow">What I can help with</p><h2 className="h2">The right website. Not just another website.</h2></div>
            <p className="lead w390">From the first conversation to the final little detail, you’ll work directly with me. No handoffs. No agency layers.</p>
          </div>
          <div className="cols">
            {services.map(([I, t, d, tags, price]) => (
              <div key={t} className="svc"><I size={30} color="#244df0" strokeWidth={1.5} />
                <div className="col g12"><h3 className="sg" style={{ fontSize: 27 }}>{t}</h3><p className="lead" style={{ fontSize: 15 }}>{d}</p></div>
                <small style={{ fontSize: 12 }}>{tags}</small><b style={{ fontSize: 14 }}>{price}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="blue-box">
          <div className="col g20" style={{ flex: 1 }}>
            <p className="eyebrow" style={{ color: '#a9b5b0' }}>You don’t need a perfect plan</p>
            <h2 className="sg" style={{ fontSize: 42 }}>A few ideas. A folder of images. A website you love.</h2>
            <p>That’s a great place to start. The guided brief helps you share what matters, even if you’re not sure what to call it yet.</p>
            <span className="between" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12 }}><LockKeyhole size={16} />Your uploads and ideas stay private.</span>
          </div>
          <div className="col g12 w480">
            {ingredients.map(([I, t, d]) => <div key={t} className="ing"><I size={25} /><div className="col" style={{ gap: 6 }}><b style={{ fontSize: 15 }}>{t}</b><span style={{ fontSize: 13, color: '#e2e8ff' }}>{d}</span></div></div>)}
          </div>
        </div>
      </section>

      <section id="how" className="sect col" style={{ background: 'var(--bg)', gap: 72 }}>
        <div className="col" style={{ gap: 42 }}>
          <div className="col g14" style={{ maxWidth: 790 }}><p className="eyebrow">From first idea to open for business</p><h2 className="h2">A human process. A clear path from here.</h2></div>
          <div className="cols" style={{ gap: 28 }}>
            {steps.map(([t, d, tag], i) => (
              <div key={t} className="col" style={{ gap: 19 }}>
                <div className="between" style={{ gap: 14 }}><span className="sg" style={{ fontSize: 32, fontWeight: 400, color: '#244df0' }}>0{i + 1}</span><hr style={{ flex: 1 }} /></div>
                <h3 className="sg" style={{ fontSize: 24 }}>{t}</h3><p className="lead" style={{ fontSize: 14 }}>{d}</p><b style={{ fontSize: 12, color: '#244df0' }}>{tag}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="cols" style={{ gap: 24 }}>
          <div className="dark col" style={{ borderRadius: 16, padding: 36, gap: 26 }}>
            <div className="between" style={{ justifyContent: 'flex-start', gap: 4 }}>{[0, 1, 2, 3, 4].map(i => <Star key={i} size={15} fill="#f4c542" color="#f4c542" />)}</div>
            <p className="sg" style={{ fontSize: 29, fontWeight: 400, lineHeight: 1.3, letterSpacing: '-.02em' }}>“Alex took our jumble of ideas and turned it into a site that finally feels like us. The whole process felt calm, clear and genuinely collaborative.”</p>
            <div className="between" style={{ justifyContent: 'flex-start', gap: 13 }}><Photo src="portrait" w={44} h={44} r={999} /><div className="col" style={{ gap: 5 }}><b style={{ fontSize: 14 }}>Sarah Ellis</b><small style={{ fontSize: 12 }}>Founder, Fieldwork Stays</small></div></div>
          </div>
          <div className="col q2" style={{ background: '#edf1eb', borderRadius: 16, padding: 32, gap: 24 }}>
            <Quote size={30} color="#25634b" />
            <p className="sg" style={{ fontSize: 25, fontWeight: 400, lineHeight: 1.35 }}>“Not just a beautiful website. A much better way for our customers to find us and order.”</p>
            <div className="col" style={{ gap: 6 }}><b style={{ fontSize: 14 }}>Jamie Chen</b><small style={{ fontSize: 12 }}>Owner, Common Ground</small></div>
            <span className="sg" style={{ fontSize: 36, fontWeight: 400, color: '#25634b' }}>42% more orders</span>
          </div>
        </div>
      </section>

      <section className="sect faqsec">
        <div className="col faqside" style={{ gap: 22 }}>
          <p className="eyebrow">A few things you might be wondering</p><h2 className="h2" style={{ fontSize: 48 }}>Good questions. Straight answers.</h2>
          <p className="lead">Something else on your mind? I’m always happy to talk it through.</p>
          <a href="mailto:hello@goodform.studio" style={{ color: '#244df0', fontWeight: 500 }}>hello@goodform.studio ↗</a>
        </div>
        <div className="col" style={{ flex: 1 }}>
          {faqs.map(([q, a], i) => (
            <button key={q} className="faq" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              <span className="between" style={{ gap: 28, fontWeight: 500, fontSize: 17 }}>{q}{open === i ? <Minus size={18} /> : <Plus size={18} />}</span>
              {open === i && <p className="lead" style={{ fontSize: 15, marginTop: 16 }}>{a}</p>}
            </button>
          ))}
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <div className="between ctabox" style={{ background: '#edf1ff', borderRadius: 24 }}>
          <div className="col" style={{ gap: 18 }}><p className="eyebrow">Your next chapter starts here</p><h2 className="h2" style={{ fontSize: 55 }}>Let’s make a website you’re proud to share.</h2><p className="lead">No pitch deck required. Just tell me a little about your business.</p></div>
          <div className="col" style={{ alignItems: 'center', gap: 16 }}><BriefBtn lg>Tell me about your website</BriefBtn><small style={{ fontSize: 12 }}>No account. No pressure. A real conversation.</small></div>
        </div>
      </div>

      <footer className="dark col fdark" style={{ gap: 48 }}>
        <div className="between fcols">
          <div className="col fw1" style={{ gap: 20 }}>
            <Logo light /><p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>Thoughtful websites for independent businesses.<br />Designed and built by Alex Morgan in Bristol.</p>
            <a className="sg" href="mailto:hello@goodform.studio" style={{ fontSize: 26, fontWeight: 400 }}>hello@goodform.studio ↗</a>
          </div>
          <div className="col" style={{ gap: 15, fontSize: 14 }}><small style={{ fontSize: 12 }}>EXPLORE</small><a href="#work">Selected work</a><a href="#services">Services</a><a href="#how">How it works</a><a href="#/brief">Start your brief</a></div>
          <div className="col fw2" style={{ gap: 15, fontSize: 14 }}><small style={{ fontSize: 12 }}>ALREADY STARTED?</small><span style={{ lineHeight: 1.55 }}>Return to your saved brief or project with a secure email link.</span><a href="#/project">Send me a sign-in link ↗</a></div>
        </div>
        <div className="between" style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 24, fontSize: 12 }}><small>© 2026 Goodform Studio. Small by design.</small><small>Privacy policy &nbsp;&nbsp; Terms &nbsp;&nbsp; Instagram ↗</small></div>
      </footer>
    </div>
  )
}
