/**
 * Portfolio video tiles: static poster by default, muted preview plays
 * only while hovered (or keyboard-focused), resets to the start on
 * mouseleave/blur — no autoplay. The <source> is still lazy-loaded once
 * the tile scrolls into view (so playback starts instantly on the first
 * hover instead of waiting on a fetch), it just never calls play() on
 * its own.
 *
 * Clicking still opens the full clip in the site lightbox — untouched,
 * handled entirely by instagram-lightbox.js via the tile's
 * [data-lightbox] attribute.
 */
export function initPortfolioHoverPreviews() {
  const videos = document.querySelectorAll('.portfolio-tile__video');
  if (!videos.length) return;

  const loadObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const video = entry.target;
        const source = video.querySelector('source');
        if (source && !source.src) {
          source.src = source.dataset.src;
          video.load();
        }
        loadObserver.unobserve(video);
      }
    },
    { rootMargin: '150px' }
  );

  videos.forEach((video) => {
    loadObserver.observe(video);

    const tile = video.closest('.portfolio-tile');
    if (!tile) return;

    function play() {
      video.currentTime = 0;
      video.play().catch(() => {
        // Nothing to fall back to here — the poster frame is already
        // showing, so a blocked play() just leaves it static.
      });
    }

    function stop() {
      video.pause();
      video.currentTime = 0;
    }

    tile.addEventListener('mouseenter', play);
    tile.addEventListener('mouseleave', stop);
    tile.addEventListener('focus', play);
    tile.addEventListener('blur', stop);
  });
}
