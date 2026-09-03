import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

const errors = [];
const warnings = [];

function load(name) {
  try {
    return JSON.parse(readFileSync(join(dataDir, name), 'utf8'));
  } catch (e) {
    errors.push(`Could not parse ${name}: ${e.message}`);
    return null;
  }
}

function validateCategories(categories) {
  const ids = new Set();
  (categories || []).forEach((c) => {
    if (!c.id) errors.push('Category missing id');
    if (ids.has(c.id)) errors.push(`Duplicate category id: ${c.id}`);
    ids.add(c.id);
    if (!c.name) errors.push(`Category ${c.id || ''} missing name`);
    if (typeof c.questionCount !== 'number') errors.push(`Category ${c.id || ''} missing questionCount`);
  });
  return ids;
}

function validateQuestions(questions, categoryIds) {
  const ids = new Set();
  (questions || []).forEach((q) => {
    if (!q.id) {
      errors.push('Question missing id');
      return;
    }
    if (ids.has(q.id)) errors.push(`Duplicate question id: ${q.id}`);
    ids.add(q.id);

    if (!q.category) errors.push(`Question ${q.id} missing category`);
    else if (!categoryIds.has(q.category)) errors.push(`Question ${q.id} has unknown category: ${q.category}`);

    if (!q.question) errors.push(`Question ${q.id} missing text`);
    if (!q.answer) errors.push(`Question ${q.id} missing answer`);
  });
  return ids;
}

function validateDifficulty(difficulties, questionIds) {
  const levels = new Set(['basic', 'intermediate', 'senior', 'staff']);
  Object.entries(difficulties || {}).forEach(([id, level]) => {
    if (!questionIds.has(id)) warnings.push(`Difficulty references unknown question: ${id}`);
    if (!levels.has(level)) errors.push(`Difficulty for ${id} has invalid level: ${level}`);
  });
}

function validateMcq(mcq, questionIds) {
  (mcq || []).forEach((q) => {
    if (!q.id) {
      errors.push('MCQ missing id');
      return;
    }
    if (!questionIds.has(q.id)) warnings.push(`MCQ ${q.id} does not match a browse question`);
    if (!q.question) errors.push(`MCQ ${q.id} missing question text`);
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`MCQ ${q.id} needs at least 2 options`);
    if (typeof q.correctIndex !== 'number' || !Array.isArray(q.options) ||
        q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      errors.push(`MCQ ${q.id} has invalid correctIndex`);
    }
    if (!q.explanation) errors.push(`MCQ ${q.id} missing explanation`);
  });
}

const categoriesFile = load('categories.json');
const questionsFile = load('questions.json');
const difficultyFile = load('difficulty.json');
const mcqFile = load('mcq.json');

if (categoriesFile) {
  const categoryIds = validateCategories(categoriesFile.categories);

  if (questionsFile) {
    const questionIds = validateQuestions(questionsFile.questions, categoryIds);

    if (difficultyFile) {
      validateDifficulty(difficultyFile.difficulties, questionIds);
    }

    if (mcqFile) {
      validateMcq(mcqFile.questions, questionIds);
    }
  }
}

console.log('--- Validation Report ---');
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ⚠  ${w}`));
} else {
  console.log('  No warnings.');
}

if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach((e) => console.log(`  ✖ ${e}`));
  console.log('\nValidation FAILED.');
  process.exit(1);
} else {
  console.log('\nValidation PASSED.');
  process.exit(0);
}
