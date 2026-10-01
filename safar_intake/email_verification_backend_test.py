#!/usr/bin/env python3
"""
Comprehensive Email Verification Flow Testing for Safar Application
Tests all email verification scenarios including registration, verification, resend, and gating.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from pymongo import MongoClient
import os

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_URL = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'safar')

# MongoDB connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
users_collection = db['users']
listings_collection = db['listings']

# Test counters
tests_passed = 0
tests_failed = 0

def log_test(test_name, passed, details=""):
    """Log test results"""
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"   {details}")
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1

def print_section(title):
    """Print section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

# Test data
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
test_email_new = f"newuser.{timestamp}@safar.test"
test_email_duplicate = "testhost.safar@gmail.com"  # Existing user from main agent
test_password = "testpass123"

print_section("EMAIL VERIFICATION FLOW - COMPREHENSIVE BACKEND TESTING")
print(f"Test started at: {datetime.now().isoformat()}")
print(f"Base URL: {BASE_URL}")
print(f"MongoDB: {MONGO_URL}/{DB_NAME}")

# ============================================================================
# SCENARIO 1: POST /api/auth/register - New User Registration
# ============================================================================
print_section("SCENARIO 1: New User Registration with Email Verification")

try:
    response = requests.post(f"{API_URL}/auth/register", json={
        "name": "New Test User",
        "email": test_email_new,
        "password": test_password,
        "role": "traveler"
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok') and data.get('user') and data.get('token'):
            user = data['user']
            token = data['token']
            
            # Check emailVerified is false
            if user.get('emailVerified') == False:
                log_test("1a. Registration returns emailVerified=false", True, 
                        f"User: {user.get('email')}, emailVerified: {user.get('emailVerified')}")
            else:
                log_test("1a. Registration returns emailVerified=false", False, 
                        f"Expected emailVerified=false, got: {user.get('emailVerified')}")
            
            # Check user has id, email, name, role
            if user.get('id') and user.get('email') and user.get('name') and user.get('role'):
                log_test("1b. User object has required fields", True, 
                        f"id: {user.get('id')[:8]}..., email: {user.get('email')}, role: {user.get('role')}")
            else:
                log_test("1b. User object has required fields", False, 
                        f"Missing fields in user object")
            
            # Check JWT token format
            if token and len(token.split('.')) == 3:
                log_test("1c. JWT token format valid", True, 
                        f"Token has 3 segments")
            else:
                log_test("1c. JWT token format valid", False, 
                        f"Invalid token format")
            
            # Store for later tests
            new_user_email = user.get('email')
            new_user_token = token
            new_user_id = user.get('id')
        else:
            log_test("1a. Registration returns emailVerified=false", False, 
                    f"Invalid response format: {data}")
    else:
        log_test("1a. Registration returns emailVerified=false", False, 
                f"Status: {response.status_code}, Response: {response.text}")
except Exception as e:
    log_test("1a. Registration returns emailVerified=false", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 2: Database Verification - Check verificationToken and expiry
# ============================================================================
print_section("SCENARIO 2: Database Verification - Token and Expiry")

try:
    user_doc = users_collection.find_one({"email": test_email_new})
    
    if user_doc:
        verification_token = user_doc.get('verificationToken')
        verification_expiry = user_doc.get('verificationExpiry')
        
        # Check token exists and is 64 chars hex
        if verification_token and len(verification_token) == 64:
            log_test("2a. Verification token generated (64-char hex)", True, 
                    f"Token: {verification_token[:16]}...{verification_token[-16:]}")
        else:
            log_test("2a. Verification token generated (64-char hex)", False, 
                    f"Token length: {len(verification_token) if verification_token else 0}")
        
        # Check expiry is ~24 hours from now
        if verification_expiry:
            expiry_hours = (verification_expiry - datetime.now()).total_seconds() / 3600
            if 23 <= expiry_hours <= 25:
                log_test("2b. Verification expiry set to 24 hours", True, 
                        f"Expiry: {verification_expiry.isoformat()}, Hours from now: {expiry_hours:.1f}")
            else:
                log_test("2b. Verification expiry set to 24 hours", False, 
                        f"Expiry hours: {expiry_hours:.1f} (expected ~24)")
        else:
            log_test("2b. Verification expiry set to 24 hours", False, 
                    "verificationExpiry not set")
    else:
        log_test("2a. Verification token generated (64-char hex)", False, 
                "User not found in database")
except Exception as e:
    log_test("2a. Verification token generated (64-char hex)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 3: Duplicate Email Registration
# ============================================================================
print_section("SCENARIO 3: Duplicate Email Registration")

try:
    response = requests.post(f"{API_URL}/auth/register", json={
        "name": "Duplicate User",
        "email": test_email_duplicate,
        "password": test_password,
        "role": "host"
    })
    
    if response.status_code == 409:
        data = response.json()
        log_test("3. Duplicate email returns 409 Conflict", True, 
                f"Message: {data.get('error', 'No error message')}")
    else:
        log_test("3. Duplicate email returns 409 Conflict", False, 
                f"Status: {response.status_code}, Expected: 409")
except Exception as e:
    log_test("3. Duplicate email returns 409 Conflict", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 4: GET /api/auth/verify-email - Valid Token
# ============================================================================
print_section("SCENARIO 4: Email Verification with Valid Token")

try:
    # Get the verification token from database
    user_doc = users_collection.find_one({"email": test_email_new})
    valid_token = user_doc.get('verificationToken')
    
    if valid_token:
        response = requests.get(f"{API_URL}/auth/verify-email", params={"token": valid_token})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('verified') == True:
                log_test("4a. Valid token returns 200 with verified=true", True, 
                        f"Message: {data.get('message', 'No message')}")
                
                # Check database - emailVerified should be true, token should be cleared
                user_doc_after = users_collection.find_one({"email": test_email_new})
                if user_doc_after.get('emailVerified') == True:
                    log_test("4b. Database emailVerified updated to true", True, 
                            f"emailVerified: {user_doc_after.get('emailVerified')}")
                else:
                    log_test("4b. Database emailVerified updated to true", False, 
                            f"emailVerified: {user_doc_after.get('emailVerified')}")
                
                if 'verificationToken' not in user_doc_after or user_doc_after.get('verificationToken') is None:
                    log_test("4c. Verification token cleared from database", True, 
                            "Token removed after verification")
                else:
                    log_test("4c. Verification token cleared from database", False, 
                            f"Token still present: {user_doc_after.get('verificationToken')[:16]}...")
                
                if 'verificationExpiry' not in user_doc_after or user_doc_after.get('verificationExpiry') is None:
                    log_test("4d. Verification expiry cleared from database", True, 
                            "Expiry removed after verification")
                else:
                    log_test("4d. Verification expiry cleared from database", False, 
                            f"Expiry still present")
            else:
                log_test("4a. Valid token returns 200 with verified=true", False, 
                        f"Response: {data}")
        else:
            log_test("4a. Valid token returns 200 with verified=true", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    else:
        log_test("4a. Valid token returns 200 with verified=true", False, 
                "No verification token found in database")
except Exception as e:
    log_test("4a. Valid token returns 200 with verified=true", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 5: GET /api/auth/verify-email - Invalid Token (Already Used)
# ============================================================================
print_section("SCENARIO 5: Email Verification with Already Used Token")

try:
    # Try to use the same token again
    response = requests.get(f"{API_URL}/auth/verify-email", params={"token": valid_token})
    
    if response.status_code == 400:
        data = response.json()
        error_msg = data.get('error', '').lower()
        if 'invalid' in error_msg or 'already been used' in error_msg:
            log_test("5. Used token returns 400 with appropriate error", True, 
                    f"Error: {data.get('error')}")
        else:
            log_test("5. Used token returns 400 with appropriate error", False, 
                    f"Error message doesn't indicate token was used: {data.get('error')}")
    else:
        log_test("5. Used token returns 400 with appropriate error", False, 
                f"Status: {response.status_code}, Expected: 400")
except Exception as e:
    log_test("5. Used token returns 400 with appropriate error", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 6: GET /api/auth/verify-email - Missing Token
# ============================================================================
print_section("SCENARIO 6: Email Verification without Token")

try:
    response = requests.get(f"{API_URL}/auth/verify-email")
    
    if response.status_code == 400:
        data = response.json()
        log_test("6. Missing token returns 400", True, 
                f"Error: {data.get('error', 'No error message')}")
    else:
        log_test("6. Missing token returns 400", False, 
                f"Status: {response.status_code}, Expected: 400")
except Exception as e:
    log_test("6. Missing token returns 400", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 7: GET /api/auth/verify-email - Expired Token
# ============================================================================
print_section("SCENARIO 7: Email Verification with Expired Token")

try:
    # Create a new user with expired token
    expired_email = f"expired.{timestamp}@safar.test"
    response = requests.post(f"{API_URL}/auth/register", json={
        "name": "Expired Token User",
        "email": expired_email,
        "password": test_password,
        "role": "traveler"
    })
    
    if response.status_code == 200:
        # Manually set expiry to past date
        user_doc = users_collection.find_one({"email": expired_email})
        expired_token = user_doc.get('verificationToken')
        
        users_collection.update_one(
            {"email": expired_email},
            {"$set": {"verificationExpiry": datetime.now() - timedelta(hours=1)}}
        )
        
        # Try to verify with expired token
        response = requests.get(f"{API_URL}/auth/verify-email", params={"token": expired_token})
        
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if 'expired' in error_msg:
                log_test("7. Expired token returns 400 with 'expired' error", True, 
                        f"Error: {data.get('error')}")
            else:
                log_test("7. Expired token returns 400 with 'expired' error", False, 
                        f"Error doesn't mention expiry: {data.get('error')}")
        else:
            log_test("7. Expired token returns 400 with 'expired' error", False, 
                    f"Status: {response.status_code}, Expected: 400")
    else:
        log_test("7. Expired token returns 400 with 'expired' error", False, 
                "Failed to create test user for expired token test")
except Exception as e:
    log_test("7. Expired token returns 400 with 'expired' error", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 8: POST /api/auth/resend-verification - Unverified User
# ============================================================================
print_section("SCENARIO 8: Resend Verification for Unverified User")

try:
    # Create a new unverified user
    resend_email = f"resend.{timestamp}@safar.test"
    response = requests.post(f"{API_URL}/auth/register", json={
        "name": "Resend Test User",
        "email": resend_email,
        "password": test_password,
        "role": "traveler"
    })
    
    if response.status_code == 200:
        # Get original token
        user_doc_before = users_collection.find_one({"email": resend_email})
        original_token = user_doc_before.get('verificationToken')
        original_expiry = user_doc_before.get('verificationExpiry')
        
        time.sleep(1)  # Wait 1 second to ensure new token is different
        
        # Resend verification
        response = requests.post(f"{API_URL}/auth/resend-verification", json={
            "email": resend_email
        })
        
        if response.status_code == 200:
            data = response.json()
            log_test("8a. Resend verification returns 200", True, 
                    f"Message: {data.get('message', 'No message')}")
            
            # Check database - new token should be generated
            user_doc_after = users_collection.find_one({"email": resend_email})
            new_token = user_doc_after.get('verificationToken')
            new_expiry = user_doc_after.get('verificationExpiry')
            
            if new_token and new_token != original_token:
                log_test("8b. New verification token generated", True, 
                        f"Old: {original_token[:16]}..., New: {new_token[:16]}...")
            else:
                log_test("8b. New verification token generated", False, 
                        f"Token unchanged or missing")
            
            if new_expiry and new_expiry > original_expiry:
                log_test("8c. Fresh 24h expiry set", True, 
                        f"New expiry: {new_expiry.isoformat()}")
            else:
                log_test("8c. Fresh 24h expiry set", False, 
                        f"Expiry not updated properly")
        else:
            log_test("8a. Resend verification returns 200", False, 
                    f"Status: {response.status_code}")
    else:
        log_test("8a. Resend verification returns 200", False, 
                "Failed to create test user")
except Exception as e:
    log_test("8a. Resend verification returns 200", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 9: POST /api/auth/resend-verification - Verified User
# ============================================================================
print_section("SCENARIO 9: Resend Verification for Already Verified User")

try:
    # Use the verified user from earlier tests
    response = requests.post(f"{API_URL}/auth/resend-verification", json={
        "email": test_email_new
    })
    
    if response.status_code == 200:
        data = response.json()
        log_test("9a. Resend for verified user returns 200 (generic)", True, 
                f"Message: {data.get('message', 'No message')}")
        
        # Check database - no new token should be added
        user_doc = users_collection.find_one({"email": test_email_new})
        if 'verificationToken' not in user_doc or user_doc.get('verificationToken') is None:
            log_test("9b. No new token added for verified user", True, 
                    "Token remains cleared")
        else:
            log_test("9b. No new token added for verified user", False, 
                    f"Token was added: {user_doc.get('verificationToken')[:16]}...")
    else:
        log_test("9a. Resend for verified user returns 200 (generic)", False, 
                f"Status: {response.status_code}")
except Exception as e:
    log_test("9a. Resend for verified user returns 200 (generic)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 10: POST /api/auth/resend-verification - Non-existent Email
# ============================================================================
print_section("SCENARIO 10: Resend Verification for Non-existent Email")

try:
    response = requests.post(f"{API_URL}/auth/resend-verification", json={
        "email": f"nonexistent.{timestamp}@safar.test"
    })
    
    if response.status_code == 200:
        data = response.json()
        log_test("10. Resend for non-existent email returns 200 (no enumeration)", True, 
                f"Message: {data.get('message', 'No message')}")
    else:
        log_test("10. Resend for non-existent email returns 200 (no enumeration)", False, 
                f"Status: {response.status_code}, Expected: 200")
except Exception as e:
    log_test("10. Resend for non-existent email returns 200 (no enumeration)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 11: GATING - Unverified User Cannot Create Listing
# ============================================================================
print_section("SCENARIO 11: Gating - Unverified Host Cannot Create Listing")

try:
    # Create unverified host
    unverified_host_email = f"unverifiedhost.{timestamp}@safar.test"
    response = requests.post(f"{API_URL}/auth/register", json={
        "name": "Unverified Host",
        "email": unverified_host_email,
        "password": test_password,
        "role": "host"
    })
    
    if response.status_code == 200:
        data = response.json()
        unverified_host_token = data.get('token')
        
        # Try to create listing
        response = requests.post(f"{API_URL}/listings", 
            headers={"Authorization": f"Bearer {unverified_host_token}"},
            json={
                "title": "Test Listing",
                "description": "This should fail due to unverified email",
                "category": "stay",
                "location": "Srinagar",
                "price": 5000
            })
        
        if response.status_code == 403:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if 'verify' in error_msg and 'email' in error_msg:
                log_test("11a. Unverified host blocked from creating listing (403)", True, 
                        f"Error: {data.get('error')}")
            else:
                log_test("11a. Unverified host blocked from creating listing (403)", False, 
                        f"Error doesn't mention email verification: {data.get('error')}")
        else:
            log_test("11a. Unverified host blocked from creating listing (403)", False, 
                    f"Status: {response.status_code}, Expected: 403")
    else:
        log_test("11a. Unverified host blocked from creating listing (403)", False, 
                "Failed to create unverified host")
except Exception as e:
    log_test("11a. Unverified host blocked from creating listing (403)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 12: GATING - Unverified User Cannot Create Booking
# ============================================================================
print_section("SCENARIO 12: Gating - Unverified User Cannot Create Booking")

try:
    # Get an approved listing
    approved_listing = listings_collection.find_one({"status": "approved"})
    
    if approved_listing:
        listing_id = approved_listing.get('id')
        
        # Create unverified traveler
        unverified_traveler_email = f"unverifiedtraveler.{timestamp}@safar.test"
        response = requests.post(f"{API_URL}/auth/register", json={
            "name": "Unverified Traveler",
            "email": unverified_traveler_email,
            "password": test_password,
            "role": "traveler"
        })
        
        if response.status_code == 200:
            data = response.json()
            unverified_traveler_token = data.get('token')
            
            # Try to create booking
            checkin = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            checkout = (datetime.now() + timedelta(days=35)).strftime("%Y-%m-%d")
            
            response = requests.post(f"{API_URL}/bookings",
                headers={"Authorization": f"Bearer {unverified_traveler_token}"},
                json={
                    "listingId": listing_id,
                    "checkInDate": checkin,
                    "checkOutDate": checkout,
                    "guests": 2
                })
            
            if response.status_code == 403:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if 'verify' in error_msg and 'email' in error_msg:
                    log_test("12. Unverified user blocked from creating booking (403)", True, 
                            f"Error: {data.get('error')}")
                else:
                    log_test("12. Unverified user blocked from creating booking (403)", False, 
                            f"Error doesn't mention email verification: {data.get('error')}")
            else:
                log_test("12. Unverified user blocked from creating booking (403)", False, 
                        f"Status: {response.status_code}, Expected: 403")
        else:
            log_test("12. Unverified user blocked from creating booking (403)", False, 
                    "Failed to create unverified traveler")
    else:
        log_test("12. Unverified user blocked from creating booking (403)", False, 
                "No approved listing found for booking test")
except Exception as e:
    log_test("12. Unverified user blocked from creating booking (403)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 13: GATING - Verified User Can Create Listing
# ============================================================================
print_section("SCENARIO 13: Gating - Verified Host Can Create Listing")

try:
    # Verify the unverified host from scenario 11
    user_doc = users_collection.find_one({"email": unverified_host_email})
    if user_doc:
        verification_token = user_doc.get('verificationToken')
        
        # Verify email
        response = requests.get(f"{API_URL}/auth/verify-email", params={"token": verification_token})
        
        if response.status_code == 200:
            # Try to create listing again
            response = requests.post(f"{API_URL}/listings",
                headers={"Authorization": f"Bearer {unverified_host_token}"},
                json={
                    "title": "Test Listing After Verification",
                    "description": "This should succeed after email verification",
                    "category": "stay",
                    "location": "Srinagar",
                    "price": 5000
                })
            
            if response.status_code == 201:
                data = response.json()
                log_test("13. Verified host can create listing (201)", True, 
                        f"Listing created: {data.get('listing', {}).get('id', 'N/A')}")
            else:
                log_test("13. Verified host can create listing (201)", False, 
                        f"Status: {response.status_code}, Expected: 201, Response: {response.text}")
        else:
            log_test("13. Verified host can create listing (201)", False, 
                    "Failed to verify host email")
    else:
        log_test("13. Verified host can create listing (201)", False, 
                "Unverified host not found")
except Exception as e:
    log_test("13. Verified host can create listing (201)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 14: Login with Unverified Account
# ============================================================================
print_section("SCENARIO 14: Login with Unverified Account")

try:
    # Create new unverified user
    login_test_email = f"logintest.{timestamp}@safar.test"
    response = requests.post(f"{API_URL}/auth/register", json={
        "name": "Login Test User",
        "email": login_test_email,
        "password": test_password,
        "role": "traveler"
    })
    
    if response.status_code == 200:
        # Try to login
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": login_test_email,
            "password": test_password
        })
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            if user.get('emailVerified') == False:
                log_test("14. Login allowed for unverified user (emailVerified=false in response)", True, 
                        f"User can login but emailVerified: {user.get('emailVerified')}")
            else:
                log_test("14. Login allowed for unverified user (emailVerified=false in response)", False, 
                        f"emailVerified should be false, got: {user.get('emailVerified')}")
        else:
            log_test("14. Login allowed for unverified user (emailVerified=false in response)", False, 
                    f"Status: {response.status_code}, Expected: 200")
    else:
        log_test("14. Login allowed for unverified user (emailVerified=false in response)", False, 
                "Failed to create test user")
except Exception as e:
    log_test("14. Login allowed for unverified user (emailVerified=false in response)", False, f"Exception: {str(e)}")

# ============================================================================
# SCENARIO 15: Existing Test User - Verify with Actual Token
# ============================================================================
print_section("SCENARIO 15: Verify Existing Test User (testhost.safar@gmail.com)")

try:
    # Get the existing test user's verification token
    user_doc = users_collection.find_one({"email": test_email_duplicate})
    
    if user_doc:
        if user_doc.get('emailVerified') == False:
            verification_token = user_doc.get('verificationToken')
            
            if verification_token:
                # Verify the email
                response = requests.get(f"{API_URL}/auth/verify-email", params={"token": verification_token})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('verified') == True:
                        log_test("15a. Existing test user email verified successfully", True, 
                                f"Email: {test_email_duplicate}, Message: {data.get('message')}")
                        
                        # Check database
                        user_doc_after = users_collection.find_one({"email": test_email_duplicate})
                        if user_doc_after.get('emailVerified') == True:
                            log_test("15b. Database updated - emailVerified=true", True, 
                                    f"Email: {test_email_duplicate}")
                        else:
                            log_test("15b. Database updated - emailVerified=true", False, 
                                    f"emailVerified: {user_doc_after.get('emailVerified')}")
                    else:
                        log_test("15a. Existing test user email verified successfully", False, 
                                f"Response: {data}")
                else:
                    log_test("15a. Existing test user email verified successfully", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
            else:
                log_test("15a. Existing test user email verified successfully", False, 
                        "No verification token found (may already be verified)")
        else:
            log_test("15a. Existing test user email verified successfully", True, 
                    f"Email already verified: {test_email_duplicate}")
    else:
        log_test("15a. Existing test user email verified successfully", False, 
                f"User not found: {test_email_duplicate}")
except Exception as e:
    log_test("15a. Existing test user email verified successfully", False, f"Exception: {str(e)}")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print_section("TEST SUMMARY")
print(f"\n✅ Tests Passed: {tests_passed}")
print(f"❌ Tests Failed: {tests_failed}")
print(f"📊 Total Tests: {tests_passed + tests_failed}")
print(f"✔️  Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
print(f"\n🕐 Test completed at: {datetime.now().isoformat()}")

if tests_failed == 0:
    print("\n🎉 ALL TESTS PASSED! Email verification flow is working correctly.")
else:
    print(f"\n⚠️  {tests_failed} test(s) failed. Please review the failures above.")

print("\n" + "="*80)
