// ============================================================================
// AI AGENT CONTENT LIBRARY
// Realistic Kashmiri names, profile photos, listing/trip templates and
// message templates used by the AI Agent Manager. All content is realistic
// and platform-native — no placeholders, no cartoon avatars.
// ============================================================================

export const MALE_NAMES = [
  'Aamir', 'Aaqib', 'Adil', 'Aijaz', 'Arif', 'Bilal', 'Danish', 'Faisal',
  'Farhan', 'Hilal', 'Irfan', 'Junaid', 'Nadeem', 'Nisar', 'Parvez', 'Rashid',
  'Sameer', 'Shabir', 'Shahid', 'Shahnawaz', 'Tariq', 'Yasir', 'Yawar', 'Zubair',
  'Mudasir', 'Owais', 'Suhail', 'Umar', 'Basit', 'Imtiyaz',
];
export const FEMALE_NAMES = [
  'Aaliya', 'Afreen', 'Ameena', 'Asma', 'Fariha', 'Hina', 'Humaira', 'Iqra',
  'Madiha', 'Mehvish', 'Nazia', 'Rukhsar', 'Saba', 'Sadia', 'Shazia', 'Uzma',
  'Zareen', 'Anisa', 'Farheen', 'Ifra', 'Nashra', 'Rafia', 'Sana', 'Tabinda',
];
export const SURNAMES = [
  'Wani', 'Bhat', 'Dar', 'Mir', 'Sheikh', 'Khan', 'Malik', 'Lone', 'Rather',
  'Ganie', 'Andrabi', 'Reshi', 'Sofi', 'Shah', 'Parray', 'Kumar', 'Naikoo',
  'Padder', 'Zargar', 'Beigh',
];

// randomuser.me portraits — royalty-free realistic faces (no cartoons, no placeholders).
export const MALE_PHOTOS = Array.from({ length: 30 }, (_, i) => `https://randomuser.me/api/portraits/men/${(i * 3 + 5) % 99}.jpg`);
export const FEMALE_PHOTOS = Array.from({ length: 24 }, (_, i) => `https://randomuser.me/api/portraits/women/${(i * 3 + 7) % 99}.jpg`);

// Kashmir destinations bank with lat/lng for map pins.
export const DESTINATIONS = [
  { name: 'Srinagar',  district: 'Srinagar',   lat: 34.0837, lng: 74.7973 },
  { name: 'Gulmarg',   district: 'Baramulla',  lat: 34.0484, lng: 74.3805 },
  { name: 'Pahalgam',  district: 'Anantnag',   lat: 34.0161, lng: 75.3153 },
  { name: 'Sonamarg',  district: 'Ganderbal',  lat: 34.3050, lng: 75.2933 },
  { name: 'Gurez',     district: 'Bandipora',  lat: 34.6392, lng: 74.8378 },
  { name: 'Yusmarg',   district: 'Budgam',     lat: 33.8321, lng: 74.6570 },
  { name: 'Doodhpathri', district: 'Budgam',   lat: 33.8654, lng: 74.4900 },
  { name: 'Bhaderwah', district: 'Doda',       lat: 32.9877, lng: 75.7183 },
  { name: 'Kupwara',   district: 'Kupwara',    lat: 34.5310, lng: 74.2540 },
  { name: 'Aharbal',   district: 'Kulgam',     lat: 33.6600, lng: 74.7500 },
];

