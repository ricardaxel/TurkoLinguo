import { allItems, content, word } from '../../content';
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
  it.each(content.morphTests.map((t) => [t.word, t.suffixes.join('+'), t.expected, t.suffixes]))(
    '%s + %s → %s',
    (w, _s, expected, suffixes) => {
      expect(inflect(word(w as string), suffixes as string[], T)).toBe(expected);
    },
  );
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

describe('content integrity: every lesson and checkpoint answer agrees with the engine and checker', () => {
  const items = allItems();

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

describe('feedback diagnosis for suffix chains and names', () => {
  const diag = (w: string, chain: string[], given: string) => diagnoseForm(word(w), chain, given, T);
  const LOC_1SG = ['sfx.loc', 'sfx.cop_1sg'];
  const ABL_1SG = ['sfx.abl', 'sfx.cop_1sg'];

  it.each([
    ['w.ev', LOC_1SG, 'evdeyim', []],
    ['w.ev', LOC_1SG, 'evdeim', ['no_buffer']],
    ['w.park', LOC_1SG, 'parkdayım', ['voiceless']],
    ['w.park', LOC_1SG, 'parktaım', ['no_buffer']],
    ['w.park', LOC_1SG, 'parkdaım', ['voiceless', 'no_buffer']],
    ['w.park', LOC_1SG, 'parktayim', ['person_harmony']],
    // the person ending correctly follows the learner's own (wrong) -da
    ['w.ev', LOC_1SG, 'evdayım', ['vowel_front']],
    ['w.ev', LOC_1SG, 'evimde', ['order']],
    ['w.ev', LOC_1SG, 'ev deyim', ['detached']],
    ['w.okul', ['sfx.loc', 'sfx.cop_2pl'], 'okuldasiniz', ['person_harmony']],
    ['w.Ankara', LOC_1SG, 'Ankara\'dayım', []],
    ['w.Ankara', LOC_1SG, 'Ankaradayım', ['apostrophe']],
    ['w.Ankara', LOC_1SG, 'Ankara’dayım', []],
    ['w.Ankara', LOC_1SG, 'Ankara\'deyim', ['vowel_back']],
    ['w.Ankara', ['sfx.loc'], 'Ankarada', ['apostrophe']],
    ['w.Ahmet', ['sfx.loc'], 'Ahmet\'de', ['voiceless']],
    ['w.Ahmet', ['sfx.loc'], 'Ahmetde', ['apostrophe', 'voiceless']],
    ['w.İstanbul', LOC_1SG, 'istanbuldayım', ['apostrophe']],
    ['w.Londra', ABL_1SG, 'Londra\'dayım', ['loc_for_abl']],
    ['w.Londra', ABL_1SG, 'Londradanım', ['apostrophe']],
    ['w.Londra', ABL_1SG, 'Londra\'danyım', ['buffer_after_n']],
    ['w.Türkiye', ABL_1SG, 'Türkiye\'denım', ['person_harmony']],
    ['w.ev', ['sfx.pl', 'sfx.loc'], 'evlerda', ['vowel_front']],
  ])('%s + %j: %s → %j', (w, chain, given, codes) => {
    expect(diag(w, chain, given)?.codes ?? []).toEqual(codes);
  });

  it('gives up on forms it cannot explain', () => {
    expect(diag('w.ev', LOC_1SG, 'evde')).toBeNull();
    expect(diag('w.ev', LOC_1SG, 'masadayım')).toBeNull();
  });

  it('renders L11 templates for a chain', () => {
    const tpl = content.grammar['g.L11.loc_copula'].feedback;
    expect(renderFeedback(diag('w.park', LOC_1SG, 'parkdayım')!, tpl)).toBe(
      '**park** ends in **k**, one of the Fıstıkçı Şahap letters → **t**: parktayım.',
    );
    expect(renderFeedback(diag('w.ev', LOC_1SG, 'evdeim')!, tpl)).toBe(
      '-DA ends in a vowel, so *-(y)Im / -(y)Iz* need the buffer **y**: **evdeyim**.',
    );
    expect(renderFeedback(diag('w.Ankara', LOC_1SG, 'Ankaradayım')!, tpl)).toBe(
      '**Ankara** is a name, so it takes an apostrophe before the ending: **Ankara\'dayım**.',
    );
  });

  it('names the stem a later case suffix follows', () => {
    const tpl = content.grammar['g.L10.loc'].feedback;
    expect(renderFeedback(diag('w.ev', ['sfx.pl', 'sfx.loc'], 'evlerda')!, tpl)).toBe(
      'Look at the last vowel of **evler**: **e** is a front vowel (e i ö ü) → **-de**.',
    );
  });
});
