import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://woldscaninemassage.co.uk',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // Keep existing /page.html files; GitHub Pages also serves /page links.
    format: 'file',
  },
  vite: {
    plugins: [{
      name: 'html-page-urls',
      apply: 'serve',
      configureServer(server) {
        // Normalize before Astro routes document requests in development.
        // Production uses the actual .html files emitted by build.format.
        server.middlewares.use((request, _response, next) => {
          const url = new URL(request.url ?? '/', 'http://localhost');
          if (url.pathname.endsWith('.html')) {
            url.pathname = url.pathname === '/index.html' ? '/' : url.pathname.slice(0, -5);
            request.url = url.pathname + url.search;
          }
          next();
        });
      },
    }],
  },
});
