// SafarOS — Premium website templates (data-driven). One renderer (components/site/builder-site.jsx)
// draws all seven; each template has its own design system (fonts, palette, hero/card/nav layouts,
// section order) and its own ILLUSTRATIVE demo content. Images: Unsplash (free commercial use,
// hotlinking permitted) — every image is an editable URL in the builder.

const U = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

const T = [
  {
    key: 'luxe-escape', name: 'Luxe Escape', category: 'Luxury', legacy: ['luxe-voyage'],
    description: 'Editorial luxury for honeymoons, premium resorts and exclusive journeys.',
    brand: { primary: '#a8854f', secondary: '#1c1917', accent: '#f5efe4', bg: '#fbf8f3', text: '#1c1917', headingFont: 'Playfair Display', bodyFont: 'Lato', button: 'square' },
    layout: { hero: 'editorial', card: 'portrait', nav: 'center' },
    order: ['hero', 'about', 'tours', 'offers', 'destinations', 'gallery', 'testimonials', 'faqs', 'contact'],
    hero: ['Journeys of quiet distinction', 'Private villas, overwater suites and handcrafted honeymoons — curated by specialists who know every detail.', '1514282401047-d79a71a590e8'],
    about: ['The art of exceptional travel', 'We design private journeys for travellers who value time, space and discretion. Every itinerary is composed by hand — from the suite you wake up in to the table you dine at.', '1566073771259-6a8506099945'],
    tours: [
      ['Maldives Overwater Honeymoon', 'Maldives', 'Honeymoon', 245000, 6, 'Private villa', '1514282401047-d79a71a590e8', 'Overwater villa, sunset cruise and a private sandbank dinner.', '2 guests'],
      ['Santorini Caldera Retreat', 'Santorini', 'Luxury', 210000, 7, 'Cliffside suite', '1570077188670-e3a8d69ac5ff', 'Caldera-view suite, private catamaran and wine tasting.', '2 guests'],
      ['Bali Jungle Villa Escape', 'Bali', 'Wellness', 155000, 6, 'Spa included', '1537996194471-e657df975ab4', 'Pool villa in Ubud with daily spa rituals and temple visits.', '2–4 guests'],
      ['Dubai Skyline Indulgence', 'Dubai', 'City luxury', 135000, 5, '5★ stay', '1512453979798-5ea266f8880c', 'Iconic hotels, desert dinner and private city tour.', '2–4 guests'],
      ['Amalfi & Cinque Terre Coast', 'Italy', 'Luxury', 295000, 8, 'Chauffeured', '1516483638261-f4dbaf036963', 'Coastal villages, private boat days and Michelin dining.', '2 guests'],
      ['Paris Romance Edition', 'Paris', 'Honeymoon', 185000, 5, 'Palace hotel', '1502602898657-3e91760cbb34', 'Palace hotel, Seine dinner cruise and private Louvre visit.', '2 guests'],
    ],
    dests: [['Maldives', 'Indian Ocean', '1573843981267-be1999ff37cd'], ['Santorini', 'Greece', '1533105079780-92b9be482077'], ['Bali', 'Indonesia', '1555400038-63f5ba517a47'], ['Dubai', 'UAE', '1518684079-3c830dcef090'], ['Italy', 'Amalfi & Cinque Terre', '1523906834658-6e24ef2386f9'], ['Paris', 'France', '1499856871958-5b9627545d1a']],
    offers: [['Honeymoon Privileges', 'Complimentary sunset cruise and in-villa dining on selected stays.', '1540541338287-41700207dee6', 'Demo offer'], ['Suite Upgrades', 'Upgrade to a signature suite on 6+ night journeys.', '1520250497591-112f2f40a3f4', 'Demo offer'], ['Private Chef Evenings', 'A private chef experience curated for your celebration.', '1414235077428-338989a2e8c0', 'Demo offer']],
    cats: [['Honeymoons', '1514282401047-d79a71a590e8'], ['Private villas', '1571896349842-33c89424de2d'], ['Wellness', '1537996194471-e657df975ab4'], ['City luxury', '1512453979798-5ea266f8880c']],
    why: [['Personal travel designer', 'One specialist plans and supports your journey end to end.'], ['Hand-picked stays', 'Only hotels and villas our team has personally reviewed.'], ['Discreet 24/7 care', 'A dedicated concierge line throughout your trip.'], ['Seamless details', 'Private transfers, fast-track and curated experiences.']],
    acts: ['Private arrival and villa check-in', 'Spa ritual and leisure', 'Private guided experience', 'Sunset cruise', 'Signature dining evening', 'Day at leisure'],
    inc: ['Luxury accommodation', 'Daily breakfast', 'Private airport transfers', 'Signature experiences listed', 'Dedicated travel designer'], exc: ['International flights', 'Visa fees', 'Personal expenses', 'Travel insurance'],
    gallery: ['1540541338287-41700207dee6', '1520250497591-112f2f40a3f4', '1570077188670-e3a8d69ac5ff', '1571896349842-33c89424de2d', '1516483638261-f4dbaf036963', '1414235077428-338989a2e8c0'],
  },
  {
    key: 'wild-trails', name: 'Wild Trails', category: 'Adventure', legacy: ['wildtrail'],
    description: 'Bold outdoor design for treks, expeditions and camping adventures.',
    brand: { primary: '#e8772e', secondary: '#1f2a24', accent: '#2f3b33', bg: '#f4f1ea', text: '#18201b', headingFont: 'Oswald', bodyFont: 'Open Sans', button: 'square' },
    layout: { hero: 'bold', card: 'rugged', nav: 'left' },
    order: ['hero', 'categories', 'tours', 'why', 'destinations', 'gallery', 'testimonials', 'faqs', 'contact'],
    hero: ['Go further. Climb higher.', 'Guided Himalayan treks, high-altitude expeditions and wild camping — led by certified mountain crews.', '1464822759023-fed622ff2c3b'],
    about: ['Mountain people, guiding since day one', 'Our trek leaders are certified in wilderness first aid and have hundreds of summits between them. Small groups, honest difficulty ratings and Leave-No-Trace on every trail.', '1551632811-561732d1e306'],
    tours: [
      ['Kashmir Great Lakes Trek', 'Kashmir', 'Trek', 18500, 7, 'Moderate', '1506905925346-21bda4d32df4', 'Seven alpine lakes, high passes and meadow camps.', 'Max 14'],
      ['Everest Base Camp Expedition', 'Nepal', 'Expedition', 98000, 14, 'Challenging', '1544735716-392fe2489ffa', 'The classic trail through Sherpa villages to 5,364 m.', 'Max 12'],
      ['Ladakh Markha Valley Trek', 'Ladakh', 'Trek', 24500, 8, 'Moderate', '1454496522488-7a8e488e8606', 'Remote villages, monasteries and Kongmaru La pass.', 'Max 12'],
      ['Himalayan Camping Weekender', 'Himachal', 'Camping', 7900, 3, 'Easy', '1504280390367-361c6d9f38f4', 'Riverside camps, bonfires and a forest day hike.', 'Max 20'],
      ['Valley of Peaks Summit Climb', 'Himachal', 'Expedition', 32500, 9, 'Challenging', '1483728642387-6c3bdd6c93e5', 'Technical-skills camp and a 6,000 m summit attempt.', 'Max 8'],
      ['Alpine Ridge Trail', 'Uttarakhand', 'Trek', 14500, 6, 'Moderate', '1519681393784-d120267933ba', 'Oak forests, ridge walks and sunrise over Nanda Devi.', 'Max 14'],
    ],
    dests: [['Kashmir', 'Great Lakes & meadows', '1506905925346-21bda4d32df4'], ['Nepal', 'Everest & Annapurna', '1544735716-392fe2489ffa'], ['Ladakh', 'High desert passes', '1454496522488-7a8e488e8606'], ['Himachal', 'Camps & summits', '1478131143081-80f7f84ca84d'], ['Uttarakhand', 'Ridges & forests', '1519681393784-d120267933ba'], ['Sikkim', 'Eastern Himalaya', '1469474968028-56623f02e42e']],
    offers: [['Early-bird departures', 'Book 60 days ahead for the illustrative early-bird rate.', '1551632811-561732d1e306', 'Demo offer'], ['Gear rental included', 'Tents, sleeping bags and poles on selected treks.', '1504280390367-361c6d9f38f4', 'Demo offer'], ['Group of 6+', 'Private departure dates for groups of six or more.', '1504150558240-0b4fd8946624', 'Demo offer']],
    cats: [['Treks', '1551632811-561732d1e306'], ['Expeditions', '1464822759023-fed622ff2c3b'], ['Camping', '1478131143081-80f7f84ca84d'], ['Weekend hikes', '1504150558240-0b4fd8946624']],
    why: [['Certified trek leaders', 'Wilderness first aid and mountaineering certified.'], ['Honest difficulty ratings', 'Clear fitness guidance for every itinerary.'], ['Small groups', 'Fixed maximum group sizes on every departure.'], ['Safety first', 'Oxygen, first-aid kits and evacuation plans on high treks.']],
    acts: ['Arrival, briefing and gear check', 'Trek to first camp', 'High pass crossing', 'Acclimatisation hike', 'Summit / viewpoint day', 'Descent and celebration dinner'],
    inc: ['Certified trek leader & crew', 'Tents and camping gear', 'All meals on trek', 'Permits and forest fees', 'First-aid & oxygen support'], exc: ['Travel to base town', 'Personal trekking gear', 'Porter for personal bags', 'Insurance'],
    gallery: ['1464822759023-fed622ff2c3b', '1551632811-561732d1e306', '1478131143081-80f7f84ca84d', '1483728642387-6c3bdd6c93e5', '1454496522488-7a8e488e8606', '1504150558240-0b4fd8946624'],
  },
  {
    key: 'atlas-journeys', name: 'Atlas Journeys', category: 'General', legacy: ['atlas-journeys'],
    description: 'Modern multi-destination agency site with discovery and featured packages.',
    brand: { primary: '#2563eb', secondary: '#0f172a', accent: '#e0ecff', bg: '#ffffff', text: '#0f172a', headingFont: 'Poppins', bodyFont: 'Inter', button: 'rounded' },
    layout: { hero: 'search', card: 'classic', nav: 'left' },
    order: ['hero', 'categories', 'tours', 'destinations', 'offers', 'why', 'testimonials', 'faqs', 'contact'],
    hero: ['Explore the world, your way', 'Handpicked holidays across India and abroad — flights, stays and sightseeing planned by experts.', '1469854523086-cc02fe5d8800'],
    about: ['Your travel partner since day one', 'We plan holidays for families, couples and friends across 40+ destinations, with transparent pricing and support before, during and after your trip.', '1488646953014-85cb44e25828'],
    tours: [
      ['Kashmir Paradise Holiday', 'Kashmir', 'Mountains', 32500, 7, 'Bestseller', '1501785888041-af3ef285b470', 'Srinagar houseboat, Gulmarg and Pahalgam.', '2–8 guests'],
      ['Golden Triangle Classic', 'Rajasthan', 'Heritage', 28900, 6, 'Popular', '1524492412937-b28074a5d7da', 'Delhi, Agra and Jaipur with private guide.', '2–8 guests'],
      ['Thailand Island Hopper', 'Thailand', 'Beaches', 54900, 7, 'Island hopping', '1552465011-b4e21bf6e79a', 'Bangkok, Phuket and Phi Phi islands.', '2–8 guests'],
      ['Dubai City & Desert', 'Dubai', 'City', 49900, 5, 'Family pick', '1512453979798-5ea266f8880c', 'Burj Khalifa, desert safari and marina cruise.', '2–8 guests'],
      ['Europe Highlights', 'Europe', 'International', 189000, 10, 'Multi-country', '1513635269975-59663e0ac1ad', 'London, Paris and Swiss Alps in ten days.', '2–8 guests'],
      ['Bali Explorer', 'Bali', 'Beaches', 62500, 6, 'Great value', '1555400038-63f5ba517a47', 'Ubud rice terraces, temples and Seminyak beaches.', '2–8 guests'],
    ],
    dests: [['Kashmir', 'India', '1501785888041-af3ef285b470'], ['Rajasthan', 'India', '1599661046289-e31897846e41'], ['Thailand', 'Southeast Asia', '1528181304800-259b08848526'], ['Dubai', 'UAE', '1518684079-3c830dcef090'], ['Europe', 'UK · France · Switzerland', '1502602898657-3e91760cbb34'], ['Bali', 'Indonesia', '1537996194471-e657df975ab4']],
    offers: [['Summer holiday sale', 'Illustrative savings on selected domestic holidays.', '1501785888041-af3ef285b470', 'Demo offer'], ['International getaways', 'Flights + hotel bundles to Southeast Asia.', '1552465011-b4e21bf6e79a', 'Demo offer'], ['Weekend breaks', 'Short escapes within driving distance.', '1476514525535-07fb3b4ae5f1', 'Demo offer']],
    cats: [['Mountains', '1501785888041-af3ef285b470'], ['Beaches', '1507525428034-b723cf961d3e'], ['Heritage', '1524492412937-b28074a5d7da'], ['International', '1513635269975-59663e0ac1ad']],
    why: [['Best-value packages', 'Transparent pricing with no hidden charges.'], ['Trusted partners', 'Verified hotels, drivers and guides.'], ['24/7 trip support', 'Real people to help, wherever you are.'], ['Flexible planning', 'Every package can be customised.']],
    acts: ['Arrival and hotel check-in', 'City sightseeing tour', 'Signature attraction visit', 'Scenic day excursion', 'Leisure and shopping', 'Departure transfer'],
    inc: ['Hotel accommodation', 'Daily breakfast', 'Airport transfers', 'Sightseeing as per itinerary', 'Trip support'], exc: ['Flights unless stated', 'Lunch & dinner', 'Entry tickets', 'Personal expenses'],
    gallery: ['1469854523086-cc02fe5d8800', '1530789253388-582c481c54b0', '1528181304800-259b08848526', '1502602898657-3e91760cbb34', '1476514525535-07fb3b4ae5f1', '1507525428034-b723cf961d3e'],
  },
  {
    key: 'coastal-dreams', name: 'Coastal Dreams', category: 'Beach', legacy: ['coastline'],
    description: 'Airy ocean palette for beach holidays, islands and resort escapes.',
    brand: { primary: '#0e7490', secondary: '#f4a261', accent: '#e6f6f7', bg: '#f7fbfb', text: '#0b3a45', headingFont: 'DM Serif Display', bodyFont: 'Nunito', button: 'pill' },
    layout: { hero: 'split', card: 'soft', nav: 'left' },
    order: ['hero', 'destinations', 'tours', 'offers', 'gallery', 'why', 'testimonials', 'faqs', 'contact'],
    hero: ['Where the ocean slows you down', 'Island escapes, beach resorts and barefoot honeymoons — planned so all you pack is sunscreen.', '1507525428034-b723cf961d3e'],
    about: ['Beach specialists, island lovers', 'From the Andamans to the Maldives, we know which beach suits which traveller — calm lagoons for families, secluded coves for couples.', '1519046904884-53103b34b206'],
    tours: [
      ['Andaman Island Escape', 'Andaman', 'Islands', 38500, 6, 'Snorkelling', '1559827260-dc66d52bef19', 'Havelock, Neil Island and Radhanagar beach.', '2–6 guests'],
      ['Goa Beach Resort Break', 'Goa', 'Beach resort', 19900, 4, 'Resort stay', '1510414842594-a61c69b5ae57', 'Beachfront resort, sunset cruise and spice farm.', '2–6 guests'],
      ['Maldives Lagoon Holiday', 'Maldives', 'Islands', 125000, 5, 'All-inclusive', '1573843981267-be1999ff37cd', 'Beach villa, house reef snorkelling and spa.', '2 guests'],
      ['Phuket & Krabi Beaches', 'Thailand', 'Beach resort', 58500, 6, 'Island tour', '1528181304800-259b08848526', 'Long-tail boats, limestone bays and night markets.', '2–6 guests'],
      ['Kerala Beach & Backwaters', 'Kerala', 'Coastal', 31500, 5, 'Houseboat', '1506929562872-bb421503ef21', 'Varkala cliffs and an Alleppey houseboat night.', '2–6 guests'],
      ['Bali Beach Honeymoon', 'Bali', 'Honeymoon', 72500, 6, 'Honeymoon', '1537996194471-e657df975ab4', 'Seminyak beach villa and Uluwatu sunset dinner.', '2 guests'],
    ],
    dests: [['Andaman', 'India', '1559827260-dc66d52bef19'], ['Goa', 'India', '1510414842594-a61c69b5ae57'], ['Maldives', 'Indian Ocean', '1514282401047-d79a71a590e8'], ['Thailand', 'Andaman Sea', '1552465011-b4e21bf6e79a'], ['Kerala', 'India', '1506929562872-bb421503ef21'], ['Bali', 'Indonesia', '1555400038-63f5ba517a47']],
    offers: [['Monsoon island deals', 'Illustrative off-season savings on island resorts.', '1559827260-dc66d52bef19', 'Demo offer'], ['Honeymoon extras', 'Candle-light beach dinner on selected stays.', '1540541338287-41700207dee6', 'Demo offer'], ['Kids stay free', 'On selected family beach resorts.', '1519046904884-53103b34b206', 'Demo offer']],
    cats: [['Islands', '1559827260-dc66d52bef19'], ['Beach resorts', '1540541338287-41700207dee6'], ['Honeymoons', '1514282401047-d79a71a590e8'], ['Water sports', '1544551763-46a013bb70d5']],
    why: [['Beach-matched stays', 'We match resorts to how you like to relax.'], ['Ferry & seaplane booked', 'Island transfers handled for you.'], ['Calm-water picks', 'Family-safe lagoons and beaches.'], ['Season advice', 'Honest guidance on weather and sea conditions.']],
    acts: ['Arrival and resort check-in', 'Beach day and sunset cruise', 'Snorkelling or island tour', 'Spa and leisure', 'Local market and seafood dinner', 'Departure transfer'],
    inc: ['Beach resort stay', 'Daily breakfast', 'Ferry / speedboat transfers', 'Snorkelling trip', 'Airport transfers'], exc: ['Flights', 'Water sports unless listed', 'Personal expenses', 'Insurance'],
    gallery: ['1507525428034-b723cf961d3e', '1519046904884-53103b34b206', '1544551763-46a013bb70d5', '1540541338287-41700207dee6', '1473625247510-8ceb1760943f', '1559827260-dc66d52bef19'],
  },
  {
    key: 'roots-routes', name: 'Roots & Routes', category: 'Culture', legacy: ['roots-routes'],
    description: 'Editorial storytelling for heritage tours, guided walks and local experiences.',
    brand: { primary: '#b4532a', secondary: '#3b2a1f', accent: '#f3e7d7', bg: '#fbf6ee', text: '#2b1d14', headingFont: 'Libre Baskerville', bodyFont: 'Source Sans 3', button: 'square' },
    layout: { hero: 'magazine', card: 'list', nav: 'center' },
    order: ['hero', 'about', 'destinations', 'tours', 'categories', 'gallery', 'testimonials', 'faqs', 'contact'],
    hero: ['Travel through stories, not just places', 'Heritage walks, artisan workshops and cultural journeys led by local storytellers.', '1599661046289-e31897846e41'],
    about: ['Rooted in local knowledge', 'We work with historians, artisans and community guides so every journey supports the people who keep culture alive.', '1561361513-2d000a50f0dc'],
    tours: [
      ['Royal Rajasthan Heritage Trail', 'Rajasthan', 'Heritage', 45500, 8, 'Palaces & forts', '1599661046289-e31897846e41', 'Jaipur, Jodhpur and Udaipur with palace stays.', 'Max 12'],
      ['Varanasi Ghats & Rituals', 'Varanasi', 'Spiritual', 18900, 4, 'Sunrise boat', '1561361513-2d000a50f0dc', 'Ganga aarti, old-city lanes and silk weavers.', 'Max 10'],
      ['Taj & Mughal Agra', 'Agra', 'Heritage', 12900, 3, 'Sunrise visit', '1548013146-72479768bada', 'Taj Mahal at sunrise and Mughal cuisine walk.', 'Max 12'],
      ['Old Delhi Food & History Walk', 'Delhi', 'Local experience', 3900, 1, 'Half day', '1477587458883-47145ed94245', 'Chandni Chowk, spice markets and street food.', 'Max 8'],
      ['Kerala Arts & Spice Route', 'Kerala', 'Culture', 34500, 6, 'Kathakali', '1506929562872-bb421503ef21', 'Fort Kochi, spice farms and Kathakali evenings.', 'Max 12'],
      ['Kyoto Temples & Tea', 'Japan', 'Culture', 165000, 7, 'Tea ceremony', '1540959733332-eab4deabeeaf', 'Tokyo and Kyoto with temple stays and tea ceremony.', 'Max 10'],
    ],
    dests: [['Rajasthan', 'Land of kings', '1599661046289-e31897846e41'], ['Varanasi', 'Spiritual capital', '1561361513-2d000a50f0dc'], ['Agra', 'Mughal heritage', '1564507592333-c60657eea523'], ['Delhi', 'Old & New Delhi', '1477587458883-47145ed94245'], ['Kerala', 'Spice coast', '1506929562872-bb421503ef21'], ['Japan', 'Kyoto & Tokyo', '1540959733332-eab4deabeeaf']],
    offers: [['Artisan workshops', 'Hands-on block printing or pottery with master craftspeople.', '1528127269322-539801943592', 'Demo offer'], ['Heritage homestays', 'Stay with families in restored havelis.', '1599661046289-e31897846e41', 'Demo offer'], ['Festival departures', 'Journeys timed with regional festivals.', '1561361513-2d000a50f0dc', 'Demo offer']],
    cats: [['Heritage walks', '1477587458883-47145ed94245'], ['Spiritual journeys', '1561361513-2d000a50f0dc'], ['Artisan workshops', '1528127269322-539801943592'], ['Food trails', '1414235077428-338989a2e8c0']],
    why: [['Local storytellers', 'Guides who grew up in the places they share.'], ['Responsible travel', 'Fair pay for artisans and community partners.'], ['Small groups', 'Intimate groups for genuine encounters.'], ['Slow itineraries', 'Time to linger, listen and learn.']],
    acts: ['Welcome walk and heritage briefing', 'Guided monument visit', 'Artisan workshop', 'Old-city storytelling walk', 'Cultural performance evening', 'Farewell meal with a local family'],
    inc: ['Heritage hotel stays', 'Expert local guides', 'Workshops listed', 'Monument entry fees', 'Daily breakfast'], exc: ['Flights', 'Camera fees at monuments', 'Tips', 'Personal expenses'],
    gallery: ['1524492412937-b28074a5d7da', '1599661046289-e31897846e41', '1561361513-2d000a50f0dc', '1564507592333-c60657eea523', '1528127269322-539801943592', '1477587458883-47145ed94245'],
  },
  {
    key: 'happy-holidays', name: 'Happy Holidays', category: 'Family', legacy: ['happy-trails'],
    description: 'Warm, friendly design for family holidays, group trips and kid-friendly travel.',
    brand: { primary: '#f97316', secondary: '#0ea5e9', accent: '#fff4e6', bg: '#fffdf9', text: '#1f2937', headingFont: 'Baloo 2', bodyFont: 'Nunito', button: 'pill' },
    layout: { hero: 'playful', card: 'playful', nav: 'left' },
    order: ['hero', 'why', 'tours', 'categories', 'offers', 'testimonials', 'gallery', 'faqs', 'contact'],
    hero: ['Holidays the whole family will love', 'Kid-friendly stays, easy travel days and fun for every age — we plan it, you make the memories.', '1511895426328-dc8714191300'],
    about: ['Family travel, made easy', 'Parents ourselves, we plan realistic pacing, family rooms, kid-friendly meals and activities everyone enjoys — grandparents included.', '1527631746610-bca00a040d60'],
    tours: [
      ['Dubai Family Fun Week', 'Dubai', 'Family', 64900, 6, 'Ages 3+', '1518684079-3c830dcef090', 'Theme parks, aquarium and a gentle desert safari.', 'Family of 4'],
      ['Singapore Kids Adventure', 'Singapore', 'Family', 72500, 5, 'Ages 4+', '1530789253388-582c481c54b0', 'Sentosa, Universal Studios and night safari.', 'Family of 4'],
      ['Kerala Family Backwaters', 'Kerala', 'Family', 34900, 6, 'All ages', '1506929562872-bb421503ef21', 'Houseboat day, elephant camp visit and beach time.', 'Family of 4'],
      ['Goa Beach Family Break', 'Goa', 'Family', 22900, 4, 'Kids club', '1510414842594-a61c69b5ae57', 'Family resort with kids club and dolphin trip.', 'Family of 4'],
      ['Manali Snow Holiday', 'Himachal', 'Group', 21500, 5, 'Snow play', '1478131143081-80f7f84ca84d', 'Snow point, Solang Valley and cosy cottages.', 'Groups 6–20'],
      ['Thailand Group Getaway', 'Thailand', 'Group', 48500, 6, 'Group deal', '1552465011-b4e21bf6e79a', 'Bangkok and Pattaya with island day trip.', 'Groups 6–20'],
    ],
    dests: [['Dubai', 'Theme parks & desert', '1518684079-3c830dcef090'], ['Singapore', 'Gardens & attractions', '1530789253388-582c481c54b0'], ['Kerala', 'Backwaters & beaches', '1506929562872-bb421503ef21'], ['Goa', 'Family beaches', '1510414842594-a61c69b5ae57'], ['Himachal', 'Snow & mountains', '1478131143081-80f7f84ca84d'], ['Thailand', 'Islands & cities', '1528181304800-259b08848526']],
    offers: [['Kids stay free', 'Selected family resorts — illustrative offer.', '1511895426328-dc8714191300', 'Demo offer'], ['School-holiday departures', 'Fixed dates timed with school breaks.', '1527631746610-bca00a040d60', 'Demo offer'], ['Group discounts', 'Special rates for groups of 10+.', '1539635278303-d4002c07eae3', 'Demo offer']],
    cats: [['Theme parks', '1518684079-3c830dcef090'], ['Beach holidays', '1519046904884-53103b34b206'], ['Snow trips', '1478131143081-80f7f84ca84d'], ['Group tours', '1539635278303-d4002c07eae3']],
    why: [['Family-sized rooms', 'Interconnecting rooms and suites wherever possible.'], ['Easy travel days', 'Sensible drive times and nap-friendly plans.'], ['Kid-friendly food', 'Hotels with family menus and flexible meals.'], ['Group coordinators', 'One contact for big family and friends groups.']],
    acts: ['Arrival and family check-in', 'Theme park or attraction day', 'Nature or wildlife visit', 'Beach / pool day', 'Fun activity for all ages', 'Departure with snacks pack'],
    inc: ['Family rooms', 'Daily breakfast', 'Private transfers', 'Attraction tickets listed', 'Trip coordinator'], exc: ['Flights', 'Lunch & dinner', 'Personal expenses', 'Insurance'],
    gallery: ['1511895426328-dc8714191300', '1527631746610-bca00a040d60', '1539635278303-d4002c07eae3', '1519046904884-53103b34b206', '1530789253388-582c481c54b0', '1522202176988-66273c2fd55f'],
  },
  {
    key: 'meridian-travel', name: 'Meridian Travel', category: 'Business', legacy: ['meridian'],
    description: 'Professional corporate travel, business trips and managed travel programmes.',
    brand: { primary: '#0f2a4a', secondary: '#c9a227', accent: '#eef2f7', bg: '#ffffff', text: '#0f172a', headingFont: 'IBM Plex Serif', bodyFont: 'IBM Plex Sans', button: 'rounded' },
    layout: { hero: 'corporate', card: 'corporate', nav: 'left' },
    order: ['hero', 'why', 'about', 'tours', 'destinations', 'offers', 'testimonials', 'faqs', 'contact'],
    hero: ['Corporate travel, professionally managed', 'Flights, hotels, MICE and offsites for growing teams — with policy control, consolidated billing and 24/7 support.', '1486406146926-c627a92ad1ab'],
    about: ['A travel desk that works like your team', 'We manage business travel for companies of every size: negotiated hotel rates, duty-of-care tracking and a single point of contact for every trip.', '1556761175-b413da4baf72'],
    tours: [
      ['Mumbai Business Summit Package', 'Mumbai', 'Conference', 24500, 3, 'Business hotel', '1486406146926-c627a92ad1ab', 'Airport transfers, business hotel and venue logistics.', 'Teams 5–200'],
      ['Dubai Corporate Offsite', 'Dubai', 'Offsite', 89000, 4, 'MICE', '1512453979798-5ea266f8880c', 'Conference venue, team dinner and desert evening.', 'Teams 10–150'],
      ['Singapore Leadership Retreat', 'Singapore', 'Retreat', 115000, 4, 'Executive', '1530789253388-582c481c54b0', 'Executive hotel, meeting rooms and city experience.', 'Teams 8–40'],
      ['Bengaluru Client Visit Programme', 'Bengaluru', 'Business trip', 18900, 2, 'Express', '1497366216548-37526070297c', 'Flights, hotel near tech parks and car on call.', '1–20 travellers'],
      ['London Trade Fair Delegation', 'London', 'Trade fair', 225000, 6, 'Delegation', '1513635269975-59663e0ac1ad', 'Visa assistance, fair passes and central hotel.', 'Groups 5–50'],
      ['Goa Sales Kick-off', 'Goa', 'Incentive', 42500, 3, 'Incentive', '1510414842594-a61c69b5ae57', 'Resort venue, awards night and team activities.', 'Teams 20–300'],
    ],
    dests: [['Mumbai', 'Financial capital', '1486406146926-c627a92ad1ab'], ['Dubai', 'MICE hub', '1512453979798-5ea266f8880c'], ['Singapore', 'APAC headquarters', '1530789253388-582c481c54b0'], ['Bengaluru', 'Tech capital', '1497366216548-37526070297c'], ['London', 'Global business', '1513635269975-59663e0ac1ad'], ['Goa', 'Incentives & offsites', '1510414842594-a61c69b5ae57']],
    offers: [['Travel policy setup', 'We configure approval rules and spending limits.', '1504384308090-c894fdcc538d', 'Service'], ['Negotiated hotel rates', 'Corporate rates across major business cities.', '1517400508447-f8dd518b86db', 'Service'], ['MICE & offsites', 'Venues, AV, transport and team experiences.', '1552664730-d307ca884978', 'Service']],
    cats: [['Business trips', '1436491865332-7a61a109cc05'], ['Conferences', '1552664730-d307ca884978'], ['Offsites', '1556761175-b413da4baf72'], ['Incentives', '1510414842594-a61c69b5ae57']],
    why: [['Policy & approvals', 'Trips booked within your travel policy.'], ['Consolidated billing', 'One monthly GST invoice for all travel.'], ['Duty of care', 'Traveller tracking and emergency support.'], ['Dedicated account manager', 'A named contact for your company.']],
    acts: ['Arrival, transfer and hotel check-in', 'Conference / meeting day', 'Client visits with car on call', 'Team session and networking dinner', 'Optional city experience', 'Check-out and airport transfer'],
    inc: ['Business hotel', 'Airport transfers', 'Meeting logistics', 'Account manager support', 'Consolidated invoice'], exc: ['Flights unless stated', 'Visa fees', 'Incidental expenses', 'Insurance'],
    gallery: ['1486406146926-c627a92ad1ab', '1497366216548-37526070297c', '1556761175-b413da4baf72', '1552664730-d307ca884978', '1436491865332-7a61a109cc05', '1517400508447-f8dd518b86db'],
  },
];

