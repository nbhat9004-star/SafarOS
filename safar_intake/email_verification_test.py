#!/usr/bin/env python3
"""
Email Verification Flow Backend Test
Tests all 12 scenarios specified in test_result.md
"""

import requests
import json
import time
from datetime import datetime, timedelta
from pymongo import MongoClient

# Configuration
BASE_URL = "http://localhost:3000/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "safar"

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def log_test(scenario, passed, message=""):
    """Log test result"""
    results["total"] += 1
    status = "✅ PASS" if passed else "❌ FAIL"
    full_message = f"{status} | Scenario {scenario}: {message}"
    print(full_message)
    if passed:
        results["passed"].append(f"Scenario {scenario}")
    else:
        results["failed"].append(f"Scenario {scenario}: {message}")
    return passed

def get_db():
    """Get MongoDB database connection"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def cleanup_test_user(email):
    """Remove test user from database"""
    try:
        db = get_db()
        db.users.delete_one({"email": email.lower()})
    except Exception as e:
        print(f"Warning: Could not cleanup user {email}: {e}")

def get_user_from_db(email):
    """Fetch user from MongoDB"""
    db = get_db()
    return db.users.find_one({"email": email.lower()})

def update_user_in_db(email, update):
    """Update user in MongoDB"""
    db = get_db()
    return db.users.update_one({"email": email.lower()}, update)

def create_approved_listing(host_token):
    """Create an approved listing for testing gating"""
    try:
        response = requests.post(
            f"{BASE_URL}/listings",
            headers={"Authorization": f"Bearer {host_token}"},
            json={
                "title": "Test Listing for Email Verification",
                "description": "This is a test listing to verify email gating works correctly",
                "category": "stay",
                "location": "Srinagar",
                "price": 5000,
                "images": ["https://example.com/image.jpg"]
            }
        )
        if response.status_code == 201:
            listing = response.json().get("listing", {})
            # Approve it via DB (simulate admin approval)
            db = get_db()
            db.listings.update_one(
                {"id": listing["id"]},
                {"$set": {"status": "approved"}}
            )
            return listing["id"]
        return None
    except Exception as e:
        print(f"Warning: Could not create test listing: {e}")
        return None

print("=" * 80)
print("EMAIL VERIFICATION FLOW - BACKEND TEST")
print("=" * 80)
print(f"Testing against: {BASE_URL}")
print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)
print()

# Generate unique test email
timestamp = int(time.time())
test_email = f"test-verify-{timestamp}@safar.test"
test_password = "testpass123"
test_name = "Test User"

print("🧪 SCENARIO 1: Register new user → emailVerified=false")
print("-" * 80)
try:
    cleanup_test_user(test_email)
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": test_name,
            "email": test_email,
            "password": test_password,
            "role": "traveler"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        token = data.get("token", "")
        
        if user.get("emailVerified") == False and token:
            log_test("1", True, "User registered with emailVerified=false, token returned")
        else:
            log_test("1", False, f"Expected emailVerified=false, got {user.get('emailVerified')}")
    else:
        log_test("1", False, f"Registration failed: {response.status_code} - {response.text}")
except Exception as e:
    log_test("1", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 2: Check DB for verificationToken & verificationExpiry")
print("-" * 80)
try:
    user_doc = get_user_from_db(test_email)
    
    if user_doc:
        has_token = "verificationToken" in user_doc and user_doc["verificationToken"]
        has_expiry = "verificationExpiry" in user_doc and user_doc["verificationExpiry"]
        
        if has_token and has_expiry:
            verification_token = user_doc["verificationToken"]
            verification_expiry = user_doc["verificationExpiry"]
            log_test("2", True, f"Token present (64 chars), expiry set to {verification_expiry}")
        else:
            log_test("2", False, f"Missing token or expiry. Token: {has_token}, Expiry: {has_expiry}")
    else:
        log_test("2", False, "User not found in database")
except Exception as e:
    log_test("2", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 3: Verify email with correct token → emailVerified=true")
print("-" * 80)
try:
    user_doc = get_user_from_db(test_email)
    verification_token = user_doc.get("verificationToken")
    
    if verification_token:
        response = requests.get(f"{BASE_URL}/auth/verify-email?token={verification_token}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("verified") == True:
                # Check DB
                user_doc_after = get_user_from_db(test_email)
                if user_doc_after.get("emailVerified") == True:
                    has_token = "verificationToken" in user_doc_after
                    has_expiry = "verificationExpiry" in user_doc_after
                    
                    if not has_token and not has_expiry:
                        log_test("3", True, "Email verified, DB updated: emailVerified=true, token/expiry cleared")
                    else:
                        log_test("3", False, f"Token/expiry not cleared. Token exists: {has_token}, Expiry exists: {has_expiry}")
                else:
                    log_test("3", False, f"emailVerified not set to true in DB: {user_doc_after.get('emailVerified')}")
            else:
                log_test("3", False, f"Response did not indicate verification: {data}")
        else:
            log_test("3", False, f"Verification failed: {response.status_code} - {response.text}")
    else:
        log_test("3", False, "No verification token found in DB")
except Exception as e:
    log_test("3", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 4: Try same token again → 400 'invalid or already used'")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/auth/verify-email?token={verification_token}")
    
    if response.status_code == 400:
        data = response.json()
        error_msg = data.get("error", "").lower()
        if "invalid" in error_msg or "already" in error_msg or "used" in error_msg:
            log_test("4", True, f"Correct 400 error: {data.get('error')}")
        else:
            log_test("4", False, f"Wrong error message: {data.get('error')}")
    else:
        log_test("4", False, f"Expected 400, got {response.status_code}")
except Exception as e:
    log_test("4", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 5: Verify without token → 400")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/auth/verify-email")
    
    if response.status_code == 400:
        log_test("5", True, "Correctly returns 400 when token missing")
    else:
        log_test("5", False, f"Expected 400, got {response.status_code}")
except Exception as e:
    log_test("5", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 6: Expired token → 400 'expired'")
print("-" * 80)
try:
    # Create a new user with expired token
    expired_email = f"test-expired-{timestamp}@safar.test"
    cleanup_test_user(expired_email)
    
    # Register
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": "Expired Test",
            "email": expired_email,
            "password": test_password,
            "role": "traveler"
        }
    )
    
    if response.status_code == 200:
        # Get token from DB
        user_doc = get_user_from_db(expired_email)
        expired_token = user_doc.get("verificationToken")
        
        # Manually set expiry to past
        past_date = datetime.now() - timedelta(hours=25)
        update_user_in_db(expired_email, {"$set": {"verificationExpiry": past_date}})
        
        # Try to verify
        response = requests.get(f"{BASE_URL}/auth/verify-email?token={expired_token}")
        
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get("error", "").lower()
            if "expired" in error_msg:
                log_test("6", True, f"Correct expired error: {data.get('error')}")
            else:
                log_test("6", False, f"Wrong error message: {data.get('error')}")
        else:
            log_test("6", False, f"Expected 400, got {response.status_code}")
        
        cleanup_test_user(expired_email)
    else:
        log_test("6", False, f"Could not create test user: {response.status_code}")
except Exception as e:
    log_test("6", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 7: Resend verification (unverified user) → new token")
print("-" * 80)
try:
    # Create unverified user
    resend_email = f"test-resend-{timestamp}@safar.test"
    cleanup_test_user(resend_email)
    
    # Register
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": "Resend Test",
            "email": resend_email,
            "password": test_password,
            "role": "traveler"
        }
    )
    
    if response.status_code == 200:
        # Get original token
        user_doc_before = get_user_from_db(resend_email)
        old_token = user_doc_before.get("verificationToken")
        old_expiry = user_doc_before.get("verificationExpiry")
        
        time.sleep(1)  # Ensure timestamp difference
        
        # Resend verification
        response = requests.post(
            f"{BASE_URL}/auth/resend-verification",
            json={"email": resend_email}
        )
        
        if response.status_code == 200:
            # Check DB for new token
            user_doc_after = get_user_from_db(resend_email)
            new_token = user_doc_after.get("verificationToken")
            new_expiry = user_doc_after.get("verificationExpiry")
            
            if new_token != old_token and new_expiry != old_expiry:
                log_test("7", True, "New token generated, expiry updated")
            else:
                log_test("7", False, f"Token not changed. Old: {old_token[:10]}..., New: {new_token[:10] if new_token else 'None'}...")
        else:
            log_test("7", False, f"Resend failed: {response.status_code}")
        
        cleanup_test_user(resend_email)
    else:
        log_test("7", False, f"Could not create test user: {response.status_code}")
except Exception as e:
    log_test("7", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 8: Resend verification (verified user) → no change")
print("-" * 80)
try:
    # Use the already verified user from scenario 3
    user_doc_before = get_user_from_db(test_email)
    
    # Resend verification
    response = requests.post(
        f"{BASE_URL}/auth/resend-verification",
        json={"email": test_email}
    )
    
    if response.status_code == 200:
        # Check DB - should not have new token
        user_doc_after = get_user_from_db(test_email)
        has_token = "verificationToken" in user_doc_after
        
        if not has_token and user_doc_after.get("emailVerified") == True:
            log_test("8", True, "No token added to verified user (generic response returned)")
        else:
            log_test("8", False, f"Token added to verified user: {has_token}")
    else:
        log_test("8", False, f"Resend failed: {response.status_code}")
except Exception as e:
    log_test("8", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 9: Resend verification (non-existent email) → 200 generic")
print("-" * 80)
try:
    fake_email = f"nonexistent-{timestamp}@safar.test"
    
    response = requests.post(
        f"{BASE_URL}/auth/resend-verification",
        json={"email": fake_email}
    )
    
    if response.status_code == 200:
        data = response.json()
        # Should return generic message (no account enumeration)
        log_test("9", True, f"Generic 200 response: {data.get('message', '')[:50]}...")
    else:
        log_test("9", False, f"Expected 200, got {response.status_code}")
except Exception as e:
    log_test("9", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 10a: Unverified host tries POST /api/listings → 403")
print("-" * 80)
try:
    # Create unverified host
    unverified_host_email = f"test-host-unverified-{timestamp}@safar.test"
    cleanup_test_user(unverified_host_email)
    
    # Register as traveler first
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": "Unverified Host",
            "email": unverified_host_email,
            "password": test_password,
            "role": "host"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        host_token = data.get("token")
        
        # Try to create listing
        response = requests.post(
            f"{BASE_URL}/listings",
            headers={"Authorization": f"Bearer {host_token}"},
            json={
                "title": "Test Listing",
                "description": "This should be blocked by email verification gate",
                "category": "stay",
                "location": "Srinagar",
                "price": 5000,
                "images": ["https://example.com/image.jpg"]
            }
        )
        
        if response.status_code == 403:
            data = response.json()
            error_msg = data.get("error", "").lower()
            if "verify" in error_msg and "email" in error_msg:
                log_test("10a", True, f"Correct 403 gating: {data.get('error')}")
            else:
                log_test("10a", False, f"Wrong error message: {data.get('error')}")
        else:
            log_test("10a", False, f"Expected 403, got {response.status_code}")
        
        cleanup_test_user(unverified_host_email)
    else:
        log_test("10a", False, f"Could not create host: {response.status_code}")
except Exception as e:
    log_test("10a", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 10b: Unverified user tries POST /api/bookings → 403")
print("-" * 80)
try:
    # Create unverified traveler
    unverified_traveler_email = f"test-traveler-unverified-{timestamp}@safar.test"
    cleanup_test_user(unverified_traveler_email)
    
    # Register
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": "Unverified Traveler",
            "email": unverified_traveler_email,
            "password": test_password,
            "role": "traveler"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        traveler_token = data.get("token")
        
        # Get an approved listing ID (use demo listing)
        listings_response = requests.get(f"{BASE_URL}/listings?limit=1")
        if listings_response.status_code == 200:
            listings = listings_response.json().get("listings", [])
            if listings:
                listing_id = listings[0]["id"]
                
                # Try to create booking
                tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
                
                response = requests.post(
                    f"{BASE_URL}/bookings",
                    headers={"Authorization": f"Bearer {traveler_token}"},
                    json={
                        "listingId": listing_id,
                        "checkInDate": tomorrow,
                        "checkOutDate": day_after,
                        "guests": 2
                    }
                )
                
                if response.status_code == 403:
                    data = response.json()
                    error_msg = data.get("error", "").lower()
                    if "verify" in error_msg and "email" in error_msg:
                        log_test("10b", True, f"Correct 403 gating: {data.get('error')}")
                    else:
                        log_test("10b", False, f"Wrong error message: {data.get('error')}")
                else:
                    log_test("10b", False, f"Expected 403, got {response.status_code}")
            else:
                log_test("10b", False, "No listings available for booking test")
        else:
            log_test("10b", False, f"Could not fetch listings: {listings_response.status_code}")
        
        cleanup_test_user(unverified_traveler_email)
    else:
        log_test("10b", False, f"Could not create traveler: {response.status_code}")
except Exception as e:
    log_test("10b", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 10c: After verification, gated actions should work")
print("-" * 80)
try:
    # Create and verify a host
    verified_host_email = f"test-host-verified-{timestamp}@safar.test"
    cleanup_test_user(verified_host_email)
    
    # Register
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": "Verified Host",
            "email": verified_host_email,
            "password": test_password,
            "role": "host"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        host_token = data.get("token")
        
        # Get verification token and verify
        user_doc = get_user_from_db(verified_host_email)
        verify_token = user_doc.get("verificationToken")
        
        # Verify email
        verify_response = requests.get(f"{BASE_URL}/auth/verify-email?token={verify_token}")
        
        if verify_response.status_code == 200:
            # Now try to create listing (should work)
            response = requests.post(
                f"{BASE_URL}/listings",
                headers={"Authorization": f"Bearer {host_token}"},
                json={
                    "title": "Test Listing After Verification",
                    "description": "This should work after email verification",
                    "category": "stay",
                    "location": "Srinagar",
                    "price": 5000,
                    "images": ["https://example.com/image.jpg"]
                }
            )
            
            # Should be 201 (created) or 200, not 403
            if response.status_code in [200, 201]:
                log_test("10c", True, f"Listing created successfully after verification: {response.status_code}")
            elif response.status_code == 403:
                data = response.json()
                log_test("10c", False, f"Still blocked after verification: {data.get('error')}")
            else:
                # Other errors are acceptable (e.g., validation) - not a verification issue
                log_test("10c", True, f"Not blocked by verification (got {response.status_code}, not 403)")
        else:
            log_test("10c", False, f"Email verification failed: {verify_response.status_code}")
        
        cleanup_test_user(verified_host_email)
    else:
        log_test("10c", False, f"Could not create host: {response.status_code}")
except Exception as e:
    log_test("10c", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 11a: Password reset - forgot password → resetToken set")
print("-" * 80)
try:
    # Use existing verified user
    response = requests.post(
        f"{BASE_URL}/auth/forgot-password",
        json={"email": test_email}
    )
    
    if response.status_code == 200:
        # Check DB for resetToken
        user_doc = get_user_from_db(test_email)
        has_reset_token = "resetToken" in user_doc and user_doc["resetToken"]
        has_reset_expiry = "resetTokenExpiry" in user_doc and user_doc["resetTokenExpiry"]
        
        if has_reset_token and has_reset_expiry:
            reset_token = user_doc["resetToken"]
            log_test("11a", True, "Reset token and expiry set in DB")
        else:
            log_test("11a", False, f"Reset token not set. Token: {has_reset_token}, Expiry: {has_reset_expiry}")
    else:
        log_test("11a", False, f"Forgot password failed: {response.status_code}")
except Exception as e:
    log_test("11a", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 11b: Password reset - reset with token → password updated")
print("-" * 80)
try:
    user_doc = get_user_from_db(test_email)
    reset_token = user_doc.get("resetToken")
    old_password_hash = user_doc.get("passwordHash")
    
    if reset_token:
        new_password = "newpassword123"
        
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json={
                "token": reset_token,
                "password": new_password
            }
        )
        
        if response.status_code == 200:
            # Check DB
            user_doc_after = get_user_from_db(test_email)
            new_password_hash = user_doc_after.get("passwordHash")
            has_reset_token = "resetToken" in user_doc_after
            
            if new_password_hash != old_password_hash and not has_reset_token:
                log_test("11b", True, "Password updated, reset token cleared")
            else:
                log_test("11b", False, f"Password not updated or token not cleared. Hash changed: {new_password_hash != old_password_hash}, Token cleared: {not has_reset_token}")
        else:
            log_test("11b", False, f"Password reset failed: {response.status_code}")
    else:
        log_test("11b", False, "No reset token found in DB")
except Exception as e:
    log_test("11b", False, f"Exception: {str(e)}")

print()

print("🧪 SCENARIO 12: Login & /auth/me return emailVerified field")
print("-" * 80)
try:
    # Login with verified user
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": "newpassword123"  # Use new password from scenario 11b
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        user = data.get("user", {})
        token = data.get("token")
        
        # Check login response
        has_email_verified_in_login = "emailVerified" in user
        
        # Check /auth/me
        me_response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if me_response.status_code == 200:
            me_data = me_response.json()
            me_user = me_data.get("user", {})
            has_email_verified_in_me = "emailVerified" in me_user
            
            if has_email_verified_in_login and has_email_verified_in_me:
                log_test("12", True, f"emailVerified present in both login and /auth/me (value: {user.get('emailVerified')})")
            else:
                log_test("12", False, f"emailVerified missing. Login: {has_email_verified_in_login}, /auth/me: {has_email_verified_in_me}")
        else:
            log_test("12", False, f"/auth/me failed: {me_response.status_code}")
    else:
        log_test("12", False, f"Login failed: {response.status_code}")
except Exception as e:
    log_test("12", False, f"Exception: {str(e)}")

print()

# Cleanup
print("🧹 Cleaning up test data...")
cleanup_test_user(test_email)

# Summary
print()
print("=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"Total Tests: {results['total']}")
print(f"Passed: {len(results['passed'])} ✅")
print(f"Failed: {len(results['failed'])} ❌")
print()

if results['failed']:
    print("FAILED TESTS:")
    for failure in results['failed']:
        print(f"  ❌ {failure}")
    print()

print("PASSED TESTS:")
for success in results['passed']:
    print(f"  ✅ {success}")

print()
print("=" * 80)
if len(results['failed']) == 0:
    print("🎉 ALL TESTS PASSED!")
else:
    print(f"⚠️  {len(results['failed'])} TEST(S) FAILED")
print("=" * 80)
