// Headless browser suite over the Chrome DevTools Protocol.
//
//   node tests/browser.test.mjs
//   TEST_URL=https://somphol.github.io/full-3d-lucky-draw-studio/ node tests/browser.test.mjs
//
// One Chrome instance, mock keychain (no macOS prompts), temporary profile.

import assert from 'node:assert/strict';
import { connect, launchBrowser, startServer } from './lib/harness.mjs';
import { ROOT } from './lib/fixtures.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const LIVE = process.env.TEST_URL || null;
const results = [];
let server = null;

const record = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: detail !== false, detail });
    console.log(`${detail === false ? '✖' : '✓'} ${name}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error?.message || String(error) });
    console.log(`✖ ${name}\n    ${error?.message || error}`);
  }
};

const base = LIVE || (server = await startServer(ROOT)).url;
const browser = await launchBrowser({ width: 1600, height: 1000 });
const target = await (
  await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, { method: 'PUT' })
).json();
const cdp = await connect(target.webSocketDebuggerUrl);
const consoleErrors = [];

const evaluate = async (expression) => {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  }
  return result?.value;
};

const waitFor = (expression, timeout = 15000) => cdp.waitFor(expression, { timeout, interval: 120 });

const navigate = async (query = '') => {
  await cdp.send('Page.navigate', { url: `${base}/${query}` });
  await waitFor('document.body && document.body.dataset.ready === "true"', 30000);
  await sleep(500);
};

const click = (id) => evaluate(`document.getElementById(${JSON.stringify(id)}).click(); true`);

try {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  cdp.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error') {
      consoleErrors.push(params.args.map((arg) => arg.value || arg.description).join(' '));
    }
  });
  cdp.on('Runtime.exceptionThrown', (params) => {
    consoleErrors.push(params.exceptionDetails?.exception?.description || 'uncaught exception');
  });
  cdp.on('Log.entryAdded', (params) => {
    if (params.entry.level === 'error') consoleErrors.push(params.entry.text);
  });

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate('?test=boot');

  await record('Boots the WebGL studio with a default four-name roster', async () => {
    const info = await evaluate(`(() => ({
      ready: document.body.dataset.ready,
      webgl: document.body.dataset.webgl,
      canvas: Boolean(document.querySelector('#stage-canvas canvas')),
      wheelChildren: window.__luckyDraw.studio.wheel.children.length,
      roster: window.__luckyDraw.state.roster,
      faceVersion: window.__luckyDraw.studio.faceVersion,
      stageCount: document.getElementById('stage-count').textContent
    }))()`);
    assert.equal(info.ready, 'true');
    assert.equal(info.webgl, 'true');
    assert.equal(info.canvas, true);
    assert.ok(info.wheelChildren >= 8);
    assert.equal(info.roster.length, 4);
    assert.equal(info.stageCount, '4');
    assert.ok(info.faceVersion > 0);
    return true;
  });

  await record('Built-in self-test passes every check', async () => {
    const report = JSON.parse(await evaluate('JSON.stringify(window.__luckyDraw.runSelfTest())'));
    assert.ok(report.total >= 18, `only ${report.total} checks`);
    assert.equal(report.passed, report.total, JSON.stringify(report.checks.filter((c) => !c.ok)));
    assert.equal(await evaluate('document.body.dataset.selftest'), `${report.total}/${report.total}`);
    return true;
  });

  await record('Quick-entry slots rebuild the wheel texture live', async () => {
    const before = await evaluate('window.__luckyDraw.studio.faceVersion');
    await evaluate(`(() => {
      const names = ['Ann', 'Ben', 'Cara', ''];
      names.forEach((name, i) => { document.getElementById('slot-' + (i + 1)).value = name; });
      document.getElementById('slot-4').dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(250);
    const after = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster,
      version: window.__luckyDraw.studio.faceVersion,
      stageCount: document.getElementById('stage-count').textContent
    }))()`);
    assert.deepEqual(after.roster, ['Ann', 'Ben', 'Cara']);
    assert.ok(after.version > before);
    assert.equal(after.stageCount, '3');
    return true;
  });

  await record('Bulk textarea accepts a larger roster', async () => {
    await evaluate(`(() => {
      const area = document.getElementById('bulk-roster');
      area.value = 'Ada Lovelace\\nGrace Hopper\\nAlan Turing\\nKatherine Johnson\\nMargaret Hamilton\\nEdsger Dijkstra';
      area.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(450);
    const info = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster,
      slots: [1,2,3,4].map(i => document.getElementById('slot-' + i).value)
    }))()`);
    assert.equal(info.roster.length, 6);
    assert.deepEqual(info.slots, ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson']);
    return true;
  });

  await record('Duplicate names are merged and reported', async () => {
    await evaluate(`(() => {
      const area = document.getElementById('bulk-roster');
      area.value = 'Ann\\nann\\nBen';
      area.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(450);
    const info = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster,
      toast: document.getElementById('toast').textContent,
      visible: document.getElementById('toast').classList.contains('is-visible')
    }))()`);
    assert.deepEqual(info.roster, ['Ann', 'Ben']);
    assert.equal(info.visible, true);
    assert.match(info.toast, /duplicate/i);
    return true;
  });

  await record('A twelve-name preset fills the wheel', async () => {
    await evaluate(`document.querySelector('[data-preset="party"]').click(); true`);
    await sleep(350);
    const roster = await evaluate('window.__luckyDraw.state.roster');
    assert.equal(roster.length, 12);
    return true;
  });

  await record('Spin stops on the pre-picked slice and opens the winner dialog', async () => {
    await evaluate('window.__luckyDraw.state.prefs.duration = 0.6; window.__luckyDraw.state.prefs.turns = 2; true');
    await click('spin-btn');
    await waitFor('!document.getElementById("winner-modal").hidden', 8000);
    const info = await evaluate(`(() => {
      const s = window.__luckyDraw;
      const record = s.state.history[0];
      const count = s.state.roster.length;
      return {
        winner: record.winner,
        draw: record.draw,
        history: s.state.history.length,
        resolved: s.engine.resolveIndex(s.studio.wheel.rotation.z, count),
        winnerIndex: s.state.roster.indexOf(record.winner),
        modalName: document.getElementById('winner-name').textContent,
        meta: document.getElementById('winner-meta').textContent,
        confetti: document.getElementById('confetti').width,
        spinning: s.state.spinning
      };
    })()`);
    assert.equal(info.history, 1);
    assert.equal(info.winner, info.modalName);
    assert.equal(info.resolved, info.winnerIndex);
    assert.equal(info.draw, 1);
    assert.match(info.meta, /#1/);
    assert.ok(info.confetti > 0, 'confetti canvas was not sized');
    assert.equal(info.spinning, false);
    return true;
  });

  await record('Remove winner rebuilds the wheel and tags the record', async () => {
    const before = await evaluate('window.__luckyDraw.state.roster.length');
    const winner = await evaluate('window.__luckyDraw.state.history[0].winner');
    await click('winner-remove');
    await sleep(300);
    const info = await evaluate(`(() => {
      const s = window.__luckyDraw;
      return {
        modalHidden: document.getElementById('winner-modal').hidden,
        roster: s.state.roster.length,
        removed: s.state.history[0].removed,
        tag: document.querySelector('.history-item .tag').textContent
      };
    })()`);
    assert.equal(info.modalHidden, true);
    assert.equal(info.roster, before - 1);
    assert.equal(info.removed, true);
    assert.equal(info.tag, 'Removed');
    assert.ok(!(await evaluate('window.__luckyDraw.state.roster')).includes(winner));
    return true;
  });

  await record('Keep in roster records the draw without removing the name', async () => {
    const before = await evaluate('window.__luckyDraw.state.roster.length');
    await evaluate('window.__luckyDraw.state.prefs.duration = 0.5; true');
    await click('spin-btn');
    await waitFor('!document.getElementById("winner-modal").hidden', 8000);
    const winner = await evaluate('window.__luckyDraw.state.history[0].winner');
    await click('winner-keep');
    await sleep(250);
    const info = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster,
      removed: window.__luckyDraw.state.history[0].removed,
      history: window.__luckyDraw.state.history.length,
      modalHidden: document.getElementById('winner-modal').hidden
    }))()`);
    assert.equal(info.roster.length, before);
    assert.ok(info.roster.includes(winner));
    assert.equal(info.removed, false);
    assert.equal(info.history, 2);
    assert.equal(info.modalHidden, true);
    return true;
  });

  await record('Thai switch translates the interface and document language', async () => {
    await click('lang-th');
    await sleep(350);
    const info = await evaluate(`(() => ({
      lang: document.documentElement.lang,
      spin: document.getElementById('spin-label').textContent,
      settings: document.getElementById('settings-title').textContent,
      langPressed: document.getElementById('lang-th').getAttribute('aria-pressed'),
      stored: JSON.parse(localStorage.getItem('ld3.prefs.v1')).lang
    }))()`);
    assert.equal(info.lang, 'th');
    assert.equal(info.spin, 'หมุนวงล้อ');
    assert.equal(info.settings, 'ตั้งค่าสตูดิโอ');
    assert.equal(info.langPressed, 'true');
    assert.equal(info.stored, 'th');
    return true;
  });

  await record('JSON and CSV exports carry the complete draw log', async () => {
    const json = await evaluate(`window.__luckyDraw.exportRecords('json', { download: false })`);
    const parsed = JSON.parse(json);
    assert.equal(parsed.schema, 'lucky-draw.export.v1');
    assert.equal(parsed.draws.length, 2);
    assert.equal(parsed.language, 'th');
    const csv = await evaluate(`window.__luckyDraw.exportRecords('csv', { download: false })`);
    assert.ok(csv.startsWith('draw,timestamp,winner,entries,removed,spin_ms'));
    assert.equal(csv.trim().split('\n').length, 3);
    return true;
  });

  await record('Settings persist duration, turns and sound', async () => {
    await click('settings-toggle');
    await sleep(200);
    await evaluate(`(() => {
      const range = document.getElementById('duration-range');
      range.value = '7';
      range.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('sound-switch').checked = false;
      document.getElementById('sound-switch').dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    await sleep(250);
    const info = await evaluate(`(() => {
      const prefs = JSON.parse(localStorage.getItem('ld3.prefs.v1'));
      return {
        duration: prefs.duration,
        sound: prefs.sound,
        output: document.getElementById('duration-value').textContent,
        open: document.getElementById('settings-drawer').classList.contains('is-open'),
        pressed: document.getElementById('sound-toggle').getAttribute('aria-pressed')
      };
    })()`);
    assert.equal(info.duration, 7);
    assert.equal(info.sound, false);
    assert.equal(info.output, '7.0s');
    assert.equal(info.open, true);
    assert.equal(info.pressed, 'false');
    await click('settings-close');
    await click('sound-toggle');
    return true;
  });

  await record('Automatic removal empties a winner from the wheel', async () => {
    await evaluate(`(() => {
      window.__luckyDraw.state.prefs.autoRemove = true;
      window.__luckyDraw.state.prefs.duration = 0.5;
      localStorage.setItem('ld3.prefs.v1', JSON.stringify(window.__luckyDraw.state.prefs));
      return true;
    })()`);
    const before = await evaluate('window.__luckyDraw.state.roster.length');
    await click('spin-btn');
    await waitFor('!document.getElementById("winner-modal").hidden', 8000);
    const info = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster.length,
      removed: window.__luckyDraw.state.history[0].removed,
      keepHidden: document.getElementById('winner-keep').hidden,
      primary: document.getElementById('winner-remove').textContent,
      history: window.__luckyDraw.state.history.length
    }))()`);
    assert.equal(info.roster, before - 1);
    assert.equal(info.removed, true);
    assert.equal(info.keepHidden, true);
    assert.equal(info.primary, 'ดำเนินการต่อ');
    assert.equal(info.history, 3);
    await click('winner-remove');
    await evaluate(`(() => {
      window.__luckyDraw.state.prefs.autoRemove = false;
      localStorage.setItem('ld3.prefs.v1', JSON.stringify(window.__luckyDraw.state.prefs));
      return true;
    })()`);
    return true;
  });

  await record('Reload restores roster, history and Thai preference', async () => {
    const before = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster.length,
      history: window.__luckyDraw.state.history.length
    }))()`);
    await navigate('?test=reload');
    const info = await evaluate(`(() => ({
      roster: window.__luckyDraw.state.roster.length,
      history: window.__luckyDraw.state.history.length,
      lang: document.documentElement.lang,
      draws: document.getElementById('draws-count').textContent,
      items: document.querySelectorAll('.history-item').length
    }))()`);
    assert.equal(info.roster, before.roster);
    assert.equal(info.history, before.history);
    assert.equal(info.lang, 'th');
    assert.equal(info.draws, String(before.history));
    assert.equal(info.items, before.history);
    return true;
  });

  await record('Clear log requires a confirmation click and then empties history', async () => {
    await click('tab-history');
    await click('clear-history');
    const armed = await evaluate(`(() => ({
      text: document.getElementById('clear-history').textContent,
      history: window.__luckyDraw.state.history.length
    }))()`);
    assert.equal(armed.text, 'กดอีกครั้ง');
    assert.ok(armed.history > 0);
    await click('clear-history');
    await sleep(200);
    const info = await evaluate(`(() => ({
      history: window.__luckyDraw.state.history.length,
      stored: JSON.parse(localStorage.getItem('ld3.history.v1')),
      empty: !document.getElementById('history-empty').hidden
    }))()`);
    assert.equal(info.history, 0);
    assert.deepEqual(info.stored, []);
    assert.equal(info.empty, true);
    return true;
  });

  await record('Mobile layout opens the roster drawer over a full-height stage', async () => {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await navigate('?test=mobile');
    const info = await evaluate(`(() => {
      const stage = document.getElementById('stage').getBoundingClientRect();
      const toggle = getComputedStyle(document.getElementById('sidebar-toggle'));
      return {
        stageHeight: stage.height,
        stageWidth: stage.width,
        toggleDisplay: toggle.display,
        sidebarOpen: document.getElementById('sidebar').classList.contains('is-open')
      };
    })()`);
    assert.ok(info.stageHeight >= 380, `stage ${info.stageHeight}px`);
    assert.ok(info.stageWidth <= 390);
    assert.equal(info.toggleDisplay, 'flex');
    assert.equal(info.sidebarOpen, false);
    await click('sidebar-toggle');
    await sleep(450);
    const opened = await evaluate(`(() => ({
      open: document.getElementById('sidebar').classList.contains('is-open'),
      visible: document.getElementById('sidebar').getBoundingClientRect().right <= 391,
      scrim: !document.getElementById('drawer-scrim').hidden
    }))()`);
    assert.equal(opened.open, true);
    assert.equal(opened.visible, true);
    assert.equal(opened.scrim, true);
    await click('sidebar-close');
    return true;
  });

  await record('Reduced motion shortens the spin and suppresses confetti', async () => {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await navigate('?test=reduced');
    const reduced = await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches');
    assert.equal(reduced, true);
    const started = Date.now();
    await click('spin-btn');
    await waitFor('!document.getElementById("winner-modal").hidden', 5000);
    const elapsed = Date.now() - started;
    const info = await evaluate(`(() => ({
      confetti: document.getElementById('confetti').width,
      history: window.__luckyDraw.state.history.length
    }))()`);
    assert.ok(elapsed < 3500, `reduced spin took ${elapsed}ms`);
    assert.equal(info.confetti, 0);
    assert.equal(info.history, 1);
    await click('winner-keep');
    return true;
  });

  await record('No console or page errors during the suite', async () => {
    assert.deepEqual(consoleErrors, []);
    return true;
  });
} finally {
  const passed = results.filter((entry) => entry.ok).length;
  console.log(`\n${passed}/${results.length} browser checks passed`);
  if (passed !== results.length) {
    console.log(JSON.stringify(results.filter((entry) => !entry.ok), null, 2));
    process.exitCode = 1;
  }
  cdp.close();
  browser.proc.kill('SIGKILL');
  if (server) await server.close();
}
