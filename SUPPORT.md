# Support

## Before asking

1. Read [README.md](README.md) and [docs/FAQ.md](docs/FAQ.md).
2. Confirm the page reports `body.dataset.webgl === "true"` in DevTools. If WebGL is unavailable, the
   3D wheel cannot render; try a current browser with hardware acceleration.
3. Run the built-in self-test at `/?selftest`.
4. If you are modifying the project, run:

   ```bash
   node --test tests/engine.test.mjs tests/static.test.mjs
   node tests/browser.test.mjs
   ```

## Where to ask

- **Bug**: open an issue with the bug template. Include browser, OS, steps, expected/actual, and the
  self-test result.
- **Feature idea**: open an issue with the feature template. Explain the event scenario, not just the
  UI.
- **Question**: use the question template or GitHub Discussions if enabled.
- **Security**: follow [SECURITY.md](SECURITY.md); do not open a public issue.

## What to include

- The URL or commit you are running (local or live).
- Browser and version, OS, and whether WebGL is available.
- Self-test summary (`body.dataset.selftest`) and any console errors.
- Whether the issue reproduces with a fresh roster and a fresh browser profile.
- Screenshots only if they do not contain personal names you do not want public.

## What is not supported

- Custom deployments behind authentication, server-side randomness, weighted draws, or shared
  multiplayer sessions.
- Data recovery: the app stores data only in the browser. Clearing site data is irreversible.
- Guarantees about a draw's legal status in a jurisdiction. The fairness mechanism is documented;
  event rules are the host's responsibility.

## Maintainer

Somphol Boonjing — <https://github.com/somphol>.
