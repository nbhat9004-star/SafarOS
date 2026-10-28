import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';

async function getWebsiteData(slug) {
  try {
    // Read from the same database directly instead of making an HTTP request back
    // into this deployment. Internal fetches can fail on protected Vercel previews
    // and incorrectly turn a published agency website into a 404.
    const db = await getDb();
    const agency = await db.collection('agencies').findOne(
      { slug },
      { projection: { _id: 0, id: 1, name: 1, slug: 1 } },
    );
    if (!agency) return null;

    const settingsDoc = await db.collection('websiteSettings').findOne(
      { agencyId: agency.id },
      { projection: { _id: 0 } },
    );
    if (!settingsDoc || settingsDoc.status !== 'published') {
      return { published: false, agency: { name: agency.name, slug: agency.slug } };
    }

    const pages = await db.collection('websitePages')
      .find({ agencyId: agency.id, status: 'published' }, { projection: { _id: 0 } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();
    const settings = {
      siteTitle: settingsDoc.siteTitle,
      tagline: settingsDoc.tagline,
      logo: settingsDoc.logo,
      favicon: settingsDoc.favicon,
      contactEmail: settingsDoc.contactEmail,
      phone: settingsDoc.phone,
      address: settingsDoc.address,
      social: settingsDoc.social,
      primaryColor: settingsDoc.primaryColor,
      secondaryColor: settingsDoc.secondaryColor,
      font: settingsDoc.font,
      theme: settingsDoc.theme,
      seo: settingsDoc.seo,
    };
    const publicPages = pages.map((p) => ({
      id: p.id, title: p.title, slug: p.slug, pageType: p.pageType,
      status: p.status, sortOrder: p.sortOrder, content: p.content,
      seoTitle: p.seoTitle, seoDescription: p.seoDescription,
      canonicalUrl: p.canonicalUrl, noindex: p.noindex,
      ogTitle: p.ogTitle, ogDescription: p.ogDescription, ogImage: p.ogImage,
    }));
    return {
      published: true,
      agency: { name: agency.name, slug: agency.slug },
      settings,
      pages: publicPages,
    };
  } catch (error) {
    console.error('[public agency website] Failed to load site:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getWebsiteData(slug);
  if (!data?.published) return { title: 'Website unavailable | SafarOS' };
  const settings = data.settings || {};
  const title = settings.seo?.metaTitle || settings.siteTitle || data.agency?.name || 'Travel Agency';
  return {
    title,
    description: settings.seo?.metaDescription || settings.tagline || undefined,
    keywords: settings.seo?.keywords || undefined,
    robots: settings.seo?.robots || 'index, follow',
    openGraph: {
      title: settings.seo?.ogTitle || title,
      description: settings.seo?.ogDescription || settings.seo?.metaDescription || settings.tagline || undefined,
      images: settings.seo?.ogImage ? [settings.seo.ogImage] : undefined,
      type: 'website',
    },
  };
}

export default async function PublicSitePage({ params }) {
  const { slug } = await params;
  const data = await getWebsiteData(slug);
  if (!data || !data.published) notFound();

  const settings = data.settings || {};
  const savedPages = Array.isArray(data.pages) ? data.pages : [];
  const agency = data.agency || { name: settings.siteTitle || 'Travel Agency' };
  const homePage = pages.find(p => p.pageType === 'home') || pages[0];
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(settings.primaryColor || '') ? settings.primaryColor : '#6366f1';
  const themeKey = ['luxe-voyage','wildtrail','atlas-journeys','coastline','roots-routes','happy-trails','meridian'].includes(settings.theme) ? settings.theme : 'atlas-journeys';
  const siteTitle = settings.siteTitle || agency.name;
  // Never publish an empty shell just because the agency has not created pages yet.
  // Show a polished, theme-aware starter homepage until real pages are saved.
  const fallbackPages = [{
    id: 'safaros-starter-home',
    title: 'Discover Your Next Journey',
    slug: 'home',
    pageType: 'home',
    status: 'published',
    sortOrder: 0,
    content: `
      <section style="padding:clamp(2.5rem,8vw,6rem) clamp(1.25rem,5vw,4rem);border-radius:1.5rem;background:linear-gradient(125deg,${primaryColor},${settings.secondaryColor || '#0f172a'});color:#fff;overflow:hidden">
        <p style="margin:0 0 1rem;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;font-weight:800;opacity:.9">Thoughtfully planned · Unforgettable journeys</p>
        <h2 style="max-width:850px;margin:0;font-size:clamp(2.4rem,7vw,5rem);line-height:1.04;letter-spacing:-.045em;color:#fff">The world is waiting. Let’s make it yours.</h2>
        <p style="max-width:650px;margin:1.25rem 0 0;font-size:clamp(1rem,2vw,1.2rem);line-height:1.8;color:#fff;opacity:.92">${settings.tagline || 'Discover remarkable places, thoughtfully curated stays and travel experiences tailored around you.'}</p>
        <a href="#starter-packages" style="display:inline-block;margin-top:1.75rem;padding:.9rem 1.3rem;background:#fff;color:${primaryColor};border-radius:999px;text-decoration:none;font-weight:800">Explore journeys ↗</a>
      </section>
      <section style="padding:3rem 0 1rem">
        <p style="margin:0;color:${primaryColor};font-size:.75rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase">Travel your way</p>
        <h2 style="margin:.5rem 0 1.5rem;font-size:clamp(1.8rem,4vw,2.7rem);color:#172033">A little inspiration for your next escape</h2>
        <div id="starter-packages" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:1rem">
          <article style="padding:1.4rem;border:1px solid #e2e8f0;border-radius:1rem;background:#fff"><div style="height:8px;width:3rem;border-radius:99px;background:${primaryColor}"></div><p style="margin:.9rem 0 .4rem;color:${primaryColor};font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em">Nature & adventure</p><h3 style="margin:.3rem 0;font-size:1.25rem;color:#172033">Find your wild</h3><p style="margin:0;color:#64748b;line-height:1.7">Mountain views, fresh air and memorable days exploring somewhere new.</p></article>
          <article style="padding:1.4rem;border:1px solid #e2e8f0;border-radius:1rem;background:#fff"><div style="height:8px;width:3rem;border-radius:99px;background:${settings.secondaryColor || '#0f172a'}"></div><p style="margin:.9rem 0 .4rem;color:${primaryColor};font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em">Culture & discovery</p><h3 style="margin:.3rem 0;font-size:1.25rem;color:#172033">Meet the local stories</h3><p style="margin:0;color:#64748b;line-height:1.7">Explore historic streets, regional flavours and places rich with character.</p></article>
          <article style="padding:1.4rem;border:1px solid #e2e8f0;border-radius:1rem;background:#fff"><div style="height:8px;width:3rem;border-radius:99px;background:${primaryColor}"></div><p style="margin:.9rem 0 .4rem;color:${primaryColor};font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em">Rest & recharge</p><h3 style="margin:.3rem 0;font-size:1.25rem;color:#172033">Take the scenic route</h3><p style="margin:0;color:#64748b;line-height:1.7">Slow down with beautiful stays, open horizons and time for yourself.</p></article>
        </div>
      </section>
      <section style="margin:2rem 0 0;padding:2rem clamp(1rem,4vw,2.5rem);border-radius:1.25rem;background:#f8fafc;text-align:center">
        <h2 style="margin:0;color:#172033;font-size:clamp(1.5rem,4vw,2.2rem)">Your next story starts here.</h2>
        <p style="max-width:600px;margin:.75rem auto 1.2rem;color:#64748b;line-height:1.7">Tell us what you have in mind and we’ll help you plan a journey that feels right for you.</p>
        <a href="#contact" style="display:inline-block;padding:.85rem 1.2rem;background:${primaryColor};color:#fff;border-radius:999px;text-decoration:none;font-weight:800">Plan your trip ↗</a>
      </section>`
  }];
  const pages = savedPages.length ? savedPages : fallbackPages;

  return (
    <div className={`safar-public-site theme-${themeKey}`} style={{ minHeight: '100vh', margin: 0, fontFamily: settings.font || 'system-ui, sans-serif', backgroundColor: '#fff', color: '#000', overflowWrap: 'anywhere' }}>
      <style>{`
        .safar-public-site, .safar-public-site * { box-sizing: border-box; }
        .safar-public-site { scroll-behavior: smooth; }
        .safar-public-site .site-header-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; }
        .safar-public-site .site-brand { display: flex; align-items: center; gap: 1rem; min-width: 0; }
        .safar-public-site .site-brand img { width: auto; max-width: 100%; height: 40px; object-fit: contain; }
        .safar-public-site .site-brand h1 { margin: 0; font-size: 1.5rem; overflow-wrap: anywhere; }
        .safar-public-site .site-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; }
        .safar-public-site .site-nav a { color: #fff; text-decoration: none; font-weight: 500; }
        .safar-public-site .site-mobile-nav { display: none; }
        .safar-public-site .site-main { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }
        .safar-public-site .site-main h2 { overflow-wrap: anywhere; }
        .safar-public-site .site-main img, .safar-public-site .site-main video, .safar-public-site .site-main iframe { max-width: 100%; }
        .safar-public-site .site-main img { height: auto; }
        .safar-public-site .site-main pre, .safar-public-site .site-main table { max-width: 100%; overflow-x: auto; }
        .safar-public-site .site-footer-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .safar-public-site.theme-luxe-voyage { background: #faf8f2 !important; }
        .safar-public-site.theme-luxe-voyage .site-brand h1, .safar-public-site.theme-luxe-voyage .site-main h2 { font-family: Georgia, 'Times New Roman', serif !important; letter-spacing: -.02em; }
        .safar-public-site.theme-luxe-voyage .site-header { border-bottom: 3px solid #c9a96e; }
        .safar-public-site.theme-wildtrail .site-header { background-image: linear-gradient(115deg, rgba(0,0,0,.18), transparent) !important; }
        .safar-public-site.theme-wildtrail .site-main section { border-left: 3px solid #d5a84f; padding-left: 1rem; }
        .safar-public-site.theme-atlas-journeys .site-main { max-width: 1120px; }
        .safar-public-site.theme-coastline { background: #f0fdfa !important; }
        .safar-public-site.theme-coastline .site-header { border-bottom: 4px solid #2dd4bf; }
        .safar-public-site.theme-roots-routes { background: #fffaf0 !important; }
        .safar-public-site.theme-roots-routes .site-main section { background: rgba(217,119,6,.045); padding: 1.25rem; border-radius: .75rem; }
        .safar-public-site.theme-happy-trails .site-main section { background: #f0fdf4; padding: 1.25rem; border-radius: 1rem; }
        .safar-public-site.theme-happy-trails .site-header { border-bottom: 4px solid #f59e0b; }
        .safar-public-site.theme-meridian .site-header { border-bottom: 3px solid #64748b; }
        .safar-public-site.theme-meridian .site-main { max-width: 1080px; }
        @media (max-width: 700px) {
          .safar-public-site .site-header { padding: 1rem !important; }
          .safar-public-site .site-header-inner { align-items: flex-start; flex-direction: column; gap: 1rem; }
          .safar-public-site .site-brand { width: 100%; }
          .safar-public-site .site-brand h1 { font-size: 1.25rem; }
          .safar-public-site .site-nav { display: none; }
          .safar-public-site .site-mobile-nav { display: block; width: 100%; }
          .safar-public-site .site-mobile-nav summary { cursor: pointer; width: fit-content; padding: .6rem .9rem; border: 1px solid rgba(255,255,255,.65); border-radius: .5rem; font-weight: 600; list-style-position: inside; }
          .safar-public-site .site-mobile-nav ul { list-style: none; margin: .75rem 0 0; padding: .25rem 0; display: grid; gap: .25rem; }
          .safar-public-site .site-mobile-nav a { display: block; color: #fff; text-decoration: none; padding: .7rem .25rem; min-height: 44px; }
          .safar-public-site .site-main { padding: 2rem 1rem; }
          .safar-public-site .site-main h2 { font-size: clamp(1.5rem, 7vw, 2.2rem) !important; }
          .safar-public-site .site-footer { padding: 1.5rem 1rem !important; }
        }
      `}</style>

      <header className="site-header" style={{ backgroundColor: primaryColor, color: '#fff', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div className="site-header-inner">
          <div className="site-brand">
            {settings.logo && <img src={settings.logo} alt={agency.name || siteTitle} />}
            <h1 style={{ fontFamily: settings.font || 'inherit' }}>{siteTitle}</h1>
          </div>
          <nav className="site-nav" aria-label="Main navigation">
            <ul>{pages.map(p => <li key={p.slug}><a href={`#${p.slug}`}>{p.title}</a></li>)}</ul>
          </nav>
          <details className="site-mobile-nav">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              <ul>{pages.map(p => <li key={p.slug}><a href={`#${p.slug}`}>{p.title}</a></li>)}</ul>
            </nav>
          </details>
        </div>
      </header>

      <main className="site-main">
        {homePage ? (
          <section id={homePage.slug} style={{ marginBottom: '3rem', scrollMarginTop: '1rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: settings.font || 'inherit', color: primaryColor }}>{homePage.title}</h2>
            <div style={{ fontSize: '1.125rem', lineHeight: '1.75' }} dangerouslySetInnerHTML={{ __html: homePage.content || '' }} />
          </section>
        ) : null}

        {pages.filter(p => p.slug !== homePage?.slug).map(page => (
          <section key={page.slug} id={page.slug} style={{ marginBottom: '3rem', paddingTop: '2rem', scrollMarginTop: '1rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: settings.font || 'inherit', color: primaryColor }}>{page.title}</h2>
            <div style={{ fontSize: '1.125rem', lineHeight: '1.75' }} dangerouslySetInnerHTML={{ __html: page.content || '' }} />
          </section>
        ))}

        {pages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
            <h2>Welcome to {agency.name}</h2>
            <p>{settings.tagline || 'Website coming soon.'}</p>
          </div>
        )}
      </main>

      <footer className="site-footer" style={{ backgroundColor: '#f3f4f6', padding: '2rem', marginTop: '4rem', borderTop: '1px solid #e5e7eb' }}>
        <div className="site-footer-inner">
          <p style={{ margin: '0 0 1rem', color: '#6b7280' }}>{settings.tagline}</p>
          {settings.social && Object.keys(settings.social).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {Object.entries(settings.social).map(([platform, url]) => url ? (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textTransform: 'capitalize', padding: '.4rem' }}>{platform}</a>
              ) : null)}
            </div>
          )}
          <p style={{ margin: 0, fontSize: '.875rem', color: '#9ca3af' }}>© {new Date().getFullYear()} {agency.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
