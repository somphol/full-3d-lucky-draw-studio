# Security policy

## Scope

This is a static client-side application. It has no server, database, authentication, cookies or
secrets. The realistic security surface is:

- the pinned Three.js CDN dependency;
- the browser's `localStorage` (roster and draw history, readable by scripts on the same origin);
- exported JSON/CSV files;
- the static hosting configuration.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Contact the maintainer privately:

- GitHub: [@somphol](https://github.com/somphol) — use the “Report a vulnerability” button under the
  repository's **Security** tab, or a private message if that is unavailable.

Include the affected file or URL, reproduction steps, the impact, and any suggested fix. You can
expect an acknowledgement within a few days. Please allow time for a fix before public disclosure.

## Supported versions

Only the latest release on `main` is supported. There are no maintained older branches.

## Dependency policy

- Three.js is pinned to `0.169.0` in the import map. Update deliberately, run every suite and the
  live verification, and record the change in the changelog.
- No other runtime dependency is permitted. No analytics, no remote fonts, no image CDNs.
- Do not add inline scripts beyond the import map; Pages cannot set a nonce or CSP.

## Hardening notes

- User strings are rendered with `textContent`; the app never uses `innerHTML` for roster, winner or
  history data.
- Exports are generated with `Blob` and a local object URL; no data is uploaded.
- The app requests no browser permissions.
- If you deploy behind a CDN, add a Content-Security-Policy that allows `self` plus
  `https://cdn.jsdelivr.net` for scripts, and disallows framing. The app needs `blob:` for downloads.

## Out of scope

- Someone with access to the device reading `localStorage` or exported files.
- A compromised CDN or browser extension.
- Social engineering of an event host who chooses the roster.
- Denial of service through an absurdly large pasted roster; the app caps it at 32 entries and 28
  characters per name.
