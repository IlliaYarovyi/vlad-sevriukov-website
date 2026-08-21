/**
 * Mobile navigation: hamburger button <-> full-screen menu panel.
 * Keyboard-accessible (Escape closes, focus stays sane) and locks page
 * scroll while open so the menu doesn't fight the page behind it.
 */
export function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const links = menu.querySelectorAll('a');

  function open() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }

  function close() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  links.forEach((link) => link.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      close();
      toggle.focus();
    }
  });

  // A resize past the mobile breakpoint (e.g. rotating a tablet, or a
  // desktop window growing) shouldn't leave the overlay stuck open.
  const mq = window.matchMedia('(min-width: 781px)');
  mq.addEventListener('change', (event) => {
    if (event.matches && isOpen()) close();
  });
}
