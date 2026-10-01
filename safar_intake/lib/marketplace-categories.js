// Single source of truth for the Safar Curated Marketplace categories.
// Each category is an INDIVIDUAL category (not a grouped block) and links to
// a dedicated listing page at /marketplace/<slug>. The `filter` object is
// passed as query params to /api/listings so we reuse the existing listings
// backend without any change.
//
// Order matches the ordering requested by the user (plus retained existing
// categories) so nothing is invented or removed.

export const MARKETPLACE_CATEGORIES = [
  // Stays
  { slug: 'hotels',            title: 'Hotels',              iconKey: 'Hotel',        color: 'emerald', filter: { category: 'stay',       subcategory: 'hotel' } },
  { slug: 'homestays',         title: 'Homestays',           iconKey: 'Home',         color: 'emerald', filter: { category: 'stay',       subcategory: 'homestay' } },
  { slug: 'houseboats',        title: 'Houseboats',          iconKey: 'Ship',         color: 'sky',     filter: { category: 'stay',       subcategory: 'houseboat' } },
  { slug: 'guest-houses',      title: 'Guest Houses',        iconKey: 'DoorOpen',     color: 'rose',    filter: { category: 'stay',       subcategory: 'guesthouse' } },
  { slug: 'resorts',           title: 'Resorts',             iconKey: 'Palmtree',     color: 'lime',    filter: { category: 'stay',       subcategory: 'resort' } },
  { slug: 'apartments',        title: 'Apartments',          iconKey: 'Building',     color: 'indigo',  filter: { category: 'stay',       subcategory: 'apartment' } },
  { slug: 'villas',            title: 'Villas',              iconKey: 'Building2',    color: 'violet',  filter: { category: 'stay',       subcategory: 'villa' } },
  { slug: 'camping',           title: 'Camping',             iconKey: 'Tent',         color: 'orange',  filter: { category: 'stay',       subcategory: 'camp' } },

  // Transport
  { slug: 'cars',              title: 'Cars',                iconKey: 'Car',          color: 'blue',    filter: { category: 'transport',  subcategory: 'car' } },
  { slug: 'bikes',             title: 'Bikes',               iconKey: 'Bike',         color: 'orange',  filter: { category: 'transport',  subcategory: 'bike' } },
  { slug: 'taxi',              title: 'Taxi',                iconKey: 'CarTaxiFront', color: 'yellow',  filter: { category: 'transport',  subcategory: 'taxi' } },
  { slug: 'airport-pickup',    title: 'Airport Pickup',      iconKey: 'PlaneLanding', color: 'sky',     filter: { category: 'transport',  subcategory: 'airport_pickup' } },
  { slug: 'airport-drop',      title: 'Airport Drop',        iconKey: 'PlaneTakeoff', color: 'indigo',  filter: { category: 'transport',  subcategory: 'airport_drop' } },

  // Guides & Tours
  { slug: 'tour-guides',       title: 'Tour Guides',         iconKey: 'UserCheck',    color: 'violet',  filter: { category: 'tour',       subcategory: 'guide' } },
  { slug: 'local-guides',      title: 'Local Guides',        iconKey: 'MapPinned',    color: 'violet',  filter: { category: 'tour',       subcategory: 'local_guide' } },
  { slug: 'tour-packages',     title: 'Tour Packages',       iconKey: 'MapPinned',    color: 'emerald', filter: { category: 'tour' } },
  { slug: 'religious-tours',   title: 'Religious Tours',     iconKey: 'Church',       color: 'amber',   filter: { category: 'tour',       subcategory: 'religious' } },

  // Experiences & Activities
  { slug: 'experiences',       title: 'Experiences',         iconKey: 'Compass',      color: 'teal',    filter: { category: 'experience' } },
  { slug: 'activities',        title: 'Activities',          iconKey: 'Activity',     color: 'fuchsia', filter: { category: 'experience', subcategory: 'activity' } },
  { slug: 'shikara-ride',      title: 'Shikara Ride',        iconKey: 'Waves',        color: 'cyan',    filter: { category: 'experience', subcategory: 'shikara' } },
  { slug: 'gondola-tickets',   title: 'Gondola Tickets',     iconKey: 'CableCar',     color: 'amber',   filter: { category: 'experience', subcategory: 'gondola' } },
  { slug: 'trekking',          title: 'Trekking',            iconKey: 'Footprints',   color: 'green',   filter: { category: 'experience', subcategory: 'trekking' } },
  { slug: 'photography',       title: 'Photography',         iconKey: 'Camera',       color: 'purple',  filter: { category: 'experience', subcategory: 'photography' } },
  { slug: 'food-experiences',  title: 'Food Experiences',    iconKey: 'Utensils',     color: 'orange',  filter: { category: 'experience', subcategory: 'food' } },

  // Shopping
  { slug: 'shopping-tours',    title: 'Shopping Tours',      iconKey: 'ShoppingBag',  color: 'pink',    filter: { category: 'shopping',   subcategory: 'tour' } },
  { slug: 'travel-essentials', title: 'Travel Essentials',   iconKey: 'ShoppingBag',  color: 'amber',   filter: { category: 'shopping' } },
];

