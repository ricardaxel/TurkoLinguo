# TurkoLinguo — Curriculum outline (A1, draft v0.1)

Base language: English. Target: CEFR A1, with a sketch of A2 at the end.
Sources: Kara (2011) A1–A2 syllabus for ordering; Wikibooks *Turkish* (CC BY-SA) for explanations to adapt; Tatoeba tur–eng for example sentences. See [RESEARCH.md](RESEARCH.md).

---

## 1. Design principles

1. **One grammar point per lesson.** Each rule card can be read in under 60 seconds.
2. **Explain, then practise.** Every lesson follows the same order: rule card → 3–5 worked examples → practice with *explained* feedback.
3. **Build the suffix chain one link at a time.** Turkish is agglutinative (`ev-ler-im-de-yim`, "I am in my houses"). Each lesson adds a single link, and the app always shows words segmented (`ev·ler·de`) before showing them fused.
4. **Harmony is taught once, then reused everywhere.** From lesson 2 on, every suffix is shown in archiphoneme notation (see §2) with a "why this vowel?" hint.
5. **Small vocabulary loads.** About 8–10 new words per lesson, chosen so the grammar can be practised. Each unit's vocabulary is themed.
6. **Spiral review.** FSRS schedules both vocabulary cards *and* grammar-pattern cards (e.g. "locative after a voiceless consonant"). Every unit ends with a checkpoint.

### Session sizing (3–10 min)
A lesson is split into micro-sessions:

| Session | Content | Length |
|---|---|---|
| **Learn** | Rule card + worked examples + 4–6 easy items | 3–4 min |
| **Practise** | 10–15 mixed items on the new point + previous points | 4–6 min |
| **Review** (daily) | Due cards chosen by FSRS | 3–10 min |

That gives 35 lessons, each with 2 core sessions, plus checkpoints: **about 80 core sessions for A1**, plus daily reviews.

---

## 2. Notation used in the app (and in the content files)

Suffixes are written with capital letters. Each capital stands for a set of possible sounds, chosen by harmony:

| Symbol | Realisations | Rule |
|---|---|---|
| **A** | a / e | 2-way harmony: back vowel (a ı o u) → **a**; front vowel (e i ö ü) → **e** |
| **I** | ı / i / u / ü | 4-way harmony: a ı → **ı**; e i → **i**; o u → **u**; ö ü → **ü** |
| **D** | d / t | **t** after a voiceless consonant (f s t k ç ş h p, "**F**ı**st**ı**kç**ı **Ş**a**h**a**p**"), otherwise **d** |
| **C** | c / ç | same rule as D |
| **(y) (n) (s)** | buffer consonants | inserted only after a vowel |

Example: locative `-DA` → `ev·de`, `okul·da`, `kitap·ta`, `sokak·ta`.

The same notation drives the **form generator / checker**, so the feedback can always name the rule ("*-ta*, not *-da*: *kitap* ends in **p**, a voiceless consonant").

---

## 3. A1 lesson map

Format for each lesson: **Grammar point** · rule summary · examples · common pitfalls · exercise types · vocabulary theme.

### Unit 0 — Sounds (2 lessons)

**L1. Alphabet & pronunciation**
- 29 letters. Teach the ones English speakers get wrong: **c** = "j", **ç** = "ch", **ş** = "sh", **ı** (no dot) = the vowel in "roses", **ö / ü** like German, **ğ** is silent and lengthens the vowel before it. Turkish is spelled the way it's pronounced.
- Stress usually falls on the last syllable (exceptions such as place names come later).
- Exercises: hear → pick the spelling; letter-to-sound matching; minimal pairs (*kır* "countryside" / *kir* "dirt", *kız* "girl" / *kaz* "goose").
- Vocabulary: greetings (*merhaba, selam, günaydın, teşekkürler, evet, hayır*).

**L2. Vowel harmony: the two families**
- Front vs back vowels (→ A), then the 4 corners (→ I). Introduce the notation in §2 using the vowel chart as a 2×2 picture.
- No suffix "meaning" yet: pure pattern drill.
- Exercises: "which family is this word?"; pick the A/I realisation for the last vowel; tap the last vowel.
- Vocabulary: about 10 nouns used later (*ev, okul, kitap, su, göz, kız, gün, araba, masa, kedi*).

