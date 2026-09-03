#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'data', 'questions.json');
const DIFFICULTY_PATH = path.join(ROOT, 'data', 'difficulty.json');

const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8')).questions;

// Group by category
const byCategory = {};
for (const q of questions) {
  if (!byCategory[q.category]) byCategory[q.category] = [];
  byCategory[q.category].push(q.id);
}

// Assign difficulty based on position within category
const difficulties = {};
for (const [cat, ids] of Object.entries(byCategory)) {
  const total = ids.length;
  const basicCutoff = Math.ceil(total * 0.4);
  const intermediateCutoff = Math.ceil(total * 0.75);

  ids.forEach((id, idx) => {
    if (idx < basicCutoff) {
      difficulties[id] = 'basic';
    } else if (idx < intermediateCutoff) {
      difficulties[id] = 'intermediate';
    } else {
      difficulties[id] = 'senior';
    }
  });
}

const output = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  difficulties,
};

fs.writeFileSync(DIFFICULTY_PATH, JSON.stringify(output, null, 2));

// Summary
const counts = { basic: 0, intermediate: 0, senior: 0 };
for (const d of Object.values(difficulties)) counts[d]++;
console.log('Difficulty distribution:');
console.log(`  basic: ${counts.basic}`);
console.log(`  intermediate: ${counts.intermediate}`);
console.log(`  senior: ${counts.senior}`);
console.log(`  total: ${Object.keys(difficulties).length}`);
console.log(`\nWrote ${DIFFICULTY_PATH}`);
