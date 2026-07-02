// 이음 로고. 채택 시안: ④ Rounded Friendly — 두 고리(테라코타+세이지)를 짜맞춰 잇다.
import type { SVGProps } from "react";

/** 스퀘어 마크 — favicon/작은 자리. 두 링이 짜여 이음(ㅇㅇ)을 이룬다. */
export function IeumMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <circle cx="41" cy="32" r="12" fill="none" stroke="#6FA98C" strokeWidth="6.5" />
      <circle cx="23" cy="32" r="12" fill="none" stroke="#DC6F4F" strokeWidth="6.5" />
      <clipPath id="ieum-weave">
        <rect x="25" y="34" width="14" height="11" />
      </clipPath>
      <circle
        cx="41"
        cy="32"
        r="12"
        fill="none"
        stroke="#6FA98C"
        strokeWidth="6.5"
        clipPath="url(#ieum-weave)"
      />
    </svg>
  );
}

/** 워드마크 — 헤더용 '이음' 잠금. 두 ㅇ을 부드러운 실이 잇는다. */
export function IeumWordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 180 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="이음"
      {...props}
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* 두 ㅇ을 잇는 실 (이음 = 잇다) */}
        <path d="M53 16 C77 4 103 4 117 16" stroke="#DC6F4F" strokeWidth="4" />
        {/* 이 : ㅇ + ㅣ */}
        <circle cx="44" cy="23" r="12" stroke="#DC6F4F" strokeWidth="6" />
        <line x1="74" y1="17" x2="74" y2="53" stroke="#2B2620" strokeWidth="6" />
        {/* 음 : ㅇ + ㅡ + ㅁ */}
        <circle cx="126" cy="23" r="12" stroke="#6FA98C" strokeWidth="6" />
        <line x1="104" y1="43" x2="148" y2="43" stroke="#2B2620" strokeWidth="6" />
        <rect x="108" y="49" width="36" height="11" rx="4" stroke="#2B2620" strokeWidth="5.5" />
      </g>
    </svg>
  );
}