### Unit 1 — Who & what (7 lessons + checkpoint)

**L3. This / that, "a", no verb "to be" in the 3rd person**
- *bu* (this), *şu* (that, near), *o* (that, far). *Bu ne?* "What is this?" → *Bu bir kitap.* "This is a book."
- *bir* = "a / one". There is no word for "the".
- Pitfall: no "is" word in the 3rd person: *Bu kedi.* = "This is a cat."
- Vocabulary: classroom and household objects.

**L4. Plural -lAr**
- `kitap·lar`, `ev·ler`. First real use of A-harmony.
- Pitfall: after a number, the noun stays singular: *iki kitap* (not ~~iki kitaplar~~).
- Exercises: build the plural; spot the error.

**L5. Personal pronouns + "to be" endings**
- *ben, sen, o, biz, siz, onlar*. Endings: `-(y)Im, -sIn, –, -(y)Iz, -sInIz, -lAr`.
- `öğretmen·im` "I am a teacher", `Türk·üm`, `hasta·yım` (buffer **y** after a vowel).
- *siz* also means polite "you".
- Fixed phrase: *Nerelisin? — İngilizim / Amerikalıyım.* (The *-lI* suffix gets its own explanation in L28.)
- Vocabulary: nationalities, professions, adjectives for states (*yorgun, mutlu, hasta*).

**L6. Negation of "to be": değil**
- *değil* + personal ending: *Öğrenci değilim.* "I am not a student."
- Exercises: affirmative ↔ negative transformation.

**L7. Questions with mI**
- The question particle `mI` is written separately and harmonises with the previous word. Personal endings attach to **mI**: *Öğrenci misin?* "Are you a student?", *Hasta mı?*
- Question words: *ne, kim, nerede, nasıl*. *Nasılsın? — İyiyim.*
- Pitfall: the particle **never** changes its *m*, and it is written as a separate word.
- Pitfall: in the 3rd person plural, *-lAr* stays on the word, not on *mI*: *Öğrenciler mi?* (not ~~Öğrenci miler?~~).
- Exercises: turn statements into questions; place *mI* in the right spot.

**L8. var / yok: "there is / there isn't"**
- *Çay var mı? — Var. / Yok.* *Evde kedi yok.* (preview of *-DA*)
- Vocabulary: café and food (*çay, kahve, su, ekmek, peynir*).

**L9. Adjectives & numbers 1–10**
- The adjective comes before the noun. *bir* goes between the adjective and the noun: *güzel bir ev* "a beautiful house". *çok* = "very / a lot".
- Numbers 1–10 (singular noun after them, a recall of L4).
- Exercises: word ordering; listen to a number and type it.

**✓ Checkpoint 1.** Mixed review + a mini dialogue (meeting someone in a café).

### Unit 2 — Where (4 lessons + checkpoint)

**L10. Locative -DA "in / at / on"**
- First consonant rule: `ev·de`, `okul·da`, `kitap·ta`, `sokak·ta`. Mnemonic: **Fıstıkçı Şahap**.
- *Nerede?* "Where?"
- Exercises: choose -da/-de/-ta/-te with a "why" hint; picture → sentence (*Kedi masada.*).

**L11. Location + "to be"; apostrophes on proper nouns**
- Stack `-DA` + personal ending: `ev·de·yim` "I am at home", `okul·da·sın`.
- Proper nouns take an apostrophe: *İstanbul'da, Ankara'dayım, Ali'de*.
- Exercises: build the chain step by step (segmented view, then fused).

