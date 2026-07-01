"use client";
import { useEffect, useState } from "react";
import type { NameParams, Gender, NamingHanjaEntry } from "@/lib/naming/types";
import { surnameOptions } from "@/lib/hanja/pool";
import { topHanjaForReading } from "@/lib/hanja/inmyeong";
import {
  Segmented,
  Chip,
  RangeSlider,
  Switch,
  LabeledField,
  TextInput,
} from "@/components/ui/primitives";

// 이름 첫소리로 자주 쓰이는 초성 자음
const CONSONANTS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

function GroupLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline gap-2">
      <span className="text-[13px] font-semibold text-ink-muted">{children}</span>
      {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
    </div>
  );
}

export function ControlPanel({
  params,
  onChange,
  onOpenHanjaSearch,
}: {
  params: NameParams;
  onChange: (patch: Partial<NameParams>) => void;
  onOpenHanjaSearch: (syllable: string) => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const dollimSyl = params.dollimja?.syllable ?? ""; // params에서 파생(새로고침 복원과 동기화)
  const [topHanja, setTopHanja] = useState<NamingHanjaEntry[]>([]);
  const sOpts = surnameOptions(params.surname.trim());

  useEffect(() => {
    const syl = dollimSyl.trim();
    if (!syl) {
      setTopHanja([]);
      return;
    }
    let cancelled = false;
    topHanjaForReading(syl, 10)
      .then((list) => {
        if (!cancelled) setTopHanja(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dollimSyl]);

  const defaultPos = (): 0 | 1 =>
    params.syllableCount === 1 ? 0 : ((params.dollimja?.pos ?? 1) as 0 | 1);
  const onDollimSyl = (raw: string) => {
    const v = raw.trim().slice(0, 1);
    if (!v) onChange({ dollimja: null });
    else onChange({ dollimja: { syllable: v, pos: defaultPos(), hanja: undefined } });
  };
  const setDollimPos = (posStr: string) => {
    const syl = dollimSyl.trim().slice(0, 1);
    if (!syl) return;
    onChange({
      dollimja: {
        syllable: syl,
        pos: Number(posStr) as 0 | 1,
        hanja: params.dollimja?.hanja,
      },
    });
  };
  const selectDollimHanja = (entry?: NamingHanjaEntry) => {
    const syl = dollimSyl.trim().slice(0, 1);
    if (!syl) return;
    onChange({ dollimja: { syllable: syl, pos: defaultPos(), hanja: entry } });
  };
  const selHanja = params.dollimja?.hanja;

  const toggleInitial = (c: string) => {
    const cur = params.preferredInitials ?? [];
    onChange({
      preferredInitials: cur.includes(c)
        ? cur.filter((x) => x !== c)
        : [...cur, c],
    });
  };

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-7">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">이름 조건</h2>
      </div>
      <p className="mb-6 text-xs text-ink-subtle">바꾸는 즉시 순위가 갱신돼요</p>

      <div className="space-y-6">
        {/* 성 */}
        <LabeledField label="성(姓)" hint="비워두면 이름만 분석해요">
          <TextInput
            value={params.surname}
            maxLength={2}
            placeholder="예: 김"
            onChange={(e) =>
              onChange({ surname: e.target.value, surnameHanja: undefined })
            }
          />
          {sOpts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {sOpts.map((o) => (
                <Chip
                  key={o.c}
                  active={(params.surnameHanja ?? sOpts[0].c) === o.c}
                  onClick={() => onChange({ surnameHanja: o.c })}
                >
                  <span className="font-display">{o.c}</span>
                  <span className="text-xs text-ink-subtle">{o.s}획</span>
                </Chip>
              ))}
            </div>
          )}
        </LabeledField>

        {/* 성별 */}
        <div>
          <GroupLabel>성별</GroupLabel>
          <Segmented<Gender>
            ariaLabel="성별"
            value={params.gender}
            onChange={(v) => onChange({ gender: v })}
            options={[
              { value: "male", label: "남자" },
              { value: "female", label: "여자" },
              { value: "neutral", label: "중성" },
            ]}
          />
        </div>

        {/* 음절수 */}
        <div>
          <GroupLabel>이름 글자 수</GroupLabel>
          <Segmented<string>
            ariaLabel="글자 수"
            value={String(params.syllableCount)}
            onChange={(v) => onChange({ syllableCount: Number(v) as 1 | 2 })}
            options={[
              { value: "2", label: "두 글자" },
              { value: "1", label: "외자" },
            ]}
          />
        </div>

        {/* 원하는 자음 */}
        <div>
          <GroupLabel hint="여러 개 고를 수 있어요">원하는 자음(초성)</GroupLabel>
          <div className="flex flex-wrap gap-2">
            {CONSONANTS.map((c) => (
              <Chip
                key={c}
                active={(params.preferredInitials ?? []).includes(c)}
                onClick={() => toggleInitial(c)}
                className="min-w-[42px] justify-center"
              >
                <span className="text-base font-semibold">{c}</span>
              </Chip>
            ))}
          </div>
          {(params.preferredInitials ?? []).length >= 2 && (
            <div className="mt-2.5">
              <Segmented<string>
                ariaLabel="자음 조합 방식"
                value={params.initialsMode ?? "and"}
                onChange={(v) => onChange({ initialsMode: v as "and" | "or" })}
                options={[
                  { value: "and", label: "모두 포함" },
                  { value: "or", label: "하나라도" },
                ]}
              />
            </div>
          )}
          {(params.preferredInitials ?? []).length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ preferredInitials: [] })}
              className="mt-2 text-xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
            >
              자음 선택 해제
            </button>
          )}
          <div className="mt-3">
            <Switch
              checked={!!params.avoidBatchim}
              onChange={(v) => onChange({ avoidBatchim: v })}
              label="받침 없는 이름 선호"
              hint="예: 서아, 하루처럼 부드러운 끝소리"
            />
          </div>
        </div>

        {/* 돌림자(항렬) */}
        <div>
          <GroupLabel hint="형제·항렬 공통 글자 (선택)">돌림자</GroupLabel>
          <TextInput
            value={dollimSyl}
            placeholder="예: 준"
            maxLength={1}
            onChange={(e) => onDollimSyl(e.target.value)}
            className="h-11 text-center"
          />
          {dollimSyl.trim() && (
            <>
              {params.syllableCount === 2 && (
                <div className="mt-2">
                  <Segmented<string>
                    ariaLabel="돌림자 위치"
                    value={String(params.dollimja?.pos ?? 1)}
                    onChange={setDollimPos}
                    options={[
                      { value: "0", label: "첫 글자" },
                      { value: "1", label: "끝 글자" },
                    ]}
                  />
                </div>
              )}
              <div className="mt-3">
                <p className="mb-1.5 text-xs text-ink-subtle">
                  한자 선택 · 인명용 통계 상위 (안 고르면 자동)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!selHanja} onClick={() => selectDollimHanja(undefined)}>
                    자동
                  </Chip>
                  {selHanja && !topHanja.some((h) => h.c === selHanja.c) && (
                    <Chip active onClick={() => selectDollimHanja(selHanja)}>
                      <span className="font-display text-base">{selHanja.c}</span>
                      {selHanja.hun && (
                        <span className="text-xs text-ink-subtle">{selHanja.hun}</span>
                      )}
                    </Chip>
                  )}
                  {topHanja.map((h) => (
                    <Chip
                      key={h.c}
                      active={selHanja?.c === h.c}
                      onClick={() => selectDollimHanja(h)}
                    >
                      <span className="font-display text-base">{h.c}</span>
                      {h.hun && (
                        <span className="text-xs text-ink-subtle">{h.hun}</span>
                      )}
                    </Chip>
                  ))}
                  <button
                    type="button"
                    onClick={() => onOpenHanjaSearch(dollimSyl.trim())}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-ink-subtle hover:text-ink"
                  >
                    인명용 한자 더 찾기
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-subtle">
                모든 추천이 &lsquo;{dollimSyl.trim()}
                {selHanja ? ` ${selHanja.c}` : ""}&rsquo; 자를{" "}
                {params.syllableCount === 1
                  ? ""
                  : (params.dollimja?.pos ?? 1) === 0
                    ? "첫 글자로 "
                    : "끝 글자로 "}
                포함해요.
              </p>
            </>
          )}
        </div>

        {/* 흔함 강도 */}
        <div>
          <GroupLabel hint={`${params.rarity}`}>흔함 회피 강도</GroupLabel>
          <RangeSlider
            ariaLabel="흔함 회피 강도"
            value={params.rarity}
            onChange={(v) => onChange({ rarity: v })}
            leftLabel="흔해도 OK"
            rightLabel="희귀하게"
          />
        </div>

        {/* 생년월일시 */}
        <div>
          <GroupLabel hint="사주 분석에 쓰여요 (선택)">생년월일시</GroupLabel>
          <div className="flex gap-2">
            <input
              id="birth-date"
              type="date"
              value={params.birthDate ?? ""}
              onChange={(e) =>
                onChange({ birthDate: e.target.value, useSaju: true })
              }
              className="h-12 flex-1 rounded-2xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
            />
            <input
              type="time"
              value={params.birthTime ?? ""}
              onChange={(e) => onChange({ birthTime: e.target.value })}
              className="h-12 w-28 rounded-2xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
            />
          </div>
          {params.birthDate && (
            <div className="mt-2 flex flex-col gap-2">
              <Switch
                checked={params.useSaju}
                onChange={(v) => onChange({ useSaju: v })}
                label="사주 기반 추천 사용"
                hint="부족한 오행을 이름으로 채워줘요"
              />
              <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                className="self-start text-xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
              >
                {advanced ? "고급 옵션 닫기" : "고급 옵션 (진태양시 등)"}
              </button>
              {advanced && (
                <div className="space-y-3 rounded-2xl bg-surface-muted p-3">
                  <Switch
                    checked={!!params.trueSolarTime}
                    onChange={(v) => onChange({ trueSolarTime: v })}
                    label="진태양시 보정"
                    hint="출생지 경도·균시차 반영 (서울 기준)"
                  />
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                      자시(子時) 기준
                    </span>
                    <Segmented<string>
                      value={params.dayBoundary ?? "midnight"}
                      onChange={(v) =>
                        onChange({ dayBoundary: v as NameParams["dayBoundary"] })
                      }
                      options={[
                        { value: "midnight", label: "자정" },
                        { value: "jasi", label: "23시" },
                        { value: "splitJasi", label: "야자시" },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
