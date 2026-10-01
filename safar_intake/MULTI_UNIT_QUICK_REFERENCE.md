# Multi-Unit Inventory: Quick Reference Guide

## Current vs Proposed Architecture

### 📊 CURRENT SYSTEM (Single-Unit)
```
Listing: "Houseboat Paradise"
├── Price: ₹5,000/night
├── Capacity: 4 guests
└── Booking Logic: ONE booking = ENTIRE listing unavailable

Example:
- Booking A: June 15-18 (John) → ✅ Confirmed
- Booking B: June 15-18 (Sarah) → ❌ REJECTED (overlap detected)
```

### 🎯 PROPOSED SYSTEM (Multi-Unit)
```
Listing: "Houseboat Fleet - Paradise Collection"
├── Inventory Type: Multi-unit
├── Total Units: 5 houseboats
├── Price: ₹5,000/night per boat
└── Booking Logic: Track units booked, not entire listing

Example:
- Booking A: June 15-18, 1 unit (John) → ✅ Confirmed (4 units left)
- Booking B: June 15-18, 2 units (Sarah) → ✅ Confirmed (2 units left)
- Booking C: June 15-18, 3 units (Mike) → ❌ REJECTED (only 2 available)
```

---

## Use Cases by Industry

### 🏨 Hotels & Resorts
**Example:** Paradise Hotel, Gulmarg
- 3 Deluxe Rooms @ ₹8,000/night (King bed, lake view)
- 5 Standard Rooms @ ₹5,000/night (Queen bed, garden view)
- 2 Suites @ ₹15,000/night (2 bedrooms, living room)

**Implementation:** Option A (Full multi-unit with unit types)

### 🛥️ Houseboat Fleets
**Example:** Dal Lake Houseboat Fleet
- 10 identical houseboats @ ₹5,000/night
- Each accommodates 4 guests
- All have same amenities

**Implementation:** Option B (Simple quantity field)

### 🏠 Homestays
**Example:** Traditional Kashmiri Home
- 3 bedrooms available for guests
- Each room ₹3,000/night
- Shared common areas

**Implementation:** Option A or B depending on room differences

### 🚗 Vehicle Fleets
**Example:** Kashmir Car Rentals
- 5 Sedan cars @ ₹2,000/day
- 3 SUVs @ ₹4,000/day
- 2 Tempo Travellers @ ₹6,000/day

**Implementation:** Option A (different vehicle types)

---

## Implementation Options Comparison

| Feature | Option A: Full Multi-Unit | Option B: Simple Quantity | Current (Single) |
|---------|---------------------------|---------------------------|------------------|
| **Unit Types** | ✅ Yes (Deluxe, Standard, etc.) | ❌ No | ❌ No |
| **Differential Pricing** | ✅ Yes (per type) | ❌ No (same price) | ✅ N/A (one price) |
| **Identical Units** | ✅ Yes | ✅ Yes | ✅ N/A |
| **Complexity** | High | Medium | Low |
| **Development Time** | 32 hours | 15 hours | 0 hours |
| **Cost** | 4,000 credits | 2,000 credits | Free |
| **Best For** | Hotels, diverse fleets | Houseboats, identical units | Single properties |
| **Upgradeable** | N/A (final) | ✅ Can upgrade to A later | ✅ Can upgrade |

---

## Key Technical Changes

### Database Schema
```javascript
// NEW FIELDS in listings collection
{
  inventoryType: "single|multi",     // Toggle feature
  totalUnits: 5,                     // Total inventory
  availableUnits: 3,                 // Real-time available (denormalized)
  unitTypes: [                       // Optional: different types
    { id: "uuid", name: "Deluxe", quantity: 3, price: 8000, ... }
  ]
}

// NEW FIELDS in bookings collection
{
  unitsBooked: 2,                    // How many units reserved
  unitTypeId: "uuid",                // Which type (if applicable)
  unitTypeName: "Deluxe Room"        // For display
}
```

### API Changes
```javascript
// POST /api/bookings - New parameters
{
  listingId: "l1",
  checkInDate: "2026-06-15",
  checkOutDate: "2026-06-18",
  guests: 4,
  unitsBooked: 2,        // NEW
  unitTypeId: "ut1"      // NEW (optional)
}

// GET /api/listings/:id/availability - Enhanced response
{
  availability: {
    "2026-06-15": {
      total: 5,
      available: 3,      // Units available on this date
      unitTypes: [...]   // Per-type breakdown (if applicable)
    }
  }
}
```

### Booking Logic (Pseudo-code)
```javascript
// CURRENT (Single-unit)
if (ANY_BOOKING_EXISTS_FOR_DATES) {
  reject("Dates not available");
}

// PROPOSED (Multi-unit)
for (each_night in date_range) {
  booked_units = SUM(all bookings on this night);
  available = total_units - booked_units;
  if (available < units_requested) {
    reject("Only X units available on this night");
  }
}
```

---

## Migration Safety

### ✅ Backward Compatibility Guaranteed
All existing single-unit listings will:
1. Automatically get `inventoryType: "single"`
2. Continue working exactly as before
3. Use old booking logic (no breaking changes)

