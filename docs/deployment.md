# Deploy to GitHub Pages

The website at `https://woldscaninemassage.co.uk` builds with Astro on Node.js 24. The Pages workflow is `.github/workflows/pages.yml`.

## Publish a change

Run `npm run verify` locally, then merge the reviewed change into `main` and push it. A push to `main` installs the locked npm dependencies, runs verification and deploys the generated `dist/` files. Pull requests targeting `main` run the same checks.

In GitHub Actions, open **Deploy website to Pages** and confirm both the build and deployment jobs succeed. Check the live home page, `/services` and `/services.html`, contact links, PDFs and mobile navigation. Browser analytics tests must intercept collection requests before they reach GA4.

To redeploy the current `main` branch manually, select **Run workflow** and choose `main`, or run:

```bash
gh workflow run pages.yml --ref main
```

## Repository settings

Keep **Settings → Pages → Source** set to **GitHub Actions**, with the custom domain `woldscaninemassage.co.uk`. The `github-pages` environment allows deployments from `main` only.

The build preserves `CNAME`, `.nojekyll`, `/404.html`, the existing `.html` page URLs and historical PDF paths. Source files and documentation stay out of the published artifact.

Dependabot checks npm packages and GitHub Actions weekly. Runtime and build dependencies are declared in `package.json` and locked in `package-lock.json`.

## Recover a previous version

Revert the faulty change on `main`, run `npm run verify` and push the correction. The push triggers a new deployment. Confirm the workflow succeeds and check the affected live pages.

Git history retains the website's earlier versions for recovery.

## References

- [Astro deployment to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub manual workflow execution](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-running-a-workflow)
- [GitHub deployment branch rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
