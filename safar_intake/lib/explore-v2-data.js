// Frontend-only mock data for the Explore Community module (Phase 1).
// No backend calls. Replace with API in Phase 2.

export const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=2000&q=80', // alpine lake, Kashmir
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=2000&q=80', // mountain range
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&q=80', // trek
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=2000&q=80', // road trip
];

export const CATEGORIES = [
  { id: 'trekking', label: 'Trekking', emoji: '\u{1F3D4}\uFE0F' },
  { id: 'camping', label: 'Camping', emoji: '\u26FA' },
  { id: 'road', label: 'Road Trips', emoji: '\u{1F697}' },
  { id: 'backpacking', label: 'Backpacking', emoji: '\u{1F392}' },
  { id: 'photography', label: 'Photography', emoji: '\u{1F4F8}' },
  { id: 'adventure', label: 'Adventure', emoji: '\u26F0\uFE0F' },
  { id: 'women', label: 'Women Only', emoji: '\u{1F469}' },
  { id: 'men', label: 'Men Only', emoji: '\u{1F468}' },
  { id: 'family', label: 'Family', emoji: '\u{1F46A}' },
  { id: 'bike', label: 'Bike Trips', emoji: '\u{1F3CD}\uFE0F' },
  { id: 'snow', label: 'Snow Treks', emoji: '\u2744\uFE0F' },
  { id: 'weekend', label: 'Weekend Trips', emoji: '\u{1F31E}' },
];

