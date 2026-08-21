/**
 * Hero video: a single <video> element that plays muted/looped inline by
 * default and, on click, grows into a fixed, centered, sound-on overlay
 * over a dark backdrop — the same element throughout, so playback
 * position carries over rather than restarting like a second lightbox
 * instance would. Click again, click the backdrop, or Escape collapses
 * it back to the muted inline preview.
 */
export function initHeroVideo() {
  const wrap = document.querySelector('.hero-video');
  const video = document.querySelector('.hero-video__player');
  const backdrop = document.querySelector('.hero-video-backdrop');
  const hint = document.querySelector('.hero-video__hint');
  const glyph = document.querySelector('.hero-video__glyph');
  if (!wrap || !video || !backdrop || !hint || !glyph) return;

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
    video.play().catch(() => {});
    paintExpanded();
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
