import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../ui/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'TurkoLinguo' }} />
        <Stack.Screen name="session/[lesson]/[session]" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="grammar/[id]" options={{ title: 'Grammar' }} />
      </Stack>
    </>
  );
}
