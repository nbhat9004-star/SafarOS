# Lightweight Multi-Unit Inventory: Minimal Implementation Audit

**Date:** June 3, 2026  
**Constraint:** Under 40 Emergent credits (~8 hours)  
**Approach:** Counter-based system with minimal code changes

---

## Executive Summary

**Goal:** Add multi-unit inventory support with MINIMUM changes to existing codebase.

**Strategy:** Simple counter approach
- Add 3 fields: `totalUnits`, `availableUnits`, `unitType`
- Change overlap logic: Check `availableUnits > 0` instead of "any booking exists"
- Decrement counter on booking, increment on cancellation
- NO complex unit types, NO differential pricing, NO major UI redesign

**Estimated Cost:** **32-38 credits** (6.5-7.5 hours)  
**Risk:** Low (minimal changes, backward compatible)

---

## 1. Current System Analysis

### 1.1 Critical Code Paths (Only 2 Need Changes)

#### Path 1: Booking Creation (Lines 382-433)
```javascript
// CURRENT LOGIC (Line 399-406):
const overlap = await bookings.findOne({
  listingId,
  status: { $in: ['pending','approved'] },
  checkInDate: { $lt: co },
  checkOutDate: { $gt: ci },
});
if (overlap) return err('These dates overlap...', 409);
```

**ISSUE:** Rejects if ANY booking exists. Needs to check `availableUnits > 0` instead.

**Change Required:** ~10 lines of code

---

#### Path 2: Availability Search (Lines 189-203)
```javascript
// CURRENT LOGIC:
const conflicts = await bookings.find({...}).toArray();
unavailableIds = [...new Set(conflicts.map((b) => b.listingId))];
if (unavailableIds.length) filter.id = { $nin: unavailableIds };
```

**ISSUE:** Excludes entire listing if any booking exists.

**Change Required:** Check if `availableUnits > 0` for each listing. ~15 lines of code.

---

### 1.2 What DOESN'T Need Changes

✅ **All dashboards:** Display existing data, no logic changes  
✅ **Booking display:** Show existing bookings as-is  
✅ **Listing display:** Existing cards work fine  
✅ **Auth system:** No changes  
✅ **Payment flow:** No changes  
✅ **Filters/search:** Works with existing fields  
✅ **Property details:** Minor display addition only

**Reuse Rate:** ~95% of existing code unchanged

---

## 2. Minimal Schema Changes

### 2.1 Listings Collection (Add 3 Fields)
```javascript
{
  // ... ALL existing fields unchanged ...
  
  // NEW FIELDS (3 only):
  totalUnits: 1,           // How many units in inventory (default: 1)
  availableUnits: 1,       // Real-time available (default: 1)
  unitType: "room"         // Optional: "room"|"boat"|"vehicle"|"unit"
}
```

**Migration for existing listings:**
```javascript
db.listings.updateMany(
  { totalUnits: { $exists: false } },
  { $set: { totalUnits: 1, availableUnits: 1, unitType: "unit" } }
);
```

**Impact:** Zero breaking changes. All existing listings work exactly as before (1 unit = single-unit behavior).

---

### 2.2 NO Changes to Bookings Collection

**Decision:** Keep bookings collection unchanged.  
**Rationale:** 
- Each booking still reserves 1 unit (implicit)
- Simplifies logic
- No migration needed on bookings
- Backward compatible

**Trade-off:** Can't book multiple units in one transaction (acceptable for MVP).

---

### 2.3 NO New Collections

Reuse existing `listings` and `bookings` collections.

---

## 3. Implementation Plan (Minimal)

### Phase 1: Schema Migration (30 min = 3 credits)

**File:** `/app/migrations/lightweight_multiunit.js` (NEW, 20 lines)

```javascript
// Add 3 fields to all listings with defaults
db.listings.updateMany(
  { totalUnits: { $exists: false } },
  { 
    $set: { 
      totalUnits: 1, 
      availableUnits: 1, 
      unitType: "unit" 
    } 
  }
);

// Create index for efficient queries
db.bookings.createIndex({ listingId: 1, status: 1 });
```

**Testing:** Verify all existing listings have new fields.

---

### Phase 2: Backend Changes (3.5 hours = 17-18 credits)

#### File 1: `/app/app/api/[[...path]]/route.js` (Modify existing)

**Change 1: Booking Creation Logic (Lines 398-406) - 1 hour**

