// 신생아 이름 통계 기반 '흔함 지수' 엔진.
// 데이터: 대법원 전자가족관계등록시스템 기반 집계(2015–2024). 순위 기반이므로
// 절대 인원수는 추정하지 않고, 순위·등장빈도로 흔함 정도를 계량한다.
import statsRaw from "../../data/nameStats.json";

type GenderKey = "male" | "female";
export type StatsGender = GenderKey | "neutral";

interface RankedName {
  rank: number;
  name: string;
  verified?: boolean;
}
interface YearBlock {
  year: number;
  male: RankedName[];
  female: RankedName[];
}
interface StatsData {
  schemaVersion: number;
  provenance: { source: string; url: string; retrieved: boolean; note?: string }[];
  years: YearBlock[];
  decadeTop: { male: RankedName[]; female: RankedName[] };
}

const stats = statsRaw as unknown as StatsData;

export const STATS_PROVENANCE = stats.provenance;
export const STATS_YEARS = stats.years.map((y) => y.year).sort((a, b) => a - b);

export type CommonnessTier = "매우 흔함" | "흔함" | "보통" | "드묾" | "희귀";

export interface CommonnessResult {
  score: number; // 0(희귀)–100(매우 흔함)
  tier: CommonnessTier;
  decadeRank: number | null; // 10년 종합 순위
  yearly: { year: number; rank: number }[]; // 연도별 top20 등장
  verdict: string; // 사람이 읽는 한 줄
  spark: { year: number; value: number | null }[]; // 0..1, 없으면 null
}

interface GenderIndex {
  decadeRank: Map<string, number>;
  decadeTotal: number;
  yearly: Map<string, { year: number; rank: number }[]>;
  syllable: Map<string, number>; // 0..1 popularity
}

function buildIndex(g: GenderKey): GenderIndex {
  const decadeRank = new Map<string, number>();
  const list = stats.decadeTop[g] ?? [];
  for (const r of list) decadeRank.set(r.name, r.rank);

  const yearly = new Map<string, { year: number; rank: number }[]>();
  const sylRaw = new Map<string, number>();
  for (const yb of stats.years) {
    for (const r of yb[g] ?? []) {
      const arr = yearly.get(r.name) ?? [];
      arr.push({ year: yb.year, rank: r.rank });
      yearly.set(r.name, arr);
      const w = (21 - r.rank) / 20; // rank1→1.0, rank20→0.05
      for (const ch of r.name) sylRaw.set(ch, (sylRaw.get(ch) ?? 0) + w);
    }
  }
  // decadeTop adds weight to syllables too
  for (const r of list) {
    const w = ((list.length - r.rank + 1) / list.length) * 2;
    for (const ch of r.name) sylRaw.set(ch, (sylRaw.get(ch) ?? 0) + w);
  }
  const max = Math.max(1, ...sylRaw.values());
  const syllable = new Map<string, number>();
  for (const [k, v] of sylRaw) syllable.set(k, v / max);

  return { decadeRank, decadeTotal: list.length, yearly, syllable };
}

const INDEX: Record<GenderKey, GenderIndex> = {
  male: buildIndex("male"),
  female: buildIndex("female"),
};

function tierOf(score: number): CommonnessTier {
  if (score >= 80) return "매우 흔함";
  if (score >= 64) return "흔함";
  if (score >= 44) return "보통";
  if (score >= 25) return "드묾";
  return "희귀";
}