// Listing templates by category — realistic titles + descriptions + price range.
export const LISTING_TEMPLATES = {
  stay: [
    { sub: 'houseboat', title: 'Royal Cedar Houseboat on Dal Lake', desc: 'Handcrafted cedar houseboat with three deluxe rooms, chinar-wood interiors, and shikara boat included. Wake up to sunrise over Dal Lake.', min: 3800, max: 8500 },
    { sub: 'homestay', title: 'Chinar Valley Homestay', desc: 'Family-run Kashmiri homestay surrounded by walnut orchards. Home-cooked Wazwan meals, cosy kangri warmth in winter.', min: 1800, max: 3800 },
    { sub: 'cottage', title: 'Alpine Meadow Cottage', desc: 'Pine cottage nestled in an alpine meadow with valley views. Private garden, wood stove and stargazing deck.', min: 3200, max: 6500 },
    { sub: 'cabin', title: 'Deodar Forest Cabin', desc: 'Rustic deodar cabin with hearth and mountain-facing veranda. Ideal for writers, photographers and slow travellers.', min: 2800, max: 5200 },
    { sub: 'guesthouse', title: 'Heritage Guest House', desc: 'Century-old Kashmiri manor lovingly restored. Papier-mâché ceilings, walnut carvings, warm hospitality.', min: 2200, max: 4800 },
  ],
  transport: [
    { sub: 'cab', title: 'Innova Crysta with Local Driver', desc: '7-seater premium sedan with experienced Kashmiri driver. Airport pickup, day sightseeing and long-distance routes covered.', min: 2500, max: 4500 },
    { sub: 'car', title: 'Self-Drive Compact SUV', desc: 'Well-maintained SUV with full insurance and roadside assistance. Perfect for family road trips across Kashmir.', min: 1900, max: 3800 },
    { sub: 'bike', title: 'Royal Enfield Himalayan Rental', desc: 'Freshly serviced Himalayans with helmets, saddlebags and 24×7 support. Ride Zoji La, Sinthan Top, Gurez.', min: 1400, max: 2400 },
    { sub: 'transfer', title: 'Airport → Srinagar Sedan Transfer', desc: 'Direct comfortable sedan transfer with meet-and-greet. Bottled water, phone charger and Wi-Fi included.', min: 900, max: 1800 },
  ],
  experience: [
    { sub: 'shikara', title: 'Dal Lake Sunrise Shikara Ride', desc: 'Two-hour paddled shikara at dawn — floating vegetable market, kingfishers and misty ripples. Kahwa on board.', min: 800, max: 1600 },
    { sub: 'trek', title: 'Tarsar Marsar Alpine Trek', desc: 'Four-day guided trek to Kashmir\u2019s twin alpine lakes. Camping, meals and porter support included.', min: 12000, max: 18000 },
    { sub: 'camping', title: 'Aru Valley Riverside Camping', desc: 'Two-night camping by the Lidder river with bonfire, barbecue and stargazing under Pahalgam skies.', min: 3200, max: 5800 },
    { sub: 'paragliding', title: 'Paragliding at Astanmarg', desc: 'Tandem paragliding above pine-clad valleys with certified pilots. Photo/video of your flight included.', min: 2400, max: 4200 },
    { sub: 'rafting', title: 'Lidder River White-Water Rafting', desc: 'Grade II-III river rafting with safety gear and experienced instructors. Perfect for first-timers and families.', min: 1200, max: 2200 },
    { sub: 'saffron', title: 'Pampore Saffron Farm Tour', desc: 'Guided walk through blooming saffron fields, live threshing and a tasting of Kashmiri Kahwa.', min: 700, max: 1400 },
    { sub: 'wazwan', title: 'Traditional Wazwan Cooking Experience', desc: 'Cook and eat a seven-course Wazwan feast with a Kashmiri chef. Recipes and stories included.', min: 1800, max: 3400 },
  ],
  tour: [
    { sub: 'guide', title: 'Certified Kashmir Local Guide', desc: 'IATO-licensed local guide fluent in English/Hindi/Urdu. Custom itineraries, cultural stories and photo stops.', min: 1500, max: 3200 },
    { sub: 'photography', title: 'Photography Walk with a Local Storyteller', desc: 'Half-day photography walk through Nishat, Shalimar and old Srinagar with prime spots and cultural context.', min: 1800, max: 3200 },
    { sub: 'heritage', title: 'Heritage Old-Town Walking Tour', desc: 'Guided walking tour through Downtown Srinagar\u2019s shrines, papier-mâché ateliers and hidden courtyards.', min: 1200, max: 2400 },
  ],
};

// Trip templates for Explore
export const TRIP_TEMPLATES = [
  { name: 'Autumn in Pahalgam — Chinar Trail', theme: 'photography', desc: 'A slow-paced chinar-photography meetup during peak autumn. Small group, plenty of stops, warm cups of kahwa.' },
  { name: 'Gulmarg Snow Weekend', theme: 'weekend_escape', desc: 'Two nights in Gulmarg with the Gondola, snow sports and evening bonfires. Ideal for first-time snow travellers.' },
  { name: 'Sinthan Top Bike Expedition', theme: 'road_trip', desc: 'Four-day motorbike expedition from Srinagar → Anantnag → Sinthan Top → Kishtwar. Enfields only.' },
  { name: 'Gurez Valley Explorer', theme: 'adventure', desc: 'Off-the-beaten-path five-day journey to the emerald Habba Khatoon valley. Homestays with Dard-Shina families.' },
  { name: 'Kashmir Food Trail', theme: 'food', desc: 'A curated four-day food journey — Wazwan, bakerkhani, kahwa houses and hidden trout kitchens.' },
  { name: 'Sonamarg Tarsar Trek', theme: 'trekking', desc: 'Guided four-day trek to Tarsar Lake. All-inclusive camping, meals and porters.' },
  { name: 'Doodhpathri Family Weekend', theme: 'family', desc: 'Kid-friendly weekend in the meadows of Doodhpathri. Pony rides, picnics and simple hikes.' },
  { name: 'Yusmarg Solo Retreat', theme: 'weekend_escape', desc: 'A quiet solo-friendly retreat in Yusmarg with journaling walks and Kashmiri chai stops.' },
  { name: 'Bhaderwah Wildflower Walks', theme: 'photography', desc: 'Late-summer wildflower photography meetup across Bhaderwah\u2019s alpine meadows.' },
  { name: 'Aru Valley Weekend Camp', theme: 'adventure', desc: 'Riverside camping and short treks around Aru with campfire dinners and stargazing.' },
];

