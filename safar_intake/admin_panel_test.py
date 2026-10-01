#!/usr/bin/env python3
"""
Admin Panel Backend API Testing
Tests all admin panel endpoints including user management, listing management,
booking management, and revenue dashboard.
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL from supervisor config
BASE_URL = "https://app-ownership-patch.preview.emergentagent.com/api"

# Test results
results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    results["tests"].append({"name": name, "passed": passed, "details": details})
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
    print(f"{status}: {name}")
    if details:
        print(f"  Details: {details}")

def login(email, password):
    """Login and return auth token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def register_user(name, email, password, role):
    """Register a new user"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={"name": name, "email": email, "password": password, "role": role},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("user", {}).get("id"), data.get("token")
        return None, None
    except Exception as e:
        print(f"Registration error: {e}")
        return None, None

def create_listing(token, title, category, location, price):
    """Create a listing"""
    try:
        response = requests.post(
            f"{BASE_URL}/listings",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": title,
                "description": "Test listing for admin panel testing",
                "category": category,
                "subcategory": "test",
                "location": location,
                "price": price,
                "images": ["https://example.com/image.jpg"],
                "amenities": [],
                "services": []
            },
            timeout=10
        )
        if response.status_code == 201:
            data = response.json()
            return data.get("listing", {}).get("id")
        return None
    except Exception as e:
        print(f"Create listing error: {e}")
        return None

def create_booking(token, listing_id):
    """Create a booking"""
    try:
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        response = requests.post(
            f"{BASE_URL}/bookings",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "listingId": listing_id,
                "checkInDate": check_in,
                "checkOutDate": check_out,
                "guests": 2
            },
            timeout=10
        )
        if response.status_code == 201:
            data = response.json()
            return data.get("booking", {}).get("bookingId")
        return None
    except Exception as e:
        print(f"Create booking error: {e}")
        return None

print("=" * 80)
print("ADMIN PANEL BACKEND API TESTING")
print("=" * 80)
print()

# Step 1: Setup - Login as admin
print("STEP 1: ADMIN AUTHENTICATION")
print("-" * 80)

admin_token = login("admin@safar.com", "admin123")
if not admin_token:
    print("❌ CRITICAL: Admin login failed. Cannot proceed with tests.")
    exit(1)

log_test("Admin login successful", True, "Admin authenticated")
print()

# Step 2: Create test users for user management tests
print("STEP 2: SETUP - CREATE TEST USERS")
print("-" * 80)

timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
test_traveler_email = f"test-traveler-{timestamp}@safar.com"
test_host_email = f"test-host-{timestamp}@safar.com"

traveler_id, traveler_token = register_user("Test Traveler", test_traveler_email, "password123", "traveler")
host_id, host_token = register_user("Test Host", test_host_email, "password123", "host")

log_test("Test traveler created", traveler_id is not None, f"ID: {traveler_id}")
log_test("Test host created", host_id is not None, f"ID: {host_id}")
print()

# Step 3: P0 - User Management Endpoints
print("STEP 3: P0 - USER MANAGEMENT ENDPOINTS")
print("-" * 80)

# Test 1: GET /api/users - Should return all users with counts
try:
    response = requests.get(
        f"{BASE_URL}/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        users = data.get("users", [])
        has_counts = all("listingCount" in u and "bookingCount" in u for u in users)
        log_test("GET /api/users - Returns users with counts", 
                 len(users) > 0 and has_counts,
                 f"Found {len(users)} users with listingCount and bookingCount")
    else:
        log_test("GET /api/users", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("GET /api/users", False, str(e))

# Test 2: POST /api/admin/users/:id/suspend - Suspend a non-admin user
try:
    response = requests.post(
        f"{BASE_URL}/admin/users/{traveler_id}/suspend",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        log_test("POST /api/admin/users/:id/suspend - Suspend traveler",
                 user.get("status") == "suspended",
                 f"User status: {user.get('status')}")
    else:
        log_test("POST /api/admin/users/:id/suspend", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("POST /api/admin/users/:id/suspend", False, str(e))

# Test 3: POST /api/admin/users/:id/reactivate - Reactivate a suspended user
try:
    response = requests.post(
        f"{BASE_URL}/admin/users/{traveler_id}/reactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        log_test("POST /api/admin/users/:id/reactivate - Reactivate user",
                 user.get("status") == "active",
                 f"User status: {user.get('status')}")
    else:
        log_test("POST /api/admin/users/:id/reactivate", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("POST /api/admin/users/:id/reactivate", False, str(e))

# Test 4: POST /api/admin/users/:id/blacklist - Blacklist a non-admin user
try:
    response = requests.post(
        f"{BASE_URL}/admin/users/{traveler_id}/blacklist",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        log_test("POST /api/admin/users/:id/blacklist - Blacklist user",
                 user.get("status") == "blacklisted" and user.get("blacklisted") == True,
                 f"User status: {user.get('status')}, blacklisted: {user.get('blacklisted')}")
    else:
        log_test("POST /api/admin/users/:id/blacklist", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("POST /api/admin/users/:id/blacklist", False, str(e))

# Test 5: PATCH /api/admin/users/:id/role - Change user role
try:
    response = requests.patch(
        f"{BASE_URL}/admin/users/{host_id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "traveler"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        log_test("PATCH /api/admin/users/:id/role - Change role",
                 user.get("role") == "traveler",
                 f"User role changed to: {user.get('role')}")
    else:
        log_test("PATCH /api/admin/users/:id/role", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("PATCH /api/admin/users/:id/role", False, str(e))

# Test 6: Admin protection - Cannot suspend admin users
try:
    # Get admin user ID from /api/users
    response = requests.get(
        f"{BASE_URL}/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    admin_users = [u for u in response.json().get("users", []) if u.get("role") == "admin"]
    if admin_users:
        admin_user_id = admin_users[0].get("id")
        response = requests.post(
            f"{BASE_URL}/admin/users/{admin_user_id}/suspend",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        log_test("Admin protection - Cannot suspend admin",
                 response.status_code == 403,
                 f"Status: {response.status_code}, Expected: 403")
    else:
        log_test("Admin protection - Cannot suspend admin", False, "No admin user found")
except Exception as e:
    log_test("Admin protection - Cannot suspend admin", False, str(e))

# Test 7: DELETE /api/admin/users/:id - Delete a non-admin user
try:
    response = requests.delete(
        f"{BASE_URL}/admin/users/{traveler_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        log_test("DELETE /api/admin/users/:id - Delete user",
                 data.get("deleted") == True,
                 "User deleted successfully")
    else:
        log_test("DELETE /api/admin/users/:id", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("DELETE /api/admin/users/:id", False, str(e))

# Test 8: Non-admin cannot access user management endpoints
try:
    response = requests.post(
        f"{BASE_URL}/admin/users/{host_id}/suspend",
        headers={"Authorization": f"Bearer {host_token}"},
        timeout=10
    )
    log_test("Non-admin blocked from user management",
             response.status_code == 403,
             f"Status: {response.status_code}, Expected: 403")
except Exception as e:
    log_test("Non-admin blocked from user management", False, str(e))

print()

# Step 4: P1 - Listing Management Endpoints
print("STEP 4: P1 - LISTING MANAGEMENT ENDPOINTS")
print("-" * 80)

# Create a new host for listing tests (previous host was changed to traveler)
listing_host_email = f"listing-host-{timestamp}@safar.com"
listing_host_id, listing_host_token = register_user("Listing Host", listing_host_email, "password123", "host")
log_test("Setup - Create listing host", listing_host_id is not None, f"Host ID: {listing_host_id}")

# Create a test listing
listing_id = create_listing(listing_host_token, "Test Listing for Admin", "stay", "Srinagar", 5000)
log_test("Setup - Create test listing", listing_id is not None, f"Listing ID: {listing_id}")

if listing_id:
    # Test 9: POST /api/listings/:id/suspend - Suspend a listing
    try:
        response = requests.post(
            f"{BASE_URL}/listings/{listing_id}/suspend",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            listing = data.get("listing", {})
            log_test("POST /api/listings/:id/suspend - Suspend listing",
                     listing.get("status") == "suspended",
                     f"Listing status: {listing.get('status')}")
        else:
            log_test("POST /api/listings/:id/suspend", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("POST /api/listings/:id/suspend", False, str(e))

    # Test 10: POST /api/listings/:id/activate - Activate a suspended listing
    try:
        response = requests.post(
            f"{BASE_URL}/listings/{listing_id}/activate",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            listing = data.get("listing", {})
            log_test("POST /api/listings/:id/activate - Activate listing",
                     listing.get("status") == "approved",
                     f"Listing status: {listing.get('status')}")
        else:
            log_test("POST /api/listings/:id/activate", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("POST /api/listings/:id/activate", False, str(e))

    # Test 11: PATCH /api/listings/:id/featured - Toggle featured status
    try:
        response = requests.patch(
            f"{BASE_URL}/listings/{listing_id}/featured",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"featured": True},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            listing = data.get("listing", {})
            log_test("PATCH /api/listings/:id/featured - Set featured true",
                     listing.get("featured") == True,
                     f"Featured: {listing.get('featured')}")
        else:
            log_test("PATCH /api/listings/:id/featured", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("PATCH /api/listings/:id/featured", False, str(e))

    # Test 12: Toggle featured back to false
    try:
        response = requests.patch(
            f"{BASE_URL}/listings/{listing_id}/featured",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"featured": False},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            listing = data.get("listing", {})
            log_test("PATCH /api/listings/:id/featured - Set featured false",
                     listing.get("featured") == False,
                     f"Featured: {listing.get('featured')}")
        else:
            log_test("PATCH /api/listings/:id/featured", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("PATCH /api/listings/:id/featured", False, str(e))

    # Test 13: Non-admin cannot manage listings
    try:
        response = requests.post(
            f"{BASE_URL}/listings/{listing_id}/suspend",
            headers={"Authorization": f"Bearer {listing_host_token}"},
            timeout=10
        )
        log_test("Non-admin blocked from listing management",
                 response.status_code == 403,
                 f"Status: {response.status_code}, Expected: 403")
    except Exception as e:
        log_test("Non-admin blocked from listing management", False, str(e))

print()

# Step 5: P2 - Booking Management Endpoints
print("STEP 5: P2 - BOOKING MANAGEMENT ENDPOINTS")
print("-" * 80)

# Create a test booking
booking_id = None
if listing_id:
    # Create a new traveler for booking
    booking_traveler_email = f"booking-traveler-{timestamp}@safar.com"
    booking_traveler_id, booking_traveler_token = register_user("Booking Traveler", booking_traveler_email, "password123", "traveler")
    
    if booking_traveler_token:
        booking_id = create_booking(booking_traveler_token, listing_id)
        log_test("Setup - Create test booking", booking_id is not None, f"Booking ID: {booking_id}")

if booking_id:
    # Test 14: POST /api/admin/bookings/:id/cancel - Cancel a booking
    try:
        response = requests.post(
            f"{BASE_URL}/admin/bookings/{booking_id}/cancel",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            booking = data.get("booking", {})
            log_test("POST /api/admin/bookings/:id/cancel - Cancel booking",
                     booking.get("status") == "cancelled",
                     f"Booking status: {booking.get('status')}")
        else:
            log_test("POST /api/admin/bookings/:id/cancel", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("POST /api/admin/bookings/:id/cancel", False, str(e))

    # Create another booking for refund test
    booking_id_2 = create_booking(booking_traveler_token, listing_id)
    if booking_id_2:
        # Test 15: POST /api/admin/bookings/:id/refund - Issue refund
        try:
            response = requests.post(
                f"{BASE_URL}/admin/bookings/{booking_id_2}/refund",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                booking = data.get("booking", {})
                log_test("POST /api/admin/bookings/:id/refund - Issue refund",
                         booking.get("refunded") == True,
                         f"Refunded: {booking.get('refunded')}")
            else:
                log_test("POST /api/admin/bookings/:id/refund", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("POST /api/admin/bookings/:id/refund", False, str(e))

    # Test 16: Non-admin cannot manage bookings
    try:
        response = requests.post(
            f"{BASE_URL}/admin/bookings/{booking_id}/cancel",
            headers={"Authorization": f"Bearer {listing_host_token}"},
            timeout=10
        )
        log_test("Non-admin blocked from booking management",
                 response.status_code == 403,
                 f"Status: {response.status_code}, Expected: 403")
    except Exception as e:
        log_test("Non-admin blocked from booking management", False, str(e))

print()

# Step 6: P3 - Revenue Dashboard Endpoints
print("STEP 6: P3 - REVENUE DASHBOARD ENDPOINTS")
print("-" * 80)

# Test 17: GET /api/admin/revenue - Get revenue stats
try:
    response = requests.get(
        f"{BASE_URL}/admin/revenue",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        has_all_fields = all(field in data for field in [
            "totalRevenue", "todayRevenue", "monthlyRevenue", 
            "pendingPayments", "platformCommission"
        ])
        log_test("GET /api/admin/revenue - Returns revenue stats",
                 has_all_fields,
                 f"Fields: totalRevenue={data.get('totalRevenue')}, todayRevenue={data.get('todayRevenue')}, monthlyRevenue={data.get('monthlyRevenue')}, pendingPayments={data.get('pendingPayments')}, platformCommission={data.get('platformCommission')}")
    else:
        log_test("GET /api/admin/revenue", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("GET /api/admin/revenue", False, str(e))

# Test 18: GET /api/admin/transactions - Get recent transactions
try:
    response = requests.get(
        f"{BASE_URL}/admin/transactions",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        transactions = data.get("transactions", [])
        has_commission = all("commission" in t and "hostPayout" in t for t in transactions)
        log_test("GET /api/admin/transactions - Returns transactions with commission",
                 has_commission or len(transactions) == 0,
                 f"Found {len(transactions)} transactions with commission and hostPayout")
    else:
        log_test("GET /api/admin/transactions", False, f"Status: {response.status_code}")
except Exception as e:
    log_test("GET /api/admin/transactions", False, str(e))

# Test 19: Non-admin cannot access revenue endpoints
try:
    response = requests.get(
        f"{BASE_URL}/admin/revenue",
        headers={"Authorization": f"Bearer {host_token}"},
        timeout=10
    )
    log_test("Non-admin blocked from revenue dashboard",
             response.status_code == 403,
             f"Status: {response.status_code}, Expected: 403")
except Exception as e:
    log_test("Non-admin blocked from revenue dashboard", False, str(e))

print()

# Summary
print("=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"Total Tests: {results['passed'] + results['failed']}")
print(f"✅ Passed: {results['passed']}")
print(f"❌ Failed: {results['failed']}")
print(f"Success Rate: {results['passed'] / (results['passed'] + results['failed']) * 100:.1f}%")
print()

if results['failed'] > 0:
    print("FAILED TESTS:")
    for test in results['tests']:
        if not test['passed']:
            print(f"  ❌ {test['name']}")
            if test['details']:
                print(f"     {test['details']}")
    print()

print("=" * 80)
print("ADMIN PANEL BACKEND TESTING COMPLETE")
print("=" * 80)
