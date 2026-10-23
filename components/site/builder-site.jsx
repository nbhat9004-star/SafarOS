// SafarOS — Data-driven public website renderer for the 7 premium templates (server component).
import EnquiryForm from '@/components/site/enquiry-form';

const money = (n, c = 'INR') => { const v = Number(n); if (!Number.isFinite(v) || v <= 0) return ''; try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: c || 'INR', maximumFractionDigits: 0 }).format(v); } catch { return `${c} ${v}`; } };
const FONT_URL = (b) => `https://fonts.googleapis.com/css2?family=${[b.headingFont, b.bodyFont].filter(Boolean).map((f) => `${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;600;700`).join('&family=')}&display=swap`;

function css(b) {
  const br = b.brand || {}; const r = Number(br.radius ?? 10);
  return `
.bs{--p:${br.primary || '#2563eb'};--s:${br.secondary || '#0f172a'};--a:${br.accent || '#eef2ff'};--bg:${br.bg || '#fff'};--tx:${br.text || '#0f172a'};--r:${Math.min(r, 28)}px;--br:${r}px;--hf:'${br.headingFont || 'Inter'}',Georgia,serif;--bf:'${br.bodyFont || 'Inter'}',system-ui,sans-serif;background:var(--bg);color:var(--tx);font-family:var(--bf);line-height:1.6;min-height:100vh}
.bs *{box-sizing:border-box}.bs img{display:block;max-width:100%}.bs a{color:inherit}
.bs h1,.bs h2,.bs h3{font-family:var(--hf);line-height:1.15;margin:0 0 .6rem}.bs p{margin:0 0 1rem}
.bs .wrap{max-width:1200px;margin:0 auto;padding:0 1.25rem}.bs .sec{padding:4.5rem 0}.bs .sec.compact{padding:2.5rem 0}.bs .sec.spacious{padding:6.5rem 0}
.bs .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.75rem;color:var(--p);font-weight:700}
.bs .sh{margin-bottom:2rem}.bs .sh h2{font-size:clamp(1.7rem,3.2vw,2.6rem)}.bs .sh p{opacity:.75;max-width:640px}.bs .center{text-align:center}.bs .center .sh p{margin-left:auto;margin-right:auto}
.bs .btn{display:inline-flex;align-items:center;gap:.4rem;padding:.8rem 1.4rem;border-radius:var(--br);background:var(--p);color:#fff;text-decoration:none;font-weight:700;border:2px solid var(--p);font-size:.95rem}
.bs .btn.ghost{background:transparent;color:inherit;border-color:currentColor}.bs .btns{display:flex;gap:.75rem;flex-wrap:wrap}
.bs .grid{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}.bs .g2{display:grid;gap:2.5rem;grid-template-columns:1fr 1fr;align-items:center}
.bs .ph{position:relative;overflow:hidden;border-radius:var(--r);background:#ddd}.bs .ph img{width:100%;height:100%;object-fit:cover}
.bs .chip{display:inline-block;font-size:.72rem;font-weight:700;padding:.25rem .6rem;border-radius:999px;background:var(--a);color:var(--s);margin:0 .3rem .3rem 0}
.bs header.hd{z-index:50;background:var(--hbg,#fff);color:var(--htx,var(--tx));border-bottom:1px solid rgba(0,0,0,.06)}.bs header.hd.sticky{position:sticky;top:0}
.bs .hd .in{display:flex;align-items:center;gap:1.5rem;min-height:72px}.bs .brand{display:flex;align-items:center;gap:.7rem;text-decoration:none;font-family:var(--hf);font-weight:700;font-size:1.25rem}.bs .brand img{height:42px;width:auto}
.bs .nav{display:flex;gap:1.4rem;flex-wrap:wrap}.bs .nav a{text-decoration:none;font-weight:600;font-size:.93rem;opacity:.85}.bs .hd .act{margin-left:auto;display:flex;gap:.6rem;align-items:center}
.bs .navc .in{flex-direction:column;gap:.4rem;padding:1rem 0}.bs .navc .act{margin:0}.bs .mnav{display:none;margin-left:auto}.bs .mnav summary{cursor:pointer;font-weight:700;padding:.5rem .9rem;border:1px solid currentColor;border-radius:var(--br);list-style:none}
.bs .mnav nav{position:absolute;left:0;right:0;background:var(--hbg,#fff);padding:1rem 1.25rem;display:grid;gap:.75rem;border-bottom:1px solid rgba(0,0,0,.1)}
.bs .hero{position:relative;color:#fff;display:flex;align-items:center;min-height:78vh}.bs .hero>.bgimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.bs .hero .ov{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.65),rgba(0,0,0,.15))}
.bs .hero .wrap{position:relative;width:100%}.bs .hero h1{font-size:clamp(2.2rem,5.5vw,4.4rem);max-width:820px}.bs .hero p{font-size:1.15rem;max-width:620px;opacity:.92}
.bs .h-editorial{min-height:86vh;text-align:center}.bs .h-editorial .ov{background:rgba(0,0,0,.42)}.bs .h-editorial h1,.bs .h-editorial p{margin-left:auto;margin-right:auto}.bs .h-editorial .btns{justify-content:center}.bs .h-editorial h1{font-weight:400;letter-spacing:.01em}.bs .h-editorial .line{width:70px;height:1px;background:#fff;margin:1.2rem auto}
.bs .h-bold{min-height:92vh}.bs .h-bold h1{text-transform:uppercase;font-size:clamp(2.6rem,7vw,5.6rem);letter-spacing:.02em}.bs .h-bold .ov{background:linear-gradient(100deg,rgba(15,20,16,.85),rgba(15,20,16,.2))}
.bs .stats{display:flex;gap:2rem;flex-wrap:wrap;margin-top:2rem;font-weight:700;text-transform:uppercase;font-size:.8rem;letter-spacing:.12em}
.bs .search{margin-top:2rem;background:#fff;color:var(--tx);border-radius:var(--r);padding:1rem;display:flex;gap:.75rem;flex-wrap:wrap;max-width:760px;box-shadow:0 20px 50px rgba(0,0,0,.25)}.bs .search input,.bs .search select{flex:1;min-width:160px;padding:.8rem;border:1px solid #d6dbe4;border-radius:var(--br);font:inherit}
.bs .h-split,.bs .h-magazine,.bs .h-playful,.bs .h-corporate{color:var(--tx);min-height:auto;padding:4.5rem 0}.bs .h-split .ph{aspect-ratio:4/5;border-radius:220px 220px var(--r) var(--r)}
.bs .h-magazine .col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.bs .h-magazine .col .ph:first-child{grid-row:span 2;aspect-ratio:3/5}.bs .h-magazine .col .ph{aspect-ratio:1}.bs .h-magazine h1{font-style:italic}
.bs .h-playful{background:var(--a)}.bs .h-playful .ph{aspect-ratio:1;border-radius:40% 60% 55% 45%/50% 45% 55% 50%;box-shadow:24px 24px 0 var(--s)}.bs .h-playful h1{color:var(--p)}
.bs .h-corporate{background:var(--s);color:#fff}.bs .h-corporate .ph{aspect-ratio:4/3}.bs .kpi{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:1.5rem}.bs .kpi div{border:1px solid rgba(255,255,255,.2);padding:.8rem;border-radius:var(--br);font-size:.85rem}
.bs .card{background:#fff;border-radius:var(--r);overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.08);text-decoration:none;display:flex;flex-direction:column}.bs .card .ph{border-radius:0;aspect-ratio:4/3}.bs .card .bd{padding:1.1rem 1.2rem 1.3rem;flex:1;display:flex;flex-direction:column}.bs .card h3{font-size:1.2rem}.bs .card .meta{font-size:.85rem;opacity:.7}.bs .card .pr{margin-top:auto;font-weight:800;color:var(--p)}.bs .card .pr small{font-weight:400;opacity:.7;color:var(--tx)}
.bs .c-portrait{position:relative;box-shadow:none;background:none}.bs .c-portrait .ph{aspect-ratio:3/4;border-radius:var(--r)}.bs .c-portrait .bd{position:absolute;inset:auto 0 0 0;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.8));padding:2rem 1.2rem 1.2rem}.bs .c-portrait .pr,.bs .c-portrait .pr small{color:#fff}
.bs .c-rugged{border-radius:0;border-bottom:4px solid var(--p)}.bs .c-rugged h3{text-transform:uppercase}.bs .c-soft{border-radius:28px}.bs .c-soft .ph{margin:.6rem;border-radius:22px}
.bs .c-list{flex-direction:row;box-shadow:none;border-bottom:1px solid rgba(0,0,0,.12);border-radius:0;background:none}.bs .c-list .ph{width:42%;aspect-ratio:1;border-radius:var(--r)}.bs .lst{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fill,minmax(440px,1fr))}
.bs .c-playful{border:3px solid var(--a);border-radius:26px}.bs .c-playful .ph{border-radius:22px 22px 0 0}.bs .c-corporate{box-shadow:none;border:1px solid #e2e8f0;border-radius:var(--br)}.bs .c-corporate .ph{aspect-ratio:16/9}
.bs .tile{position:relative;display:block;text-decoration:none;color:#fff}.bs .tile .ph{aspect-ratio:4/5}.bs .tile span{position:absolute;left:1rem;bottom:1rem;right:1rem;font-family:var(--hf);font-size:1.35rem;font-weight:700;text-shadow:0 2px 12px rgba(0,0,0,.6)}.bs .tile small{display:block;font-family:var(--bf);font-size:.8rem;font-weight:400}
.bs .why{counter-reset:w}.bs .why .it{padding:1.4rem;border-radius:var(--r);background:var(--sbg,var(--a))}.bs .why .it b{font-family:var(--hf);font-size:1.1rem;display:block;margin-bottom:.35rem}.bs .why .it:before{counter-increment:w;content:'0' counter(w);font-weight:800;color:var(--p);display:block;margin-bottom:.4rem}
.bs .quote{padding:1.6rem;border-radius:var(--r);background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.06)}.bs .quote p{font-family:var(--hf);font-size:1.1rem;font-style:italic}
.bs .gal{display:grid;gap:.75rem;grid-template-columns:repeat(3,1fr)}.bs .gal .ph{aspect-ratio:1}.bs .gal .ph:nth-child(1){grid-column:span 2;grid-row:span 2;aspect-ratio:auto}
.bs details.faq{border-bottom:1px solid rgba(0,0,0,.12);padding:1rem 0}.bs details.faq summary{cursor:pointer;font-weight:700;font-size:1.05rem}
.bs .form{display:grid;gap:.75rem}.bs .form input,.bs .form textarea{padding:.85rem;border:1px solid #cfd6e1;border-radius:var(--br);font:inherit;width:100%;background:#fff}
.bs footer.ft{background:var(--s);color:rgba(255,255,255,.85);padding:3.5rem 0 2rem;margin-top:2rem}.bs .ft .cols{display:grid;gap:2rem;grid-template-columns:2fr repeat(auto-fit,minmax(150px,1fr))}.bs .ft a{text-decoration:none;opacity:.85;display:block;margin:.3rem 0}.bs .ft h4{color:#fff;margin:0 0 .6rem;font-family:var(--hf)}
.bs .crumbs{font-size:.85rem;opacity:.7;padding:1rem 0}.bs .crumbs a{text-decoration:none}.bs .facts{display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0}.bs .note{font-size:.8rem;opacity:.65}
.bs .empty{text-align:center;padding:3rem;border:2px dashed rgba(0,0,0,.15);border-radius:var(--r)}
@media(max-width:860px){.bs .g2{grid-template-columns:1fr}.bs .nav,.bs .hd .act .hide-m{display:none}.bs .mnav{display:block}.bs .navc .in{flex-direction:row}.bs .lst{grid-template-columns:1fr}.bs .c-list{flex-direction:column}.bs .c-list .ph{width:100%}.bs .gal{grid-template-columns:1fr 1fr}.bs .ft .cols{grid-template-columns:1fr}.bs .hero{min-height:70vh}.bs .sec{padding:3rem 0}}
`;
}

export function siteLink(slug, href) {
  const h = String(href || '');
  if (!h || h === '/') return `/site/${slug}`;
  if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
  if (h.startsWith('#')) return h;
  if (h.startsWith('/site/')) return h;
  return `/site/${slug}${h.startsWith('/') ? h : `/${h}`}`;
}
const Ph = ({ src, alt, className = '' }) => (src ? <div className={`ph ${className}`}><img src={src} alt={alt || ''} loading="lazy" /></div> : null);
const secStyle = (s) => ({ background: s.bg || undefined, color: s.textColor || undefined, textAlign: s.align === 'center' ? 'center' : undefined });
const secCls = (s) => `sec ${s.padding === 'compact' ? 'compact' : s.padding === 'spacious' ? 'spacious' : ''}`;
const Head = ({ s }) => (s.heading || s.subheading ? <div className="sh">{s.heading && <h2>{s.heading}</h2>}{s.subheading && <p>{s.subheading}</p>}</div> : null);

function TourCard({ t, L, v }) {
  const price = money(t.price, t.currency);
  return (<a className={`card c-${v}`} href={L(`/tours/${t.slug}`)}>
    <Ph src={t.image} alt={t.imageAlt || t.name} />
    <div className="bd">
      {v !== 'portrait' && <div>{t.tag && <span className="chip">{t.tag}</span>}{t.category && <span className="chip">{t.category}</span>}</div>}
      <h3>{t.name}</h3>
      <div className="meta">{[t.destination, t.duration, v === 'rugged' || v === 'corporate' || v === 'playful' ? t.groupSize : ''].filter(Boolean).join(' · ')}</div>
      {v !== 'portrait' && v !== 'corporate' && t.summary && <p style={{ fontSize: '.92rem', opacity: 0.8, margin: '.5rem 0 .8rem' }}>{t.summary}</p>}
      {price && <div className="pr">from {price} <small>per person · illustrative</small></div>}
    </div>
  </a>);
}
const DestTile = ({ d, L }) => (<a className="tile" href={L(`/destinations/${d.slug}`)}><Ph src={d.image} alt={d.imageAlt || d.name} /><span>{d.name}<small>{d.region}</small></span></a>);

function Hero({ s, b, L, slug }) {
  const v = (b.layout && b.layout.hero) || 'editorial';
  const btns = (<div className="btns">{s.buttonLabel && <a className="btn" href={L(s.buttonHref)}>{s.buttonLabel}</a>}{s.secondaryLabel && <a className="btn ghost" href={L(s.secondaryHref)}>{s.secondaryLabel}</a>}</div>);
  const text = (<div>{v !== 'editorial' && <div className="eyebrow" style={{ color: v === 'bold' || v === 'search' || v === 'corporate' ? '#fff' : undefined }}>{b.header?.businessName}</div>}<h1>{s.heading}</h1>{v === 'editorial' && <div className="line" />}<p>{s.subheading}</p>{btns}</div>);
  if (['split', 'magazine', 'playful', 'corporate'].includes(v)) {
    const imgs = v === 'magazine' ? <div className="col"><Ph src={s.image} alt={s.imageAlt} />{(b.tours || []).slice(0, 2).map((t) => <Ph key={t.id} src={t.image} alt={t.imageAlt} />)}</div> : <Ph src={s.image} alt={s.imageAlt} />;
    return (<section className={`hero h-${v}`} style={{ background: s.bg || undefined }}><div className="wrap g2">{text}{imgs}</div>
      {v === 'corporate' && null}</section>);
  }
  return (<section className={`hero h-${v}`}>{s.image && <img className="bgimg" src={s.image} alt={s.imageAlt || ''} />}<div className="ov" /><div className="wrap">{text}
    {v === 'bold' && <div className="stats"><span>Certified leaders</span><span>Small groups</span><span>Honest difficulty ratings</span></div>}
    {v === 'search' && <form className="search" action={`/site/${slug}/tours`} method="get"><input name="q" placeholder="Where do you want to go?" aria-label="Search packages" /><select name="category" aria-label="Category" defaultValue=""><option value="">All categories</option>{[...new Set((b.tours || []).map((t) => t.category).filter(Boolean))].map((c) => <option key={c} value={c}>{c}</option>)}</select><button className="btn" type="submit">Search</button></form>}
  </div></section>);
}

function Section({ s, b, L, slug }) {
  if (!s || s.hidden) return null;
  const v = (b.layout && b.layout.card) || 'classic';
  const items = Array.isArray(s.items) ? s.items : [];
  const more = s.buttonLabel && s.buttonHref ? <div style={{ marginTop: '2rem' }}><a className="btn ghost" href={L(s.buttonHref)}>{s.buttonLabel}</a></div> : null;
  const W = ({ children, center }) => <section className={secCls(s)} style={secStyle(s)}><div className={`wrap ${center || s.align === 'center' ? 'center' : ''}`}>{children}</div></section>;
  switch (s.type) {
    case 'hero': return <Hero s={s} b={b} L={L} slug={slug} />;
    case 'tours': { const ts = (b.tours || []).slice(0, Number(s.limit) || 6); return <W><Head s={s} />{ts.length ? <div className={v === 'list' ? 'lst' : 'grid'}>{ts.map((t) => <TourCard key={t.id} t={t} L={L} v={v} />)}</div> : <div className="empty">New packages are coming soon.</div>}{more}</W>; }
    case 'destinations': { const ds = (b.destinations || []).slice(0, Number(s.limit) || 6); return <W><Head s={s} /><div className="grid">{ds.map((d) => <DestTile key={d.id} d={d} L={L} />)}</div>{more}</W>; }
    case 'categories': return <W><Head s={s} /><div className="grid">{items.map((c, i) => <a key={i} className="tile" href={L(c.href || '/tours')}><Ph src={c.image} alt={c.imageAlt || c.title} /><span>{c.title}</span></a>)}</div></W>;
    case 'offers': return <W><Head s={s} /><div className="grid">{items.map((o, i) => <a key={i} className={`card c-${v === 'portrait' ? 'classic' : v}`} href={L(o.href || '/contact')}><Ph src={o.image} alt={o.imageAlt || o.title} /><div className="bd">{o.label && <div><span className="chip">{o.label}</span></div>}<h3>{o.title}</h3><p style={{ opacity: 0.8 }}>{o.text}</p></div></a>)}</div></W>;
    case 'why': return <W><Head s={s} /><div className="grid why" style={{ '--sbg': b.brand?.sectionBg }}>{items.map((w, i) => <div key={i} className="it"><b>{w.title}</b><span style={{ opacity: 0.8 }}>{w.text}</span></div>)}</div></W>;
    case 'about': return <W><div className="g2"><div><div className="eyebrow">About us</div><h2 style={{ fontSize: 'clamp(1.7rem,3.2vw,2.6rem)' }}>{s.heading}</h2><p style={{ fontSize: '1.08rem', opacity: 0.85, whiteSpace: 'pre-line' }}>{s.text}</p>{s.buttonLabel && <a className="btn ghost" href={L(s.buttonHref)}>{s.buttonLabel}</a>}</div><Ph src={s.image} alt={s.imageAlt} className="about-ph" /></div></W>;
    case 'testimonials': return <W><Head s={s} /><div className="grid">{items.map((q, i) => <figure key={i} className="quote" style={{ margin: 0 }}><p>“{q.quote}”</p><figcaption><b>{q.author}</b>{q.trip && <span className="note"> · {q.trip}</span>}</figcaption></figure>)}</div></W>;
    case 'gallery': return <W><Head s={s} /><div className="gal">{items.map((g, i) => <Ph key={i} src={g.image} alt={g.imageAlt} />)}</div></W>;
    case 'faqs': return <W><Head s={s} /><div style={{ maxWidth: 820, margin: s.align === 'center' ? '0 auto' : undefined, textAlign: 'left' }}>{items.map((f, i) => <details key={i} className="faq"><summary>{f.q}</summary><p style={{ marginTop: '.6rem', opacity: 0.85 }}>{f.a}</p></details>)}</div></W>;
    case 'cta': return <W center><h2>{s.heading}</h2>{s.text && <p>{s.text}</p>}{s.buttonLabel && <a className="btn" href={L(s.buttonHref)}>{s.buttonLabel}</a>}</W>;
    case 'contact': { const c = b.contact || {}; return <W><div className="g2" style={{ alignItems: 'start' }}><div><h2 style={{ fontSize: 'clamp(1.7rem,3.2vw,2.6rem)' }}>{s.heading}</h2><p style={{ opacity: 0.85 }}>{s.text}</p>
      {c.phone && <p><b>Phone:</b> <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></p>}{c.email && <p><b>Email:</b> <a href={`mailto:${c.email}`}>{c.email}</a></p>}{c.address && <p><b>Address:</b> {c.address}</p>}{c.hours && <p><b>Hours:</b> {c.hours}</p>}{c.mapUrl && <p><a className="btn ghost" href={c.mapUrl} target="_blank" rel="noopener noreferrer">Open map</a></p>}</div>
      <EnquiryForm slug={slug} buttonLabel={s.buttonLabel || 'Send enquiry'} /></div></W>; }
    default: return null;
  }
}

function Header({ b, L }) {
  const h = b.header || {}; const c = b.contact || {}; const center = b.layout?.nav === 'center';
  const wa = (c.whatsapp || '').replace(/[^0-9]/g, '');
  const nav = (h.nav || []).filter((n) => n && n.label);
  return (<header className={`hd ${h.sticky !== false ? 'sticky' : ''} ${center ? 'navc' : ''}`} style={{ '--hbg': h.bg || '#fff', '--htx': h.textColor || undefined }}>
    <div className="wrap in"><a className="brand" href={L('/')}>{h.logo && <img src={h.logo} alt={h.businessName || 'Logo'} />}<span>{h.businessName}</span></a>
      <nav className="nav" aria-label="Main">{nav.map((n, i) => <a key={i} href={L(n.href)}>{n.label}</a>)}</nav>
      <div className="act">{h.showPhone !== false && c.phone && <a className="hide-m" href={`tel:${c.phone.replace(/\s/g, '')}`} style={{ textDecoration: 'none', fontWeight: 700 }}>{c.phone}</a>}
        {h.showWhatsapp !== false && wa && <a className="btn ghost hide-m" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        {h.ctaLabel && <a className="btn hide-m" href={L(h.ctaHref || '/contact')}>{h.ctaLabel}</a>}</div>
      <details className="mnav"><summary>{h.mobileMenuLabel || 'Menu'}</summary><nav aria-label="Mobile">{nav.map((n, i) => <a key={i} href={L(n.href)}>{n.label}</a>)}{h.ctaLabel && <a className="btn" href={L(h.ctaHref || '/contact')}>{h.ctaLabel}</a>}{wa && <a href={`https://wa.me/${wa}`}>WhatsApp</a>}</nav></details>
    </div></header>);
}

function Footer({ b, L }) {
  const f = b.footer || {}; const c = b.contact || {}; const so = Object.entries(b.social || {}).filter(([, u]) => u);
  return (<footer className="ft"><div className="wrap"><div className="cols">
    <div>{f.logo ? <img src={f.logo} alt={b.header?.businessName || ''} style={{ height: 44, marginBottom: '.8rem' }} /> : <h4 style={{ fontSize: '1.3rem' }}>{b.header?.businessName}</h4>}<p>{f.description}</p>
      {c.phone && <div>{c.phone}</div>}{c.email && <div>{c.email}</div>}{c.address && <div>{c.address}</div>}{c.hours && <div>{c.hours}</div>}</div>
    {(f.columns || []).map((col, i) => <div key={i}><h4>{col.title}</h4>{(col.links || []).filter((l) => l.label).map((l, j) => <a key={j} href={L(l.href)}>{l.label}</a>)}</div>)}
    {so.length > 0 && <div><h4>Follow us</h4>{so.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer" style={{ textTransform: 'capitalize' }}>{k === 'x' ? 'X (Twitter)' : k}</a>)}</div>}
  </div>
    <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', marginTop: '2rem', paddingTop: '1.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '.85rem' }}>
      <span>{String(f.copyright || `© {year} ${b.header?.businessName || ''}`).replace('{year}', String(new Date().getFullYear()))}</span>
      {f.privacyHref && <a href={L(f.privacyHref)} style={{ display: 'inline' }}>Privacy policy</a>}{f.termsHref && <a href={L(f.termsHref)} style={{ display: 'inline' }}>Terms</a>}
      {b.demo && f.demoNotice && <span className="note" style={{ marginLeft: 'auto' }}>{f.demoNotice}</span>}
    </div></div></footer>);
}

const Crumbs = ({ items, L }) => <div className="wrap crumbs">{items.map((it, i) => <span key={i}>{i > 0 && ' / '}{it.href ? <a href={L(it.href)}>{it.label}</a> : it.label}</span>)}</div>;
const ld = (obj) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, '\\u003c') }} />;

