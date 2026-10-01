# Multi-Unit Inventory Architecture Audit & Migration Plan
**Date:** June 3, 2026  
**Project:** Safar Tourism Marketplace  
**Scope:** Convert from single-unit to multi-unit inventory system

---

## Executive Summary

**Current State:** Single-unit inventory model where each listing represents ONE bookable unit.  
**Target State:** Multi-unit inventory supporting:
- Hotels (multiple rooms of different types)
- Homestays (multiple bedrooms/units)
- Houseboats (fleet of individual boats)
- Vehicle fleets (multiple vehicles of same/different types)

**Estimated Effort:** 18-24 hours development + 4-6 hours testing  
**Complexity:** Medium-High (requires schema changes, booking logic overhaul, UI updates)  
**Risk Level:** Medium (requires careful migration of existing bookings)

---

## 1. Current Architecture Analysis

### 1.1 Data Model (MongoDB Collections)

#### Listings Collection (Current Schema)
```javascript
{
  id: "uuid",
  title: "Luxury Houseboat on Dal Lake",
  description: "Authentic stay...",
  category: "stay|transport|experience|tour",
  subcategory: "houseboat|cabin|...",
  location: "Srinagar",
  price: 5000,  // Per night/unit
  images: ["url1", "url2"],
  hostId: "uuid",
  hostName: "John Doe",
  hostAvatar: "url",
  superhost: false,
  amenities: ["Wi-Fi", "Heater"],
  services: ["wazwan", "kehwa"],
  duration: null,
  beds: 2,
  baths: 1,
  guests: 4,  // Max capacity
  status: "approved|pending|rejected",
  featured: false,
  isDemo: false,
  createdAt: Date,
  updatedAt: Date
}
```

**ISSUE:** No concept of inventory quantity or unit types.

