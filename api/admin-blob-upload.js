import { handleUpload } from '@vercel/blob/client';
import { verifySession } from '../lib/admin-auth.js';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB — generous headroom over the largest existing clip

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Потрібна авторизація.' });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_SIZE_BYTES,
        addRandomSuffix: true,
      }),
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error('[admin-blob-upload]', err);
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
  }
}