// Resolve a route ([] = home) to page content; returns null for unknown routes (→ 404).
export function resolveRoute(b, path, q = {}) {
  const [a, s2] = path;
  if (!a) return { kind: 'home' };
  if (a === 'tours' && !s2) return { kind: 'tours' };
  if (a === 'tours' && s2) { const t = (b.tours || []).find((x) => x.slug === s2); return t ? { kind: 'tour', t } : null; }
  if (a === 'destinations' && !s2) return { kind: 'destinations' };
  if (a === 'destinations' && s2) { const d = (b.destinations || []).find((x) => x.slug === s2); return d ? { kind: 'destination', d } : null; }
  if (['about', 'contact', 'faqs'].includes(a) && !s2) return { kind: a };
  return null;
}

export default function BuilderSite({ data, path = [], searchParams = {} }) {
  const b = data.builder; const slug = data.agency.slug; const L = (h) => siteLink(slug, h);
  const route = resolveRoute(b, path, searchParams);
  if (!route) return null;
  const secs = (b.sections || []).filter((s) => !s.hidden);
  const byType = (type) => secs.find((s) => s.type === type) || (b.sections || []).find((s) => s.type === type);
  const v = b.layout?.card || 'classic'; const site = `/site/${slug}`;
  let body;
  if (route.kind === 'home') body = <>{secs.map((s) => <Section key={s.id} s={s} b={b} L={L} slug={slug} />)}{ld({ '@context': 'https://schema.org', '@type': 'TravelAgency', name: b.header?.businessName, description: b.header?.tagline, telephone: b.contact?.phone || undefined, email: b.contact?.email || undefined, sameAs: Object.values(b.social || {}).filter(Boolean) })}</>;
  else if (route.kind === 'tours') {
    const q = String(searchParams.q || '').toLowerCase(); const cat = String(searchParams.category || '');
    const list = (b.tours || []).filter((t) => (!cat || t.category === cat) && (!q || `${t.name} ${t.destination} ${t.summary}`.toLowerCase().includes(q)));
    const cats = [...new Set((b.tours || []).map((t) => t.category).filter(Boolean))];
    body = <><Crumbs L={L} items={[{ label: 'Home', href: '/' }, { label: 'Packages' }]} /><section className="sec" style={{ paddingTop: '1rem' }}><div className="wrap"><div className="sh"><h2>All packages</h2><p>Illustrative starting prices per person. Final pricing is confirmed in your quotation.</p></div>
      <div style={{ marginBottom: '1.5rem' }}><a className="chip" href={L('/tours')}>All</a>{cats.map((c) => <a key={c} className="chip" href={L(`/tours?category=${encodeURIComponent(c)}`)} style={c === cat ? { background: 'var(--p)', color: '#fff' } : undefined}>{c}</a>)}</div>
      {list.length ? <div className={v === 'list' ? 'lst' : 'grid'}>{list.map((t) => <TourCard key={t.id} t={t} L={L} v={v} />)}</div> : <div className="empty"><h3>No packages found</h3><p>Try another category or contact us for a tailored trip.</p><a className="btn" href={L('/contact')}>Contact us</a></div>}</div></section></>;
  } else if (route.kind === 'tour') {
    const t = route.t; const price = money(t.price, t.currency);
    body = <><Crumbs L={L} items={[{ label: 'Home', href: '/' }, { label: 'Packages', href: '/tours' }, { label: t.name }]} />
      <section className="sec" style={{ paddingTop: '.5rem' }}><div className="wrap"><div className="g2" style={{ alignItems: 'start' }}><div><Ph src={t.image} alt={t.imageAlt || t.name} className="tour-main" />
        <div className="gal" style={{ marginTop: '.75rem', gridTemplateColumns: 'repeat(3,1fr)' }}>{(t.gallery || []).map((g, i) => <Ph key={i} src={g} alt={`${t.name} photo ${i + 1}`} />)}</div></div>
        <div><div>{t.tag && <span className="chip">{t.tag}</span>}{t.category && <span className="chip">{t.category}</span>}</div><h1 style={{ fontSize: 'clamp(1.9rem,4vw,3rem)' }}>{t.name}</h1>
          <div className="facts">{[t.destination, t.duration, t.difficulty && `Difficulty: ${t.difficulty}`, t.groupSize && `Group: ${t.groupSize}`].filter(Boolean).map((x) => <span key={x} className="chip">{x}</span>)}</div>
          {price && <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--p)' }}>from {price} <span className="note">per person · illustrative demo price</span></p>}
          <p style={{ whiteSpace: 'pre-line' }}>{t.description}</p><a className="btn" href="#enquire">Enquire about this trip</a></div></div>
        {(t.itinerary || []).length > 0 && <div style={{ marginTop: '3rem' }}><h2>Itinerary <span className="note">(illustrative)</span></h2>{t.itinerary.map((d, i) => <details key={i} className="faq" open={i === 0}><summary>Day {d.day || i + 1}: {d.title}</summary><p style={{ marginTop: '.5rem' }}>{d.text}</p></details>)}</div>}
        <div className="g2" style={{ marginTop: '2.5rem', alignItems: 'start' }}><div><h3>Inclusions</h3><ul>{(t.inclusions || []).map((x, i) => <li key={i}>{x}</li>)}</ul></div><div><h3>Exclusions</h3><ul>{(t.exclusions || []).map((x, i) => <li key={i}>{x}</li>)}</ul></div></div>
        <div id="enquire" style={{ marginTop: '2.5rem', maxWidth: 640 }}><h2>Enquire about {t.name}</h2><EnquiryForm slug={slug} tourName={t.name} buttonLabel="Send enquiry" /></div></div></section>
      {ld({ '@context': 'https://schema.org', '@type': 'TouristTrip', name: t.name, description: t.summary, image: t.image, touristType: t.category, itinerary: { '@type': 'ItemList', itemListElement: (t.itinerary || []).map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.title })) } })}
      {ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', site], ['Packages', `${site}/tours`], [t.name, `${site}/tours/${t.slug}`]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) })}</>;
  } else if (route.kind === 'destinations') body = <><Crumbs L={L} items={[{ label: 'Home', href: '/' }, { label: 'Destinations' }]} /><section className="sec" style={{ paddingTop: '1rem' }}><div className="wrap"><div className="sh"><h2>Destinations</h2></div><div className="grid">{(b.destinations || []).map((d) => <DestTile key={d.id} d={d} L={L} />)}</div></div></section></>;
  else if (route.kind === 'destination') {
    const d = route.d; const rel = (b.tours || []).filter((t) => String(t.destination).toLowerCase() === String(d.name).toLowerCase());
    body = <><Crumbs L={L} items={[{ label: 'Home', href: '/' }, { label: 'Destinations', href: '/destinations' }, { label: d.name }]} /><section className="sec" style={{ paddingTop: '.5rem' }}><div className="wrap"><div className="g2"><div><div className="eyebrow">{d.region}</div><h1 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)' }}>{d.name}</h1><p style={{ whiteSpace: 'pre-line' }}>{d.description}</p><a className="btn" href={L('/contact')}>Plan a trip to {d.name}</a></div><Ph src={d.image} alt={d.imageAlt || d.name} /></div>
      <div style={{ marginTop: '3rem' }}><h2>Packages in {d.name}</h2>{rel.length ? <div className={v === 'list' ? 'lst' : 'grid'}>{rel.map((t) => <TourCard key={t.id} t={t} L={L} v={v} />)}</div> : <div className="empty">Ask us for a tailored {d.name} itinerary.</div>}</div></div></section></>;
  } else {
    const map = { about: ['about', 'why', 'testimonials'], contact: ['contact'], faqs: ['faqs', 'contact'] }[route.kind];
    const label = { about: 'About', contact: 'Contact', faqs: 'FAQs' }[route.kind];
    body = <><Crumbs L={L} items={[{ label: 'Home', href: '/' }, { label }]} />{map.map((ty) => { const s = byType(ty); return s ? <Section key={ty} s={{ ...s, hidden: false }} b={b} L={L} slug={slug} /> : null; })}</>;
  }
  return (<div className={`bs tpl-${b.template}`}><link rel="stylesheet" href={FONT_URL(b.brand || {})} precedence="default" /><style>{css(b)}</style>
    <Header b={b} L={L} /><main>{body}</main><Footer b={b} L={L} /></div>);
}

