// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

// Kashmir location coordinates mapping
const KASHMIR_LOCATIONS = {
  // Srinagar area
  'Dal Lake, Srinagar': { lat: 34.0911, lon: 74.8400 },
  'Dal Lake': { lat: 34.0911, lon: 74.8400 },
  'Nigeen Lake, Srinagar': { lat: 34.1200, lon: 74.8200 },
  'Nigeen Lake': { lat: 34.1200, lon: 74.8200 },
  'Srinagar': { lat: 34.0837, lon: 74.7973 },
  
  // Gulmarg
  'Gulmarg, Baramulla': { lat: 34.0484, lon: 74.3805 },
  'Gulmarg': { lat: 34.0484, lon: 74.3805 },
  
  // Pahalgam
  'Pahalgam, Anantnag': { lat: 34.0161, lon: 75.3150 },
  'Pahalgam': { lat: 34.0161, lon: 75.3150 },
  
  // Sonamarg
  'Sonamarg, Ganderbal': { lat: 34.3000, lon: 75.2900 },
  'Sonamarg': { lat: 34.3000, lon: 75.2900 },
  
  // Default Kashmir center
  'Kashmir': { lat: 34.0837, lon: 74.7973 },
};

// Get coordinates for a location string
export function getLocationCoordinates(location) {
  if (!location) return KASHMIR_LOCATIONS['Kashmir'];
  
  // Direct match
  if (KASHMIR_LOCATIONS[location]) {
    return KASHMIR_LOCATIONS[location];
  }
  
  // Partial match
  const normalized = location.toLowerCase();
  for (const [key, coords] of Object.entries(KASHMIR_LOCATIONS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return coords;
    }
  }
  
  // Default to Kashmir center
  return KASHMIR_LOCATIONS['Kashmir'];
}

// Calculate distance from user to listing
export function calculateListingDistance(userLat, userLon, listing) {
  const listingCoords = getLocationCoordinates(listing?.location);
  return calculateDistance(userLat, userLon, listingCoords.lat, listingCoords.lon);
}
