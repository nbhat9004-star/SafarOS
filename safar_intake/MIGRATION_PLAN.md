# Multi-Type Inventory Migration Plan
**Date:** June 3, 2026  
**Estimated Time:** 7.75 hours (39 credits)

---

## Migration Overview

### Database Changes

#### 1. Listings Collection - Add 1 Field
```javascript
// ADD to all documents:
{
  inventoryTypes: []  // Array of inventory types
}

// Example populated document:
{
  inventoryTypes: [
    {
      id: "uuid-1",
      name: "Standard Room",
      description: "Comfortable room with garden view",
      price: 5000,
      quantity: 10,
      available: 10,  // Real-time counter
      images: ["url1", "url2"],
      status: "active",  // active | inactive
      beds: 1,
      guests: 2,
      amenities: ["Wi-Fi", "AC"]
    }
  ]
}

// Existing listings (backward compatible):
{
  inventoryTypes: []  // Empty = single-unit legacy behavior
}
```

#### 2. Bookings Collection - Add 2 Fields
```javascript
// ADD to all documents:
{
  inventoryTypeId: null,      // Which type was booked
  inventoryTypeName: null     // Denormalized for display
}

// Example new booking:
{
  inventoryTypeId: "uuid-1",
  inventoryTypeName: "Standard Room"
}

// Existing bookings (backward compatible):
{
  inventoryTypeId: null,  // Legacy single-unit
  inventoryTypeName: null
}
```

#### 3. New Index
```javascript
db.bookings.createIndex({ 
  listingId: 1, 
  inventoryTypeId: 1, 
  status: 1 
});
```

---

## Migration Safety

### ✅ Zero Breaking Changes
- All existing listings: `inventoryTypes: []` (empty)
- Empty array = use listing's top-level price (old behavior)
- All existing bookings: `inventoryTypeId: null`
- Null = legacy single-unit booking
- Historical data preserved 100%

### ✅ Rollback Plan
If anything goes wrong:
1. Remove new fields: `db.listings.updateMany({}, {$unset: {inventoryTypes: ""}})`
2. Remove new fields: `db.bookings.updateMany({}, {$unset: {inventoryTypeId: "", inventoryTypeName: ""}})`
3. Drop new index: `db.bookings.dropIndex("listingId_1_inventoryTypeId_1_status_1")`
4. Revert code to previous commit

---

## Migration Steps

### Step 1: Backup (5 min)
```bash
# Backup current database
mongodump --uri="mongodb://localhost:27017" --db=safar --out=/tmp/safar_backup_$(date +%Y%m%d)
```

### Step 2: Run Migration Script (2 min)
```javascript
// Add inventoryTypes to all listings
db.listings.updateMany(
  { inventoryTypes: { $exists: false } },
  { $set: { inventoryTypes: [] } }
);

// Verify
db.listings.countDocuments({ inventoryTypes: { $exists: true } });

// Add fields to all bookings
db.bookings.updateMany(
  { inventoryTypeId: { $exists: false } },
  { $set: { inventoryTypeId: null, inventoryTypeName: null } }
);

// Verify
db.bookings.countDocuments({ inventoryTypeId: { $exists: true } });

// Create index
db.bookings.createIndex({ listingId: 1, inventoryTypeId: 1, status: 1 });
```

### Step 3: Verification (3 min)
```bash
# Count listings with new field
db.listings.countDocuments({ inventoryTypes: { $exists: true } })

# Count bookings with new fields
db.bookings.countDocuments({ inventoryTypeId: { $exists: true } })

# Check indexes
db.bookings.getIndexes()
```

### Expected Results:
- All listings have `inventoryTypes` field (count = total listings)
- All bookings have `inventoryTypeId`, `inventoryTypeName` fields (count = total bookings)
- New index exists

---

## Post-Migration Code Changes