### 🔒 Zero Data Loss
Migration script adds fields with safe defaults:
```javascript
// All existing listings get:
inventoryType: "single",
totalUnits: 1,
availableUnits: 1,
unitTypes: []

// All existing bookings get:
unitsBooked: 1,
unitTypeId: null,
unitTypeName: null
```

### 🎚️ Feature Flag Control
```javascript
if (listing.inventoryType === 'multi') {
  // Use new logic
} else {
  // Use old logic (always works)
}
```

Can disable multi-unit feature instantly if issues arise.

---

## Performance Considerations

### Current Query (Fast)
```javascript
// Simple existence check
db.bookings.findOne({
  listingId: "l1",
  checkInDate: { $lt: checkout },
  checkOutDate: { $gt: checkin }
})
// Time: ~5-10ms
```

### Proposed Query (More Complex)
```javascript
// Aggregation to sum units
db.bookings.aggregate([
  { $match: { listingId: "l1", ... } },
  { $group: { _id: null, totalBooked: { $sum: '$unitsBooked' } } }
])
// Time: ~20-50ms (with proper indexes)
```

### Optimization Strategy
1. **Indexes:** Add `(listingId, checkInDate, checkOutDate)` compound index
2. **Caching:** Cache availability for next 30 days (Redis/memory)
3. **Denormalization:** Store `availableUnits` counter on listing (updated on each booking)

**Expected Impact:** +10-30ms per availability check (acceptable)

---

## Testing Checklist

### ✅ Backward Compatibility Tests
- [ ] Existing bookings display correctly
- [ ] Existing bookings can be cancelled/modified
- [ ] Single-unit listings still reject overlaps
- [ ] Search/filter works for old listings

### ✅ Multi-Unit Tests
- [ ] Book 2 of 5 units → succeeds
- [ ] Book 3 more units same dates → succeeds
- [ ] Try to book 1 more (only 0 left) → fails
- [ ] Search shows listing until fully booked
- [ ] Different unit types have separate inventory pools

### ✅ Edge Cases
- [ ] Adjacent bookings (checkout = checkin)
- [ ] Partial overlaps
- [ ] Cancelled bookings don't count
- [ ] Concurrent bookings (race condition)
- [ ] Date timezone handling

### ✅ Performance Tests
- [ ] Availability search < 500ms (100 listings)
- [ ] Booking creation < 200ms
- [ ] Dashboard load < 1s (50 bookings)

---

## Rollout Plan

### Phase 1: Development (Week 1)
- Day 1-2: Backend API updates
- Day 3-4: Frontend UI updates
- Day 5: Testing & bug fixes

### Phase 2: Beta Testing (Week 2)
- Select 5 pilot hosts (1 hotel, 2 houseboats, 1 homestay, 1 fleet)
- Gather feedback
- Iterate on UX

### Phase 3: Full Launch (Week 3)
- Announce feature to all hosts
- Documentation & tutorials
- Support team training

### Phase 4: Monitoring (Ongoing)
- Track error rates
- Monitor performance
- Collect user feedback

---

## Cost Summary

| Item | Option A (Full) | Option B (Simple) |
|------|----------------|-------------------|
| Development | 3,200 credits | 1,600 credits |
| Testing | 600 credits | 300 credits |
| Documentation | 200 credits | 100 credits |
| **TOTAL** | **4,000 credits** | **2,000 credits** |

**Contingency:** +20% recommended

---

## Decision Framework

**Choose Option A (Full Multi-Unit) if:**
- ✅ You have hotels with different room types
- ✅ You need differential pricing per unit type
- ✅ Budget allows 4,000 credits
- ✅ You want maximum flexibility

**Choose Option B (Simple Quantity) if:**
- ✅ You primarily have houseboats/vehicle fleets (identical units)
- ✅ All units have same price
- ✅ Budget is limited (2,000 credits)
- ✅ You want faster implementation (2 days vs 5 days)

**Stick with Current (Single-Unit) if:**
- ✅ Most listings are unique properties (single homes, cottages)
- ✅ Multi-unit is rare edge case
- ✅ No budget for changes

---

## FAQs

**Q: Will this break existing bookings?**  
A: No. Migration adds new fields with safe defaults. Existing bookings continue working.

**Q: Can I convert a single-unit listing to multi-unit later?**  
A: Yes. Host can toggle `inventoryType` and set `totalUnits` anytime.

**Q: What about pricing for multi-night bookings?**  
A: Price is per night per unit. 2 units × 3 nights = 6 × unit_price.

**Q: How do I handle overbooking?**  
A: System prevents it. If only 1 unit available, trying to book 2 will fail.

**Q: Performance impact?**  
A: +10-30ms per search query. Negligible for users.

**Q: Can I roll back if something breaks?**  
A: Yes. Feature flag allows instant rollback to old logic.

---

**For questions or to proceed:**
Contact: Safar Development Team  
Email: dev@safar.com  
Document Version: 1.0  
Last Updated: June 3, 2026
