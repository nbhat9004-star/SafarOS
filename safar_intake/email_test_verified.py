#!/usr/bin/env python3
"""
Email Functionality Test for Safar Application - Using Verified Email
Tests ONLY the 3 email flows with the verified email address
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Use environment variable for base URL
BASE_URL = "http://localhost:3000/api"

# VERIFIED EMAIL ADDRESS (from Resend error message)
VERIFIED_EMAIL = "nbhat9004@gmail.com"

def log_test(test_name, status, details=""):
    """Log test results"""
    symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"\n{symbol} {test_name}")
    if details:
        print(f"   {details}")

def check_logs_for_email(email_to, subject_contains=""):
    """Check supervisor logs for email send messages"""
    print(f"\n📧 Checking logs for email to: {email_to}")
    time.sleep(2)  # Wait for async email to process
    
    try:
        import subprocess
        result = subprocess.run(
            ["tail", "-n", "150", "/var/log/supervisor/nextjs.out.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        logs = result.stdout
        
        # Look for success messages
        if "Email sent successfully" in logs and email_to in logs:
            print(f"   ✅ Found 'Email sent successfully' for {email_to}")
            # Try to extract email ID
            for line in logs.split('\n'):
                if "Email sent successfully" in line and email_to in line:
                    print(f"   📨 {line.strip()}")
            return True
        elif "Email send error" in logs:
            print(f"   ❌ Found 'Email send error' in logs")
            # Show last few error lines
            error_lines = [l for l in logs.split('\n') if "Email send error" in l or "statusCode" in l or "message" in l]
            for line in error_lines[-5:]:
                if line.strip():
                    print(f"   ❌ {line.strip()}")
            return False
        else:
            print(f"   ⚠️  No email log found for {email_to} (may still be processing)")
            return None
    except Exception as e:
        print(f"   ⚠️  Could not check logs: {e}")
        return None

def main():
    print("=" * 80)
    print("SAFAR EMAIL FUNCTIONALITY TEST - VERIFIED EMAIL")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Verified Email: {VERIFIED_EMAIL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Generate unique timestamp for test users
    timestamp = int(time.time())
    
    # Use verified email for all test users
    traveler_email = VERIFIED_EMAIL
    host_email = VERIFIED_EMAIL
    
    traveler_token = None
    host_token = None
    admin_token = None
    booking_id = None
    listing_id = None
    
    print("\n" + "=" * 80)
    print("TEST 1: WELCOME EMAIL ON USER REGISTRATION")
    print("=" * 80)
    
    # Register traveler
    print(f"\n1a) Registering traveler with verified email: {traveler_email}")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": f"Test Traveler {timestamp}",
                "email": f"test-traveler-{timestamp}@example.com",  # Will fail but we'll use existing user
                "password": "password123",
                "role": "traveler"
            },
            timeout=10
        )
        
        # If user exists, login instead
        if response.status_code == 409:
            print(f"   ℹ️  User exists, will use existing test user")
            # Try to get existing test credentials
            import subprocess
            result = subprocess.run(
                ["mongosh", "mongodb://localhost:27017/safar", "--quiet", "--eval", 
                 "db.users.findOne({role: 'traveler'}, {email: 1, _id: 0})"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print(f"   ℹ️  Found existing traveler in database")
        
        # Create new user with verified email
        unique_email = f"traveler-{timestamp}@example.com"
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": f"Email Test Traveler {timestamp}",
                "email": unique_email,
                "password": "password123",
                "role": "traveler"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                traveler_token = data.get('token')
                traveler_id = data['user']['id']
                log_test("Traveler Registration", "PASS", f"User created: {data['user']['name']}")
                
                # Update email to verified email in database
                import subprocess
                mongo_cmd = f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{traveler_id}'}}, {{\\$set: {{email: '{VERIFIED_EMAIL}'}}}});\""
                subprocess.run(mongo_cmd, shell=True, capture_output=True, timeout=5)
                print(f"   ✅ Updated user email to verified address: {VERIFIED_EMAIL}")
                
                # Trigger welcome email by calling a test endpoint or manually
                # Since email was already sent during registration, check logs
                check_logs_for_email(unique_email, "Welcome")
            else:
                log_test("Traveler Registration", "FAIL", f"API returned ok=false: {data.get('error')}")
        else:
            log_test("Traveler Registration", "FAIL", f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Traveler Registration", "FAIL", f"Exception: {str(e)}")
    
    # For simplicity, let's use existing test users and manually trigger emails
    print("\n" + "=" * 80)
    print("ALTERNATIVE APPROACH: Using existing test users")
    print("=" * 80)
    
    # Get existing test credentials
    try:
        with open('/app/memory/test_credentials.md', 'r') as f:
            creds = f.read()
            print(f"\n✅ Found existing test credentials")
            print(creds[:500])
    except:
        print("\n⚠️  No existing test credentials found")
    
    # Let's create a simple test with verified email
    print("\n" + "=" * 80)
    print("SIMPLIFIED TEST: Register user with verified email")
    print("=" * 80)
    
    unique_name = f"EmailTest{timestamp}"
    unique_temp_email = f"emailtest-{timestamp}@example.com"
    
    print(f"\n1) Registering user: {unique_name}")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": unique_name,
                "email": unique_temp_email,
                "password": "password123",
                "role": "traveler"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                user_id = data['user']['id']
                user_token = data.get('token')
                log_test("User Registration", "PASS", f"User created with ID: {user_id}")
                
                # Update email to verified email
                import subprocess
                mongo_cmd = f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{user_id}'}}, {{\\$set: {{email: '{VERIFIED_EMAIL}'}}}});\""
                result = subprocess.run(mongo_cmd, shell=True, capture_output=True, timeout=5)
                print(f"   ✅ Updated user email to: {VERIFIED_EMAIL}")
                
                # Now trigger a booking to send emails to verified address
                print(f"\n2) Getting an approved listing")
                response = requests.get(
                    f"{BASE_URL}/listings?status=approved&limit=1",
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('listings') and len(data['listings']) > 0:
                        listing = data['listings'][0]
                        listing_id = listing['id']
                        print(f"   ✅ Found listing: {listing['title']} (ID: {listing_id})")
                        
                        # Create booking
                        print(f"\n3) Creating booking (will send emails to {VERIFIED_EMAIL})")
                        check_in = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
                        check_out = (datetime.now() + timedelta(days=65)).strftime('%Y-%m-%d')
                        
                        response = requests.post(
                            f"{BASE_URL}/bookings",
                            json={
                                "listingId": listing_id,
                                "checkInDate": check_in,
                                "checkOutDate": check_out,
                                "guests": 2
                            },
                            headers={"Authorization": f"Bearer {user_token}"},
                            timeout=10
                        )
                        
                        if response.status_code == 201:
                            data = response.json()
                            if data.get('ok'):
                                booking_id = data['booking']['bookingId']
                                log_test("Booking Creation", "PASS", f"Booking ID: {booking_id}")
                                
                                print(f"\n   📧 Checking logs for booking confirmation email")
                                check_logs_for_email(VERIFIED_EMAIL, "Booking")
                            else:
                                log_test("Booking Creation", "FAIL", f"Error: {data.get('error')}")
                        else:
                            log_test("Booking Creation", "FAIL", f"Status {response.status_code}")
                    else:
                        print(f"   ❌ No approved listings found")
                else:
                    print(f"   ❌ Failed to get listings: {response.status_code}")
            else:
                log_test("User Registration", "FAIL", f"Error: {data.get('error')}")
        else:
            log_test("User Registration", "FAIL", f"Status {response.status_code}")
    except Exception as e:
        log_test("User Registration", "FAIL", f"Exception: {str(e)}")
    
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\n⚠️  IMPORTANT FINDING:")
    print(f"   The Resend API key is in TEST MODE")
    print(f"   Emails can ONLY be sent to: {VERIFIED_EMAIL}")
    print(f"   To send to other addresses, need to:")
    print(f"   1. Verify a domain at resend.com/domains")
    print(f"   2. Update FROM_EMAIL in .env to use verified domain")
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
