# Contributing

Thanks for taking the time to improve the Lucky Draw Studio. This is a small, dependency-free static
app; the best contributions are focused, verified and documented.

## Ground rules

- Keep the app backend-free and dependency-free. No package.json, no bundler, no framework.
- Keep `createDrawEngine()` pure and between its markers.
- Keep Three.js pinned to one exact version in the import map.
- Never change the fairness path (pick → plan → animate → resolve) without a test that proves the
  final rotation resolves to the picked index.
- Preserve the coordinate contract in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). It is easy to
  break and hard to see.
- Update [AGENTS.md](AGENTS.md) in the same pull request when you change commands, architecture or
  constraints.

## Getting set up

```bash
git clone https://github.com/somphol/full-3d-lucky-draw-studio.git
cd full-3d-lucky-draw-studio
python3 -m http.server 8000
# open http://localhost:8000/
```

No install step. Node 22+ is required for the test suites; Chrome is required for the browser suite.

## Before opening a pull request

```bash
cp script.js /tmp/script.mjs && node --check /tmp/script.mjs
node --test tests/engine.test.mjs tests/static.test.mjs
node tests/browser.test.mjs
```

Open [`?selftest`](http://localhost:8000/?selftest) and confirm all checks pass.

If you changed the visuals, regenerate screenshots:

```bash
node scripts/screenshot.mjs
```

If you changed source line counts, update `state.json` (the static suite checks them).

## Code style

- Two-space indentation, single quotes, semicolons, trailing commas in multi-line literals.
- Prefer `const`, small pure helpers and explicit names over abbreviations.
- User-provided strings must go through `textContent`, never `innerHTML`.
- New UI copy must be added to both dictionaries with identical keys.
- New DOM IDs must be unique and referenced only by `$()`.
- Keep animation off the main thread where possible; the render loop is the only per-frame work.
- Use `prefers-reduced-motion` for any new motion, not just CSS.

## Accessibility

- Every new control needs a visible focus state and an accessible name.
- Dialogs need `role="dialog"`, `aria-modal`, a labelled title and focus management.
- Test the keyboard path: `Tab`, `Space`, `Escape`, and the existing shortcuts.
- Do not convey meaning by colour alone.

## Commit messages

Use an imperative subject with a scope when useful:

```
engine: reject modulo bias in pickIndex
scene: replace rim boxes with arc bands
docs: add reproduction guide
```

## Reporting

- Bugs and feature requests: use the GitHub issue templates.
- Security: follow [SECURITY.md](SECURITY.md), not a public issue.

## License

By contributing you agree that your contribution is licensed under the MIT license in
[LICENSE](LICENSE).