// Realistic review lines (per rating band).
export const REVIEW_LINES = [
  'The host was warm, welcoming and clearly proud of Kashmir — highly recommend.',
  'Every meal felt like a family gathering. Loved the Wazwan evening.',
  'Great value, spotlessly clean, and the location is stunning at sunrise.',
  'Booking was smooth and the driver was punctual. Will use Safar again.',
  'A rare, authentic experience — felt like being invited into a friend\u2019s home.',
  'Beautiful property, thoughtful details, only wish we could have stayed longer.',
  'The trek guides were fantastic — safe, kind and full of local stories.',
];

// Personality profiles for messenger tone.
export const PERSONALITIES = [
  { key: 'warm',       tone: 'warm and welcoming', emoji: '🌸' },
  { key: 'concise',    tone: 'concise and practical', emoji: '📌' },
  { key: 'enthusiastic', tone: 'enthusiastic and upbeat', emoji: '⛰️' },
  { key: 'thoughtful', tone: 'thoughtful and reflective', emoji: '☕' },
  { key: 'humorous',   tone: 'lightly humorous', emoji: '😊' },
];

// Message templates keyed by intent — the runner picks one at random and
// interpolates context (trip name, sender name). This keeps zero-dep replies
// natural. If EMERGENT_LLM_KEY is available the runner will use it instead.
export const MESSAGE_TEMPLATES = {
  greet: [
    'Salaam {name}! Excited to have you on {trip}. Any questions before we start?',
    'Hey {name}, welcome aboard {trip}! Let me know if you\u2019d like tips on packing.',
    'Assalamu alaikum {name}! Looking forward to travelling together on {trip}.',
  ],
  ask_meeting: [
    'Shall we finalise the meeting spot for {trip}? I\u2019m thinking Srinagar airport, 9 AM.',
    'What\u2019s a comfortable meeting time for you on the first day of {trip}?',
  ],
  thanks: [
    'Thank you for being part of {trip} — the trail felt lighter with you along.',
    'Grateful for a wonderful {trip}. Safe travels back home!',
  ],
  itinerary: [
    'Day 1 is a relaxed arrival — houseboat check-in, evening shikara. Day 2 we drive to Pahalgam.',
    'Route: Srinagar → Sonamarg → Zoji La (photo stop) → back to Srinagar for a Wazwan dinner.',
    'We keep mornings early for light. Post-lunch is flexible so folks can rest or explore.',
  ],
  confirm: [
    'Perfect — see you at the meeting point. Save my number in case of last-minute updates.',
    'Great, count me in. I\u2019ll bring the extra rain shells for the group.',
  ],
};

// -------- helpers --------
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
export function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function randomFuture(daysMin = 5, daysMax = 60) {
  const d = new Date(); d.setDate(d.getDate() + randomInt(daysMin, daysMax)); return d;
}

export function generateAgentIdentity(gender, used = new Set()) {
  const first = gender === 'female' ? pick(FEMALE_NAMES) : pick(MALE_NAMES);
  const last = pick(SURNAMES);
  let name = `${first} ${last}`;
  let attempts = 0;
  while (used.has(name.toLowerCase()) && attempts < 8) {
    name = `${first} ${pick(SURNAMES)}`; attempts++;
  }
  const photos = gender === 'female' ? FEMALE_PHOTOS : MALE_PHOTOS;
  const email = `${first.toLowerCase()}.${last.toLowerCase()}.${Math.random().toString(36).slice(2, 6)}@safar-ai.local`;
  return {
    name,
    email,
    avatar: pick(photos),
    personality: pick(PERSONALITIES).key,
    tone: PERSONALITIES.find((p) => p.key === (used ? undefined : undefined)) || pick(PERSONALITIES),
  };
}

// Interpolate {placeholder} tokens against ctx.
export function interpolate(template, ctx) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? ctx[k] : ''));
}
