import { supabaseAdmin } from '../lib/supabase.js';

// Gate for protected routes. Verifies the Supabase access token from the
// `Authorization: Bearer <jwt>` header against Supabase, and attaches the
// verified user. The user id is ALWAYS derived from the token here — never
// trusted from the request body/query.
//
// JWT Strategy:
// - Supabase access tokens: 1 hour expiry (default)
// - Supabase refresh tokens: 30 days expiry (handled by frontend)
// - Backend validates access token on every request
// - Frontend handles refresh via supabase.auth.refreshSession()
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    // Verify token with Supabase (validates expiry internally)
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ 
        error: 'Invalid or expired session',
        code: 'TOKEN_INVALID',
      });
    }

    // Additional expiry check (belt and suspenders)
    // Supabase tokens contain exp claim, but let's decode and verify
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      const expiresAt = payload.exp * 1000; // Convert to ms
      const now = Date.now();
      const bufferMs = 30_000; // 30 second buffer
      
      if (expiresAt - bufferMs < now) {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          expiresIn: Math.max(0, Math.floor((expiresAt - now) / 1000)),
        });
      }
      
      // Attach token expiry info for downstream use
      req.tokenExpiresAt = expiresAt;
      req.tokenExpiresIn = Math.floor((expiresAt - now) / 1000);
    } catch {
      // If we can't decode, let Supabase validation handle it
    }

    req.user = data.user;
    req.accessToken = token;
    
    // Set token expiry header for client awareness
    if (req.tokenExpiresIn) {
      res.set('X-Token-Expires-In', String(req.tokenExpiresIn));
    }
    
    next();
  } catch (err) {
    next(err); // transient Supabase/network failure → central handler → 500
  }
}

// Optional auth - attaches user if token present, but doesn't require it
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    
    if (!token) return next();

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      // Invalid token - continue without user
      return next();
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch {
    // Transient error - continue without user
    next();
  }
}