### Backend Changes (4 hours)
**File:** `/app/app/api/[[...path]]/route.js`
- Lines 382-433: Update booking creation logic
- Lines 452-469: Add counter restore on cancellation
- Lines 189-203: Update availability search
- Lines 212-254: Update listing creation
- Lines 292-312: Update listing editing
- Lines 363-377: Enhance availability endpoint

**Estimated:** ~175 lines new/modified

### Frontend Changes (2.5 hours)
**Files:**
1. `/app/app/add-listing/page.js` - Add inventory type management (+80 lines)
2. `/app/app/property/[id]/page.js` - Add type selector (+40 lines)
3. `/app/app/booking/page.js` - Handle type selection (+10 lines)
4. `/app/app/dashboard/host/page.js` - Show type info (+15 lines)

**Estimated:** ~145 lines new/modified

### Testing (1 hour)
- Backward compatibility (existing listings work)
- Multi-type hotel (room types)
- Multi-type vehicles (car/bike types)
- Search/filter with dates
- Booking cancellation (counter restore)

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Migration fails | HIGH | Very Low (5%) | Backup + rollback script ready |
| Counter out of sync | MEDIUM | Low (10%) | Atomic $inc operations |
| Performance degradation | LOW | Low (15%) | Indexed queries |
| UI confusion | LOW | Low (10%) | Clear type selector |

**Overall Risk:** **LOW**

---

## Timeline

| Phase | Duration | Start After |
|-------|----------|-------------|
| Migration | 10 min | Approval |
| Backend Implementation | 4 hours | Migration complete |
| Frontend Implementation | 2.5 hours | Backend complete |
| Testing | 1 hour | Frontend complete |
| **TOTAL** | **7 hours 40 min** | |

**Budget:** 39 credits (under 40 limit) ✅

---

## Pre-Implementation Checklist

Before proceeding, confirm:
- [ ] Database backup completed
- [ ] Staging environment ready for testing
- [ ] Rollback script tested
- [ ] 39 credit budget approved
- [ ] Timeline acceptable (1 working day)

---

## Migration Command (Ready to Execute)

```javascript
// File: /app/migrations/multi_type_inventory.js

use safar;

print("Starting multi-type inventory migration...");

// 1. Add inventoryTypes to listings
var listingsResult = db.listings.updateMany(
  { inventoryTypes: { $exists: false } },
  { $set: { inventoryTypes: [] } }
);
print("Listings updated: " + listingsResult.modifiedCount);

// 2. Add fields to bookings
var bookingsResult = db.bookings.updateMany(
  { inventoryTypeId: { $exists: false } },
  { $set: { inventoryTypeId: null, inventoryTypeName: null } }
);
print("Bookings updated: " + bookingsResult.modifiedCount);

// 3. Create index
db.bookings.createIndex({ listingId: 1, inventoryTypeId: 1, status: 1 });
print("Index created");

// 4. Verification
var listingsCount = db.listings.countDocuments({ inventoryTypes: { $exists: true } });
var bookingsCount = db.bookings.countDocuments({ inventoryTypeId: { $exists: true } });
var totalListings = db.listings.countDocuments({});
var totalBookings = db.bookings.countDocuments({});

print("\n=== Verification ===");
print("Listings with inventoryTypes: " + listingsCount + " / " + totalListings);
print("Bookings with inventoryTypeId: " + bookingsCount + " / " + totalBookings);

if (listingsCount === totalListings && bookingsCount === totalBookings) {
  print("\n✅ Migration completed successfully!");
} else {
  print("\n❌ Migration incomplete! Please review.");
}
```

---

## Execute Migration?

**Ready to proceed with:**
1. ✅ Database backup
2. ✅ Run migration script above
3. ✅ Verify results
4. ✅ Implement backend changes (4 hours)
5. ✅ Implement frontend changes (2.5 hours)
6. ✅ Test thoroughly (1 hour)

**Total: 39 credits**

Type **"APPROVED"** to begin implementation.