function scoreForGender(name: string, g: GenderKey): {
  score: number;
  decadeRank: number | null;
  yearly: { year: number; rank: number }[];
} {
  const idx = INDEX[g];
  const yearly = (idx.yearly.get(name) ?? []).slice().sort((a, b) => a.year - b.year);
  const dRank = idx.decadeRank.get(name) ?? null;

  let score: number;
  if (dRank != null) {
    score = Math.round(96 - (dRank - 1) * (26 / Math.max(idx.decadeTotal - 1, 1)));
  } else if (yearly.length) {
    const best = Math.min(...yearly.map((y) => y.rank));
    const base = 80 - (best - 1) * (30 / 19);
    score = Math.round(Math.min(base + Math.min(yearly.length * 1.5, 12), 90));
  } else {
    const sy = [...name].map((c) => idx.syllable.get(c) ?? 0);
    const avg = sy.length ? sy.reduce((a, b) => a + b, 0) / sy.length : 0;
    score = Math.round(8 + avg * 40);
  }
  return { score: Math.max(2, Math.min(99, score)), decadeRank: dRank, yearly };
}

export function commonness(name: string, gender: StatsGender): CommonnessResult {
  const given = name.trim();
  let best: { score: number; decadeRank: number | null; yearly: { year: number; rank: number }[]; g: GenderKey };
  if (gender === "neutral") {
    const m = scoreForGender(given, "male");
    const f = scoreForGender(given, "female");
    best = (m.score >= f.score ? { ...m, g: "male" as const } : { ...f, g: "female" as const });
  } else {
    const s = scoreForGender(given, gender);
    best = { ...s, g: gender };
  }

  const score = best.score;
  const tier = tierOf(score);

  const yearMap = new Map(best.yearly.map((y) => [y.year, y.rank]));
  const spark = STATS_YEARS.map((year) => {
    const rank = yearMap.get(year);
    return { year, value: rank != null ? (21 - rank) / 20 : null };
  });

  let verdict: string;
  if (best.decadeRank != null) {
    verdict = `최근 10년 인기 이름 종합 ${best.decadeRank}위 — 또래에 같은 이름이 많은 편이에요.`;
  } else if (best.yearly.length) {
    const yrs = best.yearly.map((y) => y.year).join("·");
    const bestRank = Math.min(...best.yearly.map((y) => y.rank));
    verdict = `${yrs}년 상위 20위(최고 ${bestRank}위)에 들었던 이름이에요.`;
  } else {
    verdict =
      tier === "희귀"
        ? "최근 10년 인기 순위에 보이지 않는, 흔치 않은 이름이에요."
        : "최근 10년 상위 인기 이름에는 없어요 — 비교적 개성 있는 이름이에요.";
  }

  return { score, tier, decadeRank: best.decadeRank, yearly: best.yearly, verdict, spark };
}

/** 음절 자체의 또래 인기도(0..1) — UI 설명용. */
export function syllablePopularity(syllable: string, gender: StatsGender): number {
  if (gender === "neutral") {
    return Math.max(
      INDEX.male.syllable.get(syllable) ?? 0,
      INDEX.female.syllable.get(syllable) ?? 0
    );
  }
  return INDEX[gender].syllable.get(syllable) ?? 0;
}

/** 인기 이름 목록(추천 회피 등에 활용). */
export function popularNames(gender: StatsGender, n = 50): string[] {
  if (gender === "neutral") {
    const set = new Set<string>();
    for (const g of ["male", "female"] as GenderKey[])
      for (const r of stats.decadeTop[g]) set.add(r.name);
    return [...set].slice(0, n);
  }
  return stats.decadeTop[gender].slice(0, n).map((r) => r.name);
}

/** 연도별 상위 N개 이름 (통계 탐색용). */
export function yearlyTopNames(
  gender: "male" | "female",
  topN = 10
): { year: number; names: { rank: number; name: string }[] }[] {
  return stats.years
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((y) => ({ year: y.year, names: (y[gender] ?? []).slice(0, topN) }));
}

/** 10년 종합 상위 이름. */
export function decadeTopNames(
  gender: "male" | "female",
  n = 20
): { rank: number; name: string }[] {
  return (stats.decadeTop[gender] ?? []).slice(0, n);
}

export const STATS_SOURCE_NOTE =
  "대법원 전자가족관계등록시스템 기반 집계 · 순위 기준(인원수 비공개)";
