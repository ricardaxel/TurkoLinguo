import { StyleSheet, Text, View } from 'react-native';
import { Inline } from '../ui/Markdown';
import { Button } from '../ui/controls';
import { colors, radius, space } from '../ui/theme';
import type { ItemResult } from './grade';

const LOOK = {
  correct: { title: 'Correct!', fg: colors.correct, bg: colors.correctBg },
  almost: { title: 'Almost!', fg: colors.almost, bg: colors.almostBg },
  wrong: { title: 'Not quite', fg: colors.wrong, bg: colors.wrongBg },
};

interface Props {
  result: ItemResult;
  /** English meaning, shown after answering exercises with pictures (one line per sentence). */
  translation?: string;
  onContinue: () => void;
}

export function FeedbackPanel({ result, translation, onContinue }: Props) {
  const look = LOOK[result.status];
  const expected = result.expected;
  return (
    <View style={[styles.panel, { backgroundColor: look.bg, borderColor: look.fg }]}>
      <Text style={[styles.title, { color: look.fg }]}>{look.title}</Text>
      {!!result.message && <Inline text={result.message} style={styles.message} />}
      {result.status !== 'correct' && !!expected && !result.message?.toLocaleLowerCase('tr').includes(expected.toLocaleLowerCase('tr')) && (
        <Inline text={`Answer: **${expected}**`} style={styles.message} />
      )}
      {!!translation && (
        <View style={styles.translation} accessibilityLabel={`In English: ${translation}`}>
          <Text style={styles.translationLabel}>In English</Text>
          {translation.split('\n').map((line, i) => (
            <Text key={i} style={styles.translationText}>{line}</Text>
          ))}
        </View>
      )}
      <Button title="Continue" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 3, borderRadius: radius, padding: space(4), gap: space(3) },
  title: { fontSize: 20, fontWeight: '800' },
  message: { fontSize: 16, lineHeight: 23 },
  translation: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: space(2), gap: space(1) },
  translationLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  translationText: { fontSize: 15, lineHeight: 21, color: colors.text, fontStyle: 'italic' },
});
