import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이음 · 아이 이름 짓기",
  description:
    "음운·한자·사주·신생아 통계로 아이에게 꼭 맞는 이름을 잇습니다. 간결하고 따뜻한 작명 스튜디오, 이음.",
  applicationName: "이음",
  authors: [{ name: "Ieum" }],
  keywords: ["작명", "아기 이름", "한자 작명", "사주", "신생아 이름 통계", "이름 추천"],
  openGraph: {
    title: "이음 · 아이 이름 짓기",
    description:
      "음운·한자·사주·신생아 통계로 아이에게 꼭 맞는 이름을 잇습니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
