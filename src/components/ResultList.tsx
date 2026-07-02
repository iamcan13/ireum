"use client";
import { motion, AnimatePresence } from "motion/react";
import type { Suggestion } from "@/lib/naming/types";
import { Segmented, Pill, IconButton } from "@/components/ui/primitives";
import { MiniElementDots } from "@/components/ui/dataviz";
import { HeartIcon, ChevronRight, ScaleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export type SortKey = "recommend" | "rare" | "fortune";

function suriTone(label: string) {
  return label === "길" ? "good" : label === "흉" ? "bad" : "warn";
}

function ResultRow({
  s,
  onOpen,
  onToggleFav,
  isFav,
  onToggleCompare,
  inCompare,
}: {
  s: Suggestion;
  onOpen: () => void;
  onToggleFav: () => void;
  isFav: boolean;
  onToggleCompare: () => void;
  inCompare: boolean;
}) {
  return (
    <motion.li
      layout
      data-testid="result-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
      className="group"
    >
      <div
        onClick={onOpen}
        className="flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card sm:p-5"
      >
        {/* name */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="min-w-0 text-left"
        >
          <div className="font-display text-2xl font-bold leading-tight text-ink sm:text-[28px]">
            {s.fullName}
          </div>
          <div className="mt-0.5 font-display text-base text-ink-muted">
            {s.hanjaString}
          </div>
          {!s.soundsAsWritten && (
            <div className="mt-0.5 text-xs text-ink-subtle">
              발음 [{s.pronunciation}]
            </div>
          )}
        </button>

        {/* meta */}
        <div className="ml-auto hidden items-center gap-5 md:flex">
          <div className="flex flex-col items-center gap-1">
            <MiniElementDots elements={s.elements} />
            <span className="text-[11px] text-ink-subtle">자원오행</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Pill tone={suriTone(s.suri.label)}>수리 {s.suri.label}</Pill>
            <span className="text-[11px] text-ink-subtle">{s.baleum.label}</span>
          </div>
          <div className="flex w-20 flex-col items-center gap-1">
            <span className="tabular text-sm font-semibold text-ink">
              {s.commonness.decadeRank != null
                ? `${s.commonness.decadeRank}위`
                : s.commonness.yearly.length
                  ? `${Math.min(...s.commonness.yearly.map((y) => y.rank))}위`
                  : "—"}
            </span>
            <span className="text-[11px] text-ink-subtle">
              {s.commonness.decadeRank != null
                ? "10년 순위"
                : s.commonness.yearly.length
                  ? "최고 순위"
                  : "순위 밖"}
            </span>
          </div>
        </div>

        {/* mobile compact meta */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Pill tone={suriTone(s.suri.label)}>{s.suri.label}</Pill>
          <MiniElementDots elements={s.elements} />
        </div>

        {/* actions */}
        <div className="flex items-center gap-0.5">
          <motion.span whileTap={{ scale: 0.8 }}>
            <IconButton
              label={isFav ? "즐겨찾기 해제" : "즐겨찾기"}
              active={isFav}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav();
              }}
            >
              <HeartIcon filled={isFav} />
            </IconButton>
          </motion.span>
          <IconButton
            label={inCompare ? "비교에서 빼기" : "비교 담기"}
            active={inCompare}
            className="hidden sm:inline-flex"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
          >
            <ScaleIcon />
          </IconButton>
          <span className="text-ink-subtle transition-colors group-hover:text-ink">
            <ChevronRight />
          </span>
        </div>
      </div>
    </motion.li>
  );
}

export function ResultList({
  suggestions,
  sort,
  onSort,
  favorites,
  compare,
  onOpen,
  onToggleFav,
  onToggleCompare,
  recomputing,
}: {
  suggestions: Suggestion[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  favorites: Set<string>;
  compare: Set<string>;
  onOpen: (s: Suggestion) => void;
  onToggleFav: (s: Suggestion) => void;
  onToggleCompare: (s: Suggestion) => void;
  recomputing?: boolean;
}) {
  return (
    <div>
      <div className="z-10 mb-4 flex items-center justify-between gap-3 bg-bg py-3 lg:sticky lg:top-0">
        <p className="text-sm text-ink-muted">
          이름 <span className="font-semibold text-ink">{suggestions.length}</span>개
        </p>
        <Segmented<SortKey>
          ariaLabel="정렬"
          value={sort}
          onChange={onSort}
          options={[
            { value: "recommend", label: "추천순" },
            { value: "rare", label: "희귀순" },
            { value: "fortune", label: "길흉순" },
          ]}
        />
      </div>

      {suggestions.length === 0 ? (
        <EmptyState />
      ) : (
        <ul
          className={cn(
            "space-y-3 transition-opacity",
            recomputing && "opacity-60"
          )}
        >
          <AnimatePresence initial={false}>
            {suggestions.map((s) => (
              <ResultRow
                key={s.id}
                s={s}
                onOpen={() => onOpen(s)}
                onToggleFav={() => onToggleFav(s)}
                isFav={favorites.has(s.id)}
                onToggleCompare={() => onToggleCompare(s)}
                inCompare={compare.has(s.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface px-8 py-16 text-center">
      <div
        className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[160px] leading-none text-accent/5"
        aria-hidden
      >
        이
      </div>
      <p className="relative text-lg font-medium text-ink">
        조건이 너무 까다로워요
      </p>
      <p className="relative mt-2 text-sm text-ink-muted">
        선호 소리나 받침 조건을 조금 풀면 더 많은 이름을 보여드릴게요.
      </p>
    </div>
  );
}
