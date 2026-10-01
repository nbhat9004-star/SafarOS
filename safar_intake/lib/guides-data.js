// Safar Travel Guides — SEO content for /guides/[slug] pages.
// Each guide reuses existing Safar listings (from /app/lib/data.js) via listingIds,
// and links into /explore filters or /property/{id} pages. No DB, no API.
//
// Listings reference (l1..l12):
//   l1  Royal Cedar Houseboat — Dal Lake (houseboat, ₹6800)
//   l2  Pinepeak Snow Cabin — Gulmarg (cabin, ₹9200)
//   l3  Apple Orchard Cottage — Pahalgam (cottage, ₹4500)
//   l4  Glacier Camp — Sonamarg (camp, ₹3200)
//   l5  Heritage Kashmiri Home — Old Srinagar (home, ₹3800)
//   l6  Floating Royal Suite — Nigeen Lake (houseboat, ₹8400)
//   l11 Gulmarg Gondola + Local Guide (tour)
//   l12 Pahalgam Valley Day Tour (tour)

export const GUIDES = {
  'best-houseboats-srinagar': {
    slug: 'best-houseboats-srinagar',
    title: 'Best Houseboats in Srinagar (2026) — Top Picks on Dal & Nigeen Lake | Safar',
    description:
      'Discover the best houseboats in Srinagar for 2026. Hand-picked stays on Dal Lake & Nigeen Lake with wood-carved interiors, lake-view decks, Wazwan dinners and verified local hosts. Compare and book on Safar.',
    keywords: ['best houseboats Srinagar','Dal Lake houseboats','Nigeen Lake houseboats','Kashmir houseboat booking','Srinagar boat stay'],
    h1: 'The Best Houseboats in Srinagar',
    eyebrow: 'Srinagar · Houseboats',
    heroImageKey: 'hb1',
    intro:
      'Floating on Dal and Nigeen lakes, Srinagar’s houseboats are a 150-year-old tradition — cedar-wood living rooms, hand-carved ceilings, and morning kahwa served on the deck as kingfishers skim the water. We’ve curated the best heritage and luxury houseboats in Srinagar, all run by Kashmiri families who’ve hosted travelers for generations.',
    tips: [
      'Nigeen Lake is quieter and cleaner than central Dal — best for couples and slow stays.',
      'Ask the host to confirm the houseboat is moored, not anchored mid-lake — it makes shikara transfers easier.',
      'Wazwan dinners must be booked at least 4 hours in advance — most hosts on Safar include this option.',
      'April–October is peak; book 4–6 weeks ahead. Winter (Dec–Feb) stays come with bukhari heaters and lower rates.',
      'Verify the houseboat has hot water and a private bathroom — budget boats sometimes share facilities.',
    ],
    faqs: [
      { q: 'Which lake is best for houseboats — Dal or Nigeen?', a: 'Dal Lake offers the iconic Srinagar skyline and easy access to floating markets and Boulevard cafes. Nigeen Lake is calmer, cleaner and ideal for honeymoon or wellness stays. Both are 15–20 minutes from Srinagar airport.' },
      { q: 'How much does a good houseboat in Srinagar cost?', a: 'Heritage Deluxe houseboats on Safar range from ₹3,800 to ₹6,800 per night, while luxury suites with butler service start from ₹8,400. All include breakfast and shikara transfers.' },
      { q: 'Are houseboats safe for solo travelers and families?', a: 'Yes — all Safar houseboats have verified hosts, secure locking, life jackets onboard and 24/7 host support. Most boats have 3–6 cabins, making them ideal for families and small groups.' },
      { q: 'Do houseboats have Wi-Fi and heating?', a: 'Almost all curated boats have Wi-Fi. In winter (Nov–Mar) every Safar boat provides bukhari (wood heater) or electric heating in cabins.' },
    ],
    listingIds: ['l1','l6','l5'],
    exploreLink: '/explore?cat=houseboat',
    exploreLabel: 'Browse all Srinagar houseboats',
  },

  'luxury-houseboats-dal-lake': {
    slug: 'luxury-houseboats-dal-lake',
    title: 'Luxury Houseboats on Dal Lake (2026) — Premium Suites & Butler Stays | Safar',
    description:
      'Book luxury houseboats on Dal Lake — private decks, butler service, hammam, sunset shikara and gourmet Wazwan. Editor-curated 5-star floating suites in Srinagar, Kashmir.',
    keywords: ['luxury houseboats Dal Lake','5 star houseboat Srinagar','premium Dal Lake stay','butler service houseboat Kashmir'],
    h1: 'Luxury Houseboats on Dal Lake',
    eyebrow: 'Dal Lake · Luxury',
    heroImageKey: 'hb2',
    intro:
      'Dal Lake’s luxury houseboats are floating palaces — walnut-wood paneling, private sundecks, in-house chefs and butler service. Whether you want a sunset shikara from your bedroom door or a candlelit Wazwan on the deck, these are the most premium boats on the lake.',
    tips: [
      'Look for boats with a private sundeck — the difference is night and day vs. shared decks.',
      'Editor’s Choice boats include butler service, in-suite breakfast and unlimited kahwa.',
      'For honeymoons, ask hosts to set up the deck with marigold petals and Kashmiri lanterns (most do this on request).',
      'A shikara ride at 5:30 PM gives you the iconic golden-hour skyline — plan dinner around it.',
      'Premium houseboats book out 8–12 weeks in advance for peak summer (Jun–Aug).',
    ],
    faqs: [
      { q: 'What’s included in a luxury Dal Lake houseboat?', a: 'Private deck, attached premium bathrooms, daily housekeeping, butler service, in-suite breakfast, complimentary kahwa, Wi-Fi, heating and airport pickup are standard on Safar’s luxury boats.' },
      { q: 'How much do luxury houseboats cost per night?', a: 'Premium suites on Dal Lake start at ₹8,400 per night for 2 guests and go up to ₹15,000+ for full-boat heritage rentals.' },
      { q: 'Can I book a private full houseboat?', a: 'Yes — most Safar luxury boats can be booked exclusively. Use the host chat to request the entire boat for families or honeymoon couples.' },
      { q: 'Are pets allowed on luxury houseboats?', a: 'A handful of luxury hosts welcome pets on request. Filter by amenities in /explore or ask via AI Concierge.' },
    ],
    listingIds: ['l6','l1'],
    exploreLink: '/explore?cat=houseboat&location=Dal',
    exploreLabel: 'See all Dal Lake houseboats',
  },

  'budget-houseboats-kashmir': {
    slug: 'budget-houseboats-kashmir',
    title: 'Budget Houseboats in Kashmir (2026) — Affordable Stays Under ₹4,000 | Safar',
    description:
      'Find authentic budget houseboats in Kashmir from ₹2,500/night. Family-run boats on Dal Lake & Nigeen Lake with breakfast, kahwa and verified hosts. Best affordable houseboat picks for 2026.',
    keywords: ['budget houseboats Kashmir','cheap houseboat Srinagar','affordable Dal Lake stay','low cost Kashmir houseboat'],
    h1: 'Budget Houseboats in Kashmir',
    eyebrow: 'Affordable · Houseboats',
    heroImageKey: 'hb1',
    intro:
      'You don’t need to spend a fortune to experience life on a Kashmiri houseboat. These budget-friendly boats and heritage homes give you the same hand-carved cedar interiors, lake views and home-cooked Wazwan — at a fraction of the luxury tier price. All are family-run and verified by Safar.',
    tips: [
      'Book mid-week (Mon–Thu) and shoulder seasons (Mar–Apr, Sep–Oct) for 20–40% lower rates.',
      'Heritage home-stays in Old Srinagar are an excellent budget alternative — same culture, half the price.',
      'Ask hosts if breakfast and shikara transfer are included — most include both at no extra cost.',
      'Avoid touts at Boulevard — always book through Safar to lock the agreed price.',
      'Group of 4+? Booking the full boat per night is often cheaper than two private rooms.',
    ],
    faqs: [
      { q: 'What’s the cheapest decent houseboat in Srinagar?', a: 'On Safar, verified budget boats and heritage homes start at ₹2,500–₹3,800 per night including breakfast — well below the average tourist quote of ₹5,000+.' },
      { q: 'Are budget houseboats safe?', a: 'Yes — every Safar listing (regardless of price) is host-verified, has secure locking, life jackets and 24/7 support. Budget simply means smaller cabins or shoulder-season pricing, not lower safety.' },
      { q: 'Do budget boats have private bathrooms?', a: 'Most do. We mark any shared-facility boats clearly in the listing. Always read the amenities section before booking.' },
      { q: 'When is the cheapest time to visit?', a: 'Mid-March, late September to early November, and February (for snow lovers) offer the lowest rates with great weather windows.' },
    ],
    listingIds: ['l5','l1'],
    exploreLink: '/explore?cat=houseboat',
    exploreLabel: 'See all affordable stays',
  },

  'family-friendly-stays-kashmir': {
    slug: 'family-friendly-stays-kashmir',
    title: 'Family-Friendly Stays in Kashmir (2026) — Best Picks for Kids & Parents | Safar',
    description:
      'Best family-friendly stays in Kashmir — spacious cottages, heritage homes and full-boat houseboats with kid-safe rooms, gardens, home meals and warm Kashmiri hospitality. Plan your family trip on Safar.',
    keywords: ['family stays Kashmir','kid friendly Srinagar','family vacation Pahalgam','Kashmir family hotels','large family houseboat'],
    h1: 'Family-Friendly Stays in Kashmir',
    eyebrow: 'Families · Curated',
    heroImageKey: 'cot1',
    intro:
      'Traveling with kids in Kashmir is magical — horseback rides in apple orchards, snowfall at gondola top, and chef-cooked meals in family kitchens. We’ve curated stays with private gardens, multiple bedrooms, child-safe interiors and hosts who treat your family like their own.',
    tips: [
      'Cottages and heritage homes are far more kid-friendly than central hotels — more space, gardens and quiet streets.',
      'Pahalgam and Sonamarg are best for kids 4–12 — short walks, river banks, ponies and zero-altitude issues.',
      'Ask hosts for a child-safe room layout (no open balconies, baby-proofed kitchens) — most accommodate.',
      'Pre-arrange car seats with the transport host if booking airport pickup.',
      'Carry layered clothing year-round; mornings are cold even in summer.',
    ],
    faqs: [
      { q: 'Is Kashmir safe for families with young children?', a: 'Yes — Srinagar, Pahalgam, Gulmarg and Sonamarg are safe family destinations. Safar lists only host-verified properties with 24/7 host support.' },
      { q: 'Which destinations are best for families?', a: 'Pahalgam (river, orchards), Gulmarg (snow, gondola), Sonamarg (glacier picnics) and Srinagar (Mughal gardens, shikara). All are connected by 2–3 hour drives.' },
      { q: 'Can we book stays with cribs and high chairs?', a: 'Many Safar family-friendly hosts provide cribs and high chairs on request. Use AI Concierge to filter homes that have confirmed these.' },
      { q: 'Are meals kid-friendly?', a: 'Yes — hosts customize meals for kids (mild spices, plain rice, fresh fruit). Just message your host or note dietary needs at checkout.' },
    ],
    listingIds: ['l3','l5','l12'],
    exploreLink: '/explore?guests=4',
    exploreLabel: 'Browse family-friendly stays',
  },

  'best-cabins-gulmarg': {
    slug: 'best-cabins-gulmarg',
    title: 'Best Cabins in Gulmarg (2026) — Ski-In, Snow Views & Fireplaces | Safar',
    description:
      'Discover the best ski cabins in Gulmarg for 2026. Ski-in/ski-out, fireplaces, heated floors, gondola access and hot chocolate bars. Premium snow stays curated by Safar.',
    keywords: ['best cabins Gulmarg','Gulmarg ski stay','snow cabin Kashmir','Gulmarg gondola cabin','ski-in ski-out Gulmarg'],
    h1: 'The Best Cabins in Gulmarg',
    eyebrow: 'Gulmarg · Cabins',
    heroImageKey: 'cab1',
    intro:
      'Gulmarg in winter is a snow-globe — pine forests dusted in white, the world’s second-highest gondola, and the smell of woodsmoke from cabin chimneys. These are the most popular ski-in/ski-out cabins on Safar, hand-picked for their fireplaces, mountain views and proximity to Gondola Phase 1.',
    tips: [
      'Book Gulmarg cabins 8–10 weeks in advance for December–February.',
      'Ski-in/ski-out properties save 30–40 minutes of cold transfers each day.',
      'Most cabins include ski storage and boot dryers — confirm in amenities.',
      'Hot chocolate bars and bukhari heaters make a huge comfort difference — prioritize these.',
      'Snow chains for cars are mandatory Dec–Feb — Safar transport hosts handle this automatically.',
    ],
    faqs: [
      { q: 'When is the best time to stay in a Gulmarg cabin?', a: 'Mid-December to late February offers the deepest snow and best skiing. March is also great for sun + snow. Summer (Jun–Aug) is perfect for hiking and meadows at lower rates.' },
      { q: 'How close are the cabins to the gondola?', a: 'Most Safar-curated cabins are 3–10 minutes’ walk to Gulmarg Gondola Phase 1. Ski-in/ski-out cabins are right on the slope.' },
      { q: 'Are cabins heated all night?', a: 'Yes — all winter cabins on Safar have continuous heating (heated floors, central heating or bukhari). Confirm in the amenities list.' },
      { q: 'Can beginners ski in Gulmarg?', a: 'Yes — Phase 1 has gentle slopes with instructors and rental gear. Many cabin hosts arrange your lessons on request.' },
    ],
    listingIds: ['l2','l11'],
    exploreLink: '/explore?cat=cabin&location=Gulmarg',
    exploreLabel: 'See all Gulmarg cabins',
  },

  'best-cottages-pahalgam': {
    slug: 'best-cottages-pahalgam',
    title: 'Best Cottages in Pahalgam (2026) — Orchard, River & Pine Valley Stays | Safar',
    description:
      'Top cottages in Pahalgam for 2026 — apple orchards, river views, bonfires and family-run hospitality. Hand-picked Pahalgam cottage stays on Safar.',
    keywords: ['best cottages Pahalgam','Pahalgam orchard stay','river cottage Kashmir','Pahalgam vacation rental','Anantnag cottage'],
    h1: 'The Best Cottages in Pahalgam',
    eyebrow: 'Pahalgam · Cottages',
    heroImageKey: 'cot1',
    intro:
      'Pahalgam is Kashmir’s pine-valley escape — the Lidder river runs through it, apple orchards bloom in summer, and the air smells of cedar and bonfires. These cottages are the best of Pahalgam: family-run, walkable to the river, with breakfast included and warm bukhari evenings.',
    tips: [
      'Stay on the Aru Valley road for the best river-view cottages and shorter day-trip drives.',
      'May–June is bloom season; Sep–Oct is golden orchard season — both are spectacular.',
      'Pahalgam is the base for Aru, Betaab and Chandanwari — 1 full day for all three is plenty.',
      'Bonfires are usually free; ask hosts to set one up after dinner.',
      'Network is patchy beyond the main town; many cottages have Wi-Fi but mobile data drops.',
    ],
    faqs: [
      { q: 'When is the best season for Pahalgam cottages?', a: 'May–October is the peak. Winter cottages are open Dec–Feb with bukhari heating — a magical snow experience without Gulmarg crowds.' },
      { q: 'How far is Pahalgam from Srinagar airport?', a: 'About 90 km / 2.5 hours by car. Safar transport hosts run scheduled and private transfers daily.' },
      { q: 'Are cottages good for big families?', a: 'Yes — several Safar cottages have 2–4 bedrooms with private dining and garden bonfires — perfect for multi-generation trips.' },
      { q: 'Can I do horse riding from the cottage?', a: 'Most hosts arrange certified pony walks to Baisaran, Mini-Switzerland or Lidder banks. Ask at check-in.' },
    ],
    listingIds: ['l3','l12'],
    exploreLink: '/explore?cat=cottage&location=Pahalgam',
    exploreLabel: 'See all Pahalgam cottages',
  },

  'hotels-near-gulmarg-gondola': {
    slug: 'hotels-near-gulmarg-gondola',
    title: 'Hotels Near Gulmarg Gondola (2026) — Walk-to-Lift Stays | Safar',
    description:
      'Best hotels and cabins near Gulmarg Gondola — 3 to 10 minutes’ walk to Phase 1. Ski storage, mountain views, heated rooms and verified hosts. Book your gondola-side stay on Safar.',
    keywords: ['hotels near Gulmarg Gondola','Gulmarg gondola stay','walk to gondola hotel','Phase 1 Gulmarg hotel','ski lift hotel Kashmir'],
    h1: 'Hotels & Cabins Near Gulmarg Gondola',
    eyebrow: 'Gulmarg · Gondola Access',
    heroImageKey: 'cab1',
    intro:
      'The Gulmarg Gondola is the world’s second-highest cable car — and staying within a 10-minute walk transforms your trip. No 4×4 transfers, no morning queues at hotels far away. These are Safar’s most popular gondola-adjacent stays for 2026.',
    tips: [
      'Phase 1 starts at 4,389 m; Phase 2 reaches 3,950 m. Acclimatize for 1 day before Phase 2.',
      'Book your gondola tickets online a day in advance — your host can guide you through the official portal.',
      'Ski-in cabins are pricier but save you ~₹1,500/day in transport and time.',
      'Carry sunglasses, sunscreen and gloves — sunburn at altitude is real even in winter.',
      'A certified local guide (included with our tour package) is highly recommended for first-timers.',
    ],
    faqs: [
      { q: 'How close is the closest hotel to the Gondola?', a: 'The closest Safar cabin is roughly a 3-minute walk to Gondola Phase 1, with direct ski-in access in winter.' },
      { q: 'Are gondola tickets included?', a: 'Tickets are separate, but the Safar Gulmarg Gondola tour package includes Phase 1+2 tickets, local guide, hot lunch and pickup.' },
      { q: 'Can I visit the gondola in summer?', a: 'Yes — summer offers green meadows, wildflowers and panoramic views without snow gear. Many travelers prefer it.' },
      { q: 'Is the gondola open year-round?', a: 'Gondola Phase 1 runs almost daily; Phase 2 depends on weather and may close during heavy snow. Hosts share live status each morning.' },
    ],
    listingIds: ['l2','l11'],
    exploreLink: '/explore?location=Gulmarg',
    exploreLabel: 'See all Gulmarg stays',
  },

  'romantic-stays-kashmir': {
    slug: 'romantic-stays-kashmir',
    title: 'Romantic Stays in Kashmir (2026) — Private Decks, Sunsets & Candlelight | Safar',
    description:
      'Most romantic stays in Kashmir for 2026 — private houseboat suites, orchard cottages, candlelit Wazwan and sunset shikara rides. Curated romantic getaways on Safar.',
    keywords: ['romantic stays Kashmir','romantic houseboat Dal Lake','couples getaway Kashmir','candlelight dinner Srinagar','romantic Pahalgam cottage'],
    h1: 'The Most Romantic Stays in Kashmir',
    eyebrow: 'Couples · Curated',
    heroImageKey: 'hb2',
    intro:
      'For couples, Kashmir is a slow love letter — sunsets over Dal, snow drifting past your cabin window, and a chef plating Wazwan by candlelight on a wooden deck. These are Safar’s most romantic stays, all with private space, intimate dining and hosts who quietly disappear once everything is set.',
    tips: [
      'Choose Nigeen Lake or Pahalgam over central Srinagar for true privacy.',
      'Pre-book a candlelight Wazwan or a private shikara at sunset — hosts arrange both.',
      'Houseboats with a private deck > rooms inside large boats. Always confirm.',
      'Bring layered clothing year-round — deck dinners get cool after sunset, even in summer.',
      'Tell your host it’s a special trip — most surprise you with flowers, kahwa setups or a sunrise shikara.',
    ],
    faqs: [
      { q: 'What’s the most romantic place in Kashmir?', a: 'A toss-up between a private deck on Nigeen Lake at sunset and a candlelit cottage in Pahalgam in winter. Both are unforgettable for couples.' },
      { q: 'Can hosts arrange a surprise for my partner?', a: 'Yes — Safar hosts excel at this. Message them before arrival and they’ll set up flowers, kahwa, dinner or a sunset shikara surprise.' },
      { q: 'Best month for a romantic Kashmir trip?', a: 'April–May (tulip & blossom season) and December–February (snow & fireplaces) are the most romantic windows.' },
      { q: 'How much should I budget for a 5-day romantic trip?', a: 'A premium romantic itinerary (luxury houseboat + Pahalgam cottage + Wazwan + transport) on Safar typically runs ₹45,000–₹70,000 for two.' },
    ],
    listingIds: ['l6','l1','l3'],
    exploreLink: '/explore?guests=2',
    exploreLabel: 'Browse romantic stays',
  },

  'honeymoon-stays-kashmir': {
    slug: 'honeymoon-stays-kashmir',
    title: 'Top Stays for Honeymoon Couples in Kashmir (2026) | Safar',
    description:
      'Top honeymoon stays in Kashmir for 2026 — luxury houseboats with butler service, orchard cottages, snow cabins and curated honeymoon packages. Plan your dream Kashmir honeymoon on Safar.',
    keywords: ['honeymoon Kashmir','honeymoon houseboat Dal Lake','Kashmir honeymoon package','best honeymoon stay Gulmarg','honeymoon cottage Pahalgam'],
    h1: 'Top Honeymoon Stays in Kashmir',
    eyebrow: 'Honeymoon · Premium',
    heroImageKey: 'hb2',
    intro:
      'A Kashmir honeymoon is the kind of trip you talk about for the rest of your life. Floating breakfasts on Dal, snowfall at Gulmarg Gondola, candlelit dinners in a cedar-wood cabin. We’ve curated the most romantic, private and well-rated honeymoon stays on Safar — each with butler service or full-host attention.',
    tips: [
      'Plan 6–7 nights minimum: 3 nights Srinagar/Nigeen + 2 Pahalgam + 2 Gulmarg is the ideal flow.',
      'Book a full private houseboat — sharing a boat with strangers kills the honeymoon vibe.',
      'Pre-arrange airport pickup with flowers and a welcome shikara — most luxury hosts include this.',
      'Spring (Apr–May) for tulips, Autumn (Sep–Oct) for golden chinars, Winter (Dec–Feb) for snow.',
      'Use Safar AI Planner to design a 7-day plan based on budget, season and travel style.',
    ],
    faqs: [
      { q: 'Best honeymoon package in Kashmir?', a: 'Our most-booked combination: luxury houseboat on Nigeen + Pahalgam cottage + Gulmarg cabin + private car for 6 nights, typically ₹65,000–₹1,20,000 for two on Safar.' },
      { q: 'Is December a good month for a Kashmir honeymoon?', a: 'Absolutely — Gulmarg snow, frozen Dal Lake, fireplaces and Wazwan make December–February incredibly romantic. Pack heavy woolens.' },
      { q: 'Can Safar handle a honeymoon end-to-end?', a: 'Yes — use the AI Trip Planner to draft your itinerary, then chat with our AI Concierge to fine-tune flights, transfers, dinners and surprises.' },
      { q: 'Do you arrange anniversary cakes and decorations?', a: 'Most luxury hosts arrange decorations, cakes, candlelight dinners and surprise photo shoots. Mention it in your booking notes.' },
    ],
    listingIds: ['l6','l1','l3'],
    exploreLink: '/explore?guests=2',
    exploreLabel: 'Browse honeymoon stays',
  },

  'best-winter-stays-kashmir': {
    slug: 'best-winter-stays-kashmir',
    title: 'Best Winter Stays in Kashmir (2026) — Snow Cabins, Heated Houseboats & Glacier Camps | Safar',
    description:
      'Top winter stays in Kashmir for Dec 2025–Feb 2026 — ski cabins in Gulmarg, heated houseboats on Dal, snow cottages in Pahalgam and glacier camps. Plan a snow holiday on Safar.',
    keywords: ['winter stays Kashmir','snow holiday Kashmir','Gulmarg winter cabin','Kashmir December 2025','winter houseboat heated'],
    h1: 'The Best Winter Stays in Kashmir',
    eyebrow: 'Winter · Snow Season',
    heroImageKey: 'cab1',
    intro:
      'Kashmir in winter is otherworldly — powdered pine forests, the world’s second-highest ski gondola, and frozen lakes wrapped in mist. From ski-in cabins in Gulmarg to bukhari-warmed houseboats on Dal, these are the warmest, most beautiful winter stays on Safar for the 2025–26 season.',
    tips: [
      'Carry layered thermals, waterproof boots, gloves and a windproof jacket — temperatures drop to -10°C.',
      'Houseboats are heated via bukhari (wood) or electric heaters — confirm with host before booking.',
      'Snow chains for cars are mandatory Dec–Feb — Safar transport hosts handle this automatically.',
      'Phase 2 of the Gondola sometimes closes due to weather — build a buffer day into your plan.',
      'Book 8–10 weeks ahead for Christmas–New Year and mid-Jan to mid-Feb (deepest snow).',
    ],
    faqs: [
      { q: 'Will I see snow in Kashmir in December?', a: 'Gulmarg and Sonamarg almost always have snow by mid-December. Srinagar and Pahalgam see snowfall by late December to mid-January.' },
      { q: 'Are houseboats open in winter?', a: 'Yes — many heritage and luxury houseboats stay open with full heating. The lake doesn’t fully freeze and the experience is uniquely peaceful.' },
      { q: 'Is winter travel in Kashmir safe?', a: 'Yes — highways are cleared regularly, hosts coordinate snow-chain vehicles, and Safar tracks real-time road status. Build a 1-day buffer near departure.' },
      { q: 'What’s the best winter itinerary?', a: 'Classic 6 nights: 2 in Srinagar (heated houseboat) + 3 in Gulmarg (ski cabin) + 1 in Pahalgam (snow cottage). The AI Planner can customize this for your dates.' },
    ],
    listingIds: ['l2','l4','l11'],
    exploreLink: '/explore?cat=cabin',
    exploreLabel: 'Browse winter snow stays',
  },
};

export const GUIDE_SLUGS = Object.keys(GUIDES);
