# TurkoLinguo — Content format (v0.1)

All course content (grammar, lessons, exercises, vocabulary, sentences, media credits) lives in **plain-text YAML files** under `content/`. A validator checks them, and a build step compiles them into one bundle the app loads.

- Schema: [schema/content.schema.json](../schema/content.schema.json)
- Validator: [scripts/validate_content.py](../scripts/validate_content.py)
- Worked example: lesson L10 ([content/lessons/L10.yaml](../content/lessons/L10.yaml)), converted from [lessons/L10-locative.md](../lessons/L10-locative.md)

## 1. Why YAML

- **Easy to write and review:** multi-line text, comments, and Turkish characters without escaping. Content can be edited by a teacher, not only a developer.
- **Validated:** each file is checked against a JSON Schema, so typos in field names or IDs are caught before they reach the app.
- **Diff-friendly:** one lesson per file, so changes show up clearly in git.
- The app never reads YAML. `build` produces `build/content.json` (later possibly SQLite).

Rules for every file:
- UTF-8, **NFC-normalised** (*ş* is one character, not *s* + a combining cedilla). The validator checks this.
- Turkish text uses the real letters (ç ğ ı İ ö ş ü). Never ASCII stand-ins.

## 2. Directory layout

```
content/
  course.yaml              # units, lesson order, grammar point per lesson
  grammar/L10.yaml         # grammar points: reference text, review patterns, feedback templates
  lessons/L10.yaml         # lesson: cards + items for the Learn and Practise sessions
  packs/T8.yaml            # vocabulary theme packs
  lexicon/*.yaml           # dictionary entries (any grouping; IDs are global)
  sentences/*.yaml         # example sentences, shared between lessons, packs and reviews
  morphology/suffixes.yaml # suffix inventory in archiphoneme notation
  morphology/tests.yaml    # expected forms: shared test cases for the form engine
  media/assets.yaml        # every image and audio file, with source and licence
```

The directory determines the file type, and so which schema applies.

## 3. IDs

IDs are stable, global and never reused. Content refers to everything by ID.

| Kind | Pattern | Examples |
|---|---|---|
| Lesson | `L<n>` | `L10` |
| Checkpoint | `C<n>` | `C2` |
| Grammar point | `g.L<n>.<slug>` | `g.L10.loc` |
| Review pattern | `<grammar id>.<slug>` | `g.L10.loc.voiceless` |
| Theme / pack | `T<n>[b]` / `T<n>.p<k>` | `T8`, `T8.p1` |
| Word | `w.<lemma>[.<sense>]` | `w.masa`, `w.yüz.face`, `w.yüz.hundred` |
| Sentence | `s.<where>.<nnn>` | `s.L10.004` |
| Item | `<lesson>.<session>.<nn>` | `L10.practise.03` |
| Suffix | `sfx.<slug>` | `sfx.loc`, `sfx.pl` |
| Image / audio | `img.<source>.<slug>` / `aud.<source>.<slug>` | `img.openmoji.cat`, `aud.own.s.L10.002` |

## 4. File types

### 4.1 `course.yaml`
Defines the order of everything. Each lesson gets one grammar point. A lesson without a `file` is planned but not yet written.

```yaml
units:
  - id: U2
    title: Where
    lessons: [L10, L11, L12, L13]
    checkpoint: C2
lessons:
  L10: { title: "Locative -DA", grammar: g.L10.loc, file: lessons/L10.yaml }
  L11: { title: "Location + to be; apostrophes", grammar: g.L11.loc_copula }
```

### 4.2 Grammar point (`grammar/`)
This is the *reusable* side of a rule: the grammar reference screen, the review patterns FSRS schedules, and the feedback templates. Presentation (cards) lives in the lesson.

```yaml
id: g.L10.loc
title: "Locative -DA: in / at / on"
suffixes: [sfx.loc]
reference: |            # Markdown, shown in the in-app grammar handbook
  ...
patterns:               # each one becomes an FSRS card that draws a NEW known word each time
  - id: g.L10.loc.voiceless
    suffix: sfx.loc
    word_filter: { pos: noun, ends_with: voiceless }
feedback:               # templates used by `feedback: auto:<grammar id>`
  voiceless: "**{word}** ends in **{c}**, one of the Fıstıkçı Şahap letters → **t**: {answer}."
```

`word_filter` keys: `pos`, `last_vowel` (`back` | `front`), `ends_with` (`vowel` | `voiceless` | `voiced_consonant`), `flags` (word must have all of them).

A pattern that stacks endings uses `suffixes` (a chain) instead of `suffix`: `suffixes: [sfx.loc, sfx.cop_1sg]` → *evdeyim* (L11). A pattern with neither (e.g. the L13 clitic *de/da*) is a rule card with no generated word.

