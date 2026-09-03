import { loadData, test, assert, finish } from './helpers.mjs';

const questionsFile = loadData('questions.json');
const mcqFile = loadData('mcq.json');
const difficultyFile = loadData('difficulty.json');

const questionIds = new Set((questionsFile?.questions || []).map((q) => q.id));
const VALID_LEVELS = new Set(['basic', 'intermediate', 'senior', 'staff']);

test('mcq.json has a version and a non-empty questions array', () => {
  assert(typeof mcqFile?.version === 'string', 'missing version string');
  assert(Array.isArray(mcqFile.questions) && mcqFile.questions.length > 0, 'questions must be a non-empty array');
});

test('every MCQ has the required fields', () => {
  for (const q of mcqFile.questions) {
    assert(q.id && typeof q.id === 'string', 'MCQ missing id');
    assert(typeof q.question === 'string' && q.question.trim() !== '', `MCQ ${q.id}: missing question text`);
    assert(typeof q.category === 'string', `MCQ ${q.id}: missing category`);
    assert(typeof q.explanation === 'string' && q.explanation.trim() !== '', `MCQ ${q.id}: missing explanation`);
  }
});

test('every MCQ has exactly 4 options and a valid correctIndex', () => {
  for (const q of mcqFile.questions) {
    assert(Array.isArray(q.options) && q.options.length === 4, `MCQ ${q.id}: options must contain exactly 4 entries`);
    assert(q.options.every((o) => typeof o === 'string' && o.trim() !== ''), `MCQ ${q.id}: options must be non-empty strings`);
    assert(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4,
      `MCQ ${q.id}: correctIndex must be an integer in [0,3]`);
  }
});

test('MCQ ids are unique and match browse questions', () => {
  const seen = new Set();
  for (const q of mcqFile.questions) {
    assert(!seen.has(q.id), `duplicate MCQ id: ${q.id}`);
    seen.add(q.id);
    assert(questionIds.has(q.id), `MCQ ${q.id} does not match a browse question`);
  }
});

test('every MCQ category is a known categories.json id', () => {
  const categoryIds = new Set(loadData('categories.json')?.categories.map((c) => c.id) || []);
  for (const q of mcqFile.questions) {
    assert(categoryIds.has(q.category), `MCQ ${q.id} references unknown category '${q.category}'`);
  }
});

test('distractors are not identical to the correct option', () => {
  for (const q of mcqFile.questions) {
    const correct = q.options[q.correctIndex];
    for (let i = 0; i < q.options.length; i++) {
      if (i === q.correctIndex) continue;
      assert(q.options[i] !== correct, `MCQ ${q.id}: option ${i} duplicates the correct answer`);
    }
  }
});

test('difficulty.json entries use valid levels', () => {
  assert(typeof difficultyFile?.version === 'string', 'difficulty.json missing version');
  const entries = difficultyFile.difficulties || {};
  assert(Object.keys(entries).length > 0, 'difficulty.json has no entries');
  for (const [id, level] of Object.entries(entries)) {
    assert(VALID_LEVELS.has(level), `difficulty for ${id} has invalid level '${level}'`);
  }
});

test('difficulty entries reference known question ids', () => {
  for (const id of Object.keys(difficultyFile.difficulties || {})) {
    assert(questionIds.has(id), `difficulty references unknown question '${id}'`);
  }
});

finish();