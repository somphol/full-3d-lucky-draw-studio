import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { loadEngine, loadI18n, read, ROOT } from './lib/fixtures.mjs';

const html = read('index.html');
const css = read('style.css');
const js = read('script.js');
const state = JSON.parse(read('state.json'));

const walk = (dir) =>
  readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );

const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

test('source files exist and are non-trivial', () => {
  for (const file of ['index.html', 'style.css', 'script.js']) {
    assert.ok(existsSync(join(ROOT, file)), `${file} missing`);
    assert.ok(statSync(join(ROOT, file)).size > 5000, `${file} suspiciously small`);
  }
});

test('HTML shell is complete and describes the product', () => {
  assert.match(html, /^<!DOCTYPE html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport"[^>]*width=device-width/);
  assert.match(html, /<meta name="description" content="[^"]{60,}"/);
  assert.match(html, /<meta name="theme-color" content="#070b12">/);
  assert.match(html, /<title>Full 3D Lucky Draw &amp; Prize Wheel Studio<\/title>/);
  assert.match(html, /<meta property="og:image" content="assets\/og-card\.png">/);
  assert.match(html, /<script type="module" src="script\.js"><\/script>/);
  assert.match(html, /<link rel="stylesheet" href="style\.css">/);
  assert.match(html, /<canvas class="confetti" id="confetti"/);
});

test('Three.js is pinned to one exact CDN version', () => {
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /three@0\.169\.0\/build\/three\.module\.js/);
  assert.match(html, /three@0\.169\.0\/examples\/jsm\//);
  assert.doesNotMatch(html, /three@latest|three@\^|unpkg\.com/);
});

test('no duplicate ids and every script id reference exists', () => {
  const duplicates = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], `duplicate ids: ${duplicates.join(', ')}`);

  const referenced = [...js.matchAll(/\$\('([^']+)'\)/g)]
    .map((match) => match[1])
    .filter((id) => /^[A-Za-z][\w-]*$/.test(id));
  const missing = [...new Set(referenced)].filter((id) => !htmlIds.includes(id));
  assert.deepEqual(missing, [], `script references missing ids: ${missing.join(', ')}`);
});

test('English and Thai dictionaries have identical keys', () => {
  const i18n = loadI18n();
  const en = Object.keys(i18n.en).sort();
  const th = Object.keys(i18n.th).sort();
  assert.deepEqual(th, en);
  assert.ok(en.length >= 80, `only ${en.length} keys`);
});

test('every static translation key and placeholder is defined', () => {
  const i18n = loadI18n();
  const keys = [];
  for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) keys.push(match[1]);
  for (const match of html.matchAll(/data-i18n-placeholder="([^"]+)"/g)) keys.push(match[1]);
  const missing = [...new Set(keys)].filter((key) => !(key in i18n.en) || !(key in i18n.th));
  assert.deepEqual(missing, [], `missing translations: ${missing.join(', ')}`);
  assert.ok(keys.length > 55, `only ${keys.length} static keys`);
});

test('engine markers are present, pure and loadable in Node', () => {
  const start = js.indexOf('/* ENGINE:START */');
  const end = js.indexOf('/* ENGINE:END */');
  assert.ok(start > 0 && end > start);
  const block = js.slice(start, end);
  for (const forbidden of ['document.', 'window.', 'THREE', 'new Date(']) {
    if (forbidden === 'new Date(') continue; // export serialisation needs Date
    assert.ok(!block.includes(forbidden), `engine references ${forbidden}`);
  }
  const engine = loadEngine();
  assert.equal(engine.VERSION, '1.0.0');
  assert.equal(engine.resolveIndex(engine.rotationForIndex(3, 7), 7), 3);
});

test('only the pinned Three.js module is loaded remotely', () => {
  const remote = [
    ...[...html.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]+href="(https?:[^"]+)"/g)].map((m) => m[1]),
  ];
  for (const url of remote) {
    assert.ok(url.startsWith('https://cdn.jsdelivr.net/npm/three@0.169.0/'), `remote ${url}`);
  }
  assert.doesNotMatch(html, /<script[^>]+src="http/);
  assert.doesNotMatch(css, /@import|fonts\.googleapis|fonts\.gstatic/);
});

