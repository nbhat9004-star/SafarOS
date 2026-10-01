// Root public route ("/").
//
// Renders ONE of the two EXISTING home experiences based on the admin-controlled
// "Public Homepage" setting (systemSettings.publicHomepage). Nothing is
// duplicated or redesigned here — we simply reuse the existing components:
//   * 'safar'   -> existing Safar Curated homepage  (./_safar-curated-home)
//   * 'explore' -> existing Explore homepage         (./explore/page)
//
// Default is 'safar' so public behavior is unchanged until an admin switches.
// The existing /explore route continues to work independently.
import { getCollection } from '@/lib/db';

// The choice is read from the database per request, so this route is dynamic.
export const dynamic = 'force-dynamic';

async function getPublicHomepage() {
  try {
    const col = await getCollection('systemSettings');
    const doc = await col.findOne({ type: 'system' });
    return doc?.publicHomepage === 'explore' ? 'explore' : 'safar';
  } catch {
    // Never break the homepage if the settings read fails — fall back to Safar.
    return 'safar';
  }
}

export default async function RootPage({ searchParams }) {
  const choice = await getPublicHomepage();
  const sp = await searchParams; // works whether searchParams is sync or a promise
  // Admin CMS preview (?preview=<id>) is handled inside the Safar homepage
  // renderer, so we never hijack a preview link with the Explore experience.
  const isPreview = Boolean(sp?.preview);

  if (choice === 'explore' && !isPreview) {
    const { default: ExploreHome } = await import('./explore/page');
    return <ExploreHome />;
  }

  const { default: SafarCuratedHome } = await import('./_safar-curated-home');
  return <SafarCuratedHome />;
}