const TESTI = {
  'luxe-escape': [['Every detail felt considered — from the villa to the private dinner on the sand.', 'Ananya & Rohan', 'Maldives honeymoon'], ['Effortless from start to finish. Our designer anticipated everything.', 'Meera S.', 'Santorini retreat'], ['The most relaxing trip we have ever taken.', 'Vikram K.', 'Bali villa escape']],
  'wild-trails': [['Leaders were brilliant and safety was top-notch at every pass.', 'Arjun P.', 'Great Lakes trek'], ['Honest difficulty rating — tough but completely doable.', 'Sara T.', 'Markha Valley'], ['Best camping weekend I have done. Great food too!', 'Kabir S.', 'Camping weekender']],
  'atlas-journeys': [['Smooth planning and great hotels at a fair price.', 'Priya N.', 'Kashmir holiday'], ['Our first international trip and they made it so easy.', 'Rahul D.', 'Thailand hopper'], ['Responsive team, even late at night during our trip.', 'Neha B.', 'Dubai city & desert']],
  'coastal-dreams': [['Perfect beach, perfect resort — exactly what we asked for.', 'Zoya K.', 'Andaman escape'], ['The ferry and seaplane transfers were all handled.', 'Liam O.', 'Maldives lagoon'], ['Calm water for the kids and a lovely spa for us.', 'Pooja R.', 'Goa beach break']],
  'roots-routes': [['Our guide brought every fort and lane to life.', 'Emily C.', 'Rajasthan trail'], ['The weaving workshop was the highlight of our year.', 'Harish G.', 'Varanasi rituals'], ['Slow, thoughtful and genuinely local.', 'Daniel B.', 'Kerala arts route']],
  'happy-holidays': [['The kids still talk about it — and we actually relaxed!', 'The Mehta family', 'Dubai family week'], ['Planned around nap times. Genius.', 'Sunita A.', 'Singapore adventure'], ['Managed 18 of us without a single hiccup.', 'Aditya M.', 'Thailand group trip']],
  'meridian-travel': [['One invoice, zero chaos. Our finance team loves it.', 'Head of Operations', 'Technology company'], ['Our 120-person offsite ran perfectly.', 'HR Director', 'Consulting firm'], ['Fast changes when meetings move — always reachable.', 'Sales Manager', 'Manufacturing company']],
};
const FAQ_COMMON = [
  ['How do I book a package?', 'Send an enquiry from any package page or the contact form. Our team confirms availability and final pricing before anything is booked.'],
  ['Are the prices on this website final?', 'Prices shown are indicative starting prices per person. Final quotes depend on dates, hotels and group size.'],
  ['Can I customise an itinerary?', 'Yes — every package can be tailored to your dates, pace and budget.'],
  ['What payment options are available?', 'Our team will share secure payment options with your confirmed quotation.'],
  ['What is your cancellation policy?', 'Cancellation terms depend on the hotels and services booked and are shared with your quotation.'],
];

