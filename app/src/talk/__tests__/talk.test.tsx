import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Share } from 'react-native';
import { content, showsSurvival, talkTask, talkTasks } from '../../content';
import {
  completeLessonSession, emptyProgress, recordTalk, setTalkSetting, talkInvitation, talkList,
  type Progress, type SessionResult, type TalkSetting,
} from '../../progress/model';
import { ProgressProvider, useProgress } from '../../progress/ProgressContext';
import { SessionRunner, type Step } from '../../session/SessionRunner';
import { partnerText } from '../partner';
import { useTalkEnding } from '../TalkInvitation';
import { TalkView } from '../TalkView';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  Stack: { Screen: () => null },
}));

const t0 = new Date('2026-10-20T09:00:00');
const later = new Date('2026-10-21T09:00:00');
const L10 = content.lessons.L10;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('talk model', () => {
  it('records saved, skipped and done; done wins', () => {
    let p = recordTalk(emptyProgress(), 'L10.talk', 'saved', t0);
    expect(p.talk?.['L10.talk']).toEqual({ status: 'saved', at: t0.toISOString() });
    p = recordTalk(p, 'L10.talk', 'skipped', t0);
    expect(p.talk?.['L10.talk'].status).toBe('skipped');
    p = recordTalk(p, 'L10.talk', 'done', t0, 'ok');
    p = recordTalk(p, 'L10.talk', 'skipped', later);
    p = recordTalk(p, 'L10.talk', 'saved', later);
    expect(p.talk?.['L10.talk']).toEqual({ status: 'done', rating: 'ok', at: t0.toISOString() });
  });

  it('doing a task again updates the rating and the date', () => {
    let p = recordTalk(emptyProgress(), 'L10.talk', 'done', t0, 'hard');
    p = recordTalk(p, 'L10.talk', 'done', later, 'easy');
    expect(p.talk?.['L10.talk']).toEqual({ status: 'done', rating: 'easy', at: later.toISOString() });
  });

  it('never touches cards, lessons, checkpoints or the streak', () => {
    const before = completeLessonSession(emptyProgress(), 'L10', 'practise', [], t0);
    let p = recordTalk(before, 'L10.talk', 'skipped', later);
    p = recordTalk(p, 'L10.talk', 'done', later, 'hard');
    p = setTalkSetting(p, 'off');
    const { talk: _talk, settings: _settings, ...rest } = p;
    expect(rest).toEqual(before);
    expect(p.cards).toBe(before.cards);
  });

  it('a Practise session is complete without its talk task', () => {
    const results: SessionResult[] = L10.sessions.practise.items.map((item) => ({ item, status: 'correct' }));
    const p = completeLessonSession(emptyProgress(), 'L10', 'practise', results, t0);
    expect(p.lessons.L10.practisedAt).toBe(t0.toISOString());
    expect(p.lessons.L10.bestPractise).toBe(1);
    expect(p.talk).toBeUndefined();
  });

  it('asks first, then invites; "off" and done tasks show nothing; no task, no invitation', () => {
    const p = emptyProgress();
    expect(talkInvitation(p, 'L10.talk')).toBe('ask');
    expect(talkInvitation(setTalkSetting(p, 'on'), 'L10.talk')).toBe('invite');
    expect(talkInvitation(setTalkSetting(p, 'off'), 'L10.talk')).toBeNull();
    expect(talkInvitation(recordTalk(setTalkSetting(p, 'on'), 'L10.talk', 'done', t0), 'L10.talk')).toBeNull();
    expect(talkInvitation(setTalkSetting(p, 'on'), undefined)).toBeNull();
  });

  it('the Talk list holds saved and skipped tasks, most recent first, and counts done ones', () => {
    let p = recordTalk(emptyProgress(), 'L3.talk', 'saved', t0);
    p = recordTalk(p, 'L4.talk', 'skipped', later);
    p = recordTalk(p, 'L5.talk', 'done', later, 'ok');
    const list = talkList(p);
    expect(list.pending.map((t) => t.id)).toEqual(['L4.talk', 'L3.talk']);
    expect(list.done).toBe(1);
    expect(talkList(emptyProgress())).toEqual({ pending: [], done: 0 });
  });
});

// ---------- end of a Practise session ----------

/** The provider's progress after the last render. */
const seen = jest.fn<void, [Progress]>();
const latest = () => seen.mock.lastCall![0];
const useSeen = (p: Progress) => useEffect(() => seen(p));
const task = talkTask('L10.talk')!;
const item = L10.sessions.practise.items.find((i) => i.type === 'pick_suffix')!;
const steps: Step[] = [{ kind: 'item', item }];

