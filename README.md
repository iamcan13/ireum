# 이음 (Ieum) · 아이 이름 짓기

> 아이와 이름을 잇다 — 음운·한자·사주·신생아 통계로 아이에게 꼭 맞는 이름을 함께 찾는 작명 스튜디오.

심플하고 따뜻한 인터페이스에서 조건을 바꿔가며 이름을 추천받고, 한자 풀이·오행·수리·사주·흔함 지수까지 풍부한 정보를 즉시 확인합니다.

**🔗 라이브 데모 — https://namer.gommahands.kr** &nbsp;·&nbsp; **소스 — https://github.com/iamcan13/ireum**

> GitHub 저장소가 Vercel에 연결되어 있어, `main`에 푸시하면 자동으로 배포됩니다. 데이터베이스 없이 완전 정적(Static)으로 동작합니다.

## ✨ 기능

- **라이브 추천** — 성·성별·글자 수·흔함 강도·소리 취향·한자 취향을 바꾸는 즉시 순위가 갱신됩니다. (적용 버튼 없음)
- **사주(만세력) 분석** — 생년월일시로 4기둥(년·월·일·시 간지)·오행 분포·신강/신약·부족 오행을 계산하고, 그 균형을 채워주는 자원오행 한자를 추천합니다.
- **한자 작명** — 인명용 한자 풀에서 자원오행·발음오행(소리 상생)·수리(사격 81수리 길흉)를 종합해 후보를 점수화합니다.
- **신생아 통계 기반 흔함 지수** — 최근 10년(2015–2024) 인기 이름 통계로 후보 이름의 흔함/희귀 정도를 계량합니다.
- **즐겨찾기 · 비교 · 공유** — 마음에 든 이름을 저장(브라우저)하고, 최대 3개를 표로 비교합니다.

## 🧱 기술 스택

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **manseryeok** — KASI(한국천문연구원) 데이터 기반 만세력/사주 (입춘·절기·진태양시·야자시 정확)
- **motion** — 마이크로인터랙션(라이브 재정렬·드로어)
- 폰트: Pretendard(본문) · Noto Serif KR(이름 디스플레이)

## 🚀 로컬 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

## ✅ 검증

```bash
npm test           # vitest — 사주 12개 만세력 케이스 + 성명학/추천 엔진 (30 tests)
npm run build      # 프로덕션 빌드 (정적 페이지 생성)
```

브라우저 E2E(Playwright)로 모든 인터랙션(라이브 재정렬·드로어·사주 연동·즐겨찾기·비교)을 검증했습니다.

## ☁️ 배포 (Vercel)

이 저장소는 이미 Vercel에 배포되어 있습니다 → **https://namer.gommahands.kr**

데이터베이스 없이도 완전히 동작합니다(즐겨찾기는 localStorage). GitHub 저장소가 Vercel 프로젝트에 연결되어 있어, `main` 브랜치에 푸시하면 자동으로 프로덕션 배포가 트리거됩니다.

직접 배포하려면:

```bash
npm i -g vercel        # 또는 brew install vercel-cli
vercel login           # 최초 1회 (브라우저 인증)
vercel link            # 프로젝트 연결
vercel git connect     # (선택) GitHub 저장소 연결 → push 시 자동 배포
vercel --prod          # 프로덕션 배포
```

즐겨찾기는 별도 백엔드/DB 없이 브라우저 `localStorage`에 저장됩니다. 필요한 환경변수는 없습니다.

## 📚 데이터 출처

- 신생아 이름 통계: **대법원 전자가족관계등록시스템** 기반 집계(baby-name.kr 등, 2015–2024), 일부 연도 rank.intoday.kr·namechart.kr 교차검증.
- 한자: **Unicode Unihan** (음·획수·부수) + 214부수 자원오행 매핑.
- 만세력/사주: **manseryeok**(KASI 데이터) — 12개 기준 케이스로 검증.
- 성명학(81수리·발음오행·사격): 통용 성명학 이론(irum.com 등) 기반.

> ⚠️ 사주·수리·오행 해석은 전통 명리/성명학에 기반한 **참고·재미 정보**입니다. 수리 획수는 현행 한자 자형 총획(Unicode) 기준으로, 전통 강희자전 원획과 다를 수 있습니다.

## 📁 구조

```
src/
  app/            # layout · page · globals.css(디자인 토큰)
  components/     # Studio · ControlPanel · ResultList · DetailDrawer · CompareTray · ui/
  lib/
    saju/         # 만세력 엔진(+테스트)
    naming/       # 수리 · 발음오행 · 추천 엔진(+테스트)
    stats/        # 신생아 통계 흔함 지수
    hanja/        # 작명 한자 풀
    core/         # 오행 상수
    storage/      # 영속성 추상화(localStorage)
  data/           # namingHanja · hanja · nameStats · myeongri · surnames (JSON)
```
