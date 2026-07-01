// 작명 추천 엔진 — 사주(자원오행 보완) · 발음오행 · 수리 · 통계 흔함 · 선호를 결합.
import { computeSaju, type SajuResult } from "../saju";
import { computeSuri } from "./suri";
import { computeBaleum } from "./baleum";
import { commonness } from "../stats/commonness";
import { ELEMENT_KO, ELEMENT_NOUN, type Element } from "../core/elements";
import { initialConsonant, hasBatchim } from "../hangul";
import {
  hanjaForSyllable,
  NAMING_SYLLABLES,
  surnameOptions,
} from "../hanja/pool";
import type {
  NameParams,
  Suggestion,
  NamingHanjaEntry,
  SyllablePick,
  Gender,
} from "./types";

function genderOk(h: NamingHanjaEntry, g: Gender): boolean {
  if (g === "neutral") return true;
  return h.gender === g || h.gender === "neutral";
}

export function buildSaju(params: NameParams): SajuResult | null {
  if (!params.useSaju || !params.birthDate) return null;
  const [y, m, d] = params.birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  let hour: number | null = null;
  let minute: number | null = null;
  if (params.birthTime) {
    const [h, mi] = params.birthTime.split(":").map(Number);
    if (!Number.isNaN(h)) {
      hour = h;
      minute = Number.isNaN(mi) ? 0 : mi;
    }
  }
  return computeSaju({
    year: y,
    month: m,
    day: d,
    hour,
    minute,
    dayBoundary: params.dayBoundary,
    trueSolarTime: params.trueSolarTime,
  });
}

interface Resolved {
  saju: SajuResult | null;
  recommend: Element[];
  surnameSyllables: string[];
  surnameStrokes: number[];
  haveSurnameStrokes: boolean;
}

function resolve(params: NameParams): Resolved {
  const saju = buildSaju(params);
  const recommend = saju?.recommend ?? [];
  const surnameHangul = params.surname.trim();
  const surnameSyllables = surnameHangul ? [...surnameHangul] : [];
  const surnameStrokes: number[] = [];
  for (const sy of surnameSyllables) {
    const opts = surnameOptions(sy);
    let opt = opts[0];
    if (params.surnameHanja) {
      const m = opts.find((o) => o.c === params.surnameHanja);
      if (m) opt = m;
    }
    if (opt) surnameStrokes.push(opt.s);
  }
  const haveSurnameStrokes =
    surnameSyllables.length > 0 &&
    surnameStrokes.length === surnameSyllables.length;
  return { saju, recommend, surnameSyllables, surnameStrokes, haveSurnameStrokes };
}

function hanjaRank(h: NamingHanjaEntry, params: NameParams, recommend: Element[]): number {
  let k = 0;
  if (params.preferredHanja?.includes(h.c)) k += 6;
  const idx = recommend.indexOf(h.oh);
  if (idx === 0) k += 3;
  else if (idx > 0) k += 2;
  return k;
}

function rankedHanja(syl: string, params: NameParams, recommend: Element[]): NamingHanjaEntry[] {
  return hanjaForSyllable(syl)
    .filter((h) => genderOk(h, params.gender) && !h.bad)
    .map((h) => ({ h, k: hanjaRank(h, params, recommend) }))
    .sort((a, b) => b.k - a.k || a.h.s - b.h.s)
    .map((x) => x.h);
}

// 돌림자용 — 성별 제한 없이(가문 항렬자는 성별과 무관) 해당 음절의 한자.
function rankedHanjaAny(syl: string, params: NameParams, recommend: Element[]): NamingHanjaEntry[] {
  const list = hanjaForSyllable(syl).filter((h) => !h.bad);
  return list
    .map((h) => ({ h, k: hanjaRank(h, params, recommend) }))
    .sort((a, b) => b.k - a.k || a.h.s - b.h.s)
    .map((x) => x.h);
}

// 성별·받침 조건만 통과한 음절 풀 (초성 커버리지는 이름 단위로 별도 처리)
function candidateSyllables(params: NameParams): string[] {
  return NAMING_SYLLABLES.filter((syl) => {
    if (params.avoidBatchim && hasBatchim(syl)) return false;
    return hanjaForSyllable(syl).some((h) => genderOk(h, params.gender) && !h.bad);
  });
}