function Practise() {
  const { progress, finishLesson } = useProgress();
  const talk = useTalkEnding(task);
  useSeen(progress);
  return (
    <SessionRunner
      steps={steps}
      onExit={() => {}}
      onComplete={(results) => {
        finishLesson('L10', 'practise', results);
        talk.afterSave();
      }}
      epilogue={talk.epilogue}
      summaryTitle="Practice done!"
      summaryActions={[]}
    />
  );
}

async function finishPractise(setting?: TalkSetting) {
  // the learner's stored progress, with the talk setting already answered (or not)
  const stored = setting ? setTalkSetting(emptyProgress(), setting) : emptyProgress();
  await AsyncStorage.setItem('turkolinguo.progress.v1', JSON.stringify(stored));
  await render(<ProgressProvider><Practise /></ProgressProvider>);
  await act(async () => {});
  await fireEvent.press(screen.getByRole('button', { name: item.answer as string }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
}

describe('talk invitation at the end of Practise', () => {
  it('saves the session before the invitation; Skip goes to the summary', async () => {
    await finishPractise('on');
    expect(screen.getByText(task.talk.title)).toBeTruthy();
    expect(latest().lessons.L10.practisedAt).toBeDefined();
    await fireEvent.press(screen.getByRole('button', { name: 'Skip: no one around' }));
    expect(screen.getByText('Practice done!')).toBeTruthy();
    expect(latest().talk?.['L10.talk'].status).toBe('skipped');
  });

  it('Save for later goes to the summary and keeps the task in the Talk list', async () => {
    await finishPractise('on');
    await fireEvent.press(screen.getByRole('button', { name: 'Save for later' }));
    expect(screen.getByText('Practice done!')).toBeTruthy();
    expect(talkList(latest()).pending.map((t) => t.id)).toEqual(['L10.talk']);
  });

  it("Let's talk opens the talk screen, with the summary behind it", async () => {
    await finishPractise('on');
    await fireEvent.press(screen.getByRole('button', { name: "Let's talk" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/talk/[id]', params: { id: 'L10.talk' } });
    expect(screen.getByText('Practice done!')).toBeTruthy();
  });

  it('asks once whether there is a Turkish speaker; yes shows the invitation', async () => {
    await finishPractise();
    expect(screen.getByText(/Do you have someone who speaks Turkish/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Yes, show talk tasks' }));
    expect(latest().settings?.talk).toBe('on');
    expect(screen.getByText(task.talk.title)).toBeTruthy();
  });

  it('"Not now" hides talk tasks, and the task still goes to the Talk list', async () => {
    await finishPractise();
    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(latest().settings?.talk).toBe('off');
    expect(screen.getByText('Practice done!')).toBeTruthy();
    expect(latest().talk?.['L10.talk'].status).toBe('skipped');
  });

  it('with the setting "off", there is no invitation', async () => {
    await finishPractise('off');
    expect(screen.queryByText(task.talk.title)).toBeNull();
    expect(screen.getByText('Practice done!')).toBeTruthy();
    expect(latest().lessons.L10.practisedAt).toBeDefined();
    expect(latest().talk?.['L10.talk'].status).toBe('skipped');
  });
});

// ---------- the talk screen ----------

function Talk() {
  useSeen(useProgress().progress);
  return <TalkView task={talkTask('L32.talk')!} />;
}

describe('talk screen', () => {
  const L32 = talkTask('L32.talk')!;

  it('shows the task, the phrases with English, goals and the survival phrases (collapsed)', async () => {
    await render(<ProgressProvider><Talk /></ProgressProvider>);
    expect(screen.getByText(L32.talk.title)).toBeTruthy();
    for (const sid of L32.talk.phrases) {
      expect(screen.getAllByText(content.sentences[sid].tr).length).toBeGreaterThan(0);
      expect(screen.getAllByText(content.sentences[sid].en[0]).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText('Tekrar eder misiniz?')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: "If you're stuck" }));
    expect(screen.getByText('Tekrar eder misiniz?')).toBeTruthy();
    const goal = screen.getByRole('checkbox', { name: L32.talk.goals[0] });
    await fireEvent.press(goal);
    expect(goal.props.accessibilityState.checked).toBe(true);
  });

  it('shows the partner card in Turkish and shares it as text', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await render(<ProgressProvider><Talk /></ProgressProvider>);
    await fireEvent.press(screen.getByRole('button', { name: 'Show to your partner 🇹🇷' }));
    expect(screen.getByText('Merhaba!')).toBeTruthy();
    expect(screen.getByText(`1. ${content.sentences[L32.talk.partner.questions[0]].tr}`)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Share as text' }));
    expect(share).toHaveBeenCalledWith({ message: partnerText(L32.talk) });
  });

  it('a Hard rating is stored and suggests practising the lesson again', async () => {
    await render(<ProgressProvider><Talk /></ProgressProvider>);
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    await fireEvent.press(screen.getByRole('button', { name: '😅 Hard' }));
    expect(latest().talk?.['L32.talk']).toMatchObject({ status: 'done', rating: 'hard' });
    expect(screen.getByText('Practise this lesson again?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Practise again' }));
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/session/[lesson]/[session]', params: { lesson: 'L32', session: 'practise' } });
  });
});

// ---------- content ----------

describe('talk content', () => {
  const order = content.course.units.flatMap((u) => u.lessons);
  const lessonPos = (l: string) => order.indexOf(l);

  it('every written lesson and checkpoint has a talk task', () => {
    for (const id of Object.keys(content.lessons)) expect(content.lessons[id].sessions.practise.talk?.id).toBe(`${id}.talk`);
    for (const id of Object.keys(content.checkpoints)) expect(content.checkpoints[id].talk?.id).toBe(`${id}.talk`);
  });

  it('each phrase and partner question is known material at its lesson', () => {
    // when each word and grammar point is taught (packs sit just after their lesson)
    const wordAt = new Map<string, number>();
    const teach = (w: string, pos: number) => wordAt.set(w, Math.min(wordAt.get(w) ?? Infinity, pos));
    for (const l of Object.values(content.lessons)) (l.new_words ?? []).forEach((w) => teach(w, lessonPos(l.id)));
    for (const theme of Object.values(content.packs) as { packs: { unlock_after: string; words: string[] }[] }[]) {
      for (const p of theme.packs) p.words.forEach((w) => teach(w, lessonPos(p.unlock_after) + 0.5));
    }
    const grammarAt = (g: string) => lessonPos(Object.entries(content.course.lessons).find(([, m]) => m.grammar === g)![0]);

    for (const { talk, owner, ownerKind } of talkTasks()) {
      const unit = content.course.units.find((u) => u.checkpoint === owner);
      const pos = ownerKind === 'lesson' ? lessonPos(owner) : lessonPos(unit!.lessons[unit!.lessons.length - 1]) + 0.25;
      for (const sid of [...talk.phrases, ...talk.partner.questions]) {
        const s = content.sentences[sid];
        expect(s).toBeDefined();
        for (const w of s.words) {
          if (content.lexicon[w]?.pos === 'name') continue;
          expect([sid, w, wordAt.get(w)! <= pos]).toEqual([sid, w, true]);
        }
        if (!s.phrase) for (const g of s.grammar) expect([sid, g, grammarAt(g) <= pos]).toEqual([sid, g, true]);
      }
    }
  });

  it('partner texts are plain Turkish, never course notation', () => {
    for (const { talk } of talkTasks()) {
      expect(talk.partner.knows).not.toMatch(/(?<!\w)-\(?\w|\([yns]\)/);
      expect(talk.partner.topic).not.toMatch(/(?<!\w)-\(?\w|\([yns]\)/);
    }
  });

  it('the survival phrases are the siz forms, shown once T1b is unlocked (or when asked for)', () => {
    expect(content.talkFrame.survival.map((s) => content.sentences[s].tr))
      .toEqual(['Anlamadım.', 'Tekrar eder misiniz?', 'Daha yavaş konuşur musunuz?', 'Bu ne demek?']);
    expect(showsSurvival(talkTask('L2.talk')!)).toBe(false);
    expect(showsSurvival(talkTask('L3.talk')!)).toBe(true); // requires: [survival]
    expect(showsSurvival(talkTask('L4.talk')!)).toBe(true);
  });

  it('the shared text has the frame, the topic, what the learner knows and the numbered questions', () => {
    const text = partnerText(talkTask('L32.talk')!.talk);
    expect(text).toContain('Merhaba! Karşınızdaki kişi Türkçe öğreniyor');
    expect(text).toContain('• Lütfen yavaş ve kısa cümlelerle konuşun.');
    expect(text).toContain('Bugünkü konu: hava durumu.');
    expect(text).toContain('1. Bugün hava nasıl?');
    expect(text).not.toContain('**');
  });
});
