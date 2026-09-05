// @ts-check
import { defineConfig } from 'astro/config';
import { site, base } from './site.config.mjs';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  output: 'static',
  // Keep every bundled module script as an external file. With the default
  // inline limit (~4 KB) Vite inlines small client bundles as inline
  // `<script type="module">`, whose sha256 would change on every refactor —
  // that fights the Content-Security-Policy hash set in BaseLayout. Only
  // explicit `is:inline` scripts remain inline and are hashed.
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
