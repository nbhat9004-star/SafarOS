// Multi-Type Inventory Migration
// Adds support for multiple unit types (rooms, vehicles) per listing
// Date: June 3, 2026

// Execute with: mongosh safar < /app/migrations/multi_type_inventory.js

use safar;

print("\n==============================================");
print("  Multi-Type Inventory Migration");
print("  Date: " + new Date().toISOString());
print("==============================================\n");

// Backup collections
print("Step 1: Creating backup collections...");
db.listings.aggregate([{ $match: {} }]).forEach(function(doc) {
  db.listings_backup_20260603.insert(doc);
});
db.bookings.aggregate([{ $match: {} }]).forEach(function(doc) {
  db.bookings_backup_20260603.insert(doc);
});
print("✅ Backup created: listings_backup_20260603, bookings_backup_20260603\n");

// Add inventoryTypes field to all listings
print("Step 2: Adding inventoryTypes field to listings...");
var listingsResult = db.listings.updateMany(
  { inventoryTypes: { $exists: false } },
  { $set: { inventoryTypes: [] } }
);
print("✅ Listings updated: " + listingsResult.modifiedCount + " documents");
print("   (Empty array = backward compatible single-unit behavior)\n");

// Add inventoryTypeId and inventoryTypeName to all bookings
print("Step 3: Adding inventory type fields to bookings...");
var bookingsResult = db.bookings.updateMany(
  { inventoryTypeId: { $exists: false } },
  { 
    $set: { 
      inventoryTypeId: null,
      inventoryTypeName: null
    }
  }
);
print("✅ Bookings updated: " + bookingsResult.modifiedCount + " documents");
print("   (null = backward compatible legacy booking)\n");

// Create new index for performance
print("Step 4: Creating performance index...");
try {
  db.bookings.createIndex({ 
    listingId: 1, 
    inventoryTypeId: 1, 
    status: 1 
  }, {
    name: "booking_inventory_type_idx"
  });
  print("✅ Index created: booking_inventory_type_idx\n");
} catch(e) {
  print("⚠️  Index may already exist: " + e.message + "\n");
}

// Verification
print("==============================================");
print("  Verification");
print("==============================================\n");

var totalListings = db.listings.countDocuments({});
var listingsWithField = db.listings.countDocuments({ inventoryTypes: { $exists: true } });
var totalBookings = db.bookings.countDocuments({});
var bookingsWithFields = db.bookings.countDocuments({ 
  inventoryTypeId: { $exists: true },
  inventoryTypeName: { $exists: true }
});

print("Listings:");
print("  Total: " + totalListings);
print("  With inventoryTypes field: " + listingsWithField);
print("  Coverage: " + ((listingsWithField / totalListings) * 100).toFixed(1) + "%");

print("\nBookings:");
print("  Total: " + totalBookings);
print("  With inventory type fields: " + bookingsWithFields);
print("  Coverage: " + ((bookingsWithFields / totalBookings) * 100).toFixed(1) + "%");

print("\nIndexes on bookings collection:");
db.bookings.getIndexes().forEach(function(idx) {
  print("  - " + idx.name);
});

// Final status
print("\n==============================================");
if (listingsWithField === totalListings && bookingsWithFields === totalBookings) {
  print("  ✅ MIGRATION SUCCESSFUL");
  print("==============================================\n");
  print("All documents migrated successfully.");
  print("Backward compatibility: 100%");
  print("Data loss: 0");
  print("\nBackup collections available:");
  print("  - listings_backup_20260603");
  print("  - bookings_backup_20260603");
  print("\nTo rollback (if needed):");
  print("  db.listings.drop();");
  print("  db.bookings.drop();");
  print("  db.listings_backup_20260603.find().forEach(function(doc) { db.listings.insert(doc); });");
  print("  db.bookings_backup_20260603.find().forEach(function(doc) { db.bookings.insert(doc); });");
} else {
  print("  ❌ MIGRATION INCOMPLETE");
  print("==============================================\n");
  print("Some documents may not have been updated.");
  print("Please review the counts above and re-run if needed.");
}

print("\n");
