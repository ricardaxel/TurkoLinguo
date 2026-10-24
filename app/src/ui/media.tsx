// Prototype media: OpenMoji images are shown as the matching system emoji, objects without an emoji
// as our own SVG icons, composites arranged by their `compose` layout; audio is spoken with the
// device's text-to-speech (a placeholder until native recordings exist, see VOCABULARY.md §6).

import { useEffect, useId } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { content } from '../content';
import { OwnIconView } from './icons';
import { resolveImage, type ImageNode } from './imageModel';
import { NORMAL_RATE, player, SLOW_RATE, usePlayer, type Utterance } from './player';
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

/** What to say for an audio ID or a plain text, at the given speed. */
export function utterancesFor(audioIdOrText: string, rate: number): Utterance[] {
  const isId = audioIdOrText.startsWith('aud.');
  const { text, slowFirst } = isId ? audioText(audioIdOrText) : { text: audioIdOrText, slowFirst: false };
  // "slow, then normal" assets: the slow button just says it slowly once
  return slowFirst && rate !== SLOW_RATE ? [{ text, rate: SLOW_RATE }, { text, rate }] : [{ text, rate }];
}

/**
 * Audio button: one pill with two parts. The main part plays the audio, then pauses and resumes it;
 * the 🐢 part, always offered, plays it slowly.
 */
export function SpeakButton({ audio, caption }: { audio: string; caption?: string }) {
  const key = useId();
  const { owner, status } = usePlayer();
  const mine = owner === key;
  const playing = mine && status === 'playing';
  const paused = mine && status === 'paused';
  const text = audioCaption(audio);

  // leaving the screen stops this button's audio
  useEffect(() => () => {
    if (player.getState().owner === key) player.stop();
  }, [key]);

  const onMain = () => {
    if (playing) player.pause();
    else if (paused) player.resume();
    else player.play(key, utterancesFor(audio, NORMAL_RATE));
  };
  const icon = playing ? '⏸' : paused ? '▶' : '🔊';
  const action = playing ? 'Pause' : paused ? 'Resume' : 'Play';

  return (
    <View style={[styles.speak, mine && styles.speakActive]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action}: ${text}`}
        onPress={onMain}
        style={({ pressed }) => [styles.speakPart, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.speakText}>{caption ? `${icon}  ${caption}` : icon}</Text>
      </Pressable>
      <View style={styles.speakDivider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play slowly: ${text}`}
        onPress={() => player.play(key, utterancesFor(audio, SLOW_RATE))}
        style={({ pressed }) => [styles.speakPart, pressed && { opacity: 0.6 }]}
        hitSlop={4}
      >
        <Text style={styles.speakText}>🐢</Text>
      </Pressable>
    </View>
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
  speak: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, alignSelf: 'flex-start', overflow: 'hidden' },
  speakActive: { borderColor: colors.primary },
  speakPart: { paddingHorizontal: space(3), paddingVertical: space(2), justifyContent: 'center' },
  speakDivider: { width: 1, backgroundColor: colors.border },
  speakText: { fontSize: 20 },
});
