// 수리성명학 — 사격(四格: 元亨利貞) 계산 + 81수리 길흉.
// 획수는 현행 한자 자형 총획(Unihan kTotalStrokes) 기준. (전통 강희자전 원획과 미세한 차이 가능 — UI에 명시)
import myeongri from "../../data/myeongri.json";

export type Fortune = "吉" | "凶" | "半吉半凶";

interface Su81Entry {
  num: number;
  fortune: Fortune;
  meaning_ko: string;
}
const SU81: Su81Entry[] = (myeongri as { su81: Su81Entry[] }).su81;
const SU81_MAP = new Map<number, Su81Entry>(SU81.map((e) => [e.num, e]));

/** 81 초과 수리는 81 주기로 환원. */
export function reduce81(n: number): number {
  if (n <= 0) return 1;
  return ((n - 1) % 81) + 1;
}

export function su81(n: number): Su81Entry {
  const m = reduce81(n);
  return SU81_MAP.get(m) ?? { num: m, fortune: "半吉半凶", meaning_ko: "" };
}

export type GyeokKey = "원격" | "형격" | "이격" | "정격";
export interface Gyeok {
  key: GyeokKey;
  hanja: string; // 元/亨/利/貞
  raw: number; // 합계(환원 전)
  num: number; // 81수리 환원값
  fortune: Fortune;
  meaning: string;
  role: string; // 초년/청장년/중년/말년·총운
}

const GYEOK_META: Record<GyeokKey, { hanja: string; role: string }> = {
  원격: { hanja: "元", role: "초년운 · 성장의 기초" },
  형격: { hanja: "亨", role: "청장년운 · 사회활동의 중심(主運)" },
  이격: { hanja: "利", role: "중년운 · 대인관계(外運)" },
  정격: { hanja: "貞", role: "말년운 · 일생의 총운(總運)" },
};

function mk(key: GyeokKey, raw: number): Gyeok {
  const e = su81(raw);
  return {
    key,
    hanja: GYEOK_META[key].hanja,
    raw,
    num: e.num,
    fortune: e.fortune,
    meaning: e.meaning_ko,
    role: GYEOK_META[key].role,
  };
}

export interface SuriResult {
  gyeok: Gyeok[]; // [원, 형, 이, 정]
  score: number; // 0(흉)–100(길)
  label: "길" | "반길" | "흉";
  goodCount: number;
  badCount: number;
}

/**
 * @param surnameStrokes 성(姓) 각 글자의 획수 (보통 1글자)
 * @param givenStrokes   이름 각 글자의 획수 (1~2글자)
 */
export function computeSuri(
  surnameStrokes: number[],
  givenStrokes: number[]
): SuriResult {
  const S = surnameStrokes.reduce((a, b) => a + b, 0);
  let won: number, hyeong: number, i: number, jeong: number;

  if (givenStrokes.length >= 2) {
    const [n1, n2] = givenStrokes;
    won = n1 + n2;
    hyeong = S + n1;
    i = S + n2;
    jeong = S + n1 + n2;
  } else {
    // 1글자 이름: 빈자리에 가성수(假成數)=1
    const n1 = givenStrokes[0] ?? 0;
    won = n1 + 1;
    hyeong = S + n1;
    i = S + 1;
    jeong = S + n1;
  }

  const gyeok = [
    mk("원격", won),
    mk("형격", hyeong),
    mk("이격", i),
    mk("정격", jeong),
  ];

  // 가중 점수: 정격(총운) > 형격(주운) > 원격 > 이격
  const weight: Record<GyeokKey, number> = {
    정격: 0.35,
    형격: 0.3,
    원격: 0.2,
    이격: 0.15,
  };
  const val = (f: Fortune) => (f === "吉" ? 1 : f === "凶" ? -1 : 0);
  let acc = 0;
  for (const g of gyeok) acc += weight[g.key] * val(g.fortune);
  const score = Math.round(((acc + 1) / 2) * 100);
  const goodCount = gyeok.filter((g) => g.fortune === "吉").length;
  const badCount = gyeok.filter((g) => g.fortune === "凶").length;
  const label: SuriResult["label"] =
    score >= 62 ? "길" : score <= 42 ? "흉" : "반길";

  return { gyeok, score, label, goodCount, badCount };
}
