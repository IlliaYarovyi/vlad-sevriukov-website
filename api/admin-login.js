import { checkPassword, createSessionCookie } from '../lib/admin-auth.js';

// Best-effort per-instance limiter, same reasoning as send-telegram.js —
// resets on cold start, just a speed bump against casual guessing.
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Забагато спроб. Зачекайте хвилину.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    console.error('[admin-login] Missing ADMIN_PASSWORD / SESSION_SECRET env vars.');
    return res.status(500).json({ error: 'Адмінка ще не налаштована на сервері.' });
  }

  if (!checkPassword(body?.password)) {
    return res.status(401).json({ error: 'Невірний пароль.' });
  }

  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ ok: true });
}
