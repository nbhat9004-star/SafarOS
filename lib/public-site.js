// SafarOS — Public agency website data (shared by /api/public/site/* and the /site/[slug] page).
// Only PUBLISHED websites expose content; drafts return { published: false } with no settings/pages.
// Field allow-lists below are the single source of truth for what is publicly visible.

export function publicSettings(s) {
  if (!s) return null;
  return { siteTitle: s.siteTitle, tagline: s.tagline, logo: s.logo, favicon: s.favicon, contactEmail: s.contactEmail, phone: s.phone, address: s.address, social: s.social, primaryColor: s.primaryColor, secondaryColor: s.secondaryColor, font: s.font, theme: s.theme, seo: s.seo };
}

export function publicPage(p) {
  return { title: p.title, slug: p.slug, pageType: p.pageType, content: p.content, seoTitle: p.seoTitle, seoDescription: p.seoDescription, canonicalUrl: p.canonicalUrl, noindex: p.noindex, ogTitle: p.ogTitle, ogDescription: p.ogDescription, ogImage: p.ogImage };
}

// Read a published site directly from the DB (no HTTP self-fetch, so it never depends on the
// deployment URL / NEXT_PUBLIC_BASE_URL / Vercel deployment protection). Returns null if no agency.
export async function getPublishedSite(db, rawSlug) {
  const slug = String(rawSlug || '').toLowerCase().trim().slice(0, 120);
  if (!slug) return null;
  const agency = await db.collection('agencies').findOne({ slug }, { projection: { _id: 0, id: 1, name: 1, slug: 1, status: 1 } });
  if (!agency) return null;
  const settings = await db.collection('websiteSettings').findOne({ agencyId: agency.id }, { projection: { _id: 0 } });
  if (!(settings && settings.status === 'published')) return { published: false, agency: { name: agency.name, slug: agency.slug } };
  const pages = await db.collection('websitePages').find({ agencyId: agency.id, status: 'published' }, { projection: { _id: 0 } }).sort({ sortOrder: 1, createdAt: 1 }).toArray();
  return { published: true, agency: { name: agency.name, slug: agency.slug }, settings: publicSettings(settings), pages: pages.map(publicPage) };
}
