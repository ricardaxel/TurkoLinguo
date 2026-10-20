import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { content } from '../../content';
import { Markdown } from '../../ui/Markdown';
import { space } from '../../ui/theme';

export default function GrammarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const g = content.grammar[id];
  if (!g) return <Text>Not found.</Text>;
  return (
    <ScrollView contentContainerStyle={{ padding: space(4) }}>
      <Stack.Screen options={{ title: g.title }} />
      <Markdown body={g.reference} />
    </ScrollView>
  );
}
