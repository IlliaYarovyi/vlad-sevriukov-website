/**
 * Hero video: a single <video> element that plays muted/looped inline by
 * default and, on click, expands to a sound-on state — the same element
 * throughout, so playback position carries over rather than restarting
 * like a second lightbox instance would. Click again, click the
 * backdrop, or Escape collapses it back to the muted inline preview.
 *
 * Above the mobile breakpoint (matches the 780px used in
 * components.css) that's a fixed, centered overlay over a dark
 * backdrop. Below it, per components.css, the same class instead grows
 * the video in place — no fixed positioning, no backdrop — so it pushes
 * the rest of the page down rather than taking over the screen; see the
 * comment on that media query for why (position:fixed centering has
 * real mobile-browser quirks). The scrollIntoView below is what makes
 * that read as "expands to the middle of the screen" rather than just
 * growing off the bottom of the viewport.
 */
export function initHeroVideo() {
  const wrap = document.querySelector('.hero-video');
  const video = document.querySelector('.hero-video__player');
  const backdrop = document.querySelector('.hero-video-backdrop');
  const hint = document.querySelector('.hero-video__hint');
  const glyph = document.querySelector('.hero-video__glyph');
  if (!wrap || !video || !backdrop || !hint || !glyph) return;

  const MOBILE_QUERY = '(max-width: 780px)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PREVIEW_HINT = 'без звуку — натисніть, щоб дивитися';
  const EXPANDED_HINT = 'зі звуком — натисніть, щоб згорнути';

  function paintCollapsed() {
    glyph.textContent = '▶';
    hint.textContent = PREVIEW_HINT;
    wrap.setAttribute('aria-label', PREVIEW_HINT);
  }

  function paintExpanded() {
    glyph.textContent = '❚❚';
    hint.textContent = EXPANDED_HINT;
    wrap.setAttribute('aria-label', EXPANDED_HINT);
  }

  paintCollapsed();
  video.muted = true;
  if (!reduceMotion) video.play().catch(() => {});

  function isExpanded() {
    return wrap.classList.contains('is-expanded');
  }

  function expand() {
    wrap.classList.add('is-expanded');
    backdrop.classList.add('is-visible');
    document.body.classList.add('hero-video-open');
    video.muted = false;
    // Upgrade from the short autoplay preview to the full promo clip
    // only now — on first expand, not on page load (see index.html
    // comment above this element for why).
    if (video.src.includes('hero-preview.mp4')) {
      video.src = '/media/hero-full.mp4';
    }
    video.play().catch(() => {});
    paintExpanded();

    // On mobile the box just grew taller in place (see the class doc
    // comment above) — recentre it in view instead of leaving whichever
    // part happened to already be on screen. requestAnimationFrame lets
    // the aspect-ratio change actually land before measuring position;
    // scrollIntoView on a position:fixed element (the desktop case)
    // reads its already-centered viewport position and is a no-op.
    if (window.matchMedia(MOBILE_QUERY).matches) {
      requestAnimationFrame(() => {
        wrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
    }
  }

  function collapse() {
    wrap.classList.remove('is-expanded');
    backdrop.classList.remove('is-visible');
    document.body.classList.remove('hero-video-open');
    video.muted = true;
    if (!reduceMotion) video.play().catch(() => {});
    paintCollapsed();
  }

  wrap.addEventListener('click', () => (isExpanded() ? collapse() : expand()));
  backdrop.addEventListener('click', collapse);

  // Safety net: if the browser itself pauses playback while expanded
  // (tab backgrounded, autoplay policy revoked, etc.), don't leave a
  // frozen expanded video sitting there — collapse back to the poster.
  video.addEventListener('pause', () => {
    if (isExpanded()) collapse();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isExpanded()) collapse();
  });
}
