# Testing

Four layers, one shared truth: the engine and its marker-delimited factory.

## 1. Engine suite — `tests/engine.test.mjs`

Node's built-in test runner. No DOM, no browser, no dependencies.

```bash
node --test tests/engine.test.mjs
```

13 checks:

1. Contract: version, limits, pointer angle, exported functions.
2. Slice layout partitions the circle for 2–32 entries.
3. `rotationForIndex` resolves back to the same index for every slice.
4. `targetRotation` is forward-only, at least the requested turns, and lands on the pick (1 000 cases).
5. Normalising the final rotation preserves the landing index.
6. 40 000 seeded picks are balanced within 300 of the 5 000 expected per bucket.
7. Injected picks handle out-of-range, negative and `NaN` values.
8. Roster normalisation trims, merges case-insensitively, caps and reports overflow.
9. Arrays, control characters and the 28-character cap.
10. `smoothstep` pins both ends and is monotonic.
11. CSV escaping for commas, quotes and newlines, including a multi-line field.
12. JSON schema and field normalisation.
13. A full simulated draw for every `n` in 2–32 resolves to the pre-picked entry.

## 2. Static repository suite — `tests/static.test.mjs`

Reads the repository as text and checks the release is coherent:

- Source files exist and are non-trivial; HTML is a complete document with a pinned import map.
- No duplicate IDs; every `$('id')` in the script exists in the HTML.
- EN/TH dictionaries have identical keys, at least 80 each; every `data-i18n` and
  `data-i18n-placeholder` key is defined.
- Engine and i18n markers exist; the engine block has no `THREE`, `document` or `window` reference.
- No external stylesheet, font or asset; Three.js is the only remote code and is pinned.
- Documentation set, community files, licence, changelog, third-party notices.
- Every relative Markdown link in README/AGENTS/docs resolves on disk.
- `state.json` shape, credit fields, skill metadata and line counts matching the real files.
- CI workflow, issue templates, `.nojekyll`, robots, sitemap, `.gitignore`, `.editorconfig`.
- Screenshot assets and `assets/og.html`.
- No obvious secrets (GitHub tokens, private keys, AWS keys, hard-coded passwords).

```bash
node --test tests/static.test.mjs
```

## 3. In-page self-test — `/?selftest`

18 checks that run against the live app, including the real canvas texture and the actual scene:

1. Slice coverage 2–32.
2. Every slice resolves after a target rotation.
3. `rotationForIndex` round trip.
4. Forward-only turns constraint.
5. Seeded uniformity over 24 000 draws.
6. Roster normalisation.
7. Control-character stripping.
8. CSV escaping.
9. JSON schema.
10. Dictionary parity.
11. Every DOM translation key is defined.
12. Three.js is pinned.
13. No duplicate IDs.
14. Wheel has a face, hub and rim; `userData.count` matches the roster.
15. A roster change repaints the texture (`faceVersion` increments).
16. `localStorage` round trip on a throwaway key.
17. History record shape.
18. Spin button reflects the roster minimum.

The result is written to `document.body.dataset.selftest` (`"18/18"`) and shown in the overlay.

## 4. Browser suite — `tests/browser.test.mjs`

A dependency-free CDP harness launches one headless Chrome with a temporary profile and
`--use-mock-keychain`, then drives the real page.

```bash
node tests/browser.test.mjs
TEST_URL=https://somphol.github.io/full-3d-lucky-draw-studio/ node tests/browser.test.mjs
```

18 checks:

1. Boots WebGL, canvas, scene children, four default names, non-zero face version.
2. Built-in self-test is 18/18.
3. Quick slots rebuild the texture and stage count.
4. Bulk textarea accepts six names and fills the first four slots.
5. Duplicates merge and a toast appears.
6. The twelve-name preset loads.
7. A spin lands on the picked slice, opens the dialog, sizes the confetti canvas, writes draw #1.
8. Remove winner decrements the roster, tags the record “Removed”, rebuilds the wheel.
9. Keep in roster preserves the name and tags the record “Kept”.
10. Thai switch changes `document.lang`, the spin label, the settings title and persisted prefs.
11. JSON and CSV exports carry both draws and the Thai language marker.
12. Settings persist duration 7 s and sound off; the drawer opens.
13. Auto-remove decrements the roster, hides “Keep”, relabels the primary action, tags the record.
14. Reload restores roster, history, Thai and the history list.
15. Clear log arms on the first click and empties on the second, including storage.
16. Mobile 390×844: stage ≥380 px, floating roster button, drawer opens over the scrim.
17. Reduced motion: media query true, spin under 3.5 s, confetti canvas stays 0×0.
18. No console errors or uncaught exceptions during the whole suite.

### Why `--use-mock-keychain`

On macOS, a normal Chrome launch can trigger repeated Keychain prompts for the Safe Storage key. The
harness always launches with `--use-mock-keychain --password-store=basic` and a fresh profile. Do not
remove these flags; they are an operational requirement, not a convenience.

## Adding a check

- Rule changed → add an engine test first.
- New DOM contract → add a static assertion (ID, key, marker).
- New interaction → add a browser check; assert observable state via `window.__luckyDraw`, not
  screenshots.
- New self-test check → keep it side-effect free on user history and preferences.
- Update the counts in README, AGENTS, TESTING and `state.json` only after the suites pass.

## Continuous integration

`.github/workflows/ci.yml` runs a syntax check plus the engine and static suites on Node 22. Browser
checks are intentionally local/live because they need Chrome and network access to the CDN. Run the
live suite manually before tagging a release.
