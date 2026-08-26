import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isConfigured = Boolean(url && key);

// Only create a real client when env vars are present.
// Otherwise export a stub so the app can render a helpful error message
// instead of crashing with a blank white page.
export const supabase = isConfigured
  ? createClient(url, key)
  : { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), signInWithPassword: async () => ({ error: new Error('Supabase not configured') }), signUp: async () => ({ error: new Error('Supabase not configured') }), signOut: async () => {} } };

export { isConfigured };
