/**
 * Pure quiz logic — no DOM access. Kept erasable-only TypeScript so tests can
 * import it directly under Node without a build step.
 */

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  category: string;
}

export interface QuizSettings {
  count: number;
  difficulty: string;
  category: string;
}

/** Writable session state owned by the quiz app. */
export interface Session {
  questions: Question[];
  answers: Record<string, number>;
  answered: Record<string, boolean>;
  /** One shuffled display order per question, cached at session start. */
  orderCache: number[][];
  current: number;
}

export type Rng = () => number;

export function isCorrectAnswer(q: Question, selectedIndex: number): boolean {
  return q.correctIndex === selectedIndex;
}

/** Fisher–Yates shuffle over a copy. */
export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function shuffledIndexOrder(length: number, rng: Rng = Math.random): number[] {
  const order: number[] = [];
  for (let i = 0; i < length; i++) order.push(i);
  return shuffle(order, rng);
}

/** Filter a pool by difficulty + category (both "all" pass everything). */
export function filterPool(
  pool: Question[],
  difficultyByQid: Record<string, string>,
  settings: QuizSettings
): Question[] {
  return pool.filter((q) => {
    const okLevel = settings.difficulty === 'all' || difficultyByQid[q.id] === settings.difficulty;
    const okCategory = settings.category === 'all' || q.category === settings.category;
    return okLevel && okCategory;
  });
}

/** Randomly pick a shuffled subset of `count` questions. */
export function pickQuestions(pool: Question[], count: number, rng: Rng = Math.random): Question[] {
  return shuffle(pool, rng).slice(0, count);
}

export function createSession(questions: Question[], rng: Rng = Math.random): Session {
  return {
    questions,
    answers: {},
    answered: {},
    orderCache: questions.map((q) => shuffledIndexOrder(q.options.length, rng)),
    current: 0,
  };
}

export function isAnswered(session: Session, qid: string): boolean {
  return !!session.answered[qid];
}

export function isCorrect(session: Session, q: Question): boolean {
  return isAnswered(session, q.id) && isCorrectAnswer(q, session.answers[q.id]);
}

/** Record a selection. Returns true if the selection was correct. */
export function answer(session: Session, qid: string, index: number): boolean {
  if (isAnswered(session, qid)) {
    return isCorrectAnswer(session.questions.find((q) => q.id === qid)!, session.answers[qid]);
  }
  session.answered[qid] = true;
  session.answers[qid] = index;
  const q = session.questions.find((x) => x.id === qid);
  return q ? isCorrectAnswer(q, index) : false;
}

/** Summary used to render the results screen. */
export function score(session: Session): { total: number; correct: number; missedIds: string[] } {
  let correct = 0;
  const missedIds: string[] = [];
  for (const q of session.questions) {
    if (isCorrect(session, q)) {
      correct++;
    } else {
      missedIds.push(q.id);
    }
  }
  return { total: session.questions.length, correct, missedIds };
}