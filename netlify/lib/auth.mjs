/* Who is calling? Reads the Supabase session token from the Authorization header and asks Supabase Auth
   whether it is valid. The service-role client (bypasses Row Level Security) exists only here, on the server. */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE, MOCK_AI, ALLOW_ANON_AI } from './env.mjs';

let serviceClient = null;
export function serviceDb() {
  if (!SUPABASE.configured || !SUPABASE.serviceKey) return null;
  if (!serviceClient) serviceClient = createClient(SUPABASE.url, SUPABASE.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return serviceClient;
}

export function bearer(req) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/* Returns { id, role, email, displayName, schoolId, anon } or null when the caller is not allowed. */
export async function identify(req, context = {}) {
  const token = bearer(req);
  if (SUPABASE.configured && token) {
    const client = createClient(SUPABASE.url, SUPABASE.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data || !data.user) return null;
    const u = data.user;
    const meta = u.user_metadata || {};
    let profile = null;
    const db = serviceDb();
    if (db) {
      const r = await db.from('profiles').select('role, display_name, school_id, lang').eq('id', u.id).maybeSingle();
      profile = r.data || null;
      /* A login with no profile row was not made by /api/account (e.g. someone who found the project's public sign-up
         endpoint). It gets no AI and no account actions. Role and school come from the row, never from user metadata. */
      if (!profile) return null;
    }
    return { id: u.id, email: u.email || null, role: (profile && profile.role) || meta.role || 'student', displayName: (profile && profile.display_name) || meta.display_name || '', schoolId: profile ? profile.school_id : null, lang: (profile && profile.lang) || 'en', anon: false };
  }
  if (MOCK_AI || ALLOW_ANON_AI) {
    /* No accounts configured, or an explicit smoke-test switch: identify by a browser-chosen id, limited per IP too. */
    const local = req.headers.get('x-rostra-local-user') || '';
    const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    return { id: 'local:' + (local.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || ip), email: null, role: 'student', displayName: '', schoolId: null, lang: 'en', anon: true, ip };
  }
  return null;
}
