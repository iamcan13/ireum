// 특정 이름 공유용 permalink 인코딩/디코딩.
// 서버(generateMetadata)·클라이언트 양쪽에서 안전하게 동작하도록 base64url + UTF-8 처리.
import type { Suggestion, Gender, NameParams } from "./types";
import type { Element } from "../core/elements";

export interface SharePick {
  c: string; // 한자
  eum: string; // 음
  hun: string; // 훈
  meaning: string; // 뜻
  s: number; // 획수
  oh: Element; // 자원오행
  gender: Gender;
}

export interface ShareSeed {
  s: string; // 성(한글, "" 가능)
  sh?: string; // 성 한자
  gd: Gender; // 성별
  p: SharePick[]; // 이름 음절별 한자
  // 사주 입력(디테일 뷰 복원용) — 생년월일·탄생 시분 등
  bd?: string; // 생년월일 YYYY-MM-DD
  bt?: string; // 탄생 시:분 HH:mm
  db?: "midnight" | "jasi" | "splitJasi"; // 날짜 경계 옵션
  ts?: boolean; // 진태양시 보정
  us?: boolean; // 사주 사용 여부
}

function b64urlEncode(str: string): string {
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(str, "utf8").toString("base64")
      : btoa(String.fromCharCode(...new TextEncoder().encode(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(slug: string): string {
  const b64 = slug.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") return Buffer.from(b64, "base64").toString("utf8");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShare(s: Suggestion, params: NameParams): string {
  const seed: ShareSeed = {
    s: params.surname || "",
    sh: params.surnameHanja,
    gd: params.gender,
    p: s.picks.map((pk) => ({
      c: pk.hanja.c,
      eum: pk.hanja.eum,
      hun: pk.hanja.hun,
      meaning: pk.hanja.meaning,
      s: pk.hanja.s,
      oh: pk.hanja.oh,
      gender: pk.hanja.gender,
    })),
    // 사주 입력을 함께 인코딩 — 디테일 뷰 재진입 시 생년월일·시분까지 복원
    ...(params.useSaju && params.birthDate ? { us: true, bd: params.birthDate } : {}),
    ...(params.useSaju && params.birthTime ? { bt: params.birthTime } : {}),
    ...(params.useSaju && params.dayBoundary ? { db: params.dayBoundary } : {}),
    ...(params.useSaju && params.trueSolarTime ? { ts: true } : {}),
  };
  return b64urlEncode(JSON.stringify(seed));
}

// ShareSeed → NameParams 복원(사주 입력 포함).
export function paramsFromShare(seed: ShareSeed): NameParams {
  return {
    surname: seed.s || "",
    surnameHanja: seed.sh,
    gender: seed.gd,
    syllableCount: seed.p.length === 1 ? 1 : 2,
    rarity: 50,
    useSaju: !!seed.us && !!seed.bd,
    birthDate: seed.bd,
    birthTime: seed.bt,
    dayBoundary: seed.db,
    trueSolarTime: seed.ts,
  };
}

export function decodeShare(slug: string): ShareSeed | null {
  try {
    const seed = JSON.parse(b64urlDecode(slug)) as ShareSeed;
    if (
      !seed ||
      typeof seed.s !== "string" ||
      !Array.isArray(seed.p) ||
      seed.p.length === 0
    ) {
      return null;
    }
    return seed;
  } catch {
    return null;
  }
}

// generateMetadata 용 — 무거운 엔진 없이 표시 문자열만 뽑는다.
export function shareTextMeta(seed: ShareSeed): {
  given: string;
  fullName: string;
  hanja: string;
  meaning: string;
} {
  const given = seed.p.map((p) => p.eum).join("");
  const fullName = (seed.s || "") + given;
  const hanja = (seed.sh ?? "") + seed.p.map((p) => p.c).join("");
  const meaning = seed.p.map((p) => p.meaning).join(" · ");
  return { given, fullName, hanja, meaning };
}
