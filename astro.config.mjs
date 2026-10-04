import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://woldscaninemassage.co.uk',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // Keep existing /page.html files; GitHub Pages also serves /page links.
    format: 'file',
  },
});
