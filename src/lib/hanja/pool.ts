// 작명 한자 풀 + 성씨 접근자.
import namingData from "../../data/namingHanja.json";
import surnameData from "../../data/surnames.json";
import type { NamingHanjaEntry, SurnameOption } from "../naming/types";

const POOL = (namingData as { bySyllable: Record<string, NamingHanjaEntry[]> })
  .bySyllable;

export const NAMING_SYLLABLES: string[] = Object.keys(POOL);

export function hanjaForSyllable(syl: string): NamingHanjaEntry[] {
  return POOL[syl] ?? [];
}

export function findNamingHanja(c: string): NamingHanjaEntry | null {
  for (const arr of Object.values(POOL)) {
    const hit = arr.find((e) => e.c === c);
    if (hit) return hit;
  }
  return null;
}

export function allNamingEntries(): NamingHanjaEntry[] {
  return Object.values(POOL).flat();
}

const SURNAMES = surnameData as Record<string, SurnameOption[]>;

export function surnameOptions(hangul: string): SurnameOption[] {
  return SURNAMES[hangul] ?? [];
}

export function poolSize(): { syllables: number; entries: number } {
  return {
    syllables: NAMING_SYLLABLES.length,
    entries: allNamingEntries().length,
  };
}
