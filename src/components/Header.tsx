"use client";
import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function Header({
  favCount,
  onOpenFavorites,
}: {
  favCount: number;
  onOpenFavorites: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-bg transition-all duration-200",
        scrolled ? "border-b border-line" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="/" className="flex items-baseline gap-0.5">
          <span className="font-display text-2xl font-bold text-ink">이</span>
          <span aria-hidden className="mb-1 inline-block h-[2px] w-3 rounded-full bg-accent" />
          <span className="font-display text-2xl font-bold text-ink">음</span>
        </a>
        <button
          type="button"
          onClick={onOpenFavorites}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <HeartIcon
            width={18}
            height={18}
            filled={favCount > 0}
            className={favCount > 0 ? "text-accent" : ""}
          />
          <span className="tabular">{favCount}</span>
        </button>
      </div>
    </header>
  );
}
