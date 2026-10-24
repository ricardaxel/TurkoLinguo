import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text } from 'react-native';
import { content, talkTask } from '../../../content';
import { useProgress } from '../../../progress/ProgressContext';
import { SessionRunner, type Step } from '../../../session/SessionRunner';
import { useTalkEnding } from '../../../talk/TalkInvitation';

type SessionKey = 'learn' | 'practise';

export default function LessonSessionScreen() {
  const { lesson: lessonId, session, start } = useLocalSearchParams<{ lesson: string; session: SessionKey; start?: string }>();
  const { finishLesson } = useProgress();
  const lesson = content.lessons[lessonId];
  // talk tasks end Practise only (never Learn or reviews)
  const talk = useTalkEnding(session === 'practise' ? talkTask(`${lessonId}.talk`) : undefined);

  const steps = useMemo<Step[]>(() => {
    if (!lesson || (session !== 'learn' && session !== 'practise')) return [];
    const s = lesson.sessions[session];
    const cards = 'cards' in s ? s.cards.map((card): Step => ({ kind: 'card', card })) : [];
    return [...cards, ...s.items.map((item): Step => ({ kind: 'item', item }))];
  }, [lesson, session]);

  if (!steps.length) return <Text>Lesson not found.</Text>;

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SessionRunner
      key={`${lessonId}-${session}`}
      steps={steps}
      startAt={Math.max(0, Number(start) || 0)}
      onExit={exit}
      onComplete={(results) => {
        finishLesson(lessonId, session, results);
        talk.afterSave();
      }}
      epilogue={talk.epilogue}
      summaryTitle={session === 'learn' ? 'Rule learned!' : 'Practice done!'}
      summaryActions={[
        ...(session === 'learn'
          ? [{
              title: `Practise now · ${lesson.sessions.practise.minutes ?? 5} min`,
              onPress: () => router.replace({ pathname: '/session/[lesson]/[session]', params: { lesson: lessonId, session: 'practise' } }),
            }]
          : []),
        { title: 'Back to lessons', variant: 'secondary' as const, onPress: exit },
      ]}
    />
  );
}
