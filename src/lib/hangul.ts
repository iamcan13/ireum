// 한글 자모 분해 + 발음오행(소리오행).
// 발음오행은 통용되는 작명 기준(아음 木 · 설음 火 · 후음 土 · 치음 金 · 순음 水)을 따른다.
import type { Element } from "./core/elements";

export const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export const JUNG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
] as const;

export const JONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

// 초성(자음) → 오행
const CONSONANT_ELEMENT: Record<string, Element> = {
  ㄱ: "木", ㅋ: "木", ㄲ: "木", // 牙音(아음)
  ㄴ: "火", ㄷ: "火", ㄹ: "火", ㅌ: "火", ㄸ: "火", // 舌音(설음)
  ㅇ: "土", ㅎ: "土", // 喉音(후음)
  ㅅ: "金", ㅈ: "金", ㅊ: "金", ㅆ: "金", ㅉ: "金", // 齒音(치음)
  ㅁ: "水", ㅂ: "水", ㅍ: "水", ㅃ: "水", // 脣音(순음)
};

export interface Jamo {
  cho: string;
  jung: string;
  jong: string;
  hasBatchim: boolean;
}

const SBASE = 0xac00;
const SCOUNT = 11172;

export function isHangulSyllable(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return code >= SBASE && code < SBASE + SCOUNT;
}

export function decompose(ch: string): Jamo | null {
  const code = (ch.codePointAt(0) ?? 0) - SBASE;
  if (code < 0 || code >= SCOUNT) return null;
  const cho = Math.floor(code / 588);
  const jung = Math.floor((code % 588) / 28);
  const jong = code % 28;
  return {
    cho: CHO[cho],
    jung: JUNG[jung],
    jong: JONG[jong],
    hasBatchim: jong !== 0,
  };
}

/** 한 음절의 발음오행 (초성 기준). */
export function syllableElement(ch: string): Element | null {
  const j = decompose(ch);
  if (!j) return null;
  return CONSONANT_ELEMENT[j.cho] ?? null;
}

/** 자음(초성 jamo) → 오행 직접 매핑. */
export function consonantElement(consonant: string): Element | null {
  return CONSONANT_ELEMENT[consonant] ?? null;
}

/** 이름 문자열 → 음절별 발음오행 배열. */
export function nameElements(name: string): (Element | null)[] {
  return [...name].map((c) => syllableElement(c));
}

export function hasBatchim(ch: string): boolean {
  return decompose(ch)?.hasBatchim ?? false;
}

/** 초성 jamo 추출(예: "준" → "ㅈ"). */
export function initialConsonant(ch: string): string | null {
  return decompose(ch)?.cho ?? null;
}
