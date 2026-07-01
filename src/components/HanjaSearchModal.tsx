"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  loadInmyeong,
  allHanjaForReading,
  filterHanja,
  rawToEntry,
  inmyeongSource,
  type RawHanja,
} from "@/lib/hanja/inmyeong";
import type { NamingHanjaEntry } from "@/lib/naming/types";
import { ELEMENT_HEX, ELEMENT_KO, type Element } from "@/lib/core/elements";
import { TextInput } from "@/components/ui/primitives";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function HanjaSearchModal({
  open,
  syllable,
  selectedC,
  onClose,
  onSelect,
}: {
  open: boolean;
  syllable: string;
  selectedC?: string;
  onClose: () => void;
  onSelect: (entry: NamingHanjaEntry) => void;
}) {
  const [list, setList] = useState<RawHanja[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !syllable) return;
    let cancelled = false;
    setLoading(true);
    setQuery("");
    loadInmyeong()
      .then(() => allHanjaForReading(syllable))
      .then((l) => {
        if (!cancelled) {
          setList(l);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, syllable]);

  const filtered = useMemo(() => filterHanja(list, query), [list, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial="h"
          animate="s"
          exit="h"
        >
          <motion.div
            variants={{ h: { opacity: 0 }, s: { opacity: 1 } }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(43,38,32,0.36)]"
          />
          <motion.div
            variants={{
              h: { opacity: 0, y: 16, scale: 0.98 },
              s: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-card bg-surface shadow-pop"
          >
            <div className="flex items-start justify-between gap-3 p-6 pb-3">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  &lsquo;{syllable}&rsquo; 인명용 한자
                </h3>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  {loading ? "불러오는 중…" : `${list.length}자 · 원하는 한자를 고르세요`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="shrink-0 text-ink-subtle hover:text-ink"
              >
                <XIcon />
              </button>
            </div>

            <div className="px-6 pb-3">
              <TextInput
                value={query}
                placeholder="한자 · 훈 · 뜻 검색"
                onChange={(e) => setQuery(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-subtle">
                  {loading ? "" : "해당하는 한자가 없어요."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filtered.map((h) => {
                    const active = selectedC === h.c;
                    return (
                      <button
                        key={h.c + h.s}
                        type="button"
                        data-testid="hanja-option"
                        onClick={() => onSelect(rawToEntry(h))}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-accent bg-accent-soft"
                            : "border-line hover:bg-surface-muted"
                        )}
                      >
                        <span className="font-display text-3xl text-ink">{h.c}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {h.h ? `${h.h} ${h.e}` : h.e}
                          </span>
                          <span className="block truncate text-xs text-ink-subtle">
                            {h.m || "—"}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                            style={{
                              background: `color-mix(in srgb, ${ELEMENT_HEX[h.o as Element]} 22%, white)`,
                              color: ELEMENT_HEX[h.o as Element],
                            }}
                          >
                            {h.o} {ELEMENT_KO[h.o as Element]}
                          </span>
                          <span className="tabular text-[11px] text-ink-subtle">
                            {h.s}획
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-line px-6 py-2 text-[11px] text-ink-subtle">
              {inmyeongSource()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
