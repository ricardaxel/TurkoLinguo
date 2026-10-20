// Turkish letter helpers. Always use these instead of String.toLowerCase(),
// which maps I → i instead of I → ı.

export const VOWELS = 'aeıioöuü';
export const FRONT = 'eiöü';
/** Fıstıkçı Şahap */
export const VOICELESS = 'fstkçşhp';

export const trLower = (s: string) => s.normalize('NFC').toLocaleLowerCase('tr');
export const trUpper = (s: string) => s.normalize('NFC').toLocaleUpperCase('tr');

const ACCENTS: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

/** Remove Turkish accents (input must already be lowercased with trLower). */
export const stripAccents = (s: string) => s.replace(/[çğıöşüâîû]/g, (c) => ACCENTS[c]);

export const isVowel = (c: string) => VOWELS.includes(trLower(c));

/** Last vowel of a word, lowercased (â/î/û count as a/i/u). */
export function lastVowel(s: string): string | undefined {
  const low = trLower(s).replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  for (let i = low.length - 1; i >= 0; i--) if (VOWELS.includes(low[i])) return low[i];
  return undefined;
}

export function firstVowel(s: string): string | undefined {
  const low = trLower(s);
  for (const c of low) if (VOWELS.includes(c)) return c;
  return undefined;
}

export const isFrontVowel = (v: string) => FRONT.includes(v);
export const lastChar = (s: string) => trLower(s).slice(-1);
export const endsInVowel = (s: string) => isVowel(lastChar(s));
export const endsInVoiceless = (s: string) => VOICELESS.includes(lastChar(s));
export const countVowels = (s: string) => [...trLower(s)].filter((c) => VOWELS.includes(c)).length;
