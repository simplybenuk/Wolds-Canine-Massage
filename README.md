# Wolds Canine Massage

The website uses Astro and deploys static files from `main` to GitHub Pages. Booking remains on Square, and courses remain on the Wolds Canine Academy.

## Run locally

Use Node.js 24 LTS and npm 11 or newer. With nvm:

```bash
nvm use
npm ci
npm run dev
```

Open `http://localhost:4321`. Development omits Google Tag Manager and disables custom events.
Stop the development server with `npm run dev -- stop`.

```bash
npm run verify
npm run preview
```

`verify` checks Astro types, runs consent/event regression tests, builds the site, and checks the output's URLs, consent scripts and deployment files. `preview` serves production output from `dist/`. Production builds include GTM, while custom events also require the configured live hostname. Intercept Analytics collection requests when testing production pages in a browser.

## Edit the website

- Pages: `src/pages/*.astro`
- Shared layout/navigation: `src/layouts/` and `src/components/`
- Styles: `src/styles/`, using Sass modules
- Testimonials: `src/content/testimonials/*.md`
- Images, downloads and browser analytics script: `public/assets/`
- Site hostname and GA4 destination: `astro.config.mjs` and `src/config/site.ts`

The build keeps `/page.html` filenames so existing `.html` links and GitHub Pages' extensionless links continue working. Images and historical PDF paths are retained. Only `public/` assets and generated pages are published; source files and documentation are excluded.

See [the analytics guide](docs/analytics.md) for events, GA4 reporting setup and measurement limits, and [the deployment guide](docs/deployment.md) for publishing and recovery.
