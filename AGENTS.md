# AGENTS.md

## What it is

A static, single-page 3D lucky-draw studio. A Three.js prize wheel with a metallic stand, pegs and a
spring-loaded pointer spins to a winner that was chosen with the Web Crypto API **before** the
animation. The UI is bilingual (EN/TH), keeps the roster and draw history in `localStorage`, and
exports JSON/CSV. There is no backend, account system, build step, package manager or analytics. The
deployed artifact is the repository root served by GitHub Pages.

Read [README.md](README.md) for the product view, [docs/REPRODUCTION.md](docs/REPRODUCTION.md) for a
from-zero rebuild, and [state.json](state.json) for the build-session record.

## Commands

Run from the repository root.

| Task | Command |
| --- | --- |
| Serve locally | `python3 -m http.server 8000` → <http://localhost:8000/> |
| Engine + repository tests | `node --test tests/engine.test.mjs tests/static.test.mjs` |
| Headless browser suite | `node tests/browser.test.mjs` |
| Live suite | `TEST_URL=https://somphol.github.io/full-3d-lucky-draw-studio/ node tests/browser.test.mjs` |
| Built-in page self-test | <http://localhost:8000/?selftest> |
| Regenerate screenshots | `node scripts/screenshot.mjs` |
| Deploy | `git push origin main`; Pages serves `main` / root |

The browser suite launches one headless Chrome with `--use-mock-keychain`, a temporary profile and a
local static server on an ephemeral port. That flag is deliberate: it prevents repeated macOS
Keychain prompts. Set `CHROME` if Chrome is not at the macOS default path. The suite needs network
access for the pinned Three.js CDN.

## Architecture

Three source files, no build:

- `index.html` — shell, HUD, roster/history panel, settings drawer, winner dialog, self-test overlay,
  import map pinning Three.js `0.169.0`.
- `style.css` — tokens, dark studio shell, wheel stage, sidebar, responsive drawer, reduced-motion
  rules.
- `script.js` — six marked sections, in order: pure draw engine → bilingual copy → platform (storage,
  Web Audio, confetti, export) → Three.js studio → controller → self-test and `boot()`.

**Engine contract.** `createDrawEngine()` is self-contained between `/* ENGINE:START */` and
`/* ENGINE:END */`. Tests slice those markers and evaluate the factory in Node. It must never
reference Three.js, the DOM, module imports or outer constants. It owns roster normalisation, slice
layout, uniform picking, target rotation, index resolution, cubic easing and export serialisation.

**Coordinate contract.** A slice is drawn on the canvas at angle `mid` (canvas y down). The wheel is
rotated by `wheel.rotation.z = r`, and a canvas point at angle `θ` appears at world angle
`φ = r − θ`. The pointer hangs at world `+Y` (`π/2`). Therefore the landing rotation is
`r = π/2 + mid`, and `resolveIndex(r, n)` returns `floor(((r − π/2) mod 2π) / (2π/n))`. Do not
“simplify” these signs; the pointer will land on the neighbour.

**Construction order.** Imports → engine → i18n → platform helpers → renderer/scene/camera/controls →
environment/lights/floor → stand → wheel + face canvas + rim → pointer → `setRoster` → controller
(`load` → `wire` → studio → language/sound → render → `boot` flags) → optional self-test.
`boot()` exposes `window.__luckyDraw` for tests and debugging and sets `body.dataset.ready = 'true'`
after two frames.

**Wheel rendering.** The face is a 2048² canvas texture on a `CircleGeometry` (not the cylinder cap —
cap UVs are harder to reason about). The body is a 160-segment cylinder; per-slice coloured side
bands use `CylinderGeometry(..., true, π/2 − (i+1)·step, step)`. Labels are tangential for ≤8 entries
and radial above that; flips are computed from the resting wheel rotation so text reads upright when
the wheel stops. `refreshLabels()` is called once after a spin.

**Spin.** The controller picks the index, records the start time, then calls
`studio.startSpin({index, count, turns, duration, onTick, onDone})`. The render loop writes
`from + delta * smoothstep(t)` and resolves the exact end angle on completion. Peg crossings are
counted from the angle and drive both the Web Audio tick and the pointer spring.

**Persistence keys.** `ld3.prefs.v1`, `ld3.roster.v1`, `ld3.history.v1`. Preferences are `lang`,
`sound`, `autoRemove`, `duration` (3–10 s), `turns` (2–14). History is capped at 200 records.

## Decisions and constraints

- **Keep the engine pure and marker-delimited.** Tests and the self-test depend on the slice.
- **Pick first, animate second.** The landing index must never be derived from the animation. The
  fairness claim is the product.
- **Use rejection sampling for the pick.** Modulo of a 32-bit value is biased for non-power-of-two
  rosters; the engine rejects values above the ceiling.
- **Keep the coordinate contract above.** It is the single easiest thing to break and the hardest to
  notice without a test.
- **Do not restore rim accent boxes.** An earlier version used tangential boxes whose corners
  protruded outside the wheel for small rosters. The arc bands are correct.
- **Confetti lives inside the winner dialog stacking context** (`.modal`), between the scrim and the
  card. A page-level canvas is hidden by the scrim's blur and darkness.
- **Three.js is pinned to one exact version.** Do not use `latest`, a caret range, or `unpkg`.
- **No backend, no bundler, no framework, no tracking.** Three files plus tests and docs.
- **Default roster is four sample names** so the first visit has a wheel to spin. Clearing the roster
  saves `[]`; on the next visit the empty state is restored, not the samples.
- **32 entries is a deliberate cap.** Beyond that a 2048² face cannot keep names legible; the roster
  reports overflow rather than silently dropping names.
- **Audio is synthesized and unlocked on a gesture.** Do not create an `AudioContext` during boot;
  browsers log warnings and it wastes a context.
- **`prefers-reduced-motion`** shortens the spin to 1.1 s / one turn and suppresses confetti; the
  draw itself must remain fair and playable.
- **Keep documentation and `state.json` line counts current.** `tests/static.test.mjs` reads them.

## Known issues

- First load needs the CDN for Three.js. There is no service worker, so the app is not offline on a
  cold cache (the task asked for CDN loading; download the module locally if true offline is needed).
- The wheel face uses a canvas texture, so extremely long names are truncated with an ellipsis
  rather than scaled indefinitely.
- Thai labels depend on the system Thai font; no webfont is downloaded by design.
- The browser suite needs Chrome and network access. CI runs only engine + static checks.
- Winner confetti is decorative and skipped under reduced motion, including in the reduced-motion
  browser test.
- `state.json` records a single session; it is not updated automatically.

## Continuity

- Live: <https://somphol.github.io/full-3d-lucky-draw-studio/>
- Repository: <https://github.com/somphol/full-3d-lucky-draw-studio>
- Source of truth: this repository (local working copy `~/Projects/full-3d-lucky-draw-studio`).
- Skill: `lucky-draw-3d-studio` in `~/.config/opencode/skills/lucky-draw-3d-studio`, backed up in
  the catalog <https://somphol.github.io/opencode-skills/>.
- Build-session record: [state.json](state.json).
