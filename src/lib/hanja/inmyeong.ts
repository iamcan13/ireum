// 인명용 한자 DB — public/data/inmyeong.json 정적 파일을 필요 시 fetch(브라우저)로 로드.
// (초기 번들에 포함되지 않도록 정적 자산으로 제공)
import type { NamingHanjaEntry, Gender } from "../naming/types";
import type { Element } from "../core/elements";

export interface RawHanja {
  c: string; // 한자
  e: string; // 음(한글)
  h: string; // 훈
  m: string; // 뜻
  s: number; // 획수
  o: string; // 자원오행
  f: number; // 빈도(통계값)
  g: string; // gender
  cu: number; // 큐레이션(작명 상용) 여부
}
interface InmyeongData {
  source: string;
  readings: number;
  entries: number;
  byReading: Record<string, RawHanja[]>;
}

let _data: InmyeongData | null = null;
let _loading: Promise<InmyeongData> | null = null;

export async function loadInmyeong(): Promise<InmyeongData> {
  if (_data) return _data;
  if (_loading) return _loading;
  _loading = fetch("/data/inmyeong.json")
    .then((r) => {
      if (!r.ok) throw new Error("inmyeong load failed: " + r.status);
      return r.json();
    })
    .then((d: InmyeongData) => {
      _data = d;
      return d;
    });
  return _loading;
}

export function inmyeongSource(): string {
  return _data?.source ?? "";
}

export function rawToEntry(r: RawHanja): NamingHanjaEntry {
  return {
    c: r.c,
    eum: r.e,
    hun: r.h,
    meaning: r.m,
    s: r.s,
    oh: r.o as Element,
    gender: (r.g as Gender) || "neutral",
  };
}

/** 음절의 통계값 상위 N 한자 (큐레이션 상용 우선 → 빈도). */
export async function topHanjaForReading(
  syllable: string,
  n = 10
): Promise<NamingHanjaEntry[]> {
  const d = await loadInmyeong();
  return (d.byReading[syllable] ?? []).slice(0, n).map(rawToEntry);
}

/** 음절의 전체 인명용 한자(검색 모달용). */
export async function allHanjaForReading(syllable: string): Promise<RawHanja[]> {
  const d = await loadInmyeong();
  return d.byReading[syllable] ?? [];
}

/** 목록에서 한자/훈/뜻으로 필터. */
export function filterHanja(list: RawHanja[], query: string): RawHanja[] {
  const q = query.trim();
  if (!q) return list;
  return list.filter(
    (e) => e.c.includes(q) || e.h.includes(q) || e.m.includes(q) || e.e.includes(q)
  );
}
