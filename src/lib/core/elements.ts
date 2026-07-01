// 오행(五行) — the five elements, shared across saju + naming engines.

export type Element = "木" | "火" | "土" | "金" | "水";

export const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

export const ELEMENT_KO: Record<Element, string> = {
  木: "목",
  火: "화",
  土: "토",
  金: "금",
  水: "수",
};

export const ELEMENT_NOUN: Record<Element, string> = {
  木: "나무",
  火: "불",
  土: "흙",
  金: "쇠",
  水: "물",
};

// maps to the CSS color token names defined in globals.css (text-wood, bg-fire, …)
export const ELEMENT_TOKEN: Record<Element, string> = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water",
};

export const ELEMENT_HEX: Record<Element, string> = {
  木: "#6fa98c",
  火: "#db6a53",
  土: "#e3a552",
  金: "#a7aeb5",
  水: "#5e89b3",
};

// 상생(相生): key generates value  (목생화, 화생토, 토생금, 금생수, 수생목)
export const GENERATES: Record<Element, Element> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

// 상극(相剋): key controls value  (목극토, 토극수, 수극화, 화극금, 금극목)
export const CONTROLS: Record<Element, Element> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

export function generates(a: Element, b: Element): boolean {
  return GENERATES[a] === b;
}
export function controls(a: Element, b: Element): boolean {
  return CONTROLS[a] === b;
}

/** Relationship between two elements (a → b) in 발음오행 terms. */
export type Relation = "생" | "극" | "비화" | "역생" | "역극";
export function relation(a: Element, b: Element): Relation {
  if (a === b) return "비화";
  if (GENERATES[a] === b) return "생";
  if (CONTROLS[a] === b) return "극";
  if (GENERATES[b] === a) return "역생";
  return "역극";
}

// 십성(十星) groups relative to a day-master element.
export type TenGod = "비겁" | "인성" | "식상" | "재성" | "관성";
export const TEN_GOD_LABEL: Record<TenGod, string> = {
  비겁: "비겁(자기·경쟁)",
  인성: "인성(도움·학문)",
  식상: "식상(표현·재능)",
  재성: "재성(재물·결실)",
  관성: "관성(명예·절제)",
};

/** Which 십성 group element `e` is, relative to day master `dm`. */
export function tenGod(dm: Element, e: Element): TenGod {
  if (e === dm) return "비겁";
  if (GENERATES[e] === dm) return "인성"; // e generates dm → supports
  if (GENERATES[dm] === e) return "식상"; // dm generates e → drains
  if (CONTROLS[dm] === e) return "재성"; // dm controls e
  return "관성"; // e controls dm
}
