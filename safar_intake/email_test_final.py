#!/usr/bin/env python3
"""
Email Functionality Test - Direct test with verified email
"""

import requests
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000/api"
VERIFIED_EMAIL = "nbhat9004@gmail.com"

def check_logs():
    """Check recent logs for email messages"""
    import subprocess
    result = subprocess.run(
        ["tail", "-n", "50", "/var/log/supervisor/nextjs.out.log"],
        capture_output=True,
        text=True,
        timeout=5
    )
    return result.stdout

def main():
    print("=" * 80)
    print("SAFAR EMAIL TEST - Using Verified Email Address")
    print("=" * 80)
    print(f"Verified Email: {VERIFIED_EMAIL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    timestamp = int(time.time())
    
    # TEST 1: Register user with verified email
    print("TEST 1: Welcome Email on Registration")
    print("-" * 80)
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": f"Email Test User {timestamp}",
            "email": VERIFIED_EMAIL,
            "password": f"password{timestamp}",
            "role": "traveler"
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        user_token = data.get('token')
        print(f"✅ User registered successfully")
        print(f"   Name: {data['user']['name']}")
        print(f"   Email: {data['user']['email']}")
        
        time.sleep(3)
        logs = check_logs()
        
        if "Email sent successfully" in logs and VERIFIED_EMAIL in logs:
            print(f"\n✅ WELCOME EMAIL SENT SUCCESSFULLY")
            for line in logs.split('\n'):
                if "Email sent successfully" in line and VERIFIED_EMAIL in line:
                    print(f"   📨 {line.strip()}")
        elif "Email send error" in logs:
            print(f"\n❌ WELCOME EMAIL FAILED")
            for line in logs.split('\n'):
                if "Email send error" in line or "statusCode" in line or "validation_error" in line:
                    print(f"   {line.strip()}")
        else:
            print(f"\n⚠️  No email log found (may still be processing)")
            
    elif response.status_code == 409:
        print(f"⚠️  User already exists with this email")
        print(f"   This is expected - Resend test mode only allows one verified email")
        print(f"   Skipping to booking test with existing user...")
        
        # Login instead
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": VERIFIED_EMAIL,
                "password": "password123"  # Try common password
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user_token = data.get('token')
            print(f"✅ Logged in as existing user")
        else:
            print(f"❌ Could not login: {response.status_code}")
            print(f"   Cannot continue with booking test")
            return
    else:
        print(f"❌ Registration failed: {response.status_code}")
        print(f"   {response.text[:300]}")
        return
    
    # TEST 2: Create booking (sends 2 emails)
    print("\n\nTEST 2: Booking Confirmation Emails")
    print("-" * 80)
    
    # Get an approved listing
    response = requests.get(f"{BASE_URL}/listings?status=approved&limit=1", timeout=10)
    
    if response.status_code != 200 or not response.json().get('listings'):
        print(f"❌ No approved listings found")
        return
    
    listing = response.json()['listings'][0]
    listing_id = listing['id']
    print(f"✅ Found listing: {listing['title']}")
    
    # Create booking
    check_in = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
    check_out = (datetime.now() + timedelta(days=95)).strftime('%Y-%m-%d')
    
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
        booking_id = data['booking']['bookingId']
        print(f"✅ Booking created: {booking_id}")
        print(f"   Expected: 2 emails (traveler confirmation + host notification)")
        
        time.sleep(3)
        logs = check_logs()
        
        success_count = logs.count("Email sent successfully")
        error_count = logs.count("Email send error")
        
        print(f"\n📧 Email Results:")
        print(f"   Success: {success_count} emails")
        print(f"   Errors: {error_count} emails")
        
        if "Email sent successfully" in logs:
            print(f"\n✅ BOOKING EMAILS SENT SUCCESSFULLY")
            for line in logs.split('\n'):
                if "Email sent successfully" in line:
                    print(f"   📨 {line.strip()}")
        elif "Email send error" in logs:
            print(f"\n❌ BOOKING EMAILS FAILED")
            error_lines = [l for l in logs.split('\n') if "Email send error" in l or "statusCode" in l or "message:" in l]
            for line in error_lines[-10:]:
                if line.strip():
                    print(f"   {line.strip()}")
    elif response.status_code == 409:
        print(f"⚠️  Booking conflict (dates overlap): {response.json().get('error')}")
        print(f"   Trying different dates...")
        
        # Try far future dates
        check_in = (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%d')
        check_out = (datetime.now() + timedelta(days=185)).strftime('%Y-%m-%d')
        
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
            booking_id = data['booking']['bookingId']
            print(f"✅ Booking created with alternate dates: {booking_id}")
            
            time.sleep(3)
            logs = check_logs()
            
            if "Email sent successfully" in logs:
                print(f"\n✅ BOOKING EMAILS SENT")
                for line in logs.split('\n'):
                    if "Email sent successfully" in line:
                        print(f"   📨 {line.strip()}")
        else:
            print(f"❌ Booking failed again: {response.status_code}")
            booking_id = None
    else:
        print(f"❌ Booking failed: {response.status_code}")
        print(f"   {response.text[:300]}")
        booking_id = None
    
    # TEST 3: Approve booking (sends 1 email)
    if booking_id:
        print("\n\nTEST 3: Booking Approval Email")
        print("-" * 80)
        
        # Need host/admin token to approve
        # Get host from listing
        host_id = listing.get('hostId')
        
        if host_id == 'demo-host':
            print(f"⚠️  Listing is demo listing (host: demo-host)")
            print(f"   Creating admin user to approve booking...")
            
            # Create admin
            admin_email = f"admin-{timestamp}@example.com"
            response = requests.post(
                f"{BASE_URL}/auth/register",
                json={
                    "name": "Test Admin",
                    "email": admin_email,
                    "password": "password123",
                    "role": "host"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                admin_id = response.json()['user']['id']
                admin_token = response.json()['token']
                
                # Upgrade to admin
                import subprocess
                mongo_cmd = f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{admin_id}'}}, {{\\$set: {{role: 'admin', email: '{VERIFIED_EMAIL}'}}}});\""
                subprocess.run(mongo_cmd, shell=True, capture_output=True, timeout=5)
                
                print(f"✅ Admin user created")
                
                # Approve booking
                response = requests.patch(
                    f"{BASE_URL}/bookings/{booking_id}",
                    json={"status": "approved"},
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    print(f"✅ Booking approved")
                    print(f"   Expected: 1 email (approval notification to traveler)")
                    
                    time.sleep(3)
                    logs = check_logs()
                    
                    if "Email sent successfully" in logs:
                        print(f"\n✅ APPROVAL EMAIL SENT SUCCESSFULLY")
                        for line in logs.split('\n'):
                            if "Email sent successfully" in line and "Approved" in line:
                                print(f"   📨 {line.strip()}")
                    elif "Email send error" in logs:
                        print(f"\n❌ APPROVAL EMAIL FAILED")
                        for line in logs.split('\n'):
                            if "Email send error" in line:
                                print(f"   {line.strip()}")
                else:
                    print(f"❌ Approval failed: {response.status_code}")
    
    print("\n" + "=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    
    logs = check_logs()
    success_count = logs.count("Email sent successfully")
    error_count = logs.count("Email send error")
    
    print(f"\nTotal Email Attempts in Recent Logs:")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Failed: {error_count}")
    
    print(f"\n⚠️  RESEND API KEY STATUS:")
    if "validation_error" in logs and "You can only send testing emails" in logs:
        print(f"  ❌ API key is in TEST MODE")
        print(f"  ✅ Verified email: {VERIFIED_EMAIL}")
        print(f"  ⚠️  To send to other addresses:")
        print(f"     1. Verify a domain at resend.com/domains")
        print(f"     2. Update FROM_EMAIL in .env to use verified domain")
    elif success_count > 0:
        print(f"  ✅ API key is working")
        print(f"  ✅ Emails sent successfully to: {VERIFIED_EMAIL}")
    
    print(f"\nTest completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    main()
