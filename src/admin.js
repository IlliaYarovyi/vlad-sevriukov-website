// Entry point for admin.html — internal tool, not part of the public
// site's font/nav/footer chrome. See README "Адмінка медіа" for the
// architecture: files go straight to Vercel Blob from the browser, then a
// small commit to public/media.json (via the GitHub API, server-side)
// triggers the normal Vercel auto-deploy. No runtime fetching on the
// public site — the next build bakes these URLs straight into the HTML.
import { upload } from '@vercel/blob/client';
import { MEDIA_SLOTS } from '../lib/media-slots.js';

import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/admin.css';

const DEFAULT_MEDIA = buildDefaultMedia();

function buildDefaultMedia() {
  const map = {
    'hero-video': { video: '/media/hero-preview.mp4', poster: '/media/hero-poster.jpg' },
    'liga-logo': { image: '/media/liga-smihu.jpg' },
    'liga-video': { video: '/media/liga-smihu.mp4', poster: '/media/liga-smihu-poster.jpg' },
    'about-photo': { image: '/media/vlad-about.jpg' },
    'portfolio-video-1': { video: '/media/portfolio/pf-1-full.mp4', poster: '/media/portfolio/pf-1.jpg' },
    'portfolio-video-2': { video: '/media/portfolio/pf-2-full.mp4', poster: '/media/portfolio/pf-2.jpg' },
    'portfolio-video-3': { video: '/media/portfolio/pf-3-full.mp4', poster: '/media/portfolio/pf-3.jpg' },
  };
  for (let i = 1; i <= 17; i++) {
    map[`portfolio-photo-${i}`] = { image: `/media/portfolio/pf-n${i}.jpg` };
    map[`review-${i}`] = { image: `/media/reviews/rev-${i}.jpg` };
  }
  return map;
}

const loginSection = document.getElementById('admin-login');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('admin-login-error');
const dashboardSection = document.getElementById('admin-dashboard');
const grid = document.getElementById('admin-grid');
const logoutButton = document.getElementById('admin-logout');

async function checkSession() {
  try {
    const res = await fetch('/api/admin-session');
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
}

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  const password = document.getElementById('admin-password').value;
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Невірний пароль.');
    loginForm.reset();
    showDashboard();
    renderGrid();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener('click', async () => {
  await fetch('/api/admin-logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

async function fetchCurrentMedia() {
  try {
    const res = await fetch('/media.json', { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

function currentUrlFor(key, overrides) {
  const entry = overrides[key] || DEFAULT_MEDIA[key];
  const slot = MEDIA_SLOTS.find((s) => s.key === key);
  if (slot.kind === 'video') return entry.poster;
  return entry.image;
}

/** Grabs a frame from a video File as a JPEG File, entirely client-side —
 *  no server-side video processing needed for posters. */
function extractPosterFrame(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(videoFile);
    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 4);
    });
    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (!blob) return reject(new Error('Не вдалося створити обкладинку відео.'));
          resolve(new File([blob], 'poster.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    });
    video.addEventListener('error', () => reject(new Error('Не вдалося прочитати відео.')));
  });
}

function extExt(file) {
  const fromName = file.name.split('.').pop();
  return fromName && fromName.length <= 5 ? fromName : file.type.split('/')[1] || 'bin';
}

async function uploadFile(file, keyHint) {
  const result = await upload(`media-uploads/${keyHint}-${Date.now()}.${extExt(file)}`, file, {
    access: 'public',
    handleUploadUrl: '/api/admin-blob-upload',
  });
  return result.url;
}

async function handleFileChosen(slot, file, card) {
  const statusEl = card.querySelector('.admin-card__status');
  const thumbEl = card.querySelector('.admin-card__thumb');
  statusEl.textContent = 'Завантаження…';
  statusEl.className = 'admin-card__status';
  card.querySelector('input[type="file"]').disabled = true;

  try {
    let payload = { key: slot.key };
    if (slot.kind === 'image') {
      const url = await uploadFile(file, slot.key);
      payload.image = url;
      thumbEl.src = url;
    } else {
      statusEl.textContent = 'Створюю обкладинку з відео…';
      const posterFile = await extractPosterFrame(file);
      statusEl.textContent = 'Завантаження відео…';
      const [videoUrl, posterUrl] = await Promise.all([
        uploadFile(file, `${slot.key}-video`),
        uploadFile(posterFile, `${slot.key}-poster`),
      ]);
      payload.video = videoUrl;
      payload.poster = posterUrl;
      thumbEl.src = posterUrl;
    }

    statusEl.textContent = 'Зберігаю…';
    const res = await fetch('/api/admin-save-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Не вдалося зберегти.');

    statusEl.textContent = 'Збережено ✓ — сайт оновиться за ~1-2 хв';
    statusEl.classList.add('admin-card__status--ok');
  } catch (err) {
    statusEl.textContent = err.message || 'Помилка.';
    statusEl.classList.add('admin-card__status--error');
  } finally {
    card.querySelector('input[type="file"]').disabled = false;
  }
}

function buildCard(slot, overrides) {
  const card = document.createElement('div');
  card.className = 'admin-card';

  const thumb = document.createElement('img');
  thumb.className = 'admin-card__thumb';
  thumb.src = currentUrlFor(slot.key, overrides);
  thumb.alt = slot.label;
  thumb.loading = 'lazy';
  card.appendChild(thumb);

  const label = document.createElement('p');
  label.className = 'admin-card__label';
  label.textContent = slot.label;
  card.appendChild(label);

  const inputId = `file-${slot.key}`;
  const inputLabel = document.createElement('label');
  inputLabel.className = 'btn btn--outline-gold btn--sm admin-card__replace';
  inputLabel.setAttribute('for', inputId);
  inputLabel.textContent = 'Замінити';
  card.appendChild(inputLabel);

  const input = document.createElement('input');
  input.type = 'file';
  input.id = inputId;
  input.className = 'admin-card__input';
  input.accept = slot.kind === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) handleFileChosen(slot, file, card);
  });
  card.appendChild(input);

  const status = document.createElement('p');
  status.className = 'admin-card__status';
  card.appendChild(status);

  return card;
}

async function renderGrid() {
  grid.innerHTML = '<p class="admin-grid__loading">Завантаження…</p>';
  const overrides = await fetchCurrentMedia();

  const groups = new Map();
  for (const slot of MEDIA_SLOTS) {
    if (!groups.has(slot.group)) groups.set(slot.group, []);
    groups.get(slot.group).push(slot);
  }

  grid.innerHTML = '';
  for (const [groupName, slots] of groups) {
    const section = document.createElement('section');
    section.className = 'admin-group';

    const heading = document.createElement('h2');
    heading.className = 'admin-group__title';
    heading.textContent = groupName;
    section.appendChild(heading);

    const tiles = document.createElement('div');
    tiles.className = 'admin-group__tiles';
    for (const slot of slots) tiles.appendChild(buildCard(slot, overrides));
    section.appendChild(tiles);

    grid.appendChild(section);
  }
}

(async function init() {
  if (await checkSession()) {
    showDashboard();
    renderGrid();
  } else {
    showLogin();
  }
})();
