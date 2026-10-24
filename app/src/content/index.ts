import raw from './content.json';
import type { Bundle, Item, Sentence, Talk, Word } from './types';

export const content = raw as unknown as Bundle;

export function word(id: string): Word {
  const w = content.lexicon[id];
  if (!w) throw new Error(`Unknown word ${id}`);
  return w;
}

export function sentence(id: string): Sentence {
  const s = content.sentences[id];
  if (!s) throw new Error(`Unknown sentence ${id}`);
  return s;
}

/** Lessons in course order, with whether they're written yet, and each unit's checkpoint. */
export function lessonOutline() {
  return content.course.units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((id) => ({
      id,
      title: content.course.lessons[id].title,
      available: id in content.lessons,
    })),
    checkpointInfo: unit.checkpoint && content.checkpoints?.[unit.checkpoint]
      ? { id: unit.checkpoint, title: content.checkpoints[unit.checkpoint].title }
      : undefined,
  }));
}

export const DEFAULT_PASS = 0.7;

/** Every authored exercise: lesson Learn + Practise items, then checkpoint items. */
export function allItems(): Item[] {
  return [
    ...Object.values(content.lessons).flatMap((l) => [...l.sessions.learn.items, ...l.sessions.practise.items]),
    ...Object.values(content.checkpoints ?? {}).flatMap((c) => c.items),
  ];
}

export interface TalkTask {
  talk: Talk;
  /** The lesson or checkpoint whose session ends with this task. */
  owner: string;
  ownerKind: 'lesson' | 'checkpoint';
  ownerTitle: string;
}

/** Every talk task, in course order (a checkpoint's after its unit's lessons). */
export function talkTasks(): TalkTask[] {
  const out: TalkTask[] = [];
  for (const unit of content.course.units) {
    for (const id of unit.lessons) {
      const talk = content.lessons[id]?.sessions.practise.talk;
      if (talk) out.push({ talk, owner: id, ownerKind: 'lesson', ownerTitle: content.lessons[id].title });
    }
    const cp = unit.checkpoint ? content.checkpoints?.[unit.checkpoint] : undefined;
    if (cp?.talk) out.push({ talk: cp.talk, owner: cp.id, ownerKind: 'checkpoint', ownerTitle: cp.title });
  }
  return out;
}

export const talkTask = (talkId: string): TalkTask | undefined => talkTasks().find((t) => t.talk.id === talkId);

/** Position in course order (lesson index; a checkpoint sits just after its unit's last lesson). */
function position(owner: string): number {
  const order = content.course.units.flatMap((u) => u.lessons);
  if (owner in content.lessons) return order.indexOf(owner);
  const unit = content.course.units.find((u) => u.checkpoint === owner);
  return unit ? order.indexOf(unit.lessons[unit.lessons.length - 1]) + 0.25 : Infinity;
}

/** Where the survival phrases become known: just after the lesson that unlocks their pack. */
function survivalPosition(): number {
  const order = content.course.units.flatMap((u) => u.lessons);
  const words = new Set(content.talkFrame.survival.flatMap((s) => content.sentences[s]?.words ?? []));
  let pos = -1;
  for (const theme of Object.values(content.packs) as { packs: { unlock_after: string; words: string[] }[] }[]) {
    for (const p of theme.packs) if (p.words.some((w) => words.has(w))) pos = Math.max(pos, order.indexOf(p.unlock_after) + 0.5);
  }
  return pos;
}

/** Show the "If you're stuck" phrases: once they're unlocked, or earlier when the task asks for them. */
export function showsSurvival(task: TalkTask): boolean {
  return !!task.talk.requires?.includes('survival') || position(task.owner) > survivalPosition();
}
