"use client";
import { motion, AnimatePresence } from "motion/react";
import type { Suggestion } from "@/lib/naming/types";
import type { SajuResult, Pillar } from "@/lib/saju";
import {
  ELEMENT_HEX,
  ELEMENT_KO,
  ELEMENT_NOUN,
  type Element,
} from "@/lib/core/elements";
import { OhaengDonut, OhaengLegend, YearRankChart } from "@/components/ui/dataviz";
import { STATS_YEARS, STATS_SOURCE_NOTE } from "@/lib/stats/commonness";
import { Pill, IconButton } from "@/components/ui/primitives";
import { HeartIcon, XIcon, ScaleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function tint(e: Element, pct = 16) {
  return `color-mix(in srgb, ${ELEMENT_HEX[e]} ${pct}%, white)`;
}
function suriTone(label: string) {
  return label === "吉" ? "good" : label === "凶" ? "bad" : "warn";
}

function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="border-t border-line px-6 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-wide text-ink-muted">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PillarColumn({ p, isDay }: { p: Pillar; isDay?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] text-ink-subtle">{p.role}</span>
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-xl",
          isDay && "ring-2 ring-accent"
        )}
      >
        <div
          className="flex flex-col items-center py-2.5"
          style={{ background: tint(p.ganElement, 20) }}
        >
          <span className="font-display text-2xl text-ink">{p.gan}</span>
          <span className="text-[11px] text-ink-muted">
            {p.ganKo}·{ELEMENT_KO[p.ganElement]}
          </span>
        </div>
        <div
          className="flex flex-col items-center py-2.5"
          style={{ background: tint(p.jiElement, 20) }}
        >
          <span className="font-display text-2xl text-ink">{p.ji}</span>
          <span className="text-[11px] text-ink-muted">
            {p.jiKo}·{ELEMENT_KO[p.jiElement]}
          </span>
        </div>
      </div>
      <span className="text-[11px] text-ink-subtle">{p.animal}</span>
    </div>
  );
}

