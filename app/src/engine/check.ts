// Answer checking for typed and assembled answers (CURRICULUM.md §5, "Typing & answer checking").
//   - Turkish-aware case mapping (I ↔ ı, İ ↔ i)
//   - punctuation and extra spaces ignored
//   - a missing accent is "almost", never silently correct
//   - answer patterns: (optional) and {alt1|alt2}

import { stripAccents, trLower } from './turkish';

export type Status = 'correct' | 'almost' | 'wrong';

export interface CheckResult {
  status: Status;
  /** Best-matching accepted answer, for display. */
  expected: string;
  /** For "almost": the letter that should have been typed, and the one that was. */
  accent?: { expected: string; given: string };
}

/** Expand an answer pattern into every accepted string. Groups don't nest. */
export function expandPattern(pattern: string): string[] {
  let results = [''];
  const re = /\(([^()]*)\)|\{([^{}]*)\}|([^({]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pattern))) {
    const [, optional, alternatives, literal] = m;
    const choices = optional !== undefined ? ['', optional] : alternatives !== undefined ? alternatives.split('|') : [literal];
    results = results.flatMap((r) => choices.map((c) => r + c));
  }
  const sentence = /[.!?]\s*$/.test(pattern);
  return results.map((r) => tidy(r, sentence));
}

/** Collapse spaces left by dropped optional parts; re-capitalise sentences. */
function tidy(s: string, sentence: boolean): string {
  const t = s.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
  return sentence ? t.charAt(0).toLocaleUpperCase('tr') + t.slice(1) : t;
}

export function normalize(s: string, lang: 'tr' | 'en' = 'tr'): string {
  const lower = lang === 'tr' ? trLower(s) : s.normalize('NFC').toLowerCase();
  return lower
    .replace(/[’‘`]/g, "'")
    .replace(/[.,!?;:…"“”«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/**
 * Check a typed answer against accepted answers (plain strings or patterns).
 * The first accepted answer is the "model" answer shown when nothing is close.
 */
export function checkTyped(given: string, accepted: string[], lang: 'tr' | 'en' = 'tr'): CheckResult {
  const candidates = accepted.flatMap(expandPattern);
  const g = normalize(given, lang);

  for (const c of candidates) if (normalize(c, lang) === g) return { status: 'correct', expected: c };

  if (lang === 'tr') {
    for (const c of candidates) {
      const n = normalize(c, lang);
      if (n.length === g.length && stripAccents(n) === stripAccents(g)) {
        const i = [...n].findIndex((ch, k) => ch !== g[k]);
        return { status: 'almost', expected: c, accent: { expected: n[i], given: g[i] } };
      }
    }
  }

  let best = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(normalize(c, lang), g);
    if (d < bestDist) { best = c; bestDist = d; }
  }
  return { status: 'wrong', expected: best };
}
