/**
 * Pure browse-filter logic — no DOM access. Erasable TypeScript so tests can
 * import it directly under Node.
 */

export interface CardMeta {
  id: string;
  category: string;
  difficulty: string;
  /** Pre-lowercased concatenation of question/answer/topics for search. */
  searchText: string;
}

export interface BrowseFilters {
  term: string;
  category: string;
  difficulty: string;
  savedOnly: boolean;
}

export function matchesFilters(
  meta: CardMeta,
  filters: BrowseFilters,
  savedIds: Readonly<Record<string, unknown>> | null
): boolean {
  const term = filters.term.trim().toLowerCase();
  const okSearch = !term || meta.searchText.includes(term);
  const okCategory = filters.category === 'all' || meta.category === filters.category;
  const okDifficulty = filters.difficulty === 'all' || meta.difficulty === filters.difficulty;
  const okSaved = !filters.savedOnly || (savedIds != null && !!savedIds[meta.id]);
  return okSearch && okCategory && okDifficulty && okSaved;
}