### 4.3 Lesson (`lessons/`)
```yaml
id: L10
grammar: g.L10.loc
new_words: [w.nerede, w.burada, w.orada]
sessions:
  learn:
    cards: [...]
    items: [...]
  practise:
    items: [...]
```

**Cards** have a `kind` and Markdown `body`, plus optional `audio`, `images`, `interactive` (an app component + params).
Kinds: `hook`, `rule`, `examples`, `note`, `summary`.

Text conventions inside Turkish strings:
- `·` (U+00B7) marks morpheme boundaries: `ev·ler·de`. The app shows it segmented or fused (it strips the dots).
- `**bold**` highlights the part being taught.

### 4.4 Items (exercises)
Common fields:

| Field | Required | Meaning |
|---|---|---|
| `id` | ✓ | `L10.practise.03` |
| `type` | ✓ | see below |
| `grammar` | ✓ | grammar IDs this item exercises. The first is the main one; the others get review credit |
| `pattern` |  | review pattern ID, for per-sub-rule strength |
| `feedback` |  | `auto:<grammar id>` (generated from the templates) or a map `{wrong answer: message}` |
| `images`, `audio` |  | media IDs |
| `translation` |  | English shown after answering an item **with pictures**. Optional: otherwise the app uses the item's sentence, a course sentence with the same Turkish, or a word-by-word gloss |

Types and their specific fields:

| `type` | Specific fields | Typing? |
|---|---|---|
| `pick_suffix` | `base` (word ID), `suffix`, `options`, `answer` | no |
| `type_form` | `base`, `suffixes`, `prompt`, `answer` | yes |
| `build_word` | `tiles`, `answer` (segmented with ·) | no |
| `translate_to_tr` | `sentence`, `word_bank` (tiles incl. distractors) or `typed: true`, optional extra `answers` | either |
| `translate_to_en` | `sentence`, optional extra `answers` | yes |
| `listen_choose` | `sentence`, `options` (image IDs or text), `answer` | no |
| `dictation` | `sentence` | yes |
| `spot_error` | `text` (wrong), `error` (the wrong token), `answer` (the correction), `sentence` (the correct version) | either |
| `picture_choose` | `images`, `prompt`, `options`, `answer` | no |
| `qa` | `question` (sentence ID), `images`, `answers` | yes |
| `mini_dialogue` | `turns`: list of `{speaker, sentence}` or `{speaker, blank: true, answers}` | yes |
| `contrast_pair` | `prompt`, `options` (sentence IDs), `answer` | no |

For every choice type (`pick_suffix`, `picture_choose`, `listen_choose`, `contrast_pair`), `answer` is the **value** of the correct option, not its position. The app shuffles options, so positions are meaningless.

**Answer patterns.** Typed answers are compared after normalisation (Turkish-aware lowercase, `I→ı`, `İ→i`; trailing punctuation and extra spaces ignored). Accents are **not** normalised away, so a missing accent is "almost right" (see CURRICULUM §5). Inside a pattern:
- `(…)` = optional: `(Hayır,) (kitap) yatakta.` accepts all four combinations
- `{a|b}` = alternatives: `{Evet|Var}.`
- Word-order variants are listed explicitly as separate answers. There's no automatic reordering, so every accepted order has been checked by a human.

For `translate_to_tr` / `dictation` / `qa`, the referenced sentence's `tr` is always accepted. `answers` adds to it.

### 4.5 Sentence (`sentences/`)
Sentences are shared, so a sentence recorded once can be used in a lesson, a pack frame and reviews.

```yaml
- id: s.L10.012
  tr: Dolapta süt var mı?
  en: ["Is there milk in the cupboard?", "Is there any milk in the cupboard?"]
  words: [w.dolap, w.süt, w.var]
  grammar: [g.L10.loc, g.L8.varyok, g.L7.question]
  source: { kind: original }           # or { kind: tatoeba, id: 123456, license: CC-BY-2.0-FR }
  audio: aud.own.s.L10.012
  native_required: false
  phrase: false                         # true = set phrase, exempt from the grammar check
```

`words` and `grammar` are written by hand for now. Later the Zemberek/TRmorph pipeline will fill them in automatically, and authors will only review them.

### 4.6 Word (`lexicon/`)
```yaml
- id: w.dolap
  lemma: dolap
  pos: noun          # noun verb adj det adv pron num postp conj interj particle name phrase  (det: her, geçen, gelecek)
  gloss: [cupboard, wardrobe]
  flags: [soft]      # soft nosoft drop front compound double irr nodrill  (nodrill: never used in generated review drills)
  forms: {}          # explicit irregular forms, e.g. su: { acc: suyu, gen: suyun }
  images: [img.tbd.cupboard]
  audio: aud.ll.dolap
```

