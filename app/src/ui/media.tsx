// Prototype media: OpenMoji images are shown as the matching system emoji, other images as labels,
// and audio is spoken with the device's text-to-speech (a placeholder until native recordings exist,
// see VOCABULARY.md §6).

import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { content } from '../content';
import { colors, radius, space } from './theme';

type Glyph = { emoji: string } | { label: string };

export function glyphs(imageId: string): Glyph[] {
  const asset = content.assets[imageId];
  if (!asset) return [{ label: imageId }];
  if (asset.derived_from?.length) return asset.derived_from.flatMap(glyphs);
  const hex = asset.source === 'openmoji' ? /([0-9A-F]{4,6})\.svg$/i.exec(asset.file ?? '')?.[1] : undefined;
  if (hex) return [{ emoji: String.fromCodePoint(parseInt(hex, 16)) }];
  return [{ label: imageId.split('.').pop()!.replace(/_/g, ' ') }];
}

export function Picture({ id, size = 56 }: { id: string; size?: number }) {
  return (
    <View style={styles.picture}>
      {glyphs(id).map((g, i) =>
        'emoji' in g ? (
          <Text key={i} style={{ fontSize: size }}>{g.emoji}</Text>
        ) : (
          <View key={i} style={styles.label}><Text style={styles.labelText}>{g.label}</Text></View>
        ),
      )}
    </View>
  );
}

/** Text to speak for an audio ID: the sentence for aud.own.s.*, otherwise the asset's text. */
function audioText(audioId: string): { text: string; slowFirst: boolean } {
  const sentenceId = audioId.replace(/^aud\.own\./, '');
  if (content.sentences[sentenceId]) return { text: content.sentences[sentenceId].tr, slowFirst: false };
  const raw = content.assets[audioId]?.text ?? '';
  return { text: raw.replace(/\s*\([^)]*\)/g, ''), slowFirst: /slow/.test(raw) };
}

/** Short caption for an audio button: the sentence or text it plays. */
export const audioCaption = (audioIdOrText: string) =>
  audioIdOrText.startsWith('aud.') ? audioText(audioIdOrText).text : audioIdOrText;

export function speak(audioIdOrText: string, rate = 0.9) {
  const isId = audioIdOrText.startsWith('aud.');
  const { text, slowFirst } = isId ? audioText(audioIdOrText) : { text: audioIdOrText, slowFirst: false };
  Speech.stop();
  if (slowFirst) Speech.speak(text, { language: 'tr-TR', rate: 0.5 });
  Speech.speak(text, { language: 'tr-TR', rate });
}

export function SpeakButton({ audio, label = '🔊', slow = false }: { audio: string; label?: string; slow?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play: ${audioCaption(audio)}`}
      onPress={() => speak(audio, slow ? 0.5 : 0.9)}
      style={({ pressed }) => [styles.speak, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.speakText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  picture: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(2), flexWrap: 'wrap' },
  label: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: space(2), paddingVertical: space(1), backgroundColor: colors.surface },
  labelText: { fontSize: 15, color: colors.muted, fontStyle: 'italic' },
  speak: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: space(3), paddingVertical: space(2), alignSelf: 'flex-start' },
  speakText: { fontSize: 20 },
});
