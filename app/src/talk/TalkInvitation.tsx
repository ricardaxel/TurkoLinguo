// End of a Practise session (or checkpoint): the talk task invitation (docs/TALK_TASKS.md §3.1).
// The session result is already saved when this shows; Skip and Save only touch Progress.talk.

import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TalkTask } from '../content';
import { talkInvitation, talkSetting } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { Button } from '../ui/controls';
import { colors, radius, space } from '../ui/theme';

/** The `epilogue` for SessionRunner, and what to do once the session is saved. */
export function useTalkEnding(task?: TalkTask) {
  const { progress, recordTalk } = useProgress();
  return {
    /** With talk tasks hidden, the task still goes to the Talk list. */
    afterSave: () => {
      if (task && talkSetting(progress) === 'off' && !progress.talk?.[task.talk.id]) recordTalk(task.talk.id, 'skipped');
    },
    epilogue: task
      ? (dismiss: () => void): ReactNode =>
          talkInvitation(progress, task.talk.id) ? <TalkInvitation task={task} onClose={dismiss} /> : null
      : undefined,
  };
}

export function TalkInvitation({ task, onClose }: { task: TalkTask; onClose: () => void }) {
  const { progress, recordTalk, setTalkSetting } = useProgress();
  const { talk } = task;

  if (talkInvitation(progress, talk.id) === 'ask') {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>🗣 Talk tasks</Text>
        <Text style={styles.title}>Do you have someone who speaks Turkish (in person or on a call)?</Text>
        <Text style={styles.body}>
          Each practice can end with a short chat with them, using what you know. You can always skip it.
        </Text>
        <Button title="Yes, show talk tasks" onPress={() => setTalkSetting('on')} />
        <Button
          title="Not now"
          variant="secondary"
          onPress={() => {
            setTalkSetting('off');
            recordTalk(talk.id, 'skipped');
            onClose();
          }}
        />
        <Text style={styles.note}>Skipped tasks wait in your Talk list. You can change this at the bottom of the home screen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{`🗣 Talk task · ~${talk.minutes} min`}</Text>
      <Text style={styles.title}>{talk.title}</Text>
      <Text style={styles.body}>{"With a Turkish speaker, in person or on a call. It doesn't change your score."}</Text>
      <Button
        title="Let's talk"
        onPress={() => {
          // in the Talk list until it's done, in case the learner backs out
          recordTalk(talk.id, 'saved');
          onClose();
          router.push({ pathname: '/talk/[id]', params: { id: talk.id } });
        }}
      />
      <Button
        title="Save for later"
        variant="secondary"
        onPress={() => {
          recordTalk(talk.id, 'saved');
          onClose();
        }}
      />
      <Button
        title="Skip: no one around"
        variant="secondary"
        onPress={() => {
          recordTalk(talk.id, 'skipped');
          onClose();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(5), gap: space(3), marginTop: space(6) },
  kicker: { fontSize: 14, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { fontSize: 16, color: colors.muted, lineHeight: 22, marginBottom: space(2) },
  note: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
