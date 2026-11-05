# Accessibility

## Keyboard map

| Key | Action |
| --- | --- |
| `Space` | Spin, or close the winner dialog if it is open |
| `L` | Switch EN ⇄ TH |
| `S` | Toggle sound |
| `Escape` | Close the self-test, then winner dialog, then drawer/sidebar |
| `Tab` / `Shift+Tab` | Move through controls (native order) |

Shortcuts are ignored while typing in an input or textarea, and when a button has focus (so `Space`
activates that button rather than starting a second action).

## Focus and dialogs

- The winner dialog has `role="dialog"`, `aria-modal="true"`, an accessible name (the winner) and a
  description (draw number, time, roster size). Focus moves to the primary action on open and
  returns to the spin button on close.
- The settings drawer and the mobile sidebar close on `Escape` and on scrim click.
- The self-test overlay is a modal dialog with an explicit close button.
- All interactive controls are native `<button>`, `<input>`, `<textarea>` or `<label>` elements.
  The language switch exposes `aria-pressed`.
- Focus-visible uses a 2 px teal outline with a 2 px offset; it is never removed.

## Semantics and live regions

- The page declares `lang` and switches it to `th` on language change, so screen readers use the
  right pronunciation.
- The toast is `role="status"` with `aria-live="polite"`.
- The roster chips and history list use `aria-live="polite"` where updates are expected.
- Panels use `role="tabpanel"` with `aria-labelledby`; tabs set `aria-selected`.
- The spin button reports `aria-busy` while spinning and is described by the hint line.
- Decorative SVGs and the confetti canvas are `aria-hidden`; the WebGL canvas has an accessible label.

## Motion

`prefers-reduced-motion: reduce`:

- disables the pulsing live dot, halo, spinner and ring rotation;
- shortens the spin to 1.1 s and one turn;
- suppresses confetti entirely;
- collapses all transitions to near-zero duration.

The draw still completes and the winner dialog still appears. Reduced motion is not a degraded or
incomplete flow.

## Contrast and size

- Body copy is `#eef3fb` on `#06090f` (very high contrast); secondary copy `#8e9bb0` is used for
  metadata, not for essential instructions.
- The gold primary button uses near-black text (`#241703`) on a gold gradient.
- Base font size is 15 px; inputs are 13.5–14 px with 44 px slot height. Touch targets are at least
  33–46 px, and the spin button is 118–172 px.
- Focus does not rely on colour alone; it uses an outline.

## Known limitations

- The 3D wheel is not operable by keyboard beyond the spin action. There is no keyboard orbit or
  slice inspection; the roster panel is the accessible representation of the wheel.
- Canvas labels are rasterised; screen readers cannot read the wheel face. The winner is announced
  in the dialog and recorded in the history list, which are both text.
- The pointer vibration and peg ticks are decorative. Sound can be muted; reduced motion stops the
  pointer's visual chatter through the shortened spin but does not remove the spring entirely.
- Thai line breaking is delegated to the browser; very long Thai names are truncated at 28
  characters before rendering.
- The app has no high-contrast theme. The dark theme is the only theme; system forced-colors mode is
  not specifically tested.