**L12. Ablative -DAn "from" (with "to be")**
- It's just the locative + **n**: `ev·den`, `okul·dan`, `kitap·tan`, `İstanbul'dan`.
- With personal endings, no verb needed: *Neredensin? — Londra'danım. / İstanbul'danım.* "Where are you from? — I'm from London / Istanbul."
- Preview card (no production yet): verbs that take the ablative, *korkmak* (be afraid **of**), *hoşlanmak* (like). Recapped once verbs arrive (L17 recap card).
- Exercises: -dan/-den/-tan/-ten with "why" hints; locative vs ablative contrast (*Londra'dayım* / *Londra'danım*).

**L13. Clitic de/da "too / also" vs locative -DA; ve, ama**
- *Ben de.* "Me too." The clitic is written separately and **never** becomes *te/ta*: *Ahmet de geliyor*. The locative is attached to the word and does change.
- Conjunctions *ve* "and", *ama* "but".
- Exercises: "attached or separate?" decision items. This is a classic learner error.

**✓ Checkpoint 2.** Describe where people and things are and where they're from, using a picture scene.

### Unit 3 — Actions (5 lessons + checkpoint)

**L14. Verbs, infinitive -mAk, imperative**
- Dictionary form `gel·mek`, `otur·mak`. Stem = the informal command: *Gel!* "Come!"
- Polite / plural command `-(y)In(Iz)`: *Gelin, Oturunuz*.
- Vocabulary: core verbs (*gelmek, gitmek, yapmak, içmek, yemek, okumak, oturmak, bakmak*).

**L15. Present continuous -(I)yor**
- `gel·iyor·um` "I am coming", `oku·yor·sun`. Personal endings as in L5.
- **"This one never changes":** only the first vowel of `-(I)yor` harmonises. The *-yor* part is always *-yor*. It's the first ending that doesn't follow harmony.
- Stem changes: a final *e/a* turns into *i/ı/ü/u*: *başla → başlıyor, bekle → bekliyor*. *git → gidiyor, et → ediyor* (t → d). Irregular: *yemek → yiyor, demek → diyor*.
- Pitfall: t → d happens **only** in *gitmek* and *etmek* (plus rare verbs such as *tatmak*). Contrast *atmak → atıyor*, *yatmak → yatıyor*.
- Use: happening now **and** general present (unlike English).
- Objects stay generic in L15–16 (*Çay içiyorum. Kitap okuyorum.*), so the accusative isn't needed yet.
- Exercises: conjugation tables as quick taps; "what's happening?" pictures.

**L16. Present continuous: negative & questions**
- Negative `-mI-yor`: `gel·m·iyor·um`. Question: *Geliyor musun?* (*mI* placement from L7).

**L17. Dative -(y)A "to / toward" + softening & vowel drop**
- `ev·e`, `okul·a`, `İstanbul'a`, `araba·ya` (buffer y). *Eve gidiyorum.*
- Irregular pronouns: *bana, sana*.
- **Softening card** (first vowel-initial ending on nouns): final p/ç/t/k → b/c/d/ğ before a vowel: *kitap → kitaba, sokak → sokağa, ağaç → ağaca, renk → renge*.
- **Exceptions card:** most one-syllable words don't soften (*top → topa*, *ev → eve*); a few do (*kurt → kurda, uç → uca*).
- **Vowel-drop card:** *şehir → şehre, oğul → oğla, burun → burna*.
- Verbs that take the dative: *bakmak* (to look **at**), *binmek* (to get **on**).
- Recap card: the ablative verbs previewed in L12 (*Köpekten korkuyorum.*).

**L18. Accusative -(y)I: the *specific* direct object**
- Present it as "the **specific** direct object", **not** as a "the" ending. *Bir elma yiyorum.* "I'm eating an apple." vs *Elmayı yiyorum.* "I'm eating the apple." But also *Bir kitabı okudum.* "I read a certain book."
- Rules of thumb:
  1. Names, pronouns (*beni, seni, onu…*) and nouns after *bu/şu/o* **always** take `-(y)I`: *Ali'yi görüyorum. Bu kitabı okuyorum.*
  2. A bare noun, or a noun with *bir*, is non-specific: *Kitap okuyorum.*
  3. An object **without** the ending must sit directly before the verb: *Her gün kitap okuyorum* (not ~~Kitap her gün okuyorum~~).
- The mechanics (y buffer, softening, vowel drop) are already known from L17, so this lesson is entirely about **meaning**.
- Use contrastive pairs, a "specific or not?" quiz, and image-based contexts.

**✓ Checkpoint 3.** Daily routine narration (present continuous + cases).

### Unit 4 — Mine & yours (6 lessons + checkpoint)

