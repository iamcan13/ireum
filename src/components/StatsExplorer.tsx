"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { yearlyTopNames, STATS_SOURCE_NOTE } from "@/lib/stats/commonness";
import { Segmented } from "@/components/ui/primitives";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function StatsExplorer({
  open,
  onClose,
  highlight,
}: {
  open: boolean;
  onClose: () => void;
  highlight?: string; // 강조할 이름(현재 보는 이름)
}) {
  const [gender, setGender] = useState<"male" | "female">("male");
  const cols = yearlyTopNames(gender, 10);
  const ranks = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              h: { opacity: 0, y: 16, scale: 0.98 },
              s: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-card bg-surface shadow-pop"
          >
            <div className="flex items-start justify-between gap-4 p-6 pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  최근 10년 신생아 인기 이름
                </h3>
                <p className="mt-1 text-xs text-ink-subtle">
                  {STATS_SOURCE_NOTE} · 2015–2024 연도별 상위 10위
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

            <div className="px-6">
              <div className="w-44">
                <Segmented<"male" | "female">
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: "male", label: "남아" },
                    { value: "female", label: "여아" },
                  ]}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6 pt-4">
              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-20 bg-surface p-2 text-xs font-semibold text-ink-subtle">
                      순위
                    </th>
                    {cols.map((c) => (
                      <th
                        key={c.year}
                        className="sticky top-0 z-10 bg-surface p-2 tabular text-xs font-semibold text-ink-muted"
                      >
                        {c.year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranks.map((r) => (
                    <tr key={r} className="border-t border-line">
                      <td className="sticky left-0 z-10 bg-surface p-2 tabular text-xs font-semibold text-ink-subtle">
                        {r}
                      </td>
                      {cols.map((c) => {
                        const name = c.names.find((n) => n.rank === r)?.name ?? "–";
                        const isHi = highlight && name === highlight;
                        return (
                          <td
                            key={c.year}
                            className={cn(
                              "p-2",
                              r <= 3 ? "font-semibold text-ink" : "text-ink-muted",
                              isHi && "rounded-md bg-accent-soft text-accent-hover"
                            )}
                          >
                            {name}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
