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
import { initInstagramLightbox } from './instagram-lightbox.js';

initNav();
initContactForm();
initHeroVideo();
initInstagramLightbox();
