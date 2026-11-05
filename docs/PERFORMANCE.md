# Performance

## Budgets

| Metric | Target | Notes |
| --- | --- | --- |
| First interactive | < 2.5 s on a warm CDN | Three.js module + one static page |
| Steady frame | 60 fps at 1600×1000 on integrated graphics | headless SwiftShader is slower |
| Draw calls | ~30–90 | 8 fixed meshes + 2 per entry for pegs + 1 per entry for rim bands |
| Texture memory | ~16 MB for the 2048² face | one RGBA canvas texture, mipmapped |
| Shadow map | 2048² | one directional light casts |
| Storage writes | per edit, debounced 220 ms for bulk input | small JSON payloads |

## What costs what

- **Face texture** is the largest single allocation. 2048 × 2048 × 4 bytes = 16 MB before mips. It is
  created once and repainted in place; the texture object is reused, only `needsUpdate` is set.
- **Rim bands** are one open cylinder per entry (24 segments), disposed and rebuilt on every roster
  change. At 32 entries that is 32 small geometries, which is fine; leaking them would not be.
- **Pegs** are two meshes per entry (ball + pin), with cloned shared materials. They are disposed on
  rebuild.
- **Shadows** come from one directional light at 2048², PCFSoft. The floor receives, the wheel and
  stand cast. `shadow.radius = 4` softens the contact.
- **Environment** is generated once with `PMREMGenerator` from `RoomEnvironment`; there is no HDR
  fetch.
- **Confetti** is 2D canvas, 170 particles, DPR capped at 2. It stops itself after 2.9 s and clears
  the canvas.
- **Audio** creates short oscillator nodes per tick; ticks are throttled to one per 24 ms. The spin
  whoosh uses one noise buffer; the fanfare schedules a handful of nodes.

## Device pixel ratio

`renderer.setPixelRatio(Math.min(2, devicePixelRatio))`. A 3× phone renders at 2×, avoiding a 9×
fragment cost. The confetti canvas uses the same cap.

## Mobile

- CSS `dvh` keeps the stage usable when browser chrome collapses.
- The stage is 58–62 dvh; the sidebar becomes a drawer so the wheel is not pushed below the fold.
- The spin button shrinks to 118 px, and the stage foot is hidden.
- Orbit controls use pointer events; `touch-action: none` on the canvas prevents page scroll while
  orbiting.

## Repaint policy

- Roster edits repaint the face and rebuild the rim/pegs. Bulk input is debounced, so a paste is one
  repaint.
- Language changes repaint the face only to update the empty-state placeholder; names do not change.
- After a spin, `refreshLabels()` repaints once so label flips match the resting angle.
- Nothing repaints per frame except the render call, the pointer spring and the halo opacity.

## Profiling

Use Chrome DevTools:

```js
window.__luckyDraw.studio.renderer.info
// { render: { calls, triangles, points, lines }, memory: { geometries, textures } }
```

Raise `turns` and duration in the settings drawer to stress the spin. The browser suite's boot check
asserts at least eight wheel children; extend it if you add a major mesh.

## Known costs

- The browser suite runs WebGL in SwiftShader (`--enable-unsafe-swiftshader`), so its frame rate is
  not representative. Visual verification is correct; timing is not.
- `state.json` line counts are checked by `tests/static.test.mjs`; adding many lines to source files
  requires updating the record. This is documentation cost, not runtime cost.
- The app loads Three.js from a CDN on first visit. There is no service worker; a cold offline load
  fails by design.
