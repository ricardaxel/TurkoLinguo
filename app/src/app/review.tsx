import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cardsForReview } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { buildReview } from '../review/build';
import { SessionRunner } from '../session/SessionRunner';
import { Button } from '../ui/controls';
import { colors, space } from '../ui/theme';

const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function ReviewScreen() {
  const { loaded } = useProgress();
  // Saved progress loads asynchronously; build the session only once it's there.
  return loaded ? <Review /> : null;
}

function Review() {
  const { progress, now, finishReview } = useProgress();
  // Build once; later progress updates must not reshuffle the running session.
  const [session] = useState(() => buildReview(progress, cardsForReview(progress, now())));

  if (!session.items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nothing to review right now</Text>
        <Text style={styles.emptyText}>Finish a lesson, or come back later: reviews arrive just before you&apos;d forget.</Text>
        <Button title="Back" onPress={exit} />
      </View>
    );
  }

  return (
    <SessionRunner
      steps={session.items.map((item) => ({ kind: 'item', item }))}
      onExit={exit}
      onComplete={(results) => finishReview(results, session.cardFor)}
      summaryTitle="Review done!"
      summaryActions={[{ title: 'Back to lessons', onPress: exit }]}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, padding: space(6), justifyContent: 'center', gap: space(4), backgroundColor: colors.bg },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 16, color: colors.muted, lineHeight: 23 },
});