#### Bookings Collection (Current Schema)
```javascript
{
  bookingId: "uuid",
  listingId: "uuid",  // Links to ONE listing
  listingTitle: "Title",
  listingImage: "url",
  travelerId: "uuid",
  travelerName: "Name",
  travelerEmail: "email",
  hostId: "uuid",
  hostName: "Name",
  checkInDate: Date,
  checkOutDate: Date,
  guests: 2,
  nights: 4,
  pricePerNight: 5000,
  totalPrice: 20000,
  status: "pending|approved|rejected|cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

**ISSUE:** Assumes 1:1 mapping (one booking = entire listing occupied).

### 1.2 Booking Logic (Current Implementation)

**File:** `/app/app/api/[[...path]]/route.js`

**Overlap Detection (Lines 399-406):**
```javascript
const overlap = await bookings.findOne({
  listingId,
  status: { $in: ['pending','approved'] },
  checkInDate: { $lt: co },
  checkOutDate: { $gt: ci },
});
if (overlap) return err('These dates overlap with an existing booking.', 409);
```

**ISSUE:** Rejects ANY overlapping booking. No concept of "2 out of 5 units booked = still available".

**Availability Search (Lines 189-203):**
```javascript
const conflicts = await bookings.find({
  status: { $in: ['pending', 'approved'] },
  checkInDate: { $lt: co },
  checkOutDate: { $gt: ci },
}).toArray();
unavailableIds = [...new Set(conflicts.map((b) => b.listingId))];
if (unavailableIds.length) filter.id = { $nin: unavailableIds };
```

**ISSUE:** Excludes entire listing if ANY booking exists in date range.

### 1.3 Frontend Impact Areas

**Files Affected:**
1. `/app/app/booking/page.js` - Booking wizard (lines 363-377: availability check)
2. `/app/app/property/[id]/page.js` - Property detail page (lines 24-33: overlap check)
3. `/app/app/dashboard/host/page.js` - Host listings management
4. `/app/app/dashboard/traveler/page.js` - Traveler bookings view
5. `/app/app/explore/page.js` - Search results (date-based availability)
6. `/app/lib/listings-api.js` - API hooks (no changes needed, but responses change)

### 1.4 Indexes (Current)
```javascript
listings: id (unique), (hostId, status), (status, category)
bookings: None explicitly defined (needs addition)
```

**ISSUE:** No indexes on bookings for efficient availability queries.

---

## 2. Target Architecture Design

### 2.1 New Data Model

#### Listings Collection (Enhanced Schema)
```javascript
{
  // ... existing fields ...
  
  // NEW FIELDS:
  inventoryType: "single|multi",  // single = old behavior, multi = new
  totalUnits: 1,  // For multi: 5 rooms, 10 boats, 3 vehicles
  availableUnits: 1,  // Real-time counter (denormalized for perf)
  
  // For multi-unit listings with different types (e.g., hotel with Standard/Deluxe rooms)
  unitTypes: [
    {
      id: "uuid",
      name: "Deluxe Room",
      quantity: 3,
      price: 8000,
      guests: 2,
      beds: 1,
      amenities: ["Sea view", "King bed"],
      description: "Spacious room with lake view"
    },
    {
      id: "uuid",
      name: "Standard Room",
      quantity: 5,
      price: 5000,
      guests: 2,
      beds: 1,
      amenities: ["Garden view"],
      description: "Cozy standard room"
    }
  ],
  
  // For identical units (e.g., houseboat fleet, vehicle fleet)
  // Leave unitTypes empty, use totalUnits instead
}
```

**Migration Strategy for Existing Listings:**
- Set `inventoryType: "single"` for all existing listings
- Set `totalUnits: 1`, `availableUnits: 1`
- Set `unitTypes: []` (empty)
- This preserves current behavior (backward compatible)

#### Bookings Collection (Enhanced Schema)
```javascript
{
  // ... existing fields ...
  
  // NEW FIELDS:
  unitsBooked: 1,  // How many units this booking reserves
  unitTypeId: null,  // If specific unit type selected (e.g., "Deluxe Room")
  unitTypeName: null,  // Denormalized for display
  unitTypePrice: null,  // Price at time of booking (immutable)
}
```

**Migration Strategy for Existing Bookings:**
- Set `unitsBooked: 1` for all existing bookings
- Set `unitTypeId: null`, `unitTypeName: null`, `unitTypePrice: null`

#### New Collection: Inventory Snapshots (Optional, for audit trail)
```javascript
{
  listingId: "uuid",
  date: "2026-06-15",  // Single date (not range)
  unitTypeId: "uuid|null",  // null for identical-unit listings
  availableUnits: 3,  // Snapshot for this date
  totalUnits: 5,
  updatedAt: Date
}
```

**Purpose:** Pre-computed daily availability for fast calendar rendering. Optional optimization.

### 2.2 New Booking Logic

#### Create Booking (Multi-Unit Aware)
```javascript
// 1. Check if listing has inventory
if (listing.inventoryType === 'single') {
  // OLD LOGIC: Check for ANY overlap (existing behavior)
  const overlap = await bookings.findOne({
    listingId,
    status: { $in: ['pending','approved'] },
    checkInDate: { $lt: co },
    checkOutDate: { $gt: ci },
  });
  if (overlap) return err('Dates not available', 409);
} else {
  // NEW LOGIC: Check available units across date range
  const unitsRequested = body.unitsRequested || 1;
  const unitTypeId = body.unitTypeId || null;
  
  // Get total units for this type (or all units if no type specified)
  let totalUnits = listing.totalUnits;
  if (unitTypeId && listing.unitTypes.length) {
    const ut = listing.unitTypes.find(t => t.id === unitTypeId);
    if (!ut) return err('Invalid unit type', 400);
    totalUnits = ut.quantity;
  }
  
  // For each night in the range, check if enough units available
  const nights = getNightsArray(ci, co);  // ['2026-06-15', '2026-06-16', ...]
  for (const night of nights) {
    const nextDay = addDay(night);
    const bookedOnThisNight = await bookings.aggregate([
      {
        $match: {
          listingId,
          status: { $in: ['pending', 'approved'] },
          checkInDate: { $lt: new Date(nextDay) },
          checkOutDate: { $gt: new Date(night) },
          ...(unitTypeId ? { unitTypeId } : {})
        }
      },
      { $group: { _id: null, totalBooked: { $sum: '$unitsBooked' } } }
    ]).toArray();
    
    const booked = bookedOnThisNight[0]?.totalBooked || 0;
    const available = totalUnits - booked;
    
    if (available < unitsRequested) {
      return err(`Only ${available} units available on ${night}. You need ${unitsRequested}.`, 409);
    }
  }
  
  // All nights have capacity - proceed with booking
}
```

#### Availability Search (Multi-Unit Aware)
```javascript
// For date-range search, exclude listings that are FULLY BOOKED (not partially)
if (checkInStr && checkOutStr) {
  const listings = await getCollection('listings');
  const bookings = await getCollection('bookings');
  
  // Get all listings
  const allListings = await listings.find(filter).toArray();
  
  // For each listing, check availability
  const availableListingIds = [];
  for (const listing of allListings) {
    if (listing.inventoryType === 'single') {
      // Check if ANY booking exists (old logic)
      const conflict = await bookings.findOne({
        listingId: listing.id,
        status: { $in: ['pending', 'approved'] },
        checkInDate: { $lt: co },
        checkOutDate: { $gt: ci },
      });
      if (!conflict) availableListingIds.push(listing.id);
    } else {
      // Check if AT LEAST ONE unit available across ALL nights
      const hasAvailability = await checkMultiUnitAvailability(
        listing, ci, co, bookings
      );
      if (hasAvailability) availableListingIds.push(listing.id);
    }
  }
  
  filter.id = { $in: availableListingIds };
}
```

### 2.3 New API Endpoints

#### GET /api/listings/:id/availability (Enhanced)
**Current:** Returns list of booked date ranges (simple)  
**New:** Returns detailed availability per unit type per date

**Response:**
```json
{
  "ok": true,
  "listingId": "l1",
  "inventoryType": "multi",
  "availability": {
    "2026-06-15": {
      "total": 5,
      "available": 3,
      "unitTypes": [
        { "id": "ut1", "name": "Deluxe", "total": 3, "available": 1 },
        { "id": "ut2", "name": "Standard", "total": 2, "available": 2 }
      ]
    },
    "2026-06-16": { ... }
  }
}
```

#### POST /api/bookings (Enhanced Parameters)
**New Request Body:**
```json
{
  "listingId": "uuid",
  "checkInDate": "2026-06-15",
  "checkOutDate": "2026-06-18",
  "guests": 4,
  "unitsBooked": 2,  // NEW
  "unitTypeId": "uuid"  // NEW (optional)
}
```

---

## 3. Migration Plan

### Phase 1: Schema Migration (2 hours)
**Tasks:**
1. Add new fields to listings collection (backward compatible defaults)
2. Add new fields to bookings collection (backward compatible defaults)
3. Create migration script to set defaults on existing documents
4. Create new indexes on bookings collection for performance

**Migration Script:** `/app/migrations/001_multi_unit_inventory.js`
```javascript
// 1. Update all existing listings
db.listings.updateMany(
  { inventoryType: { $exists: false } },
  {
    $set: {
      inventoryType: 'single',
      totalUnits: 1,
      availableUnits: 1,
      unitTypes: []
    }
  }
);

