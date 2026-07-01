"use client";
import { motion } from "motion/react";
import {
  useId,
  type ReactNode,
  type InputHTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative flex gap-1 rounded-full bg-surface-muted p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-ink" : "text-ink-muted hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-surface shadow-soft"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all duration-150",
        active
          ? "border-accent bg-accent-soft text-ink"
          : "border-line bg-surface text-ink-muted hover:border-ink-subtle hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  leftLabel,
  rightLabel,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
  ariaLabel?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="relative h-6 select-none">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-surface-muted" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-surface shadow-card"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {(leftLabel || rightLabel) && (
        <div className="mt-1 flex justify-between text-xs text-ink-subtle">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-subtle">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-surface-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-surface shadow-soft transition-[left] duration-200",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function LabeledField({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-ink-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink outline-none transition-shadow placeholder:text-ink-subtle focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]",
        props.className
      )}
    />
  );
}

const TONE: Record<string, string> = {
  neutral: "bg-surface-muted text-ink-muted",
  good: "bg-success/15 text-success",
  warn: "bg-warning/20 text-[#946a1c]",
  bad: "bg-danger/15 text-danger",
  accent: "bg-accent-soft text-accent-hover",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function IconButton({
  children,
  active,
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full transition-colors",
        active ? "text-accent" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
