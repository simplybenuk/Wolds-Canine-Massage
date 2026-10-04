# Wolds Canine Massage (Jekyll site)

## Run locally
This site is built with Jekyll via the `github-pages` gem.

1. Install gems
```bash
bundle config set force_ruby_platform true
bundle install
```

2. Serve the site
```bash
bundle exec jekyll serve
```

3. Open the site
Visit `http://localhost:4000`.

## Notes
- The `force_ruby_platform` setting avoids downloading the precompiled `ffi` gem, which can fail on some networks.
- Development previews omit Google Tag Manager and disable custom events. Custom events also require the site's configured hostname. Intercept collection requests when testing production builds locally.
- See [the analytics guide](docs/analytics.md) for tracked events, GA4 reporting setup, verification and measurement limits.
- Run the consent and event regression checks with `node --test tests/analytics.test.cjs`.