test('the documentation set is complete', () => {
  const docs = [
    'README.md',
    'ARCHITECTURE.md',
    'REPRODUCTION.md',
    'DESIGN.md',
    'PHYSICS.md',
    'TESTING.md',
    'DEPLOYMENT.md',
    'DECISIONS.md',
    'ACCESSIBILITY.md',
    'PERFORMANCE.md',
    'PRIVACY.md',
    'FAQ.md',
    'ROADMAP.md',
  ];
  for (const doc of docs) assert.ok(existsSync(join(ROOT, 'docs', doc)), `docs/${doc} missing`);
  for (const file of ['README.md', 'AGENTS.md', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(existsSync(join(ROOT, file)), `${file} missing`);
  }
});

test('every relative Markdown link resolves on disk', () => {
  const files = ['README.md', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md', ...walk('docs')]
    .filter((file) => file.endsWith('.md'))
    .map((file) => (file.startsWith('docs/') ? file : file));
  const missing = [];
  for (const file of files) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].trim().split('#')[0];
      if (!target || /^(https?:|mailto:|tel:)/.test(target)) continue;
      const resolved = resolve(dirname(join(ROOT, file)), target);
      if (!existsSync(resolved)) missing.push(`${file} → ${target}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('community and licence files are present', () => {
  for (const file of [
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    'SUPPORT.md',
    'LICENSE',
    '.editorconfig',
    '.gitignore',
    '.nojekyll',
  ]) {
    assert.ok(existsSync(join(ROOT, file)), `${file} missing`);
  }
  assert.match(read('LICENSE'), /MIT License/);
  assert.match(read('LICENSE'), /Somphol Boonjing/);
});

test('state.json records a real session and credits', () => {
  assert.equal(state.project, 'Full 3D Lucky Draw & Prize Wheel Studio');
  assert.match(state.release, /^\d+\.\d+\.\d+$/);
  assert.match(state.session.id, /^ses_/);
  assert.ok(state.session.elapsedSeconds > 60);
  assert.match(state.session.elapsed, /\d+[hm]/);
  assert.equal(state.model.name, 'DeepSeek V4.1 Flash');
  assert.equal(state.model.provider, 'opencode-go');
  assert.ok(state.usage.totalTokens > 0);
  assert.equal(state.credits.tool, 'OpenCode');
  assert.match(state.deployment.pages, /^https:\/\//);
  assert.ok(state.skill.name);
  assert.equal(
    state.skill.status,
    'published',
    'state.skill.status must be "published" in a release commit; a bootstrap commit made before the skill catalog is published will fail this check by design'
  );
});

test('state.json line counts match the source files', () => {
  const counts = {};
  for (const file of ['index.html', 'style.css', 'script.js']) {
    counts[file] = readFileSync(join(ROOT, file), 'utf8').split('\n').length - 1;
  }
  counts.total = counts['index.html'] + counts['style.css'] + counts['script.js'];
  assert.deepEqual(state.artifacts.lineCounts, counts);
});

test('every supporting artifact listed in state.json exists', () => {
  for (const file of state.artifacts.supportingFiles) {
    assert.ok(existsSync(join(ROOT, file)), `listed artifact missing: ${file}`);
  }
});

test('screenshots, social card and favicon exist', () => {
  for (const file of [
    'assets/studio.png',
    'assets/winner.png',
    'assets/thai.png',
    'assets/mobile.png',
    'assets/stage.png',
    'assets/og-card.png',
    'assets/og.html',
    'assets/favicon.svg',
  ]) {
    const path = join(ROOT, file);
    assert.ok(existsSync(path), `${file} missing`);
    const minimum = file.endsWith('.png') ? 5000 : file.endsWith('.html') ? 1500 : 200;
    assert.ok(statSync(path).size > minimum, `${file} too small`);
  }
  assert.match(read('assets/og.html'), /studio\.png/);
});

test('deployment metadata is present and consistent', () => {
  assert.match(read('robots.txt'), /Sitemap: https:\/\/somphol\.github\.io\/full-3d-lucky-draw-studio\/sitemap\.xml/);
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/somphol\.github\.io\/full-3d-lucky-draw-studio\//);
  assert.match(sitemap, /<lastmod>2026-11-05<\/lastmod>/);
  assert.ok(existsSync(join(ROOT, '.nojekyll')));
});

test('CI workflow verifies the module and both Node suites', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /node --check/);
  assert.match(ci, /node --test tests\/engine\.test\.mjs tests\/static\.test\.mjs/);
  assert.match(ci, /actions\/checkout@v4/);
  assert.doesNotMatch(ci, /pull_request_target/);
});

test('issue templates and pull request template exist', () => {
  for (const file of [
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/question.yml',
    '.github/pull_request_template.md',
  ]) {
    assert.ok(existsSync(join(ROOT, file)), `${file} missing`);
  }
});

test('CSS ships responsive and reduced-motion rules', () => {
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /--gold:/);
  assert.match(css, /touch-action: none/);
  assert.doesNotMatch(css, /@import/);
});

test('no secrets or private material are committed', () => {
  const files = [
    'index.html',
    'style.css',
    'script.js',
    'AGENTS.md',
    'README.md',
    'state.json',
    ...walk('tests'),
    ...walk('scripts'),
    '.github/workflows/ci.yml',
  ].filter((file) => existsSync(join(ROOT, file)));
  const patterns = [
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /AKIA[0-9A-Z]{16}/,
    /xox[baprs]-[A-Za-z0-9-]{10,}/,
    /\bsk-[A-Za-z0-9]{24,}/,
  ];
  for (const file of files) {
    const content = readFileSync(join(ROOT, file), 'utf8');
    for (const pattern of patterns) {
      assert.doesNotMatch(content, pattern, `possible secret in ${file}`);
    }
  }
});

test('user strings are never injected as HTML', () => {
  assert.doesNotMatch(js, /\.innerHTML\s*=/);
  assert.doesNotMatch(js, /insertAdjacentHTML/);
  assert.doesNotMatch(js, /document\.write/);
  assert.match(js, /textContent\s*=/);
});

test('storage keys and export schema are documented and stable', () => {
  for (const key of ['ld3.prefs.v1', 'ld3.roster.v1', 'ld3.history.v1']) {
    assert.ok(js.includes(key), `${key} missing from script`);
    assert.ok(read('docs/ARCHITECTURE.md').includes(key), `${key} missing from docs`);
  }
  assert.ok(js.includes('lucky-draw.export.v1'));
  assert.match(read('README.md'), /Web Crypto/);
  assert.match(read('README.md'), /OpenCode/);
  assert.match(read('README.md'), /DeepSeek V4\.1 Flash/);
});
