import type { Element } from "../core/elements";
import type { SuriResult } from "./suri";
import type { BaleumResult } from "./baleum";
import type { CommonnessResult } from "../stats/commonness";

export type Gender = "male" | "female" | "neutral";

export interface NamingHanjaEntry {
  c: string; // 한자
  eum: string; // 음(한글 독음)
  hun: string; // 훈(새김)
  meaning: string; // 한 줄 뜻
  s: number; // 총획수
  oh: Element; // 자원오행
  gender: Gender;
  bad?: 1;
}

export interface SurnameOption {
  c: string;
  s: number;
  oh: Element;
}

export interface NameParams {
  surname: string; // 한글 성 ("" 가능)
  surnameHanja?: string; // 선택한 성 한자
  gender: Gender;
  birthDate?: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm (선택)
  dayBoundary?: "midnight" | "jasi" | "splitJasi";
  trueSolarTime?: boolean;
  syllableCount: 1 | 2;
  rarity: number; // 0(흔해도 OK)–100(희귀하게)
  preferredInitials?: string[]; // 선호 초성 자모 (예: ["ㅅ","ㅈ"])
  preferredElements?: Element[]; // 선호 소리 오행
  avoidBatchim?: boolean; // 받침 없는 이름 선호
  preferredHanja?: string[]; // 선호 한자 (현재 UI 미사용)
  fixed?: { pos: number; c: string } | null; // (구) 고정 한자 — 현재 미사용
  // 돌림자(항렬): 특정 음절을 위치 고정. c 지정 시 그 한자로 고정, 미지정 시 한자 변형 허용
  dollimja?: { syllable: string; pos: 0 | 1; c?: string } | null;
  useSaju: boolean;
}

export interface SyllablePick {
  syllable: string;
  hanja: NamingHanjaEntry;
}

export interface Suggestion {
  id: string;
  given: string; // 이름(한글)
  fullName: string; // 성+이름
  picks: SyllablePick[];
  hanjaString: string; // 한자 조합
  meaning: string; // 합성 뜻
  elements: Element[]; // 자원오행 시퀀스
  suri: SuriResult;
  baleum: BaleumResult;
  commonness: CommonnessResult;
  sajuFit: { score: number; matched: Element[] } | null;
  score: number; // 0..100 종합
  reasons: string[];
}
