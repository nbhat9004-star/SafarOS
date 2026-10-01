// Safar Host / Service Provider categories — single source of truth.
// Structured (slug + label) so the FUTURE Trip Creator fulfillment engine can
// match trips to SERVICE CATEGORIES (not individual providers) without a rewrite.
// NOTE: "Hotel" is intentionally NOT a provider category (per product spec).
export const PROVIDER_CATEGORIES = [
  { slug: 'homestay',         label: 'Homestay',                    icon: '🏡' },
  { slug: 'houseboat',        label: 'Houseboat',                   icon: '🚤' },
  { slug: 'shikara',          label: 'Shikara Ride',                icon: '🛶' },
  { slug: 'transport',        label: 'Car Rental / Transport',      icon: '🚕' },
  { slug: 'bike-rental',      label: 'Bike Rental',                 icon: '🏍️' },
  { slug: 'restaurant',       label: 'Restaurant / Food',           icon: '🍽️' },
  { slug: 'guide',            label: 'Local Guide',                 icon: '🧭' },
  { slug: 'photography',      label: 'Photography',                 icon: '📸' },
  { slug: 'camping',          label: 'Camping',                     icon: '🏕️' },
  { slug: 'equipment',        label: 'Camping / Travel Equipment',  icon: '🎒' },
  { slug: 'airport-transfer', label: 'Airport Pickup / Drop',       icon: '🚐' },
  { slug: 'trekking',         label: 'Adventure / Trekking',        icon: '🏔️' },
  { slug: 'food-experience',  label: 'Local Food Experience',       icon: '🍲' },
  { slug: 'cultural',         label: 'Cultural / Local Experience', icon: '🎨' },
  { slug: 'shopping',         label: 'Local Shopping / Artisan',    icon: '🛍️' },
  { slug: 'other',            label: 'Other Travel Service',        icon: '✨' },
];

export const findProviderCategory = (slug) =>
  PROVIDER_CATEGORIES.find((c) => c.slug === slug) || null;
