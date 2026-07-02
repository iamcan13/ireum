// 이음 로고 마크. 채택 시안: ③ 전각 도장(seal). 대안: ① 링크(link).
import type { SVGProps } from "react";

/** ③ 전각 도장 — 파비콘/헤더 기본 마크 (테라코타 도장에 이음 고리를 음각) */
export function SealMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <path
        fill="#DC6F4F"
        fillRule="evenodd"
        d="M 20,5.5 L 44,5 C 52,5 59,12 59,20 L 59,43.5 C 59,52 51.5,59 44,59 L 20.5,59 C 12,59 5,51.5 5,44 L 5,20.5 C 5,12 12.5,5 20,5.5 Z M 10,25 A 14,14 0 1,0 38,25 A 14,14 0 1,0 10,25 Z M 16.5,25 A 7.5,7.5 0 1,0 31.5,25 A 7.5,7.5 0 1,0 16.5,25 Z M 26,39 A 14,14 0 1,0 54,39 A 14,14 0 1,0 26,39 Z M 32.5,39 A 7.5,7.5 0 1,0 47.5,39 A 7.5,7.5 0 1,0 32.5,39 Z"
      />
    </svg>
  );
}

/** ① 링크 — 대안 마크 (두 고리를 테라코타 다리로 잇다) */
export function LinkMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <path fill="#2B2620" fillRule="evenodd" d="M5,32 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 z M12,32 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 z" />
      <path fill="#2B2620" fillRule="evenodd" d="M35,32 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 z M42,32 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 z" />
      <rect x="25.5" y="28" width="13" height="8" rx="4" fill="#DC6F4F" />
    </svg>
  );
}
