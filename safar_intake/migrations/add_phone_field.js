// Migration: Add phone field to users
// Date: June 3, 2026

use safar;

print("\n==============================================");
print("  Add Phone Field to Users");
print("==============================================\n");

// Add phone field to all users (default null)
var result = db.users.updateMany(
  { phone: { $exists: false } },
  { $set: { phone: null } }
);

print("✅ Users updated: " + result.modifiedCount);

var totalUsers = db.users.countDocuments({});
var usersWithPhone = db.users.countDocuments({ phone: { $exists: true } });

print("\nVerification:");
print("  Total users: " + totalUsers);
print("  Users with phone field: " + usersWithPhone);

if (usersWithPhone === totalUsers) {
  print("\n✅ Migration successful!");
} else {
  print("\n❌ Migration incomplete!");
}

print("\n");
