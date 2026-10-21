// Form engine: realises suffixes written in archiphoneme notation (CURRICULUM.md §2)
// on a lexicon word, using the word's flags (VOCABULARY.md §5).
//   A → a/e   I → ı/i/u/ü   D → d/t   C → c/ç   K → k (ğ before a vowel)
//   (y) (n) (s) → only after a vowel   (I) → only after a consonant
// Proper nouns (pos: name) take an apostrophe before the first suffix: İstanbul'da, Ahmet'te.
// Verbs are inflected from their stem (gelmek → gel); -(I)yor raises a stem-final a/e (bekle → bekliyor).

import type { Word } from '../content/types';
import {
  countVowels, endsInVowel, isFrontVowel, lastChar, lastVowel, trLower, VOICELESS, VOWELS,
} from './turkish';

type SuffixTable = Record<string, { form: string }>;

/** Lexicon `forms` keys that can override a whole first suffix. */
const FORM_KEYS: Record<string, string> = {
  'sfx.acc': 'acc', 'sfx.gen': 'gen', 'sfx.dat': 'dat', 'sfx.loc': 'loc', 'sfx.pl': 'pl', 'sfx.poss_3sg': 'poss3',
  'sfx.imp_pol': 'imp_pol', 'sfx.prog': 'prog', 'sfx.fut': 'fut',
};
const CASES = new Set(['sfx.acc', 'sfx.dat', 'sfx.loc', 'sfx.abl']);
const POSS3 = new Set(['sfx.poss_3sg', 'sfx.poss_3pl']);
const POSS = new Set([...POSS3, 'sfx.poss_1sg', 'sfx.poss_2sg', 'sfx.poss_1pl', 'sfx.poss_2pl']);
/** Written as a separate word (but still harmonises). */
const SEPARATE = new Set(['sfx.q']);
/** Make a new word, so a proper noun takes no apostrophe: İstanbullu, Ankaralıyım. */
const DERIVATION = new Set(['sfx.li', 'sfx.siz', 'sfx.ci']);
/** Pronouns with a pronominal n before case endings: ondan, buna, şunu. */
const PRONOMINAL_N = new Set(['o', 'bu', 'şu']);
/** Pronouns that take -(y)lA on the genitive: benimle, onunla, kiminle (but onlarla, neyle). */
const GENITIVE_INS = new Set(['ben', 'sen', 'o', 'biz', 'siz', 'bu', 'şu', 'kim']);

/** The form suffixes attach to: the lexicon `stem`, or a verb's infinitive minus -mAk. */
export function stemOf(word: Word): string {
  if (word.stem) return word.stem;
  return word.pos === 'verb' ? word.lemma.replace(/m[ae]k$/, '') : word.lemma;
}

const FRONT_OF: Record<string, string> = { a: 'e', ı: 'i', o: 'ö', u: 'ü' };
const FOUR_WAY: Record<string, string> = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' };
const SOFTEN: Record<string, string> = { p: 'b', ç: 'c', t: 'd', k: 'ğ' };

const lastWord = (s: string) => s.slice(s.lastIndexOf(' ') + 1);

/**
 * Consonant changes before a vowel-initial suffix:
 * vowel drop (oğul → oğl), doubling (hak → hakk), softening (kitap → kitab, renk → reng).
 */
export function alterStem(stem: string, word: Word, isLemma: boolean): string {
  if (!isLemma) {
    // suffix-final K, e.g. -(y)AcAK: gelecek + im → geleceğim
    return /(acak|ecek)$/.test(stem) ? stem.slice(0, -1) + 'ğ' : stem;
  }
  const flags = word.flags ?? [];
  let s = stem;
  if (flags.includes('drop')) {
    const low = trLower(s);
    for (let i = low.length - 1; i >= 0; i--) {
      if (VOWELS.includes(low[i])) { s = s.slice(0, i) + s.slice(i + 1); break; }
    }
    return s;
  }
  if (flags.includes('double')) return s + s.slice(-1);
  if (flags.includes('nosoft') || flags.includes('compound')) return s;
  const last = lastChar(s);
  // verbs only soften when flagged (gitmek → gidiyor, but bırakmak → bırakıyor)
  const byDefault = word.pos !== 'verb' && countVowels(lastWord(s)) >= 2 && 'pçk'.includes(last);
  if (SOFTEN[last] && (flags.includes('soft') || byDefault)) {
    const prev = trLower(s).slice(-2, -1);
    return s.slice(0, -1) + (last === 'k' && prev === 'n' ? 'g' : SOFTEN[last]);
  }
  return s;
}

