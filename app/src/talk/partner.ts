// The partner card (docs/TALK_TASKS.md §4): the fixed Turkish frame around a task's topic, what the
// learner knows and the questions to ask. Pure, so the card and "Share as text" say the same thing.

import { content } from '../content';
import type { Talk } from '../content/types';

export interface PartnerCardText {
  greeting: string;
  intro: string;
  rules: string[];
  topic: string;
  knows: string;
  questionsLabel: string;
  questions: string[];
  closing: string;
}

/** End a free-text field with a full stop, as the frame's own sentences do. */
const sentence = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export function partnerCard(talk: Talk): PartnerCardText {
  const f = content.talkFrame;
  return {
    greeting: f.greeting,
    intro: f.intro,
    rules: f.rules,
    topic: `**${f.topic_label}** ${sentence(talk.partner.topic)}`,
    knows: `**${f.knows_label}** ${sentence(talk.partner.knows)}`,
    questionsLabel: `**${f.questions_label}**`,
    questions: talk.partner.questions.map((id) => content.sentences[id]?.tr ?? id),
    closing: f.closing,
  };
}

const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1');

/** The card as plain text, for a partner who is far away. */
export function partnerText(talk: Talk): string {
  const c = partnerCard(talk);
  return [
    `${c.greeting} ${c.intro}`,
    ...c.rules.map((r) => `• ${plain(r)}`),
    '',
    plain(c.topic),
    plain(c.knows),
    plain(c.questionsLabel),
    ...c.questions.map((q, i) => `${i + 1}. ${q}`),
    '',
    c.closing,
  ].join('\n');
}