export const BUILDER_TEMPLATE_KEYS = T.map((t) => t.key);
export const LEGACY_THEME_MAP = Object.fromEntries(T.flatMap((t) => t.legacy.map((l) => [l, t.key])));
export const templateMeta = () => T.map((t) => ({ id: t.key, themeKey: t.key, name: t.name, category: t.category, description: t.description, primaryColor: t.brand.primary, secondaryColor: t.brand.secondary, font: t.brand.headingFont, previewImage: U(t.hero[2], 800), premium: true }));
export const findTemplate = (key) => T.find((t) => t.key === key) || T.find((t) => t.key === LEGACY_THEME_MAP[key]) || null;

const sec = (type, i, extra) => ({ id: `${type}-${i}`, type, hidden: false, align: 'left', bg: '', textColor: '', padding: 'normal', ...extra });

// Build a complete, editable builder document for one agency from a template.
export function buildTemplateBuilder(key, agencyName = 'Your Travel Agency') {
  const t = findTemplate(key);
  if (!t) return null;
  const name = agencyName || 'Your Travel Agency';
  const tours = t.tours.map(([title, destination, category, price, days, tag, img, summary, groupSize], i) => {
    const s = slug(title);
    return {
      id: `tour-${i + 1}`, slug: s, name: title, destination, category, price, currency: 'INR', duration: `${days} days / ${Math.max(days - 1, 0)} nights`, days, tag,
      difficulty: t.key === 'wild-trails' ? tag : '', groupSize, summary,
      description: `${summary} This illustrative itinerary shows the style of journey we arrange — dates, hotels and final pricing are confirmed with your personalised quotation.`,
      itinerary: Array.from({ length: Math.min(days, 8) }, (_, d) => ({ day: d + 1, title: d === 0 ? `Arrival in ${destination}` : (d === Math.min(days, 8) - 1 && days > 1 ? 'Departure' : t.acts[d % t.acts.length]), text: d === 0 ? `Welcome to ${destination}. ${t.acts[0]}.` : `${t.acts[d % t.acts.length]} in ${destination}.` })),
      inclusions: [...t.inc], exclusions: [...t.exc], image: U(img), imageAlt: `${title} — ${destination}`,
      gallery: [U(img, 1200), U(t.gallery[i % 6], 1200), U(t.gallery[(i + 2) % 6], 1200)],
      seoTitle: `${title} | ${name}`, seoDescription: `${summary} Illustrative ${days}-day ${category.toLowerCase()} package by ${name}.`, published: true, demo: true,
    };
  });
  const destinations = t.dests.map(([dn, region, img], i) => ({
    id: `dest-${i + 1}`, slug: slug(dn), name: dn, region, image: U(img), imageAlt: `${dn}, ${region}`,
    description: `${dn} (${region}) — one of our most-requested destinations. Browse the related packages below or ask us to tailor a trip.`, published: true, demo: true,
  }));
  const [hh, hs, himg] = t.hero; const [ah, at, aimg] = t.about;
  const S = {
    hero: sec('hero', 1, { heading: hh, subheading: hs, buttonLabel: t.key === 'meridian-travel' ? 'Request a proposal' : 'Explore packages', buttonHref: '/tours', secondaryLabel: 'Talk to an expert', secondaryHref: '/contact', image: U(himg, 2000), imageAlt: hh, align: t.layout.hero === 'editorial' ? 'center' : 'left' }),
    about: sec('about', 1, { heading: ah, text: at, image: U(aimg, 1400), imageAlt: ah, buttonLabel: 'About us', buttonHref: '/about' }),
    tours: sec('tours', 1, { heading: t.key === 'meridian-travel' ? 'Business travel programmes' : 'Featured packages', subheading: 'Illustrative sample packages — prices are indicative starting prices.', limit: 6, buttonLabel: 'View all packages', buttonHref: '/tours' }),
    destinations: sec('destinations', 1, { heading: 'Popular destinations', subheading: 'Where our travellers are heading.', limit: 6, buttonLabel: 'All destinations', buttonHref: '/destinations' }),
    categories: sec('categories', 1, { heading: t.key === 'roots-routes' ? 'Experiences' : 'Travel styles', subheading: '', items: t.cats.map(([label, img]) => ({ title: label, image: U(img, 900), imageAlt: label, href: `/tours?category=${encodeURIComponent(label)}` })) }),
    offers: sec('offers', 1, { heading: t.key === 'meridian-travel' ? 'Our services' : 'Featured offers', subheading: t.key === 'meridian-travel' ? '' : 'Illustrative offers — subject to availability and confirmation.', items: t.offers.map(([title, text, img, label]) => ({ title, text, image: U(img, 1000), imageAlt: title, label, href: '/contact' })) }),
    why: sec('why', 1, { heading: t.key === 'meridian-travel' ? 'Why companies choose us' : 'Why travel with us', items: t.why.map(([title, text]) => ({ title, text })) }),
    testimonials: sec('testimonials', 1, { heading: 'What travellers say', subheading: 'Illustrative demo testimonials — replace with real, verified reviews.', items: (TESTI[t.key] || []).map(([quote, author, trip]) => ({ quote, author, trip })) }),
    gallery: sec('gallery', 1, { heading: 'Gallery', items: t.gallery.map((g, i) => ({ image: U(g, 1000), imageAlt: `${t.name} gallery photo ${i + 1}` })) }),
    faqs: sec('faqs', 1, { heading: 'Frequently asked questions', items: FAQ_COMMON.map(([q, a]) => ({ q, a })) }),
    contact: sec('contact', 1, { heading: t.key === 'meridian-travel' ? 'Request a corporate travel proposal' : 'Plan your trip with us', text: 'Tell us where and when you would like to travel. We usually reply within one business day.', buttonLabel: 'Send enquiry' }),
  };
  return {
    template: t.key, version: 1, demo: true,
    brand: { ...t.brand, radius: t.brand.button === 'square' ? 2 : (t.brand.button === 'pill' ? 999 : 10), sectionBg: t.brand.accent },
    layout: { ...t.layout },
    header: {
      logo: '', businessName: name, tagline: t.description, sticky: true, bg: t.layout.hero === 'editorial' ? '#ffffff' : '', textColor: '', ctaLabel: t.key === 'meridian-travel' ? 'Get a proposal' : 'Enquire now', ctaHref: '/contact',
      showPhone: true, showWhatsapp: true, mobileMenuLabel: 'Menu',
      nav: [{ label: 'Home', href: '/' }, { label: t.key === 'meridian-travel' ? 'Programmes' : 'Packages', href: '/tours' }, { label: 'Destinations', href: '/destinations' }, { label: 'About', href: '/about' }, { label: 'FAQs', href: '/faqs' }, { label: 'Contact', href: '/contact' }],
    },
    contact: { email: 'hello@example.com', phone: '+91 00000 00000', whatsapp: '', address: 'Your office address (demo)', hours: 'Mon–Sat, 10:00–19:00', mapUrl: '' },
    social: { instagram: '', facebook: '', youtube: '', linkedin: '', x: '', tiktok: '' },
    footer: {
      description: `${name} — ${t.description}`,
      columns: [
        { title: 'Explore', links: [{ label: 'Packages', href: '/tours' }, { label: 'Destinations', href: '/destinations' }, { label: 'FAQs', href: '/faqs' }] },
        { title: 'Company', links: [{ label: 'About us', href: '/about' }, { label: 'Contact', href: '/contact' }] },
      ],
      copyright: `© {year} ${name}. All rights reserved.`, privacyHref: '', termsHref: '', demoNotice: 'Sample content shown for demonstration. Prices and offers are illustrative.',
    },
    sections: t.order.map((k) => S[k]).filter(Boolean),
    tours, destinations,
  };
}
