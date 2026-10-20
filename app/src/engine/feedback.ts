// Explained feedback: work out *why* a suffixed form is wrong, then fill the grammar point's
// feedback templates (content/grammar/*.yaml → `feedback`).

import type { Word } from '../content/types';
import { alterStem, inflect } from './morph';
import { endsInVowel, firstVowel, isFrontVowel, lastChar, lastVowel, trLower } from './turkish';

type SuffixTable = Record<string, { form: string }>;

export interface Diagnosis {
  codes: string[];
  vars: Record<string, string>;
}

/**
 * Diagnose a wrong form of a consonant-initial case suffix such as -DA / -DAn.
 * Returns null when the error is not one we can explain (the caller then just shows the answer).
 */
export function diagnoseForm(word: Word, suffixId: string, given: string, table: SuffixTable): Diagnosis | null {
  const expected = inflect(word, [suffixId], table);
  const lemma = trLower(word.lemma);
  const g = trLower(given).trim().replace(/[.!?]$/, '');
  const vars: Record<string, string> = {
    word: word.lemma,
    v: lastVowel(lemma) ?? '',
    c: lastChar(lemma),
    answer: expected,
    D: '',
  };
  if (g === expected) return { codes: [], vars };
  if (!expected.startsWith(lemma)) return null;
  const eSfx = expected.slice(lemma.length);
  vars.D = eSfx[0] ?? '';

  if (g.startsWith(lemma + ' ')) return { codes: ['detached'], vars };
  if (!g.startsWith(lemma)) {
    const altered = alterStem(lemma, { ...word, flags: [...(word.flags ?? []), 'soft'] }, true);
    return altered !== lemma && g.startsWith(altered) ? { codes: ['stem_changed'], vars } : null;
  }

  const gSfx = g.slice(lemma.length);
  if (gSfx.length !== eSfx.length) return null;

  const codes: string[] = [];
  if (gSfx[0] !== eSfx[0]) {
    if (eSfx[0] === 't') codes.push('voiceless');
    else codes.push(endsInVowel(lemma) ? 'after_vowel' : 'not_voiceless');
  }
  const eV = [...eSfx].find((c) => 'aeıioöuü'.includes(c));
  const gV = [...gSfx].find((c) => 'aeıioöuü'.includes(c));
  if (eV && gV && eV !== gV) {
    codes.push(isFrontVowel(eV) ? 'vowel_front' : 'vowel_back');
    const first = firstVowel(lemma);
    if (first && isFrontVowel(first) !== isFrontVowel(vars.v)) codes.push('last_not_first');
  }
  return codes.length ? { codes, vars } : null;
}

/** Fill `{placeholders}` in the grammar point's templates and join the messages. */
export function renderFeedback(d: Diagnosis, templates: Record<string, string> = {}): string {
  return d.codes
    .map((code) => templates[code])
    .filter(Boolean)
    .map((t) => t.replace(/\{(\w+)\}/g, (_, k) => d.vars[k] ?? `{${k}}`))
    .join(' ');
}
