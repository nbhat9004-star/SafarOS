// SafarOS — Platform blog helpers: input validation and a SAFE Markdown → HTML renderer.
// All HTML in post bodies is escaped first; only a small whitelist of formatting is produced.
// Links/images are restricted to http(s) or site-relative URLs.

export const BLOG_STATUSES = ['draft', 'published'];
const MAX_IMG_BYTES = 2 * 1024 * 1024;
export const BLOG_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']; // no SVG (script risk)
export const BLOG_MAX_IMAGE_BYTES = MAX_IMG_BYTES;

export const blogSlugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 90);

const txt = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
export function safeBlogUrl(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/^(https?:\/\/|\/(?!\/))/i.test(s) && !/[\s<>"'`]/.test(s)) return s.slice(0, 1000);
  return '';
}

// Returns { value } or { error }. `partial` for updates.
export function buildBlogFields(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => !partial || body[k] !== undefined;
  if (has('title')) { const t = txt(body.title, 200); if (!t) return { error: 'Title is required' }; out.title = t; }
  if (has('slug') || (!partial && body.title)) { const s = blogSlugify(body.slug || body.title); if (!s && !partial) return { error: 'A valid URL slug is required' }; if (s) out.slug = s; }
  if (has('excerpt')) out.excerpt = txt(body.excerpt, 500);
  if (has('content')) out.content = txt(body.content, 100000);
  if (has('featuredImage')) { const u = safeBlogUrl(body.featuredImage); if (body.featuredImage && !u) return { error: 'Featured image must be an https:// URL or an uploaded image' }; out.featuredImage = u; }
  if (has('featuredImageAlt')) out.featuredImageAlt = txt(body.featuredImageAlt, 200);
  if (has('author')) out.author = txt(body.author, 120);
  if (has('category')) out.category = txt(body.category, 80);
  if (has('tags')) {
    const raw = Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',');
    out.tags = [...new Set(raw.map((t) => txt(t, 40).toLowerCase()).filter(Boolean))].slice(0, 15);
  }
  if (has('seoTitle')) out.seoTitle = txt(body.seoTitle, 200);
  if (has('metaDescription')) out.metaDescription = txt(body.metaDescription, 320);
  if (has('ogImage')) { const u = safeBlogUrl(body.ogImage); if (body.ogImage && !u) return { error: 'Social image must be an https:// URL' }; out.ogImage = u; }
  if (has('publishedAt') && body.publishedAt) { const d = new Date(body.publishedAt); if (Number.isNaN(d.getTime())) return { error: 'Invalid publication date' }; out.publishedAt = d.toISOString(); }
  return { value: out };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function inline(s) {
  // s is already HTML-escaped.
  let h = s;
  h = h.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => { const u = safeBlogUrl(url.replace(/&amp;/g, '&')); return u ? `<img src="${esc(u)}" alt="${alt}" loading="lazy" />` : ''; });
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => { const u = safeBlogUrl(url.replace(/&amp;/g, '&')); if (!u) return label; const ext = /^https?:/i.test(u); return `<a href="${esc(u)}"${ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${label}</a>`; });
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  return h;
}

// Minimal Markdown: #/##/### headings, paragraphs, - and 1. lists, > quotes, ---, **bold**, *italic*, `code`, [link](url), ![alt](url)
export function renderBlogMarkdown(md) {
  const lines = esc(String(md || '')).replace(/\r\n?/g, '\n').split('\n');
  const out = []; let para = []; let list = null;
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushL = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushP(); flushL(); continue; }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushP(); flushL(); const n = m[1].length + 1; out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^-{3,}$/.test(line.trim())) { flushP(); flushL(); out.push('<hr />'); continue; }
    if ((m = line.match(/^&gt;\s?(.*)$/))) { flushP(); flushL(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flushP(); if (!list || list.tag !== 'ul') { flushL(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushP(); if (!list || list.tag !== 'ol') { flushL(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushL(); para.push(line.trim());
  }
  flushP(); flushL();
  return out.join('\n');
}

export const readingMinutes = (md) => Math.max(1, Math.round(String(md || '').split(/\s+/).filter(Boolean).length / 220));

// Fields safe for the public site (no internal ids of authors/editors).
export function publicPost(p) {
  if (!p) return null;
  return { slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, featuredImage: p.featuredImage, featuredImageAlt: p.featuredImageAlt, author: p.author, category: p.category, tags: p.tags || [], publishedAt: p.publishedAt, updatedAt: p.updatedAt, seoTitle: p.seoTitle, metaDescription: p.metaDescription, ogImage: p.ogImage };
}
