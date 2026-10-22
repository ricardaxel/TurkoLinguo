import { allItems, content } from '../../content';
import type { Item } from '../../content/types';
import { acceptedFor, explicitFeedback, gradeChoice, gradeTyped, suffixChains } from '../grade';

const items = Object.fromEntries(
  [...content.lessons.L10.sessions.learn.items, ...content.lessons.L10.sessions.practise.items].map((i) => [i.id, i]),
);
const typed = (id: string, given: string) => {
  const { accepted, lang } = acceptedFor(items[id]);
  return gradeTyped(items[id], given, accepted, lang);
};

describe('L10 grading', () => {
  it('pick_suffix: explains a wrong vowel', () => {
    const r = gradeChoice(items['L10.learn.02'], 'da');
    expect(r.status).toBe('wrong');
    expect(r.message).toContain('front vowel');
    expect(r.expected).toBe('evde');
  });

  it('picture_choose: explains masata', () => {
    const r = gradeChoice(items['L10.learn.05'], 'masata');
    expect(r.message).toContain('ends in a vowel');
  });

  it('type_form: explains mutfakda', () => {
    expect(typed('L10.practise.03', 'mutfakda').message).toContain('Fıstıkçı Şahap');
  });

  it('type_form: almost for a missing accent', () => {
    const r = typed('L10.practise.04', 'sutte');
    expect(r.status).toBe('almost');
    expect(r.message).toContain('**ü**, not u');
  });

  it('qa: accepts the short answer and explains a wrong ending in a sentence', () => {
    expect(typed('L10.practise.11', 'yatakta').status).toBe('correct');
    expect(typed('L10.practise.11', 'Hayır, kitap yatakda.').message).toContain('Fıstıkçı Şahap');
  });

  it('qa: explains a detached ending', () => {
    expect(typed('L10.practise.13', 'oda da').message).toContain('attached');
  });

  it('translate_to_en: accepts listed variants', () => {
    expect(typed('L10.practise.08', 'There are 2 cats in the garden').status).toBe('correct');
  });

  it('dictation: is strict about ı', () => {
    expect(typed('L10.practise.12', 'Dolapta süt var mi?').status).toBe('almost');
  });
});

describe('hand-written feedback maps', () => {
  const all = Object.fromEntries(
    allItems().map((i) => [i.id, i]),
  );
  const grade = (id: string, given: string) => {
    const { accepted, lang } = acceptedFor(all[id]);
    return gradeTyped(all[id], given, accepted, lang);
  };

  it('multiple choice shows the message written for the chosen option', () => {
    const item = all['L12.learn.05'];
    const map = item.feedback as Record<string, string>;
    expect(gradeChoice(item, "Londra'dayım").message).toBe(map["Londra'dayım"]);
  });

  it('typed answers find their message regardless of case and punctuation', () => {
    const item = all['L6.learn.04'];
    const map = item.feedback as Record<string, string>;
    expect(grade('L6.learn.04', 'ben öğretmenim değil.').message).toBe(map['Ben öğretmenim değil']);
    expect(grade('L6.learn.04', 'BEN ÖĞRETMENİM DEĞİL').message).toBe(map['Ben öğretmenim değil']);
  });

  it('but never across letters (kir is not kır)', () => {
    const item = { ...all['L6.learn.04'], feedback: { kır: 'x' } };
    expect(explicitFeedback(item, 'kir')).toBeUndefined();
    expect(explicitFeedback(item, 'KIR')).toBe('x');
  });

  it('every map key is a wrong answer (a key equal to an accepted answer would never show)', () => {
    const shadowed: string[] = [];
    for (const item of Object.values(all)) {
      if (!item.feedback || typeof item.feedback !== 'object') continue;
      for (const key of Object.keys(item.feedback)) {
        const ok = item.options
          ? key === item.answer
          : item.type === 'build_word'
            ? key === item.answer
            : (() => { const { accepted, lang } = acceptedFor(item); return accepted.length > 0 && gradeTyped(item, key, accepted, lang).status === 'correct'; })();
        if (ok) shadowed.push(`${item.id}: "${key}"`);
      }
    }
    expect(shadowed).toEqual([]);
  });
});

