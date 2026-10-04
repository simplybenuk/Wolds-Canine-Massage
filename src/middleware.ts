import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Pages serves the built .html files; give local development the same URLs.
  if (import.meta.env.DEV && context.url.pathname.endsWith('.html')) {
    const url = new URL(context.url);
    url.pathname = url.pathname === '/index.html' ? '/' : url.pathname.slice(0, -5);
    return context.rewrite(url);
  }
  return next();
});
