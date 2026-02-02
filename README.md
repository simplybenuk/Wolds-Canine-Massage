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
