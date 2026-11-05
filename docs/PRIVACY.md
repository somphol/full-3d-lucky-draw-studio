# Privacy

## Short version

The studio has no accounts, no backend, no analytics, no cookies and no tracking pixels. Everything
you type stays in your browser unless you export it yourself.

## What is stored

`localStorage` under three keys:

| Key | Contents | Lifetime |
| --- | --- | --- |
| `ld3.prefs.v1` | language, sound, auto-remove, spin duration, full turns | until cleared |
| `ld3.roster.v1` | the current list of names | until cleared |
| `ld3.history.v1` | draw records: winner, timestamp, roster size, duration, removed flag | until cleared |

There are no session identifiers, no device fingerprints, no geolocation and no IP logging by the
app.

## What leaves the browser

- The initial page and its files come from GitHub Pages.
- Three.js and its addons are fetched from `cdn.jsdelivr.net` (pinned version). This reveals the
  request to that CDN, as any CDN would.
- Nothing else. There is no fetch/XHR/WebSocket in the application code, no font CDN, no image CDN,
  no analytics endpoint.

## Clear or export

- **Clear roster** empties the roster and persists an empty array; a reload stays empty.
- **Clear log** requires two clicks and removes all draw history from `localStorage`.
- **Export JSON / CSV** creates a local file download. The export includes the roster snapshot, the
  language and every draw record. Treat the file as personal data if the names are personal.
- Clearing site data in the browser removes everything the app stored.

## Cookies and permissions

The app sets no cookies and requests no permissions (camera, microphone, notifications, location).
Audio is synthesized locally and requires no permission; browsers may require a user gesture before
it is audible.

## Children and events

The tool is designed for event hosts and team draws. If the roster contains names of minors or other
personal data, the host is responsible for the device, the exported files and the projector. The app
does not transmit the roster anywhere.

## Changes

If a future version adds any network feature, update this document and the privacy statement in the
README before shipping. The current privacy surface is intentionally close to zero.

_Last updated: 2026-11-05._