```javascript
// BEFORE:
const overlap = await bookings.findOne({...});
if (overlap) return err('These dates overlap...', 409);

// AFTER (REPLACE with):
// For multi-unit listings, check available units instead of blocking entirely
const totalUnits = listing.totalUnits || 1;
if (totalUnits === 1) {
  // Single-unit listing: use old logic (backward compatible)
  const overlap = await bookings.findOne({
    listingId,
    status: { $in: ['pending','approved'] },
    checkInDate: { $lt: co },
    checkOutDate: { $gt: ci },
  });
  if (overlap) return err('These dates overlap with an existing booking.', 409);
} else {
  // Multi-unit listing: check if units available
  const bookedCount = await bookings.countDocuments({
    listingId,
    status: { $in: ['pending','approved'] },
    checkInDate: { $lt: co },
    checkOutDate: { $gt: ci },
  });
  const available = totalUnits - bookedCount;
  if (available < 1) {
    return err('No units available for these dates. Try different dates or check other listings.', 409);
  }
  // availableUnits counter will be decremented after booking created
}
```

**Change 2: After Booking Created, Update Counter (After Line 430) - 15 min**

```javascript
await bookings.insertOne(doc);

// NEW: Update availableUnits counter (only for multi-unit)
if (totalUnits > 1) {
  await listings.updateOne(
    { id: listingId },
    { $inc: { availableUnits: -1 } }
  );
}

const { _id, ...rest } = doc;
return ok({ booking: rest }, 201);
```

**Change 3: Booking Cancellation/Rejection - Increment Counter (Lines 451-469) - 30 min**

Find the PATCH endpoint for booking status updates (around line 452-469) and add:

```javascript
// After updating booking status to 'cancelled' or 'rejected':
if (status === 'cancelled' || status === 'rejected') {
  // Restore availableUnits
  const listing = await listings.findOne({ id: b.listingId });
  if (listing && listing.totalUnits > 1) {
    await listings.updateOne(
      { id: b.listingId },
      { $inc: { availableUnits: 1 } }
    );
  }
}
```

**Change 4: Availability Search (Lines 189-203) - 1 hour**

```javascript
// BEFORE:
const conflicts = await bookings.find({...}).toArray();
unavailableIds = [...new Set(conflicts.map((b) => b.listingId))];
if (unavailableIds.length) filter.id = { $nin: unavailableIds };

// AFTER (REPLACE with):
if (checkInStr && checkOutStr) {
  const ci = new Date(checkInStr);
  const co = new Date(checkOutStr);
  if (!isNaN(ci) && !isNaN(co) && co > ci) {
    const bookings = await getCollection('bookings');
    
    // Group bookings by listing to count how many are booked
    const bookingCounts = await bookings.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'approved'] },
          checkInDate: { $lt: co },
          checkOutDate: { $gt: ci },
        }
      },
      {
        $group: {
          _id: '$listingId',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get all listings and check which are fully booked
    const listingsToCheck = await listings.find(
      { id: { $in: bookingCounts.map(b => b._id) } },
      { projection: { id: 1, totalUnits: 1 } }
    ).toArray();
    
    // Only exclude listings where booked count >= totalUnits
    unavailableIds = [];
    for (const listing of listingsToCheck) {
      const booked = bookingCounts.find(b => b._id === listing.id)?.count || 0;
      const total = listing.totalUnits || 1;
      if (booked >= total) {
        unavailableIds.push(listing.id);
      }
    }
    
    if (unavailableIds.length) filter.id = { $nin: unavailableIds };
  }
}
```

**Change 5: Listing Creation - Add New Fields (Lines 212-254) - 30 min**

In POST /api/listings endpoint, add support for new fields:

```javascript
const doc = {
  // ... existing fields ...
  
  // NEW: Add multi-unit fields
  totalUnits: Number(body.totalUnits) || 1,
  availableUnits: Number(body.totalUnits) || 1,  // Start with all available
  unitType: body.unitType || 'unit',
  
  // ... rest of existing fields ...
};
```

**Change 6: Listing Update - Support New Fields (Lines 292-312) - 15 min**

In PUT /api/listings/:id endpoint:

```javascript
const update = {};
const allowed = ['title','description',..., 'totalUnits', 'availableUnits', 'unitType'];  // Add to allowed list
// ... existing validation code ...
if (update.totalUnits !== undefined) {
  const t = Number(update.totalUnits);
  if (!Number.isFinite(t) || t < 1) return err('totalUnits must be at least 1');
  update.totalUnits = t;
  // Reset availableUnits to match new total (host is changing inventory)
  update.availableUnits = t;
}
```

