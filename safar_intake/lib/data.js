// Centralized mock data for Safar Kashmir marketplace.
// All images sourced via vision_expert_agent.
//
// PERF: All image URLs include `auto=format&w=1600&q=70&fit=crop` (Unsplash) or `w=1200` (Pexels)
// so the CDN returns AVIF/WebP at ~150–250KB instead of the original 4–7MB JPGs.
// `auto=format` tells Unsplash to honor the browser's Accept header and serve AVIF/WebP automatically.

const U = (id, ixid) =>
  `https://images.unsplash.com/photo-${id}?ixid=${ixid}&ixlib=rb-4.1.0&auto=format&fit=crop&w=1600&q=70`;

const P = (id, w = 1200, h = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

export const IMG = {
  dal1: U('1641910389345-5a30d4c01d90', 'M3w4NjY2NzZ8MHwxfHNlYXJjaHw0fHxEYWwlMjBMYWtlfGVufDB8fHx8MTc3OTI4OTE5M3ww'),
  dal2: U('1564329494258-3f72215ba175', 'M3w4NjY2NzZ8MHwxfHNlYXJjaHwzfHxEYWwlMjBMYWtlfGVufDB8fHx8MTc3OTI4OTE5M3ww'),
  dal3: U('1600845747913-e33543f94892', 'M3w4NjY2NzZ8MHwxfHNlYXJjaHwyfHxEYWwlMjBMYWtlfGVufDB8fHx8MTc3OTI4OTE5M3ww'),
  dal4: P('35255985'),
  mtn1: U('1621232082074-1a7750ecc557', 'M3w4NjA1MDZ8MHwxfHNlYXJjaHwzfHxLYXNobWlyJTIwbW91bnRhaW5zfGVufDB8fHx8MTc3OTI4OTE5M3ww'),
  mtn2: U('1627894485200-b92fb4353967', 'M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxLYXNobWlyJTIwbW91bnRhaW5zfGVufDB8fHx8MTc3OTI4OTE5M3ww'),
  mtn3: U('1567601169793-64703dc5324a', 'M3w4NjA1MDZ8MHwxfHNlYXJjaHw0fHxLYXNobWlyJTIwbW91bnRhaW5zfGVufDB8fHx8MTc3OTI4OTE5M3ww'),
  mtn4: P('29676598'),
  hb1: U('1593693401060-9fc28cf9e368', 'M3w4NjAzNDR8MHwxfHNlYXJjaHw0fHxob3VzZWJvYXR8ZW58MHx8fHwxNzc5Mjg5MTkzfDA'),
  hb2: U('1593693397690-362cb9666fc2', 'M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxob3VzZWJvYXR8ZW58MHx8fHwxNzc5Mjg5MTkzfDA'),
  hb3: P('5349466'),
  hb4: P('12950219'),
  cab1: U('1548704806-0c20f7ea6474', 'M3w4NjY2NjV8MHwxfHNlYXJjaHwyfHxzbm93JTIwY2FiaW58ZW58MHx8fHwxNzc5Mjg5MjA0fDA'),
  cab2: U('1510798831971-661eb04b3739', 'M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxzbm93JTIwY2FiaW58ZW58MHx8fHwxNzc5Mjg5MjA0fDA'),
  cot1: U('1485845851308-a8e2a1d04827', 'M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGNvdHRhZ2V8ZW58MHx8fHwxNzc5Mjg5MjA0fDA'),
  cot2: P('13496900'),
  shi1: U('1657697488985-a1f51bf82c32', 'M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxzaGlrYXJhJTIwYm9hdHxlbnwwfHx8fDE3NzkyODkyMDR8MA'),
  shi2: U('1590405058961-bb71750bb1f5', 'M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxzaGlrYXJhJTIwYm9hdHxlbnwwfHx8fDE3NzkyODkyMDR8MA'),
  shi3: P('28944985'),
  shi4: U('1673636502743-7b1b34a751a6', 'M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzaGlrYXJhJTIwYm9hdHxlbnwwfHx8fDE3NzkyODkyMDR8MA'),
};

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Sparkles' },
  { id: 'houseboat', label: 'Houseboats', icon: 'Anchor' },
  { id: 'cabin', label: 'Cabins', icon: 'TreePine' },
  { id: 'cottage', label: 'Cottages', icon: 'Home' },
  { id: 'home', label: 'Homes', icon: 'House' },
  { id: 'camp', label: 'Camps', icon: 'Tent' },
  { id: 'tour', label: 'Tours', icon: 'Map' },
  { id: 'transport', label: 'Transport', icon: 'Car' },
  { id: 'experience', label: 'Cultural', icon: 'Utensils' },
];

