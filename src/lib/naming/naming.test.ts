import { describe, it, expect } from "vitest";
import { computeSuri, su81, reduce81 } from "./suri";
import { computeBaleum } from "./baleum";
import { suggestNames } from "./suggest";
import { initialConsonant } from "../hangul";
import type { NameParams } from "./types";

describe("수리 (사격 + 81수리)", () => {
  it("reduce81 은 81 주기로 환원", () => {
    expect(reduce81(82)).toBe(1);
    expect(reduce81(81)).toBe(81);
    expect(reduce81(162)).toBe(81);
  });
  it("su81 은 길흉을 반환", () => {
    const e = su81(11);
    expect(e.num).toBe(11);
    expect(["吉", "凶", "半吉半凶"]).toContain(e.fortune);
  });
  it("4격 계산: 김(8) + 이름[9,9]", () => {
    const r = computeSuri([8], [9, 9]);
    const m = Object.fromEntries(r.gyeok.map((g) => [g.key, g.raw]));
    expect(m["원격"]).toBe(18);
    expect(m["형격"]).toBe(17);
    expect(m["이격"]).toBe(17);
    expect(m["정격"]).toBe(26);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
  it("1글자 이름은 가성수(1) 사용", () => {
    const r = computeSuri([8], [9]);
    const m = Object.fromEntries(r.gyeok.map((g) => [g.key, g.raw]));
    expect(m["원격"]).toBe(10); // 9 + 1
    expect(m["정격"]).toBe(17); // 8 + 9
  });
});

describe("발음오행", () => {
  it("김서준 분석 구조", () => {
    const r = computeBaleum(["김", "서", "준"]);
    expect(r.sequence.length).toBe(3);
    expect(r.links.length).toBe(2);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe("추천 엔진", () => {
  const base: NameParams = {
    surname: "김",
    gender: "male",
    syllableCount: 2,
    rarity: 50,
    useSaju: false,
  };

  it("기본 추천을 생성한다", () => {
    const s = suggestNames(base, 20);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s.slice(0, 6)) {
      expect(x.given.length).toBe(2);
      expect(x.picks.length).toBe(2);
      expect(x.score).toBeGreaterThanOrEqual(0);
      expect(x.score).toBeLessThanOrEqual(100);
      expect(x.reasons.length).toBeGreaterThan(0);
    }
  });

  it("사주를 켜면 sajuFit 이 존재한다", () => {
    const s = suggestNames(
      { ...base, useSaju: true, birthDate: "2024-05-10", birthTime: "10:30" },
      10
    );
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].sajuFit).not.toBeNull();
  });

  it("희귀 선호가 높으면 상위 결과가 덜 흔하다", () => {
    const common = suggestNames({ ...base, rarity: 0 }, 10);
    const rare = suggestNames({ ...base, rarity: 100 }, 10);
    const avg = (arr: typeof common) =>
      arr.reduce((a, b) => a + b.commonness.score, 0) / arr.length;
    expect(avg(rare)).toBeLessThan(avg(common));
  });

  it("여아 추천은 여성/중성 한자만 사용", () => {
    const s = suggestNames({ ...base, gender: "female" }, 30);
    for (const x of s)
      for (const p of x.picks)
        expect(["female", "neutral"]).toContain(p.hanja.gender);
  });

  it("1글자 이름도 생성한다", () => {
    const s = suggestNames({ ...base, syllableCount: 1 }, 10);
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].given.length).toBe(1);
  });
});

describe("자음 커버리지 & 돌림자", () => {
  const base: NameParams = {
    surname: "김",
    gender: "neutral",
    syllableCount: 2,
    rarity: 50,
    useSaju: false,
  };

  it("자음 2개 선택 시 각 자음이 하나씩 모두 포함(순서 무관)", () => {
    const s = suggestNames({ ...base, preferredInitials: ["ㅅ", "ㅈ"] }, 30);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      const inits = x.picks.map((p) => initialConsonant(p.syllable));
      expect(inits).toContain("ㅅ");
      expect(inits).toContain("ㅈ");
    }
  });

  it("자음 1개 선택 시 최소 1회 포함", () => {
    const s = suggestNames({ ...base, preferredInitials: ["ㅁ"] }, 30);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s)
      expect(x.picks.map((p) => initialConsonant(p.syllable))).toContain("ㅁ");
  });

  it("돌림자: 끝 글자 고정", () => {
    const s = suggestNames({ ...base, dollimja: { syllable: "준", pos: 1 } }, 20);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      expect(x.picks.length).toBe(2);
      expect(x.picks[1].syllable).toBe("준");
    }
  });

  it("돌림자: 첫 글자 고정", () => {
    const s = suggestNames({ ...base, dollimja: { syllable: "서", pos: 0 } }, 20);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) expect(x.picks[0].syllable).toBe("서");
  });

  it("돌림자 한자 고정: 특정 한자(俊) 엔트리로 끝 글자 고정", () => {
    const hanja = {
      c: "俊",
      eum: "준",
      hun: "빼어날",
      meaning: "재주가 빼어남",
      s: 9,
      oh: "火" as const,
      gender: "male" as const,
    };
    const s = suggestNames(
      { ...base, dollimja: { syllable: "준", pos: 1, hanja } },
      20
    );
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      expect(x.picks[1].syllable).toBe("준");
      expect(x.picks[1].hanja.c).toBe("俊");
    }
  });

  it("자음 OR 모드: 선택 자음 중 하나라도 포함", () => {
    const s = suggestNames(
      { ...base, preferredInitials: ["ㅅ", "ㅈ"], initialsMode: "or" },
      30
    );
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      const inits = x.picks.map((p) => initialConsonant(p.syllable));
      expect(inits.some((i) => i === "ㅅ" || i === "ㅈ")).toBe(true);
    }
  });

  it("돌림자 + 자음 커버리지 동시 적용", () => {
    const s = suggestNames(
      { ...base, dollimja: { syllable: "준", pos: 1 }, preferredInitials: ["ㅅ"] },
      20
    );
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      expect(x.picks[1].syllable).toBe("준");
      expect(x.picks.map((p) => initialConsonant(p.syllable))).toContain("ㅅ");
    }
  });
});