// Tailwind color mapping so tiles can render statically without dynamic classes.
export const COLOR_MAP = {
  emerald:  { bg: 'bg-emerald-100',  text: 'text-emerald-700',  chipBg: 'bg-emerald-50',  chipText: 'text-emerald-700' },
  sky:      { bg: 'bg-sky-100',      text: 'text-sky-700',      chipBg: 'bg-sky-50',      chipText: 'text-sky-700' },
  rose:     { bg: 'bg-rose-100',     text: 'text-rose-600',     chipBg: 'bg-rose-50',     chipText: 'text-rose-600' },
  lime:     { bg: 'bg-lime-100',     text: 'text-lime-700',     chipBg: 'bg-lime-50',     chipText: 'text-lime-700' },
  indigo:   { bg: 'bg-indigo-100',   text: 'text-indigo-700',   chipBg: 'bg-indigo-50',   chipText: 'text-indigo-700' },
  violet:   { bg: 'bg-violet-100',   text: 'text-violet-700',   chipBg: 'bg-violet-50',   chipText: 'text-violet-700' },
  orange:   { bg: 'bg-orange-100',   text: 'text-orange-600',   chipBg: 'bg-orange-50',   chipText: 'text-orange-600' },
  blue:     { bg: 'bg-blue-100',     text: 'text-blue-700',     chipBg: 'bg-blue-50',     chipText: 'text-blue-700' },
  yellow:   { bg: 'bg-yellow-100',   text: 'text-yellow-700',   chipBg: 'bg-yellow-50',   chipText: 'text-yellow-700' },
  teal:     { bg: 'bg-teal-100',     text: 'text-teal-700',     chipBg: 'bg-teal-50',     chipText: 'text-teal-700' },
  fuchsia:  { bg: 'bg-fuchsia-100',  text: 'text-fuchsia-600',  chipBg: 'bg-fuchsia-50',  chipText: 'text-fuchsia-600' },
  cyan:     { bg: 'bg-cyan-100',     text: 'text-cyan-700',     chipBg: 'bg-cyan-50',     chipText: 'text-cyan-700' },
  amber:    { bg: 'bg-amber-100',    text: 'text-amber-600',    chipBg: 'bg-amber-50',    chipText: 'text-amber-600' },
  green:    { bg: 'bg-green-100',    text: 'text-green-700',    chipBg: 'bg-green-50',    chipText: 'text-green-700' },
  purple:   { bg: 'bg-purple-100',   text: 'text-purple-700',   chipBg: 'bg-purple-50',   chipText: 'text-purple-700' },
  pink:     { bg: 'bg-pink-100',     text: 'text-pink-600',     chipBg: 'bg-pink-50',     chipText: 'text-pink-600' },
  slate:    { bg: 'bg-slate-100',    text: 'text-slate-700',    chipBg: 'bg-slate-50',    chipText: 'text-slate-700' },
};

export function findCategoryBySlug(slug) {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug === slug) || null;
}
