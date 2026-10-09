// Shared by every api/admin-*.js function. Lives outside api/ on purpose —
// anything directly under api/ becomes a public Vercel route, and this file
// exports nothing that should be callable on its own.
//
// Stateless session: a short JSON payload (just an expiry) plus an
// HMAC-SHA256 signature over it, both base64url-encoded and dot-joined. No
// session store needed — verifying is just recomputing the signature and
// checking the expiry, so it works the same across any number of
// serverless instances.

import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionCookie() {
  const secret = requireSecret();
  const payload = base64url(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  const token = `${payload}.${sign(payload, secret)}`;
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function verifySession(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;

  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

export function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== 'string') return false;
  // Hash both first so the comparison is constant-time regardless of how
  // the candidate's length compares to the real password's.
  const aHash = createHmac('sha256', 'cmp').update(candidate).digest();
  const bHash = createHmac('sha256', 'cmp').update(expected).digest();
  return timingSafeEqual(aHash, bHash);
}

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET env var is not set');
  return secret;
}
