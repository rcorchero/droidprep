/**
 * DOM controller for the browse page. Mounted after every navigation via
 * `astro:page-load` — the bundled module script runs once and the listener
 * re-initializes against fresh DOM on each view-transition visit.
 */

import { matchesFilters, type BrowseFilters, type CardMeta } from './browse-filters';
import { readBookmarks, writeBookmarks, toggleBookmark, type Bookmarks } from './bookmarks';

interface CardEntry {
  card: HTMLElement;
  meta: CardMeta;
}

export function mountBrowse(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const categoryFilter = document.getElementById('category-filter') as HTMLSelectElement | null;
  const difficultyFilter = document.getElementById('difficulty-filter') as HTMLSelectElement | null;
  const countDisplay = document.getElementById('count-display') as HTMLElement | null;
  const noResults = document.getElementById('no-results') as HTMLElement | null;
  const savedFilter = document.getElementById('saved-filter') as HTMLButtonElement | null;
  const savedCount = document.getElementById('saved-count') as HTMLElement | null;

  if (!searchInput || !categoryFilter || !difficultyFilter || !savedFilter) return;

  const bookmarks: Bookmarks = readBookmarks();
  let savedOnly = false;

  const entries: CardEntry[] = Array.from(document.querySelectorAll<HTMLElement>('.question-card')).map((card) => ({
    card,
    meta: {
      id: card.dataset.questionId || '',
      category: card.dataset.category || '',
      difficulty: card.dataset.difficulty || '',
      searchText: (card.dataset.searchText || '').toLowerCase(),
    },
  }));

  function toggleCard(card: HTMLElement): void {
    const btn = card.querySelector('.question-toggle');
    if (!btn) return;
    const answer = card.querySelector('.question-answer');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    // P3.12: keep the chevron's aria-expanded in sync (it used to go stale).
    card.querySelectorAll('.chevron, .question-toggle').forEach((node) => {
      node.setAttribute('aria-expanded', String(!expanded));
    });
    const stateEl = card.querySelector('.toggle-state');
    if (stateEl) stateEl.textContent = expanded ? 'Show answer' : 'Hide answer';
    answer?.toggleAttribute('hidden', expanded);
  }

  function updateSavedBadge(): void {
    const n = entries.filter(({ meta }) => !!bookmarks[meta.id]).length;
    if (savedCount) {
      savedCount.textContent = String(n);
      savedCount.hidden = savedOnly;
    }
  }

  function applyFilters(): void {
    const filters: BrowseFilters = {
      term: searchInput?.value || '',
      category: categoryFilter?.value || 'all',
      difficulty: difficultyFilter?.value || 'all',
      savedOnly,
    };
    const savedIds: Bookmarks | null = filters.savedOnly ? bookmarks : null;

    let visible = 0;
    entries.forEach(({ card, meta }) => {
      const show = matchesFilters(meta, filters, savedIds);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (countDisplay) {
      countDisplay.textContent = `${visible} question${visible !== 1 ? 's' : ''}`;
    }
    const msgEl = document.getElementById('no-results-msg');
    if (msgEl) {
      msgEl.textContent = savedOnly
        ? "You haven't saved any matching questions yet. Tap the bookmark on a question to save it here."
        : 'No questions match your search. Try different keywords.';
    }
    if (noResults) noResults.hidden = visible > 0;
    updateSavedBadge();
  }

  function setBookmarkButtonState(): void {
    document.querySelectorAll<HTMLElement>('.bookmark-btn').forEach((btn) => {
      const id = btn.dataset.bookmark;
      const saved = !!id && !!bookmarks[id];
      btn.classList.toggle('bookmarked', saved);
      btn.setAttribute('aria-pressed', String(saved));
      btn.setAttribute('aria-label', saved ? 'Unsave question' : 'Save question');
      const label = btn.querySelector('.bookmark-label');
      if (label) label.textContent = saved ? 'Saved' : 'Save';
    });
  }

  function updateBookmarkState(): void {
    setBookmarkButtonState();
    updateSavedBadge();
    if (savedOnly) applyFilters();
  }

  // Category preselected via ?category=
  const urlParams = new URLSearchParams(window.location.search);
  const urlCategory = urlParams.get('category');
  if (urlCategory && Array.from(categoryFilter.options).some((o) => o.value === urlCategory)) {
    categoryFilter.value = urlCategory;
  }

  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  difficultyFilter.addEventListener('change', applyFilters);
  savedFilter.addEventListener('click', () => {
    savedOnly = !savedOnly;
    savedFilter.setAttribute('aria-pressed', String(savedOnly));
    savedFilter.classList.toggle('active', savedOnly);
    updateBookmarkState();
    applyFilters();
  });

  // Expand / collapse questions.
  entries.forEach(({ card }) => {
    const btn = card.querySelector('.question-toggle');
    const chevron = card.querySelector('.chevron');
    if (btn) btn.addEventListener('click', () => toggleCard(card));
    if (chevron) {
      chevron.setAttribute('aria-expanded', 'false');
      chevron.addEventListener('click', () => toggleCard(card));
    }
  });

  // Copy-code buttons.
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pre = btn.parentElement?.querySelector('pre');
      const code = pre?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        const original = btn.textContent || '';
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      }).catch(() => {
        // Clipboard unavailable (non-secure context) — ignore.
      });
    });
  });

  // Bookmark buttons.
  const bookmarkButtons = Array.from(document.querySelectorAll<HTMLElement>('.bookmark-btn'));
  bookmarkButtons.forEach((btn) => {
    const id = btn.dataset.bookmark;
    const toggle = (): void => {
      if (!id) return;
      toggleBookmark(bookmarks, id);
      writeBookmarks(bookmarks);
      updateBookmarkState();
      applyFilters();
    };
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // Review-missed deep link: `?q=id1,id2`. Reset filters so the target cards
  // are visible, expand them, and scroll to the first one.
  const qParam = urlParams.get('q');
  if (qParam) {
    const targetIds = qParam.split(',').filter(Boolean);
    searchInput.value = '';
    categoryFilter.value = 'all';
    difficultyFilter.value = 'all';
    savedOnly = false;
    savedFilter.setAttribute('aria-pressed', 'false');
    savedFilter.classList.remove('active');
    applyFilters();

    const targets = targetIds
      .map((id) => entries.find((e) => e.meta.id === id))
      .filter((match): match is CardEntry => !!match);

    if (targets.length) {
      targets.forEach(({ card }) => {
        const btn = card.querySelector('.question-toggle');
        if (btn && btn.getAttribute('aria-expanded') !== 'true') {
          (btn as HTMLElement).click();
        }
      });
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      targets[0].card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }

  updateBookmarkState();
  applyFilters();
}