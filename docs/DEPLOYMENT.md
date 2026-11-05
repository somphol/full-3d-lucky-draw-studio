# Deployment

## Hosting model

GitHub Pages serves the repository root from `main`. There is no build step, no Pages workflow and
no artifact to upload: `index.html` is the entry point and all paths are relative.

```
https://somphol.github.io/full-3d-lucky-draw-studio/
```

`.nojekyll` is present so Jekyll does not process files or ignore paths beginning with an underscore.

## Publishing

First release:

```bash
cd ~/Projects/full-3d-lucky-draw-studio
git init -b main
git add -A
git commit -m "Lucky Draw Studio 1.0.0"
git remote add origin https://github.com/somphol/full-3d-lucky-draw-studio.git
git push -u origin main
```

Create the repository (one of):

```bash
gh repo create somphol/full-3d-lucky-draw-studio --public --source=. --push
```

or use the REST API with a token supplied once by the OS credential helper. Never write the token
into `.git/config`, a script or a document.

Enable Pages:

```bash
gh api -X POST repos/somphol/full-3d-lucky-draw-studio/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

Without `gh`, set **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**.

## Verifying the live copy

Pages builds take one to two minutes. Then:

```bash
curl -sI https://somphol.github.io/full-3d-lucky-draw-studio/ | head -3
TEST_URL=https://somphol.github.io/full-3d-lucky-draw-studio/ node tests/browser.test.mjs
```

The live suite should report 18/18 with zero console errors. The CDN must be reachable from the
runner.

## Caching

GitHub Pages serves through a CDN. HTML is typically revalidated, but hashed assets are not involved,
so a stale `style.css` or `script.js` can appear for a minute or two after a push. Hard-refresh or
append a query string when checking. There is no service worker and no cache-busting build, by
design.

## Local server

```bash
python3 -m http.server 8000
```

Any static file server works. Opening the file directly works in most browsers, but the import map
and module loading are more predictable over `http://`.

## CI

`.github/workflows/ci.yml` runs on push and pull request:

1. copy `script.js` to a temp `.mjs` and `node --check` it;
2. `node --test tests/engine.test.mjs tests/static.test.mjs`.

The workflow uses Node 22 and has read-only repository permissions. Browser checks are not in CI:
they require a Chrome binary and network access to the pinned CDN. Run them locally and against the
live URL before a release.

## Rolling back

Pages serves `main`. Revert the commit and push; the previous build returns within a minute. The app
has no server state, database or migration, so rollback is purely a static file change.

## Custom domain

Add a `CNAME` file at the root and configure DNS. Update the canonical/OG URLs in `index.html`,
`robots.txt`, `sitemap.xml` and the docs. The app itself does not depend on the hostname.

## Security headers

Pages does not allow custom headers. The app therefore avoids inline scripts (except the import map),
loads only the pinned Three.js module from jsdelivr, and keeps all user strings out of `innerHTML`.
If a stricter deployment is needed, put it behind a CDN that can set CSP, `X-Content-Type-Options`
and `Referrer-Policy`.

## Operational notes

- Do not commit tokens, `.env` files or downloaded browser profiles.
- The browser harness creates its profile under the OS temp directory and kills Chrome in `finally`.
- `state.json` is a session record, not a build artifact; update it deliberately with the release.
