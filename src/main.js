// Self-hosted fonts (no third-party request to Google Fonts at runtime) —
// only the weights/styles the design actually uses.
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { initNav } from './nav.js';
import { initContactForm } from './contact-form.js';
import { initHeroVideo } from './hero-video.js';
import { initPortfolioHoverPreviews } from './portfolio-hover-preview.js';
import { initGalleryLightbox } from './gallery-lightbox.js';
import { initClipModal } from './clip-modal.js';
import { initCookieBanner } from './cookie-banner.js';
import './ukraine-map.js';

initNav();
initContactForm();
initHeroVideo();
initPortfolioHoverPreviews();
initClipModal();
initCookieBanner();

// Portfolio photos: prev/next + a running counter.
const photoTriggers = [...document.querySelectorAll('[data-lightbox-photo]')];
const photoItems = photoTriggers.map((trigger) => ({
  src: trigger.querySelector('img').src,
  alt: trigger.querySelector('img').alt,
}));
const photoLightbox = initGalleryLightbox({
  overlay: document.getElementById('photo-lightbox'),
  items: photoItems,
  renderCaption: (caption, item, index, total) => {
    caption.textContent = `${index + 1} / ${total}`;
  },
});
photoTriggers.forEach((trigger, i) => {
  trigger.addEventListener('click', () => photoLightbox?.open(i, trigger));
});

// Reviews: prev/next + a name + role caption instead of a counter.
const reviewTriggers = [...document.querySelectorAll('[data-lightbox-review]')];
const reviewItems = reviewTriggers.map((trigger) => ({
  src: trigger.querySelector('img').src,
  alt: trigger.querySelector('img').alt,
  name: trigger.querySelector('.review-tile__name').textContent,
  role: trigger.querySelector('.review-tile__role').textContent,
}));
const reviewLightbox = initGalleryLightbox({
  overlay: document.getElementById('review-lightbox'),
  items: reviewItems,
  renderCaption: (caption, item) => {
    caption.innerHTML = `<strong>${item.name}</strong> ${item.role}`;
  },
});
reviewTriggers.forEach((trigger, i) => {
  trigger.addEventListener('click', () => reviewLightbox?.open(i, trigger));
});
