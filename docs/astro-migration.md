# Astro branch review and Pages cutover

`astro-migration` starts from the committed analytics work and preserves the business pages, styling, testimonials, tracking labels, Cookiebot configuration, external destinations, images and all PDF paths. Its production build uses Astro on Node.js 24, with no Ruby build step.

The unused Jekyll starter post and its feed are not included in the Astro output. Legacy HTML, Ruby files and Jekyll source folders are kept together in `_legacy/jekyll/` during review; they are neither built nor published. Make changes in `src/` and `public/`.

## Review without changing the live site

```bash
git switch astro-migration
nvm use
npm ci
npm run verify
npm run preview
```

Review at `http://localhost:4321`, including mobile navigation, service booking links, contact links, downloads and cookie controls. Production analytics testing must intercept collection requests before they reach GA4.

Pushes to `astro-migration` run checks and upload a Pages artifact. They do not deploy. PRs targeting `main` run the same checks without publishing.

## Switch the live website to the branch

This repository already uses **Settings → Pages → Source: GitHub Actions**. Keep that setting and the custom domain. There is one live Pages website; deploying this branch replaces the content at `https://woldscaninemassage.co.uk`.

1. In **Settings → Environments → github-pages → Deployment branches and tags**, add a branch rule for `astro-migration`. Keep the existing `main` rule. At migration preparation, only `main` was allowed.
2. Open the existing Pages workflow in **Actions**, select **Run workflow**, choose `astro-migration`, and run it. This manual run publishes to the live website. The default branch may display the old workflow name until promotion.
3. Check that build and deployment succeed. Verify the custom domain, `/services` and `/services.html`, phone/email links, PDFs, mobile menu and consent controls on the live site.

The CLI equivalent of step 2 is:

```bash
gh workflow run jekyll.yml --ref astro-migration
```

The workflow filename stays `jekyll.yml` because GitHub requires a manually dispatched workflow to exist on the default branch. The Astro branch's version builds Astro, despite the temporary filename. The output preserves `CNAME`, `.nojekyll` and `/404.html`.

During review, hold changes to `main`: its existing push workflow still deploys Jekyll and would replace a manual Astro deployment. Astro changes also need manual deployment while the branch is under review.

## Roll back during review

Run the existing workflow from `main`, which still contains the original Jekyll build:

```bash
gh workflow run jekyll.yml --ref main
```

This restores the Jekyll site without modifying either branch. Check the deployment result and custom domain afterwards.

## Promote after acceptance

After the reviewed Astro website is accepted:

1. Fetch both branches and inspect any changes made to `main` since migration started. Bring wanted content changes into Astro and repeat verification.
2. Remove `_legacy/jekyll/` from the migration branch. This contains the old HTML, layouts, styles, assets, testimonials, starter post, configuration and Ruby files. Active replacements are in `src/` and `public/`. Retain analytics tests and documentation.
3. Merge `astro-migration` into `main` and push `main`. A normal merge makes Astro the current website code and records Jekyll's removal while retaining history for recovery.
4. Verify the automatic deployment from `main`, then remove the temporary `astro-migration` environment rule. Rename the workflow to `pages.yml` on `main` and remove its temporary branch trigger and deployment allowance.
5. Once recovery is no longer needed, remove the migration branch and review the obsolete Ruby Dependabot PRs. Those closures and branch deletions are separate actions.

No reset or force-push of `main` is needed. Promotion, legacy cleanup and live deployment are deferred until acceptance.

## References

- [Astro deployment to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [Astro output format](https://docs.astro.build/en/reference/configuration-reference/#buildformat)
- [GitHub manual workflow execution](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-running-a-workflow)
- [GitHub deployment branch rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
