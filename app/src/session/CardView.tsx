import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { content, word } from '../content';
import type { Card } from '../content/types';
import { inflect } from '../engine/morph';
import { endsInVowel, endsInVoiceless, isFrontVowel, lastChar, lastVowel } from '../engine/turkish';
import { Markdown } from '../ui/Markdown';
import { audioCaption, SpeakButton } from '../ui/media';
import { colors, radius, space } from '../ui/theme';

/** Tap a word to see its last vowel and the ending it takes (L10 card 3). */
function VowelChartTap({ words }: { words: string[] }) {
  const [active, setActive] = useState<string>();
  const w = active ? word(active) : undefined;
  const v = w ? lastVowel(w.lemma)! : '';
  const idx = w ? w.lemma.lastIndexOf(v) : -1;
  return (
    <View style={styles.widget}>
      <Text style={styles.widgetTitle}>Tap a word to find its last vowel</Text>
      <View style={styles.row}>
        {words.map((id) => (
          <Pressable key={id} onPress={() => setActive(id)} style={[styles.wordChip, active === id && styles.wordChipOn]}>
            <Text style={styles.wordText}>{word(id).lemma}</Text>
          </Pressable>
        ))}
      </View>
      {w && (
        <Text style={styles.result}>
          {w.lemma.slice(0, idx)}
          <Text style={styles.mark}>{v}</Text>
          {w.lemma.slice(idx + 1)}
          {`  →  ${v} is ${isFrontVowel(v) ? 'front' : 'back'}  →  `}
          <Text style={styles.bold}>{inflect(w, ['sfx.loc'], content.suffixes)}</Text>
        </Text>
      )}
    </View>
  );
}

/** Reveal the vowel step, then the consonant step, then the result (L10 card 5). */
function SuffixSteps({ words, suffix }: { words: string[]; suffix: string }) {
  const [step, setStep] = useState<Record<string, number>>({});
  return (
    <View style={styles.widget}>
      <Text style={styles.widgetTitle}>Tap each word to build it step by step</Text>
      {words.map((id) => {
        const w = word(id);
        const n = step[id] ?? 0;
        const v = lastVowel(w.lemma)!;
        const form = inflect(w, [suffix], content.suffixes);
        const ending = form.slice(w.lemma.length);
        const lines = [
          `vowel: last vowel **${v}** → **${isFrontVowel(v) ? 'e' : 'a'}**`,
          `consonant: ends in ${endsInVowel(w.lemma) ? 'a vowel' : `**${lastChar(w.lemma)}**`} → **${endsInVoiceless(w.lemma) ? 't' : 'd'}**`,
          `**${w.lemma}·${ending}**`,
        ];
        return (
          <Pressable key={id} onPress={() => setStep({ ...step, [id]: Math.min(n + 1, 3) })} style={styles.stepRow}>
            <Text style={styles.wordText}>{w.lemma}</Text>
            <View style={{ flex: 1 }}>
              {lines.slice(0, n).map((l, i) => <Markdown key={i} body={l} />)}
              {n < 3 && <Text style={styles.tapHint}>tap ›</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CardView({ card }: { card: Card }) {
  const params = (card.interactive?.params ?? {}) as { words?: string[]; suffix?: string };
  return (
    <View style={{ gap: space(4) }}>
      {card.title && <Text style={styles.title}>{card.title}</Text>}
      <Markdown body={card.body} />
      {!!card.audio?.length && (
        <View style={styles.row}>
          {card.audio.map((a) => <SpeakButton key={a} audio={a} caption={audioCaption(a)} />)}
        </View>
      )}
      {card.interactive?.component === 'vowel_chart_tap' && <VowelChartTap words={params.words ?? []} />}
      {card.interactive?.component === 'suffix_steps' && <SuffixSteps words={params.words ?? []} suffix={params.suffix!} />}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  widget: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(3), gap: space(3) },
  widgetTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  wordChip: { borderWidth: 2, borderColor: colors.border, borderRadius: 8, paddingHorizontal: space(3), paddingVertical: space(2) },
  wordChipOn: { borderColor: colors.accent, backgroundColor: '#E8F1FA' },
  wordText: { fontSize: 18, fontWeight: '600', color: colors.text, minWidth: 72 },
  result: { fontSize: 18, color: colors.text },
  mark: { backgroundColor: colors.highlight, fontWeight: '700' },
  bold: { fontWeight: '700' },
  stepRow: { flexDirection: 'row', gap: space(3), paddingVertical: space(2), borderTopWidth: 1, borderColor: colors.border },
  tapHint: { color: colors.accent, fontSize: 15 },
});
