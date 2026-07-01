import {
  ELEMENT_HEX,
  ELEMENT_KO,
  ELEMENTS,
  type Element,
} from "@/lib/core/elements";

/** 오행 도넛 — 5개 호(arc)를 가중치 비율로. */
export function OhaengDonut({
  data,
  size = 168,
  thickness = 16,
}: {
  data: Record<Element, number>;
  size?: number;
  thickness?: number;
}) {
  const total = ELEMENTS.reduce((s, e) => s + (data[e] || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const gap = thickness; // 둥근 캡이 겹치지 않도록
  let cursor = 0;
  const arcs = ELEMENTS.map((e) => {
    const frac = (data[e] || 0) / total;
    const len = Math.max(0, frac * C - gap);
    const start = cursor;
    cursor += frac * C;
    return { e, len, start };
  });
  const dominant = ELEMENTS.reduce(
    (a, b) => ((data[b] || 0) > (data[a] || 0) ? b : a),
    ELEMENTS[0]
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth={thickness}
        />
        {arcs.map((a) =>
          a.len > 0 ? (
            <circle
              key={a.e}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={ELEMENT_HEX[a.e]}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${a.len} ${C - a.len}`}
              strokeDashoffset={-a.start - gap / 2}
            />
          ) : null
        )}
      </g>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        className="fill-ink"
        style={{ fontFamily: "var(--font-display)", fontSize: size * 0.22 }}
      >
        {dominant}
      </text>
      <text
        x="50%"
        y="66%"
        textAnchor="middle"
        className="fill-ink-subtle"
        style={{ fontSize: 10.5, letterSpacing: "0.02em" }}
      >
        으뜸 기운
      </text>
    </svg>
  );
}

export function OhaengLegend({ data }: { data: Record<Element, number> }) {
  const total = ELEMENTS.reduce((s, e) => s + (data[e] || 0), 0) || 1;
  return (
    <ul className="space-y-2">
      {ELEMENTS.map((e) => {
        const pct = Math.round(((data[e] || 0) / total) * 100);
        return (
          <li key={e} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ background: ELEMENT_HEX[e] }}
            />
            <span className="font-display text-ink">{e}</span>
            <span className="text-ink-muted">{ELEMENT_KO[e]}</span>
            <span className="ml-auto tabular text-ink-muted">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/** 흔함 지수 게이지 0(희귀)–100(흔함). */
export function CommonnessGauge({ value }: { value: number }) {
  return (
    <div className="relative h-2.5 w-full rounded-full"
      style={{
        background:
          "linear-gradient(90deg, var(--color-success), var(--color-warning) 55%, var(--color-accent))",
      }}
    >
      <div
        className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow-card"
        style={{ left: `${Math.max(2, Math.min(98, value))}%` }}
      />
    </div>
  );
}

/** 연도별 인기 스파크라인. value 0..1, null=그 해 순위권 밖. */
export function Sparkline({
  points,
  width = 132,
  height = 30,
}: {
  points: { year: number; value: number | null }[];
  width?: number;
  height?: number;
}) {
  const n = points.length;
  const pad = 3;
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - v * (height - pad * 2);
  const present = points
    .map((p, i) => ({ i, p }))
    .filter((o) => o.p.value != null);
  const line = present
    .map((o, k) => `${k === 0 ? "M" : "L"}${x(o.i).toFixed(1)} ${y(o.p.value!).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="var(--color-line)"
        strokeWidth={1}
      />
      {line && (
        <path
          d={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {present.map((o) => (
        <circle
          key={o.i}
          cx={x(o.i)}
          cy={y(o.p.value!)}
          r={2}
          fill="var(--color-accent)"
        />
      ))}
    </svg>
  );
}

/** 연도별 순위 막대 차트 (rank 1이 가장 높음). */
export function YearRankChart({
  data,
}: {
  data: { year: number; rank: number | null }[];
}) {
  return (
    <div className="flex items-stretch gap-1.5" style={{ height: 116 }}>
      {data.map((d) => {
        const h = d.rank != null ? Math.max(8, ((21 - d.rank) / 20) * 78) : 0;
        return (
          <div key={d.year} className="flex flex-1 flex-col items-center">
            <div className="flex w-full flex-1 items-end">
              <div className="relative w-full">
                {d.rank != null ? (
                  <>
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 tabular text-[10px] font-semibold text-ink-muted">
                      {d.rank}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-accent transition-all"
                      style={{ height: `${h}px` }}
                      title={`${d.year}년 ${d.rank}위`}
                    />
                  </>
                ) : (
                  <div
                    className="w-full rounded-t-md bg-surface-muted"
                    style={{ height: 4 }}
                    title={`${d.year}년 20위 밖`}
                  />
                )}
              </div>
            </div>
            <span className="mt-1.5 tabular text-[10px] text-ink-subtle">
              &rsquo;{String(d.year).slice(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 결과 행용 자원오행 점 시퀀스. */
export function MiniElementDots({ elements }: { elements: Element[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {elements.map((e, i) => (
        <span
          key={i}
          className="size-2.5 rounded-full ring-1 ring-black/5"
          style={{ background: ELEMENT_HEX[e] }}
          title={`${e} ${ELEMENT_KO[e]}`}
        />
      ))}
    </span>
  );
}
