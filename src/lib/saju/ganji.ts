// 천간(天干) · 지지(地支) · 지장간(地藏干) standard tables.
import type { Element } from "../core/elements";

export type Gan = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type Ji = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
export type YinYang = "陽" | "陰";

export const GAN: Gan[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const JI: Ji[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const GAN_KO: Record<Gan, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
export const JI_KO: Record<Ji, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

export const GAN_ELEMENT: Record<Gan, Element> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
export const JI_ELEMENT: Record<Ji, Element> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

export const GAN_YINYANG: Record<Gan, YinYang> = {
  甲: "陽", 乙: "陰", 丙: "陽", 丁: "陰", 戊: "陽",
  己: "陰", 庚: "陽", 辛: "陰", 壬: "陽", 癸: "陰",
};
export const JI_YINYANG: Record<Ji, YinYang> = {
  子: "陽", 丑: "陰", 寅: "陽", 卯: "陰", 辰: "陽", 巳: "陰",
  午: "陽", 未: "陰", 申: "陽", 酉: "陰", 戌: "陽", 亥: "陰",
};

export const JI_ANIMAL: Record<Ji, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼", 辰: "용", 巳: "뱀",
  午: "말", 未: "양", 申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

// 지장간(地藏干): hidden stems within each branch, with approximate weights (합 ≈ 1).
export const JIJANGGAN: Record<Ji, { gan: Gan; w: number }[]> = {
  子: [{ gan: "壬", w: 0.3 }, { gan: "癸", w: 0.7 }],
  丑: [{ gan: "癸", w: 0.2 }, { gan: "辛", w: 0.2 }, { gan: "己", w: 0.6 }],
  寅: [{ gan: "戊", w: 0.15 }, { gan: "丙", w: 0.25 }, { gan: "甲", w: 0.6 }],
  卯: [{ gan: "甲", w: 0.3 }, { gan: "乙", w: 0.7 }],
  辰: [{ gan: "乙", w: 0.2 }, { gan: "癸", w: 0.2 }, { gan: "戊", w: 0.6 }],
  巳: [{ gan: "戊", w: 0.15 }, { gan: "庚", w: 0.25 }, { gan: "丙", w: 0.6 }],
  午: [{ gan: "丙", w: 0.3 }, { gan: "己", w: 0.1 }, { gan: "丁", w: 0.6 }],
  未: [{ gan: "丁", w: 0.2 }, { gan: "乙", w: 0.2 }, { gan: "己", w: 0.6 }],
  申: [{ gan: "戊", w: 0.15 }, { gan: "壬", w: 0.25 }, { gan: "庚", w: 0.6 }],
  酉: [{ gan: "庚", w: 0.3 }, { gan: "辛", w: 0.7 }],
  戌: [{ gan: "辛", w: 0.2 }, { gan: "丁", w: 0.2 }, { gan: "戊", w: 0.6 }],
  亥: [{ gan: "戊", w: 0.1 }, { gan: "甲", w: 0.3 }, { gan: "壬", w: 0.6 }],
};

export function isGan(c: string): c is Gan {
  return (GAN as string[]).includes(c);
}
export function isJi(c: string): c is Ji {
  return (JI as string[]).includes(c);
}

/** Parse a 2-char 간지 like "庚午" into its 천간/지지. */
export function parseGanji(gz: string): { gan: Gan; ji: Ji } {
  const gan = gz[0] as Gan;
  const ji = gz[1] as Ji;
  return { gan, ji };
}
