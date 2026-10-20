import { content, word } from '../../content';
import { checkTyped, expandPattern } from '../check';
import { diagnoseForm, renderFeedback } from '../feedback';
import { inflect } from '../morph';
import { trLower } from '../turkish';

const T = content.suffixes;

describe('turkish case mapping', () => {
  it('maps I → ı and İ → i', () => {
    expect(trLower('IRMAK')).toBe('ırmak');
    expect(trLower('İSTANBUL')).toBe('istanbul');
  });
});

describe('form engine: content/morphology/tests.yaml', () => {
  type MorphTest = (typeof content.morphTests)[number] & { pending?: string };
  const tests = content.morphTests as MorphTest[];
  const row = (t: MorphTest) => [t.word, t.suffixes.join('+'), t.expected, t];
  const run = (_w: unknown, _s: unknown, expected: unknown, t: unknown) => {
    const test = t as MorphTest;
    expect(inflect(word(test.word), test.suffixes, T)).toBe(expected);
  };

  it.each(tests.filter((t) => !t.pending).map(row))('%s + %s → %s', run);
  // Known engine gaps (`pending:` in tests.yaml). These start failing once the engine handles
  // them: then remove the `pending` field.
  if (tests.some((t) => t.pending)) {
    it.failing.each(tests.filter((t) => t.pending).map(row))('pending: %s + %s → %s', run);
  }
});

describe('answer patterns', () => {
  it('expands optional parts', () => {
    expect(expandPattern('(Hayır,) (kitap) yatakta.').sort()).toEqual(
      ['Hayır, kitap yatakta.', 'Hayır, yatakta.', 'Kitap yatakta.', 'Yatakta.'].sort(),
    );
  });
  it('expands alternatives', () => {
    expect(expandPattern('{Evet|Var}.')).toEqual(['Evet.', 'Var.']);
  });
});

describe('checkTyped', () => {
  it('ignores case and punctuation', () => {
    expect(checkTyped('kitap masada', ['Kitap masada.']).status).toBe('correct');
  });
  it('accepts dropped optional words', () => {
    expect(checkTyped('yatakta', ['(Hayır,) (kitap) yatakta.']).status).toBe('correct');
  });
  it('flags a missing accent as almost, naming the letter', () => {
    const r = checkTyped('bahcede', ['bahçede']);
    expect(r.status).toBe('almost');
    expect(r.accent).toEqual({ expected: 'ç', given: 'c' });
  });
  it('never accepts kir for kır', () => {
    expect(checkTyped('kir', ['kır']).status).toBe('almost');
  });
  it('treats dotted capital İ correctly', () => {
    expect(checkTyped('İKİ', ['iki']).status).toBe('correct');
  });
  it('picks the closest answer when wrong', () => {
    expect(checkTyped('the book on table', ['The book is on the table.', 'A cat.'], 'en').expected).toBe(
      'The book is on the table.',
    );
  });
});

describe('locative feedback diagnosis', () => {
  const tpl = content.grammar['g.L10.loc'].feedback;
  const diag = (w: string, given: string) => diagnoseForm(word(w), 'sfx.loc', given, T);

  it.each([
    ['w.masa', 'masata', ['after_vowel']],
    ['w.ev', 'evda', ['vowel_front']],
    ['w.mutfak', 'mutfakda', ['voiceless']],
    ['w.okul', 'okulta', ['not_voiceless']],
    ['w.otobüs', 'otobüsta', ['vowel_front', 'last_not_first']],
    ['w.otobüs', 'otobüsde', ['voiceless']],
    ['w.otobüs', 'otobüsda', ['voiceless', 'vowel_front', 'last_not_first']],
    ['w.kitap', 'kitabda', ['stem_changed']],
    ['w.masa', 'masa da', ['detached']],
  ])('%s: %s → %j', (w, given, codes) => {
    expect(diag(w, given)?.codes).toEqual(codes);
  });

  it('renders the template', () => {
    const d = diag('w.kitap', 'kitapda')!;
    expect(renderFeedback(d, tpl)).toBe(
      '**kitap** ends in **p**, one of the Fıstıkçı Şahap letters → **t**: kitapta.',
    );
  });
});

describe('content integrity: every lesson answer agrees with the engine and checker', () => {
  const items = Object.values(content.lessons).flatMap((lesson) => [
    ...lesson.sessions.learn.items,
    ...lesson.sessions.practise.items,
  ]);

  it.each(items.map((i) => [i.id, i]))('%s', (_id, it) => {
    const item = it as (typeof items)[number];
    switch (item.type) {
      case 'pick_suffix':
        expect(word(item.base!).lemma + item.answer).toBe(inflect(word(item.base!), [item.suffix!], T));
        break;
      case 'type_form':
        expect(item.answer).toBe(inflect(word(item.base!), item.suffixes!, T));
        break;
      case 'spot_error':
        expect(checkTyped(content.sentences[item.sentence!].tr, [item.text!.replace(item.error!, item.answer!)]).status).toBe('correct');
        break;
      case 'translate_to_tr': {
        const s = content.sentences[item.sentence!];
        if (item.word_bank) {
          const tokens = s.tr.replace(/[.,!?]/g, '').split(' ');
          tokens.forEach((t) => expect(item.word_bank!.map(trLower)).toContain(trLower(t)));
        } else {
          expect(checkTyped(s.tr, [s.tr, ...(item.answers ?? [])]).status).toBe('correct');
        }
        break;
      }
      default:
        break;
    }
  });
});
