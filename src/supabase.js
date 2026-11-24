import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// The publishable key is safe in the browser: the database rules (RLS) decide what visitors can do.
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null

// After the Microsoft sign-in redirect, make sure the person lands back on the admin page.
if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' && sessionStorage.getItem('gf-after-login')) {
      sessionStorage.removeItem('gf-after-login')
      if (!location.hash.startsWith('#/admin')) location.hash = '#/admin'
    }
  })
}
