# Architecture

## Shape of the app

```
index.html ── static shell, import map, all dialogs
style.css  ── tokens + layout + responsive + reduced motion
script.js  ── one ES module, six marked sections
   1 ENGINE     pure draw math (no DOM, no Three.js)
   2 I18N       EN/TH dictionaries (plain objects, marker-delimited)
   3 PLATFORM   storage, Web Audio, confetti, download, colour helpers
   4 STUDIO     Three.js scene, wheel, rim, pointer, spin loop
   5 CONTROLLER roster, draw, history, settings, language, wiring
   6 BOOT       load → wire → build → expose window.__luckyDraw → self-test
```

There is no package.json and no build. The browser loads `script.js` as a module after the import
map resolves `three` and `three/addons/` to jsdelivr.

## Engine

`createDrawEngine()` is a factory delimited by `/* ENGINE:START */` and `/* ENGINE:END */`. It returns
plain functions and constants. The tests and the in-page self-test use the same factory, so there is
one implementation of the rules.

| Function | Contract |
| --- | --- |
| `normalizeRoster(input)` | String (lines) or array → `{entries, duplicates, overflow, truncated}`. Trims, collapses whitespace, strips control characters, truncates to 28 chars, dedupes case-insensitively, caps at 32. |
| `sliceLayout(n)` | `n` slices with `start`, `end`, `mid`, `step`. Slices are half-open and cover `[0, 2π)`. |
| `rotationForIndex(i, n)` | Wheel rotation that puts slice `i` under the top pointer. |
| `targetRotation(i, n, turns, from)` | Forward-only landing plan: `rotation`, `delta`, `targetAngle`, `index`. |
| `resolveIndex(rotation, n)` | The slice under the pointer for any rotation. |
| `pickIndex(n, randomInt?)` | Uniform index. Crypto + rejection sampling by default; injectable for tests. |
| `smoothstep(t)` | Cubic Hermite easing, clamped to `[0, 1]`. |
| `toCSV(records)` / `toJSON(records, meta)` | Export serialisation with stable schemas. |

The engine must remain independent of the DOM and Three.js. Moving it to another file would break
the marker slicing, so keep it in `script.js`.

## Controller state

```js
state = {
  prefs: { lang, sound, autoRemove, duration, turns },
  roster: [],        // clean names, 0–32
  history: [],       // newest first, 0–200 records
  spinning: false,
  pending: null,     // { index, winner, startedAt } while the wheel moves
  lastWinner: null,  // the record shown in the dialog
  tab: 'roster',
}
```

The controller owns all persistence and DOM updates. The studio never reads `state`; it is told what
to render (`setRoster`) and given a spin plan (`startSpin`).

## Scene graph

```
scene
├── floor (circle, receives shadow)
├── halo (ring under the stand)
├── hemisphere + directional key + three point lights
├── stand
│   ├── base, baseTop, baseRing
│   ├── column, columnFace, axle, cheeks
│   └── baseLight
├── wheel  (position 0, 3.35, 0; rotation.z = wheel angle)
│   ├── body (cylinder, 160 segments)
│   ├── face (circle + canvas texture)
│   ├── backPlate
│   ├── frontTorus, backTorus, bevelFront, bevelBack
│   ├── rimGroup  (one open cylinder band per slice)
│   ├── pegGroup  (gold ball + chrome pin per boundary)
│   └── hub       (disc, inner, ring, dot)
└── pointerPivot  (above the rim, spring rotation.z)
    ├── mount, arm
    └── needle, tip
```

`studio.wheel.children.length` is at least 8 (body, face, back plate, four rings, rim group, peg
group, hub) and `studio.wheel.userData.count` mirrors the roster length. Both are asserted.

## Coordinate contract

This is the most breakable part of the app.

- The face canvas uses x right / y down. Slice `i` spans `[i·step, (i+1)·step)`.
- Three.js uses x right / y up. At wheel rotation `r`, a canvas angle `θ` appears at world angle
  `r − θ`.
- The pointer is at world `+Y`, angle `π/2`.
- Landing: `r = π/2 + slice.mid`.
- Resolve: `θ = mod(r − π/2, 2π)`, `index = floor(θ / step)`.

The wheel's initial rotation is `rotationForIndex(0, n)` so the pointer rests on slice 0. It is not
reset on every roster edit; the wheel keeps its angle and the next spin computes a forward delta.

## Rendering and materials

- Renderer: WebGL2, antialias, DPR capped at 2, PCFSoft shadows, ACES tone mapping, exposure 1.02,
  sRGB output.
- Environment: `RoomEnvironment` through `PMREMGenerator`; no external HDR.
- Face: 2048² `CanvasTexture`, anisotropy capped at 8, sRGB, `needsUpdate` after every repaint.
- Palette: eight saturated hex colours, alternating a 14% darker mix so neighbours separate even when
  the palette wraps. Slice labels are white with a dark offset shadow.
- Labels: tangential for ≤8 entries, radial above; font auto-shrinks to fit the chord and truncates
  with an ellipsis at 28 characters.

## Spin pipeline

1. `spin()` guards on `spinning` and roster length, unlocks audio, seeds `pending`.
2. `engine.pickIndex(n)` chooses the winner.
3. `studio.startSpin` converts the index to a forward rotation plan.
4. The render loop runs `smoothstep(t)`, counts peg crossings, calls `audio.tick(perSecond)` and kicks
   the pointer.
5. At `t = 1` the rotation is snapped to `mod(end, 2π)` and `completeDraw` runs.
6. `completeDraw` writes history, persists it, repaints labels with the new resting angle, optionally
   auto-removes the winner, opens the dialog, plays the fanfare and bursts confetti.

The dialog is the only place the winner is announced. The wheel and the record always agree because
the engine resolves the final rotation and the tests assert it equals the picked index.

## Persistence

| Key | Value |
| --- | --- |
| `ld3.prefs.v1` | `{lang, sound, autoRemove, duration, turns}` |
| `ld3.roster.v1` | `string[]` (may be empty) |
| `ld3.history.v1` | `[{id, draw, at, winner, rosterSize, durationMs, removed}]` |

On load, history is filtered for shape and capped. A corrupt JSON value falls back to defaults. The
default four-name roster applies only when the roster key is absent; an explicitly saved `[]` stays
empty.

## Test hooks

- `window.__luckyDraw` exposes `engine`, `state`, `studio`, roster/language/sound setters, `spin`,
  `exportRecords`, `removeWinnerFromRoster`, `clearHistory`, `runSelfTest`.
- `document.body.dataset.ready` is `"true"` after two frames.
- `document.body.dataset.webgl` is `"true"` or `"false"`.
- `document.body.dataset.selftest` is `"passed/total"` after a self-test run.

These are part of the contract with `tests/browser.test.mjs`; keep them.
