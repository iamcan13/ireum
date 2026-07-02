"use client";
import { useEffect, useState } from "react";
import { HeartIcon, GithubIcon } from "@/components/ui/icons";
import { IeumWordmark } from "@/components/ui/Logo";
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
        <a href="/" className="flex items-center" aria-label="이음 홈">
          <IeumWordmark className="h-9 w-auto" />
        </a>
        <div className="flex items-center gap-1.5">
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
          <a
            href="https://github.com/iamcan13/ireum"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 저장소"
            title="GitHub 저장소"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <GithubIcon width={18} height={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
