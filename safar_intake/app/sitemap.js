/**
 * /sitemap.xml — served at /sitemap.xml via Next.js file-based convention.
 * Emits static marketing routes + top public Safar Circle destinations, and
 * appends the most-recently-published public journeys. Fails gracefully if
 * the DB is unreachable (returns static routes only).
 */
import { getCollection } from '@/lib/db';

const STATIC_ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'daily' },
  { path: '/explore', priority: 0.85, changeFrequency: 'daily' },
  { path: '/explore/home', priority: 0.9, changeFrequency: 'daily' },
  { path: '/explore/community', priority: 0.8, changeFrequency: 'daily' },
  { path: '/explore/journey', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/explore/stories', priority: 0.75, changeFrequency: 'daily' },
  { path: '/explore/passport', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/guides', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/host-guide', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/host-tips', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/trust-safety', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/cancellation-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://safarcurated.com').replace(/\/$/, '');
  const now = new Date();
  const entries = STATIC_ROUTES.map(r => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // The main marketplace `/explore/*` routes are already listed above.
  try {
    const listings = await getCollection('listings');
    const listingDocs = await listings
      .find({ status: 'approved' }, { projection: { id: 1, slug: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();
    for (const l of listingDocs) {
      const key = l.slug || l.id;
      if (!key) continue;
      entries.push({
        url: `${base}/property/${key}`,
        lastModified: l.updatedAt || now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (e) {
    // DB unreachable — return static routes only. Logged for observability.
    console.warn('sitemap: dynamic routes skipped —', e?.message || e);
  }
  return entries;
}
