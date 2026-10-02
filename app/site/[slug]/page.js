import { notFound } from 'next/navigation';

async function getWebsiteData(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/public/site/${slug}`, {
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

  if (!data || !data.published) {
    notFound();
  }

  const { settings, pages, agency } = data;
  const homePage = pages.find(p => p.pageType === 'home') || pages[0];

  return (
    <html lang="en">
      <head>
        <title>{settings.seo?.metaTitle || settings.siteTitle || agency.name}</title>
        {settings.seo?.metaDescription && (
          <meta name="description" content={settings.seo.metaDescription} />
        )}
        {settings.seo?.keywords && (
          <meta name="keywords" content={settings.seo.keywords} />
        )}
        {settings.seo?.robots && (
          <meta name="robots" content={settings.seo.robots} />
        )}
        {settings.seo?.ogTitle && (
          <meta property="og:title" content={settings.seo.ogTitle} />
        )}
        {settings.seo?.ogDescription && (
          <meta property="og:description" content={settings.seo.ogDescription} />
        )}
        {settings.seo?.ogImage && (
          <meta property="og:image" content={settings.seo.ogImage} />
        )}
      </head>
      <body style={{
        margin: 0,
        fontFamily: settings.font || 'system-ui, sans-serif',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: settings.primaryColor || '#6366f1',
          color: '#ffffff',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {settings.logo && (
                <img src={settings.logo} alt={agency.name} style={{ height: '40px' }} />
              )}
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontFamily: settings.font || 'inherit' }}>
                {settings.siteTitle || agency.name}
              </h1>
            </div>
            <nav>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '1.5rem' }}>
                {pages.filter(p => p.status === 'published').map(p => (
                  <li key={p.id}>
                    <a href={`#${p.slug}`} style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500' }}>
                      {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
          {homePage ? (
            <section id={homePage.slug} style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: settings.font || 'inherit', color: settings.primaryColor || '#6366f1' }}>
                {homePage.title}
              </h2>
              <div style={{ fontSize: '1.125rem', lineHeight: '1.75' }} dangerouslySetInnerHTML={{ __html: homePage.content || '' }} />
            </section>
          ) : null}

          {pages.filter(p => p.status === 'published' && p.pageType !== 'home').map(page => (
            <section key={page.id} id={page.slug} style={{ marginBottom: '3rem', paddingTop: '2rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: settings.font || 'inherit', color: settings.primaryColor || '#6366f1' }}>
                {page.title}
              </h2>
              <div style={{ fontSize: '1.125rem', lineHeight: '1.75' }} dangerouslySetInnerHTML={{ __html: page.content || '' }} />
            </section>
          ))}

          {pages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
              <h2>Welcome to {agency.name}</h2>
              <p>{settings.tagline || 'Website coming soon.'}</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          backgroundColor: '#f3f4f6',
          padding: '2rem',
          marginTop: '4rem',
          borderTop: '1px solid #e5e7eb',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
              {settings.tagline}
            </p>
            {settings.social && Object.keys(settings.social).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {Object.entries(settings.social).map(([platform, url]) => url ? (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{ color: settings.primaryColor || '#6366f1', textTransform: 'capitalize' }}>
                    {platform}
                  </a>
                ) : null)}
              </div>
            )}
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>
              © {new Date().getFullYear()} {agency.name}. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
