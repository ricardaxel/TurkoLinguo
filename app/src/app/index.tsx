import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { content, lessonOutline, talkTask } from '../content';
import { dueCount, nextDue, talkList, talkSetting, type LessonProgress, type Progress } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { Button, Chip } from '../ui/controls';
import { colors, radius, space } from '../ui/theme';

function whenText(d: Date, now: Date): string {
  const mins = Math.round((d.getTime() - now.getTime()) / 60_000);
  if (mins < 60) return `in ${Math.max(1, mins)} min`;
  if (mins < 24 * 60) return `in ${Math.round(mins / 60)} h`;
  return `in ${Math.round(mins / (24 * 60))} days`;
}

export default function Home() {
  const { progress, now, loaded, clockOffsetDays, shiftClock, reset, setTalkSetting } = useProgress();
  const units = lessonOutline();
  const available = units.flatMap((u) => u.lessons).filter((l) => l.available);
  // next lesson = first available one not practised yet (or the last one)
  const current = available.find((l) => !progress.lessons[l.id]?.practisedAt) ?? available[available.length - 1];
  const t = now();
  const due = dueCount(progress, t);
  const next = nextDue(progress);

  if (!loaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.today}>
        <View style={styles.todayRow}>
          <Text style={styles.todayTitle}>Today</Text>
          {progress.streak > 0 && <Text style={styles.streak}>{`🔥 ${progress.streak} day${progress.streak > 1 ? 's' : ''}`}</Text>}
        </View>
        {due > 0 ? (
          <Button title={`Review · ${due} card${due > 1 ? 's' : ''}`} onPress={() => router.push('/review')} />
        ) : (
          <Text style={styles.muted}>
            {next ? `Nothing to review. Next review ${whenText(next, t)}.` : 'Reviews appear here after your first lesson.'}
          </Text>
        )}
      </View>

      {current && (
        <View style={{ gap: space(2) }}>
          <Text style={styles.unit}>Continue</Text>
          <LessonCard id={current.id} title={current.title} lp={progress.lessons[current.id]} />
        </View>
      )}

      <TalkList progress={progress} />

      {units.map((unit) => (
        <View key={unit.id} style={{ gap: space(2) }}>
          <Text style={styles.unit}>{`${unit.id.replace('U', 'Unit ')} · ${unit.title}`}</Text>
          {unit.lessons.map((l) => (
            <Pressable
              key={l.id}
              disabled={!l.available}
              accessibilityRole="button"
              accessibilityLabel={`${l.id} ${l.title}`}
              onPress={() => router.push({
                pathname: '/session/[lesson]/[session]',
                params: { lesson: l.id, session: progress.lessons[l.id]?.learnedAt ? 'practise' : 'learn' },
              })}
              style={({ pressed }) => [styles.row, !l.available && { opacity: 0.55 }, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.lessonId}>{l.id}</Text>
              <Text style={styles.rowTitle}>{l.title}</Text>
              <Text style={styles.status}>{statusText(l.available, progress.lessons[l.id])}</Text>
            </Pressable>
          ))}
          {unit.checkpointInfo && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Checkpoint ${unit.checkpointInfo.id}: ${unit.checkpointInfo.title}`}
              onPress={() => router.push({ pathname: '/checkpoint/[id]', params: { id: unit.checkpointInfo!.id } })}
              style={({ pressed }) => [styles.row, styles.checkpointRow, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.lessonId}>{unit.checkpointInfo.id}</Text>
              <Text style={styles.rowTitle}>{`Checkpoint · ${unit.checkpointInfo.title}`}</Text>
              <Text style={styles.status}>{checkpointStatus(progress.checkpoints?.[unit.checkpointInfo.id])}</Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={styles.dev}>
        <Text style={styles.unit}>Talk tasks</Text>
        <View style={styles.chips}>
          <Chip label="Show at the end of practice" selected={talkSetting(progress) === 'on'} onPress={() => setTalkSetting('on')} />
          <Chip label="Don't show" selected={talkSetting(progress) === 'off'} onPress={() => setTalkSetting('off')} />
        </View>
      </View>

      {__DEV__ && (
        <View style={styles.dev}>
          <Text style={styles.unit}>{`Developer · clock ${clockOffsetDays >= 0 ? '+' : ''}${clockOffsetDays} days`}</Text>
          <View style={styles.buttons}>
            <Button style={{ flex: 1 }} variant="secondary" title="+1 day" onPress={() => shiftClock(1)} />
            <Button style={{ flex: 1 }} variant="secondary" title="Reset progress" onPress={reset} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/** Saved and skipped talk tasks, most recent first, and the "talks done" counter (hidden when empty). */
function TalkList({ progress }: { progress: Progress }) {
  const { pending, done } = talkList(progress);
  const tasks = pending.flatMap(({ id, record }) => {
    const task = talkTask(id);
    return task ? [{ task, status: record.status }] : [];
  });
  if (!tasks.length && !done) return null;
  return (
    <View style={{ gap: space(2) }}>
      <View style={styles.todayRow}>
        <Text style={styles.unit}>Talk list</Text>
        {done > 0 && <Text style={styles.talksDone}>{`🗣 ${done} talk${done > 1 ? 's' : ''} done`}</Text>}
      </View>
      {tasks.map(({ task, status }) => (
        <Pressable
          key={task.talk.id}
          accessibilityRole="button"
          accessibilityLabel={`Talk task: ${task.talk.title}`}
          onPress={() => router.push({ pathname: '/talk/[id]', params: { id: task.talk.id } })}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.lessonId}>{task.owner}</Text>
          <Text style={styles.rowTitle}>{`🗣 ${task.talk.title}`}</Text>
          <Text style={styles.status}>{status === 'saved' ? 'saved' : 'skipped'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function checkpointStatus(cp?: { best: number; passedAt?: string }) {
  if (!cp) return 'test';
  return `${cp.passedAt ? '✓ ' : ''}${Math.round(cp.best * 100)} %`;
}

function statusText(available: boolean, lp?: LessonProgress) {
  if (!available) return 'soon';
  if (lp?.practisedAt) return '✓✓';
  if (lp?.learnedAt) return '✓';
  return 'new';
}

function LessonCard({ id, title, lp }: { id: string; title: string; lp?: LessonProgress }) {
  const lesson = content.lessons[id];
  const open = (session: 'learn' | 'practise') =>
    router.push({ pathname: '/session/[lesson]/[session]', params: { lesson: id, session } });
  const learned = !!lp?.learnedAt;
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', gap: space(3), alignItems: 'center' }}>
        <Text style={styles.lessonId}>{id}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.buttons}>
        <Button
          style={{ flex: 1 }}
          variant={learned ? 'secondary' : 'primary'}
          title={`${learned ? '✓ ' : ''}Learn · ${lesson.sessions.learn.minutes ?? 3} min`}
          onPress={() => open('learn')}
        />
        <Button
          style={{ flex: 1 }}
          variant={learned ? 'primary' : 'secondary'}
          title={`${lp?.practisedAt ? '✓ ' : ''}Practise · ${lesson.sessions.practise.minutes ?? 5} min`}
          onPress={() => open('practise')}
        />
      </View>
      <Text style={styles.link} onPress={() => router.push({ pathname: '/grammar/[id]', params: { id: lesson.grammar } })}>
        Grammar reference ›
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), gap: space(5), paddingBottom: space(10) },
  today: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: space(4), gap: space(3) },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  streak: { fontSize: 16, fontWeight: '700', color: colors.almost },
  muted: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  unit: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: space(4), gap: space(3), borderColor: colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(2), borderBottomWidth: 1, borderColor: colors.border },
  checkpointRow: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: space(2), marginTop: space(1) },
  lessonId: { fontSize: 13, fontWeight: '800', color: colors.primary, width: 32 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  rowTitle: { flex: 1, fontSize: 15, color: colors.text },
  status: { fontSize: 13, color: colors.muted, minWidth: 32, textAlign: 'right' },
  buttons: { flexDirection: 'row', gap: space(2) },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  talksDone: { fontSize: 14, fontWeight: '700', color: colors.accent },
  dev: { gap: space(2), borderTopWidth: 1, borderColor: colors.border, paddingTop: space(4) },
});
