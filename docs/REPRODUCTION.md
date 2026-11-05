# Rebuilding the Lucky Draw Studio from scratch

This is the handoff for an AI agent (or a person) who has the finished repository but needs to
reproduce it, or to build a sibling app with the same quality bar. It records the order of work, the
contracts that matter, and the mistakes that cost time.

Read [ARCHITECTURE.md](ARCHITECTURE.md) and [PHYSICS.md](PHYSICS.md) alongside this file.

## 0. Definition of done

A release is not “the page loads”. It has all of these:

| Gate | Command | Expected |
| --- | --- | --- |
| Engine + repository | `node --test tests/engine.test.mjs tests/static.test.mjs` | 13 + 22 checks, zero failures |
| In-page | `/?selftest` | 18/18, mirrored to `body.dataset.selftest` |
| Headless browser | `node tests/browser.test.mjs` | 18/18, zero console errors |
| Live copy | `TEST_URL=https://… node tests/browser.test.mjs` | 18/18 |
| Screenshots | `node scripts/screenshot.mjs` | 6 fresh assets |
| Documents | README, AGENTS, 13 docs, community files, licence | links resolve |
| Metadata | `state.json`, sitemap, robots, CI, issue templates | shape valid |
| Handoff | `AGENTS.md` in the same push as the code | current |
| Skill | `lucky-draw-3d-studio` published to the catalog | discoverable |

If a number is lower, fix the cause; never edit the claim.

## 1. Prerequisites

- macOS or Linux, Node 22+, Python 3 for the static server, Chrome for the browser suite.
- Network access for `cdn.jsdelivr.net` (Three.js `0.169.0`).
- No package.json, no npm install. Tests use only Node built-ins and the Chrome DevTools Protocol.
- For publishing: `git`, a GitHub account, and either `gh auth login` or an existing HTTPS
  credential in the OS keychain. Use the credential once and let git reuse it; do not read the
  Keychain secret into the repository or shell history.

## 2. Scaffold

```bash
mkdir -p full-3d-lucky-draw-studio/{assets,docs,scripts,tests/lib,.github/workflows,.github/ISSUE_TEMPLATE}
cd full-3d-lucky-draw-studio
git init -b main
```

Files created by the end:

```
index.html  style.css  script.js
assets/     favicon.svg  studio.png  winner.png  thai.png  mobile.png  stage.png  og-card.png  og.html
docs/       README ARCHITECTURE REPRODUCTION DESIGN PHYSICS TESTING DEPLOYMENT DECISIONS
            ACCESSIBILITY PERFORMANCE PRIVACY FAQ ROADMAP
tests/      engine.test.mjs  static.test.mjs  browser.test.mjs  lib/{fixtures,harness}.mjs
scripts/    screenshot.mjs
.github/    workflows/ci.yml  ISSUE_TEMPLATE/*.yml  pull_request_template.md
README.md AGENTS.md CHANGELOG.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md SUPPORT.md
LICENSE THIRD_PARTY_NOTICES.md state.json .gitignore .editorconfig .nojekyll robots.txt sitemap.xml
```

## 3. Build the engine before the pixels

The highest-leverage phase. The engine is pure, testable in Node, and encodes the fairness claim.

```js
const createDrawEngine = () => {
  const TAU = Math.PI * 2;
  const POINTER_ANGLE = Math.PI / 2;
  const MIN_ENTRIES = 2;
  const MAX_ENTRIES = 32;
  // mod, cleanName, normalizeRoster, sliceLayout, rotationForIndex,
  // targetRotation, resolveIndex, pickIndex, smoothstep, csvCell, toCSV, toJSON
  return { /* ... */ };
};
```

Requirements:

1. `normalizeRoster(input)` accepts a string (split on newlines) or an array, trims and collapses
   whitespace, strips control characters, truncates names to 28 chars, dedupes case-insensitively,
   caps at 32 and reports `{entries, duplicates, overflow, truncated}`.
