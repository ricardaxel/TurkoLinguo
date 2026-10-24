# TurkoLinguo — Talk tasks: speaking with a native speaker (design v0.1)

Every **Practise** session ends with a short **talk task**: a 2–5 minute conversation with a Turkish speaker
(a friend, partner, colleague, neighbour, or someone on a video call), about the lesson's topic, using only what
the learner knows. Example: *"Talk with your mate about the weather."*

Talk tasks are **always optional**. Many learners have nobody to talk to, so a task can be skipped in one tap, and it
never blocks progress, scores, reviews or streaks.

---

## 1. Principles

1. **Known material only (for the learner).** The phrases the learner prepares and the questions the partner is asked
   to use are course sentences that the validator checks against the course position, like exercise items. The partner
   *will* say unknown words; that's fine, and the survival phrases (*Anlamadım. Tekrar eder misin? Daha yavaş…*) are
   always shown.
2. **The partner gets instructions too.** The native speaker isn't a teacher. A **partner card** in Turkish tells them
   what the learner knows, which questions to ask, and how to correct (slowly, one mistake per sentence).
3. **A concrete task with an end.** Not "chat in Turkish" but "find out three things", "make a plan", "guess the job".
   The learner knows when they're done.
4. **Swap roles.** Most tasks have two halves: the learner asks, then the learner answers, so they practise both
   producing and understanding.
5. **Honest and unscored.** The app can't hear the conversation, so a talk task never changes FSRS ratings or scores.
   The learner gives a quick self-rating, which is saved for their own history.
6. **Short.** Usually 2–3 minutes, and up to 5 minutes for checkpoints. One topic per task.

---

## 2. Task kinds

| `kind` | What the learner does | Typical lessons |
|---|---|---|
| `sounds` | reads words aloud; partner says which ones sound off / says one of a pair and the learner points | L1–L2 |
| `point_and_name` | points at things around them; asks and answers *Bu ne?* | L3–L4, L22 |
| `introduce` | introduces themselves; listens to the partner and repeats back | L5, L12, L23 |
| `interview` | asks the partner 3–5 set questions, notes the answers, then answers the same questions | most lessons |
| `guess` | yes/no questions to guess a job, an object, a person, a mime | L7, L15–16, L59 |
| `correct_me` | partner says wrong things about the learner; learner corrects them (*Hayır, … değilim*) | L6, L16, L31 |
| `hide_and_find` | partner hides an object; learner asks where it is | L10, L41 |
| `act_it` | partner gives commands, learner acts (and swaps) | L14, L18, L44 |
| `roleplay` | a scene: café, market, ticket, directions | L25, L28, L44–45 |
| `plan` | make a plan together (days, times, places, who with) | L26, L33–34, L40 |
| `tell` | tells a short story or what happened; partner asks follow-ups | L30, L46–50 |
| `listen_report` | partner tells something short; learner retells it (recognition-heavy lessons) | L47, L60 |
| `free_chat` | checkpoints: a longer chat mixing the unit's topics, from a list of prompts | C1–C13 |

---

## 3. The app flow

### 3.1 At the end of a Practise session
1. The learner answers the last item, and the session result is **saved straight away**, before the talk task, so
   closing the app or skipping never loses anything.
