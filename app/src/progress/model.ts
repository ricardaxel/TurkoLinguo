// Learner progress and spaced-repetition cards (FSRS via ts-fsrs). Pure functions: no storage, no React.
//
// Two kinds of review cards (CURRICULUM.md §1.6):
//   pattern — a grammar sub-rule (e.g. g.L10.loc.voiceless); each review draws a NEW known word
//   word    — a vocabulary item met in a lesson or an unlocked theme pack

import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';
import { content } from '../content';
import type { Item } from '../content/types';
import type { Status } from '../engine/check';

export type CardKind = 'pattern' | 'word';

/** A stored card: ts-fsrs Card with dates as ISO strings (JSON-safe). */
export type StoredFsrs = Omit<Card, 'due' | 'last_review'> & { due: string; last_review?: string };

export interface ReviewCard {
  id: string; // = ref (pattern ID or word ID)
  kind: CardKind;
  fsrs: StoredFsrs;
}

export interface LessonProgress {
  learnedAt?: string;
  practisedAt?: string;
  bestPractise?: number; // share of correct answers, 0–1
}

export interface Progress {
  version: 1;
  lessons: Record<string, LessonProgress>;
  cards: Record<string, ReviewCard>;
  streak: number;
  lastActiveDay?: string; // YYYY-MM-DD, local time
  /** New cards introduced in reviews, per day (daily cap). */
  newIntroduced?: { day: string; count: number };
}

export const emptyProgress = (): Progress => ({ version: 1, lessons: {}, cards: {}, streak: 0 });

export interface SessionResult {
  item: Item;
  status: Status;
}

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }));

const GRADE: Record<Status, Grade> = { correct: Rating.Good, almost: Rating.Hard, wrong: Rating.Again };

const toStored = (c: Card): StoredFsrs => ({
  ...c,
  due: c.due.toISOString(),
  last_review: c.last_review ? c.last_review.toISOString() : undefined,
});

const fromStored = (c: StoredFsrs): Card => ({
  ...c,
  due: new Date(c.due),
  last_review: c.last_review ? new Date(c.last_review) : undefined,
});

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function newCard(id: string, kind: CardKind, now: Date): ReviewCard {
  return { id, kind, fsrs: toStored(createEmptyCard(now)) };
}

export function rateCard(card: ReviewCard, status: Status, now: Date): ReviewCard {
  const { card: next } = scheduler.next(fromStored(card.fsrs), now, GRADE[status]);
  return { ...card, fsrs: toStored(next) };
}

/** Words a lesson makes reviewable: its new words, the words of its sentences, and packs unlocked before it. */
export function lessonWords(lessonId: string): string[] {
  const lesson = content.lessons[lessonId];
  const order = content.course.units.flatMap((u) => u.lessons);
  const pos = order.indexOf(lessonId);
  const ids = new Set<string>(lesson.new_words ?? []);
  const items = [...lesson.sessions.learn.items, ...lesson.sessions.practise.items];
  const sentenceIds = [
    ...lesson.sessions.learn.cards.flatMap((c) => c.sentences ?? []),
    ...items.flatMap((i) => [i.sentence, i.question, ...(i.turns ?? []).map((t) => t.sentence)]),
  ].filter((s): s is string => !!s);
  sentenceIds.forEach((s) => content.sentences[s]?.words.forEach((w) => ids.add(w)));
  items.forEach((i) => i.base && ids.add(i.base));
  for (const pack of Object.values(content.packs) as { packs: { unlock_after: string; words: string[] }[] }[]) {
    for (const p of pack.packs) if (order.indexOf(p.unlock_after) < pos) p.words.forEach((w) => ids.add(w));
  }
  return [...ids].filter((w) => content.lexicon[w] && content.lexicon[w].pos !== 'name');
}

/** Worst status per key (one rating per card per session). */
function worstBy(results: SessionResult[], key: (r: SessionResult) => string | undefined) {
  const rank: Record<Status, number> = { correct: 0, almost: 1, wrong: 2 };
  const out = new Map<string, Status>();
  for (const r of results) {
    const k = key(r);
    if (!k) continue;
    const prev = out.get(k);
    if (!prev || rank[r.status] > rank[prev]) out.set(k, r.status);
  }
  return out;
}

