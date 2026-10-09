// Single source of truth for every admin-replaceable media slot. Shared by:
//  - vite.config.js (build-time plugin that bakes media.json into the HTML)
//  - api/admin-save-media.js (validates incoming keys)
//  - src/admin.js (renders the dashboard grid)
// Plain data only — no Node-only APIs — so it can be imported from both the
// server and the browser bundle.

function portfolioPhotoSlots() {
  const slots = [];
  for (let i = 1; i <= 17; i++) {
    slots.push({ key: `portfolio-photo-${i}`, label: `Фото ${i}`, kind: 'image', group: 'Портфоліо — фото' });
  }
  return slots;
}

function reviewSlots() {
  const slots = [];
  for (let i = 1; i <= 17; i++) {
    slots.push({ key: `review-${i}`, label: `Відгук ${i}`, kind: 'image', group: 'Відгуки' });
  }
  return slots;
}

export const MEDIA_SLOTS = [
  { key: 'hero-video', label: 'Головне відео', kind: 'video', group: 'Головна' },
  { key: 'liga-logo', label: 'Логотип', kind: 'image', group: 'Ліга Сміху' },
  { key: 'liga-video', label: 'Відео виступу', kind: 'video', group: 'Ліга Сміху' },
  { key: 'about-photo', label: 'Фото', kind: 'image', group: 'Про мене' },
  { key: 'portfolio-video-1', label: 'Відео 1', kind: 'video', group: 'Портфоліо — відео' },
  { key: 'portfolio-video-2', label: 'Відео 2', kind: 'video', group: 'Портфоліо — відео' },
  { key: 'portfolio-video-3', label: 'Відео 3', kind: 'video', group: 'Портфоліо — відео' },
  ...portfolioPhotoSlots(),
  ...reviewSlots(),
];

export const MEDIA_SLOT_KEYS = new Set(MEDIA_SLOTS.map((s) => s.key));

export function slotKind(key) {
  return MEDIA_SLOTS.find((s) => s.key === key)?.kind;
}
