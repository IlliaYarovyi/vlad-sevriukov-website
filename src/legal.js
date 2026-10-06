// Entry point for the standalone legal pages (privacy.html, cookies.html)
// — same fonts/styles/header/footer as the main site, but only the JS
// those pages actually use: the mobile menu and the cookie banner. No
// hero video, contact form, lightboxes, or map — none of that markup
// exists on these pages.
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
import { initCookieBanner } from './cookie-banner.js';

initNav();
initCookieBanner();
