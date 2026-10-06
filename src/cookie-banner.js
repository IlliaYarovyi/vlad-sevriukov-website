/**
 * Small, non-blocking cookie notice — shown once (bottom of screen) until
 * dismissed, then never again (localStorage flag). The site doesn't set
 * any tracking/analytics cookies today (see README "Cookie-банер і
 * правові сторінки"), so this is a plain notice with one "Прийняти"
 * button rather than a consent gate with accept/reject choices — nothing
 * on the site actually depends on the visitor's answer yet. Revisit this
 * if analytics/ads ever get added.
 */
const STORAGE_KEY = 'cookie-consent';

export function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-banner-accept');
  if (!banner || !acceptBtn) return;

  let alreadyAccepted = false;
  try {
    alreadyAccepted = localStorage.getItem(STORAGE_KEY) === 'accepted';
  } catch {
    // Storage blocked (private mode, locked-down browser settings) — just
    // show the banner every visit rather than breaking the page over it.
  }
  if (alreadyAccepted) return;

  banner.hidden = false;

  acceptBtn.addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // Nothing to fall back to — the banner just closes for this visit.
    }
    banner.hidden = true;
  });
}
