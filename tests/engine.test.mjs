import assert from 'node:assert/strict';
import test from 'node:test';
import { loadEngine } from './lib/fixtures.mjs';

const engine = loadEngine();
const TAU = engine.TAU;

test('engine exposes a frozen contract', () => {
  assert.equal(engine.VERSION, '1.0.0');
  assert.equal(engine.MIN_ENTRIES, 2);
  assert.equal(engine.MAX_ENTRIES, 32);
  assert.ok(Math.abs(engine.POINTER_ANGLE - Math.PI / 2) < 1e-12);
  for (const name of [
    'normalizeRoster',
    'sliceLayout',
    'rotationForIndex',
    'targetRotation',
    'resolveIndex',
    'pickIndex',
    'smoothstep',
    'toCSV',
    'toJSON',
  ]) {
    assert.equal(typeof engine[name], 'function', `${name} missing`);
  }
});

test('slice layout partitions the circle for 2–32 entries', () => {
  for (let n = 2; n <= 32; n += 1) {
    const layout = engine.sliceLayout(n);
    assert.equal(layout.length, n);
    assert.equal(layout[0].start, 0);
    assert.ok(Math.abs(layout[n - 1].end - TAU) < 1e-9);
    for (let i = 0; i < n; i += 1) {
      assert.ok(layout[i].end > layout[i].start);
      assert.ok(Math.abs(layout[i].mid - (layout[i].start + layout[i].end) / 2) < 1e-12);
      if (i > 0) assert.ok(Math.abs(layout[i].start - layout[i - 1].end) < 1e-12);
    }
  }
});

test('rotationForIndex puts every slice under the pointer', () => {
  for (let n = 2; n <= 32; n += 1) {
    for (let index = 0; index < n; index += 1) {
      const rotation = engine.rotationForIndex(index, n);
      assert.equal(engine.resolveIndex(rotation, n), index, `n=${n} index=${index}`);
    }
  }
});

test('targetRotation lands on the picked slice and always spins forward', () => {
  for (let i = 0; i < 1000; i += 1) {
    const n = 2 + (i % 31);
    const index = i % n;
    const turns = 2 + (i % 9);
    const from = i * 0.137;
    const plan = engine.targetRotation(index, n, turns, from);
    assert.equal(engine.resolveIndex(plan.rotation, n), index);
    assert.ok(plan.delta >= turns * TAU - 1e-9);
    assert.ok(plan.delta <= turns * TAU + TAU + 1e-9);
  }
});

test('rotation survives normalisation at the end of a spin', () => {
  for (let i = 0; i < 500; i += 1) {
    const n = 3 + (i % 20);
    const index = i % n;
    const plan = engine.targetRotation(index, n, 5, 0);
    assert.equal(engine.resolveIndex(engine.mod(plan.rotation, TAU), n), index);
  }
});

test('seeded uniform picks stay inside the roster', () => {
  let seed = 1234567;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const counts = new Array(8).fill(0);
  for (let i = 0; i < 40000; i += 1) {
    const index = engine.pickIndex(8, (n) => Math.floor(random() * n));
    assert.ok(index >= 0 && index < 8);
    counts[index] += 1;
  }
  for (const count of counts) {
    assert.ok(Math.abs(count - 5000) < 300, `unbalanced bucket: ${count}`);
  }
});

test('pickIndex handles empty, injected and modulo values', () => {
  assert.equal(engine.pickIndex(0), -1);
  assert.equal(engine.pickIndex(5, () => 7), 2);
  assert.equal(engine.pickIndex(5, () => -1), 4);
  assert.equal(engine.pickIndex(5, () => Number.NaN), 0);
  assert.equal(engine.pickIndex(5, () => 0), 0);
});

test('roster normalisation trims, merges case-insensitively and reports overflow', () => {
  const result = engine.normalizeRoster('  Ada  Lovelace \nada lovelace\n\nGrace Hopper ');
  assert.deepEqual(result.entries, ['Ada Lovelace', 'Grace Hopper']);
  assert.deepEqual(result.duplicates, ['ada lovelace']);
  assert.deepEqual(result.overflow, []);
  assert.equal(result.truncated, false);

  const many = Array.from({ length: 40 }, (_, i) => `Entry ${i}`);
  const capped = engine.normalizeRoster(many);
  assert.equal(capped.entries.length, 32);
  assert.equal(capped.overflow.length, 8);
  assert.equal(capped.truncated, true);
});

test('roster accepts arrays and strips control characters', () => {
  const result = engine.normalizeRoster(['  A\u0000B ', 'C\tD', '', '   ', 'A B']);
  assert.deepEqual(result.entries, ['A B', 'C D']);
  assert.deepEqual(result.duplicates, ['A B']);
  assert.equal(engine.cleanName('x'.repeat(40)).length, 28);
});

test('smoothstep is cubic, monotonic and pins both ends', () => {
  assert.equal(engine.smoothstep(0), 0);
  assert.equal(engine.smoothstep(1), 1);
  assert.equal(engine.smoothstep(-2), 0);
  assert.equal(engine.smoothstep(4), 1);
  let previous = -1;
  for (let i = 0; i <= 100; i += 1) {
    const value = engine.smoothstep(i / 100);
    assert.ok(value >= previous);
    previous = value;
  }
  assert.ok(Math.abs(engine.smoothstep(0.5) - 0.5) < 1e-12);
});

test('CSV escaping survives commas, quotes and newlines', () => {
  const record = {
    at: '2026-11-05T00:00:00.000Z',
    winner: 'Ada, "Countess"\nLovelace',
    rosterSize: 4,
    removed: true,
    durationMs: 5123.4,
  };
  const csv = engine.toCSV([record]);
  assert.ok(csv.startsWith('draw,timestamp,winner,entries,removed,spin_ms\n'));
  assert.ok(csv.includes('"Ada, ""Countess""\nLovelace"'));
  assert.ok(csv.endsWith(',yes,5123\n'));
  assert.equal(csv.split('\n').length, 4);
});

test('JSON export reports the schema and normalised fields', () => {
  const json = JSON.parse(
    engine.toJSON(
      [
        {
          draw: 2,
          at: '2026-11-05T00:00:00.000Z',
          winner: 'Grace',
          rosterSize: 3,
          durationMs: 4000.4,
          removed: 0,
        },
      ],
      { project: 'studio', language: 'th' }
    )
  );
  assert.equal(json.schema, 'lucky-draw.export.v1');
  assert.equal(json.project, 'studio');
  assert.equal(json.language, 'th');
  assert.equal(json.draws.length, 1);
  assert.equal(json.draws[0].winner, 'Grace');
  assert.equal(json.draws[0].durationMs, 4000);
  assert.equal(json.draws[0].removed, false);
});

test('a full simulated draw always resolves to the pre-picked entry', () => {
  for (let n = 2; n <= 32; n += 1) {
    for (let round = 0; round < 20; round += 1) {
      const index = engine.pickIndex(n, (count) => (round * 7 + n) % count);
      const from = round * 0.71;
      const plan = engine.targetRotation(index, n, 4 + (round % 5), from);
      const landed = engine.resolveIndex(engine.mod(plan.rotation, TAU), n);
      assert.equal(landed, index, `n=${n} round=${round}`);
    }
  }
});