export function builderMetadata(data, path = []) {
  const b = data.builder; const seo = data.settings?.seo || {}; const route = resolveRoute(b, path);
  const siteName = data.settings?.siteTitle || b.header?.businessName || data.agency.name;
  const base = { title: seo.metaTitle || siteName, description: seo.metaDescription || b.header?.tagline, robots: seo.robots === 'noindex' ? 'noindex, nofollow' : 'index, follow', openGraph: { title: seo.ogTitle || seo.metaTitle || siteName, description: seo.ogDescription || seo.metaDescription || b.header?.tagline, images: seo.ogImage ? [seo.ogImage] : (b.sections || []).find((s) => s.type === 'hero')?.image ? [(b.sections || []).find((s) => s.type === 'hero').image] : undefined, type: 'website' }, alternates: seo.canonicalUrl && !path.length ? { canonical: seo.canonicalUrl } : undefined, icons: b.brand?.favicon || data.settings?.favicon ? { icon: b.brand?.favicon || data.settings.favicon } : undefined };
  if (!route) return { title: 'Page not found' };
  if (route.kind === 'tour') { const t = route.t; return { ...base, title: t.seoTitle || `${t.name} | ${siteName}`, description: t.seoDescription || t.summary, robots: t.noindex ? 'noindex' : base.robots, openGraph: { ...base.openGraph, title: t.seoTitle || t.name, description: t.seoDescription || t.summary, images: t.image ? [t.image] : base.openGraph.images } }; }
  if (route.kind === 'destination') { const d = route.d; return { ...base, title: `${d.name} | ${siteName}`, description: d.description, openGraph: { ...base.openGraph, title: d.name, images: d.image ? [d.image] : base.openGraph.images } }; }
  if (route.kind !== 'home') return { ...base, title: `${{ tours: 'Packages', destinations: 'Destinations', about: 'About', contact: 'Contact', faqs: 'FAQs' }[route.kind]} | ${siteName}` };
  return base;
}
