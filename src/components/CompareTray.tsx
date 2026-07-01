"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Suggestion } from "@/lib/naming/types";
import { Pill } from "@/components/ui/primitives";
import { MiniElementDots } from "@/components/ui/dataviz";
import { XIcon } from "@/components/ui/icons";

function suriTone(label: string) {
  return label === "길" ? "good" : label === "흉" ? "bad" : "warn";
}

export function CompareTray({
  items,
  onRemove,
  onClear,
}: {
  items: Suggestion[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-line bg-surface/95 p-2 pl-4 shadow-pop backdrop-blur">
              <span className="hidden text-sm text-ink-muted sm:inline">비교</span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {items.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-muted py-1 pl-3 pr-1 text-sm text-ink"
                  >
                    {s.fullName}
                    <button
                      type="button"
                      aria-label="빼기"
                      onClick={() => onRemove(s.id)}
                      className="inline-flex size-5 items-center justify-center rounded-full text-ink-subtle hover:text-ink"
                    >
                      <XIcon width={14} height={14} />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                비교하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[rgba(43,38,32,0.32)]"
            />
            <motion.div
              variants={{
                h: { opacity: 0, y: 16, scale: 0.98 },
                s: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-card bg-surface p-6 shadow-pop"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">이름 비교</h3>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-sm text-ink-subtle hover:text-danger"
                >
                  전체 지우기
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-surface p-2 text-left text-xs font-semibold text-ink-subtle"></th>
                      {items.map((s) => (
                        <th key={s.id} className="p-2 text-center">
                          <div className="font-display text-xl font-bold text-ink">
                            {s.fullName}
                          </div>
                          <div className="font-display text-sm text-ink-muted">
                            {s.hanjaString}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <Row label="자원오행" items={items}>
                      {(s) => <MiniElementDots elements={s.elements} />}
                    </Row>
                    <Row label="발음오행" items={items}>
                      {(s) => <span className="text-ink">{s.baleum.label}</span>}
                    </Row>
                    <Row label="수리 길흉" items={items}>
                      {(s) => <Pill tone={suriTone(s.suri.label)}>{s.suri.label}</Pill>}
                    </Row>
                    <Row label="흔함 지수" items={items}>
                      {(s) => (
                        <span className="tabular text-ink">
                          {s.commonness.score} · {s.commonness.tier}
                        </span>
                      )}
                    </Row>
                    <Row label="종합 점수" items={items}>
                      {(s) => (
                        <span className="tabular font-semibold text-ink">{s.score}</span>
                      )}
                    </Row>
                    <Row label="뜻" items={items}>
                      {(s) => (
                        <span className="text-xs text-ink-muted">{s.meaning}</span>
                      )}
                    </Row>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({
  label,
  items,
  children,
}: {
  label: string;
  items: Suggestion[];
  children: (s: Suggestion) => React.ReactNode;
}) {
  return (
    <tr className="border-t border-line">
      <td className="sticky left-0 bg-surface p-3 text-left text-xs font-semibold text-ink-muted">
        {label}
      </td>
      {items.map((s) => (
        <td key={s.id} className="p-3 text-center align-middle">
          <div className="flex justify-center">{children(s)}</div>
        </td>
      ))}
    </tr>
  );
}
