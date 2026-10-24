// The talk screen (docs/TALK_TASKS.md §3.2): the task, phrases to prepare, survival phrases, goals,
// the partner card in Turkish, and a self-rating that is stored only (never in FSRS or scores).

import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { content, showsSurvival, type TalkTask } from '../content';
import type { TalkRating } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { partnerCard, partnerText } from './partner';
import { Button } from '../ui/controls';
import { Inline } from '../ui/Markdown';
import { SpeakButton } from '../ui/media';
import { colors, radius, space } from '../ui/theme';

const RATINGS: { rating: TalkRating; label: string }[] = [
  { rating: 'easy', label: '😀 Easy' },
  { rating: 'ok', label: '🙂 OK' },
  { rating: 'hard', label: '😅 Hard' },
];

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function TalkView({ task }: { task: TalkTask }) {
  const { recordTalk } = useProgress();
  const { talk } = task;
  const [goals, setGoals] = useState<boolean[]>(talk.goals.map(() => false));
  const [stuckOpen, setStuckOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [phase, setPhase] = useState<'task' | 'rate' | 'hard'>('task');

  const rate = (rating: TalkRating) => {
    recordTalk(talk.id, 'done', rating);
    if (rating === 'hard') setPhase('hard');
    else leave();
  };

  const again = () =>
    task.ownerKind === 'lesson'
      ? router.replace({ pathname: '/session/[lesson]/[session]', params: { lesson: task.owner, session: 'practise' } })
      : router.replace({ pathname: '/checkpoint/[id]', params: { id: task.owner } });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Talk task' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{`🗣 ${task.owner} · ~${talk.minutes} min`}</Text>
        <Text style={styles.title}>{talk.title}</Text>
        <View style={styles.box}>
          {talk.how.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepN}>{i + 1}</Text>
              <Text style={styles.text}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Get ready</Text>
        {talk.phrases.map((sid) => <Phrase key={sid} id={sid} />)}

        {showsSurvival(task) && (
          <View style={styles.box}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="If you're stuck"
              accessibilityState={{ expanded: stuckOpen }}
              onPress={() => setStuckOpen(!stuckOpen)}
            >
              <Text style={styles.toggle}>{`${stuckOpen ? '▾' : '▸'} If you're stuck`}</Text>
            </Pressable>
            {stuckOpen && content.talkFrame.survival.map((sid) => <Phrase key={sid} id={sid} />)}
          </View>
        )}

        <Text style={styles.section}>Goals</Text>
        {talk.goals.map((goal, i) => (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            accessibilityLabel={goal}
            accessibilityState={{ checked: goals[i] }}
            onPress={() => setGoals(goals.map((g, j) => (j === i ? !g : g)))}
            style={styles.goal}
          >
            <Text style={styles.check}>{goals[i] ? '☑' : '☐'}</Text>
            <Text style={styles.text}>{goal}</Text>
          </Pressable>
        ))}

        <Button title="Show to your partner 🇹🇷" variant="secondary" onPress={() => setPartnerOpen(true)} />

        {phase === 'task' && <Button title="Done" onPress={() => setPhase('rate')} />}
        {phase === 'rate' && (
          <View style={styles.box}>
            <Text style={styles.section}>How did it go?</Text>
            <View style={styles.ratingRow}>
              {RATINGS.map((r) => (
                <Button key={r.rating} title={r.label} variant="secondary" style={{ flex: 1 }} onPress={() => rate(r.rating)} />
              ))}
            </View>
          </View>
        )}
        {phase === 'hard' && (
          <View style={styles.box}>
            <Text style={styles.text}>
              {task.ownerKind === 'lesson' ? 'Practise this lesson again?' : 'Try this checkpoint again?'}
            </Text>
            <Button title={task.ownerKind === 'lesson' ? 'Practise again' : 'Try again'} onPress={again} />
            <Button title="Not now" variant="secondary" onPress={leave} />
          </View>
        )}
      </ScrollView>

      <Modal visible={partnerOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPartnerOpen(false)}>
        <PartnerCard task={task} onClose={() => setPartnerOpen(false)} />
      </Modal>
    </View>
  );
}

function Phrase({ id }: { id: string }) {
  const s = content.sentences[id];
  if (!s) return null;
  return (
    <View style={styles.phrase}>
      <SpeakButton audio={s.audio ?? s.tr} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tr}>{s.tr}</Text>
        <Text style={styles.en}>{s.en[0]}</Text>
      </View>
    </View>
  );
}

/** Full-screen card in Turkish, to hand the phone over or share on a call. */
export function PartnerCard({ task, onClose }: { task: TalkTask; onClose: () => void }) {
  const card = partnerCard(task.talk);
  const [shareFailed, setShareFailed] = useState(false);
  const share = async () => {
    try {
      // React Native's Share (expo-sharing only shares files); on the web it needs the Web Share API
      await Share.share({ message: partnerText(task.talk) });
    } catch {
      setShareFailed(true);
    }
  };

  return (
    <SafeAreaView style={styles.partnerScreen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.partnerContent}>
        <Text style={styles.partnerHello}>{card.greeting}</Text>
        <Text style={styles.partnerText}>{card.intro}</Text>
        {card.rules.map((r, i) => <Inline key={i} text={`•  ${r}`} style={styles.partnerText} />)}
        <Inline text={card.topic} style={styles.partnerText} />
        <Inline text={card.knows} style={styles.partnerText} />
        <Inline text={card.questionsLabel} style={styles.partnerText} />
        {card.questions.map((q, i) => <Text key={i} style={styles.partnerQuestion}>{`${i + 1}. ${q}`}</Text>)}
        <Text style={styles.partnerText}>{card.closing}</Text>
        {shareFailed && (
          <Text selectable style={styles.shareFallback}>
            {`Sharing isn't available here. Copy this text instead:\n\n${partnerText(task.talk)}`}
          </Text>
        )}
      </ScrollView>
      <View style={styles.partnerButtons}>
        <Button title="Share as text" variant="secondary" style={{ flex: 1 }} onPress={share} />
        <Button title="Close" style={{ flex: 1 }} onPress={onClose} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(3), paddingBottom: space(10) },
  kicker: { fontSize: 13, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  box: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(4), gap: space(3) },
  stepRow: { flexDirection: 'row', gap: space(3) },
  stepN: { fontSize: 16, fontWeight: '800', color: colors.primary, width: 16 },
  text: { flex: 1, fontSize: 16, color: colors.text, lineHeight: 22 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginTop: space(2) },
  phrase: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  tr: { fontSize: 18, fontWeight: '600', color: colors.text },
  en: { fontSize: 14, color: colors.muted },
  toggle: { fontSize: 16, fontWeight: '700', color: colors.accent },
  goal: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(1) },
  check: { fontSize: 24, color: colors.accent },
  ratingRow: { flexDirection: 'row', gap: space(2) },
  partnerScreen: { flex: 1, backgroundColor: colors.surface },
  partnerContent: { padding: space(6), gap: space(4) },
  partnerHello: { fontSize: 34, fontWeight: '800', color: colors.primary },
  partnerText: { fontSize: 22, lineHeight: 31, color: colors.text },
  partnerQuestion: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: colors.text, paddingLeft: space(2) },
  shareFallback: { fontSize: 15, color: colors.muted, backgroundColor: colors.bg, padding: space(3), borderRadius: radius },
  partnerButtons: { flexDirection: 'row', gap: space(3), padding: space(4) },
});
