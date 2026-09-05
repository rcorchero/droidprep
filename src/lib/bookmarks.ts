/**
 * Bookmarks persistence. Keeps the original `bookmarks` localStorage key so
 * saved questions survive the refactor. Erasable TypeScript; the only browser
 * dependency is `localStorage`, which tests can stub.
 */

export type Bookmarks = Record<string, unknown>;

const STORAGE_KEY = 'bookmarks';

export function readBookmarks(): Bookmarks {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Bookmarks) || {};
  } catch {
    return {};
  }
}

export function writeBookmarks(bookmarks: Bookmarks): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // Storage full or unavailable — keep the in-memory state.
  }
}

/** Toggle one bookmark. Returns the new state (true = saved). */
export function toggleBookmark(bookmarks: Bookmarks, id: string): boolean {
  if (bookmarks[id]) {
    delete bookmarks[id];
    return false;
  }
  bookmarks[id] = true;
  return true;
}