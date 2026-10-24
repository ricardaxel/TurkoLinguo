import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text } from 'react-native';
import { content, DEFAULT_PASS, talkTask } from '../../content';
import { checkpointScore } from '../../progress/model';
import { useProgress } from '../../progress/ProgressContext';
import { SessionRunner, type Step } from '../../session/SessionRunner';
import { useTalkEnding } from '../../talk/TalkInvitation';

export default function CheckpointScreen() {
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const { finishCheckpoint } = useProgress();
  const cp = content.checkpoints[id];
  const talk = useTalkEnding(talkTask(`${id}.talk`));

  const steps = useMemo<Step[]>(
    () => (cp ? [{ kind: 'card', card: cp.intro }, ...cp.items.map((item): Step => ({ kind: 'item', item }))] : []),
    [cp],
  );

  if (!cp) return <Text>Checkpoint not found.</Text>;

  const pass = cp.pass ?? DEFAULT_PASS;
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SessionRunner
      key={cp.id}
      steps={steps}
      startAt={Math.max(0, Number(start) || 0)}
      onExit={exit}
      onComplete={(results) => {
        finishCheckpoint(cp.id, results);
        talk.afterSave();
      }}
      epilogue={talk.epilogue}
      summaryTitle={(results) => {
        const score = Math.round(checkpointScore(results) * 100);
        return score >= pass * 100
          ? `${score} % — unit complete! 🎉`
          : `${score} % — ${Math.round(pass * 100)} % needed. Your mistakes are now in your reviews.`;
      }}
      summaryActions={[{ title: 'Back to lessons', onPress: exit }]}
    />
  );
}
