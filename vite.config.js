import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { MEDIA_SLOTS } from './lib/media-slots.js';

// Bakes public/media.json overrides into the built HTML at build time, so
// admin-replaced media (see admin.html / README "Адмінка медіа") ships as
// plain static src/poster attributes — no runtime fetch-and-swap on the
// public site, nothing to cost LCP. Every element that can be swapped is
// marked in index.html with data-media-key="<slot>"; a key with no entry
// in media.json (the default, nothing replaced yet) is left untouched.
function mediaOverridesPlugin() {
  return {
    name: 'media-overrides',
    transformIndexHtml(html) {
      const mediaJsonPath = resolve(__dirname, 'public/media.json');
      if (!existsSync(mediaJsonPath)) return html;
      const mediaConfig = JSON.parse(readFileSync(mediaJsonPath, 'utf8'));
      if (Object.keys(mediaConfig).length === 0) return html;

      return html.replace(/<([a-zA-Z0-9]+)\b[^>]*\bdata-media-key="([^"]+)"[^>]*>/g, (tagHtml, tagName, key) => {
        const entry = mediaConfig[key];
        if (!entry) return tagHtml;
        const slot = MEDIA_SLOTS.find((s) => s.key === key);
        let out = tagHtml;
        const setAttr = (name, value) => {
          const re = new RegExp(`${name}="[^"]*"`);
          if (re.test(out)) out = out.replace(re, `${name}="${value}"`);
        };
        if (tagName === 'button') {
          if (entry.video) setAttr('data-clip-src', entry.video);
        } else if (tagName === 'video') {
          if (entry.video) setAttr('src', entry.video);
          if (entry.poster) setAttr('poster', entry.poster);
        } else if (tagName === 'source') {
          if (entry.video) setAttr('data-src', entry.video);
        } else if (tagName === 'img') {
          if (slot?.kind === 'video') {
            if (entry.poster) setAttr('src', entry.poster);
          } else if (entry.image) {
            setAttr('src', entry.image);
          }
        }
        return out;
      });
    },
  };
}

export default defineConfig({
  plugins: [mediaOverridesPlugin()],
  build: {
    target: 'es2020',
    sourcemap: true,
    // Multi-page build: the main site plus the standalone legal/admin pages
    // (privacy.html, cookies.html, admin.html). Without this, Vite only
    // builds index.html and the others 404 in production even though they
    // work fine in `vite dev`.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        cookies: resolve(__dirname, 'cookies.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
