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

export function FeedbackPanel({ result, onContinue }: { result: ItemResult; onContinue: () => void }) {
  const look = LOOK[result.status];
  return (
    <View style={[styles.panel, { backgroundColor: look.bg, borderColor: look.fg }]}>
      <Text style={[styles.title, { color: look.fg }]}>{look.title}</Text>
      {!!result.message && <Inline text={result.message} style={styles.message} />}
      {result.status !== 'correct' && !!result.expected && !result.message?.toLocaleLowerCase('tr').includes(result.expected.toLocaleLowerCase('tr')) && (
        <Inline text={`Answer: **${result.expected}**`} style={styles.message} />
      )}
      <Button title="Continue" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 3, borderRadius: radius, padding: space(4), gap: space(3) },
  title: { fontSize: 20, fontWeight: '800' },
  message: { fontSize: 16, lineHeight: 23 },
});
