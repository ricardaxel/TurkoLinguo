import { player } from '../ui/player';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { content } from '../content';
import type { Card, Item, Pattern } from '../content/types';
import type { SessionResult } from '../progress/model';
import { Button } from '../ui/controls';
import { colors, radius, space } from '../ui/theme';
import { CardView } from './CardView';
import { FeedbackPanel } from './FeedbackPanel';
import type { ItemResult } from './grade';
import { ItemView } from './ItemView';
import { displayAnswer, translationFor } from './translation';

export type Step = { kind: 'card'; card: Card } | { kind: 'item'; item: Item };

export interface SummaryAction {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface Props {
  steps: Step[];
  onExit: () => void;
  /** Called once, when the last step is done. */
  onComplete: (results: SessionResult[]) => void;
  /** Shown on the summary; may depend on the results (e.g. a checkpoint pass / fail). */
  summaryTitle: string | ((results: SessionResult[]) => string);
  summaryActions: SummaryAction[];
  /** Step to open first (for content authors: /session/L10/practise?start=5). */
  startAt?: number;
}

const patternIndex: Record<string, Pattern> = Object.fromEntries(
  Object.values(content.grammar).flatMap((g) => (g.patterns ?? []).map((p) => [p.id, p])),
);

export function SessionRunner({ steps, onExit, onComplete, summaryTitle, summaryActions, startAt = 0 }: Props) {
  const [index, setIndex] = useState(startAt);
  // one answer per step: going back shows the earlier answer (locked) and never counts it twice
  const [answers, setAnswers] = useState<Record<number, ItemResult>>({});
  const completed = useRef(false);

  const step = steps[index];
  const result = answers[index];
  const resultsOf = (all: Record<number, ItemResult>): SessionResult[] =>
    steps.flatMap((s, i) => (s.kind === 'item' && all[i] ? [{ item: s.item, status: all[i].status }] : []));
  const results = resultsOf(answers);

  const answer = (r: ItemResult) => setAnswers((a) => (a[index] ? a : { ...a, [index]: r }));
  const next = () => {
    player.stop();
    if (index + 1 >= steps.length && !completed.current) {
      completed.current = true;
      onComplete(results);
    }
    setIndex(index + 1);
  };
  const previous = () => {
    player.stop();
    setIndex(Math.max(0, index - 1));
  };
  const canGoBack = index > 0;

  if (!step) {
    const title = typeof summaryTitle === 'function' ? summaryTitle(results) : summaryTitle;
    return <Summary title={title} results={results} actions={summaryActions} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel="Close session" hitSlop={12}>
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
            <ItemView item={step.item} locked={!!result} onResult={answer} />
          )}
        </ScrollView>
        <View style={styles.bottom}>
          {step.kind === 'card' && (
            <View style={styles.navRow}>
              {canGoBack && <Button title="Previous" variant="secondary" onPress={previous} style={styles.navPrev} />}
              <Button title="Continue" onPress={next} style={styles.navNext} />
            </View>
          )}
          {step.kind === 'item' && result && (
            <FeedbackPanel
              result={{ ...result, expected: displayAnswer(result.expected) }}
              translation={translationFor(step.item)}
              onContinue={next}
              onPrevious={canGoBack ? previous : undefined}
            />
          )}
          {step.kind === 'item' && !result && canGoBack && (
            <Button title="Previous" variant="secondary" onPress={previous} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Summary({ title, results, actions }: { title: string; results: SessionResult[]; actions: SummaryAction[] }) {
  const count = (s: SessionResult['status']) => results.filter((r) => r.status === s).length;
  const byPattern = new Map<string, { total: number; right: number }>();
  for (const r of results) {
    if (!r.item.pattern || !patternIndex[r.item.pattern]) continue;
    const s = byPattern.get(r.item.pattern) ?? { total: 0, right: 0 };
    s.total += 1;
    if (r.status === 'correct') s.right += 1;
    byPattern.set(r.item.pattern, s);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <View style={styles.scoreRow}>
          <Score n={count('correct')} label="correct" color={colors.correct} />
          <Score n={count('almost')} label="almost" color={colors.almost} />
          <Score n={count('wrong')} label="to review" color={colors.wrong} />
        </View>
        {byPattern.size > 0 && (
          <View style={styles.strength}>
            <Text style={styles.strengthTitle}>Rule strength</Text>
            {[...byPattern].map(([id, { total, right }]) => (
              <View key={id} style={{ gap: space(1) }}>
                <Text style={styles.strengthLabel}>{patternIndex[id].description}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(right / total) * 100}%`, backgroundColor: colors.correct }]} />
                </View>
              </View>
            ))}
          </View>
        )}
        {actions.map((a) => <Button key={a.title} title={a.title} variant={a.variant} onPress={a.onPress} />)}
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
  bottom: { padding: space(4), paddingTop: 0, gap: space(2) },
  navRow: { flexDirection: 'row', gap: space(3) },
  navPrev: { flex: 1 },
  navNext: { flex: 2 },
  summaryTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: space(4) },
  scoreRow: { flexDirection: 'row', gap: space(3) },
  score: { flex: 1, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(3), alignItems: 'center' },
  scoreN: { fontSize: 30, fontWeight: '800' },
  scoreLabel: { fontSize: 14, color: colors.muted },
  strength: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(4), gap: space(3) },
  strengthTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  strengthLabel: { fontSize: 15, color: colors.text },
});
