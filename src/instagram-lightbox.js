/**
 * Site-wide lightbox for any [data-lightbox] element (the Instagram grid
 * tiles, the hero video) — shows the picked photo/video bigger, in our
 * own styling, with a link through to the real Instagram post. Each
 * trigger is a real `<a href>` to that post, so without JS or on a
 * middle-click it just behaves like a normal link; `data-lightbox` +
 * `.preventDefault()` here is what upgrades a plain click to open the
 * popup instead.
 */
export function initInstagramLightbox() {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-image');
  const video = document.getElementById('lightbox-video');
  const link = document.getElementById('lightbox-link');
  const tiles = document.querySelectorAll('[data-lightbox]');
  if (!lightbox || !image || !video || !link || !tiles.length) return;

  let lastTrigger = null;

  function open(tile) {
    lastTrigger = tile;

    // Portfolio clips aren't Instagram posts — those triggers are plain
    // <button>s (no .href) and carry data-lightbox-no-link explicitly,
    // so there's nothing sensible to link to.
    if (tile.href && !('lightboxNoLink' in tile.dataset)) {
      link.href = tile.href;
      link.hidden = false;
    } else {
      link.hidden = true;
    }

    if (tile.dataset.lightboxType === 'video') {
      image.hidden = true;
      video.hidden = false;
      video.poster = tile.dataset.lightboxPoster || '';
      video.src = tile.dataset.lightboxSrc;
      video.play().catch(() => {
        // Blocked autoplay just leaves it paused on the poster frame —
        // the visible <video controls> lets the visitor start it manually.
      });
    } else {
      video.hidden = true;
      image.hidden = false;
      image.src = tile.dataset.lightboxSrc;
      image.alt = tile.querySelector('img')?.alt || '';
    }

    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    lightbox.querySelector('.lightbox__close').focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    image.src = '';
    video.pause();
    video.removeAttribute('src');
    video.load();
    lastTrigger?.focus();
  }

  tiles.forEach((tile) => {
    tile.addEventListener('click', (event) => {
      event.preventDefault();
      open(tile);
    });
  });

  lightbox.querySelectorAll('[data-lightbox-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || lightbox.hidden) return;
    close();
  });

  // Focus trap: queried fresh on every Tab press rather than cached,
  // since which elements are focusable changes with the media type — a
  // visible <video controls> is itself a native tab stop the way the
  // hidden <img> never is.
  lightbox.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || lightbox.hidden) return;
    const focusable = [...lightbox.querySelectorAll('button, a[href], video[controls]')].filter(
      (el) => !el.hidden && el.offsetParent !== null
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