export const LISTINGS = [
  { id: 'l1', title: 'Royal Cedar Houseboat — Dal Lake', category: 'houseboat', location: 'Dal Lake, Srinagar', price: 6800, rating: 4.96, reviews: 312, beds: 3, baths: 3, guests: 6, host: { name: 'Ishfaq Ahmad', avatar: 'https://i.pravatar.cc/96?img=12', superhost: true }, image: IMG.hb1, gallery: [IMG.hb1, IMG.hb2, IMG.dal1, IMG.dal2], badge: 'Heritage', amenities: ['Wood-carved interiors','Lake-view deck','Wazwan dinner','Wi-Fi','Heater'], services: ['houseboat','wazwan','kehwa','breakfast','trad_dinner','airport_pickup','local_guide'], featured: true },
  { id: 'l2', title: 'Pinepeak Snow Cabin — Gulmarg', category: 'cabin', location: 'Gulmarg, Baramulla', price: 9200, rating: 4.92, reviews: 184, beds: 2, baths: 2, guests: 4, host: { name: 'Mehnaz Bhat', avatar: 'https://i.pravatar.cc/96?img=47', superhost: true }, image: IMG.cab1, gallery: [IMG.cab1, IMG.cab2, IMG.mtn1, IMG.mtn3], badge: 'Ski-in/Ski-out', amenities: ['Fireplace','Mountain view','Heated floors','Ski storage','Hot chocolate bar'], services: ['cabin','skiing','snowboarding','snow_activities','breakfast','homemade','bbq','airport_pickup'], featured: true },
  { id: 'l3', title: 'Apple Orchard Cottage — Pahalgam', category: 'cottage', location: 'Pahalgam, Anantnag', price: 4500, rating: 4.88, reviews: 226, beds: 2, baths: 1, guests: 4, host: { name: 'Bilal Wani', avatar: 'https://i.pravatar.cc/96?img=15', superhost: false }, image: IMG.cot1, gallery: [IMG.cot1, IMG.cot2, IMG.mtn4], badge: 'Family Pick', amenities: ['Garden','River walk','Bonfire','Breakfast included','Parking'], services: ['cottage','breakfast','village_tour','horse_riding','trad_dinner','tea_kehwa'], featured: true },
  { id: 'l4', title: 'Glacier Camp — Sonamarg', category: 'camp', location: 'Sonamarg, Ganderbal', price: 3200, rating: 4.81, reviews: 142, beds: 1, baths: 1, guests: 2, host: { name: 'Tariq Lone', avatar: 'https://i.pravatar.cc/96?img=33', superhost: false }, image: IMG.mtn2, gallery: [IMG.mtn2, IMG.mtn4, IMG.mtn1], badge: 'Adventure', amenities: ['Glacier trek','Sleeping bags','Stargazing','Bonfire','Local meals'], services: ['camp_stay','camping','mountain_trek','trekking_guide','bbq','homemade'] },
  { id: 'l5', title: 'Heritage Kashmiri Home — Old Srinagar', category: 'home', location: 'Rainawari, Srinagar', price: 3800, rating: 4.85, reviews: 96, beds: 4, baths: 2, guests: 8, host: { name: 'Shazia Mir', avatar: 'https://i.pravatar.cc/96?img=44', superhost: true }, image: IMG.dal3, gallery: [IMG.dal3, IMG.dal4, IMG.hb3], badge: 'Authentic', amenities: ['Walnut woodwork','Kangri provided','Kahwa','Family-run','Walking tours'], services: ['homestay','entire_home','wazwan','kehwa','cooking','village_tour','traditional_photo'] },
  { id: 'l6', title: 'Floating Royal Suite — Nigeen Lake', category: 'houseboat', location: 'Nigeen Lake, Srinagar', price: 8400, rating: 4.94, reviews: 271, beds: 2, baths: 2, guests: 4, host: { name: 'Imtiaz Dar', avatar: 'https://i.pravatar.cc/96?img=22', superhost: true }, image: IMG.hb2, gallery: [IMG.hb2, IMG.hb4, IMG.dal2], badge: 'Editor’s Choice', amenities: ['Private deck','Sunset shikara','Butler service','Hammam'], services: ['houseboat','private_room','wazwan','kehwa','cultural_night','photo_tour','airport_pickup','private_taxi'], featured: true },
  { id: 'l7', title: 'Shikara Sunset Ride — Dal Lake', category: 'experience', location: 'Boulevard, Srinagar', price: 1200, rating: 4.97, reviews: 412, duration: '90 min', host: { name: 'Aijaz Bhat', avatar: 'https://i.pravatar.cc/96?img=8', superhost: true }, image: IMG.shi1, gallery: [IMG.shi1, IMG.shi2, IMG.shi3], badge: 'Top Experience', amenities: ['Local rower','Kahwa onboard','Photography stops','Floating market'], services: ['sightseeing','photo_tour','kehwa','local_guide','cultural_night'] },
  { id: 'l8', title: 'Wazwan Royal Feast Experience', category: 'experience', location: 'Downtown Srinagar', price: 2500, rating: 4.91, reviews: 188, duration: '3 hrs', host: { name: 'Chef Ghulam Rasool', avatar: 'https://i.pravatar.cc/96?img=68', superhost: true }, image: IMG.dal4, gallery: [IMG.dal4, IMG.dal2], badge: 'Cultural', amenities: ['7-course Wazwan','Tarami sharing','Kahwa','Cultural intro'], services: ['wazwan','cooking','kehwa','trad_dinner','cultural_night'] },
  { id: 'l9', title: 'Airport Pickup — Premium Sedan', category: 'transport', location: 'Srinagar Airport', price: 1500, rating: 4.86, reviews: 522, duration: 'On-demand', host: { name: 'Kashmir Wheels', avatar: 'https://i.pravatar.cc/96?img=11', superhost: false }, image: IMG.mtn3, gallery: [IMG.mtn3], badge: '24/7', amenities: ['Meet & greet','Bottled water','Wi-Fi','Free wait 60 min'], services: ['airport_pickup','airport_drop','private_taxi','driver_service','car_rental'] },
  { id: 'l10', title: 'Royal Enfield Himalayan Rental', category: 'transport', location: 'Lal Chowk, Srinagar', price: 1800, rating: 4.79, reviews: 209, duration: 'Per day', host: { name: 'Valley Rides', avatar: 'https://i.pravatar.cc/96?img=51', superhost: false }, image: IMG.mtn4, gallery: [IMG.mtn4, IMG.mtn1], badge: 'Adventure', amenities: ['Helmet included','Saddle bags','Roadside assist','GPS'], services: ['bike_rental','driver_service','sightseeing'] },
  { id: 'l11', title: 'Gulmarg Gondola + Local Guide', category: 'tour', location: 'Gulmarg', price: 3800, rating: 4.93, reviews: 311, duration: 'Full day', host: { name: 'Aarif Tour Co.', avatar: 'https://i.pravatar.cc/96?img=5', superhost: true }, image: IMG.mtn1, gallery: [IMG.mtn1, IMG.cab1, IMG.cab2], badge: 'Bestseller', amenities: ['Gondola Phase 1+2','Local guide','Hot lunch','Pickup'], services: ['sightseeing','local_guide','snow_activities','airport_pickup','private_taxi','photo_tour'] },
  { id: 'l12', title: 'Pahalgam Valley Day Tour', category: 'tour', location: 'Pahalgam', price: 2900, rating: 4.84, reviews: 244, duration: 'Full day', host: { name: 'Liyaqat Travels', avatar: 'https://i.pravatar.cc/96?img=18', superhost: false }, image: IMG.cot2, gallery: [IMG.cot2, IMG.cot1, IMG.mtn4], badge: 'Family', amenities: ['Aru valley','Betaab valley','Chandanwari','Lunch'], services: ['sightseeing','horse_riding','mountain_trek','local_guide','river_rafting','shopping_guide'] },
];

export const TESTIMONIALS = [
  { name: 'Aanya Sharma', city: 'Mumbai', text: 'Safar made our Kashmir honeymoon truly magical. The houseboat host treated us like family and the AI plan saved us hours.', rating: 5 },
  { name: 'Rohan Iyer', city: 'Bengaluru', text: 'Booked a Gulmarg cabin and a Royal Enfield through Safar. Everything synced beautifully — felt like a luxury concierge.', rating: 5 },
  { name: 'Saira Khan', city: 'Delhi', text: 'The Wazwan experience was unforgettable. Local hosts, authentic food, premium curation. 10/10.', rating: 5 },
];

export const STATS = [
  { value: '12,400+', label: 'Verified stays' },
  { value: '1.2K', label: 'Local hosts' },
  { value: '4.92★', label: 'Average rating' },
  { value: '98%', label: 'Loved trips' },
];

export const AI_PROMPT_SUGGESTIONS = [
  'Plan a 5-day Kashmir honeymoon under ₹40,000',
  'Weekend ski trip to Gulmarg for 2 friends',
  'Family vacation: Srinagar + Pahalgam, 7 days',
  'Solo photography tour in old-city Srinagar',
];
