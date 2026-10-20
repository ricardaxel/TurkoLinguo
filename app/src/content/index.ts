import raw from './content.json';
import type { Bundle, Sentence, Word } from './types';

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

/** Lessons in course order, with whether they're written yet. */
export function lessonOutline() {
  return content.course.units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((id) => ({
      id,
      title: content.course.lessons[id].title,
      available: id in content.lessons,
    })),
  }));
}
