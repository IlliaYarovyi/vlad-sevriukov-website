// Vercel serverless function (Node.js runtime). Deploy target: Vercel —
// see README "Contact form backend" for the Telegram bot setup and the
// TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID environment variables this reads.
//
// Kept deliberately framework-free (default export `(req, res) => {}` is
// Vercel's native Node function signature) so it has zero extra
// dependencies to audit or update.

const MAX_FIELD_LENGTH = 500;
const REQUIRED_FIELDS = ['name', 'phone'];
const OPTIONAL_FIELDS = ['social', 'date', 'city', 'type', 'guests', 'comment'];
const FIELD_LABELS = {
  name: "Ім'я",
  phone: 'Телефон',
  social: 'Telegram/Instagram',
  date: 'Дата події',
  city: 'Місто',
  type: 'Тип події',
  guests: 'Кількість гостей',
  comment: 'Коментар',
};

// Best-effort, per-instance sliding-window limiter. Serverless instances
// are ephemeral and this resets on every cold start, so treat it as a
// speed bump against accidental double-submits/basic scripted abuse, not
// a real rate limiter — put one in front of this at the edge/WAF if this
// form is ever a real spam target.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clean(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_FIELD_LENGTH) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Забагато запитів. Спробуйте за хвилину.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('[send-telegram] Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env vars.');
    return res.status(500).json({ error: 'Форма тимчасово недоступна. Напишіть напряму в Telegram.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Honeypot ('company') is stripped client-side already; if it somehow
  // arrives non-empty here, treat the submission as bot traffic.
  if (clean(body.company) !== '') {
    return res.status(200).json({ ok: true });
  }

  for (const field of REQUIRED_FIELDS) {
    if (clean(body[field]) === '') {
      return res.status(400).json({ error: `Заповніть поле «${FIELD_LABELS[field]}»` });
    }
  }

  const lines = ['<b>Нова заявка з сайту</b>', ''];
  for (const field of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    const value = clean(body[field]);
    if (value) lines.push(`<b>${FIELD_LABELS[field]}:</b> ${escapeHtml(value)}`);
  }

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!telegramRes.ok) {
      const detail = await telegramRes.text().catch(() => '');
      console.error('[send-telegram] Telegram API error:', telegramRes.status, detail);
      return res.status(502).json({ error: 'Не вдалося надіслати повідомлення в Telegram.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-telegram] fetch to Telegram failed:', err);
    return res.status(502).json({ error: 'Не вдалося зв’язатися з Telegram.' });
  }
}
