import * as Speech from 'expo-speech';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { content } from '../content';
import type { Card, Item } from '../content/types';
import { Button } from '../ui/controls';
import { colors, radius, space } from '../ui/theme';
import { CardView } from './CardView';
import { FeedbackPanel } from './FeedbackPanel';
import type { ItemResult } from './grade';
import { ItemView } from './ItemView';

type Step = { kind: 'card'; card: Card } | { kind: 'item'; item: Item };
export type SessionKey = 'learn' | 'practise';

interface Props {
  lessonId: string;
  session: SessionKey;
  onExit: () => void;
  onPractise: () => void;
  /** Step to open first (for content authors: /session/L10/practise?start=5). */
  startAt?: number;
}

export function SessionRunner({ lessonId, session, onExit, onPractise, startAt = 0 }: Props) {
  const lesson = content.lessons[lessonId];
  const steps = useMemo<Step[]>(() => {
    const s = lesson.sessions[session];
    const cards = 'cards' in s ? s.cards.map((card): Step => ({ kind: 'card', card })) : [];
    return [...cards, ...s.items.map((item): Step => ({ kind: 'item', item }))];
  }, [lesson, session]);

  const [index, setIndex] = useState(startAt);
  const [result, setResult] = useState<ItemResult>();
  const [results, setResults] = useState<{ item: Item; result: ItemResult }[]>([]);

  const step = steps[index];
  const next = () => {
    Speech.stop();
    if (step?.kind === 'item' && result) setResults([...results, { item: step.item, result }]);
    setResult(undefined);
    setIndex(index + 1);
  };

  if (!step) return <Summary lessonId={lessonId} session={session} results={results} onExit={onExit} onPractise={onPractise} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} accessibilityLabel="Close session" hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(index / steps.length) * 100}%` }]} />
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView key={index} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step.kind === 'card' ? (
            <CardView card={step.card} />
          ) : (
            <ItemView item={step.item} locked={!!result} onResult={setResult} />
          )}
        </ScrollView>
        <View style={styles.bottom}>
          {step.kind === 'card' && <Button title="Continue" onPress={next} />}
          {result && <FeedbackPanel result={result} onContinue={next} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Summary({
  lessonId, session, results, onExit, onPractise,
}: { lessonId: string; session: SessionKey; results: { item: Item; result: ItemResult }[]; onExit: () => void; onPractise: () => void }) {
  const lesson = content.lessons[lessonId];
  const count = (s: ItemResult['status']) => results.filter((r) => r.result.status === s).length;
  const patterns = content.grammar[lesson.grammar]?.patterns ?? [];
  const strength = patterns
    .map((p) => {
      const rs = results.filter((r) => r.item.pattern === p.id);
      return { p, total: rs.length, right: rs.filter((r) => r.result.status === 'correct').length };
    })
    .filter((s) => s.total > 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.summaryTitle}>{session === 'learn' ? 'You can now say where things are!' : 'Practice done!'}</Text>
        <View style={styles.scoreRow}>
          <Score n={count('correct')} label="correct" color={colors.correct} />
          <Score n={count('almost')} label="almost" color={colors.almost} />
          <Score n={count('wrong')} label="to review" color={colors.wrong} />
        </View>
        {strength.length > 0 && (
          <View style={styles.strength}>
            <Text style={styles.strengthTitle}>Rule strength</Text>
            {strength.map(({ p, total, right }) => (
              <View key={p.id} style={{ gap: space(1) }}>
                <Text style={styles.strengthLabel}>{p.description}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(right / total) * 100}%`, backgroundColor: colors.correct }]} />
                </View>
              </View>
            ))}
          </View>
        )}
        {session === 'learn' && <Button title="Practise now · 5 min" onPress={onPractise} />}
        <Button title="Back to lessons" variant="secondary" onPress={onExit} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Score({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={styles.score}>
      <Text style={[styles.scoreN, { color }]}>{n}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingHorizontal: space(4), paddingVertical: space(3) },
  close: { fontSize: 22, color: colors.muted },
  progressTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  content: { padding: space(4), gap: space(4), paddingBottom: space(8) },
  bottom: { padding: space(4), paddingTop: 0 },
  summaryTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: space(4) },
  scoreRow: { flexDirection: 'row', gap: space(3) },
  score: { flex: 1, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(3), alignItems: 'center' },
  scoreN: { fontSize: 30, fontWeight: '800' },
  scoreLabel: { fontSize: 14, color: colors.muted },
  strength: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(4), gap: space(3) },
  strengthTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  strengthLabel: { fontSize: 15, color: colors.text },
});
