import { content } from '../../content';
import { acceptedFor, gradeChoice, gradeTyped } from '../grade';

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
