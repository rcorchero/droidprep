import {
  shuffle,
  shuffledIndexOrder,
  filterPool,
  pickQuestions,
  createSession,
  answer,
  isCorrectAnswer,
  score,
} from '../src/lib/quiz-engine.ts';
import { loadData, test, assert, finish } from './helpers.mjs';

const fixture = () => [
  { id: 'a', question: 'q1', options: ['A1', 'A2', 'A3', 'A4'], correctIndex: 0, category: 'kotlin' },
  { id: 'b', question: 'q2', options: ['B1', 'B2', 'B3', 'B4'], correctIndex: 1, category: 'kotlin' },
  { id: 'c', question: 'q3', options: ['C1', 'C2', 'C3', 'C4'], correctIndex: 3, category: 'networking' },
  { id: 'd', question: 'q4', options: ['D1', 'D2', 'D3', 'D4'], correctIndex: 0, category: 'networking' },
];

test('shuffle preserves the multiset of elements', () => {
  const src = [1, 2, 3, 4, 5];
  const expected = [...src].sort((x, y) => x - y).join(',');
  for (let i = 0; i < 200; i++) {
    const out = shuffle(src, () => 0.5);
    assert(out.length === src.length, 'length changed');
    assert([...out].sort((x, y) => x - y).join(',') === expected, 'elements changed');
  }
});

test('shuffledIndexOrder is a permutation of 0..n-1', () => {
  for (let i = 0; i < 200; i++) {
    const order = shuffledIndexOrder(4, () => 0.5);
    assert([...order].sort((a, b) => a - b).join(',') === '0,1,2,3', `not a permutation: ${order}`);
  }
});

test('filterPool filters by difficulty', () => {
  const diff = { a: 'basic', b: 'senior', c: 'intermediate', d: 'basic' };
  const basic = filterPool(fixture(), diff, { count: 2, difficulty: 'basic', category: 'all' });
  assert(JSON.stringify(basic.map((q) => q.id).sort()) === JSON.stringify(['a', 'd']), 'basic filter wrong');
  const senior = filterPool(fixture(), diff, { count: 2, difficulty: 'senior', category: 'all' });
  assert(JSON.stringify(senior.map((q) => q.id)) === JSON.stringify(['b']), 'senior filter wrong');
});

test('filterPool filters by category', () => {
  const kotlin = filterPool(fixture(), {}, { count: 2, difficulty: 'all', category: 'kotlin' });
  assert(JSON.stringify(kotlin.map((q) => q.id).sort()) === JSON.stringify(['a', 'b']), 'category filter wrong');
});

test('filterPool unknown difficulty level matches nothing', () => {
  const out = filterPool(fixture(), {}, { count: 1, difficulty: 'basic', category: 'all' });
  assert(out.length === 0, 'questions without a mapped difficulty must not match');
});

test('pickQuestions returns a distinct subset of requested size', () => {
  const pool = fixture();
  const picked = pickQuestions(pool, 2, () => 0);
  assert(picked.length === 2, 'wrong size');
  assert(new Set(picked.map((q) => q.id)).size === 2, 'duplicate question picked');
  for (const q of picked) assert(pool.includes(q), 'picked outside pool');
});

test('createSession + answer + score produce correct results', () => {
  const session = createSession(fixture(), () => 0);
  assert(session.current === 0, 'starts at index 0');
  assert(session.orderCache.length === 4, 'one order per question');
  assert(session.orderCache.every((o) => o.length === 4), 'not all option orders are length 4');

  assert(answer(session, 'a', 0) === true, 'answer a should be correct');
  assert(answer(session, 'b', 0) === false, 'answer b should be wrong');
  assert(answer(session, 'c', 3) === true, 'answer c should be correct');
  assert(session.answers.b === 0, 'answer not recorded');

  const { total, correct, missedIds } = score(session);
  assert(total === 4, 'total wrong');
  assert(correct === 2, 'correct count wrong');
  assert(missedIds.includes('b') && missedIds.includes('d'), 'missed ids wrong');
});

test('isCorrectAnswer compares against correctIndex', () => {
  const q = fixture()[0];
  assert(isCorrectAnswer(q, 0), 'index 0 should be correct');
  assert(!isCorrectAnswer(q, 2), 'index 2 should be wrong');
});

test('score marks unanswered questions as missed', () => {
  const session = createSession(fixture(), () => 0);
  answer(session, 'a', 0);
  const { correct, missedIds } = score(session);
  assert(correct === 1, 'only answered-correct counts');
  assert(missedIds.length === 3, 'unanswered should count as missed');
});

test('real data: every MCQ has a mapped difficulty', () => {
  const mcq = loadData('mcq.json');
  const diff = loadData('difficulty.json')?.difficulties || {};
  for (const q of mcq?.questions || []) {
    assert(['basic', 'intermediate', 'senior'].includes(diff[q.id]), `MCQ ${q.id} has no difficulty`);
  }
});

test('real data: every category yields a non-empty quiz pool', () => {
  const mcq = loadData('mcq.json');
  const diff = loadData('difficulty.json')?.difficulties || {};
  const pool = (mcq?.questions || []).map((q) => ({ ...q })).flatMap((q) => [q]);
  for (const c of loadData('categories.json')?.categories || []) {
    const out = filterPool(pool, diff, { count: 20, difficulty: 'all', category: c.id });
    assert(out.length > 0, `category ${c.id} has no questions`);
  }
});

finish();