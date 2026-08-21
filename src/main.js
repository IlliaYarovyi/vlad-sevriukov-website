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
import { initInstagramLightbox } from './instagram-lightbox.js';
import { initInstagramVideoPreviews } from './instagram-video-preview.js';

initNav();
initContactForm();
initInstagramLightbox();
initInstagramVideoPreviews();

// The hero video autoplays via its HTML `autoplay` attribute (it's
// above the fold, so — unlike the Instagram tile previews — there's no
// scroll-into-view moment to hook a JS play() call onto instead). This
// is the one place that still needs a direct check: reduced-motion
// users get the poster frame, paused, same as everywhere else on the
// page that animates.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelector('.hero-video__player')?.pause();
}
