// Prototype media: OpenMoji images are shown as the matching system emoji, objects without an emoji
// as our own SVG icons, composites arranged by their `compose` layout; audio is spoken with the
// device's text-to-speech (a placeholder until native recordings exist, see VOCABULARY.md §6).

import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { content } from '../content';
import { OwnIconView } from './icons';
import { resolveImage, type ImageNode } from './imageModel';
import { colors, radius, space } from './theme';

/** Draw one image node at `size` (the height of a single object). */
function Node({ node, size }: { node: ImageNode; size: number }) {
  switch (node.kind) {
    case 'emoji':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.82, lineHeight: size }}>{node.char}</Text>
        </View>
      );
    case 'icon':
      return <OwnIconView name={node.name} size={size} />;
    case 'missing':
      return <View style={styles.label}><Text style={styles.labelText}>{node.label}</Text></View>;
    case 'compose': {
      const [first, second] = node.items;
      switch (node.layout) {
        case 'on_top': {
          // the object sits on the surface: drawn smaller, in front, overlapping the top of the surface
          const f = size * 0.6;
          return (
            <View style={{ alignItems: 'center' }}>
              <View style={{ zIndex: 1, marginBottom: -size * 0.32 }}><Node node={first} size={f} /></View>
              <Node node={second} size={size} />
            </View>
          );
        }
        case 'in': {
          // the object pokes out of the container: drawn behind it, its top half visible
          const f = size * 0.6;
          return (
            <View style={{ minWidth: size, height: size + f * 0.38, alignItems: 'center' }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
                <Node node={first} size={f} />
              </View>
              <View style={{ position: 'absolute', bottom: 0 }}><Node node={second} size={size} /></View>
            </View>
          );
        }
        case 'at': {
          // someone/something in front of a place: the place behind, the object at its lower right
          const f = size * 0.55;
          return (
            <View style={{ paddingRight: f * 0.45, paddingBottom: f * 0.15 }}>
              <Node node={second} size={size} />
              <View style={{ position: 'absolute', right: 0, bottom: 0 }}><Node node={first} size={f} /></View>
            </View>
          );
        }
        case 'panels':
          return (
            <View style={styles.panels}>
              {node.items.map((n, i) => (
                <View key={i} style={[styles.panel, i > 0 && styles.panelDivider]}><Node node={n} size={size * 0.85} /></View>
              ))}
            </View>
          );
        default:
          return (
            <View style={styles.row}>
              {node.items.map((n, i) => <Node key={i} node={n} size={size * 0.85} />)}
            </View>
          );
      }
    }
  }
}

export function Picture({ id, size = 56 }: { id: string; size?: number }) {
  const label = id.split('.').pop()!.replace(/_/g, ' ');
  return (
    <View style={styles.picture} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Node node={resolveImage(id)} size={size} />
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
  picture: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space(1) },
  panels: { flexDirection: 'row', alignItems: 'flex-end' },
  panel: { paddingHorizontal: space(3) },
  panelDivider: { borderLeftWidth: 2, borderColor: colors.border },
  label: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: space(2), paddingVertical: space(1), backgroundColor: colors.surface },
  labelText: { fontSize: 15, color: colors.muted, fontStyle: 'italic' },
  speak: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: space(3), paddingVertical: space(2), alignSelf: 'flex-start' },
  speakText: { fontSize: 20 },
});
