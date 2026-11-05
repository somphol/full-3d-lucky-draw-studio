# Third-party notices

## Three.js 0.169.0

The studio loads Three.js and two official addons (`OrbitControls`, `RoomEnvironment`) from
`cdn.jsdelivr.net` at runtime. They are not vendored in this repository.

- Project: <https://threejs.org>
- Source: <https://github.com/mrdoob/three.js>
- License: MIT

```
The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

`RoomEnvironment` is part of the Three.js examples and is distributed under the same MIT license.
`OrbitControls` is derived from the same project and is also MIT.

## Fonts

No webfont is downloaded or bundled. The UI uses the host system's sans-serif stack and the host's
Thai font. The canvas texture uses the same stack.

## Audio

No audio files. Every sound is synthesized at runtime with the Web Audio API.

## Images

No third-party images. The favicon is hand-written SVG. The environment map is generated from
Three.js's `RoomEnvironment`; screenshots are renders of this project.

## OpenCode and the model

The release was built with [OpenCode](https://opencode.ai) and **DeepSeek V4.1 Flash**. Those names
appear in the documentation and the settings drawer as credits; no code or data from them is bundled.