Words with `pos: name` (Ali, Ayşe…) never need to be introduced.

### 4.7 Pack (`packs/`)
```yaml
id: T8
title: Home & furniture
kind: core
packs:
  - id: T8.p1
    unlock_after: L9
    words: [w.ev, w.oda, ...]     # 8 words
    frames: [s.T8.001, s.T8.002]
revisit: [L10, L19, L24]
```

### 4.8 Media (`media/assets.yaml`)
Every image and audio file has one entry. The **Credits** screen is generated from these entries.

```yaml
- id: img.openmoji.cat
  kind: image
  file: images/openmoji/1F408.svg
  source: openmoji        # openmoji wikimedia openverse lingualibre own tts
  source_url: https://openmoji.org/library/emoji-1F408/
  author: OpenMoji
  license: CC-BY-SA-4.0   # allowed: CC0-1.0 PD CC-BY-3.0 CC-BY-4.0 CC-BY-SA-3.0 CC-BY-SA-4.0 OWN TTS
  status: ready           # planned | ready
  modified: false
  derived_from: []        # for composites (e.g. the L10 room scene)
```

The schema **rejects** NC and ND licences. `OWN` = recorded or drawn for us under a written agreement. `TTS` = placeholder only.

**Composite images** (`img.own.*`) say how their parts are arranged with `compose`. `derived_from` still lists every part, for the Credits screen.

```yaml
- id: img.own.cat_on_table
  derived_from: [img.openmoji.cat, img.own.table]
  compose: { layout: on_top, items: [img.openmoji.cat, img.own.table] }
```

| `layout` | Meaning | Items |
|---|---|---|
| `on_top` | the object sits on the surface (cat on table) | exactly 2: object, surface |
| `in` | the object pokes out of a container (phone in bag) | exactly 2: object, container |
| `at` | the object is in front of a place (person in the park) | exactly 2: object, place |
| `row` | side by side | 1 or more |
| `panels` | separate scenes with a divider (Ali at home │ Ayşe at school) | 1 or more |

Items can be image IDs or nested `compose` objects. Write `on_top`, not `on`: YAML reads a bare `on` as `true`.

Objects with no emoji (table, cupboard, lamp) are drawn as our own SVG icons in `app/src/ui/icons.tsx` (`img.own.table` etc.). A test fails if any image used in the content can't be drawn.

### 4.9 Morphology (`morphology/`)
`suffixes.yaml` lists every suffix in archiphoneme notation (`form: DA`, `form: (y)I`) with the grammar point that introduces it. `tests.yaml` holds `{lemma, suffixes, expected}` cases: *kitap + loc = kitapta*, *su + acc = suyu*. These tests are shared by the app's form engine and by future validator checks. A case the engine doesn't handle yet can carry `pending: "<reason>"`; no case needs it at the moment, so the app test runs every case (add an `it.failing` block for pending cases when one is needed again).

## 5. What the validator checks

`wsl python3 -I scripts/validate_content.py [--strict] [--release] [content_dir]`

From Git Bash, set `MSYS_NO_PATHCONV=1` before passing a `/mnt/c/...` path, or Git Bash will rewrite it.

1. **Schema:** every file matches its schema (fields, types, ID formats, item types, allowed licences).
2. **Unique IDs** across all files.
3. **References resolve:** words, sentences, suffixes, media, grammar points, patterns, lessons.
4. **Known material only.** For every lesson item, sentence use and pack frame, the validator computes what the learner knows at that point in `course.yaml` order:
   - grammar: points of lessons up to and including the current one;
   - words: words from lessons up to and including the current one, plus packs unlocked before it.
   It is an **error** if something is used *before* it is taught, and a **warning** if it isn't taught anywhere yet (normal while content is incomplete; `--strict` turns these warnings into errors).
5. **Item consistency:** answer-pattern syntax (balanced `()` and `{}`); a choice `answer` is one of its `options`; `build_word` tiles match the answer's segments; a `spot_error` error token appears in its text; a `word_bank` contains every word of the target sentence; a `pattern` belongs to the item's main grammar point.
6. **NFC normalisation** of all text.
7. With `--release`: every referenced media file has `status: ready`, no `TTS` audio on `native_required` sentences, no warnings.

## 6. Not decided yet
- Build target format (`build/content.json` vs SQLite) depends on the tech stack.
- How checkpoints are described: probably a lesson file with `kind: checkpoint` and items only.
- Translations of the English UI text, if we ever add other base languages: the `en` fields would become `{en: ..., fr: ...}`.
