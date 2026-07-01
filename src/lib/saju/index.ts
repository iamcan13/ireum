// 사주(四柱) 엔진 — 만세력 4기둥, 오행 분포, 신강/신약, 용신·부족오행 추정.
// 정밀한 만세력 계산은 KASI(한국천문연구원) 데이터 기반 manseryeok에 위임한다.
// (입춘 instant·절기 KST 평가·야자시 경계·진태양시 보정까지 한국 만세력 기준 정확)
// 그 위에 오행 분석/작명 보완 로직을 직접 구현한다. (해석은 전통 명리 기반 참고용)
import { calculateFourPillars } from "manseryeok";
import {
  type Element,
  ELEMENTS,
  GENERATES,
  CONTROLS,
  tenGod,
  type TenGod,
  ELEMENT_KO,
  ELEMENT_NOUN,
} from "../core/elements";
import {
  type Gan,
  type Ji,
  GAN_ELEMENT,
  JI_ELEMENT,
  GAN_KO,
  JI_KO,
  GAN_YINYANG,
  JI_ANIMAL,
  JIJANGGAN,
  parseGanji,
} from "./ganji";

export interface Pillar {
  role: "년주" | "월주" | "일주" | "시주";
  gan: Gan;
  ji: Ji;
  ganKo: string;
  jiKo: string;
  ganElement: Element;
  jiElement: Element;
  yinYang: string;
  animal: string;
  jijanggan: Gan[];
}

export interface SajuInput {
  year: number;
  month: number; // 1-12
  day: number;
  hour?: number | null; // 0-23
  minute?: number | null;
  // 자시(子時) 일주 경계: midnight=달력일 기준(검증된 기본값), jasi=23시 기준, splitJasi=야/조자시 분리
  dayBoundary?: "midnight" | "jasi" | "splitJasi";
  trueSolarTime?: boolean; // 진태양시 보정(경도+균시차+한국 표준시 이력)
  longitude?: number; // default 서울 126.978
}

export interface SajuResult {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  hasHour: boolean;
  dayMaster: Gan;
  dayMasterElement: Element;
  dayMasterYinYang: string;
  ganjiText: { year: string; month: string; day: string; hour: string | null };
  elementCount: Record<Element, number>; // 보이는 글자(천간+지지 본기) 개수
  elementWeighted: Record<Element, number>; // 지장간 포함 가중치
  elementPercent: Record<Element, number>; // 가중치 정규화 %
  tenGodCount: Record<TenGod, number>;
  strength: { label: "신강" | "신약" | "중화"; score: number; note: string };
  yongsin: Element[]; // 권장(보완) 오행 — 작명에 활용
  lacking: Element[]; // 비어있거나 약한 오행
  recommend: Element[]; // 작명 자원오행 보완 우선순위 (yongsin ∪ lacking)
  summary: string;
}

const SEOUL_LON = 126.978;

function emptyElements(): Record<Element, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

/** element that generates `e` (e의 인성) */
function sourceOf(e: Element): Element {
  return (Object.keys(GENERATES) as Element[]).find((k) => GENERATES[k] === e)!;
}
/** element that controls `e` (e의 관성) */
function controllerOf(e: Element): Element {
  return (Object.keys(CONTROLS) as Element[]).find((k) => CONTROLS[k] === e)!;
}

function buildPillar(role: Pillar["role"], gz: string): Pillar {
  const { gan, ji } = parseGanji(gz);
  return {
    role,
    gan,
    ji,
    ganKo: GAN_KO[gan],
    jiKo: JI_KO[ji],
    ganElement: GAN_ELEMENT[gan],
    jiElement: JI_ELEMENT[ji],
    yinYang: GAN_YINYANG[gan],
    animal: JI_ANIMAL[ji],
    jijanggan: JIJANGGAN[ji].map((x) => x.gan),
  };
}

