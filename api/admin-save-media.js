import { verifySession } from '../lib/admin-auth.js';
import { readJsonFile, writeJsonFile } from '../lib/github-content.js';
import { MEDIA_SLOT_KEYS, slotKind } from '../lib/media-slots.js';

const MEDIA_JSON_PATH = 'public/media.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Потрібна авторизація.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { key, image, video, poster } = body || {};
  if (!MEDIA_SLOT_KEYS.has(key)) {
    return res.status(400).json({ error: `Невідомий слот: ${key}` });
  }

  const kind = slotKind(key);
  const isHttpsUrl = (v) => typeof v === 'string' && v.startsWith('https://');
  if (kind === 'image' && !isHttpsUrl(image)) {
    return res.status(400).json({ error: 'Очікувалось поле image з посиланням на завантажений файл.' });
  }
  if (kind === 'video' && (!isHttpsUrl(video) || !isHttpsUrl(poster))) {
    return res.status(400).json({ error: 'Очікувались поля video і poster з посиланнями на завантажені файли.' });
  }

  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    console.error('[admin-save-media] Missing GITHUB_TOKEN / GITHUB_REPO env vars.');
    return res.status(500).json({ error: 'Збереження ще не налаштоване на сервері.' });
  }

  try {
    const { content, sha } = await readJsonFile(MEDIA_JSON_PATH);
    content[key] = kind === 'image' ? { image } : { video, poster };
    await writeJsonFile(MEDIA_JSON_PATH, content, sha, `Адмінка: оновлено медіа "${key}"`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[admin-save-media]', err);
    return res.status(502).json({ error: 'Не вдалося зберегти зміни в репозиторії.' });
  }
}
