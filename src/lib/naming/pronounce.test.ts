import { describe, it, expect } from "vitest";
import { nameStandardPronunciation as p } from "./pronounce";

describe("이름 표준발음 (연음 우선, ㄴ첨가·과잉 경음화 배제)", () => {
  it("ㄴ첨가 대신 연음: 이진연 → 이지년", () => {
    expect(p("이진연")).toBe("이지년");
  });
  it("ㄴ받침 연음 계열", () => {
    expect(p("이선영")).toBe("이서녕");
    expect(p("이진영")).toBe("이지녕");
    expect(p("김진연")).toBe("김지년");
  });
  it("공명음(ㄴ/ㅁ/ㅇ) 받침 뒤 과잉 경음화 배제", () => {
    expect(p("김도아")).toBe("김도아"); // not 김또아
    expect(p("김도현")).toBe("김도현"); // not 김또현
    expect(p("김대성")).toBe("김대성"); // not 김때성
    expect(p("강민준")).toBe("강민준"); // not 강민쭌
    expect(p("김건")).toBe("김건"); // not 김껀
  });
  it("ㅇ받침 뒤 ㄴ첨가 배제", () => {
    expect(p("방예")).toBe("방예"); // not 방녜
    expect(p("강연")).toBe("강연"); // not 강년
    expect(p("성유")).toBe("성유"); // not 성뉴
  });
  it("장애음(ㄱ/ㄷ/ㅂ) 뒤 경음화(제23항)는 유지", () => {
    expect(p("박진영")).toBe("박찌녕");
    expect(p("박서준")).toBe("박써준");
  });
  it("비음화·유음화는 유지", () => {
    expect(p("김린아")).toBe("김니나"); // ㅁ+ㄹ → ㅁ+ㄴ (제19항)
    expect(p("신라")).toBe("실라"); // 유음화
  });
  it("받침 없거나 무변화", () => {
    expect(p("이연")).toBe("이연");
    expect(p("이지연")).toBe("이지연");
    expect(p("김미나")).toBe("김미나");
  });
});
