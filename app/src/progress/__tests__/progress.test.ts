import { State } from 'ts-fsrs';
import { content, word } from '../../content';
import type { Item } from '../../content/types';
import { inflect } from '../../engine/morph';
import { buildReview, endingVariants, knownWords, matchesFilter } from '../../review/build';
import { acceptedFor, gradeChoice, gradeTyped } from '../../session/grade';
import {
  cardsForReview, completeLessonSession, completeReview, emptyProgress, lessonWords, MAX_NEW_PER_DAY, MAX_NEW_PER_REVIEW, newCardBudget,
  type SessionResult,
} from '../model';

const L10 = content.lessons.L10;
const DAY = 86_400_000;
const t0 = new Date('2026-10-20T09:00:00');
const at = (days: number) => new Date(t0.getTime() + days * DAY);

/** Deterministic RNG (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const allCorrect = (items: Item[]): SessionResult[] => items.map((item) => ({ item, status: 'correct' }));

describe('lesson completion', () => {
  const p = completeLessonSession(emptyProgress(), 'L10', 'learn', allCorrect(L10.sessions.learn.items), t0);

  it('marks the lesson learned and starts a streak', () => {
    expect(p.lessons.L10.learnedAt).toBe(t0.toISOString());
    expect(p.streak).toBe(1);
  });

  it('creates one card per review pattern, rated by the session', () => {
    for (const pat of content.grammar['g.L10.loc'].patterns!) expect(p.cards[pat.id]?.kind).toBe('pattern');
    // patterns exercised in the Learn session were rated → no longer New
    expect(p.cards['g.L10.loc.voiceless'].fsrs.state).not.toBe(State.New);
    // last_vowel is only exercised in Practise
    expect(p.cards['g.L10.loc.last_vowel'].fsrs.state).toBe(State.New);
  });

  it('creates word cards for lesson words and unlocked packs, but not names', () => {
    expect(lessonWords('L10')).toEqual(expect.arrayContaining(['w.kedi', 'w.burada', 'w.kanepe', 'w.ayna']));
    expect(lessonWords('L10')).not.toContain('w.Ali');
    expect(p.cards['w.kedi']?.kind).toBe('word');
  });

  it('a wrong answer makes the pattern due sooner than a correct one', () => {
    const wrong = completeLessonSession(emptyProgress(), 'L10', 'learn',
      L10.sessions.learn.items.map((item) => ({ item, status: item.pattern === 'g.L10.loc.voiceless' ? 'wrong' : 'correct' })), t0);
    expect(new Date(wrong.cards['g.L10.loc.voiceless'].fsrs.due).getTime())
      .toBeLessThanOrEqual(new Date(p.cards['g.L10.loc.voiceless'].fsrs.due).getTime());
  });

  it('streak continues the next day and resets after a gap', () => {
    const d1 = completeLessonSession(p, 'L10', 'practise', [], at(1));
    expect(d1.streak).toBe(2);
    expect(completeLessonSession(d1, 'L10', 'practise', [], at(4)).streak).toBe(1);
  });
});

describe('review selection', () => {
  const p = completeLessonSession(emptyProgress(), 'L10', 'practise', allCorrect(L10.sessions.practise.items), t0);

  it('limits new cards per review', () => {
    const fresh = cardsForReview(p, t0).filter((c) => c.fsrs.state === State.New);
    expect(fresh.length).toBeLessThanOrEqual(MAX_NEW_PER_REVIEW);
  });

  it('caps new cards per day, and resets the next day', () => {
    let q = p;
    for (let i = 0; i < 5; i++) {
      const s = buildReview(q, cardsForReview(q, t0), seeded(i));
      q = completeReview(q, allCorrect(s.items), s.cardFor, t0);
    }
    expect(q.newIntroduced).toEqual({ day: '2026-10-20', count: MAX_NEW_PER_DAY });
    expect(cardsForReview(q, t0).filter((c) => c.fsrs.state === State.New)).toHaveLength(0);
    expect(newCardBudget(q, at(1))).toBe(MAX_NEW_PER_REVIEW);
  });

  it('brings rated patterns back once due', () => {
    const later = cardsForReview(p, at(30)).map((c) => c.id);
    expect(later).toEqual(expect.arrayContaining(['g.L10.loc.voiceless']));
  });

  it('rating a review card pushes it into the future', () => {
    const cards = cardsForReview(p, at(30));
    const session = buildReview(p, cards, seeded(1));
    const after = completeReview(p, allCorrect(session.items), session.cardFor, at(30));
    const card = after.cards['g.L10.loc.voiceless'];
    expect(new Date(card.fsrs.due).getTime()).toBeGreaterThan(at(30).getTime());
  });
});

describe('review items', () => {
  const p = completeLessonSession(emptyProgress(), 'L10', 'practise', allCorrect(L10.sessions.practise.items), t0);
  const known = knownWords(p);

  it('expands ending variants', () => {
    expect(endingVariants('DA').sort()).toEqual(['da', 'de', 'ta', 'te']);
    expect(endingVariants('(y)I').sort()).toEqual(['i', 'u', 'ü', 'ı'].sort());
  });

  it('filters words by pattern', () => {
    const voiceless = known.filter((w) => matchesFilter(w, { pos: 'noun', ends_with: 'voiceless' })).map((w) => w.lemma);
    expect(voiceless).toEqual(expect.arrayContaining(['kitap', 'dolap']));
    expect(voiceless).not.toContain('masa');
    const differs = known.filter((w) => matchesFilter(w, { pos: 'noun', last_vowel_differs_from_first: true })).map((w) => w.lemma);
    expect(differs).toContain('otobüs');
  });

  it.each([1, 2, 3, 4, 5])('every generated item is answerable with its own answer (seed %i)', (seed) => {
    const session = buildReview(p, cardsForReview(p, at(30)), seeded(seed));
    expect(session.items.length).toBeGreaterThan(0);
    for (const item of session.items) {
      if (item.type === 'pick_suffix' || item.type === 'meaning_choice') {
        expect(item.options).toContain(item.answer);
        expect(new Set(item.options).size).toBe(item.options!.length);
        expect(gradeChoice(item, item.answer!).status).toBe('correct');
        if (item.type === 'pick_suffix') {
          expect(word(item.base!).lemma + item.answer).toBe(inflect(word(item.base!), [item.suffix!], content.suffixes));
        }
      } else {
        const { accepted, lang } = acceptedFor(item);
        const answer = item.type === 'type_form' ? item.answer! : accepted[0];
        expect(gradeTyped(item, answer, accepted, lang).status).toBe('correct');
      }
    }
  });

  it('mature pattern cards switch to typing', () => {
    let q = p;
    for (let d = 1; d <= 400; d *= 3) {
      const s = buildReview(q, cardsForReview(q, at(d)), seeded(d));
      q = completeReview(q, allCorrect(s.items), s.cardFor, at(d));
    }
    const s = buildReview(q, [q.cards['g.L10.loc.voiceless']], seeded(9));
    expect(s.items[0].type).toBe('type_form');
  });
});

describe('review items for suffix-chain patterns (L11, L12)', () => {
  let p = emptyProgress();
  for (const l of ['L10', 'L11', 'L12']) {
    for (const s of ['learn', 'practise'] as const) {
      p = completeLessonSession(p, l, s, allCorrect(content.lessons[l].sessions[s].items), t0);
    }
  }
  const chainCards = ['g.L11.loc_copula.back_1sg', 'g.L11.loc_copula.front_2sg', 'g.L11.loc_copula.voiceless_1pl', 'g.L11.loc_copula.plural_2pl'];

  it.each(chainCards)('%s: a typed form with the whole chain, graded and explained', (id) => {
    expect(p.cards[id]?.kind).toBe('pattern');
    for (const seed of [1, 2, 3]) {
      const [item] = buildReview(p, [p.cards[id]], seeded(seed)).items;
      expect(item.type).toBe('type_form');
      expect(item.suffixes!.length).toBe(2);
      expect(item.answer).toBe(inflect(word(item.base!), item.suffixes!, content.suffixes));
      const { accepted, lang } = acceptedFor(item);
      expect(gradeTyped(item, item.answer!, accepted, lang).status).toBe('correct');
    }
  });

  it('explains a wrong d/t in a reviewed chain', () => {
    const [item] = buildReview(p, [p.cards['g.L11.loc_copula.voiceless_1pl']], seeded(1)).items;
    const { accepted, lang } = acceptedFor(item);
    const wrong = item.answer!.replace(/t(a|e)y/, 'd$1y');
    expect(gradeTyped(item, wrong, accepted, lang).message).toContain('Fıstıkçı Şahap');
  });

  // names aren't word cards (lessonWords), so name patterns have no word to draw
  it.each(['g.L11.loc_copula.name', 'g.L12.abl.origin'])('%s: no item without a known name', (id) => {
    expect(buildReview(p, [p.cards[id]], seeded(1)).items).toEqual([]);
  });
});
