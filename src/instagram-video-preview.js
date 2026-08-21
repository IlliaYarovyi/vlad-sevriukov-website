/**
 * Instagram reel tiles loop a small muted preview clip once scrolled
 * into view — nothing downloads until then (the <source> has no `src`,
 * only `data-src`, until the IntersectionObserver fires), and it pauses
 * again once scrolled away. Skipped entirely under
 * prefers-reduced-motion: the poster frame just sits there, static.
 *
 * Portfolio's video tiles intentionally do NOT use this — they're
 * static until hovered instead (see portfolio-hover-preview.js), a
 * deliberate difference from these Instagram picks.
 */
export function initInstagramVideoPreviews() {
  const videos = document.querySelectorAll('.instagram-tile__video');
  if (!videos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting) {
          const source = video.querySelector('source');
          if (source && !source.src) {
            source.src = source.dataset.src;
            video.load();
          }
          video.play().catch(() => {
            // Autoplay can still be blocked in some embedded/webview
            // contexts even when muted — the poster frame is a fine
            // fallback, nothing else to do here.
          });
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '100px' }
  );

  videos.forEach((video) => observer.observe(video));
}