/** The vowel that drives harmony for the next suffix vowel. */
function harmonyVowel(s: string, frontWord: boolean): string {
  const v = lastVowel(s) ?? 'e';
  return frontWord && FRONT_OF[v] ? FRONT_OF[v] : v;
}

/** Realise one suffix form (already stripped of buffers) after `stem`. */
function realise(stem: string, form: string, frontWord: boolean): string {
  let out = '';
  for (const ch of form) {
    const ctx = stem + out;
    // the front flag only affects the first suffix vowel; later ones follow that vowel
    const front = frontWord && lastVowel(out) === undefined;
    switch (ch) {
      case 'A': out += isFrontVowel(harmonyVowel(ctx, front)) ? 'e' : 'a'; break;
      case 'I': out += FOUR_WAY[harmonyVowel(ctx, front)]; break;
      case 'D': out += VOICELESS.includes(lastChar(ctx)) ? 't' : 'd'; break;
      case 'C': out += VOICELESS.includes(lastChar(ctx)) ? 'ç' : 'c'; break;
      case 'K': out += 'k'; break;
      default: out += ch;
    }
  }
  return out;
}

/**
 * Inflect `word` with a chain of suffix IDs, e.g. inflect(ev, ['sfx.pl', 'sfx.loc']) → "evlerde".
 */
export function inflect(word: Word, suffixIds: string[], table: SuffixTable): string {
  const flags = word.flags ?? [];
  const pron = word.pos === 'pron' ? word.lemma : '';
  let s = stemOf(word);
  let isLemma = true;
  let afterPoss3 = flags.includes('compound') || PRONOMINAL_N.has(pron);

  suffixIds.forEach((id, i) => {
    const override = i === 0 && FORM_KEYS[id] ? word.forms?.[FORM_KEYS[id]] : undefined;
    if (override) {
      s = override;
      isLemma = false;
      afterPoss3 = POSS3.has(id) || (id === 'sfx.pl' && flags.includes('compound'));
      return;
    }
    if (id === 'sfx.pl' && isLemma && flags.includes('compound')) {
      throw new Error(`${word.id}: compound plural needs an explicit forms.pl`);
    }
    const suffix = table[id];
    if (!suffix) throw new Error(`Unknown suffix ${id}`);

    if (isLemma && id === 'sfx.ins' && GENITIVE_INS.has(pron)) {
      s = inflect(word, ['sfx.gen'], table);
      isLemma = false;
    }
    // a possessive replaces a compound's own -(s)I: yatak odası → yatak oda·m
    if (isLemma && afterPoss3 && flags.includes('compound') && POSS.has(id)) {
      s = s.slice(0, /[aeıioöuü]s[ıiuü]$/.test(s) ? -2 : -1);
      afterPoss3 = false;
    }

    let form = suffix.form.replace(/\(Iz\)$/, '');
    // pronominal n after a 3rd-person possessive: evi·n·de, buzdolabı·n·ı
    if (afterPoss3 && CASES.has(id)) form = 'n' + form.replace(/^\(y\)/, '');
    if (isLemma && id === 'sfx.pl' && PRONOMINAL_N.has(pron)) form = 'n' + form; // o·n·lar, bu·n·lar

    // su behaves as suy before an ending that could start with a vowel: suyum, suyun, suyu
    const beforeVowel = isLemma ? word.forms?.before_vowel : undefined;
    if (beforeVowel && /^(\([ynsI]\)|[AIaeıioöuü])/.test(form)) s = beforeVowel;

    // -(I)yor raises a final a/e, harmonising with the vowel before it: bekle → bekli, oyna → oynu, gelme → gelmi
    if (id === 'sfx.prog' && /[ae]$/.test(s)) {
      const prev = s.slice(0, -1);
      s = prev + FOUR_WAY[lastVowel(prev) ?? lastChar(s)];
    }

    const buffer = /^\((y|n|s|I)\)(.*)$/.exec(form);
    if (buffer) {
      const [, b, rest] = buffer;
      const keep = b === 'I' ? !endsInVowel(s) : endsInVowel(s);
      form = (keep ? b : '') + rest;
    }

    const separate = SEPARATE.has(id);
    // proper nouns: apostrophe before the first ending, and the name itself never changes
    const name = isLemma && !separate && !DERIVATION.has(id) && word.pos === 'name';
    if (!separate && !name && /^[AIaeıioöuü]/.test(form)) s = alterStem(s, word, isLemma);

    const frontWord = isLemma && flags.includes('front');
    s += (separate ? ' ' : name ? "'" : '') + realise(s, form, frontWord);
    isLemma = false;
    afterPoss3 = POSS3.has(id);
  });
  return s;
}