**L19. Possessive suffixes (singular owners)**
- `ev·im` "my house", `ev·in`, `ev·i`; after a vowel: `araba·m`, `araba·n`, `araba·sı`.
- The pronoun is optional and used for emphasis: *(benim) evim*.

**L20. Possessive suffixes (plural owners) + softening review**
- `-(I)mIz, -(I)nIz, -lArI`.
- Review of the L17 softening and vowel-drop cards with possessives: *kitap → kitabım, ağaç → ağacım, renk → rengi, sokak → sokağı, oğul → oğlum*.

**L21. Genitive -(n)In + possession chain**
- *Ali'nin arabası* "Ali's car", *kadının çantası*, *benim/senin/onun*.
- Irregular genitives: *biz → bizim* (not ~~bizin~~; compare the regular *siz → sizin*); *su → suyun*.
- Pattern card: **owner-(n)In + thing-(s)I**.

**L22. Compound nouns (indefinite chain)**
- *Türk kahvesi* "Turkish coffee", *otobüs durağı* "bus stop", *İstanbul Üniversitesi*.
- Contrast with L21: no genitive = a "type of" relation, not ownership.

**L23. Having: possessive + var/yok**
- *(Benim) bir kardeşim var.* "I have a sibling." *Arabam yok.* *Kaç kardeşin var?*
- Vocabulary: family members.

**L24. Cases after possessives: the buffer n**
- After a 3rd-person possessive, an **n** is inserted: *evinde, arabasını, okuluna*.
- Exercises: build long chains with a segmented view (`araba·sı·n·ı`).

**✓ Checkpoint 4.** Introduce your family / describe your home.

### Unit 5 — Daily life (5 lessons + checkpoint)

**L25. Numbers 11–1000, prices, kaç**
- *Kaç lira?* "How many lira?" *Bu ne kadar?* "How much is this?" *Kaç* + singular noun.

**L26. Time & days**
- *Saat kaç?* "What time is it?" *Saat kaçta?* "At what time?" → *Saat üçte.* Days of the week; *-DA* with times (recall of L10).
- Limited to on-the-hour and half-hour times: *saat üç, üç buçuk, yarım* ("half past twelve"). Times like *üçü beş geçiyor* / *üçe beş var* need the accusative and dative, so they go in a later extension pack.

**L27. -(y)lA / ile "with, by"**
- *otobüsle, arkadaşımla, arabayla*. Written either as the separate word *ile* or as a suffix.

**L28. -lI / -sIz "with / without", origin**
- *şekerli / şekersiz çay*; origin: *İstanbullu, Nerelisin?* (closes the loop from L5).
- *-CI* "person who does…": *kahveci, balıkçı*.

**L29. Comparison: daha, en**
- *X Y'den daha büyük.* "X is bigger than Y" (ablative, recall of L12). *En güzel* "the most beautiful".

**✓ Checkpoint 5.** Shopping dialogue at a market.

### Unit 6 — Yesterday (3 lessons + checkpoint)

**L30. Past tense -DI**
- `gel·di·m, gel·di·n, gel·di, gel·di·k, gel·di·niz, gel·di·ler`. This is the second set of personal endings (k type).
- D-rule again: *gittim, yaptım, okudum*.
- *dün, geçen hafta*.

**L31. Past: negative & questions**
- *gelmedim*; *Geldin mi?* (*mI* comes **after** the personal ending here, unlike the present continuous).
- A contrast card, *Geliyor musun?* vs *Geldin mi?*, is high-value.

**L32. Past of "to be": -(y)DI**
- *Evdeydim* "I was at home", *Öğrenciydim*, *Hastaydı*; *vardı / yoktu*.

**✓ Checkpoint 6.** Tell what you did last weekend.

### Unit 7 — Plans & wishes (3 lessons + final A1 checkpoint)

**L33. Future -(y)AcAK**
- *geleceğim* (k → ğ before a vowel), *gelecek misin?*, *gelmeyeceğim*. *yarın, gelecek hafta*.

**L34. istemek + -mAk "want to"**
- *Çay içmek istiyorum.* "I want to drink tea." vs *Çay istiyorum.* "I want tea."

