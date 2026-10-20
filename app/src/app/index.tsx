import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { content, lessonOutline } from '../content';
import { Button } from '../ui/controls';
import { colors, radius, space } from '../ui/theme';

export default function Home() {
  const units = lessonOutline();
  const firstAvailable = units.flatMap((u) => u.lessons).find((l) => l.available);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Short sessions. Real explanations.</Text>
      {firstAvailable && (
        <View style={{ gap: space(2) }}>
          <Text style={styles.unit}>Continue</Text>
          <LessonCard id={firstAvailable.id} title={firstAvailable.title} />
        </View>
      )}
      {units.map((unit) => (
        <View key={unit.id} style={{ gap: space(2) }}>
          <Text style={styles.unit}>{`${unit.id.replace('U', 'Unit ')} · ${unit.title}`}</Text>
          {unit.lessons.map((l) =>
            l.available ? (
              <LessonCard key={l.id} id={l.id} title={l.title} />
            ) : (
              <View key={l.id} style={[styles.lesson, styles.locked]}>
                <Text style={styles.lessonId}>{l.id}</Text>
                <Text style={styles.lockedTitle}>{l.title}</Text>
                <Text style={styles.soon}>soon</Text>
              </View>
            ),
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function LessonCard({ id, title }: { id: string; title: string }) {
  const lesson = content.lessons[id];
  const open = (session: 'learn' | 'practise') =>
    router.push({ pathname: '/session/[lesson]/[session]', params: { lesson: id, session } });
  return (
    <View style={[styles.lesson, styles.available]}>
      <View style={{ flexDirection: 'row', gap: space(3), alignItems: 'center' }}>
        <Text style={styles.lessonId}>{id}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.buttons}>
        <Button style={{ flex: 1 }} title={`Learn · ${lesson.sessions.learn.minutes ?? 3} min`} onPress={() => open('learn')} />
        <Button style={{ flex: 1 }} variant="secondary" title={`Practise · ${lesson.sessions.practise.minutes ?? 5} min`} onPress={() => open('practise')} />
      </View>
      <Text
        style={styles.link}
        onPress={() => router.push({ pathname: '/grammar/[id]', params: { id: lesson.grammar } })}
      >
        Grammar reference ›
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), gap: space(5), paddingBottom: space(10) },
  subtitle: { fontSize: 16, color: colors.muted },
  unit: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  lesson: { borderRadius: radius, padding: space(4), borderWidth: 1, borderColor: colors.border },
  available: { backgroundColor: colors.surface, gap: space(3), borderColor: colors.primary, borderWidth: 2 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: space(3), opacity: 0.55, paddingVertical: space(3) },
  lessonId: { fontSize: 13, fontWeight: '800', color: colors.primary, width: 32 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  lockedTitle: { flex: 1, fontSize: 15, color: colors.text },
  soon: { fontSize: 12, color: colors.muted },
  buttons: { flexDirection: 'row', gap: space(2) },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600' },
});