**Total Backend Changes:**
- 1 file modified (`route.js`)
- ~50 lines of new code
- ~15 lines modified
- 3.5 hours

---

### Phase 3: Frontend Changes (2 hours = 10 credits)

#### Change 1: Property Detail Page (30 min)

**File:** `/app/app/property/[id]/page.js` (Line ~190)

Add availability display in booking card:

```javascript
// In the booking sidebar (around line 190), add after price:
{listing.totalUnits > 1 && (
  <div className="mt-2 text-sm text-emerald2 font-medium">
    {listing.availableUnits || 0} of {listing.totalUnits} units available
  </div>
)}
```

**Change:** Add 5 lines of JSX

---

#### Change 2: Listing Creation Form (45 min)

**File:** `/app/app/add-listing/page.js` (Modify existing form)

Add fields after price input (around line 100-120):

```javascript
{/* Multi-unit inventory (optional) */}
<div className="rounded-2xl border p-5 bg-secondary/20">
  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
    Multi-Unit Inventory (Optional)
  </div>
  <div className="grid sm:grid-cols-2 gap-3">
    <div>
      <label className="text-sm font-medium">Total Units</label>
      <input
        type="number"
        min="1"
        value={totalUnits}
        onChange={(e) => setTotalUnits(e.target.value)}
        placeholder="1"
        className="w-full px-4 py-2.5 rounded-xl border mt-1"
      />
      <div className="text-xs text-muted-foreground mt-1">
        Leave as 1 for single properties. Set to 5+ for hotels, fleets, etc.
      </div>
    </div>
    <div>
      <label className="text-sm font-medium">Unit Type</label>
      <select
        value={unitType}
        onChange={(e) => setUnitType(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border mt-1"
      >
        <option value="unit">Unit</option>
        <option value="room">Room</option>
        <option value="boat">Boat</option>
        <option value="vehicle">Vehicle</option>
      </select>
    </div>
  </div>
</div>
```

**Change:** Add ~30 lines of JSX + 2 state variables

---

#### Change 3: Host Dashboard - Show Availability (30 min)

**File:** `/app/app/dashboard/host/page.js` (Line ~172-183)

In listings table, add availability column:

```javascript
// In the listings table header (around line 170):
<div className="col-span-5">Listing</div>
<div className="col-span-2">Price</div>
<div className="col-span-2">Availability</div>  {/* NEW */}
<div className="col-span-2">Status</div>
<div className="col-span-1"></div>

// In the listings row (around line 173-183):
<div className="col-span-2">
  {l.totalUnits > 1 ? (
    <div className="text-sm">
      <span className="font-semibold text-emerald2">{l.availableUnits || 0}</span>
      <span className="text-muted-foreground"> / {l.totalUnits} available</span>
    </div>
  ) : (
    <span className="text-xs text-muted-foreground">Single unit</span>
  )}
</div>
```

**Change:** Modify grid layout + add 10 lines

---

#### Change 4: Explore Page - Show "Multiple Units" Badge (15 min)

**File:** `/app/app/explore/page.js` (PropertyCard component)

Add badge to listing cards with multiple units:

```javascript
// In PropertyCard component, after price:
{item.totalUnits > 1 && (
  <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold">
    {item.availableUnits || 0} units available
  </div>
)}
```

**Change:** Add 5 lines

---

**Total Frontend Changes:**
- 4 files modified
- ~50 lines of new code
- 2 hours

---

### Phase 4: Testing (1.5 hours = 7-8 credits)

**Test Script:** `/app/test_multiunit.py` (NEW, 150 lines)

```python
# Test 1: Backward compatibility (existing listings still work)
# Test 2: Create multi-unit listing (5 units)
# Test 3: Book 3 units across same dates (should succeed)
# Test 4: Book 3 more units same dates (should fail - only 2 left)
# Test 5: Cancel 1 booking (availableUnits should increase)
# Test 6: Search with dates (listing appears until fully booked)
# Test 7: Listing edit (change totalUnits, availableUnits resets)
```

**Manual Testing:**
- Create hotel with 5 rooms
- Book 3 rooms for June 15-18
- Verify counter shows "2 of 5 available"
- Book 2 more rooms → succeeds
- Try to book 1 more → fails
- Cancel 1 booking → counter shows "1 of 5 available"

**Time:** 1.5 hours

---

## 4. Files Modified (Summary)

### Backend (1 file)
1. `/app/app/api/[[...path]]/route.js` - Main API logic (~65 lines changed)

