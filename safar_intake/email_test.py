#!/usr/bin/env python3
"""
Email Functionality Test for Safar Application
Tests ONLY the 3 email flows:
1. Welcome email on user registration
2. Booking confirmation emails (traveler + host)
3. Booking approval email
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Use environment variable for base URL
BASE_URL = "http://localhost:3000/api"

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
            ["tail", "-n", "100", "/var/log/supervisor/nextjs.out.log"],
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
                    print(f"   📨 Log: {line.strip()}")
            return True
        elif "Email send error" in logs:
            print(f"   ❌ Found 'Email send error' in logs")
            for line in logs.split('\n'):
                if "Email send error" in line:
                    print(f"   ❌ Error: {line.strip()}")
            return False
        else:
            print(f"   ⚠️  No email log found for {email_to} (may still be processing)")
            return None
    except Exception as e:
        print(f"   ⚠️  Could not check logs: {e}")
        return None

def main():
    print("=" * 80)
    print("SAFAR EMAIL FUNCTIONALITY TEST")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Generate unique timestamp for test emails
    timestamp = int(time.time())
    
    # Test data
    traveler_email = f"test-email-traveler-{timestamp}@example.com"
    host_email = f"test-email-host-{timestamp}@example.com"
    admin_email = f"test-email-admin-{timestamp}@example.com"
    
    traveler_token = None
    host_token = None
    admin_token = None
    booking_id = None
    listing_id = None
    
    print("\n" + "=" * 80)
    print("TEST 1: WELCOME EMAIL ON USER REGISTRATION")
    print("=" * 80)
    
    # Register traveler
    print(f"\n1a) Registering traveler: {traveler_email}")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Test Traveler Email",
                "email": traveler_email,
                "password": "password123",
                "role": "traveler"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                traveler_token = data.get('token')
                log_test("Traveler Registration", "PASS", f"User created: {data['user']['name']}")
                
                # Check logs for welcome email
                check_logs_for_email(traveler_email, "Welcome")
            else:
                log_test("Traveler Registration", "FAIL", f"API returned ok=false: {data.get('error')}")
        else:
            log_test("Traveler Registration", "FAIL", f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Traveler Registration", "FAIL", f"Exception: {str(e)}")
    
    # Register host
    print(f"\n1b) Registering host: {host_email}")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Test Host Email",
                "email": host_email,
                "password": "password123",
                "role": "host"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                host_token = data.get('token')
                log_test("Host Registration", "PASS", f"User created: {data['user']['name']}")
                
                # Check logs for welcome email
                check_logs_for_email(host_email, "Welcome")
            else:
                log_test("Host Registration", "FAIL", f"API returned ok=false: {data.get('error')}")
        else:
            log_test("Host Registration", "FAIL", f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Host Registration", "FAIL", f"Exception: {str(e)}")
    
    if not traveler_token or not host_token:
        print("\n❌ Cannot continue without user tokens")
        return
    
    print("\n" + "=" * 80)
    print("TEST 2: BOOKING CONFIRMATION EMAILS (TRAVELER + HOST)")
    print("=" * 80)
    
    # First, create a listing as host
    print(f"\n2a) Creating listing as host")
    try:
        response = requests.post(
            f"{BASE_URL}/listings",
            json={
                "title": "Email Test Houseboat",
                "description": "Beautiful houseboat for email testing purposes",
                "category": "stay",
                "subcategory": "houseboat",
                "location": "Dal Lake, Srinagar",
                "price": 5000,
                "images": ["https://example.com/image.jpg"],
                "amenities": ["WiFi", "Kitchen"],
                "services": []
            },
            headers={"Authorization": f"Bearer {host_token}"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get('ok'):
                listing_id = data['listing']['id']
                listing_status = data['listing']['status']
                log_test("Listing Creation", "PASS", f"Listing created: {listing_id}, status: {listing_status}")
            else:
                log_test("Listing Creation", "FAIL", f"API returned ok=false: {data.get('error')}")
        else:
            log_test("Listing Creation", "FAIL", f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Listing Creation", "FAIL", f"Exception: {str(e)}")
    
    # If listing is pending, approve it as admin
    if listing_id:
        print(f"\n2b) Checking if listing needs approval")
        # Create admin user
        try:
            response = requests.post(
                f"{BASE_URL}/auth/register",
                json={
                    "name": "Test Admin Email",
                    "email": admin_email,
                    "password": "password123",
                    "role": "host"  # Will be upgraded to admin
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                admin_token = data.get('token')
                admin_id = data['user']['id']
                
                # Upgrade to admin via MongoDB
                import subprocess
                mongo_cmd = f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{admin_id}'}}, {{\\$set: {{role: 'admin'}}}});\""
                subprocess.run(mongo_cmd, shell=True, capture_output=True, timeout=5)
                print(f"   ✅ Admin user created and upgraded")
                
                # Approve the listing
                response = requests.post(
                    f"{BASE_URL}/listings/{listing_id}/approve",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    print(f"   ✅ Listing approved")
                else:
                    print(f"   ⚠️  Could not approve listing: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Admin setup failed: {e}")
    
    if not listing_id:
        print("\n❌ Cannot continue without listing")
        return
    
    # Create booking as traveler
    print(f"\n2c) Creating booking as traveler")
    check_in = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
    check_out = (datetime.now() + timedelta(days=35)).strftime('%Y-%m-%d')
    
    try:
        response = requests.post(
            f"{BASE_URL}/bookings",
            json={
                "listingId": listing_id,
                "checkInDate": check_in,
                "checkOutDate": check_out,
                "guests": 2
            },
            headers={"Authorization": f"Bearer {traveler_token}"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get('ok'):
                booking_id = data['booking']['bookingId']
                log_test("Booking Creation", "PASS", f"Booking created: {booking_id}")
                
                print("\n   📧 Checking logs for TWO emails:")
                print(f"      1. Traveler confirmation to: {traveler_email}")
                print(f"      2. Host notification to: {host_email}")
                
                # Check logs for both emails
                check_logs_for_email(traveler_email, "Booking Confirmed")
                check_logs_for_email(host_email, "New Booking Request")
            else:
                log_test("Booking Creation", "FAIL", f"API returned ok=false: {data.get('error')}")
        else:
            log_test("Booking Creation", "FAIL", f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Booking Creation", "FAIL", f"Exception: {str(e)}")
    
    if not booking_id:
        print("\n❌ Cannot continue without booking")
        return
    
    print("\n" + "=" * 80)
    print("TEST 3: BOOKING APPROVAL EMAIL (TO TRAVELER)")
    print("=" * 80)
    
    # Approve booking as host
    print(f"\n3a) Approving booking as host")
    try:
        response = requests.patch(
            f"{BASE_URL}/bookings/{booking_id}",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {host_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                log_test("Booking Approval", "PASS", f"Booking approved: {booking_id}")
                
                print("\n   📧 Checking logs for approval email to traveler")
                check_logs_for_email(traveler_email, "Booking Approved")
            else:
                log_test("Booking Approval", "FAIL", f"API returned ok=false: {data.get('error')}")
        else:
            log_test("Booking Approval", "FAIL", f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Booking Approval", "FAIL", f"Exception: {str(e)}")
    
    print("\n" + "=" * 80)
    print("EMAIL TEST SUMMARY")
    print("=" * 80)
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTest emails used:")
    print(f"  - Traveler: {traveler_email}")
    print(f"  - Host: {host_email}")
    print(f"  - Admin: {admin_email}")
    print(f"\nExpected emails sent: 5 total")
    print(f"  1. Welcome email to traveler")
    print(f"  2. Welcome email to host")
    print(f"  3. Booking confirmation to traveler")
    print(f"  4. Booking notification to host")
    print(f"  5. Booking approval to traveler")
    print(f"\n⚠️  Check the log output above for 'Email sent successfully' messages")
    print(f"⚠️  If emails failed, look for 'Email send error' messages with Resend API errors")
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
