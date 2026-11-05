# Decisions

Each entry states the decision, the reason, and what must not be changed casually.

## Vanilla HTML/CSS/JS, no framework, no build

**Decision.** Three source files, ES modules, no package.json.

**Why.** The artifact must be a static page that can be understood, audited and hosted anywhere. A
build step would add tooling but not correctness. The app is small enough that a framework would be
overhead.

**Do not** introduce a bundler, TypeScript pipeline, CSS framework or runtime dependency without a
compelling measured reason. If you do, the import map and the direct `script.js` module must keep
working.

## Three.js pinned to 0.169.0

**Decision.** Exact version in the import map; addon paths under `three/addons/`.

**Why.** Addon paths and light units move between releases. `latest` silently breaks the scene and
the tests pin the version string.

**Do not** use a caret range, `latest`, or a second CDN. Update the version and re-run all suites
when upgrading.

## The engine is pure and marker-delimited

**Decision.** One factory between `/* ENGINE:START */` and `/* ENGINE:END */`, no DOM or Three.js.

**Why.** The same code powers the app, the Node tests and the in-page self-test. Independent
implementations would drift.

**Do not** move the engine into a separate module without updating the fixture slicer and the
self-test. Do not reference outer constants; pass options in.

## Winner chosen before the spin

**Decision.** `pickIndex` runs first; the animation targets that slice.

**Why.** This is the fairness claim. Deriving the result from where the wheel happens to stop would
make the result dependent on timing and frame rate.

**Do not** add a “near miss” or “adjust landing” feature. It would invalidate the product.

## Rejection sampling for the pick

**Decision.** Reject 32-bit values above `floor(2³²/n)·n`.

**Why.** Modulo bias is tiny but real; the app advertises equal probability.

**Do not** replace it with `Math.random()` as the production path. The injected RNG is for tests
only.

## Cubic Hermite easing

**Decision.** `s(t) = t²(3−2t)`, forward-only delta, exact snap at the end.

**Why.** Zero velocity at both ends reads as a wind-up and a friction settle, and the final angle is
exact regardless of frame rate. A physics simulation would need sub-stepping and could overshoot.

**Do not** integrate velocity during the spin or allow reverse rotation. Keep the end angle pinned.

## 32-entry cap

**Decision.** Hard cap at 32 names; overflow is reported, never silently dropped.

**Why.** A 2048² face with 32 radial labels is still legible; beyond that, labels become unreadable
and the pointer/peg density becomes visual noise.

**Do not** raise the cap without increasing the texture and reworking label layout. Confirm the
change in the self-test and docs.

## Default four-name roster, explicit empty state

**Decision.** First visit loads four sample names; a saved empty array stays empty.

**Why.** A blank wheel is a poor first impression; resurrecting samples after a host clears the
roster is worse.

**Do not** fall back to samples when `ld3.roster.v1` exists and is `[]`.

## Canvas face on a circle, not the cylinder cap

**Decision.** A separate `CircleGeometry` carries the texture.

**Why.** Circle UVs are predictable; cap UVs plus `flipY` cost debugging time and make label
orientation fragile.

**Do not** move the texture back onto the cylinder without re-deriving the coordinate contract.

## Arc bands for the rim, not boxes

**Decision.** Per-slice open-ended cylinders.

**Why.** Boxes sized to the chord protrude outside the circle for 3–5 slices. The arc bands follow
the rim exactly and still show slice colour at oblique angles.

## Confetti inside the modal

**Decision.** The canvas is a child of `#winner-modal`, between the scrim and the card.

**Why.** A page-level canvas is dimmed by the scrim's 74% black and backdrop blur; the celebration
becomes invisible.

**Do not** move it back to `body` without changing the stacking strategy.

## Labels flip from the resting rotation

**Decision.** `drawFace(entries, lang, restRotation)`, and `refreshLabels()` after each spin.

**Why.** A static canvas cannot keep every label upright while the wheel turns. Orienting for the
rest position means the winning slice and its neighbours read correctly when the result is shown.

## Local-only data

**Decision.** `localStorage` only; no backend, no analytics, no remote fonts.

**Why.** Event hosts need a tool that works on a laptop with no account. The privacy page is short
because there is nothing to disclose.

**Do not** add telemetry or a “share result” upload without updating PRIVACY.md and the release
narrative.

## Audio synthesized, unlocked on gesture

**Decision.** No audio files; `AudioContext` created on first user action.

**Why.** Zero assets, no licensing, and browsers block autoplay anyway. Creating a context at boot
wastes a context and logs warnings.

## Keyboard and reduced motion are first-class

**Decision.** Space/L/S/Escape shortcuts, visible focus, reduced-motion branch that shortens rather
than removes the draw.

**Why.** A host may be presenting with a keyboard and a projector; some guests cannot tolerate rapid
motion. Neither may compromise the result.
