// English shown after answering an exercise that has pictures: the picture is no longer the only
// clue to the meaning once the learner has answered.
//
// Sources, in order: the item's own `translation`, a course sentence with the same Turkish text,
// then a word-by-word gloss built from the lexicon and the suffix engine.

import { content } from '../content';
import type { Item } from '../content/types';
import { expandPattern, normalize } from '../engine/check';
import { inflect } from '../engine/morph';

const SINGLE = ['sfx.loc', 'sfx.abl', 'sfx.pl'];
const COPULA = ['sfx.cop_1sg', 'sfx.cop_2sg', 'sfx.cop_1pl', 'sfx.cop_2pl', 'sfx.cop_3pl'];

let sentenceIndex: Map<string, string> | undefined;
let formIndex: Map<string, string> | undefined;

function sentenceEn(tr: string): string | undefined {
  sentenceIndex ??= new Map(Object.values(content.sentences).map((s) => [normalize(s.tr), s.en[0]]));
  return sentenceIndex.get(normalize(tr));
}

/** Every known form (lemma, lemma + case/plural, lemma + case + "to be") → short English gloss. */
function forms(): Map<string, string> {
  if (formIndex) return formIndex;
  const m = new Map<string, string>();
  const gl = (id: string) => content.suffixes[id]?.gloss ?? '';
  for (const w of Object.values(content.lexicon)) {
    m.set(normalize(w.lemma), w.gloss[0]);
    if (w.pos !== 'noun') continue;
    const tryAdd = (sfx: string[], text: string) => {
      try {
        const f = normalize(inflect(w, sfx, content.suffixes));
        if (!m.has(f)) m.set(f, text);
      } catch {
        // some combinations aren't defined for this word (e.g. compound plurals without forms.pl)
      }
    };
    for (const s of SINGLE) {
      if (!content.suffixes[s]) continue;
      tryAdd([s], `${w.gloss[0]} (${gl(s)})`);
      if (s === 'sfx.pl') continue;
      for (const c of COPULA) if (content.suffixes[c]) tryAdd([s, c], `${w.gloss[0]} (${gl(s)}; ${gl(c)})`);
    }
  }
  formIndex = m;
  return m;
}

/** Word-by-word gloss, e.g. "kedi = cat · masada = table (in / at / on)". */
export function glossLine(tr: string): string | undefined {
  const parts = normalize(tr)
    .split(' ')
    .filter(Boolean)
    .map((t) => (forms().has(t) ? `${t} = ${forms().get(t)}` : undefined))
    .filter((p): p is string => !!p);
  return parts.length ? parts.join(' · ') : undefined;
}

/** English for a Turkish sentence or word: a course sentence if one matches, else a gloss. */
export function english(tr: string): string | undefined {
  return sentenceEn(tr) ?? glossLine(tr);
}

/** Longest expansion of an answer pattern = the full sentence ("Hayır, kitap yatakta."). */
const fullAnswer = (pattern: string) => expandPattern(pattern).sort((a, b) => b.length - a.length)[0];

const sentenceText = (id?: string) => (id ? content.sentences[id] : undefined);

export function hasPictures(item: Item): boolean {
  return !!item.images?.length || !!item.options?.some((o) => o.startsWith('img.'));
}

/**
 * The English to show after answering, or undefined when the exercise has no pictures
 * (or its English is already on screen).
 */
export function translationFor(item: Item): string | undefined {
  if (!hasPictures(item)) return undefined;
  if (item.translation) return item.translation;

  switch (item.type) {
    case 'listen_choose':
    case 'dictation':
    case 'translate_to_tr':
      return sentenceText(item.sentence)?.en[0];
    case 'picture_choose':
      return item.prompt && item.answer ? english(item.prompt.replace('…', item.answer)) : undefined;
    case 'qa': {
      const q = sentenceText(item.question);
      const a = item.answers?.[0] ? english(fullAnswer(item.answers[0])) : undefined;
      return [q && `Q: ${q.en[0]}`, a && `A: ${a}`].filter(Boolean).join('\n') || undefined;
    }
    case 'mini_dialogue':
      return (item.turns ?? [])
        .map((t) => {
          const en = t.sentence ? sentenceText(t.sentence)?.en[0] : t.answers?.[0] ? english(fullAnswer(t.answers[0])) : undefined;
          return en ? `${t.speaker}: ${en}` : undefined;
        })
        .filter(Boolean)
        .join('\n') || undefined;
    case 'pick_suffix': {
      const w = item.base ? content.lexicon[item.base] : undefined;
      return w && item.answer ? glossLine(w.lemma + item.answer) : undefined;
    }
    case 'type_form':
      return item.answer ? glossLine(item.answer) : undefined;
    case 'word_recall': {
      const w = item.base ? content.lexicon[item.base] : undefined;
      return w ? `${w.lemma} = ${w.gloss.join(', ')}` : undefined;
    }
    default:
      // meaning_choice: the answer already is the English
      return undefined;
  }
}

/** Show a sentence ID as its Turkish text (contrast_pair options and answers). */
export const displayAnswer = (value?: string) => (value && content.sentences[value]?.tr) || value;
