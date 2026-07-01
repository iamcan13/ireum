import { describe, it, expect } from "vitest";
import { computeSaju } from "./index";

// 12 authoritative 만세력 validation cases (KASI-based, KST), cross-checked
// across manseryeok + lunar-javascript + external 만세력. Includes 입춘 and
// 야자시(23:00–24:00) edge cases. dayBoundary='midnight' (default).
const CASES: {
  date: string;
  time: string;
  expected: { year: string; month: string; day: string; hour: string };
}[] = [
  { date: "1990-06-15", time: "14:30", expected: { year: "庚午", month: "壬午", day: "辛亥", hour: "乙未" } },
  { date: "1984-02-05", time: "12:00", expected: { year: "甲子", month: "丙寅", day: "己巳", hour: "庚午" } },
  { date: "1984-02-04", time: "12:00", expected: { year: "癸亥", month: "乙丑", day: "戊辰", hour: "戊午" } },
  { date: "2024-02-04", time: "17:00", expected: { year: "癸卯", month: "乙丑", day: "戊戌", hour: "辛酉" } }, // 입춘 경계(KST 17:27)
  { date: "2000-01-01", time: "00:30", expected: { year: "己卯", month: "丙子", day: "戊午", hour: "壬子" } },
  { date: "1995-08-10", time: "12:00", expected: { year: "乙亥", month: "甲申", day: "癸酉", hour: "戊午" } },
  { date: "1992-10-24", time: "05:30", expected: { year: "壬申", month: "庚戌", day: "癸酉", hour: "乙卯" } },
  { date: "1995-08-10", time: "10:00", expected: { year: "乙亥", month: "甲申", day: "癸酉", hour: "丁巳" } },
  { date: "1995-08-10", time: "23:30", expected: { year: "乙亥", month: "甲申", day: "癸酉", hour: "壬子" } }, // 야자시
  { date: "1995-08-11", time: "00:30", expected: { year: "乙亥", month: "甲申", day: "甲戌", hour: "甲子" } },
  { date: "2023-12-31", time: "23:30", expected: { year: "癸卯", month: "甲子", day: "癸亥", hour: "壬子" } }, // 야자시(연말)
  { date: "2024-01-01", time: "00:30", expected: { year: "癸卯", month: "甲子", day: "甲子", hour: "甲子" } },
];

function parse(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return { year, month, day, hour, minute };
}

describe("computeSaju — 만세력 4기둥 (manseryeok, dayBoundary=midnight)", () => {
  for (const c of CASES) {
    it(`${c.date} ${c.time} → ${c.expected.year} ${c.expected.month} ${c.expected.day} ${c.expected.hour}`, () => {
      const r = computeSaju(parse(c.date, c.time));
      expect(r.ganjiText.year).toBe(c.expected.year);
      expect(r.ganjiText.month).toBe(c.expected.month);
      expect(r.ganjiText.day).toBe(c.expected.day);
      expect(r.ganjiText.hour).toBe(c.expected.hour);
    });
  }
});

describe("computeSaju — 분석 레이어", () => {
  it("일간/오행/합계가 일관적이다 (1990-06-15 14:30, 辛金 일간)", () => {
    const r = computeSaju(parse("1990-06-15", "14:30"));
    expect(r.dayMaster).toBe("辛");
    expect(r.dayMasterElement).toBe("金");
    // 8글자(천간4+지지4) 합 = 8
    const total = (["木", "火", "土", "金", "水"] as const).reduce(
      (s, e) => s + r.elementCount[e],
      0
    );
    expect(total).toBe(8);
    expect(r.recommend.length).toBeGreaterThan(0);
    expect(r.elementPercent["金"]).toBeGreaterThan(0);
  });

  it("시각 미입력 시 시주는 null, 6글자만 집계", () => {
    const r = computeSaju({ year: 2020, month: 5, day: 5 });
    expect(r.pillars.hour).toBeNull();
    expect(r.hasHour).toBe(false);
    const total = (["木", "火", "土", "金", "水"] as const).reduce(
      (s, e) => s + r.elementCount[e],
      0
    );
    expect(total).toBe(6);
  });

  it("진태양시 보정 옵션이 동작한다", () => {
    const noTst = computeSaju(parse("1990-06-15", "07:05"));
    const tst = computeSaju({ ...parse("1990-06-15", "07:05"), trueSolarTime: true });
    // 07:05 KST → 진태양시 약 06:33 → 시지가 辰(07~)에서 卯(05~)로 이동
    expect(noTst.pillars.hour?.ji).toBe("辰");
    expect(tst.pillars.hour?.ji).toBe("卯");
  });
});
