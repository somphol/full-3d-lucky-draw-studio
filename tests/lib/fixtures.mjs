// Shared test fixtures: repository root, source slices and dictionary loading.
// The app is a single ES module; the pure engine and the dictionaries are
// copied out by marker so they can run in Node without a DOM.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const read = (file) => readFileSync(join(ROOT, file), 'utf8');

const slice = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from < 0 || to < 0) throw new Error(`markers ${start} / ${end} not found`);
  return source.slice(from + start.length, to);
};

export const loadEngine = () => {
  const block = slice(read('script.js'), '/* ENGINE:START */', '/* ENGINE:END */');
  const factory = new Function(`${block}; return createDrawEngine;`)();
  return factory();
};

export const loadI18n = () => {
  const block = slice(read('script.js'), '/* I18N:START */', '/* I18N:END */');
  const factory = new Function(`${block}; return I18N;`)();
  return factory;
};
