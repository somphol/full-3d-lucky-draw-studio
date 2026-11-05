# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [1.0.0] — 2026-11-05

First public release. Built in one OpenCode session with DeepSeek V4.1 Flash.

### Added

- Full 3D prize wheel: bevel-edged body, gold rim, chrome pegs, weighted stand, spring-loaded
  pointer, orbit/pan/zoom camera, soft shadows and a studio environment map.
- 2048² canvas face with dynamic slice angles and colours for 2–32 entries, tangential labels for
  small wheels and radial labels for large ones.
- Cryptographically fair draw: uniform index chosen with rejection sampling before the spin, exact
  landing rotation, cubic Hermite easing and post-spin resolution.
- Quick-entry slots for four names, a bulk textarea (one per line), duplicate merging, overflow
  reporting and four presets.
- Winner dialog with remove/keep actions, automatic removal mode, confetti, fanfare and the real
  winner name.
- Timestamped history (newest first), two-step clear, and JSON/CSV export with stable schemas.
- Bilingual English/Thai interface across static and dynamic copy, with `document.lang` switching.
- Synthesized peg ticks with speed-scaled pitch, concert-style fanfare, and a mute control that
  persists.
- Local persistence for roster, history and all preferences; defensive loading.
- Keyboard shortcuts (`Space`, `L`, `S`, `Escape`), visible focus, ARIA dialog/tab/live semantics and
  a reduced-motion path that shortens the spin and suppresses confetti.
- Responsive layout with a mobile roster drawer and DPR-capped rendering.
- Three test layers: 13 engine checks, 22 static/repository checks, 18 headless browser checks.
- 18-check in-page self-test at `?selftest`.
- Release documentation: README, AGENTS, 13 docs, community files, CI, issue templates, sitemap,
  robots and third-party notices.
- Build-session record in `state.json` with elapsed time, token usage, line counts and credits.

### Fixed during the build

- Rim accents were tangential boxes that protruded outside the wheel for small rosters; replaced with
  per-slice arc bands.
- The confetti canvas was hidden behind the winner scrim; moved inside the modal stacking context.
- Removing a winner did not re-render the history tag; it now updates immediately.
- The spin button disabled mid-spin and lost its gold styling; it is now guarded in code and uses
  `pointer-events: none` while spinning.
- Reduced-motion confetti left the canvas at its default 300×150; it now initialises at 0×0.
- Card labels could read upside down at rest; flips now use the resting rotation and repaint after a
  spin.

### Known limitations

- Three.js is loaded from a pinned CDN; there is no service worker for a cold offline start.
- Names are capped at 28 characters and the roster at 32 entries.
- CI runs engine and static checks only; browser checks are local/live.
