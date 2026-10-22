import { allItems, content } from '../../content';
import type { Item } from '../../content/types';
import { displayAnswer, english, glossLine, hasPictures, translationFor } from '../translation';

const items: Item[] = allItems();
const byId = Object.fromEntries(items.map((i) => [i.id, i]));

describe('translation after answering', () => {
  it('every lesson item with pictures gets an English translation', () => {
    const missing = items.filter((i) => hasPictures(i) && !translationFor(i)).map((i) => i.id);
    expect(missing).toEqual([]);
  });

  it('items without pictures get none', () => {
    expect(translationFor(byId['L10.learn.01'])).toBeUndefined();
    expect(translationFor(byId['L10.practise.03'])).toBeUndefined();
  });

  it('uses the authored translation first', () => {
    expect(translationFor(byId['L10.learn.05'])).toBe('The cat is on the table.');
  });

  it('listen_choose uses its sentence', () => {
    expect(translationFor(byId['L10.learn.06'])).toBe('The phone is in the bag.');
  });

  it('qa shows question and full answer', () => {
    expect(translationFor(byId['L10.practise.11'])).toBe('Q: Is the book in the bag?\nA: No, the book is on the bed.');
  });

  it('mini_dialogue translates every turn', () => {
    expect(translationFor(byId['L10.practise.14'])).toBe(
      'A: Where is the phone?\nB: The phone is on the sofa.\nA: Thanks!',
    );
  });

  it('glosses inflected words', () => {
    expect(glossLine('kedi masada')).toBe('kedi = cat · masada = table (in / at / on)');
    expect(english('Kitap masada.')).toBe('The book is on the table.');
  });

  it('review items with pictures get a gloss', () => {
    const item: Item = { id: 'R.x', type: 'pick_suffix', grammar: ['g.L10.loc'], base: 'w.kitap', suffix: 'sfx.loc', options: ['da', 'ta'], answer: 'ta', images: ['img.openmoji.book'] };
    expect(translationFor(item)).toBe('kitapta = book (in / at / on)');
  });

  it('shows sentence IDs as Turkish text', () => {
    const pair = byId['L11.learn.04'];
    expect(displayAnswer(pair.answer)).toBe(content.sentences[pair.answer!].tr);
    expect(displayAnswer('masada')).toBe('masada');
  });
});
