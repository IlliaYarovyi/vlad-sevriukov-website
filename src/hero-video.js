/**
 * Hero video placeholder: click toggles it between a tall default frame
 * and a 16:9 "expanded" one (see .hero-video's padding-bottom transition
 * in components.css). `aria-pressed` carries the toggle state for AT
 * users — the button already has a static aria-label describing the
 * action, so no label text needs to change on click.
 */
export function initHeroVideo() {
  const button = document.getElementById('hero-video-toggle');
  if (!button) return;

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!expanded));
  });
}
