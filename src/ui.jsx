import { Asterisk, Check, FileText, FolderArchive, CheckCircle2, Download, X } from 'lucide-react'

export const Logo = ({ light }) => (
  <a href="#/" className="logo">
    <span className="mark" style={light ? { background: '#fff', color: '#244df0' } : null}><Asterisk size={20} /></span>
    <b>goodform</b><small>independent web studio</small>
  </a>
)
export const Btn = ({ p, lg, href, children, ...r }) => {
  const C = href ? 'a' : 'button'
  return <C href={href} className={`btn${p ? ' p' : ''}${lg ? ' lg' : ''}`} {...r}>{children}</C>
}
export const Pill = ({ t = 'g', children }) => <span className={`pill ${t}`}>{children}</span>
export const Chip = ({ on, radio, onClick, children }) => (
  <button type="button" className={`chip${on ? ' on' : ''}${radio ? ' radio' : ''}`} onClick={onClick} aria-pressed={!!on}>
    <i>{on && <Check size={12} />}</i>{children}
  </button>
)
export const Field = ({ label, hint, children }) => <div className="field"><label>{label}</label>{children}{hint && <p className="hint">{hint}</p>}</div>
export const Summary = ({ label, children }) => <div className="sum"><small>{label}</small><p>{children}</p></div>
export const Footer = ({ right }) => <footer className="foot"><span>© 2026 Goodform Studio</span><span>{right}</span></footer>
export const Photo = ({ src, h, w, r = 0 }) => (
  <div className="photo" style={{ height: h, width: w, borderRadius: r }}>
    {src && <img src={`${import.meta.env.BASE_URL}images/${src}.png`} alt="" onError={e => e.currentTarget.remove()} />}
  </div>
)
export const FileCard = ({ f, onX }) => {
  const Z = f.type === 'ZIP' ? FolderArchive : FileText
  const src = f.url || (f.img && `${import.meta.env.BASE_URL}images/${f.img}.png`)
  return (
    <div className="file">
      <div className="thumb">{src ? <img src={src} alt="" onError={e => e.currentTarget.remove()} /> : <Z size={23} />}</div>
      <div className="col" style={{ gap: 6, flex: 1, minWidth: 0 }}>
        <b style={{ fontWeight: 500, fontSize: 14 }}>{f.name}</b>
        <small style={{ fontSize: 12 }}>{f.type} · {f.size} MB{onX && ' · Upload complete'}</small>
      </div>
      <CheckCircle2 size={18} color="#25634b" />
      {onX ? <button onClick={onX} aria-label={`Remove ${f.name}`}><X size={18} /></button> : <Download size={18} color="#67716f" />}
    </div>
  )
}