export function computeSaju(input: SajuInput): SajuResult {
  const hasHour =
    input.hour !== null && input.hour !== undefined && !Number.isNaN(input.hour);
  const hour = hasHour ? (input.hour as number) : 12; // 시각 미입력 시 정오로 계산 후 시주 제외
  const minute = hasHour ? input.minute ?? 0 : 0;

  const opts: Parameters<typeof calculateFourPillars>[0] = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour,
    minute,
    dayBoundary: input.dayBoundary ?? "midnight",
  };
  if (input.trueSolarTime) {
    opts.trueSolarTime = {
      longitude: input.longitude ?? SEOUL_LON,
      applyEquationOfTime: true,
      applyHistoricalDst: true,
    };
  }

  const o = calculateFourPillars(opts).toHanjaObject();
  const yearP = buildPillar("년주", o.year.hanja);
  const monthP = buildPillar("월주", o.month.hanja);
  const dayP = buildPillar("일주", o.day.hanja);
  const hourP = hasHour ? buildPillar("시주", o.hour.hanja) : null;

  const visible = [yearP, monthP, dayP, ...(hourP ? [hourP] : [])];

  // 오행 개수 (보이는 천간 + 지지 본기)
  const elementCount = emptyElements();
  for (const p of visible) {
    elementCount[p.ganElement] += 1;
    elementCount[p.jiElement] += 1;
  }

  // 가중치 (천간 1.0, 지지는 지장간 가중합 ≈ 1.0)
  const elementWeighted = emptyElements();
  for (const p of visible) {
    elementWeighted[p.ganElement] += 1;
    for (const hidden of JIJANGGAN[p.ji]) {
      elementWeighted[GAN_ELEMENT[hidden.gan]] += hidden.w;
    }
  }
  const totalW = ELEMENTS.reduce((s, e) => s + elementWeighted[e], 0) || 1;
  const elementPercent = emptyElements();
  for (const e of ELEMENTS)
    elementPercent[e] = Math.round((elementWeighted[e] / totalW) * 1000) / 10;

  const dayMaster = dayP.gan;
  const dmEl = dayP.ganElement;
  const inEl = sourceOf(dmEl); // 인성
  const outEl = GENERATES[dmEl]; // 식상
  const wealthEl = CONTROLS[dmEl]; // 재성
  const officerEl = controllerOf(dmEl); // 관성

  // 십성 분포 (보이는 글자 기준)
  const tenGodCount: Record<TenGod, number> = {
    비겁: 0,
    인성: 0,
    식상: 0,
    재성: 0,
    관성: 0,
  };
  for (const e of ELEMENTS) tenGodCount[tenGod(dmEl, e)] += elementCount[e];

  // 신강/신약 (억부) — 비겁+인성(아군) 대 나머지, 월령 가중
  const support = elementWeighted[dmEl] + elementWeighted[inEl];
  let score = (support / totalW) * 100;
  const monthEl = monthP.jiElement;
  const deukryeong = monthEl === dmEl || monthEl === inEl; // 득령
  score += deukryeong ? 8 : -6;
  score = Math.max(2, Math.min(98, Math.round(score)));
  const label: SajuResult["strength"]["label"] =
    score >= 55 ? "신강" : score <= 45 ? "신약" : "중화";
  const strengthNote =
    label === "신강"
      ? "일간을 돕는 기운이 넉넉합니다. 기운을 덜어내고 흘려보내는 오행이 이로워요."
      : label === "신약"
        ? "일간이 다소 약합니다. 일간을 돕고 채워주는 오행이 이로워요."
        : "기운이 비교적 고르게 균형 잡혀 있습니다.";

  // 용신(권장 오행) 추정 — 억부 기반 단순 추정
  let yongsin: Element[];
  if (label === "신강") {
    // 덜어내는 오행: 관성 > 식상 > 재성 순으로 권장
    yongsin = uniq([officerEl, outEl, wealthEl]);
  } else if (label === "신약") {
    // 채우는 오행: 인성 > 비겁
    yongsin = uniq([inEl, dmEl]);
  } else {
    yongsin = [];
  }

  // 부족(0이거나 약한) 오행
  const sortedWeak = [...ELEMENTS].sort(
    (a, b) => elementWeighted[a] - elementWeighted[b]
  );
  const zero = ELEMENTS.filter((e) => elementCount[e] === 0);
  const lacking = zero.length ? zero : sortedWeak.slice(0, 1);

  // 작명 보완 우선순위: 용신을 우선하되 '부족 오행'과 겹치면 더 강조
  const recommend = uniq([
    ...yongsin.filter((e) => lacking.includes(e)),
    ...yongsin,
    ...lacking,
  ]).slice(0, 3);

  const summary = buildSummary({
    dmEl,
    dayMasterYinYang: GAN_YINYANG[dayMaster],
    dayMaster,
    label,
    elementCount,
    lacking,
    recommend,
    hasHour,
  });

  return {
    pillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
    hasHour,
    dayMaster,
    dayMasterElement: dmEl,
    dayMasterYinYang: GAN_YINYANG[dayMaster],
    ganjiText: {
      year: yearP.gan + yearP.ji,
      month: monthP.gan + monthP.ji,
      day: dayP.gan + dayP.ji,
      hour: hourP ? hourP.gan + hourP.ji : null,
    },
    elementCount,
    elementWeighted,
    elementPercent,
    tenGodCount,
    strength: { label, score, note: strengthNote },
    yongsin,
    lacking,
    recommend,
    summary,
  };
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function buildSummary(a: {
  dmEl: Element;
  dayMasterYinYang: string;
  dayMaster: Gan;
  label: string;
  elementCount: Record<Element, number>;
  lacking: Element[];
  recommend: Element[];
  hasHour: boolean;
}): string {
  const strong = ELEMENTS.filter((e) => a.elementCount[e] >= 3);
  const dmDesc = `일간(나의 기운)은 ${a.dayMaster}(${GAN_KO[a.dayMaster]}·${ELEMENT_KO[a.dmEl]})로, ${a.dayMasterYinYang === "陽" ? "양" : "음"}의 ${ELEMENT_NOUN[a.dmEl]} 기운입니다.`;
  const balanceDesc = strong.length
    ? `사주 전체로는 ${strong.map((e) => ELEMENT_KO[e]).join("·")} 기운이 두드러지고, `
    : `오행이 비교적 고르며, `;
  const lackDesc = a.lacking.length
    ? `${a.lacking.map((e) => ELEMENT_KO[e]).join("·")} 기운이 부족합니다.`
    : `특별히 비어 있는 기운은 없습니다.`;
  const advise = a.recommend.length
    ? ` 이름에는 ${a.recommend.map((e) => `${ELEMENT_KO[e]}(${ELEMENT_NOUN[e]})`).join("·")} 기운을 더해 균형을 잡아주면 잘 어울립니다.`
    : "";
  const hourNote = a.hasHour
    ? ""
    : " (태어난 시각을 입력하면 시주까지 더해 더 정확히 풀이합니다.)";
  return `${dmDesc} ${balanceDesc}${lackDesc}${advise}${hourNote}`;
}
