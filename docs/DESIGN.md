# Design

## Intent

The studio should feel like a physical draw on a small stage: dark room, warm key light, a heavy gold
wheel, and one obvious action. It is a tool for a host, not a casino lobby — restrained, legible,
and bilingual.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#06090f` | Page base |
| `--panel` | `rgba(13,21,35,.86)` | Sidebar glass |
| `--text` | `#eef3fb` | Primary copy |
| `--muted` | `#8e9bb0` | Secondary copy |
| `--gold` | `#f5c76b` | Action, winner, rim |
| `--teal` | `#3fd6c4` | Fairness chip, focus ring |
| `--danger` | `#ff7b88` | Removal, destructive arming |
| Radius | 26 / 18 / 13 / 9 px | Stage, sidebar, cards, inputs |
| Font | Inter / system / Noto Sans Thai | UI; canvas labels use the same stack |

The background is two radial washes (teal upper-left, gold upper-right) over a near-black vertical
gradient, with a faint 4 px dot grid. The stage adds its own radial glow and an inset vignette.

## Layout

Desktop: a 70 px top bar, then a two-column grid `1fr / 392px` with a 16 px gap. The stage is the
hero; the sidebar carries roster and history in tabs. At 1180 px the sidebar narrows to 350 px and
the stage CTA shrinks. At 980 px the layout stacks and the sidebar becomes a right-hand drawer with a
scrim and a floating “Roster” button. At 560 px the stage is 58 dvh, slots become one column, and the
spin button is 118 px.

The stage bottom is a vertical stack: hint pill, 172 px circular spin button, legal/fairness line.
The button is the only gold-filled control in the stage, so the eye lands there. On short desktop
viewports the hint and foot are hidden to protect the wheel.

## Wheel composition

- Radius 3.05 units, thickness 0.34, centre at y = 3.35.
- Gold front torus and bevel, chrome back torus, dark body.
- One coloured side band per slice; 24 radial segments per band.
- A gold ball and chrome pin at every slice boundary.
- A gold hub with a dark inset and a centre stud, covering the texture's centre.
- A red four-sided cone needle under a chrome bracket, pivoted at the top.

Camera home `(0.9, 4.65, 14)` with target `(0, 3.35, 0)`. FOV rises from 36 (wide) to 42 (narrow) to
50 (portrait) so the wheel never clips. Orbit limits keep the camera above the floor and below the
top of the frame.

The stand is deliberately simple: a heavy disc base, gold ring, dark column, chrome face plate and a
chrome axle box. It reads as a studio prop and does not compete with the face.

## Face typography

- 2048² canvas, wheel radius 0.918 × 1024, drawn with a 12 px gold outer stroke.
- Eight-colour palette, alternating a 14% darker mix.
- Per-slice linear highlight (9% white at the hub) and a 20% dark edge for depth.
- ≤8 entries: tangential labels at 0.63 R, font up to 54 px, so the winning top slice reads
  horizontally.
- >8 entries: radial labels at 0.60 R, font up to 62 px, flipped on the left half for readability.
- Font shrinks to fit the chord and the text truncates with an ellipsis; names are capped at 28
  characters before they reach the canvas.

## Motion

- Spin: cubic Hermite over 5.5 s by default, 2–14 full turns.
- Pointer: damped spring, kicked at each peg.
- Winner card: 0.55 s overshoot entrance; scrim fades and blurs.
- Confetti: 170 pieces, gravity, drag and spin, 2.9 s.
- Language switch and tab changes use a 0.28 s fade-up.
- All non-essential animation is removed under `prefers-reduced-motion`.

## Bilingual typography

Thai copy is set in the same size and weight as English. Line heights are 1.5–1.6, enough for Thai
tone marks. The UI never uppercases Thai: `text-transform: uppercase` is applied to English-only
labels such as the kicker and section headings; Thai strings remain as written. No webfont is loaded,
so the system Thai font is used — acceptable on macOS, Windows, iOS and Android.

## What to avoid

- No gradients on body copy, no neon glow on every surface; gold is scarce.
- No emoji in the primary UI. The product name is not “🎡 Lucky Draw”.
- No third accent colour. Teal means fairness/system, gold means action/winner, red means removal.
- Do not put the spin CTA in the sidebar; the stage owns the action.
- Do not let the sidebar and the stage both scroll on desktop; the page itself never scrolls there.
