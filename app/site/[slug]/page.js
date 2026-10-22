import { notFound } from 'next/navigation';

async function getWebsiteData(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/public/site/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PublicSitePage({ params }) {
  const { slug } = await params;
  const data = await getWebsiteData(slug);

  if (!data || !data.published) notFound();

  const { settings, pages, agency } = data;
  // The public API already returns published pages only and omits internal IDs/status fields.
  const publishedPages = Array.isArray(pages) ? pages : [];
  const homePage = publishedPages.find(p => p.pageType === 'home') || publishedPages[0];
  const primaryColor = settings.primaryColor || '#6366f1';
  const siteTitle = settings.siteTitle || agency.name;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{settings.seo?.metaTitle || siteTitle}</title>
        {settings.seo?.metaDescription && <meta name="description" content={settings.seo.metaDescription} />}
        {settings.seo?.keywords && <meta name="keywords" content={settings.seo.keywords} />}
        {settings.seo?.robots && <meta name="robots" content={settings.seo.robots} />}
        {settings.seo?.ogTitle && <meta property="og:title" content={settings.seo.ogTitle} />}
        {settings.seo?.ogDescription && <meta property="og:description" content={settings.seo.ogDescription} />}
        {settings.seo?.ogImage && <meta property="og:image" content={settings.seo.ogImage} />}
        <style>{`
          * { box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          body { overflow-wrap: anywhere; }
          .site-header-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; }
          .site-brand { display: flex; align-items: center; gap: 1rem; min-width: 0; }
          .site-brand img { width: auto; max-width: 100%; height: 40px; object-fit: contain; }
          .site-brand h1 { margin: 0; font-size: 1.5rem; overflow-wrap: anywhere; }
          .site-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; }
          .site-nav a { color: #fff; text-decoration: none; font-weight: 500; }
          .site-mobile-nav { display: none; }
          .site-main { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }
          .site-main h2 { overflow-wrap: anywhere; }
          .site-main img, .site-main video, .site-main iframe { max-width: 100%; }
          .site-main img { height: auto; }
          .site-main pre, .site-main table { max-width: 100%; overflow-x: auto; }
          .site-footer-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
          @media (max-width: 700px) {
            .site-header { padding: 1rem !important; }
            .site-header-inner { align-items: flex-start; flex-direction: column; gap: 1rem; }
            .site-brand { width: 100%; }
            .site-brand h1 { font-size: 1.25rem; }
            .site-nav { display: none; }
            .site-mobile-nav { display: block; width: 100%; }
            .site-mobile-nav summary { cursor: pointer; width: fit-content; padding: .6rem .9rem; border: 1px solid rgba(255,255,255,.65); border-radius: .5rem; font-weight: 600; list-style-position: inside; }
            .site-mobile-nav ul { list-style: none; margin: .75rem 0 0; padding: .25rem 0; display: grid; gap: .25rem; }
            .site-mobile-nav a { display: block; color: #fff; text-decoration: none; padding: .7rem .25rem; min-height: 44px; }
            .site-main { padding: 2rem 1rem; }
            .site-main h2 { font-size: clamp(1.5rem, 7vw, 2.2rem) !important; }
            .site-footer { padding: 1.5rem 1rem !important; }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: settings.font || 'system-ui, sans-serif', backgroundColor: '#fff', color: '#000' }}>
        <header className="site-header" style={{ backgroundColor: primaryColor, color: '#fff', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="site-header-inner">
            <div className="site-brand">
              {settings.logo && <img src={settings.logo} alt={agency.name} />}
              <h1 style={{ fontFamily: settings.font || 'inherit' }}>{siteTitle}</h1>
            </div>
            <nav className="site-nav" aria-label="Main navigation">
              <ul>{publishedPages.map(p => <li key={p.slug}><a href={`#${p.slug}`}>{p.title}</a></li>)}</ul>
            </nav>
            <details className="site-mobile-nav">
              <summary>Menu</summary>
              <nav aria-label="Mobile navigation">
                <ul>{publishedPages.map(p => <li key={p.slug}><a href={`#${p.slug}`}>{p.title}</a></li>)}</ul>
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

          {publishedPages.filter(p => p.pageType !== 'home' && p.id !== homePage?.id).map(page => (
            <section key={page.id} id={page.slug} style={{ marginBottom: '3rem', paddingTop: '2rem', scrollMarginTop: '1rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: settings.font || 'inherit', color: primaryColor }}>{page.title}</h2>
              <div style={{ fontSize: '1.125rem', lineHeight: '1.75' }} dangerouslySetInnerHTML={{ __html: page.content || '' }} />
            </section>
          ))}

          {publishedPages.length === 0 && (
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
      </body>
    </html>
  );
}
