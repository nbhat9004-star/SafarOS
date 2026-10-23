// SafarOS — Website builder document: server-side sanitising + public filtering.
// The builder lives on the agency's own websiteSettings document (tenant-scoped), so no
// customer/package records are ever exposed publicly. All text is rendered as React text
// (escaped); URLs are restricted to http(s)/mailto/tel/relative; colours to hex.

const URL_KEY = /^(href|image|logo|favicon|mapUrl|ctaHref|buttonHref|secondaryHref|privacyHref|termsHref|instagram|facebook|youtube|linkedin|x|tiktok|ogImage|canonicalUrl)$/;
const COLOR_KEY = /^(bg|textColor|primary|secondary|accent|text|sectionBg)$/;
const KEY_RE = /^[a-zA-Z0-9_]{1,40}$/;

export function safeUrl(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#|\?)/i.test(s) && !/[\s<>"']/.test(s)) return s.slice(0, 1000);
  return '';
}
const safeColor = (v) => (/^#[0-9a-fA-F]{3,8}$/.test(String(v || '').trim()) ? String(v).trim() : '');
export const slugify = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

function clean(v, key, depth) {
  if (depth > 6) return undefined;
  if (Array.isArray(v)) {
    const out = v.slice(0, 80).map((x) => (key === 'gallery' && typeof x === 'string' ? safeUrl(x) : clean(x, key, depth + 1))).filter((x) => x !== undefined && x !== '');
    return out;
  }
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) { if (!KEY_RE.test(k)) continue; const c = clean(val, k, depth + 1); if (c !== undefined) o[k] = c; }
    return o;
  }
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(-1e9, Math.min(1e9, v)) : undefined;
  if (typeof v === 'string') {
    if (URL_KEY.test(key)) return safeUrl(v);
    if (COLOR_KEY.test(key)) return safeColor(v);
    return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, 5000);
  }
  return undefined;
}

// Returns { value } or { error }.
export function sanitizeBuilder(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid website builder data' };
  if (JSON.stringify(input).length > 600000) return { error: 'Website content is too large. Remove some sections or items.' };
  const b = clean(input, 'builder', 0) || {};
  for (const list of ['tours', 'destinations']) {
    const seen = new Set();
    b[list] = (Array.isArray(b[list]) ? b[list] : []).filter((x) => x && typeof x === 'object' && String(x.name || '').trim()).map((x, i) => {
      let s = slugify(x.slug || x.name) || `${list}-${i + 1}`; while (seen.has(s)) s = `${s}-${i + 1}`; seen.add(s);
      return { ...x, id: String(x.id || `${list}-${Date.now()}-${i}`).slice(0, 60), slug: s, published: x.published !== false };
    });
  }
  b.sections = (Array.isArray(b.sections) ? b.sections : []).filter((s) => s && typeof s === 'object' && typeof s.type === 'string').slice(0, 40);
  return { value: b };
}

// Public view: only published tours/destinations; nothing private is stored here anyway.
export function publicBuilder(b) {
  if (!b || typeof b !== 'object' || !Array.isArray(b.sections)) return null;
  return { ...b, tours: (b.tours || []).filter((t) => t.published !== false), destinations: (b.destinations || []).filter((d) => d.published !== false) };
}
