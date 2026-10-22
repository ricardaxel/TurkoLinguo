import raw from './content.json';
import type { Bundle, Item, Sentence, Word } from './types';

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
