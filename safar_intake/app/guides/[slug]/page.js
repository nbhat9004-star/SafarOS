// Dynamic SEO guide route. Renders /guides/{slug} for 10 curated travel guides.
// Server component — exports metadata + generateStaticParams for SSG and SEO.
// Pages are intentionally NOT linked from Navbar/Footer/Homepage — access via direct URL only.
// Pages remain indexable (no noindex), so Google can crawl them.

import { notFound } from 'next/navigation';
import GuideLayout from '@/components/safar/GuideLayout';
import { GUIDES, GUIDE_SLUGS } from '@/lib/guides-data';

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) {
    return { title: 'Travel Guide — Safar' };
  }
  const canonical = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) return notFound();
  return <GuideLayout guide={guide} />;
}
