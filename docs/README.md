# Documentation index

This studio ships as three source files and a release around them. The documents are grouped by what
you need to do.

## Start here

| Document | Read it when |
| --- | --- |
| [../README.md](../README.md) | You want the product tour, quick start and verification table. |
| [../AGENTS.md](../AGENTS.md) | You are an AI agent picking up the repository. Commands, contracts, known issues. |
| [REPRODUCTION.md](REPRODUCTION.md) | You need to rebuild the app from scratch or fork the mechanism. |
| [../state.json](../state.json) | You want the session elapsed time, token usage and line counts. |

## Build and understand

| Document | Contents |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Section map, data flow, scene graph, storage keys, public test hooks. |
| [PHYSICS.md](PHYSICS.md) | Uniform picking, rejection sampling, landing rotation, cubic easing, tick rate, pointer spring. |
| [DESIGN.md](DESIGN.md) | Colour tokens, layout, wheel geometry, label rules, responsive behaviour. |
| [DECISIONS.md](DECISIONS.md) | Why the app is vanilla, why Three.js is pinned, why 32 entries, and what not to “fix”. |

## Operate and verify

| Document | Contents |
| --- | --- |
| [TESTING.md](TESTING.md) | Engine, static, browser and in-page layers; how to add a check. |
| [DEPLOYMENT.md](DEPLOYMENT.md) | GitHub Pages, CI, cache behaviour, local serving, keychain-safe Chrome. |
| [PERFORMANCE.md](PERFORMANCE.md) | Budgets, draw calls, texture cost, device pixel ratio, mobile behaviour. |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Keyboard map, focus handling, ARIA, reduced motion, limitations. |
| [PRIVACY.md](PRIVACY.md) | What is stored, what leaves the browser, what the exports contain. |

## Product and project

| Document | Contents |
| --- | --- |
| [FAQ.md](FAQ.md) | Fairness, event use, custom names, offline use, troubleshooting. |
| [ROADMAP.md](ROADMAP.md) | What is intentionally out of scope and what could come next. |

## External references

- Three.js `0.169.0`: <https://threejs.org/docs/>
- `OrbitControls`: <https://threejs.org/docs/#examples/en/controls/OrbitControls>
- `RoomEnvironment`: <https://threejs.org/docs/#examples/en/environments/RoomEnvironment>
- Web Crypto `getRandomValues`: <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues>
- Web Audio API: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API>