2. `sliceLayout(n)` returns `n` slices `{index, start, end, mid, step}` with `start = i·step`.
3. `rotationForIndex(i, n) = mod(POINTER_ANGLE + mid, TAU)`.
4. `targetRotation(i, n, turns, from)` returns `{rotation, delta, targetAngle, index}` where
   `delta` is positive and at least `turns·TAU`.
5. `resolveIndex(rotation, n) = floor(mod(rotation − π/2, TAU) / step)`, clamped to `n − 1`.
6. `pickIndex(n, randomInt?)` is uniform. Default uses `crypto.getRandomValues` with rejection
   sampling; the optional injected function exists for deterministic tests.
7. `smoothstep(t) = t²(3 − 2t)` (cubic Hermite, zero velocity at both ends).
8. `toCSV` and `toJSON` produce the schemas below.

Markers are mandatory:

```js
/* ENGINE:START */
const createDrawEngine = () => { ... };
/* ENGINE:END */
```

`tests/lib/fixtures.mjs` slices between the markers and evaluates the factory with `new Function`.
Never let the engine reference `THREE`, `document`, `window`, module imports or outer constants.

**Gate:** `node --test tests/engine.test.mjs` must pass 13 checks, including 1 000 target-rotation
round trips, 500 normalised rotations and 40 000 seeded picks.

## 4. Shell and controller contract

`index.html` is a static shell. Keep these IDs stable; the browser suite and the script use them:

`stage`, `stage-canvas`, `stage-count`, `draws-count`, `spin-btn`, `spin-label`, `spin-sub`,
`slot-1…4`, `bulk-roster`, `roster-chips`, `roster-count`, `tab-roster`, `tab-history`,
`panel-roster`, `panel-history`, `history-list`, `history-empty`, `clear-history`, `export-json`,
`export-csv`, `lang-en`, `lang-th`, `sound-toggle`, `sound-switch`, `settings-toggle`,
`settings-drawer`, `settings-close`, `settings-reset`, `duration-range`, `duration-value`,
`turns-range`, `turns-value`, `auto-remove`, `winner-modal`, `winner-name`, `winner-meta`,
`winner-remove`, `winner-keep`, `winner-close`, `confetti`, `toast`, `loading`, `selftest-panel`,
`selftest-summary`, `selftest-list`, `sidebar`, `sidebar-toggle`, `sidebar-close`, `drawer-scrim`.

Static copy uses `data-i18n="key"`; placeholders use `data-i18n-placeholder="key"`. The self-test
asserts every referenced key exists in both dictionaries.

Controller state:

```js
const state = {
  prefs: { lang: 'en', sound: true, autoRemove: false, duration: 5.5, turns: 6 },
  roster: [], history: [], spinning: false, pending: null, lastWinner: null, tab: 'roster',
};
```

Data flow for a roster edit: normalise → replace `state.roster` → `studio.setRoster` (texture and
rim) → sync inputs and chips → counters/spin state → persist. Quick-slot edits skip rewriting the
slots (caret); bulk edits skip rewriting the textarea. Bulk input is debounced 220 ms.

Data flow for a spin: guard → unlock audio → pick index → set `spinning` → `studio.startSpin` →
render loop → `completeDraw` → record history → refresh labels → optional auto-remove → show winner
→ fanfare + confetti.

## 5. The Three.js studio

Constants that make the composition work:

| Value | Setting |
| --- | --- |
| Wheel radius | `R = 3.05` |
| Wheel thickness | `THICK = 0.34` |
| Wheel centre | `(0, 3.35, 0)` |
| Camera home | `(0.9, 4.65, 14)`, target `(0, 3.35, 0)` |
| FOV | `36` landscape, `42` narrow, `50` portrait |
| Face canvas | `2048 × 2048`, wheel radius `0.918 × 1024` |
| Pointer pivot | `y = 3.35 + R + 0.72`, tip just above the rim |
| Peg radius | `R + 0.115` |
| Rim band radius | `R + 0.006` |