function touchStreak(p: Progress, now: Date): Pick<Progress, 'streak' | 'lastActiveDay'> {
  const today = dayKey(now);
  if (p.lastActiveDay === today) return { streak: p.streak, lastActiveDay: today };
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  return { streak: p.lastActiveDay === yesterday ? p.streak + 1 : 1, lastActiveDay: today };
}

/** Record a finished lesson session: lesson status, new cards, and pattern ratings. */
export function completeLessonSession(
  p: Progress, lessonId: string, session: 'learn' | 'practise', results: SessionResult[], now: Date,
): Progress {
  const lesson = content.lessons[lessonId];
  const cards = { ...p.cards };

  for (const pat of content.grammar[lesson.grammar]?.patterns ?? []) {
    cards[pat.id] ??= newCard(pat.id, 'pattern', now);
  }
  for (const w of lessonWords(lessonId)) cards[w] ??= newCard(w, 'word', now);

  worstBy(results, (r) => r.item.pattern).forEach((status, patternId) => {
    if (cards[patternId]) cards[patternId] = rateCard(cards[patternId], status, now);
  });

  const prev = p.lessons[lessonId] ?? {};
  const share = results.length ? results.filter((r) => r.status === 'correct').length / results.length : 0;
  const lp: LessonProgress =
    session === 'learn'
      ? { ...prev, learnedAt: prev.learnedAt ?? now.toISOString() }
      : { ...prev, practisedAt: now.toISOString(), bestPractise: Math.max(prev.bestPractise ?? 0, share) };

  return { ...p, cards, lessons: { ...p.lessons, [lessonId]: lp }, ...touchStreak(p, now) };
}

/** Record a finished review session. `cardFor` maps item IDs to card IDs. */
export function completeReview(p: Progress, results: SessionResult[], cardFor: Record<string, string>, now: Date): Progress {
  const cards = { ...p.cards };
  let introduced = 0;
  worstBy(results, (r) => cardFor[r.item.id]).forEach((status, cardId) => {
    if (!cards[cardId]) return;
    if (cards[cardId].fsrs.state === State.New) introduced += 1;
    cards[cardId] = rateCard(cards[cardId], status, now);
  });
  const today = dayKey(now);
  const newIntroduced = { day: today, count: introducedToday(p, now) + introduced };
  return { ...p, cards, newIntroduced, ...touchStreak(p, now) };
}

export const MAX_REVIEW_ITEMS = 12;
export const MAX_NEW_PER_REVIEW = 5;
export const MAX_NEW_PER_DAY = 10;

const introducedToday = (p: Progress, now: Date) =>
  p.newIntroduced?.day === dayKey(now) ? p.newIntroduced.count : 0;

/** How many new cards the next review may introduce. */
export const newCardBudget = (p: Progress, now: Date) =>
  Math.max(0, Math.min(MAX_NEW_PER_REVIEW, MAX_NEW_PER_DAY - introducedToday(p, now)));

/** Cards for the next review: due ones first (most overdue first), then a few new ones (daily cap). */
export function cardsForReview(p: Progress, now: Date): ReviewCard[] {
  const all = Object.values(p.cards);
  const due = all
    .filter((c) => c.fsrs.state !== State.New && new Date(c.fsrs.due) <= now)
    .sort((a, b) => a.fsrs.due.localeCompare(b.fsrs.due));
  const fresh = all.filter((c) => c.fsrs.state === State.New).slice(0, newCardBudget(p, now));
  return [...due, ...fresh].slice(0, MAX_REVIEW_ITEMS);
}

export function dueCount(p: Progress, now: Date): number {
  return cardsForReview(p, now).length;
}

/** When the next non-new card becomes due (for "come back at …"). */
export function nextDue(p: Progress): Date | undefined {
  const dates = Object.values(p.cards)
    .filter((c) => c.fsrs.state !== State.New)
    .map((c) => new Date(c.fsrs.due));
  return dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined;
}
