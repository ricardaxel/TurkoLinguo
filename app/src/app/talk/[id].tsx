import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { talkTask } from '../../content';
import { TalkView } from '../../talk/TalkView';

export default function TalkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = talkTask(id);
  if (!task) return <Text>Talk task not found.</Text>;
  return <TalkView task={task} />;
}
