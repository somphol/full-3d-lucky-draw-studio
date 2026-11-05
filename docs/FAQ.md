# FAQ

### Is the draw really fair?

Yes. The winner is picked before the wheel moves, uniformly at random, with rejection sampling over
`crypto.getRandomValues`. All slices are equal. The animation targets the chosen slice and the app
asserts that the final rotation resolves back to it. See [PHYSICS.md](PHYSICS.md).

### Can the result be influenced by when I click or by the spin duration?

No. The pick happens at click time and the duration only changes how long the wheel takes to reach
the chosen slice. Reduced motion changes duration and turns, not the result.

### How many names can I add?

2 to 32. Three and four are the quick-slot defaults; the bulk textarea and the party preset cover
larger events. Beyond 32 the roster reports overflow rather than silently dropping names. Names are
trimmed to 28 characters for the wheel texture.

### What happens to duplicate names?

They are merged case-insensitively (`Ada` and `ada` count as one) and a toast reports what was
merged. This prevents the same person from occupying two slices.

### What does “Remove & keep spinning” do?

It removes the winner from the active roster, rebuilds the wheel and closes the dialog. The record is
tagged **Removed**. The next spin uses the smaller roster. “Keep in roster” leaves the name in place
and tags the record **Kept**.

### What is auto-remove?

A setting that removes the winner immediately on reveal. The dialog hides “Keep” and the primary
button becomes **Continue**. Use it for “one prize per person” events.

### Where is my data stored?

Only in this browser's `localStorage`. No account, no server, no analytics. Clearing site data
removes it. See [PRIVACY.md](PRIVACY.md).

### How do I export the results?

Open the **History** tab and choose **Export JSON** or **Export CSV**. The file downloads locally.
JSON has a stable schema (`lucky-draw.export.v1`); CSV is UTF-8 with a BOM for spreadsheet apps.

### Why does the wheel sometimes show a name upside down?

Labels are painted once on a rotating texture, like a real wheel. The studio orients labels for the
resting position, so the winning slice and its neighbours are upright after a spin. During the spin
they rotate with the wheel.

### Does it work offline?

After the first load, the HTML/CSS/JS are cached by the browser, but Three.js is loaded from a pinned
CDN and there is no service worker. A cold offline load will fail. Download the Three.js module and
change the import map if you need true offline operation; update
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and the tests accordingly.

### Which browsers are supported?

Current Chrome, Edge, Firefox and Safari with WebGL2. Headless Chromium is used by the test suite.
The app reports a readable message if WebGL is unavailable.

### Why is there no backend or login?

A host should be able to open a URL on any laptop and run a draw without creating an account. Static
hosting also keeps the privacy surface and the operational cost near zero.

### Can I change the colours or branding?

Yes. The wheel palette is `PALETTE` in `script.js`; the UI tokens are at the top of `style.css`. If
you change the palette, re-run the browser suite and regenerate screenshots. Keep the eight colours
distinct enough for adjacent slices.

### Why does the page need network access for the tests?

The suite loads the same pinned Three.js module as production. The CDN must be reachable. The engine
and static suites run entirely offline.

### Something looks wrong after a deploy.

GitHub Pages has a CDN cache. Wait a minute and hard-refresh. Verify the live copy with the browser
suite (`TEST_URL=… node tests/browser.test.mjs`).

### How do I rebuild this project from scratch?

Read [REPRODUCTION.md](REPRODUCTION.md). It lists the exact file order, constants, contracts and the
mistakes to avoid.
