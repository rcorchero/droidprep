/**
 * DOM controller for the quiz page. Mounts after every navigation via
 * `astro:page-load` (the bundled module script runs once; the listener fires
 * on initial load and on each view-transition visit with fresh DOM).
 */

import {
  filterPool,
  pickQuestions,
  createSession,
  answer,
  isAnswered,
  isCorrect,
  isCorrectAnswer,
  score,
  type Question,
  type QuizSettings,
  type Session,
} from './quiz-engine';
import { inlineMarkdown } from './markdown';

export interface QuizDeps {
  questions: Question[];
  difficultyByQid: Record<string, string>;
  base: string;
}

const el = (id: string): HTMLElement | null => document.getElementById(id);

export function mountQuiz(deps: QuizDeps): void {
  const startBtn = el('quiz-start') as HTMLButtonElement | null;
  if (!startBtn || !deps.questions.length) return;

  const setup = el('quiz-setup')!;
  const sessionEl = el('quiz-session')!;
  const results = el('quiz-results')!;
  const nextBtn = el('quiz-next-btn') as HTMLButtonElement;
  const retryBtn = el('quiz-retry') as HTMLButtonElement;
  const homeBtn = el('quiz-home') as HTMLButtonElement;
  const countSlider = el('quiz-count') as HTMLInputElement;
  const countDisplay = el('quiz-count-display') as HTMLElement;
  const difficultySelect = el('quiz-difficulty') as HTMLSelectElement;
  const categorySelect = el('quiz-category') as HTMLSelectElement;
  const emptyHint = el('quiz-empty-hint') as HTMLElement;
  const progressFill = el('quiz-progress-fill') as HTMLElement;
  const progressText = el('quiz-progress-text') as HTMLElement;
  const questionEl = el('quiz-question') as HTMLElement;
  const optionsEl = el('quiz-options') as HTMLElement;
  const feedbackEl = el('quiz-feedback') as HTMLElement;

  let session: Session | null = null;

  countSlider.addEventListener('input', () => {
    countDisplay.textContent = countSlider.value + ' question' + (countSlider.value === '1' ? '' : 's');
  });

  function render(): void {
    const s = session!;
    const q = s.questions[s.current];
    const total = s.questions.length;

    progressFill.style.width = `${((s.current + 1) / total) * 100}%`;
    progressText.textContent = `${s.current + 1} / ${total}`;
    questionEl.textContent = q.question;

    optionsEl.innerHTML = '';
    s.orderCache[s.current].forEach((origIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.setAttribute('data-index', String(origIndex));

      btn.innerHTML =
        '<span class="option-radio" aria-hidden="true"><span class="option-radio-dot"></span></span>' +
        '<span class="option-text"></span>' +
        '<span class="option-mark" aria-hidden="true"></span>';
      const textSpan = btn.querySelector('.option-text');
      if (textSpan) textSpan.textContent = q.options[origIndex];

      btn.addEventListener('click', () => selectOption(q.id, origIndex));
      optionsEl.appendChild(btn);
    });

    if (isAnswered(s, q.id)) {
      const correct = isCorrectAnswer(q, s.answers[q.id]);
      feedbackEl.hidden = false;
      feedbackEl.innerHTML =
        '<span class="quiz-feedback-head">' + (correct ? 'Correct!' : 'Incorrect') + '</span> ' +
        inlineMarkdown(q.explanation || '');
      feedbackEl.style.background = correct ? 'rgba(61,220,132,0.12)' : 'rgba(255,82,82,0.12)';
      feedbackEl.style.color = correct ? 'var(--success)' : 'var(--error)';

      optionsEl.querySelectorAll('.quiz-option').forEach((b) => {
        const btn = b as HTMLElement;
        btn.classList.add('disabled');
        const idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
        const mark = btn.querySelector('.option-mark');
        if (idx === q.correctIndex) {
          btn.classList.add('correct');
          if (mark) mark.textContent = '\u2713';
        } else if (idx === s.answers[q.id]) {
          btn.classList.add('incorrect');
          if (mark) mark.textContent = '\u2717';
        }
      });

      nextBtn.textContent = s.current === total - 1 ? 'See Results' : 'Next';
    } else {
      feedbackEl.hidden = true;
      nextBtn.textContent = 'Next';
    }
  }

  function selectOption(qid: string, index: number): void {
    const s = session!;
    if (isAnswered(s, qid)) return;
    answer(s, qid, index);
    render();
  }

  function startQuiz(): void {
    const count = parseInt(countSlider.value, 10);
    const settings: QuizSettings = {
      count,
      difficulty: difficultySelect.value,
      category: categorySelect.value,
    };
    const pool = filterPool(deps.questions, deps.difficultyByQid, settings);
    emptyHint.hidden = pool.length > 0;
    if (!pool.length) return;

    session = createSession(pickQuestions(pool, count));
    setup.hidden = true;
    results.hidden = true;
    sessionEl.hidden = false;
    render();
  }

  function goNext(): void {
    const s = session!;
    if (!isAnswered(s, s.questions[s.current].id)) return;
    if (s.current < s.questions.length - 1) {
      s.current++;
      render();
    } else {
      showResults();
    }
  }

  function showResults(): void {
    const s = session!;
    sessionEl.hidden = true;
    results.hidden = false;

    const { total, correct, missedIds } = score(s);

    const reviewP = el('results-review')!;
    const reviewLink = el('results-review-link')!;
    if (missedIds.length > 0) {
      const basePath = (deps.base || '/').replace(/\/$/, '');
      reviewLink.setAttribute('href', basePath + '/browse?q=' + encodeURIComponent(missedIds.join(',')));
      if (reviewP) reviewP.hidden = false;
    } else if (reviewP) {
      reviewP.hidden = true;
    }

    const scoreEl = el('results-score');
    if (scoreEl) {
      const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
      scoreEl.innerHTML =
        '<span class="score-num">' + pct + '%</span>' +
        '<span class="score-detail">' + correct + ' of ' + total + ' correct</span>';
    }

    const breakdown = el('results-breakdown');
    if (breakdown) {
      breakdown.innerHTML = '';
      s.questions.forEach((q, i) => {
        const ok = isCorrect(s, q);
        const div = document.createElement('div');
        div.className = 'result-item' + (ok ? ' correct' : ' incorrect');
        const qSpan = document.createElement('span');
        qSpan.className = 'result-q';
        qSpan.textContent = `${i + 1}. ${q.question}`;
        const badge = document.createElement('span');
        badge.className = 'result-badge';
        badge.textContent = ok ? 'Correct' : 'Wrong';
        div.appendChild(qSpan);
        div.appendChild(badge);
        breakdown.appendChild(div);
      });
    }
  }

  startBtn.addEventListener('click', startQuiz);
  nextBtn.addEventListener('click', goNext);
  retryBtn.addEventListener('click', () => {
    results.hidden = true;
    setup.hidden = false;
  });
  homeBtn.addEventListener('click', () => {
    results.hidden = true;
    setup.hidden = false;
  });
}