import { content } from '../../content';
import type { Item } from '../../content/types';
import { acceptedFor, gradeChoice, gradeTyped, suffixChains } from '../grade';

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