describe('L11–L12 grading: suffix chains and names', () => {
  const all = Object.fromEntries(
    ['L11', 'L12'].flatMap((l) => [...content.lessons[l].sessions.learn.items, ...content.lessons[l].sessions.practise.items]).map((i) => [i.id, i]),
  );
  const grade = (item: Item, given: string) => {
    const { accepted, lang } = acceptedFor(item);
    return gradeTyped(item, given, accepted, lang);
  };
  const typeForm = (grammar: string, answer: string): Item => ({ id: 'test', type: 'type_form', grammar: [grammar], answer });

  it('suffixChains: case + copula chains from the item grammar', () => {
    const chains = suffixChains(all['L12.practise.12']).map((c) => c.join('+'));
    expect(chains).toEqual(expect.arrayContaining(['sfx.abl', 'sfx.abl+sfx.cop_1sg', 'sfx.abl+sfx.cop_1pl']));
  });

  it('type_form: explains parkdayım and Ankaradayım', () => {
    expect(grade(typeForm('g.L11.loc_copula', 'parktayım'), 'parkdayım').message).toContain('Fıstıkçı Şahap');
    expect(grade(typeForm('g.L11.loc_copula', "Ankara'dayım"), 'Ankaradayım').message).toContain('apostrophe');
  });

  it('type_form: explains a chain error not in the item feedback map', () => {
    const r = grade(all['L11.practise.02'], 'parkdaız');
    expect(r.message).toContain('Fıstıkçı Şahap');
    expect(r.message).toContain('buffer **y**');
  });

  it('type_form: the explicit feedback map still wins', () => {
    const map = all['L11.practise.02'].feedback as Record<string, string>;
    expect(grade(all['L11.practise.02'], 'parktaız').message).toBe(map['parktaız']);
  });

  it('picture_choose: explains the wrong options', () => {
    expect(gradeChoice(all['L11.learn.03'], 'parkdayım').message).toContain('Fıstıkçı Şahap');
    expect(gradeChoice(all['L11.learn.03'], 'parktayim').message).toContain('follows the vowel of **-DA**');
  });

  it('qa: explains a missing buffer y in a sentence', () => {
    expect(grade(all['L11.practise.10'], 'Hayır, evdeim.').message).toContain('buffer **y**: **evdeyim**');
  });

  it('dictation: explains a missing apostrophe', () => {
    expect(grade(all['L11.practise.11'], 'İzmirde misin?').message).toContain("**İzmir** is a name");
  });

  it('qa: explains -DA for -DAn and a missing apostrophe on a name', () => {
    expect(grade(all['L12.practise.12'], "Hayır, Türkiye'deyim.").message).toContain('*from* is **-DAn**');
    expect(grade(all['L12.practise.12'], 'Hayır, Türkiyedenim.').message).toContain('apostrophe');
  });
});

describe('spoken variants (CURRICULUM_A2.md §1.1)', () => {
  const item: Item = {
    id: 'X.test.01', type: 'translate_to_tr', grammar: ['g.L33.future'], typed: true,
    spoken: ['{Gelicem|Gelcem}.', '(Ben) yarın gelicem.'],
  };
  const grade = (given: string) => gradeTyped(item, given, ['(Ben) yarın geleceğim.', 'Geleceğim.'], 'tr');

  it('grades a spoken form as almost, with the written form', () => {
    const r = grade('gelicem');
    expect(r.status).toBe('almost');
    expect(r.message).toBe("That's how it's said; in writing: **Geleceğim.**");
    expect(r.expected).toBe('Geleceğim.');
  });

  it('expands spoken patterns and picks the closest written answer', () => {
    const r = grade('Ben yarın gelicem!');
    expect(r.status).toBe('almost');
    expect(r.expected).toBe('Ben yarın geleceğim.');
  });

  it('still accepts the written form and rejects other answers', () => {
    expect(grade('yarın geleceğim').status).toBe('correct');
    expect(grade('gelirim').status).toBe('wrong');
  });

  it('is off without spoken variants', () => {
    expect(gradeTyped({ ...item, spoken: undefined }, 'gelicem', ['Geleceğim.']).status).toBe('wrong');
  });

  it('takes the variants of a dialogue blank', () => {
    const r = gradeTyped(item, 'napıyosun', ['Ne yapıyorsun?'], 'tr', ['Napıyosun?']);
    expect(r).toEqual({ status: 'almost', message: "That's how it's said; in writing: **Ne yapıyorsun?**", expected: 'Ne yapıyorsun?' });
  });

  it('lets a grammar point override the message', () => {
    const g = content.grammar['g.L33.future'];
    const saved = g.feedback;
    g.feedback = { ...saved, spoken: 'Spoken Turkish! Written: {answer}' };
    try {
      expect(grade('gelcem').message).toBe('Spoken Turkish! Written: Geleceğim.');
    } finally {
      g.feedback = saved;
    }
  });
});