export function DetailDrawer({
  suggestion,
  saju,
  isFav,
  inCompare,
  onClose,
  onToggleFav,
  onToggleCompare,
  onShare,
  onRequestBirth,
  onOpenStats,
}: {
  suggestion: Suggestion | null;
  saju: SajuResult | null;
  isFav: boolean;
  inCompare: boolean;
  onClose: () => void;
  onToggleFav: () => void;
  onToggleCompare: () => void;
  onShare: () => void;
  onRequestBirth: () => void;
  onOpenStats: () => void;
}) {
  const s = suggestion;
  // 이름 자원오행 분포
  const nameElements: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  if (s) for (const e of s.elements) nameElements[e] += 1;

  // 연도별 순위 (2015–2024)
  const yearRankMap = new Map((s?.commonness.yearly ?? []).map((y) => [y.year, y.rank]));
  const yearData = STATS_YEARS.map((y) => ({ year: y, rank: yearRankMap.get(y) ?? null }));

  return (
    <AnimatePresence>
      {s && (
        <motion.div
          className="fixed inset-0 z-50"
          initial="hidden"
          animate="shown"
          exit="hidden"
        >
          <motion.div
            variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(43,38,32,0.32)]"
          />
          <motion.aside
            variants={{
              hidden: { x: "100%" },
              shown: { x: 0 },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-surface shadow-pop"
          >
            {/* header */}
            <div className="sticky top-0 z-10 bg-surface/95 px-6 pb-5 pt-5 backdrop-blur">
              <div className="flex items-start justify-between">
                <div className="flex gap-1.5">
                  <IconButton label="닫기" onClick={onClose}>
                    <XIcon />
                  </IconButton>
                </div>
                <div className="flex gap-0.5">
                  <IconButton label="공유" onClick={onShare}>
                    <ShareSmall />
                  </IconButton>
                  <IconButton
                    label="비교 담기"
                    active={inCompare}
                    onClick={onToggleCompare}
                  >
                    <ScaleIcon />
                  </IconButton>
                  <IconButton
                    label="즐겨찾기"
                    active={isFav}
                    onClick={onToggleFav}
                  >
                    <HeartIcon filled={isFav} />
                  </IconButton>
                </div>
              </div>
              <div className="mt-2 text-center">
                <div className="font-display text-5xl font-bold text-ink">
                  {s.fullName}
                </div>
                <div className="mt-3 flex justify-center gap-1.5">
                  {[...s.hanjaString].map((c, i) => (
                    <span
                      key={i}
                      className="flex size-11 items-center justify-center rounded-xl bg-surface-muted font-display text-2xl text-ink"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-ink-muted">{s.meaning}</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* 한자 조합 */}
              <Section title="한자 풀이">
                <div className="space-y-2.5">
                  {s.picks.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-xl bg-surface-muted p-4"
                    >
                      <span className="font-display text-3xl text-ink">
                        {p.hanja.c}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink">
                          {p.hanja.hun} {p.hanja.eum}
                        </div>
                        <div className="text-sm text-ink-muted">
                          {p.hanja.meaning}
                        </div>
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-1 text-right">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: tint(p.hanja.oh, 22),
                            color: ELEMENT_HEX[p.hanja.oh],
                          }}
                        >
                          {p.hanja.oh} {ELEMENT_KO[p.hanja.oh]}
                        </span>
                        <span className="tabular text-xs text-ink-subtle">
                          {p.hanja.s}획
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 오행 균형 */}
              <Section title="오행 균형">
                {saju ? (
                  <>
                    <div className="flex items-center gap-5">
                      <OhaengDonut data={saju.elementWeighted} />
                      <div className="flex-1">
                        <OhaengLegend data={saju.elementWeighted} />
                      </div>
                    </div>
                    <p className="mt-4 rounded-xl bg-accent-soft/60 p-3 text-sm text-ink">
                      {saju.recommend.length ? (
                        <>
                          이 이름은{" "}
                          <b>
                            {saju.recommend
                              .map((e) => `${ELEMENT_KO[e]}(${ELEMENT_NOUN[e]})`)
                              .join("·")}
                          </b>{" "}
                          기운을 더해 사주의 균형을 도와요.
                          {s.sajuFit?.matched.length
                            ? ` 실제로 이름에 ${s.sajuFit.matched
                                .map((e) => ELEMENT_KO[e])
                                .join("·")} 기운이 담겨 있어요.`
                            : ""}
                        </>
                      ) : (
                        "사주 오행이 비교적 고르게 균형 잡혀 있어요."
                      )}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-5">
                    <OhaengDonut data={nameElements} />
                    <div className="flex-1">
                      <p className="text-sm text-ink-muted">
                        이름 한자의 자원오행 분포예요.
                      </p>
                      <OhaengLegend data={nameElements} />
                    </div>
                  </div>
                )}
              </Section>

              {/* 수리 4격 */}
              <Section
                title="수리 사격(四格)"
                aside={
                  <Pill tone={s.suri.label === "길" ? "good" : s.suri.label === "흉" ? "bad" : "warn"}>
                    {s.suri.label}
                  </Pill>
                }
              >
                <div className="grid grid-cols-2 gap-2.5">
                  {s.suri.gyeok.map((g) => (
                    <div
                      key={g.key}
                      className="rounded-xl border border-line p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">
                          <span className="font-display">{g.hanja}</span> {g.key}
                        </span>
                        <Pill tone={suriTone(g.fortune)}>{g.fortune}</Pill>
                      </div>
                      <div className="mt-1 tabular text-2xl font-bold text-ink">
                        {g.num}
                        <span className="ml-1 text-sm font-normal text-ink-subtle">
                          수
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] leading-snug text-ink-subtle">
                        {g.role}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-ink-subtle">
                  획수는 현행 한자 자형의 총획 기준이에요. (전통 강희자전 원획과 다를 수 있어요)
                </p>
              </Section>

              {/* 사주 4기둥 */}
              <Section title="사주 사주팔자(四柱)">
                {saju ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <PillarColumn p={saju.pillars.year} />
                      <PillarColumn p={saju.pillars.month} />
                      <PillarColumn p={saju.pillars.day} isDay />
                      {saju.pillars.hour ? (
                        <PillarColumn p={saju.pillars.hour} />
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted text-center text-[11px] text-ink-subtle">
                          시주
                          <br />
                          (시각 없음)
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="accent">
                        일간 {saju.dayMaster}·{ELEMENT_KO[saju.dayMasterElement]}
                      </Pill>
                      <Pill tone="neutral">
                        {saju.strength.label} ({saju.strength.score})
                      </Pill>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      {saju.summary}
                    </p>
                  </>
                ) : (
                  <div className="rounded-xl bg-surface-muted p-5 text-center">
                    <p className="text-sm text-ink-muted">
                      생년월일시를 입력하면 사주와 오행 균형을 분석해 드려요.
                    </p>
                    <button
                      type="button"
                      onClick={onRequestBirth}
                      className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                    >
                      생년월일시 입력하기
                    </button>
                  </div>
                )}
              </Section>

              {/* 최근 10년 통계 */}
              <Section
                title="최근 10년 통계"
                aside={
                  s.commonness.decadeRank != null ? (
                    <Pill tone="accent">10년 종합 {s.commonness.decadeRank}위</Pill>
                  ) : (
                    <Pill tone="neutral">종합 순위권 밖</Pill>
                  )
                }
              >
                <div className="rounded-xl border border-line p-4">
                  <YearRankChart data={yearData} />
                  <p className="mt-2 text-center text-[11px] text-ink-subtle">
                    연도별 인기 순위 · 막대가 높을수록 상위 (2015–2024)
                  </p>
                </div>
                <p className="mt-3 text-sm text-ink-muted">{s.commonness.verdict}</p>
                {s.commonness.yearly.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[360px] border-collapse text-center text-xs">
                      <tbody>
                        <tr className="text-ink-subtle">
                          {s.commonness.yearly.map((y) => (
                            <td key={y.year} className="tabular p-1 font-medium">
                              {y.year}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          {s.commonness.yearly.map((y) => (
                            <td
                              key={y.year}
                              className="tabular p-1 font-semibold text-ink"
                            >
                              {y.rank}위
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onOpenStats}
                  className="mt-3 w-full rounded-full border border-line py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
                >
                  전체 10년 통계 표 보기
                </button>
                <p className="mt-2 text-[11px] text-ink-subtle">{STATS_SOURCE_NOTE}</p>
              </Section>
              <div className="h-24" />
            </div>

            {/* footer */}
            <div className="absolute bottom-0 left-0 right-0 flex gap-2 border-t border-line bg-surface/95 p-4 backdrop-blur">
              <button
                type="button"
                onClick={onToggleFav}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors",
                  isFav
                    ? "bg-accent-soft text-accent-hover"
                    : "bg-accent text-white hover:bg-accent-hover"
                )}
              >
                <HeartIcon filled={isFav} width={18} height={18} />
                {isFav ? "저장됨" : "이 이름 저장"}
              </button>
              <button
                type="button"
                onClick={onToggleCompare}
                className="flex items-center justify-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
              >
                <ScaleIcon width={18} height={18} />
                {inCompare ? "비교 중" : "비교"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareSmall() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}
