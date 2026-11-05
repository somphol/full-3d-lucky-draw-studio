# Roadmap

## Intentional boundaries

These are not bugs and are not planned for 1.x:

- No accounts, cloud sync or shared draw rooms.
- No backend, database or server-side randomness.
- No weighted entries, prize tiers or multiple prizes per draw.
- No image uploads for slices, logos or backgrounds.
- No video/streaming integration (the studio is a layer source, not an encoder).
- No third-party analytics or advertising.
- No bundler or npm dependency.

## Near-term candidates

1. **Prize amounts per slice.** A secondary field per entry, shown in the dialog and export. Would
   need an editor and a schema migration for `ld3.history.v1`.
2. **Sound themes.** A second synthesized palette (soft/arcade) without adding audio files.
3. **Roster import.** Paste CSV or a `.txt` file; the current textarea already covers most cases.
4. **Presentation mode.** Hide the sidebar and enlarge the wheel for a projector, with a keyboard
   shortcut to restore.
5. **Session summary.** A “results” view grouping winners by draw and offering a printable sheet.
6. **Localisation expansion.** Add a third dictionary; the parity test and self-test make this safe.

## Larger, only with a clear need

- A service worker for a genuinely offline cold start. This would require vendoring Three.js and
  updating the third-party notices and tests.
- Weighted draws. This breaks the “equal chance” claim and would need a separate mode, copy and
  verification story; it should not be a quiet setting.
- Shared/remote draws. This would introduce a backend and change the privacy page; not a small add.

## Quality backlog

- Increase the self-test to cover auto-remove and language persistence (currently browser-only).
- Add a `prefers-contrast: more` theme.
- Add a screen-reader-friendly table view of the current roster alongside the canvas.
- Record the exact frame-time distribution of the spin on low-end hardware.
- Add a visual regression baseline for the wheel face at 4, 12 and 32 entries.

## Versioning

`MAJOR.MINOR.PATCH` in `state.json` and `CHANGELOG.md`. The export schema is versioned separately as
`lucky-draw.export.v1`; adding fields is backward compatible, changing existing field meanings is
not.
