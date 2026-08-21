/**
 * Instagram tile lightbox: clicking a tile shows the picked photo bigger,
 * in our own styling, with a link through to the real post — instead of
 * navigating straight to Instagram (the `<a href>` is still real, so
 * without JS or with a middle-click it behaves like a normal link;
 * `data-lightbox` + `.preventDefault()` here is what upgrades that click
 * to open the popup instead).
 */
export function initInstagramLightbox() {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-image');
  const link = document.getElementById('lightbox-link');
  const tiles = document.querySelectorAll('[data-lightbox]');
  if (!lightbox || !image || !link || !tiles.length) return;

  let lastTrigger = null;

  function open(tile) {
    lastTrigger = tile;
    image.src = tile.dataset.lightboxSrc;
    image.alt = tile.querySelector('img')?.alt || '';
    link.href = tile.href;
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    lightbox.querySelector('.lightbox__close').focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    image.src = '';
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

  // Minimal focus trap: only two things in the dialog can hold focus
  // (close button, the "view on Instagram" link), so Tab/Shift+Tab just
  // needs to bounce between them.
  lightbox.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || lightbox.hidden) return;
    const focusable = [lightbox.querySelector('.lightbox__close'), link];
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
