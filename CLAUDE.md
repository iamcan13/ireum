# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ **Read AGENTS.md above first.** This project runs **Next.js 16 with breaking changes** from what you know. Before writing any Next.js code (routing, config, metadata, server/client boundaries), read the relevant guide under `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, …). Don't assume App Router APIs match your training data.

**이음 (Ieum)** is a Korean baby-naming studio: it recommends given names by combining phonology (발음오행), hanja (한자 자원오행), 사주/만세력 (Four Pillars), and newborn-name statistics into a single ranked score. UI copy, comments, and domain terms are **Korean by design** — preserve them.

## Commands

```bash
npm run dev              # dev server (Turbopack) → http://localhost:3000
npm run build            # production build — output is fully static (○ prerendered)
npm start                # serve the production build
npm run lint             # eslint (flat config: eslint.config.mjs)
npm test                 # vitest run — all tests (30)

npx vitest run src/lib/naming/naming.test.ts   # one test file
npx vitest run -t "돌림자: 끝 글자 고정"          # one test by name
npx vitest                                      # watch mode
```

There is **no vitest config file** — vitest uses defaults and picks up `src/**/*.test.ts`. Tests are pure unit tests over the engines (no DOM/browser needed).

**Deploy:** the GitHub repo is connected to Vercel — pushing to `main` auto-deploys to production (live at https://ireum-beryl.vercel.app). Manual: `vercel --prod`. No env vars are required for full functionality.

## Architecture

### Everything computes in the browser — there is no backend
`src/app/page.tsx` renders a single `"use client"` component, `Studio` (`src/components/Studio.tsx`). There are **no API routes, no server actions, no database**. The build prerenders a static shell; on hydration, `Studio` holds all state (`NameParams`) and recomputes recommendations synchronously via `useMemo(() => suggestNames(params, 48))` on every control change (the "라이브 추천 / 적용 버튼 없음" behavior). Persistence is `localStorage` only. This is why it deploys as pure static output.

### The recommendation pipeline (the core of the app)
`src/lib/naming/suggest.ts` → `suggestNames(params, limit)` is the orchestrator. Understanding it means reading it alongside the five sub-engines it composes:

| Sub-score | Module | What it measures |
|-----------|--------|------------------|
| 사주 적합 (자원오행 보완) | `src/lib/saju/` | do the name's hanja supply the elements the birth chart lacks |
| 발음오행 (baleum) | `src/lib/naming/baleum.ts` | do the syllables' initial-consonant elements flow 상생 |
| 수리 (suri) | `src/lib/naming/suri.ts` | 사격(元亨利貞) stroke counts → 81수리 길흉 |
| 흔함 (commonness) | `src/lib/stats/commonness.ts` | how common/rare vs. 10-yr newborn stats |
| 선호 (preferences) | inline in `suggest.ts` | initials, hanja, 돌림자(항렬), 받침 avoidance |

`makeSuggestion()` combines these with **weights that shift depending on whether 사주 is enabled** (see `wSaju/wBaleum/wSuri/wRar/wQual` in `suggest.ts`). Candidate generation ranks syllables, expands hanja options per syllable, enforces initial-consonant coverage and 돌림자 position-locking, dedupes by `id = "given|hanjaString"`, then applies a **first-syllable diversity cap** (max 3 per leading syllable) before slicing to `limit`. `Studio` re-sorts the returned list client-side by `recommend | rare | fortune`.

### 오행 (five elements) is the shared vocabulary
`src/lib/core/elements.ts` is imported by both the saju and naming engines. It defines the `Element` type (`木火土金水`), the 상생/상극 relations (`GENERATES`/`CONTROLS`), 발음오행 `relation()`, and 십성 `tenGod()`. Any engine change that touches elements goes through here.

### 사주 delegates precise calculation, adds the analysis layer
`src/lib/saju/index.ts` → `computeSaju()` delegates the actual Four-Pillars/만세력 computation to the **`manseryeok`** npm package (KASI/한국천문연구원 data — handles 입춘 instant, 절기, 진태양시, 야자시 boundary). On top of that it computes element distribution, 신강/신약 (억부), 용신, 부족 오행, and produces `recommend: Element[]` — the elements the naming engine tries to supply. `ganji.ts` holds the 간지/지장간 tables.

### Data-driven engines
The engines are thin logic over JSON in `src/data/` (accessed via `src/lib/hanja/pool.ts` and the stats module):
- `hanja.json` (~730KB) / `namingHanja.json` — the naming hanja pool, keyed `bySyllable`, each entry carries 음/훈/뜻/획수(`s`)/자원오행(`oh`)/gender/`bad` flag.
- `myeongri.json` — 81수리 fortune table.
- `nameStats.json` — 대법원-based newborn rankings 2015–2024 (yearly top-20 + decade top). Ranking-based only; absolute counts are never inferred.
- `surnames.json` — 성씨 → hanja options (stroke/element) for 수리 계산.

### Storage abstraction (Supabase-ready)
`src/lib/storage/index.ts` exposes `getStorage(): IeumStorage`. Today it always returns the `localStorage` adapter; a Supabase adapter is stubbed for cross-device sync (`isSupabaseConfigured()` gated on `NEXT_PUBLIC_SUPABASE_*`). **UI code only touches the `IeumStorage` interface** — swap the adapter in `getStorage()`, don't change components.

## Conventions & gotchas
- **Path alias:** `@/*` → `src/*` (tsconfig).
- **Score scale:** nearly every sub-result (`suri.score`, `baleum.score`, `commonness.score`, `sajuFit.score`, `Suggestion.score`) is normalized **0–100**; `rarity` param is 0 (흔해도 OK) → 100 (희귀하게).
- **Legacy params:** some `NameParams` fields are unused / superseded — check the inline `// 미사용` notes in `src/lib/naming/types.ts` (e.g. `fixed`, `preferredElements`) before wiring UI to them.
- **Stroke counts** use current Unihan `kTotalStrokes`, which can differ slightly from traditional 강희자전 원획 — this caveat is surfaced in the UI, keep it.
- Styling is **Tailwind v4** (`@tailwindcss/postcss`, `postcss.config.mjs`); design tokens (ink/surface/accent + element colors wood/fire/earth/metal/water) live in `src/app/globals.css` and map to `ELEMENT_TOKEN`/`ELEMENT_HEX` in `elements.ts`.