function makeSuggestion(
  picks: SyllablePick[],
  params: NameParams,
  r: Resolved
): Suggestion {
  const given = picks.map((p) => p.syllable).join("");
  const givenStrokes = picks.map((p) => p.hanja.s);
  const fullSyllables = [...r.surnameSyllables, ...picks.map((p) => p.syllable)];

  const baleum = computeBaleum(fullSyllables);
  const suri = computeSuri(r.haveSurnameStrokes ? r.surnameStrokes : [], givenStrokes);
  const comm = commonness(given, params.gender);

  let sajuFit: Suggestion["sajuFit"] = null;
  if (r.saju) {
    const matched = picks
      .filter((p) => r.recommend.includes(p.hanja.oh))
      .map((p) => p.hanja.oh);
    const score = r.recommend.length
      ? Math.round((matched.length / picks.length) * 100)
      : 50;
    sajuFit = { score, matched: [...new Set(matched)] };
  }

  const desiredCommon = 100 - params.rarity;
  const rarityFit = 100 - Math.abs(comm.score - desiredCommon);
  const qualityBase = 72;

  let wSaju = r.saju ? 0.26 : 0;
  let wBaleum = 0.18;
  let wSuri = 0.16;
  let wRar = 0.28;
  const wQual = 0.12;
  if (!r.saju) {
    wRar += 0.16;
    wBaleum += 0.1;
  }
  const sajuScore = sajuFit ? sajuFit.score : 50;
  const score = Math.round(
    wSaju * sajuScore +
      wBaleum * baleum.score +
      wSuri * suri.score +
      wRar * rarityFit +
      wQual * qualityBase
  );

  const reasons: string[] = [];
  if (sajuFit && sajuFit.matched.length) {
    reasons.push(
      `사주에 필요한 ${sajuFit.matched
        .map((e) => `${ELEMENT_KO[e]}(${ELEMENT_NOUN[e]})`)
        .join("·")} 기운을 채워줘요`
    );
  }
  if (baleum.label === "상생") reasons.push("성과 이름의 소리가 상생으로 이어져요");
  if (suri.label === "길") reasons.push(`수리 4격이 좋아요 (${suri.goodCount}/4 길)`);
  if (comm.tier === "희귀" || comm.tier === "드묾") {
    if (params.rarity >= 50) reasons.push("또래에 드문, 개성 있는 이름이에요");
  } else if (comm.tier === "매우 흔함" && params.rarity < 40) {
    reasons.push("요즘 사랑받는 친근한 이름이에요");
  }
  reasons.push(
    `${picks.map((p) => `${p.hanja.hun} ${p.hanja.eum}`).join(" · ")}`
  );

  const meaning = picks.map((p) => p.hanja.meaning).join(" · ");
  const hanjaString = picks.map((p) => p.hanja.c).join("");
  const surnameHanja = r.haveSurnameStrokes
    ? r.surnameSyllables
        .map((sy) => {
          const opts = surnameOptions(sy);
          const opt =
            (params.surnameHanja &&
              opts.find((o) => o.c === params.surnameHanja)) ||
            opts[0];
          return opt?.c ?? "";
        })
        .join("")
    : "";

  return {
    id: `${given}|${hanjaString}`,
    given,
    fullName: params.surname ? params.surname + given : given,
    picks,
    hanjaString: surnameHanja ? `${surnameHanja}${hanjaString}` : hanjaString,
    meaning,
    elements: picks.map((p) => p.hanja.oh),
    suri,
    baleum,
    commonness: comm,
    sajuFit,
    score,
    reasons: reasons.slice(0, 4),
  };
}

export function suggestNames(params: NameParams, limit = 48): Suggestion[] {
  const r = resolve(params);
  const out: Suggestion[] = [];
  const seen = new Set<string>();

  const push = (picks: SyllablePick[]) => {
    const s = makeSuggestion(picks, params, r);
    if (seen.has(s.id)) return;
    seen.add(s.id);
    out.push(s);
  };

  const selected = [...new Set(params.preferredInitials ?? [])];
  const dollimja =
    params.dollimja && params.dollimja.syllable ? params.dollimja : null;

  // 선택한 자음이 이름에 '하나씩 모두' 포함되는지 (순서 무관)
  const covers = (sylList: string[]): boolean => {
    if (!selected.length) return true;
    const inits = sylList.map((s) => initialConsonant(s));
    return selected.every((c) => inits.includes(c));
  };

  const base = candidateSyllables(params);
  const rankSyl = (syl: string) => {
    const best = rankedHanja(syl, params, r.recommend)[0];
    return best ? hanjaRank(best, params, r.recommend) : -1;
  };
  const topSyls = [...base].sort((a, b) => rankSyl(b) - rankSyl(a)).slice(0, 30);
  // 선택 자음으로 시작하는 음절은 커버 가능하도록 풀에 반드시 포함
  const selSyls = selected.length
    ? base.filter((s) => selected.includes(initialConsonant(s) ?? ""))
    : [];
  const pool = [...new Set([...topSyls, ...selSyls])];

  const optionsFor = (syl: string) => {
    if (syl === dollimja?.syllable) {
      if (dollimja.c) {
        const hit = hanjaForSyllable(syl).find((h) => h.c === dollimja.c);
        if (hit) return [hit]; // 특정 한자로 고정
      }
      return rankedHanjaAny(syl, params, r.recommend); // 한자 자동(변형 허용)
    }
    return rankedHanja(syl, params, r.recommend);
  };

  if (params.syllableCount === 1) {
    const syls = dollimja ? [dollimja.syllable] : pool;
    for (const syl of syls) {
      if (!covers([syl])) continue;
      for (const h of optionsFor(syl).slice(0, 3))
        push([{ syllable: syl, hanja: h }]);
    }
  } else {
    const pos0 = dollimja && dollimja.pos === 0 ? [dollimja.syllable] : pool;
    const pos1 = dollimja && dollimja.pos === 1 ? [dollimja.syllable] : pool;
    for (const s1 of pos0) {
      for (const s2 of pos1) {
        if (s1 === s2) continue;
        if (!covers([s1, s2])) continue;
        const h1list = optionsFor(s1).slice(0, 2);
        const h2list = optionsFor(s2).slice(0, 2);
        if (!h1list.length || !h2list.length) continue;
        push([
          { syllable: s1, hanja: h1list[0] },
          { syllable: s2, hanja: h2list[0] },
        ]);
        if (h2list[1])
          push([
            { syllable: s1, hanja: h1list[0] },
            { syllable: s2, hanja: h2list[1] },
          ]);
      }
    }
  }

  out.sort((a, b) => b.score - a.score || a.commonness.score - b.commonness.score);

  // 다양성: 같은 첫 글자가 상위에 몰리지 않도록 (첫 글자당 최대 3개 우선 노출)
  const perFirst = new Map<string, number>();
  const primary: Suggestion[] = [];
  const overflow: Suggestion[] = [];
  for (const s of out) {
    const f = s.picks[0].syllable;
    const c = perFirst.get(f) ?? 0;
    if (c < 3) {
      perFirst.set(f, c + 1);
      primary.push(s);
    } else overflow.push(s);
  }
  return [...primary, ...overflow].slice(0, limit);
}
