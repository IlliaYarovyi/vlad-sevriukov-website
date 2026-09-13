/**
 * Reusable full-screen image viewer with prev/next navigation, keyboard
 * arrows, Escape-to-close, and a focus trap — the shared engine behind
 * both the portfolio photo lightbox (#photo-lightbox, numeric counter)
 * and the review lightbox (#review-lightbox, name + role caption). Each
 * caller supplies its own overlay element, its list of items, and a
 * renderCaption(item, index, total) callback for the one bit that
 * differs between them; everything else (open/close/prev/next, keyboard,
 * focus) is identical, so it isn't duplicated per caller.
 *
 * Triggers aren't wired here — a caller attaches its own click listeners
 * (matching each trigger's position in `items`) and calls the returned
 * `open(index, trigger)`.
 */
export function initGalleryLightbox({ overlay, items, renderCaption }) {
  if (!overlay || !items.length) return null;

  const img = overlay.querySelector('[data-lightbox-img]');
  const caption = overlay.querySelector('[data-lightbox-caption]');
  const closeEls = overlay.querySelectorAll('[data-lightbox-close]');
  const prevBtn = overlay.querySelector('[data-lightbox-prev]');
  const nextBtn = overlay.querySelector('[data-lightbox-next]');

  let index = null;
  let lastTrigger = null;

  function render() {
    const item = items[index];
    img.src = item.src;
    img.alt = item.alt || '';
    if (caption) renderCaption(caption, item, index, items.length);
  }

  function isOpen() {
    return index !== null;
  }

  function open(i, trigger) {
    index = ((i % items.length) + items.length) % items.length;
    lastTrigger = trigger || null;
    render();
    overlay.hidden = false;
    document.body.classList.add('lightbox-open');
    overlay.querySelector('.lightbox__close')?.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('lightbox-open');
    img.src = '';
    index = null;
    lastTrigger?.focus();
  }

  function prev() {
    open((index - 1 + items.length) % items.length);
  }

  function next() {
    open((index + 1) % items.length);
  }

  closeEls.forEach((el) => el.addEventListener('click', close));
  prevBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    prev();
  });
  nextBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    next();
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') prev();
    if (event.key === 'ArrowRight') next();
  });

  // Focus trap, same pattern as the old Instagram lightbox: queried fresh
  // on every Tab press since which buttons exist doesn't change here,
  // but this keeps the trap logic identical/copyable across overlays.
  overlay.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !isOpen()) return;
    const focusable = [...overlay.querySelectorAll('button')].filter((el) => el.offsetParent !== null);
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

  return { open, close };
}
