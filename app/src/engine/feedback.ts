// Explained feedback: work out *why* a suffixed form is wrong, then fill the grammar point's
// feedback templates (content/grammar/*.yaml → `feedback`).

import type { Word } from '../content/types';
import { alterStem, inflect, stemOf } from './morph';
import { endsInVowel, firstVowel, isFrontVowel, lastChar, lastVowel, trLower } from './turkish';

type SuffixTable = Record<string, { form: string; slot?: string }>;

export interface Diagnosis {
  codes: string[];
  vars: Record<string, string>;
}

const HARMONY: Record<string, string[]> = { A: ['a', 'e'], I: ['ı', 'i', 'u', 'ü'], D: ['d', 't'] };

const clean = (s: string) => trLower(s).trim().replace(/[.!?]$/, '').replace(/[’‘`]/g, "'");
const noApostrophe = (s: string) => s.replace(/'/g, '');

/** One way of writing a suffix, with the error codes that writing it this way implies. */
interface Variant {
  text: string;
  codes: string[];
}

/**
 * Every plausible way of writing suffix `id` after `prefix` (what the learner wrote so far),
 * given its correct form `right` there: the other d/t and vowel choices, and the buffer y
 * added or left out.
 */
function variants(id: string, prefix: string, right: string, first: boolean, lemma: string, table: SuffixTable): Variant[] {
  const { form, slot } = table[id];
  const buffered = form.startsWith('(y)');
  const core = form.replace(/^\([^)]*\)/, '').replace(/\(Iz\)$/, '');
  // pronominal n or buffer letters in front of the core; give up on forms the engine overrode
  if (right.length < core.length) return [{ text: right, codes: [] }];
  const head = right.slice(0, right.length - core.length);
  const body = right.slice(head.length);

  const heads: Variant[] = [{ text: head, codes: [] }];
  if (buffered && head === 'y') heads.push({ text: '', codes: ['no_buffer'] });
  if (buffered && head === '') heads.push({ text: 'y', codes: ['buffer_after_n'] });

  let bodies: Variant[] = [{ text: '', codes: [] }];
  [...core].forEach((ch, k) => {
    const want = body[k];
    const choices = HARMONY[ch]?.includes(want) ? HARMONY[ch] : [want];
    bodies = bodies.flatMap((b) => choices.map((c) => {
      if (c === want) return { ...b, text: b.text + c };
      const codes = [...b.codes];
      if (ch === 'D') {
        codes.push(want === 't' ? 'voiceless' : endsInVowel(prefix) ? 'after_vowel' : 'not_voiceless');
      } else if (slot === 'copula') {
        codes.push('person_harmony');
      } else if (isFrontVowel(c) === isFrontVowel(want)) {
        codes.push('vowel_round');
      } else {
        codes.push(isFrontVowel(want) ? 'vowel_front' : 'vowel_back');
        const f = firstVowel(lemma);
        const v = lastVowel(prefix) ?? '';
        if (first && f && isFrontVowel(f) !== isFrontVowel(v)) codes.push('last_not_first');
      }
      return { text: b.text + c, codes };
    }));
  });

  return heads.flatMap((h) => bodies.map((b) => ({ text: h.text + b.text, codes: [...h.codes, ...b.codes] })));
}

/** Stand-in word for "what the learner has written so far", so the engine can add the next suffix. */
const asWord = (word: Word, lemma: string): Word => ({ ...word, lemma, stem: undefined, pos: 'noun', flags: ['nosoft'], forms: undefined });

/**
 * Diagnose a wrong form of a word with a chain of suffixes whose first one is consonant-initial,
 * e.g. -DA, -DAn, -DA + -(y)Im (evdeyim), name + -DAn + -Im (Londra'danım).
 * Later suffixes are judged against what the learner actually wrote before them, so a wrong
 * -DA vowel isn't also blamed on the person ending that correctly follows it.
 * Returns null when the error is not one we can explain (the caller then just shows the answer).
 */
export function diagnoseForm(word: Word, suffixIds: string | string[], given: string, table: SuffixTable): Diagnosis | null {
  const ids = typeof suffixIds === 'string' ? [suffixIds] : suffixIds;
  const expected = inflect(word, ids, table);
  const stem = stemOf(word);
  const lemma = trLower(stem);
  const g = clean(given);
  const vars: Record<string, string> = {
    word: stem,
    v: lastVowel(lemma) ?? '',
    c: lastChar(lemma),
    answer: expected,
    D: '',
  };
  if (g === trLower(expected)) return { codes: [], vars };
  const exp = noApostrophe(trLower(expected));
  if (!exp.startsWith(lemma)) return null;
  const firstForm = noApostrophe(trLower(inflect(word, ids.slice(0, 1), table)));
  vars.D = firstForm.slice(lemma.length).match(/[dt]/)?.[0] ?? '';

  if (g.startsWith(lemma + ' ') || g.startsWith(lemma + "' ")) return { codes: ['detached'], vars };
  if (!g.startsWith(lemma)) {
    const altered = alterStem(lemma, { ...word, flags: [...(word.flags ?? []), 'soft'] }, true);
    return altered !== lemma && g.startsWith(altered) ? { codes: ['stem_changed'], vars } : null;
  }

  const codes: string[] = [];
  if (word.pos === 'name' && !g.startsWith(lemma + "'")) codes.push('apostrophe');
  const gw = noApostrophe(g);

  // whole-form mix-ups: -DA for -DAn (Londra'dayım for Londra'danım), person before location
  const alternatives: [string[], string][] = [];
  if (ids[0] === 'sfx.abl') alternatives.push([['sfx.loc', ...ids.slice(1)], 'loc_for_abl']);
  if (ids.length === 2) alternatives.push([[ids[1], ids[0]], 'order']);
  for (const [chain, code] of alternatives) {
    try {
      if (noApostrophe(trLower(inflect(word, chain, table))) === gw) return { codes: [...codes, code], vars };
    } catch { /* not a form the engine can build */ }
  }

  // match the suffixes one by one, keeping the explanation with the fewest codes
  // (a later case suffix such as ev·ler·de is explained with the stem it follows: "evler")
  type Match = { codes: string[]; vars?: Record<string, string> };
  let best: Match | undefined;
  const walk = (i: number, prefix: string, acc: Match) => {
    if (i === ids.length) {
      if (prefix === gw && (!best || acc.codes.length < best.codes.length)) best = acc;
      return;
    }
    let right: string;
    try {
      right = i === 0 ? firstForm.slice(lemma.length) : trLower(inflect(asWord(word, prefix), [ids[i]], table)).slice(prefix.length);
    } catch { return; }
    for (const v of variants(ids[i], prefix, right, i === 0, lemma, table)) {
      if (!gw.startsWith(v.text, prefix.length)) continue;
      const names = i > 0 && v.codes.length && table[ids[i]].slot !== 'copula' && !acc.vars;
      walk(i + 1, prefix + v.text, {
        codes: [...acc.codes, ...v.codes],
        vars: names
          ? { word: stem + prefix.slice(lemma.length), v: lastVowel(prefix) ?? '', c: lastChar(prefix), D: right.match(/[dt]/)?.[0] ?? '' }
          : acc.vars,
      });
    }
  };
  walk(0, lemma, { codes: [] });
  if (!best) return null;
  const found: Match = best;
  const all = [...new Set([...codes, ...found.codes])];
  return all.length ? { codes: all, vars: { ...vars, ...found.vars } } : null;
}

/** Fill `{placeholders}` in the grammar point's templates and join the messages. */
export function renderFeedback(d: Diagnosis, templates: Record<string, string> = {}): string {
  return d.codes
    .map((code) => templates[code])
    .filter(Boolean)
    .map((t) => t.replace(/\{(\w+)\}/g, (_, k) => d.vars[k] ?? `{${k}}`))
    .join(' ');
}