// 2. Update all existing bookings
db.bookings.updateMany(
  { unitsBooked: { $exists: false } },
  {
    $set: {
      unitsBooked: 1,
      unitTypeId: null,
      unitTypeName: null,
      unitTypePrice: null
    }
  }
);

// 3. Create indexes
db.bookings.createIndex({ listingId: 1, checkInDate: 1, checkOutDate: 1 });
db.bookings.createIndex({ listingId: 1, status: 1, checkInDate: 1 });
db.bookings.createIndex({ unitTypeId: 1 });
```

**Testing:** Verify all existing bookings still work.

### Phase 2: Backend API Updates (8-10 hours)
**File:** `/app/app/api/[[...path]]/route.js`

**Tasks:**
1. Update POST /api/bookings to handle `unitsBooked` and `unitTypeId` (lines 382-433)
2. Rewrite overlap detection logic for multi-unit (lines 399-406)
3. Update GET /api/listings availability search (lines 189-203)
4. Enhance GET /api/listings/:id/availability endpoint (lines 363-377)
5. Add validation for multi-unit bookings
6. Add helper functions for availability calculations
7. Update listing creation/update to support `unitTypes`

**Backward Compatibility:** 
- Check `inventoryType` field in all booking operations
- If `inventoryType === 'single'`, use old logic
- If `inventoryType === 'multi'`, use new logic

### Phase 3: Frontend Updates (6-8 hours)
**Files to Update:**

1. **Listing Creation/Edit Form** (new file or update existing)
   - Add UI for selecting `inventoryType`
   - Add UI for defining `unitTypes` (name, quantity, price, amenities)
   - Show "Single Unit" vs "Multiple Units" toggle

2. **Property Detail Page** (`/app/app/property/[id]/page.js`)
   - Show available unit types (if multi-unit)
   - Allow selection of unit type before booking
   - Update availability calendar to show per-unit-type availability
   - Lines 24-33: Update `rangeOverlaps` to be unit-type aware

3. **Booking Page** (`/app/app/booking/page.js`)
   - Add unit type selector (step 0 or 1)
   - Add "How many units?" selector
   - Update price calculation based on selected unit type
   - Lines 363-377: Update availability check API call
   - Pass `unitsBooked` and `unitTypeId` to booking API

4. **Host Dashboard** (`/app/app/dashboard/host/page.js`)
   - Show inventory status (e.g., "3 of 5 units booked tonight")
   - Add "Manage Inventory" button/section
   - Show booking details with unit type info

5. **Traveler Dashboard** (`/app/app/dashboard/traveler/page.js`)
   - Display unit type in booking details
   - Show "2 units booked" if applicable

6. **Explore/Search** (`/app/app/explore/page.js`)
   - Works automatically (backend filters correctly)
   - Optionally: Show "Multiple units available" badge

### Phase 4: Testing (4-6 hours)
**Test Cases:**

**Single-Unit Listings (Backward Compatibility):**
1. Create booking on old listing → should work as before
2. Search with dates on old listing → should filter correctly
3. Overlap detection on old listing → should reject duplicate bookings

**Multi-Unit Listings:**
1. Create listing with 5 identical units
2. Book 2 units for June 15-18 → should succeed
3. Book 2 more units same dates → should succeed (4/5 booked)
4. Try to book 2 more units → should fail (only 1 available)
5. Search with those dates → listing should still appear
6. Book last unit → listing should disappear from search

**Multi-Unit with Types (Hotel):**
1. Create listing with 3 Deluxe rooms ($8000) and 5 Standard rooms ($5000)
2. Book 2 Deluxe rooms → should succeed at $8000/night
3. Book 1 Deluxe room → should succeed (all Deluxe now booked)
4. Try to book another Deluxe → should fail
5. Book Standard room → should succeed (different inventory pool)
6. Verify price calculation for different room types

**Edge Cases:**
1. Partial overlap (booking 3 nights, existing booking on night 2) → should detect
2. Adjacent bookings (check-out = check-in) → should NOT overlap
3. Cancelled/rejected bookings → should NOT count toward availability
4. Concurrent bookings (race condition) → test with parallel requests

---

## 4. Effort Estimation

### 4.1 Development Time
| Phase | Task | Hours | Complexity |
|-------|------|-------|------------|
| 1 | Schema migration script | 1 | Low |
| 1 | Run migration + verify | 1 | Low |
| 2 | Backend: Booking logic rewrite | 4 | High |
| 2 | Backend: Availability search rewrite | 2 | Medium |
| 2 | Backend: Enhanced availability endpoint | 2 | Medium |
| 2 | Backend: Listing CRUD updates | 2 | Low |
| 3 | Frontend: Listing create/edit form | 3 | Medium |
| 3 | Frontend: Property detail page | 2 | Medium |
| 3 | Frontend: Booking wizard | 2 | Medium |
| 3 | Frontend: Dashboards (host + traveler) | 2 | Low |
| 4 | Testing: Unit tests + integration tests | 4 | Medium |
| 4 | Testing: Manual E2E testing | 2 | Low |
| **TOTAL** | | **27 hours** | |

**Contingency:** +20% for unexpected issues = **32 hours total**

### 4.2 Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration breaks existing bookings | Low | High | Thorough testing + rollback plan |
| Performance degradation (complex queries) | Medium | Medium | Add indexes + caching |
| Race conditions (concurrent bookings) | Medium | High | Use MongoDB transactions |
| UI/UX complexity for unit selection | Low | Medium | User testing + iterative design |
| Backward compatibility issues | Low | High | Feature flag + gradual rollout |

---

## 5. Cost Estimate (Development Credits)

**Assumptions:**
- 1 hour = 100-150 development credits (industry standard)
- 32 total hours estimated

**Breakdown:**
| Item | Hours | Credits (Low) | Credits (High) |
|------|-------|---------------|----------------|
| Backend development | 11 | 1,100 | 1,650 |
| Frontend development | 9 | 900 | 1,350 |
| Database migration | 2 | 200 | 300 |
| Testing & QA | 6 | 600 | 900 |
| Documentation | 2 | 200 | 300 |
| Contingency (20%) | 2 | 200 | 300 |
| **TOTAL** | **32** | **3,200** | **4,800** |

**Recommended Budget:** 4,000 credits (mid-range estimate)

---

## 6. Alternative Approaches

### 6.1 Simpler Approach: "Cloned Listings"
**Concept:** Instead of multi-unit inventory, create multiple listings for the same property.

**Example:** Hotel with 5 rooms = 5 separate listings with identical details.

**Pros:**
- No schema changes needed
- Works with current system
- Faster to implement (2-3 hours)

**Cons:**
- Host must manage 5 listings separately
- Pricing/amenity changes require updating all copies
- Search results show duplicates (confusing UX)
- No "2 rooms available" indicator

**Verdict:** ❌ Not recommended for hotels/fleets. OK for small homestays with 2-3 units.

### 6.2 Hybrid Approach: Quantity Field Only
**Concept:** Add `quantity: 5` field to listings, but no unit types.

**Example:** Houseboat fleet with 10 identical boats.

**Pros:**
- Simpler than full multi-unit (15 hours vs 32 hours)
- Works for identical-unit scenarios
- No complex unit type management

**Cons:**
- Doesn't support hotels with different room types
- No per-unit pricing variation
- Limited flexibility

**Verdict:** ✅ Recommended as MVP if budget is tight. Can upgrade later.

---

## 7. Recommended Implementation Strategy

### Option A: Full Multi-Unit (Recommended for Hotels)
- **Cost:** 4,000 credits
- **Timeline:** 4-5 days
- **Features:** Unit types, differential pricing, complex inventory
- **Best for:** Hotels, resorts, large homestays, diverse vehicle fleets

### Option B: Simple Quantity (Recommended for Fleets)
- **Cost:** 2,000 credits
- **Timeline:** 2-3 days
- **Features:** Quantity field only, no unit types
- **Best for:** Houseboat fleets, vehicle fleets, identical-unit properties

### Option C: Phased Rollout
**Phase 1:** Implement Option B (simple quantity) - 2,000 credits  
**Phase 2:** Upgrade to Option A (unit types) when needed - 2,500 credits  
**Total:** 4,500 credits (slightly more expensive but spreads cost)

---

## 8. Success Metrics

**Post-Migration KPIs:**
1. **Backward Compatibility:** 100% of existing bookings still visible/functional
2. **Performance:** Availability search < 500ms (currently ~200ms)
3. **Booking Success Rate:** > 95% for multi-unit bookings
4. **Host Adoption:** > 50% of hotel/fleet hosts convert to multi-unit within 1 month
5. **Error Rate:** < 1% double-booking errors

---

## 9. Rollback Plan

**If migration fails:**
1. **Database:** Restore from backup (MongoDB Atlas point-in-time recovery)
2. **Code:** Revert to previous Git commit
3. **Feature Flag:** Disable multi-unit feature flag, fall back to single-unit logic

**Feature Flag Implementation:**
```javascript
const ENABLE_MULTI_UNIT = process.env.ENABLE_MULTI_UNIT === 'true';

if (ENABLE_MULTI_UNIT && listing.inventoryType === 'multi') {
  // New logic
} else {
  // Old logic (always works)
}
```

---

## 10. Next Steps

1. **Review this audit** with stakeholders
2. **Choose implementation option** (A, B, or C)
3. **Approve budget allocation** (2,000-4,000 credits)
4. **Schedule development sprint** (2-5 days)
5. **Set up staging environment** for testing
6. **Plan user communication** (if UI changes significantly)

---

## Questions for Stakeholder

1. **Priority:** Hotels or houseboats/vehicles first?
2. **Timeline:** Is 5-day timeline acceptable?
3. **Budget:** Approved for 4,000 credits?
4. **Scope:** Full implementation (Option A) or phased (Option C)?
5. **Testing:** Beta test with select hosts first, or full rollout?

**Contact:** Safar Dev Team  
**Last Updated:** June 3, 2026
