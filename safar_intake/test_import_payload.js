// Quick test to verify import payload structure
const testBusinesses = [
  {
    placeId: "test-place-123",
    name: "Test Restaurant",
    address: "123 Test St, Test City",
    phone: "+1234567890",
    website: "https://test.com",
    coordinates: { lat: 34.08, lng: 74.79 },
    rating: 4.5,
    reviewCount: 100,
    category: "restaurant",
    openingHours: ["Monday: 9:00 AM - 5:00 PM"],
    photos: [{ reference: "ref1", url: "https://example.com/photo1.jpg" }],
    businessStatus: "OPERATIONAL",
    googleMapsUrl: "https://maps.google.com/?cid=123"
  }
];

console.log("Testing business array structure:");
console.log("Array length:", testBusinesses.length);
console.log("First business keys:", Object.keys(testBusinesses[0]));
console.log("First business name:", testBusinesses[0].name);
console.log("First business placeId:", testBusinesses[0].placeId);

// Simulate what frontend sends
const payload = { businesses: testBusinesses };
console.log("\nPayload structure:");
console.log("Payload keys:", Object.keys(payload));
console.log("Payload.businesses is array:", Array.isArray(payload.businesses));
console.log("Payload.businesses[0].name:", payload.businesses[0].name);

// Simulate JSON.stringify (what fetch does)
const jsonString = JSON.stringify(payload);
console.log("\nJSON stringified length:", jsonString.length);

// Parse it back (what backend does)
const parsed = JSON.parse(jsonString);
console.log("\nParsed back:");
console.log("parsed.businesses[0].name:", parsed.businesses[0].name);
console.log("parsed.businesses[0].placeId:", parsed.businesses[0].placeId);