Order: renderer → PMREM `RoomEnvironment` → materials → floor/halo → lights → stand → wheel body →
face plane → torus/bevel rings → rim groups → hub → pointer. Then `setRoster`, then start the
animation loop.

Pitfalls that cost real time:

- **Do not texture the cylinder cap.** Put the canvas on a separate `CircleGeometry` at
  `z = THICK/2 + 0.004`. Cap UVs and canvas `flipY` are harder to reason about.
- **Coordinate signs.** At rotation `r`, canvas angle `θ` appears at world `r − θ`. The pointer is
  at `π/2`. Landing is `π/2 + mid`. The engine tests enforce this; do not hand-tune.
- **Rim accents.** Tangential boxes with height equal to the chord protrude outside the circle for
  3–5 slices. Use per-slice open-ended cylinder bands:
  `CylinderGeometry(R, R, THICK, 24, 1, true, π/2 − (i+1)·step, step)` rotated `x = π/2`.
- **Labels.** For `n ≤ 8`, draw tangentially (`rotate(mid + π/2); translate(0, −labelRadius)`) so
  the winning top slice reads horizontally. For `n > 8`, draw radially. Flip based on
  `restRotation − mid` (or `restRotation − mid − π/2` for tangential), then redraw once after the
  spin so labels are readable at rest.
- **Pointer spring.** `v += (−θ·110 − v·10.5)·dt; θ += v·dt`, clamped to ±0.42 rad, kicked on each
  peg crossing.
- **Shadows.** PCFSoft, a 2048² directional shadow map, `shadow.bias = −0.00025`. The floor receives
  and the wheel/stand cast.
- **Confetti stacking.** The canvas must sit inside `#winner-modal`, between the scrim (`z:0`) and
  the card (`z:2`). At page level it is dimmed by the scrim's 74% black + blur and looks broken.

## 6. Audio, confetti, persistence

- Create `AudioContext` lazily on the first spin or sound toggle. Never at boot.
- Tick: triangle at `1180 + min(1900, pegsPerSecond × 36)` Hz for 45 ms plus a quiet overtone.
  Throttle to one per 24 ms so a fast wheel does not create a node storm.
- Fanfare: C5 E5 G5 C6, 105 ms apart, triangle + octave sine, plus a low C3 bed and a high shimmer.
- Confetti: 170 pieces, DPR-capped canvas, gravity 0.28, velocity drag 0.994, 2.9 s lifetime,
  skipped under reduced motion.
- Storage keys: `ld3.prefs.v1`, `ld3.roster.v1`, `ld3.history.v1`. Read defensively; a corrupt value
  falls back to defaults.
- Export schemas:
  - JSON: `{schema:"lucky-draw.export.v1", exportedAt, project, language, roster, draws:[{draw, at, winner, rosterSize, durationMs, removed}]}`
  - CSV: `draw,timestamp,winner,entries,removed,spin_ms`, UTF-8 BOM added only at download time.

## 7. Bilingual copy

Two plain objects between `/* I18N:START */` and `/* I18N:END */`, identical key sets. Apply by
walking `[data-i18n]` and `[data-i18n-placeholder]`, toggling the language buttons, re-rendering
history/chips/toasts and setting `document.documentElement.lang`. Re-apply dynamic strings
(spin label, winner meta, tags) after switching. Keep Thai copy written in Thai, not transliterated
English; the current set is 88 keys per language.

## 8. Self-test

Expose `window.__luckyDraw.runSelfTest()` and open the overlay for `?selftest` or `#selftest`.
Current checks: slice coverage, pointer round trips, forward-only rotation, seeded uniformity,
roster normalisation, control-character stripping, CSV, JSON, dictionary parity, DOM key coverage,
pinned Three.js, duplicate IDs, scene geometry, texture repaint, storage round trip, history shape,
spin-button state. Set `document.body.dataset.selftest = "18/18"`. Do not mutate user history.

