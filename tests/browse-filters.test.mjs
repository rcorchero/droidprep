import { matchesFilters } from '../src/lib/browse-filters.ts';
import { readBookmarks, toggleBookmark } from '../src/lib/bookmarks.ts';
import { loadData, test, assert, finish } from './helpers.mjs';

const meta = (over = {}) => ({
  id: 'q1',
  category: 'kotlin',
  difficulty: 'intermediate',
  searchText: 'hot and cold flows coroutine channels backpressure',
  ...over,
});

const baseFilters = { term: '', category: 'all', difficulty: 'all', savedOnly: false };

test('search term filters by case-insensitive substring', () => {
  assert(matchesFilters(meta(), { ...baseFilters, term: 'COROUTINE' }, null), 'uppercase term should match');
  assert(!matchesFilters(meta(), { ...baseFilters, term: 'lifecycle' }, null), 'no match expected');
});

test('category and difficulty filters', () => {
  const f = { ...baseFilters, category: 'kotlin', difficulty: 'intermediate' };
  assert(matchesFilters(meta(), f, null), 'should match kotlin/intermediate');
  assert(!matchesFilters(meta({ category: 'networking' }), f, null), 'category mismatch');
  assert(!matchesFilters(meta({ difficulty: 'senior' }), f, null), 'difficulty mismatch');
});

test('savedOnly requires the id in the saved set', () => {
  const f = { ...baseFilters, savedOnly: true };
  assert(matchesFilters(meta(), f, { q1: true }), 'saved id should match');
  assert(!matchesFilters(meta(), f, { q2: true }), 'unsaved id should not match');
  assert(!matchesFilters(meta(), f, null), 'savedOnly with no set should not match');
});

test('all filters combine', () => {
  const f = { term: 'coroutine', category: 'kotlin', difficulty: 'intermediate', savedOnly: true };
  assert(matchesFilters(meta(), f, { q1: true }), 'combined match expected');
  assert(!matchesFilters(meta({ searchText: 'lifecycle' }), f, { q1: true }), 'term should fail');
});

test('toggleBookmark flips state and mutates the map', () => {
  const map = {};
  assert(toggleBookmark(map, 'q1') === true, 'first toggle saves');
  assert(map.q1 === true, 'saved flag stored');
  assert(toggleBookmark(map, 'q1') === false, 'second toggle unsaves');
  assert(!('q1' in map), 'entry removed');
});

test('readBookmarks degrades gracefully without localStorage', () => {
  assert(typeof readBookmarks() === 'object', 'should return an object');
});

test('real data: every question carries searchable text', () => {
  const q = loadData('questions.json');
  for (const item of q?.questions || []) {
    const text = [item.question, item.answer, item.categoryLabel].join(' ').toLowerCase();
    assert(text.trim().length > 0, `question ${item.id} has empty search text`);
  }
});

finish();