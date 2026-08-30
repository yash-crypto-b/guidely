import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../common/errors';
import { Role } from '@prisma/client';
import prisma from '../db';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

/** Supabase JWT claim shape (subset). */
interface SupabaseJwtClaims {
  sub: string;       // user UUID
  email?: string;
  role?: string;     // Supabase role ("authenticated")
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Role cache ────────────────────────────────────────────────────────
// Avoids a Prisma lookup on every request. Entries expire after 5 min.
const ROLE_CACHE_TTL_MS = 5 * 60 * 1000;
const roleCache = new Map<string, { role: Role; expiresAt: number }>();

async function resolveUserRole(userId: string): Promise<Role> {
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.role;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const role = user?.role ?? Role.STUDENT;
    roleCache.set(userId, { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
    return role;
  } catch {
    // DB lookup failed — default to STUDENT so the request isn't blocked
    return Role.STUDENT;
  }
}

// ─── Token verification ────────────────────────────────────────────────

/**
 * Try to verify a token against both the custom JWT secret and the Supabase
 * JWT secret. Returns a JwtPayload on success, null on failure.
 *
 * Strategy:
 *  1. Try the custom app JWT (fast, no DB needed — role is embedded).
 *  2. Try the Supabase JWT (fast, signature-only — role is resolved from DB).
 */
async function verifyToken(token: string): Promise<JwtPayload | null> {
  // 1. Custom app JWT
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    if (decoded.userId && decoded.email) return decoded;
  } catch {
    // Not a valid custom JWT — try Supabase next.
  }

  // 2. Supabase JWT
  const supabaseSecret = config.supabase.jwtSecret;
  if (!supabaseSecret) return null;

  try {
    const decoded = jwt.verify(token, supabaseSecret) as SupabaseJwtClaims;
    if (!decoded.sub) return null;

    const role = await resolveUserRole(decoded.sub);
    return {
      userId: decoded.sub,
      email: decoded.email ?? '',
      role,
    };
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyToken(token);
  if (!payload) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  req.user = payload;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyToken(token);
  if (payload) req.user = payload;
  next();
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}
