import { supabase } from './supabase'

// Matches the database check on briefs.project_code: GF- + 6 characters, no I/O/0/1
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newCode = () => 'GF-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), n => ALPHABET[n % 32]).join('')

// Uploads any files, then saves the brief. Returns the project code (e.g. GF-7K3QX2).
export async function submitBrief(f) {
  if (!supabase) throw new Error('Supabase is not set up yet. Check your .env file and restart npm run dev.')
  const id = crypto.randomUUID()
  const project_code = newCode()

  const files = []
  for (const x of f.files) {
    const entry = { name: x.name, size: x.size, type: x.type }
    if (x.file) {
      const path = `${id}/${Date.now()}-${x.name.replace(/[^\w.-]+/g, '_')}`
      const { error } = await supabase.storage.from('brief-files').upload(path, x.file, { contentType: x.file.type || undefined })
      if (error) throw error
      entry.path = path
    }
    files.push(entry)
  }

  const { error } = await supabase.from('briefs').insert({
    id, project_code, files, consent: true,
    name: f.name, email: f.email, phone: f.phone || null, business: f.business, industry: f.industry,
    about: f.about, site: f.site, project_type: f.type, goals: f.goals, audience: f.audience, success: f.success,
    pages: f.pages, features: f.features, func: f.func, feel: f.feel, avoid: f.avoid,
    ready: f.ready, ready_note: f.readyNote, budget: f.budget, launch: f.launch, flex: f.flex, driver: f.driver,
    extra: f.extra, refs: f.refs.map(({ url, title, like }) => ({ url, title, like })),
  })
  if (error) throw error
  return project_code
}
