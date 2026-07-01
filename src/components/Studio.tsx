"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { NameParams, Suggestion } from "@/lib/naming/types";
import { suggestNames, buildSaju } from "@/lib/naming/suggest";
import {
  getStorage,
  type SavedName,
} from "@/lib/storage";
import { STATS_YEARS } from "@/lib/stats/commonness";
import { Header } from "@/components/Header";
import { ControlPanel } from "@/components/ControlPanel";
import { ResultList, type SortKey } from "@/components/ResultList";
import { DetailDrawer } from "@/components/DetailDrawer";
import { CompareTray } from "@/components/CompareTray";
import { StatsExplorer } from "@/components/StatsExplorer";
import { XIcon, HeartIcon } from "@/components/ui/icons";

const DEFAULT_PARAMS: NameParams = {
  surname: "",
  gender: "neutral",
  syllableCount: 2,
  rarity: 50,
  useSaju: false,
  preferredElements: [],
  preferredHanja: [],
  avoidBatchim: false,
  fixed: null,
};

export function Studio() {
  const [params, setParams] = useState<NameParams>(DEFAULT_PARAMS);
  const [sort, setSort] = useState<SortKey>("recommend");
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [favorites, setFavorites] = useState<SavedName[]>([]);
  const [compare, setCompare] = useState<Suggestion[]>([]);
  const [showFav, setShowFav] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    getStorage()
      .list()
      .then(setFavorites)
      .catch(() => {});
  }, []);

  const onChange = useCallback((patch: Partial<NameParams>) => {
    setParams((p) => ({ ...p, ...patch }));
  }, []);

  const saju = useMemo(() => buildSaju(params), [params]);

  const suggestions = useMemo(() => {
    const list = suggestNames(params, 48);
    const sorted = [...list];
    if (sort === "rare")
      sorted.sort((a, b) => a.commonness.score - b.commonness.score);
    else if (sort === "fortune")
      sorted.sort((a, b) => b.suri.score - a.suri.score);
    else sorted.sort((a, b) => b.score - a.score);
    return sorted;
  }, [params, sort]);

  const favSet = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const compareSet = useMemo(() => new Set(compare.map((c) => c.id)), [compare]);

  const toggleFav = useCallback(
    (s: Suggestion) => {
      const storage = getStorage();
      setFavorites((prev) => {
        if (prev.some((f) => f.id === s.id)) {
          storage.remove(s.id);
          return prev.filter((f) => f.id !== s.id);
        }
        const sn: SavedName = {
          id: s.id,
          given: s.given,
          fullName: s.fullName,
          hanjaString: s.hanjaString,
          meaning: s.meaning,
          savedAt: Date.now(),
        };
        storage.add(sn);
        return [sn, ...prev];
      });
    },
    []
  );

  const toggleCompare = useCallback((s: Suggestion) => {
    setCompare((prev) => {
      if (prev.some((c) => c.id === s.id)) return prev.filter((c) => c.id !== s.id);
      if (prev.length >= 3) return [...prev.slice(1), s];
      return [...prev, s];
    });
  }, []);

  const onShare = useCallback((s: Suggestion) => {
    const text = `${s.fullName} (${s.hanjaString}) — ${s.meaning} · 이음`;
    if (navigator.share) {
      navigator.share({ title: "이음", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }, []);

  const focusBirth = useCallback(() => {
    setSelected(null);
    setTimeout(() => {
      const el = document.getElementById("birth-date") as HTMLInputElement | null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    }, 60);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col lg:h-[100dvh]">
      <Header favCount={favorites.length} onOpenFavorites={() => setShowFav(true)} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:h-[calc(100dvh-4rem)] lg:flex-row lg:overflow-hidden">
        {/* 좌: 컨트롤 패널 — 독립 스크롤 */}
        <aside
          id="control-panel"
          className="no-scrollbar w-full px-5 pb-8 pt-6 sm:px-8 lg:h-full lg:w-[400px] lg:shrink-0 lg:overflow-y-auto"
        >
          <div className="mb-5">
            <p className="mb-1.5 text-xs font-medium text-accent-hover">
              아이와 이름을 잇다
            </p>
            <h1 className="font-display text-2xl font-bold leading-snug text-ink">
              아이에게 <span className="text-accent">어울리는</span> 이름을 찾아요
            </h1>
          </div>
          <ControlPanel params={params} onChange={onChange} />
          <button
            type="button"
            onClick={() => setShowStats(true)}
            className="mt-3 w-full rounded-2xl border border-line bg-surface py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            최근 10년 신생아 이름 통계 자세히 보기
          </button>
          <p className="mt-3 px-1 text-[11px] leading-relaxed text-ink-subtle">
            통계 출처: 대법원 전자가족관계등록시스템 기반 집계 ({STATS_YEARS[0]}–
            {STATS_YEARS[STATS_YEARS.length - 1]}). 사주·수리·오행은 전통 명리/성명학
            기반 참고 정보예요.
          </p>
        </aside>

        {/* 우: 결과 — 독립 스크롤 */}
        <section className="no-scrollbar w-full min-w-0 flex-1 px-5 pb-28 pt-4 sm:px-8 lg:h-full lg:overflow-y-auto lg:pt-0">
          <ResultList
            suggestions={suggestions}
            sort={sort}
            onSort={setSort}
            favorites={favSet}
            compare={compareSet}
            onOpen={setSelected}
            onToggleFav={toggleFav}
            onToggleCompare={toggleCompare}
          />
        </section>
      </main>

      <DetailDrawer
        suggestion={selected}
        saju={selected ? saju : null}
        isFav={selected ? favSet.has(selected.id) : false}
        inCompare={selected ? compareSet.has(selected.id) : false}
        onClose={() => setSelected(null)}
        onToggleFav={() => selected && toggleFav(selected)}
        onToggleCompare={() => selected && toggleCompare(selected)}
        onShare={() => selected && onShare(selected)}
        onRequestBirth={focusBirth}
        onOpenStats={() => setShowStats(true)}
      />

      <CompareTray
        items={compare}
        onRemove={(id) => setCompare((p) => p.filter((c) => c.id !== id))}
        onClear={() => setCompare([])}
      />

      <FavoritesModal
        open={showFav}
        favorites={favorites}
        onClose={() => setShowFav(false)}
        onRemove={(id) => {
          getStorage().remove(id);
          setFavorites((p) => p.filter((f) => f.id !== id));
        }}
      />

      <StatsExplorer
        open={showStats}
        onClose={() => setShowStats(false)}
        highlight={selected?.given}
      />
    </div>
  );
}

function FavoritesModal({
  open,
  favorites,
  onClose,
  onRemove,
}: {
  open: boolean;
  favorites: SavedName[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20"
          initial="h"
          animate="s"
          exit="h"
        >
          <motion.div
            variants={{ h: { opacity: 0 }, s: { opacity: 1 } }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(43,38,32,0.32)]"
          />
          <motion.div
            variants={{
              h: { opacity: 0, y: -12 },
              s: { opacity: 1, y: 0 },
            }}
            className="relative max-h-[70vh] w-full max-w-md overflow-auto rounded-card bg-surface p-6 shadow-pop"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">즐겨찾기</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="text-ink-subtle hover:text-ink"
              >
                <XIcon />
              </button>
            </div>
            {favorites.length === 0 ? (
              <div className="py-10 text-center">
                <HeartIcon
                  width={28}
                  height={28}
                  className="mx-auto text-ink-subtle"
                />
                <p className="mt-3 text-sm text-ink-muted">
                  마음에 드는 이름의 하트를 눌러 저장해보세요.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {favorites.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-2xl border border-line p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-display text-lg font-bold text-ink">
                        {f.fullName}{" "}
                        <span className="text-sm font-normal text-ink-muted">
                          {f.hanjaString}
                        </span>
                      </div>
                      <div className="truncate text-xs text-ink-subtle">
                        {f.meaning}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(f.id)}
                      aria-label="삭제"
                      className="ml-auto inline-flex size-8 items-center justify-center rounded-full text-ink-subtle hover:bg-surface-muted hover:text-danger"
                    >
                      <XIcon width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
