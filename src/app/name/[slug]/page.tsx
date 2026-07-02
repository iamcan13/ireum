import type { Metadata } from "next";
import { Studio } from "@/components/Studio";
import { decodeShare, shareTextMeta } from "@/lib/naming/share";

type Props = { params: Promise<{ slug: string }> };

const SITE = "https://namer.gommahands.kr";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seed = decodeShare(slug);
  if (!seed) {
    return { title: "이음 · 아이 이름 짓기" };
  }
  const { fullName, hanja, meaning } = shareTextMeta(seed);
  const title = `${fullName}${hanja ? ` (${hanja})` : ""} · 이음`;
  const description = `${meaning ? `${meaning} — ` : ""}음운·한자·사주·통계로 지은 이름 '${fullName}'. 이음에서 자세히 보기.`;
  const url = `${SITE}/name/${slug}`;
  // 동적 라우트에는 파일 기반 OG 이미지가 자동 상속되지 않아 명시적으로 지정.
  const image = { url: `${SITE}/opengraph-image.png`, width: 2400, height: 1260, alt: title };
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "ko_KR",
      siteName: "이음",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    alternates: { canonical: url },
  };
}

export default async function NameSharePage({ params }: Props) {
  const { slug } = await params;
  return <Studio shareSlug={slug} />;
}
