// 특정 이름 공유용 permalink 인코딩/디코딩.
// 서버(generateMetadata)·클라이언트 양쪽에서 안전하게 동작하도록 base64url + UTF-8 처리.
//
// URL을 짧게 유지하기 위해 wire 포맷은 '한자·음·획수·자원오행 + 성/성별/사주입력'만 담고,
// 긴 한글 텍스트(훈·뜻)는 인코딩하지 않는다. 디코드 시 한자 풀에서 (음,한자)로 조회해 복원한다.
// 내부에서 쓰는 rich ShareSeed 형태는 그대로 유지해 나머지 코드는 바뀌지 않는다.
import type { Suggestion, Gender, NameParams } from "./types";
import type { Element } from "../core/elements";
import { hanjaForSyllable } from "../hanja/pool";

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];
const G_TO_SHORT: Record<Gender, string> = { male: "m", female: "f", neutral: "n" };
const SHORT_TO_G: Record<string, Gender> = { m: "male", f: "female", n: "neutral" };

export interface SharePick {
  c: string; // 한자
  eum: string; // 음
  hun: string; // 훈
  meaning: string; // 뜻
  s: number; // 획수
  oh: Element; // 자원오행
  gender: Gender;
}

// 실제로 URL에 직렬화되는 압축 포맷 — 키 오버헤드를 없앤 positional 튜플.
// [ s, h, g, c, e, k, o, bd, bt, db, ts, us ] (뒤쪽 falsy 값은 잘라 저장)
//   s: 성(한글) · h: 성 한자 · g: 성별 m|f|n · c: 이름 한자 · e: 이름 음
//   k: 음절별 획수[] · o: 음절별 자원오행(木火土金水) · bd: 생년월일 YYYYMMDD
//   bt: 시분 HHmm · db: 날짜경계 0|1|2 · ts: 진태양시 1 · us: 사주사용 1
type WireTuple = [
  string, string, string, string, string, number[], string,
  string?, string?, number?, number?, number?
];
const DB_CODES: ("midnight" | "jasi" | "splitJasi")[] = ["midnight", "jasi", "splitJasi"];

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
  const saju = params.useSaju;
  const tuple: WireTuple = [
    params.surname || "",
    params.surnameHanja || "",
    G_TO_SHORT[params.gender],
    s.picks.map((pk) => pk.hanja.c).join(""),
    s.picks.map((pk) => pk.hanja.eum).join(""),
    s.picks.map((pk) => pk.hanja.s),
    s.picks.map((pk) => pk.hanja.oh).join(""),
    saju && params.birthDate ? params.birthDate.replace(/-/g, "") : "",
    saju && params.birthTime ? params.birthTime.replace(/:/g, "") : "",
    saju && params.dayBoundary ? DB_CODES.indexOf(params.dayBoundary) : 0,
    saju && params.trueSolarTime ? 1 : 0,
    saju && params.birthDate ? 1 : 0,
  ];
  // 뒤쪽 falsy 값 잘라내기(획수 배열·오행 앞까지는 항상 유지)
  let end = tuple.length;
  while (end > 7 && !tuple[end - 1]) end--;
  return b64urlEncode(JSON.stringify(tuple.slice(0, end)));
}

// (음,한자)로 한자 풀에서 훈·뜻을 조회 (없으면 빈 문자열).
function lookupHun(eum: string, c: string): { hun: string; meaning: string } {
  const hit = hanjaForSyllable(eum).find((h) => h.c === c);
  return { hun: hit?.hun ?? "", meaning: hit?.meaning ?? "" };
}

// WireTuple → rich ShareSeed (훈·뜻 복원).
function hydrate(w: WireTuple): ShareSeed | null {
  const chars = [...(w[3] ?? "")];
  const eums = [...(w[4] ?? "")];
  if (!chars.length || chars.length !== eums.length) return null;
  const gender = SHORT_TO_G[w[2]] ?? "neutral";
  const strokes = Array.isArray(w[5]) ? w[5] : [];
  const oh = [...(w[6] ?? "")];
  const p: SharePick[] = chars.map((c, i) => {
    const eum = eums[i];
    const { hun, meaning } = lookupHun(eum, c);
    const oInput = oh[i] as Element;
    return {
      c,
      eum,
      hun,
      meaning,
      s: strokes[i] ?? 0,
      oh: ELEMENTS.includes(oInput) ? oInput : "土",
      gender,
    };
  });
  const bdRaw = w[7]; // YYYYMMDD
  const btRaw = w[8]; // HHmm
  const bd = bdRaw && bdRaw.length === 8
    ? `${bdRaw.slice(0, 4)}-${bdRaw.slice(4, 6)}-${bdRaw.slice(6, 8)}`
    : undefined;
  const bt = btRaw && btRaw.length === 4
    ? `${btRaw.slice(0, 2)}:${btRaw.slice(2, 4)}`
    : undefined;
  return {
    s: typeof w[0] === "string" ? w[0] : "",
    sh: w[1] || undefined,
    gd: gender,
    p,
    bd,
    bt,
    db: DB_CODES[w[9] ?? 0],
    ts: w[10] ? true : undefined,
    us: w[11] ? true : undefined,
  };
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
    const parsed = JSON.parse(b64urlDecode(slug));
    if (!parsed) return null;
    // 신규 압축 포맷 (positional 튜플)
    if (Array.isArray(parsed)) {
      return hydrate(parsed as WireTuple);
    }
    // 구버전 포맷 (rich 객체 {p:[...]}) — 하위호환
    if (
      typeof parsed === "object" &&
      Array.isArray((parsed as ShareSeed).p) &&
      (parsed as ShareSeed).p.length > 0 &&
      typeof (parsed as ShareSeed).s === "string"
    ) {
      return parsed as ShareSeed;
    }
    return null;
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
  const meaning = seed.p
    .map((p) => p.meaning)
    .filter(Boolean)
    .join(" · ");
  return { given, fullName, hanja, meaning };
}
