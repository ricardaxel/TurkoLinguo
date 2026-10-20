// Build a review session from due cards.
//   pattern card → choose/type the ending on a word the learner knows, drawn fresh each time
//   word card    → meaning check (TR → EN, multiple choice) while young, then recall (EN → TR, typed)

import { State } from 'ts-fsrs';
import { content } from '../content';
import type { Item, Pattern, Word } from '../content/types';
import { inflect } from '../engine/morph';
import { endsInVowel, endsInVoiceless, firstVowel, isFrontVowel, lastVowel } from '../engine/turkish';
import type { Progress, ReviewCard } from '../progress/model';

export type Rng = () => number;

const pick = <T>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Every surface form of an archiphoneme ending, e.g. DA → da de ta te. */
export function endingVariants(form: string): string[] {
  const sets: Record<string, string[]> = { A: ['a', 'e'], I: ['ı', 'i', 'u', 'ü'], D: ['d', 't'], C: ['c', 'ç'] };
  const core = form.replace(/^\([^)]*\)/, '');
  return [...core].reduce<string[]>(
    (acc, ch) => acc.flatMap((prefix) => (sets[ch] ?? [ch]).map((c) => prefix + c)),
    [''],
  );
}

export function matchesFilter(w: Word, f: Record<string, unknown> = {}): boolean {
  const v = lastVowel(w.lemma);
  if (f.pos && w.pos !== f.pos) return false;
  if (w.lemma.includes(' ') || (w.flags ?? []).some((x) => x === 'compound' || x === 'irr')) return false;
  if (f.last_vowel && (!v || (isFrontVowel(v) ? 'front' : 'back') !== f.last_vowel)) return false;
  if (f.ends_with === 'vowel' && !endsInVowel(w.lemma)) return false;
  if (f.ends_with === 'voiceless' && !endsInVoiceless(w.lemma)) return false;
  if (f.ends_with === 'voiced_consonant' && (endsInVowel(w.lemma) || endsInVoiceless(w.lemma))) return false;
  if (f.last_vowel_differs_from_first) {
    const first = firstVowel(w.lemma);
    if (!first || !v || isFrontVowel(first) === isFrontVowel(v)) return false;
  }
  if (Array.isArray(f.flags) && !f.flags.every((fl) => (w.flags ?? []).includes(fl))) return false;
  return true;
}

function findPattern(id: string): { pattern: Pattern; grammarId: string } | undefined {
  for (const g of Object.values(content.grammar)) {
    const p = g.patterns?.find((x) => x.id === id);
    if (p) return { pattern: p, grammarId: g.id };
  }
  return undefined;
}

const isYoung = (c: ReviewCard) => c.fsrs.state !== State.Review || c.fsrs.reps < 3;

function patternItem(card: ReviewCard, known: Word[], rng: Rng): Item | undefined {
  const found = findPattern(card.id);
  if (!found?.pattern.suffix) return undefined;
  const { pattern, grammarId } = found;
  const suffixId = pattern.suffix!;
  const candidates = known.filter((w) => matchesFilter(w, pattern.word_filter));
  if (!candidates.length) return undefined;
  const w = pick(candidates, rng);
  const form = inflect(w, [suffixId], content.suffixes);
  const base = { id: `R.${card.id}`, grammar: [grammarId], pattern: card.id, feedback: `auto:${grammarId}`, base: w.id, images: w.images };

  if (isYoung(card) && form.startsWith(w.lemma)) {
    const answer = form.slice(w.lemma.length);
    const variants = endingVariants(content.suffixes[suffixId].form);
    const others = shuffle(variants.filter((v) => v !== answer), rng).slice(0, 3);
    return { ...base, type: 'pick_suffix', suffix: suffixId, options: shuffle([answer, ...others], rng), answer };
  }
  return {
    ...base,
    type: 'type_form',
    suffixes: [suffixId],
    prompt: `${w.gloss[0]} (${content.suffixes[suffixId].gloss})`,
    answer: form,
  };
}

function wordItem(card: ReviewCard, known: Word[], rng: Rng): Item | undefined {
  const w = content.lexicon[card.id];
  if (!w) return undefined;
  const base = { id: `R.${card.id}`, grammar: [] as string[], images: w.images, audio: w.audio ? [w.audio] : undefined };
  if (isYoung(card) || card.fsrs.reps < 2) {
    const distractors = shuffle(
      known.filter((k) => k.id !== w.id && k.gloss[0] !== w.gloss[0]).map((k) => k.gloss[0]),
      rng,
    ).slice(0, 3);
    if (distractors.length < 2) return undefined;
    return { ...base, type: 'meaning_choice', base: w.id, options: shuffle([w.gloss[0], ...distractors], rng), answer: w.gloss[0] };
  }
  return { ...base, type: 'word_recall', base: w.id, prompt: w.gloss.join(' / '), answers: [w.lemma] };
}

/** Known words = every word card the learner has, in the lexicon. */
export function knownWords(p: Progress): Word[] {
  return Object.values(p.cards)
    .filter((c) => c.kind === 'word' && content.lexicon[c.id])
    .map((c) => content.lexicon[c.id]);
}

export interface ReviewSession {
  items: Item[];
  /** item ID → card ID, for rating */
  cardFor: Record<string, string>;
}

export function buildReview(p: Progress, cards: ReviewCard[], rng: Rng = Math.random): ReviewSession {
  const known = knownWords(p);
  const items: Item[] = [];
  const cardFor: Record<string, string> = {};
  for (const card of cards) {
    const item = card.kind === 'pattern' ? patternItem(card, known, rng) : wordItem(card, known, rng);
    if (!item) continue;
    items.push(item);
    cardFor[item.id] = card.id;
  }
  return { items: shuffle(items, rng), cardFor };
}
