// 발음오행(소리오행) — 성+이름 음절의 초성 오행이 상생으로 이어지는지 분석.
import { type Element, relation, type Relation } from "../core/elements";
import { syllableElement } from "../hangul";

export interface BaleumLink {
  from: { syllable: string; element: Element };
  to: { syllable: string; element: Element };
  relation: Relation; // 생/극/비화/역생/역극
  good: boolean;
}

export interface BaleumResult {
  sequence: { syllable: string; element: Element | null }[];
  links: BaleumLink[];
  score: number; // 0(흉)–100(길)
  label: "상생" | "무난" | "상극";
  summary: string;
}

const REL_LABEL: Record<Relation, string> = {
  생: "상생(이어줌)",
  비화: "비화(같은 기운)",
  역생: "역생",
  극: "상극(부딪힘)",
  역극: "역극",
};

/**
 * @param fullSyllables 성+이름을 한 배열로 (예: ["김","서","준"])
 */
export function computeBaleum(fullSyllables: string[]): BaleumResult {
  const sequence = fullSyllables.map((s) => ({
    syllable: s,
    element: syllableElement(s),
  }));

  const links: BaleumLink[] = [];
  for (let k = 0; k < sequence.length - 1; k++) {
    const a = sequence[k];
    const b = sequence[k + 1];
    if (!a.element || !b.element) continue;
    const rel = relation(a.element, b.element);
    links.push({
      from: { syllable: a.syllable, element: a.element },
      to: { syllable: b.syllable, element: b.element },
      relation: rel,
      good: rel === "생" || rel === "비화",
    });
  }

  // 점수: 생=+1, 비화=+0.5, 역생=0, 역극=-0.5, 극=-1 의 평균
  const relVal: Record<Relation, number> = {
    생: 1,
    비화: 0.5,
    역생: 0,
    역극: -0.5,
    극: -1,
  };
  const avg = links.length
    ? links.reduce((s, l) => s + relVal[l.relation], 0) / links.length
    : 0.5;
  const score = Math.round(((avg + 1) / 2) * 100);
  const label: BaleumResult["label"] =
    score >= 66 ? "상생" : score <= 40 ? "상극" : "무난";

  const goodN = links.filter((l) => l.good).length;
  const summary =
    links.length === 0
      ? "발음오행을 분석할 수 있는 음절이 부족해요."
      : label === "상생"
        ? `소리의 기운이 ${goodN}/${links.length} 구간에서 자연스럽게 이어져요.`
        : label === "상극"
          ? "소리의 기운이 서로 부딪히는 구간이 있어요."
          : "소리의 기운이 무난하게 흘러요.";

  return { sequence, links, score, label, summary };
}

export { REL_LABEL };
