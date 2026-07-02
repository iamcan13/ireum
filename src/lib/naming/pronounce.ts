// 이름(한자어 고유명사)의 표준발음.
// es-hangul의 standardizePronunciation은 합성어 규칙인 'ㄴ첨가'(제29항)와
// 용언 어간 전용 경음화(제24항)를 이름에도 적용해 과잉교정한다.
//   예) 이진연 → [이진년](오), 김도아 → [김또아](오), 방예 → [방녜](오)
// 이름은 하나의 단어로서 연음(제13항)만 적용해야 하므로:
//   1) empty-ㅇ 경계에서 받침을 다음 초성으로 옮겨 연음을 '선처리'해 ㄴ첨가를 차단
//   2) 표준화 후, 공명음(ㄴ/ㅁ/ㅇ) 받침 뒤에 잘못 붙은 된소리를 평음으로 복원
//   3) 원래 ㅇ초성이 ㄴ으로 바뀐(ㄴ첨가) 경우 ㅇ으로 복원
// 장애음(ㄱ/ㄷ/ㅂ) 뒤 경음화(제23항)와 ㄹ 뒤 한자어 경음화(제26항), 비음화·유음화·
// 격음화·ㅎ탈락 등은 그대로 유지한다.
import {
  standardizePronunciation,
  disassembleCompleteCharacter,
  combineCharacter,
} from "es-hangul";

const isSyllable = (ch: string): boolean => {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0xac00 && c <= 0xd7a3;
};

// 연음으로 다음 초성에 옮길 수 있는 단일 받침(ㅇ=유지, ㅎ=탈락, ㄷ/ㅌ=구개음화 → 제외, 겹받침 제외)
const MOVABLE = new Set([
  "ㄱ", "ㄲ", "ㄴ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅋ", "ㅍ",
]);
const TENSE_TO_PLAIN: Record<string, string> = {
  ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ",
};
const SONORANT = new Set(["ㄴ", "ㅁ", "ㅇ"]); // ㄹ은 한자어 경음화(제26항) 유지 위해 제외

function preLiaison(s: string): string {
  const arr = [...s];
  for (let i = 0; i < arr.length - 1; i++) {
    if (!isSyllable(arr[i]) || !isSyllable(arr[i + 1])) continue;
    const a = disassembleCompleteCharacter(arr[i]);
    const b = disassembleCompleteCharacter(arr[i + 1]);
    if (!a || !b) continue;
    if (b.choseong === "ㅇ" && a.jongseong && MOVABLE.has(a.jongseong)) {
      arr[i] = combineCharacter(a.choseong, a.jungseong);
      arr[i + 1] = combineCharacter(a.jongseong, b.jungseong, b.jongseong);
    }
  }
  return arr.join("");
}

function postFix(before: string, after: string): string {
  const B = [...before];
  const A = [...after];
  if (B.length !== A.length) return after; // 규칙상 길이는 보존되지만 안전장치
  for (let i = 1; i < A.length; i++) {
    if (!isSyllable(A[i]) || !isSyllable(A[i - 1]) || !isSyllable(B[i])) continue;
    const prev = disassembleCompleteCharacter(A[i - 1]);
    const cur = disassembleCompleteCharacter(A[i]);
    const bc = disassembleCompleteCharacter(B[i]);
    if (!prev || !cur || !bc) continue;
    // (1) 공명음 받침 뒤 잘못된 된소리 → 평음
    if (
      SONORANT.has(prev.jongseong) &&
      TENSE_TO_PLAIN[cur.choseong] &&
      bc.choseong === TENSE_TO_PLAIN[cur.choseong]
    ) {
      A[i] = combineCharacter(TENSE_TO_PLAIN[cur.choseong], cur.jungseong, cur.jongseong);
    }
    // (2) ㄴ첨가 제거 (원래 ㅇ초성 → ㄴ)
    const c2 = disassembleCompleteCharacter(A[i]);
    if (c2 && bc.choseong === "ㅇ" && c2.choseong === "ㄴ") {
      A[i] = combineCharacter("ㅇ", c2.jungseong, c2.jongseong);
    }
  }
  return A.join("");
}

/** 이름 표기(성+이름 등)의 표준발음을 이름 규칙에 맞게 반환한다. */
export function nameStandardPronunciation(name: string): string {
  if (!name) return name;
  const pre = preLiaison(name);
  return postFix(pre, standardizePronunciation(pre));
}
