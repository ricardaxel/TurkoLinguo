// Grading: turns a learner's raw answer into a result with explained feedback.
// Pure functions (no React), so they can be unit-tested.

import { content, word } from '../content';
import type { Item } from '../content/types';
import { checkTyped, normalize, type Status } from '../engine/check';
import { diagnoseForm, renderFeedback } from '../engine/feedback';
import { inflect } from '../engine/morph';

export interface ItemResult {
  status: Status;
  /** Markdown-inline explanation. */
  message?: string;
  /** The correct answer, shown when not correct. */
  expected?: string;
}

const T = content.suffixes;

function templates(item: Item) {
  const auto = typeof item.feedback === 'string' && item.feedback.startsWith('auto:') ? item.feedback.slice(5) : item.grammar[0];
  return content.grammar[auto]?.feedback ?? {};
}

/**
 * Suffix chains an item's grammar points can produce: each suffix alone, each pattern's chain,
 * and each case suffix followed by a "to be" ending (evdeyim, Londra'danım).
 */
export function suffixChains(item: Item): string[][] {
  const points = item.grammar.map((g) => content.grammar[g]).filter(Boolean);
  const ids = [...new Set(points.flatMap((g) => g.suffixes ?? []))];
  const cases = ids.filter((id) => T[id]?.slot === 'case');
  const copulas = Object.values(T).filter((s) => s.slot === 'copula').map((s) => s.id);
  const chains = [
    ...ids.map((id) => [id]),
    ...points.flatMap((g) => g.patterns ?? []).map((p) => p.suffixes ?? (p.suffix ? [p.suffix] : [])),
    ...cases.flatMap((c) => copulas.map((cop) => [c, cop])),
  ].filter((c) => c.length);
  return [...new Map(chains.map((c) => [c.join('+'), c])).values()];
}

/**
 * Explain a wrong word form: find a known noun or name whose inflection (with one of the item's
 * suffix chains) is the expected token, then diagnose the given token against it.
 */
export function explainToken(item: Item, expected: string, given: string): string | undefined {
  const tpl = templates(item);
  const chains = suffixChains(item);
  const exp = normalize(expected);
  for (const w of Object.values(content.lexicon)) {
    if (w.pos !== 'noun' && w.pos !== 'name') continue;
    for (const chain of chains) {
      let form: string;
      try { form = inflect(w, chain, T); } catch { continue; }
      if (normalize(form) !== exp) continue;
      const d = diagnoseForm(w, chain, given, T);
      if (d && d.codes.length) return renderFeedback(d, tpl) || undefined;
    }
  }
  return undefined;
}

/** Explain the first differing word between a typed sentence and the expected one. */
function explainSentence(item: Item, expected: string, given: string): string | undefined {
  const e = normalize(expected).split(' ');
  const g = normalize(given).split(' ');
  if (g.length === e.length + 1) {
    // detached ending: "masa da" for "masada"
    for (let i = 0; i < e.length; i++) {
      if (g[i] + g[i + 1] === e[i]) return explainToken(item, e[i], `${g[i]} ${g[i + 1]}`);
    }
  }
  if (g.length !== e.length) return undefined;
  const i = e.findIndex((t, k) => t !== g[k]);
  return i >= 0 ? explainToken(item, e[i], g[i]) : undefined;
}

const DEFAULT_ACCENT = 'Almost! **{expected_letter}**, not {given_letter}: **{answer}**.';

/** Grade a typed (or assembled) answer against accepted answers. */
export function gradeTyped(item: Item, given: string, accepted: string[], lang: 'tr' | 'en' = 'tr'): ItemResult {
  const r = checkTyped(given, accepted, lang);
  if (r.status === 'correct') return { status: 'correct' };
  if (r.status === 'almost' && r.accent) {
    const message = (templates(item).accent ?? DEFAULT_ACCENT)
      .replace('{expected_letter}', r.accent.expected)
      .replace('{given_letter}', r.accent.given)
      .replace('{answer}', r.expected);
    return { status: 'almost', message, expected: r.expected };
  }
  const explicit = typeof item.feedback === 'object' ? item.feedback[given] : undefined;
  const message = explicit ?? (lang === 'tr' ? explainSentence(item, r.expected, given) : undefined);
  return { status: 'wrong', message, expected: r.expected };
}

/** Grade a multiple-choice answer. */
export function gradeChoice(item: Item, chosen: string): ItemResult {
  if (chosen === item.answer) return { status: 'correct' };
  let message: string | undefined;
  if (item.type === 'pick_suffix' && item.base && item.suffix) {
    const w = word(item.base);
    const d = diagnoseForm(w, item.suffix, w.lemma + chosen, T);
    if (d) message = renderFeedback(d, templates(item));
  } else if (item.type !== 'meaning_choice' && item.answer && !item.answer.startsWith('img.')) {
    message = explainToken(item, item.answer, chosen);
  }
  const expected = item.type === 'pick_suffix' ? `${word(item.base!).lemma}${item.answer}` : item.answer;
  return { status: 'wrong', message, expected: expected?.startsWith('img.') ? undefined : expected };
}

/** Accepted answers for each typed item type. */
export function acceptedFor(item: Item): { accepted: string[]; lang: 'tr' | 'en' } {
  const s = item.sentence ? content.sentences[item.sentence] : undefined;
  switch (item.type) {
    case 'translate_to_en':
      return { accepted: [...(s?.en ?? []), ...(item.answers ?? [])], lang: 'en' };
    case 'translate_to_tr':
    case 'dictation':
      return { accepted: [s!.tr, ...(item.answers ?? [])], lang: 'tr' };
    case 'type_form':
    case 'spot_error':
      return { accepted: [item.answer!], lang: 'tr' };
    default:
      return { accepted: item.answers ?? [], lang: 'tr' };
  }
}
