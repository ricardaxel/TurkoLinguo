# TurkoLinguo — Open resources research (2026-10-20)

Goal: a mobile app for learning Turkish in short sessions (3–10 min). Unlike Duolingo, it explains the grammar.

## 1. Pedagogy: the evidence supports explaining grammar
- Meta-analyses have repeatedly found explicit instruction (explaining the rule, then practicing it) more effective than implicit exposure alone: Norris & Ortega 2000, Spada & Tomita 2010, and Goo et al. 2015 (34 studies).
  Caveat: many of these studies measured explicit knowledge, so the app also needs plenty of meaningful practice.
- Recommended session loop: **short rule card → guided examples → practice with feedback → spaced review**.
- Spaced repetition: **FSRS** (open source, used by Anki). Ports exist for TypeScript (`ts-fsrs`), Kotlin (`FsrsKt`), Rust (`fsrs-rs`, BSD-3) and Go.

## 2. Grammar and curriculum sources
| Resource | Content | License | Use |
|---|---|---|---|
| Wikibooks "Turkish" | Alphabet, vowel and consonant harmony, cases, tenses, aorist, imperative… About 25% complete | CC BY-SA | Can be adapted (attribution, share-alike) |
| *Her Şey Bir Merhaba ile Başlar* (UT Austin / COERLL) | Intermediate to advanced, 4 thematic units, grammar in context, videos, H5P exercises, PDF and Google Docs | CC BY-SA 4.0 | Best open course found; for later levels (B1+) |
| FSI Turkish Basic Course (1966) | 60 units, about 240 h, audio and text | Said to be public domain (US government work); no official confirmation found | Dated content, but useful for drills and audio |
| UT Austin phonology site (Myers & Crowhurst) | Linguistic analysis of harmony and voicing | © 2006, no open license | Reference only |
| Kara (2011), ZfWT — CEFR-based A1–A2 syllabus | Ordering of grammar topics | Academic article | Use to sequence the curriculum |

Note: the Turkish-as-a-foreign-language textbooks (Yedi İklim, Yeni Hitit, İstanbul…) are copyrighted, and studies note they do not agree on the order of grammar topics. We'll need to design our own progression.
Copyrighted reference grammars to consult without copying: Göksel & Kerslake, *Turkish: A Comprehensive Grammar*; G. Lewis, *Turkish Grammar*.

## 3. Language data
| Resource | Content | License |
|---|---|---|
| **Tatoeba** | About 750k Turkish sentences, many aligned with EN/FR | CC BY 2.0 FR (some sentences CC0); audio license varies per sentence |
| **Wiktionary via kaikki.org (wiktextract)** | Turkish JSONL dictionary: definitions, inflected forms, tags | CC BY-SA / GFDL |
| **Mozilla Common Voice Turkish** | About 135 h of CC0 audio (v25, 2026) | CC0, but re-hosting is forbidden by the terms of use |
| **Zargan lexical datasets** | Frequencies of roots, suffixes and n-grams | Creative Commons (variant to be checked) |
| **UD Turkish IMST** | Annotated treebank | CC BY-NC-SA 4.0 (no commercial use) |

## 4. NLP tools (generating and checking suffixed forms)
- **Zemberek-NLP** (Java; ports for .NET and Go): morphological analysis and generation. In maintenance mode. Check the official LICENSE (Apache 2.0 according to forks).
- **TRmorph** (Çöltekin): finite-state analyzer, free license, with segmentation and hyphenation tools.
- **MorTur** (LREC 2020): open source.
- Use: generate the correct forms (vowel harmony, consonant changes) and give **explained** feedback ("-de → -te because the root ends in a voiceless consonant").

## 5. Audio / TTS
- **Lingua Libre** (Wikimedia Commons, `Category:Lingua_Libre_pronunciation-tur`): 6,646 native Turkish word recordings. They cover 93% of our A1 theme list (see VOCABULARY.md §6).
- Tatoeba: only about 1,100 Turkish sentences with audio.
- **Piper** (MIT engine) has Turkish voices (dfki, fahrettin, fettah…). Each voice has its own license, to be checked before commercial use.
- Native recordings: Tatoeba (per-sentence license) and Common Voice (CC0).

## 6. Open points
- App license / business model: CC BY-SA content (Wikibooks, Wiktionary, COERLL) requires releasing derived **content** under the same license. Tatoeba's CC BY only requires attribution. Anything NC (IMST) is excluded if the app is paid.
- Confirm the licenses of Zemberek, the Piper TR voices and Zargan.
- ~~Learner's base language~~ → **English** (decided 2026-10-20). Use Tatoeba `tur`–`eng` pairs; explanations written in English. Wiktionary (en) glosses are already in English.
