#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'data', 'questions.json');
const DIFFICULTY_PATH = path.join(ROOT, 'data', 'difficulty.json');
const OVERRIDES_PATH = path.join(ROOT, 'data', 'difficulty-overrides.json');

const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8')).questions;

const VALID_LEVELS = new Set(['basic', 'intermediate', 'senior']);

// Optional manual overrides: `data/difficulty-overrides.json`
// { "difficultyOverrides": { "qid": "intermediate" } }
let overrides = {};
if (fs.existsSync(OVERRIDES_PATH)) {
  overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8')).difficultyOverrides || {};
}

// Group by category
const byCategory = {};
for (const q of questions) {
  if (!byCategory[q.category]) byCategory[q.category] = [];
  byCategory[q.category].push(q.id);
}

// Assign difficulty based on position within category
const difficulties = {};
for (const ids of Object.values(byCategory)) {
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

// Apply manual overrides
let overrideCount = 0;
for (const [id, level] of Object.entries(overrides)) {
  if (!Object.hasOwn(difficulties, id)) {
    console.warn(`  skip override for unknown question: ${id}`);
    continue;
  }
  if (!VALID_LEVELS.has(level)) {
    console.warn(`  skip override with invalid difficulty "${level}" for ${id}`);
    continue;
  }
  difficulties[id] = level;
  overrideCount++;
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
if (overrideCount > 0) console.log(`  overrides applied: ${overrideCount}`);
console.log(`\nWrote ${DIFFICULTY_PATH}`);