export const FEATURED_TRIPS = [
  { id: 't1', title: 'Kashmir Great Lakes', location: 'Sonamarg, J&K', host: 'Amaan', cover: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80', verified: true },
  { id: 't2', title: 'Chadar Frozen River', location: 'Zanskar, Ladakh', host: 'Faisal', cover: 'https://images.unsplash.com/photo-1516466823543-1a577dcaf1cf?w=800&q=80', verified: true },
  { id: 't3', title: 'Tarsar Marsar Trek', location: 'Aru Valley, J&K', host: 'Zoya', cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', verified: false },
  { id: 't4', title: 'Gurez Valley Camp', location: 'Gurez, J&K', host: 'Danish', cover: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', verified: true },
];

export const MORE_TRIPS = [
  { id: 't5', title: 'Doodhpathri Meadows', location: 'Budgam, J&K', host: 'Uzair', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', verified: true, dates: 'Jun 5 \u2013 Jun 9', joined: 6, max: 10, type: 'Camping', mode: 'safar' },
  { id: 't6', title: 'Sonamarg Sunrise Ride', location: 'Sonamarg, J&K', host: 'Rohit', cover: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', verified: false, dates: 'Jun 12 \u2013 Jun 14', joined: 8, max: 12, type: 'Bike', mode: 'self' },
  { id: 't7', title: 'Warwan Valley Backpack', location: 'Kishtwar, J&K', host: 'Sana', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', verified: true, dates: 'Jul 1 \u2013 Jul 8', joined: 4, max: 8, type: 'Backpacking', mode: 'safar' },
  { id: 't8', title: 'Aru \u2192 Kolahoi Trek', location: 'Pahalgam, J&K', host: 'Kabir', cover: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80', verified: true, dates: 'Aug 3 \u2013 Aug 10', joined: 5, max: 12, type: 'Trek', mode: 'safar' },
];

export const REWARD_CARDS = [
  { id: 'r1', reward: 'Free Camping Tent', icon: '\u26FA', unlocked: true },
  { id: 'r2', reward: 'Trek Voucher \u20B92000', icon: '\u{1F39F}\uFE0F', unlocked: true },
  { id: 'r3', reward: 'Free Homestay Night', icon: '\u{1F3E1}', unlocked: true },
  { id: 'r4', reward: 'Adventure Kit', icon: '\u{1F392}', unlocked: false },
  { id: 'r5', reward: 'Free Guided Trek', icon: '\u{1F3D4}\uFE0F', unlocked: false },
  { id: 'r6', reward: 'Photography Pack', icon: '\u{1F4F8}', unlocked: false },
  { id: 'r7', reward: 'Free Airport Pickup', icon: '\u2708\uFE0F', unlocked: false },
  { id: 'r8', reward: '20% off Gear', icon: '\u{1F3AB}', unlocked: false },
  { id: 'r9', reward: 'Mystery Grand Prize', icon: '\u{1F381}', unlocked: false },
];

export const REQUESTS_RECEIVED = [
  { id: 'rq1', name: 'Zeeshan Ali', mutual: 2, when: '2d ago', message: 'Hi! I\u2019d love to join your trip.', trip: 'Kashmir Great Lakes', avatar: 'https://i.pravatar.cc/80?img=15' },
  { id: 'rq2', name: 'Sara Malik', mutual: 1, when: '3d ago', message: 'This trip looks amazing! Can I join?', trip: 'Kashmir Great Lakes', avatar: 'https://i.pravatar.cc/80?img=25' },
  { id: 'rq3', name: 'Kabir Khan', mutual: 0, when: '5d ago', message: 'I have experience with this route.', trip: 'Chadar Trek', avatar: 'https://i.pravatar.cc/80?img=32' },
];

export const REQUESTS_SENT = [
  { id: 'sq1', trip: 'Gurez Valley Camp', host: 'Danish', when: '1d ago', status: 'pending', cover: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&q=80' },
  { id: 'sq2', trip: 'Tarsar Marsar Trek', host: 'Zoya', when: '4d ago', status: 'accepted', cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=80' },
];

export const CHAT_MESSAGES = [
  { id: 'm1', authorId: 'amaan', name: 'Amaan (Host)', avatar: 'https://i.pravatar.cc/80?img=12', text: 'Welcome everyone! Great to have you all on the trip.', time: '10:12 AM', kind: 'text', role: 'host' },
  { id: 'm2', authorId: 'you', name: 'You', text: 'Super excited! What should we pack for day 1?', time: '10:14 AM', kind: 'text', role: 'me' },
  { id: 'm3', authorId: 'zoya', name: 'Zoya', avatar: 'https://i.pravatar.cc/80?img=25', text: 'I made a shared checklist \u2013 tap below.', time: '10:16 AM', kind: 'text' },
  { id: 'm4', authorId: 'system', text: 'Shared: Trip Itinerary \u2014 6 days', time: '10:16 AM', kind: 'file', fileName: 'itinerary-v2.pdf', fileSize: '2.4 MB' },
  { id: 'm5', authorId: 'faisal', name: 'Faisal', avatar: 'https://i.pravatar.cc/80?img=33', text: '', kind: 'image', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80', time: '10:22 AM' },
  { id: 'm6', authorId: 'amaan', name: 'Amaan (Host)', avatar: 'https://i.pravatar.cc/80?img=12', kind: 'announcement', text: 'Pickup: Srinagar TRC, 5:30 AM sharp. Bring valid IDs.', time: '11:00 AM' },
  { id: 'm7', authorId: 'you', name: 'You', text: 'Copy! See you all tomorrow.', time: '11:03 AM', kind: 'text', role: 'me' },
];

export const HIGHLIGHTS = [
  { id: 'h1', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', user: 'Amaan', avatar: 'https://i.pravatar.cc/60?img=12', trip: 'Kashmir Great Lakes', likes: 428, badge: 'gold' },
  { id: 'h2', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80', user: 'Zoya', avatar: 'https://i.pravatar.cc/60?img=25', trip: 'Tarsar Marsar', likes: 312, badge: 'silver' },
  { id: 'h3', img: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80', user: 'Rohit', avatar: 'https://i.pravatar.cc/60?img=33', trip: 'Ladakh Road Trip', likes: 245, badge: 'silver' },
  { id: 'h4', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', user: 'Danish', avatar: 'https://i.pravatar.cc/60?img=42', trip: 'Gurez Camp', likes: 189, badge: 'bronze' },
  { id: 'h5', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', user: 'Faisal', avatar: 'https://i.pravatar.cc/60?img=51', trip: 'Chadar Trek', likes: 156, badge: 'bronze' },
  { id: 'h6', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', user: 'Sana', avatar: 'https://i.pravatar.cc/60?img=63', trip: 'Doodhpathri', likes: 122, badge: 'bronze' },
];

export const BADGES = {
  bronze: { label: 'Bronze Explorer', color: 'from-amber-500 to-orange-600', emoji: '\u{1F949}' },
  silver: { label: 'Silver Explorer', color: 'from-slate-300 to-slate-500', emoji: '\u{1F948}' },
  gold: { label: 'Gold Explorer', color: 'from-yellow-300 to-amber-500', emoji: '\u{1F947}' },
  platinum: { label: 'Platinum Explorer', color: 'from-cyan-200 to-indigo-400', emoji: '\u{1F48E}' },
  legendary: { label: 'Legendary Explorer', color: 'from-fuchsia-500 to-violet-600', emoji: '\u{1F3D4}\uFE0F' },
};

export const VERIFIED_SERVICES = [
  { id: 'stay', label: 'Accommodation', emoji: '\u{1F3E8}' },
  { id: 'transport', label: 'Transport', emoji: '\u{1F68C}' },
  { id: 'guide', label: 'Guides', emoji: '\u{1F9ED}' },
  { id: 'gear', label: 'Camping Gear', emoji: '\u26FA' },
  { id: 'bike', label: 'Bike Rental', emoji: '\u{1F3CD}\uFE0F' },
  { id: 'car', label: 'Car Rental', emoji: '\u{1F697}' },
  { id: 'photo', label: 'Photography', emoji: '\u{1F4F8}' },
  { id: 'meals', label: 'Meals', emoji: '\u{1F35C}' },
  { id: 'airport', label: 'Airport Pickup', emoji: '\u2708\uFE0F' },
  { id: 'activities', label: 'Activities', emoji: '\u{1F3AF}' },
];
