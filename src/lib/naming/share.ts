// 특정 이름 공유용 permalink 인코딩/디코딩.
// 서버(generateMetadata)·클라이언트 양쪽에서 안전하게 동작하도록 base64url + UTF-8 처리.
import type { Suggestion, Gender } from "./types";
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

export function encodeShare(
  s: Suggestion,
  surname: string,
  surnameHanja: string | undefined,
  gender: Gender
): string {
  const seed: ShareSeed = {
    s: surname || "",
    sh: surnameHanja,
    gd: gender,
    p: s.picks.map((pk) => ({
      c: pk.hanja.c,
      eum: pk.hanja.eum,
      hun: pk.hanja.hun,
      meaning: pk.hanja.meaning,
      s: pk.hanja.s,
      oh: pk.hanja.oh,
      gender: pk.hanja.gender,
    })),
  };
  return b64urlEncode(JSON.stringify(seed));
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