**L35. Need / must: -mAk lazım / gerek; -mA + possessive**
- *Gitmek lazım.* "It's necessary to go." → *Gitmem lazım.* "I need to go." (This reuses the possessives from L19.)

**✓ Final A1 checkpoint.** Planning a trip: future, wants, cases, time.

---

## 4. A2 sketch (to be detailed later)

1. **Aorist** `-Ir / -Ar / -r` (habits, offers) and its irregular verbs. This is the **first** A2 lesson. Its rule card links back to the A1 phrases: "You've said *Teşekkür ederim* 100 times. Here's why it ends in *-er-im*."
2. Ability `-(y)Abil` and inability `-(y)AmA`
3. Necessity `-mAlI`, suggestion `-(y)AlIm`
4. Spatial postpositions with possessives: *masanın üstünde, evin önünde*
5. Postpositions *için, gibi, kadar, göre*
6. Past continuous `-(I)yordu`
7. Reported / inferential past `-mIş`
8. Conditional `-sA`, `-(y)sA`
9. Adverbial forms: `-(y)ArAk`, `-(y)IncA`, `-DIktAn sonra`, `-mAdAn önce`, `-ken`
10. Reflexive *kendi*, reciprocal
11. Relative clauses I: `-(y)An`
12. Relative clauses II: `-DIK` + possessive (likely B1)

---

## 5. Exercise type catalogue

| Type | Tests | Feedback |
|---|---|---|
| Pick the suffix (a/e/ı/i…) | Harmony / consonant rule | Highlights the deciding vowel or consonant |
| Build the word (tap morphemes in order) | Suffix order | Shows the correct chain segmented |
| Type the form | Production | Diff + the rule that was broken |
| Translate EN → TR (word bank, later free typing) | Sentence production | Accepts the variants listed in the content |
| Translate TR → EN | Comprehension | — |
| Listen & choose / dictation | Listening, spelling | Slowed-down audio replay |
| Spot the error | Rule awareness | Explains the error |
| Contrast pair ("which one is a *specific* apple?") | Meaning of a form | Short semantic note |
| Mini dialogue (fill in the turns) | Use in context | — |

Every item is tagged with the **grammar points** it uses, so FSRS can schedule grammar-pattern reviews, and so the Tatoeba pipeline can find example sentences restricted to points already learned.

### Typing & answer checking (Turkish-specific requirements)
- **Letter bar:** an on-screen bar with ç ğ ı ö ş ü İ above the keyboard.
- **Accent near-misses:** if an answer is right except for a missing accent, it is marked "almost right" and the letter is named ("**ş**, not s"). It is **never** silently accepted: *kır/kir* and *kız/kiz* are different words.
- **Turkish case mapping everywhere** (`toLocaleLowerCase('tr')` / `toLocaleUpperCase('tr')`): I ↔ ı, İ ↔ i. This applies to answer checking, search and the form generator.
- **Accept valid variants:** dropped pronouns (*(Ben) geliyorum*) and the word orders Turkish allows. The exception is rule 3 in L18 (an object without the ending must be right before the verb).

### Set phrases
Aorist and other not-yet-taught forms appear in A1 only as **set phrases** (*teşekkür ederim, rica ederim, özür dilerim, görüşürüz, Türkçe konuşur musunuz?*). They:
- carry a **"phrase" badge** and are shown unsegmented (no · dots);
- are never used in "build the form" exercises;
- are linked from the A2 aorist rule card.

---

## 6. Resolved questions (2026-10-20, after review by a Turkish expert)
- **Order of the cases:** locative → ablative (Unit 2, with "to be") → dative → accusative. The dative introduces the mechanics of vowel-initial endings (y buffer, softening, vowel drop) with an easy meaning ("to"), so the accusative lesson can focus entirely on meaning (specificity).
- **Aorist in A1:** yes, as set phrases only (see "Set phrases" above, and the T1b survival-phrases pack in [VOCABULARY.md](VOCABULARY.md)). The aorist becomes the first A2 lesson.
- **Word bank vs typing:** word bank in Learn sessions, free typing from Practise sessions onwards, with the Turkish-specific requirements above.
