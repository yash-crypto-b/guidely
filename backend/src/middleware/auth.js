import { supabaseAdmin } from '../lib/supabase.js';

// Gate for protected routes. Verifies the Supabase access token from the
// `Authorization: Bearer <jwt>` header against Supabase, and attaches the
// verified user. The user id is ALWAYS derived from the token here — never
// trusted from the request body/query.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (err) {
    next(err); // transient Supabase/network failure → central handler → 500
  }
}
