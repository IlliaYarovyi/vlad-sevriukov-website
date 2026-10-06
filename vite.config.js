import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    // Multi-page build: the main site plus the two standalone legal pages
    // (privacy.html, cookies.html — see README "Privacy/Cookie policy").
    // Without this, Vite only builds index.html and the other two 404 in
    // production even though they work fine in `vite dev`.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      },
    },
  },
});