## 9. Verification harness

`tests/lib/harness.mjs` is a dependency-free static server + CDP client. `launchBrowser` must pass:

```
--headless=new --no-sandbox --disable-dev-shm-usage --enable-unsafe-swiftshader
--use-mock-keychain --password-store=basic --no-first-run --disable-sync
--user-data-dir=<temp> --remote-debugging-port=<free>
```

`--use-mock-keychain` prevents repeated macOS Keychain prompts. Run one browser per suite; create
new targets with `PUT /json/new`.

`tests/browser.test.mjs` should cover boot/WebGL, self-test, quick slots, bulk, duplicates, presets,
spin resolution, remove, keep, Thai, exports, settings, auto-remove, reload restore, clear-log
arming, mobile drawer, reduced motion and zero console errors. Assert the resolved index equals the
winner index after every spin; that is the behavioural proof of the fairness claim.

## 10. Screenshots

`scripts/screenshot.mjs` writes `assets/studio.png`, `stage.png`, `winner.png`, `thai.png`,
`mobile.png`, `og-card.png` from the running app. It uses the same mock-keychain browser. For the
winner shot: set `prefs.duration = 0.8`, spin, wait for the dialog, wait ~350 ms so confetti is
mid-flight. For mobile: 390×844 at DPR 2. `assets/og.html` is a 1200×630 social card that embeds
`studio.png`.

## 11. Documentation and release

- README: product view, screenshot, quick start, fairness summary, verification table, credits.
- AGENTS.md: what/commands/architecture/decisions/known issues/continuity, in the same push.
- `docs/`: architecture, reproduction (this file), design, physics, testing, deployment, decisions,
  accessibility, performance, privacy, FAQ, roadmap, index.
- Community files, MIT licence, third-party notices, changelog.
- `state.json`: session start/end, elapsed, token counters, model, line counts, verification counts,
  deployment, credits, skill. Read the live OpenCode session database for usage; do not guess.
- Screenshots and `og.html`; sitemap, robots, `.nojekyll`, CI, issue templates.

## 12. Publish

```bash
git add -A
git commit -m "Lucky Draw Studio 1.0.0"
git remote add origin https://github.com/<user>/full-3d-lucky-draw-studio.git
git push -u origin main
```

With `gh`: `gh repo create <user>/full-3d-lucky-draw-studio --public --source=. --push`, then enable
Pages (`gh api -X POST repos/<user>/<repo>/pages -f source[branch]=main -f source[path]=/`).
Without `gh`, use the REST API with a token from the credential helper **once**, and never commit
the token. Verify:

```bash
curl -s https://somphol.github.io/full-3d-lucky-draw-studio/ | head
TEST_URL=https://somphol.github.io/full-3d-lucky-draw-studio/ node tests/browser.test.mjs
```

Finally, update `state.json` with the deployed URL and the live test count, and commit that in the
same release.

## 13. Knowledge that is easy to lose

- The default roster is intentionally four sample names; a saved `[]` must stay empty.
- The spin button stays enabled while spinning in CSS but `spin()` guards and the button gets
  `pointer-events: none`; disabling it would remove the gold styling mid-spin.
- `removeWinnerFromRoster` must re-render the history list, not just the chips, or the record tag
  stays “Kept”.
- History numbers come from `record.draw`, not array position; clearing history resets the sequence.
- Auto-remove mutates the record before the dialog opens, hides “Keep”, and relabels the primary
  action to “Continue”.
- The browser test for reduced motion asserts the confetti canvas has zero width; initialise the
  canvas to `0×0` on load rather than relying on its 300×150 default.
- The Thai clear-log confirmation string is `กดอีกครั้ง`; update the test if the copy changes.
- Keep `body.dataset.ready` and `dataset.selftest` — they are the harness's only handshake.
