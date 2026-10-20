import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { content } from '../../../content';
import { SessionRunner, type SessionKey } from '../../../session/SessionRunner';

export default function SessionScreen() {
  const { lesson, session, start } = useLocalSearchParams<{ lesson: string; session: SessionKey; start?: string }>();
  if (!content.lessons[lesson] || (session !== 'learn' && session !== 'practise')) {
    return <Text>Lesson not found.</Text>;
  }
  return (
    <SessionRunner
      key={`${lesson}-${session}`}
      lessonId={lesson}
      session={session}
      startAt={Math.max(0, Number(start) || 0)}
      onExit={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onPractise={() => router.replace({ pathname: '/session/[lesson]/[session]', params: { lesson, session: 'practise' } })}
    />
  );
}
