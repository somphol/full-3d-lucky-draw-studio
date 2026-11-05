# Fairness and spin physics

## The claim

Every entry in the active roster has probability `1/n` of winning, independent of slice colour,
roster order, spin duration, frame rate, or when the button is clicked. The animation is a
presentation of a result that already exists.

## Choosing the winner

`engine.pickIndex(n)`:

1. Compute `ceiling = floor(2³² / n) · n`.
2. Draw a 32-bit unsigned integer from `crypto.getRandomValues`.
3. Reject and redraw if it is `>= ceiling`.
4. Return `value % n`.

Rejection removes the modulo bias that appears whenever `n` does not divide `2³²`. For `n = 3` a
naive `% 3` favours the first index by one part in `2³²`; small, but this is a fairness product, so
it is removed rather than documented away.

An injectable `randomInt(n)` exists solely for deterministic tests and stage demos. The production
path always uses Web Crypto.

## Slice geometry

For `n` entries:

```
step = 2π / n
slice i = [i·step, (i+1)·step)
mid i   = (i + 0.5)·step
```

All slices have identical central angle, therefore identical area on the face and identical
probability under a uniform pointer. There are no weights, no “rare” slices.

## Landing rotation

The pointer is fixed at world angle `π/2` (top). A canvas angle `θ` appears at world angle
`r − θ` when the wheel group is rotated by `r` (canvas y points down, world y points up).

To put `mid` under the pointer:

```
r_target = π/2 + mid      (mod 2π)
```

The wheel must only move forward, so:

```
current = mod(r_now, 2π)
delta   = mod(r_target − current, 2π)      // 0 … 2π
delta  += turns · 2π                       // configured 2–14 turns
r_end   = r_now + delta
```

`targetRotation` returns this plan. `turns` changes the duration of the theatre, not the result.

Resolution is the inverse:

```
θ = mod(r_end − π/2, 2π)
i = min(n − 1, floor(θ / step))
```

The engine test asserts `resolveIndex(targetRotation(i, n, …).rotation, n) === i` for every
`i` in every `n` from 2 to 32, and the browser test asserts the same after a real spin.

## Easing

The normalized progress is:

```
s(t) = t²(3 − 2t)        // cubic Hermite / smoothstep
```

Properties:

- `s(0) = 0`, `s(1) = 1`
- `s'(0) = 0`, `s'(1) = 0` — a soft wind-up and a friction-like settle
- monotonic on `[0, 1]`, so the wheel never reverses

The spin uses `r(t) = r_start + delta · s(t)` with `t = elapsed / duration`. Duration is 3–10 s
(default 5.5 s); reduced motion uses 1.1 s and one turn. Frame rate cannot change the final angle
because the end is pinned and snapped, not integrated.

## Peg ticks

There are `n` pegs, one at each slice boundary. As the wheel turns, crossings are counted from the
angle:

```
passed = floor((r − r_start) / step)
```

Each new crossing produces one tick. The instantaneous peg rate is:

```
pegsPerSecond = angularVelocity / step
```

Ticks are throttled to one per 24 ms, and the oscillator frequency is
`1180 + min(1900, pegsPerSecond × 36)` Hz. Faster wheel → brighter, more urgent clicking. The audible
rate is capped for performance, but it still scales across the usable range.

## Pointer spring

The pointer is a damped spring around its pivot:

```
v += (−θ · 110 − v · 10.5) · dt
θ += v · dt
θ = clamp(θ, −0.42, 0.42)
```

Each peg crossing adds an impulse proportional to the rate, clamped to `[0.045, 0.34]`. The pointer
visibly shudders at low speed and blurs at high speed, then settles.

## Reduced motion

`prefers-reduced-motion: reduce`:

- shortens the spin to 1.1 s and one turn,
- keeps the same pick and resolution path,
- suppresses confetti,
- disables the pulsing dot, halo and ring animations via CSS.

The draw remains complete and verifiable. Reduced motion is not a “no animation” switch that breaks
the reveal.

## What is not guaranteed

- The 2D confetti is decorative; it has no effect on the result.
- The displayed history duration is wall-clock time from click to reveal, so it includes frame
  scheduling and is expected to vary by tens of milliseconds.
- OS-level randomness quality is delegated to the browser's `crypto.getRandomValues`, which is the
  standard CSPRNG available to a static page.
