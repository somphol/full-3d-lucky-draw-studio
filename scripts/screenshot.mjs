// Regenerates the README screenshots from the running app.
//
//   node scripts/screenshot.mjs
//
// One Chrome instance, mock keychain, local static server. Writes to assets/.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../tests/lib/fixtures.mjs';
import { connect, launchBrowser, startServer } from '../tests/lib/harness.mjs';

const OUT = join(ROOT, 'assets');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = await startServer(ROOT);
const browser = await launchBrowser({ width: 1600, height: 1000 });
const target = await (
  await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, { method: 'PUT' })
).json();
const cdp = await connect(target.webSocketDebuggerUrl);

const evaluate = async (expression) => {
  const { result } = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.value;
};

const shot = async (name, clip) => {
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
  });
  writeFileSync(join(OUT, name), Buffer.from(data, 'base64'));
  console.log(`wrote assets/${name}`);
};

try {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send('Page.navigate', { url: `${server.url}/?shot=1` });
  await cdp.waitFor('document.body && document.body.dataset.ready === "true"', { timeout: 30000 });
  await sleep(1400);

  await evaluate(`document.querySelector('.lang-btn[data-lang="en"]').click()`);
  await sleep(350);
  await shot('studio.png');

  const stageBox = await evaluate(`(() => {
    const r = document.getElementById('stage').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  await shot('stage.png', stageBox);

  // Winner reveal with confetti in flight.
  await evaluate(`(() => {
    const s = window.__luckyDraw;
    s.state.prefs.duration = 0.9;
    s.state.prefs.turns = 2;
    return true;
  })()`);
  await evaluate('document.getElementById("spin-btn").click(); true');
  await cdp.waitFor('!document.getElementById("winner-modal").hidden', 8000);
  await sleep(380);
  await shot('winner.png');
  await evaluate('document.getElementById("winner-keep").click(); true');
  await sleep(300);

  await evaluate(`document.querySelector('.lang-btn[data-lang="th"]').click()`);
  await sleep(500);
  await shot('thai.png');
  await evaluate(`document.querySelector('.lang-btn[data-lang="en"]').click()`);
  await sleep(300);

  // Social card: a dedicated 1200×630 page embedding the fresh studio shot.
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send('Page.navigate', { url: `${server.url}/assets/og.html?v=${Date.now()}` });
  await sleep(1200);
  await shot('og-card.png');

  // Mobile: clean reload so no toast or dialog is present.
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await cdp.send('Page.navigate', { url: `${server.url}/?v=${Date.now()}` });
  await cdp.waitFor('document.body && document.body.dataset.ready === "true"', { timeout: 30000 });
  await sleep(900);
  await shot('mobile.png');

  console.log('screenshots complete');
} finally {
  cdp.close();
  browser.proc.kill('SIGKILL');
  await server.close();
}
