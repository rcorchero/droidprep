import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const dataDir = join(here, '..', 'data');

const failures = [];

export function loadData(name) {
  try {
    return JSON.parse(readFileSync(join(dataDir, name), 'utf8'));
  } catch (e) {
    failures.push(`${name}: could not read/parse -> ${e.message}`);
    return null;
  }
}

export function test(label, fn) {
  try {
    fn();
  } catch (e) {
    failures.push(`${label}: ${e.message}`);
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

export function finish() {
  if (failures.length) {
    console.error(`✖ ${failures.length} failure(s):`);
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log('✓ All assertions passed.');
  process.exit(0);
}