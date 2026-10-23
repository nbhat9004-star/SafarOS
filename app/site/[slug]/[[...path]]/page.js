import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import BuilderSite, { builderMetadata } from '@/components/site/builder-site';
import { publicBuilder } from '@/lib/website-builder';

async function getWebsiteData(slug) {
  try {
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

    // If builder document exists, use premium builder renderer
    if (settingsDoc.builder && settingsDoc.builder.sections) {
      const publicData = publicBuilder(settingsDoc.builder);
      if (publicData) {
        return {
          published: true,
          agency: { name: agency.name, slug: agency.slug, id: agency.id },
          settings: {
            siteTitle: settingsDoc.siteTitle,
            tagline: settingsDoc.tagline,
            logo: settingsDoc.logo,
            favicon: settingsDoc.favicon,
            contactEmail: settingsDoc.contactEmail,
            phone: settingsDoc.phone,
            address: settingsDoc.address,
            social: settingsDoc.social,
            seo: settingsDoc.seo,
          },
          builder: publicData,
          useBuilder: true,
        };
      }
    }

    // Fallback to legacy page-based rendering
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
      useBuilder: false,
    };
  } catch (error) {
    console.error('[public agency website] Failed to load site:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug, path: catchAll } = await params;
  const data = await getWebsiteData(slug);
  
  if (!data?.published) return { title: 'Website unavailable | SafarOS' };
  
  // Use premium builder metadata if available
  if (data.useBuilder) {
    const pathSegments = catchAll ? (Array.isArray(catchAll) ? catchAll : [catchAll]) : [];
    const path = pathSegments.filter(Boolean);
    return builderMetadata(data, path);
  }
  
  // Legacy metadata
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

export default async function PublicSitePage({ params, searchParams }) {
  const { slug, path: catchAll } = await params;
  const data = await getWebsiteData(slug);
  
  if (!data || !data.published) notFound();

  // Premium builder rendering
  if (data.useBuilder) {
    // Parse the route: /site/:slug/tours/:tourSlug or /site/:slug/destinations/:destSlug
    const pathSegments = catchAll ? (Array.isArray(catchAll) ? catchAll : [catchAll]) : [];
    const path = pathSegments.filter(Boolean);
    return <BuilderSite data={data} path={path} searchParams={searchParams || {}} />;
  }

  // Legacy page-based rendering
  const settings = data.settings || {};
  const pages = Array.isArray(data.pages) ? data.pages : [];
  const agency = data.agency || { name: settings.siteTitle || 'Travel Agency' };
  const homePage = pages.find(p => p.pageType === 'home') || pages[0];
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(settings.primaryColor || '') ? settings.primaryColor : '#6366f1';
  const themeKey = ['luxe-voyage','wildtrail','atlas-journeys','coastline','roots-routes','happy-trails','meridian'].includes(settings.theme) ? settings.theme : 'atlas-journeys';
  const siteTitle = settings.siteTitle || agency.name;

  return (
    <div className={`safar-public-site theme-${themeKey}`} style={{ minHeight: '100vh', margin: 0, fontFamily: settings.font || 'system-ui, sans-serif', backgroundColor: '#fff', color: '#000', overflowWrap: 'anywhere' }}>
      <style>{`
        .safar-public-site, .safar-public-site * { box-sizing: border-box; }
        .safar-public-site { scroll-behavior: smooth; }
        .safar-public-site .site-header-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; }
        .safar-public-site header { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.08); background: #fff; }
        .safar-public-site .site-logo { font-size: 1.4rem; font-weight: 700; color: ${primaryColor}; text-decoration: none; }
        .safar-public-site nav a { margin: 0 0.9rem; text-decoration: none; color: inherit; font-weight: 500; }
        .safar-public-site main { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
        .safar-public-site section { margin-bottom: 3rem; }
        .safar-public-site h1 { font-size: clamp(1.8rem, 4vw, 3rem); margin: 0 0 1rem; }
        .safar-public-site h2 { font-size: clamp(1.4rem, 3vw, 2.2rem); margin: 0 0 0.8rem; }
        .safar-public-site h3 { font-size: 1.3rem; margin: 0 0 0.5rem; }
        .safar-public-site p { line-height: 1.7; margin: 0 0 1rem; }
        .safar-public-site footer { background: #1e293b; color: rgba(255,255,255,0.85); padding: 2rem 1.5rem 1rem; margin-top: 4rem; text-align: center; }
      `}</style>
      
      <header>
        <div className="site-header-inner">
          <a href={`/site/${slug}`} className="site-logo">{siteTitle}</a>
          <nav>
            {pages.slice(0, 5).map(p => (
              <a key={p.id} href={`/site/${slug}/${p.slug}`}>{p.title}</a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {homePage ? (
          <div dangerouslySetInnerHTML={{ __html: homePage.content }} />
        ) : (
          <section>
            <h1>Welcome to {siteTitle}</h1>
            <p>{settings.tagline || 'Discover your next adventure with us.'}</p>
          </section>
        )}
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.</p>
        {settings.contactEmail && <p>Email: {settings.contactEmail}</p>}
      </footer>
    </div>
  );
}
