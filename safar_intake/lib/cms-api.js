// CMS API client (Module 18)
// Provides thin fetch helpers around /api/cms/* and /api/public/site.
// All admin calls automatically send safar_token cookie (same-origin).

async function req(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || (data && data.ok === false)) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const cmsApi = {
  // Templates
  listTemplates: () => req('/api/cms/templates'),
  getTemplate: (key) => req(`/api/cms/templates/${key}`),

  // Home pages
  listHomePages: () => req('/api/cms/home-pages'),
  getHomePage: (id) => req(`/api/cms/home-pages/${id}`),
  createHomePage: (payload) => req('/api/cms/home-pages', { method: 'POST', body: JSON.stringify(payload) }),
  updateHomePage: (id, payload) => req(`/api/cms/home-pages/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteHomePage: (id) => req(`/api/cms/home-pages/${id}`, { method: 'DELETE' }),
  publishHomePage: (id) => req(`/api/cms/home-pages/${id}/publish`, { method: 'POST' }),
  unpublishHomePage: (id) => req(`/api/cms/home-pages/${id}/unpublish`, { method: 'POST' }),
  duplicateHomePage: (id) => req(`/api/cms/home-pages/${id}/duplicate`, { method: 'POST' }),

  // Pages
  listPages: (q = {}) => {
    const qs = new URLSearchParams(q).toString();
    return req(`/api/cms/pages${qs ? '?' + qs : ''}`);
  },
  getPage: (id) => req(`/api/cms/pages/${id}`),
  createPage: (payload) => req('/api/cms/pages', { method: 'POST', body: JSON.stringify(payload) }),
  updatePage: (id, payload) => req(`/api/cms/pages/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePage: (id) => req(`/api/cms/pages/${id}`, { method: 'DELETE' }),
  publishPage: (id) => req(`/api/cms/pages/${id}/publish`, { method: 'POST' }),

  // Header / Footer / Theme
  getHeader: () => req('/api/cms/header'),
  updateHeader: (payload) => req('/api/cms/header', { method: 'PUT', body: JSON.stringify(payload) }),
  getFooter: () => req('/api/cms/footer'),
  updateFooter: (payload) => req('/api/cms/footer', { method: 'PUT', body: JSON.stringify(payload) }),
  getTheme: () => req('/api/cms/theme'),
  updateTheme: (payload) => req('/api/cms/theme', { method: 'PUT', body: JSON.stringify(payload) }),

  // Navigation
  listNavigation: () => req('/api/cms/navigation'),
  createNavigation: (payload) => req('/api/cms/navigation', { method: 'POST', body: JSON.stringify(payload) }),
  updateNavigation: (id, payload) => req(`/api/cms/navigation/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteNavigation: (id) => req(`/api/cms/navigation/${id}`, { method: 'DELETE' }),

  // Media
  listMedia: (q = {}) => {
    const qs = new URLSearchParams(q).toString();
    return req(`/api/cms/media${qs ? '?' + qs : ''}`);
  },
  addMedia: (payload) => req('/api/cms/media', { method: 'POST', body: JSON.stringify(payload) }),
  updateMedia: (id, payload) => req(`/api/cms/media/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMedia: (id) => req(`/api/cms/media/${id}`, { method: 'DELETE' }),

  // Global components
  listGlobal: () => req('/api/cms/global'),
  createGlobal: (payload) => req('/api/cms/global', { method: 'POST', body: JSON.stringify(payload) }),
  updateGlobal: (id, payload) => req(`/api/cms/global/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteGlobal: (id) => req(`/api/cms/global/${id}`, { method: 'DELETE' }),

  // Versions
  listVersions: (q = {}) => {
    const qs = new URLSearchParams(q).toString();
    return req(`/api/cms/versions${qs ? '?' + qs : ''}`);
  },
  getVersion: (id) => req(`/api/cms/versions/${id}`),
  restoreVersion: (id) => req(`/api/cms/versions/${id}/restore`, { method: 'POST' }),

  // Stats
  getStats: () => req('/api/cms/stats'),
};

// Section library — canonical list of all section types + editable fields.
// This drives:
//  a) the "Add Section" picker in the visual builder
//  b) the SectionRenderer on the public homepage
export const SECTION_LIBRARY = [
  { type: 'hero', label: 'Hero', icon: '🎬', desc: 'Full-bleed hero with title, subtitle, CTAs', fields: ['title','subtitle','variant','ctaPrimary','ctaSecondary'] },
  { type: 'search', label: 'Search Bar', icon: '🔍', desc: 'Where / When / Guests search widget', fields: ['style'] },
  { type: 'categories', label: 'Category Pills', icon: '🏷️', desc: 'Browse by category', fields: ['title'] },
  { type: 'stats', label: 'Stats', icon: '📊', desc: 'Numbers strip (trust markers)', fields: ['title'] },
  { type: 'destinations', label: 'Destinations Grid', icon: '📍', desc: 'Trending destinations', fields: ['title','columns'] },
  { type: 'featured-listings', label: 'Featured Listings', icon: '⭐', desc: 'Auto-loads latest approved listings', fields: ['title','limit'] },
  { type: 'luxury-collection', label: 'Luxury Collection', icon: '👑', desc: 'Premium listings row', fields: ['title'] },
  { type: 'houseboats', label: 'Houseboats', icon: '🛥️', desc: 'Dal Lake houseboats', fields: ['title'] },
  { type: 'hotels', label: 'Hotels', icon: '🏨', desc: 'Approved hotels', fields: ['title'] },
  { type: 'homestays', label: 'Homestays', icon: '🏡', desc: 'Boutique homestays', fields: ['title'] },
  { type: 'experiences', label: 'Experiences', icon: '🎭', desc: 'Local experiences', fields: ['title'] },
  { type: 'bike-rentals', label: 'Bike Rentals', icon: '🏍️', desc: 'Two-wheeler rentals', fields: ['title'] },
  { type: 'car-rentals', label: 'Cab / Car Rentals', icon: '🚗', desc: 'Cars & cabs', fields: ['title'] },
  { type: 'shopping-guides', label: 'Shopping Guides', icon: '🛍️', desc: 'Curated shops', fields: ['title'] },
  { type: 'tour-guides', label: 'Tour Guides', icon: '🧭', desc: 'Local guides', fields: ['title'] },
  { type: 'wazwan', label: 'Wazwan & Cuisine', icon: '🍽️', desc: 'Signature food experiences', fields: ['title'] },
  { type: 'popular-categories', label: 'Popular Categories', icon: '🔥', desc: 'Curated tags', fields: ['title'] },
  { type: 'offers', label: 'Offers', icon: '💸', desc: 'Live promotions', fields: ['title'] },
  { type: 'coupons', label: 'Coupons', icon: '🎟️', desc: 'Coupon codes', fields: ['title'] },
  { type: 'testimonials', label: 'Testimonials', icon: '💬', desc: 'Traveler stories', fields: ['title'] },
  { type: 'partners', label: 'Partners', icon: '🤝', desc: 'Partner logos', fields: ['title'] },
  { type: 'blog', label: 'Blog Preview', icon: '📰', desc: 'Latest blog posts', fields: ['title'] },
  { type: 'travel-stories', label: 'Travel Stories', icon: '📖', desc: 'Editorial stories', fields: ['title'] },
  { type: 'instagram-feed', label: 'Instagram Feed', icon: '📸', desc: 'Grid of IG images', fields: ['title','handle'] },
  { type: 'ai-planner-promo', label: 'AI Planner Promo', icon: '🪄', desc: 'Safar AI section', fields: ['title'] },
  { type: 'host-cta', label: 'Host CTA', icon: '🏔️', desc: 'Become a host banner', fields: ['title'] },
  { type: 'faq', label: 'FAQ', icon: '❓', desc: 'Frequently asked questions', fields: ['title','items'] },
  { type: 'cta', label: 'Generic CTA', icon: '📣', desc: 'Custom CTA banner', fields: ['title','subtitle','buttonLabel','buttonHref','background'] },
  { type: 'newsletter', label: 'Newsletter', icon: '📧', desc: 'Email signup', fields: ['title','subtitle'] },
  { type: 'html', label: 'Custom HTML', icon: '⚡', desc: 'Raw HTML / embed block', fields: ['html'] },
];

export function findSectionMeta(type) {
  return SECTION_LIBRARY.find(s => s.type === type) || { type, label: type, icon: '📦', fields: [] };
}
