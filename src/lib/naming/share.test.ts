import { describe, it, expect } from "vitest";
import { encodeShare, decodeShare, paramsFromShare } from "./share";
import { suggestNames, sajuFromShare } from "./suggest";
import type { NameParams } from "./types";

const base: NameParams = {
  surname: "김",
  gender: "neutral",
  syllableCount: 2,
  rarity: 50,
  useSaju: false,
};

describe("공유 permalink 인코딩/디코딩", () => {
  it("이름을 왕복 인코딩/디코딩한다", () => {
    const s = suggestNames(base, 1)[0];
    const slug = encodeShare(s, base);
    const seed = decodeShare(slug);
    expect(seed).not.toBeNull();
    expect(seed!.s).toBe("김");
    expect(seed!.p.length).toBe(s.picks.length);
    expect(seed!.p.map((x) => x.c).join("")).toBe(
      s.picks.map((x) => x.hanja.c).join("")
    );
  });

  it("URL-safe 문자만 사용한다(base64url)", () => {
    const s = suggestNames(base, 1)[0];
    const slug = encodeShare(s, base);
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("생년월일·탄생 시분을 인코딩하고 사주를 복원한다", () => {
    const params: NameParams = {
      ...base,
      useSaju: true,
      birthDate: "2024-05-10",
      birthTime: "09:30",
      dayBoundary: "jasi",
      trueSolarTime: true,
    };
    const s = suggestNames(params, 1)[0];
    const seed = decodeShare(encodeShare(s, params))!;
    expect(seed.bd).toBe("2024-05-10");
    expect(seed.bt).toBe("09:30");
    expect(seed.db).toBe("jasi");
    expect(seed.ts).toBe(true);
    const restored = paramsFromShare(seed);
    expect(restored.birthDate).toBe("2024-05-10");
    expect(restored.useSaju).toBe(true);
    expect(sajuFromShare(seed)).not.toBeNull(); // 사주 복원됨
  });

  it("사주 미사용 시 생년 정보는 인코딩하지 않는다", () => {
    const s = suggestNames(base, 1)[0];
    const seed = decodeShare(encodeShare(s, base))!;
    expect(seed.bd).toBeUndefined();
    expect(sajuFromShare(seed)).toBeNull();
  });

  it("잘못된 slug는 null", () => {
    expect(decodeShare("!!!not-valid!!!")).toBeNull();
  });
});