### Frontend (4 files)
1. `/app/app/property/[id]/page.js` - Property detail (+5 lines)
2. `/app/app/add-listing/page.js` - Listing form (+35 lines)
3. `/app/app/dashboard/host/page.js` - Host dashboard (+15 lines)
4. `/app/app/explore/page.js` - Explore cards (+5 lines)

### New Files (2)
1. `/app/migrations/lightweight_multiunit.js` - Migration script (20 lines)
2. `/app/test_multiunit.py` - Test suite (150 lines)

**Total:** 5 files modified, 2 files created

---

## 5. Credit Estimate (Detailed)

| Phase | Task | Time | Credits | Complexity |
|-------|------|------|---------|------------|
| **1. Migration** | Write migration script | 15 min | 1.5 | Low |
| | Run & verify migration | 15 min | 1.5 | Low |
| **2. Backend** | Booking creation logic | 1h | 5 | Medium |
| | Counter update on booking | 15 min | 1.5 | Low |
| | Counter restore on cancel | 30 min | 2.5 | Low |
| | Availability search rewrite | 1h | 5 | Medium |
| | Listing CRUD updates | 45 min | 4 | Low |
| **3. Frontend** | Property detail page | 30 min | 2.5 | Low |
| | Listing form updates | 45 min | 4 | Low |
| | Host dashboard updates | 30 min | 2.5 | Low |
| | Explore page badge | 15 min | 1.5 | Low |
| **4. Testing** | Write test script | 45 min | 4 | Low |
| | Manual testing | 45 min | 4 | Low |
| **TOTAL** | | **7.5 hours** | **38 credits** | |

**With 10% buffer:** 42 credits

---

## 6. What This WON'T Do (Out of Scope)

❌ Different unit types with different prices (Deluxe vs Standard)  
❌ Book multiple units in one transaction  
❌ Real-time availability calendar UI  
❌ Advanced inventory management dashboard  
❌ Pricing variations per unit  
❌ Unit-specific amenities  

**These are future enhancements, not MVP.**

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Counter gets out of sync | Low | Medium | Add daily reconciliation job |
| Race condition (concurrent bookings) | Low | Medium | Use atomic $inc operations |
| Migration issues | Very Low | Low | Test on copy first |
| UI confusion | Low | Low | Clear messaging |

**Overall Risk:** LOW

---

## 8. Success Criteria

✅ **Backward Compatibility:** All existing single-unit listings work unchanged  
✅ **Multi-Unit Booking:** Can book 3 of 5 units successfully  
✅ **Counter Accuracy:** availableUnits decrements/increments correctly  
✅ **Search Filtering:** Multi-unit listings appear until fully booked  
✅ **Performance:** No degradation (< +20ms per request)  
✅ **Zero Downtime:** Migration runs without service interruption  

---

## 9. Implementation Decision

**Estimated Cost:** 38 credits (+ 10% buffer = 42 credits)  
**Constraint:** Must be under 40 credits  

### VERDICT: ⚠️ SLIGHTLY OVER BUDGET

**Options:**

**Option A: Reduce Scope to Hit 40 Credits**
- Skip frontend changes to explore page (-1.5 credits)
- Skip detailed test script, manual test only (-4 credits)
- **New Total:** 32.5 credits ✅ UNDER BUDGET

**Option B: Proceed at 38 Credits (2 credits over)**
- Request approval for 38 credits
- Justifies thorough testing

**Option C: Phased Implementation**
- Phase 1: Backend only (23 credits)
- Phase 2: Frontend later (15 credits)

---

## 10. Recommended Approach

**I RECOMMEND: Option A (Reduced Scope)**

**What to skip:**
1. Explore page "units available" badge → Not critical, saves 1.5 credits
2. Automated test script → Manual testing sufficient, saves 4 credits

**Revised Total:** 32.5 credits ✅ **UNDER 40 CREDITS**

**Implementation:**
1. Migration script (3 credits)
2. Backend changes (18.5 credits)
3. Frontend changes (9 credits - skip explore page)
4. Manual testing only (2 credits)

**Timeline:** 1 full day (6.5 hours)

---

## 11. Next Steps

**If approved to proceed at 32.5 credits:**

1. Run migration script (30 min)
2. Update backend API (3.5 hours)
3. Update frontend forms & dashboards (1.5 hours)
4. Manual testing (1 hour)
5. Deploy & monitor

**Ready to begin implementation?**

---

**Document Status:** Ready for approval  
**Last Updated:** June 3, 2026  
**Author:** Safar Development Team
