# TurkoLinguo app (prototype)

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router. Android first.

SDK 57 matches the Play Store version of Expo Go (October 2026). When Expo Go on the Play Store moves to SDK 58, upgrade with `npx expo install expo@^58.0.0 && npx expo install --fix`.

## Run it on your Android phone

1. Install **Expo Go** from the Play Store.
2. In this folder:
   ```bash
   npm start
   ```
3. Scan the QR code with Expo Go (phone and computer on the same Wi-Fi). If that doesn't connect, use `npx expo start --tunnel`.

Audio uses the phone's text-to-speech (`tr-TR`) as a placeholder until the native recordings exist. If you hear no Turkish voice, install one in Android Settings → Text-to-speech.

In the browser: `npm run web`, then open http://localhost:8081.

**Testing reviews without waiting:** in development builds the home screen ends with a *Developer* section. **+1 day** moves the app's clock forward, so cards become due. **Reset progress** clears everything.
Jump to an exercise while writing content: `/session/L10/practise?start=5`.

## Scripts

| Command | What it does |
|---|---|
| `npm run content` | validate `../content` and rebuild `src/content/content.json` (needs Python in WSL) |
| `npm test` | engine + grading tests (incl. every L10 answer checked against the engine) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## Layout

```
src/
  app/          screens (Expo Router): home, session/[lesson]/[session], grammar/[id]
  content/      content.json (generated, don't edit) + types + lookups
  engine/       turkish.ts (case mapping, vowels), morph.ts (suffix engine),
                check.ts (answer checking), feedback.ts (error diagnosis)
  session/      SessionRunner, CardView, ItemView (one component per exercise type), grade.ts
  progress/     model.ts (lesson status, FSRS cards, streak, daily new-card cap) + ProgressContext (AsyncStorage)
  review/       build.ts: turns due cards into exercises (fresh known word per rule card)
  ui/           theme, controls (buttons, chips, Turkish letter bar), Markdown, media
```

Content is authored in `../content/*.yaml` (format: `../docs/CONTENT_FORMAT.md`), never in `content.json`.
