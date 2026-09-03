import { loadData, test, assert, finish } from './helpers.mjs';

const questionsFile = loadData('questions.json');
const categoriesFile = loadData('categories.json');

const REQUIRED_QUESTION_FIELDS = ['id', 'category', 'categoryLabel', 'question', 'answer'];

test('questions.json has a version', () => {
  assert(questionsFile && typeof questionsFile.version === 'string', 'missing version string');
});

test('questions.json has a non-empty questions array', () => {
  assert(Array.isArray(questionsFile?.questions) && questionsFile.questions.length > 0,
    'questions must be a non-empty array');
});

test('every question has the required fields', () => {
  for (const q of questionsFile.questions) {
    for (const field of REQUIRED_QUESTION_FIELDS) {
      assert(typeof q[field] === 'string' && q[field].trim() !== '',
        `question ${q.id}: missing or empty '${field}'`);
    }
  }
});

test('optional field types are correct when present', () => {
  for (const q of questionsFile.questions) {
    if (q.whyItMatters !== undefined) assert(typeof q.whyItMatters === 'string', `${q.id}: whyItMatters must be a string`);
    if (q.codeExample !== undefined) assert(typeof q.codeExample === 'string', `${q.id}: codeExample must be a string`);
    if (q.furtherReading !== undefined) {
      assert(Array.isArray(q.furtherReading), `${q.id}: furtherReading must be an array`);
      assert(q.furtherReading.every((u) => typeof u === 'string'), `${q.id}: furtherReading entries must be strings`);
    }
  }
});

test('question ids are unique', () => {
  const seen = new Set();
  for (const q of questionsFile.questions) {
    assert(!seen.has(q.id), `duplicate question id: ${q.id}`);
    seen.add(q.id);
  }
});

test('every question category exists in categories.json', () => {
  const known = new Set((categoriesFile?.categories || []).map((c) => c.id));
  for (const q of questionsFile.questions) {
    assert(known.has(q.category), `question ${q.id} references unknown category '${q.category}'`);
  }
});

test('category questionCount matches actual per-category counts', () => {
  const counts = {};
  for (const q of questionsFile.questions) counts[q.category] = (counts[q.category] || 0) + 1;
  for (const c of categoriesFile.categories) {
    assert(counts[c.id] === c.questionCount,
      `category '${c.id}' questionCount ${c.questionCount} does not match actual ${counts[c.id] || 0}`);
  }
});

test('categories.json entries are well-formed', () => {
  for (const c of categoriesFile.categories) {
    assert(c.id && c.name, `category missing id/name`);
    assert(typeof c.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c.color), `category ${c.id}: color must be a hex color`);
    assert(typeof c.icon === 'string' && c.icon.trim() !== '', `category ${c.id}: icon missing`);
  }
});

finish();