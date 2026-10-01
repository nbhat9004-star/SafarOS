// Centralized, scalable Safar Services catalog.
// Each group has a label, color theme, and a list of services {id,label,icon}.
// Icon names are lucide-react component names — resolved via <Icons[icon] />.

export const SERVICE_GROUPS = [
  {
    id: 'accommodation',
    label: 'Accommodation',
    sub: 'Stays travelers can call home',
    color: 'emerald',
    services: [
      { id: 'entire_home',   label: 'Entire Home',    icon: 'Home' },
      { id: 'private_room',  label: 'Private Room',   icon: 'BedDouble' },
      { id: 'shared_room',   label: 'Shared Room',    icon: 'Users' },
      { id: 'cabin',         label: 'Cabin',          icon: 'TreePine' },
      { id: 'cottage',       label: 'Cottage',        icon: 'House' },
      { id: 'houseboat',     label: 'Houseboat',      icon: 'Anchor' },
      { id: 'villa',         label: 'Villa',          icon: 'Castle' },
      { id: 'camp_stay',     label: 'Camp Stay',      icon: 'Tent' },
      { id: 'homestay',      label: 'Homestay',       icon: 'Hotel' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    sub: 'Get around the valley with ease',
    color: 'mountain',
    services: [
      { id: 'car_rental',     label: 'Car Rental',     icon: 'Car' },
      { id: 'bike_rental',    label: 'Bike Rental',    icon: 'Bike' },
      { id: 'driver_service', label: 'Driver Service', icon: 'UserCog' },
      { id: 'airport_pickup', label: 'Airport Pickup', icon: 'PlaneLanding' },
      { id: 'airport_drop',   label: 'Airport Drop',   icon: 'PlaneTakeoff' },
      { id: 'private_taxi',   label: 'Private Taxi',   icon: 'CarTaxiFront' },
      { id: 'shared_taxi',    label: 'Shared Taxi',    icon: 'Users' },
    ],
  },
  {
    id: 'tourism',
    label: 'Tourism',
    sub: 'Guided journeys through Kashmir',
    color: 'gold',
    services: [
      { id: 'local_guide',     label: 'Local Tour Guide',  icon: 'Compass' },
      { id: 'sightseeing',     label: 'Sightseeing Tours', icon: 'Map' },
      { id: 'trekking_guide',  label: 'Trekking Guide',    icon: 'Mountain' },
      { id: 'photo_tour',      label: 'Photography Tour',  icon: 'Camera' },
      { id: 'shopping_guide',  label: 'Shopping Guide',    icon: 'ShoppingBag' },
      { id: 'snow_activities', label: 'Snow Activities',   icon: 'Snowflake' },
    ],
  },
  {
    id: 'cultural',
    label: 'Cultural Experiences',
    sub: 'Live the soul of Kashmir',
    color: 'gold',
    services: [
      { id: 'wazwan',         label: 'Kashmiri Wazwan',                 icon: 'Utensils' },
      { id: 'cooking',        label: 'Traditional Cooking',             icon: 'ChefHat' },
      { id: 'kehwa',          label: 'Kehwa Experience',                icon: 'Coffee' },
      { id: 'village_tour',   label: 'Village Tour',                    icon: 'Trees' },
      { id: 'cultural_night', label: 'Cultural Nights',                 icon: 'Music' },
      { id: 'traditional_photo', label: 'Traditional Clothing Photography', icon: 'Camera' },
    ],
  },
  {
    id: 'adventure',
    label: 'Adventure',
    sub: 'For the bold and curious',
    color: 'mountain',
    services: [
      { id: 'skiing',         label: 'Skiing',           icon: 'Snowflake' },
      { id: 'snowboarding',   label: 'Snowboarding',     icon: 'Mountain' },
      { id: 'camping',        label: 'Camping',          icon: 'Tent' },
      { id: 'horse_riding',   label: 'Horse Riding',     icon: 'Rabbit' },
      { id: 'river_rafting',  label: 'River Rafting',    icon: 'Waves' },
      { id: 'mountain_trek',  label: 'Mountain Trekking',icon: 'Mountain' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    sub: 'Flavors of the valley',
    color: 'emerald',
    services: [
      { id: 'breakfast',      label: 'Breakfast Included', icon: 'Croissant' },
      { id: 'homemade',       label: 'Homemade Meals',     icon: 'CookingPot' },
      { id: 'trad_dinner',    label: 'Traditional Dinner', icon: 'Utensils' },
      { id: 'bbq',            label: 'BBQ Setup',          icon: 'Flame' },
      { id: 'tea_kehwa',      label: 'Tea/Kehwa Service',  icon: 'Coffee' },
    ],
  },
];

// Flat index for fast lookups: id -> {service, group}
export const SERVICE_INDEX = (() => {
  const idx = {};
  for (const g of SERVICE_GROUPS) for (const s of g.services) idx[s.id] = { ...s, group: g.id, groupLabel: g.label };
  return idx;
})();

export const getService = (id) => SERVICE_INDEX[id];
export const getServicesByGroup = (groupId) => SERVICE_GROUPS.find(g => g.id === groupId)?.services || [];
export const allServiceIds = () => Object.keys(SERVICE_INDEX);