2. An **invitation card** appears:
   > 🗣 **Talk task** · ~3 min
   > *Talk with your mate about the weather.*
   > [ Let's talk ]   [ Save for later ]   [ Skip: no one around ]
3. **Skip** goes to the session summary. **Save for later** adds the task to the *Talk list* and then goes to the
   summary. Neither one changes anything else.
4. **Let's talk** opens the talk screen (§3.2). When the learner finishes or backs out, the summary follows.

The invitation is never shown in reviews, and only once per lesson: a second Practise of the same lesson shows it only
if the task isn't done yet.

### 3.2 The talk screen
- **Task** (English): one sentence, plus a short *how* (2–4 numbered steps).
- **Get ready**: 3–6 useful phrases, each with audio and English, from the lesson and earlier lessons.
- **If you're stuck** (collapsed): the survival phrases, once they're known (T1b, after L3): *Anlamadım. Tekrar eder
  misiniz? Daha yavaş konuşur musunuz? Bu ne demek?*
- **Goals**: 2–4 tick boxes, for example "☐ I asked about yesterday's weather" and "☐ I understood my partner's answer".
- **Show to your partner**: a full-screen card **in Turkish**, in big text, to hand the phone over or share on a call
  (§4). It also has a *Share as text* button, for a partner who is far away.
- **Done** → *How did it go?* 😀 Easy / 🙂 OK / 😅 Hard. If the learner picks **Hard**, the app suggests: "Practise
  this lesson again?" (it doesn't schedule anything by itself).

### 3.3 Settings and the Talk list
- **The first invitation** asks once: *"Do you have someone who speaks Turkish (in person or on a call)?"*
  - **Yes, show talk tasks**
  - **Not now**: hide them. The tasks still collect in the Talk list.
- **Setting** (on the home screen next to the developer buttons, or in a future settings screen):
  *Talk tasks: Show at the end of practice / Don't show*. **Don't show** hides every invitation.
- **Talk list** (a home screen row, shown only when it isn't empty): saved and skipped tasks of finished lessons, most
  recent first, plus a "🗣 12 talks done" counter. Any task can be opened from there at any time, so skipping never
  loses a task, and a learner who meets a Turkish speaker later can catch up.
- A Practise session counts as **complete without its talk task**, in the lesson list, Today, checkpoints and reviews.

### 3.4 Solo fallback (later, not now)
The fallback is a **"Say it to yourself"** mode, which records the learner answering the partner questions (playback
only, nothing is graded). It needs microphone permission and `expo-av`, so it's left for later. For now **Skip** is the
solo path.

---

## 4. The partner card (Turkish)

The same frame every time, with a task-specific middle. It talks to the native speaker as *siz*: the partner may be an older neighbour or colleague.

> **Merhaba!** Karşınızdaki kişi Türkçe öğreniyor ve sizinle birkaç dakika konuşmak istiyor.
> - Lütfen **yavaş** ve **kısa cümlelerle** konuşun.
> - Hata yaparsa düzeltin, ama her cümlede **sadece bir** hatayı.
> - Anlamazsa tekrar edin ya da başka bir kelime kullanın.
>
> **Bugünkü konu:** hava durumu.
> **Bildikleri:** geçmiş zaman (*geldim, gitmedim, geldin mi?*), 'idi' ile geçmiş (*soğuktu, evdeydim*), hava ile ilgili kelimeler.
> **Ona sorabileceğiniz sorular:**
> 1. Bugün hava nasıl?
> 2. Dün hava nasıldı?
> 3. Dün yağmur yağdı mı?
> 4. Kışın burada kar yağar mı? ← only if known; the validator checks this
>
> Sonra o size sorsun. Teşekkürler! 🙏

- **Bildikleri** ("what they know") uses plain examples, not notation. Natives don't know *-DI*, but they recognise
  *geldim, gitmedim*.
- The fixed frame lives in one place (`content/talk/partner_frame.yaml`). Each task supplies only `topic`, `knows`
  and the questions.
- The frame and every partner text go through the same Turkish expert review as the lessons.

---

## 5. Content format

A `talk` block at the end of a lesson's `practise` session (or of a checkpoint):

```yaml
sessions:
  practise:
    items: [...]
    talk:
      id: L32.talk                       # unique, <lesson>.talk
      kind: interview                    # §2
      minutes: 3
      title: "Talk with your mate about the weather"
      how:                               # 2–4 steps, English
        - "Ask your partner about the weather today and yesterday."
        - "Then let them ask you the same questions."
        - "Bonus: where were you last weekend? Was it cold?"
      phrases: [s.L32.010, s.L32.011, s.L31.004, s.T20.002]   # sentence IDs, shown with audio + English
      goals:
        - "I asked about today's and yesterday's weather"
        - "I understood my partner's answers"
        - "I said where I was last weekend"
      partner:
        topic: "hava durumu"                                        # Turkish, free text for the native speaker
        knows: "geçmiş zaman (geldim, gitmedim, geldin mi?), 'idi' ile geçmiş (soğuktu, evdeydim), hava ile ilgili kelimeler"
        questions: [s.L32.020, s.L32.021, s.L31.015]                # sentence IDs: the learner must understand them
```

| Field | Required | Rule |
|---|---|---|
| `id`, `kind`, `title`, `how`, `goals` | ✓ | `goals` 2–4 items, `how` 2–4 steps |
| `minutes` | ✓ | 2–5 (checkpoints up to 8) |
| `phrases` | ✓ | 3–6 sentence IDs, **known by course position** (the same check as items) |
| `partner.topic`, `partner.knows` | ✓ | Turkish, NFC; no known-material check (it's for the native) |
| `partner.questions` | ✓ | 2–5 sentence IDs, **known by course position** |
| `requires` |  | `[survival]` to show the survival phrases (default: on once T1b is unlocked) |

New sentences for talk tasks go in `content/sentences/talk.yaml` (`s.talk.L32.001`…), with planned audio in
`assets.yaml` like other sentences.

### Validator
- Every lesson's `practise` has a `talk`: a **warning** normally, an **error** in release mode.
- `phrases` and `partner.questions` exist and are known material; IDs are unique; the field limits in the table above
  are respected; Turkish strings are NFC.

### App model (`progress/model.ts`)
```ts
Progress.talk: Record<string /* talk id */, { status: 'done' | 'saved' | 'skipped'; rating?: 'easy' | 'ok' | 'hard'; at: string }>
Progress.settings.talk: 'ask' | 'on' | 'off'   // 'ask' until the first invitation is answered
```
`done` wins over `saved` and `skipped`; doing a task again just updates `rating` and `at`. No effect on FSRS.

---

## 6. Catalogue: one task per lesson

The ideas below are drafts. When a task is written, every phrase and partner question must pass the known-material
check, so swap in a simpler question where one doesn't. The ★ marks the user's own example.

### A1
| Lesson | Kind | Task |
|---|---|---|
| L1 | `sounds` | **Say my name**: read 10 international words (*taksi, otel, müzik…*) to your partner; they repeat the ones that sounded off. Ask them to spell your name the Turkish way. |
| L2 | `sounds` | **Which one did I say?**: your partner says one word of each pair (*kır / kir, kız / kaz, öl / ol, kül / kul, çam / cam*); you point. Then swap. |
| L3 | `point_and_name` | **What's this?**: point at 5 things around you: *Bu ne? — Bu bir kalem.* Swap. First use of *Anlamadım* / *Bu ne demek?* |
| L4 | `point_and_name` | **More than one**: your partner names a thing; you say the plural (*kalem → kalemler*). Swap. |
| L5 | `introduce` | **Who are you?**: say 3 things about yourself (*Ben İngilizim. Öğretmenim.*). Listen to your partner and repeat back (*Sen Türksün. Doktorsun.*). |
| L6 | `correct_me` | **That's wrong!**: your partner says wrong things about you (*Sen Fransızsın.*); correct them (*Hayır, Fransız değilim. İngilizim.*). |
| L7 | `guess` | **Guess the job**: your partner thinks of a job; you guess with yes/no questions (*Doktor musun? Öğretmen misin?*). Swap. |
| L8 | `interview` | **What's in the fridge?**: ask what there is in their kitchen or bag (*Süt var mı? Çay var mı?*). Swap. |
| L9 | `interview` | **Describe and count**: describe 3 things (*büyük bir masa, iki kırmızı kalem*); your partner says numbers 1–10 and you write them down. |
| L10 | `hide_and_find` | **Where's my phone?**: your partner hides an object; ask (*Telefon nerede? Masada mı? Çantada mı?*). |
| L11 | `interview` | **Where are you?**: a pretend phone call: *Neredesin? — Evdeyim.* Then ask where people they know are (*Ahmet Ankara'da mı?*). |
| L12 | `introduce` | **Where are you from?**: *Neredensin?*; ask about their family's cities (*İzmir'den mi?*). |
| L13 | `interview` | **Me too!**: swap facts and react: *Ben öğretmenim. — Ben de!* / *…ama ben doktorum.* |
| L14 | `act_it` | **Do what I say**: your partner gives commands (*Otur! Kalk! Bak! Gel!*); act them. Swap. |
| L15 | `guess` | **What am I doing?**: mime an action; your partner guesses (*Kitap okuyorsun!*). Swap. |
| L16 | `correct_me` | **No, I'm not!**: your partner guesses your mime wrongly; correct them (*Hayır, yemiyorum. İçiyorum.*). |
| L17 | `interview` | **Where are you going?**: say where you're going today (*Markete gidiyorum.*); ask them (*Nereye gidiyorsun?*). |
| L18 | `act_it` | **Pass the pen**: give each other commands with objects (*Kalemi al! Suyu iç! Kitabı oku!*). Swap. |
| L19 | `point_and_name` | **My things**: show your things or photos (*Bu benim telefonum.*); ask about theirs (*Bu senin çantan mı?*). |
| L20 | `interview` | **Our place**: talk about your home or class (*Evimiz küçük. Sizin eviniz büyük mü?*). |
| L21 | `guess` | **Whose is it?**: put things together; ask (*Bu kimin kalemi? — Ayşe'nin.*). |
| L22 | `point_and_name` | **Compound hunt**: find 5 compound names around you or in the street (*yatak odası, otobüs durağı, Türk kahvesi*). |
| L23 | `interview` | **Family and pets**: *Kardeşin var mı? Kedin var mı? İki kardeşim var.* |
| L24 | `interview` | **Where's your…?**: *Telefonun nerede? — Çantamda. Kardeşin nerede? — İstanbul'da.* |
| L25 | `roleplay` | **At the market**: your partner is the seller (*Bir kilo domates, lütfen. Kaç lira?*). Pay, count the change. |
| L26 | `plan` | **My week**: *Pazartesi ne yapıyorsun? Saat kaçta?* Find a time you're both free. |
| L27 | `interview` | **How do you get there?**: *Okula otobüsle gidiyorum. Sen? Kiminle?* |
| L28 | `roleplay` | **Café order**: *Şekerli mi, şekersiz mi? Sütlü bir kahve, lütfen.* Plus *Nerelisin?* |
| L29 | `interview` | **Which is bigger?**: compare cities, foods, animals (*İstanbul Ankara'dan büyük.*). Agree or disagree. |
| L30 | `tell` | **Yesterday**: *Dün ne yaptın?* Say 3 things you did; ask your partner. |
| L31 | `interview` | **Did you…?**: a yes/no interview about yesterday (*Dün kahve içtin mi? Spor yaptın mı?*). |
| L32 ★ | `interview` | **Talk with your mate about the weather**: *Bugün hava nasıl? Dün hava nasıldı? Soğuk muydu?* Bonus: *Geçen hafta sonu neredeydin?* (T20 unlocks after L31.) |
| L33 | `plan` | **Tomorrow**: *Yarın ne yapacaksın? Yarın yağmur yağacak mı?* Make a weekend plan. |
| L34 | `plan` | **What do you want to do?**: plan an outing (*Parka gitmek istiyorum. Antalya'ya gitmek istiyorum. Sen ne yapmak istiyorsun?*). |
| L35 | `interview` | **To-do list**: *Bugün ne yapman lazım? — Markete gitmem lazım.* Compare lists. |

### A1 checkpoints (`free_chat`, 4–6 min)
| Checkpoint | Task |
|---|---|
| C1 | **Meet someone**: greetings, name, nationality, job, *Nasılsın?*, goodbye. |
| C2 | **Around the house**: where things and people are, where you're from. |
| C3 | **A day in the life**: what you're doing now, where you're going, commands. |
| C4 | **Show your family**: photos, whose things, who has what. |
| C5 | **Out and about**: shopping, times and days, transport, café. |
| C6 | **Last weekend**: what you did, where you were, the weather. |
| C7 | **Final A1 chat**: past, present and future plans, what you want and need to do. |

### A2 (for the lesson-writing sessions)
| Lesson | Kind | Task |
|---|---|---|
| L36 | `interview` | **Habits**: *Sabahları ne yaparsın? Çay içer misin?* and an offer (*Çay alır mısın?*). |
| L37 | `interview` | **Would you eat this?**: food likes and dislikes (*Bunu yer misin? — Yemem!*). |
| L38 | `interview` | **What can you do?**: *Yüzebilir misin? Türkçe konuşabiliyorum ama yavaş.* |
| L39 | `interview` | **Advice for a visitor**: *İstanbul'da ne yapmalıyım? Nereye gitmeliyim?* |
| L40 | `plan` | **Let's…**: *Ne yapalım? Sinemaya gidelim mi?* Agree on a plan. |
| L41 | `hide_and_find` | **Draw my room**: describe your room (*Masanın üstünde bir lamba var.*); your partner draws it. |
| L42 | `guess` | **Mine or yours?**: *Benimki kırmızı, seninki ne renk?* |
| L43 | `plan` | **Before and after**: *Yemekten sonra ne yapıyorsun? Saat beşe kadar…* |
| L44 | `roleplay` | **Show me the way**: your partner asks the way to a place near you; give directions. Swap. |
| L45 | `roleplay` | **Which floor?**: in a building or a train: *Üçüncü kat. İkinci sokaktan sağa.* |
| L46 | `tell` | **When I was little**: *Eskiden ne yapıyordun? Nerede oturuyordun?* |
| L47 | `listen_report` | **Did you hear?**: your partner tells you a piece of news; retell it with *-mIş* (*Ahmet evlenmiş!*). |
| L48 | `interview` | **At the same time**: *Yemek yerken televizyon izler misin?* |
| L49 | `interview` | **As soon as…**: *Eve gelince ne yaparsın?* |
| L50 | `tell` | **My morning, in order**: *Kahvaltı yaptıktan sonra…, çıkmadan önce…* |
| L51 | `interview` | **What if?**: *Yarın hava güzelse ne yaparsın? Yağmur yağarsa?* |
| L52 | `interview` | **Wishes**: *Keşke…* What would you like to change? |
| L53 | `tell` | **How do you make tea?**: steps with *-Ip / -ArAk*. |
| L54 | `interview` | **Likes and fears**: *Ne yapmayı seversin? Nelerden korkarsın?* |
| L55 | `guess` | **Which one?**: describe something with *-(y)An* (*mutfakta duran, kırmızı olan…*); your partner guesses. |
| L56 | `interview` | **By yourself?**: *Yemeğini kendin mi yaparsın?* |
| L57 | `interview` | **Never ever**: *Hiç … yedin mi? — Hayır, hiç yemedim.* |
| L58 | `interview` | **Compare two places**: your country and Turkey (*… kadar sıcak değil*). |
| L59 | `guess` | **Guess who**: describe a famous person; your partner guesses. Swap. |
| L60 | `listen_report` | **The film I saw** (recognition): your partner tells you about something they did or saw; you retell it simply. |
| L61 | `interview` | **Why Turkish?**: *Türkçe öğreniyorum çünkü… Bu yüzden…* |
| L62 | `interview` | **What do you think?**: *Bence…, sence?* on a light topic (city or village, tea or coffee). |
| L63 | `interview` | **Either / or**: *Çay mı kahve mi? — Hem çay hem kahve! / Ne çay ne kahve!* Choose for each other. |
| L64 | `plan` | **Next year**: plans and promises. The final A2 chat. |

A2 checkpoints C8–C13 get a `free_chat` over the unit's topics, like the A1 ones.

---

## 7. Integration steps

1. Schema and validator: the `talk` block, the rules in §5, and the partner frame file.
2. App: the invitation card at the end of Practise (after saving), the talk screen, the partner card with *Share as
   text*, the first-time question, the setting, the Talk list row and `Progress.talk` / `settings.talk`.
3. Tests: model (statuses, `done` wins, no FSRS effect); UI (Skip and Save go to the summary; the setting "off" hides
   the invitation; the session counts as complete without the talk task); content (each phrase and question is known).
4. Content: `talk` blocks for L1–L35 and C1–C7, plus `content/sentences/talk.yaml`. Turkish review of every partner
   text and question.
5. `CURRICULUM_A2.md` and `docs/CONTENT_FORMAT.md` point to this file, so that A2 lessons include a talk task from the
   start.

---

## 8. Implementation notes (A1 build, 2026-10-24)

- **Content:** L1–L35 and C1–C7 have a `talk` block; the 58 new sentences are in `content/sentences/talk.yaml`
  (`s.talk.<lesson>.NNN`, questions `native_required`), with planned audio. The partner frame is
  `content/talk/partner_frame.yaml`, which also lists the learner's survival phrases (`survival:`, the T1b siz forms).
- **Survival phrases** are shown once T1b is unlocked (after L3); L3 has `requires: [survival]`, so they appear on its
  task too. The validator rejects `requires: [survival]` before the lesson that unlocks them.
- **Checkpoints** show the invitation at the end, like Practise. Reviews and Learn never do.
- **Let's talk** also records the task as `saved`, so a learner who backs out still finds it in the Talk list; *Done*
  replaces it. With talk tasks set to *Don't show* (or *Not now*), a finished task goes to the Talk list as `skipped`.
- **Share as text** uses React Native's `Share` (`expo-sharing` only shares files). On the web without the Web Share
  API, the card shows the text to copy instead.
- **Validator:** `partner.topic` / `partner.knows` may not contain course notation (a suffix written on its own, like
  *-ydı* or *-(y)DI*).
- **Sounds tasks (L1, L2):** at that point the learner knows only single words, so the partner "questions" are the
  words the partner says (*Merhaba!, kız, kaz…*).
