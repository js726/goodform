import { useEffect, useState } from 'react'
import Landing from './Landing'
import Brief from './Brief'
import Project from './Project'; import Admin from './Admin'
import { demo } from './data'

const KEY = 'goodform-brief-2'
const route = () => location.hash.replace('#/', '').split('?')[0] || 'home'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || demo } catch { return demo } }

export default function App() {
  const [r, setR] = useState(route())
  const [form, setForm] = useState(() => { const d = load(); return d.code && route() === 'home' ? demo : d })
  useEffect(() => {
    const f = () => { const next = route(); if (next === 'home') setForm(x => (x.code ? demo : x)); setR(next); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  // Auto-saved draft (fresh uploads can't be restored after a refresh, so they are dropped)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...form, files: form.files.map(({ url, file, ...f }) => f) })) } catch {}
  }, [form])
  const page = r === 'brief' ? <Brief form={form} set={setForm} /> : r === 'project' ? <Project form={form} /> : r === 'admin' ? <Admin /> : <Landing />
  return (
    <>
      {page}
      {import.meta.env.DEV && (
        <nav className="dev">{['home', 'brief', 'project', 'admin'].map(k => <a key={k} href={`#/${k === 'home' ? '' : k}`} className={r === k ? 'on' : ''}>{k}</a>)}</nav>
      )}
    </>
  )
}
