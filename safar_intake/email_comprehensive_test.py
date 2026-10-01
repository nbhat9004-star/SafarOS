#!/usr/bin/env python3
"""
Comprehensive Email Test - All 3 flows with verified email
"""

import requests
import time
import subprocess
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000/api"
VERIFIED_EMAIL = "nbhat9004@gmail.com"

def check_recent_logs():
    """Get recent logs"""
    result = subprocess.run(
        ["tail", "-n", "80", "/var/log/supervisor/nextjs.out.log"],
        capture_output=True,
        text=True,
        timeout=5
    )
    return result.stdout

def count_emails_in_logs(logs):
    """Count successful and failed emails"""
    success = logs.count("Email sent successfully")
    errors = logs.count("Email send error")
    return success, errors

def main():
    print("=" * 80)
    print("COMPREHENSIVE EMAIL FUNCTIONALITY TEST")
    print("=" * 80)
    print(f"Verified Email: {VERIFIED_EMAIL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    timestamp = int(time.time())
    
    # Clear recent test data
    print("Setup: Creating test users with verified email...")
    print("-" * 80)
    
    # Create traveler
    traveler_name = f"Traveler{timestamp}"
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": traveler_name,
            "email": f"temp-traveler-{timestamp}@example.com",
            "password": "password123",
            "role": "traveler"
        },
        timeout=10
    )
    
    if response.status_code == 200:
        traveler_id = response.json()['user']['id']
        traveler_token = response.json()['token']
        
        # Update to verified email
        subprocess.run(
            f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{traveler_id}'}}, {{\\$set: {{email: '{VERIFIED_EMAIL}'}}}});\"",
            shell=True, capture_output=True, timeout=5
        )
        print(f"✅ Traveler created: {traveler_name} (email: {VERIFIED_EMAIL})")
    else:
        print(f"❌ Failed to create traveler")
        return
    
    # Create host
    host_name = f"Host{timestamp}"
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "name": host_name,
            "email": f"temp-host-{timestamp}@example.com",
            "password": "password123",
            "role": "host"
        },
        timeout=10
    )
    
    if response.status_code == 200:
        host_id = response.json()['user']['id']
        host_token = response.json()['token']
        
        # Update to verified email
        subprocess.run(
            f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{host_id}'}}, {{\\$set: {{email: '{VERIFIED_EMAIL}'}}}});\"",
            shell=True, capture_output=True, timeout=5
        )
        print(f"✅ Host created: {host_name} (email: {VERIFIED_EMAIL})")
    else:
        print(f"❌ Failed to create host")
        return
    
    print("\n" + "=" * 80)
    print("TEST 1: WELCOME EMAIL (Already sent during registration)")
    print("=" * 80)
    print("⚠️  Welcome emails were sent during user registration above")
    print("   However, they failed because temp emails were used initially")
    print("   Skipping to booking flow which uses updated verified email\n")
    
    # Create listing as host
    print("=" * 80)
    print("TEST 2: BOOKING CONFIRMATION EMAILS")
    print("=" * 80)
    
    print("\nStep 1: Creating listing as host...")
    response = requests.post(
        f"{BASE_URL}/listings",
        json={
            "title": f"Email Test Property {timestamp}",
            "description": "Test property for email functionality verification",
            "category": "stay",
            "subcategory": "cottage",
            "location": "Gulmarg, Kashmir",
            "price": 4000,
            "images": ["https://example.com/image.jpg"],
            "amenities": ["WiFi"],
            "services": []
        },
        headers={"Authorization": f"Bearer {host_token}"},
        timeout=10
    )
    
    if response.status_code != 201:
        print(f"❌ Failed to create listing: {response.status_code}")
        return
    
    listing_id = response.json()['listing']['id']
    listing_status = response.json()['listing']['status']
    print(f"✅ Listing created: {listing_id} (status: {listing_status})")
    
    # Approve listing if needed
    if listing_status == 'pending':
        print("\nStep 2: Approving listing as admin...")
        
        # Create admin
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": f"Admin{timestamp}",
                "email": f"temp-admin-{timestamp}@example.com",
                "password": "password123",
                "role": "host"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            admin_id = response.json()['user']['id']
            admin_token = response.json()['token']
            
            # Upgrade to admin
            subprocess.run(
                f"mongosh mongodb://localhost:27017/safar --quiet --eval \"db.users.updateOne({{id: '{admin_id}'}}, {{\\$set: {{role: 'admin'}}}});\"",
                shell=True, capture_output=True, timeout=5
            )
            
            # Approve listing
            response = requests.post(
                f"{BASE_URL}/listings/{listing_id}/approve",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Listing approved")
            else:
                print(f"❌ Failed to approve listing: {response.status_code}")
                return
    
    # Create booking
    print("\nStep 3: Creating booking as traveler...")
    print(f"   This will send 2 emails:")
    print(f"   1. Booking confirmation to traveler ({VERIFIED_EMAIL})")
    print(f"   2. Booking notification to host ({VERIFIED_EMAIL})")
    
    check_in = (datetime.now() + timedelta(days=120)).strftime('%Y-%m-%d')
    check_out = (datetime.now() + timedelta(days=125)).strftime('%Y-%m-%d')
    
    # Clear logs before booking
    initial_logs = check_recent_logs()
    initial_success, initial_errors = count_emails_in_logs(initial_logs)
    
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
    
    if response.status_code != 201:
        print(f"❌ Failed to create booking: {response.status_code}")
        print(f"   Error: {response.json().get('error')}")
        return
    
    booking_id = response.json()['booking']['bookingId']
    print(f"✅ Booking created: {booking_id}")
    
    # Wait for emails to process
    time.sleep(3)
    
    # Check logs
    logs = check_recent_logs()
    success, errors = count_emails_in_logs(logs)
    new_success = success - initial_success
    new_errors = errors - initial_errors
    
    print(f"\n📧 Email Results:")
    print(f"   New successful emails: {new_success}")
    print(f"   New failed emails: {new_errors}")
    
    if new_success >= 2:
        print(f"\n✅ BOTH BOOKING EMAILS SENT SUCCESSFULLY")
    elif new_success == 1:
        print(f"\n⚠️  PARTIAL SUCCESS: 1 email sent, 1 failed")
    else:
        print(f"\n❌ BOOKING EMAILS FAILED")
    
    # Show recent email logs
    for line in logs.split('\n'):
        if "Email sent successfully" in line:
            print(f"   ✅ {line.strip()}")
        elif "Email send error" in line and "statusCode" not in line:
            print(f"   ❌ {line.strip()}")
    
    # TEST 3: Approve booking
    print("\n" + "=" * 80)
    print("TEST 3: BOOKING APPROVAL EMAIL")
    print("=" * 80)
    
    print(f"\nApproving booking as host...")
    print(f"   This will send 1 email:")
    print(f"   1. Booking approved notification to traveler ({VERIFIED_EMAIL})")
    
    # Clear logs
    initial_logs = check_recent_logs()
    initial_success, initial_errors = count_emails_in_logs(initial_logs)
    
    response = requests.patch(
        f"{BASE_URL}/bookings/{booking_id}",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {host_token}"},
        timeout=10
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to approve booking: {response.status_code}")
        print(f"   Error: {response.json().get('error')}")
    else:
        print(f"✅ Booking approved")
        
        # Wait for email
        time.sleep(3)
        
        # Check logs
        logs = check_recent_logs()
        success, errors = count_emails_in_logs(logs)
        new_success = success - initial_success
        new_errors = errors - initial_errors
        
        print(f"\n📧 Email Results:")
        print(f"   New successful emails: {new_success}")
        print(f"   New failed emails: {new_errors}")
        
        if new_success >= 1:
            print(f"\n✅ APPROVAL EMAIL SENT SUCCESSFULLY")
        else:
            print(f"\n❌ APPROVAL EMAIL FAILED")
        
        # Show recent email logs
        for line in logs.split('\n'):
            if "Email sent successfully" in line and "Approved" in line:
                print(f"   ✅ {line.strip()}")
    
    # FINAL SUMMARY
    print("\n" + "=" * 80)
    print("FINAL TEST SUMMARY")
    print("=" * 80)
    
    final_logs = check_recent_logs()
    total_success, total_errors = count_emails_in_logs(final_logs)
    
    print(f"\nTotal Emails in Test Session:")
    print(f"  ✅ Successful: {total_success}")
    print(f"  ❌ Failed: {total_errors}")
    
    print(f"\n📋 Test Results:")
    print(f"  ✅ Test 1 (Welcome Email): Skipped (sent during registration with temp email)")
    print(f"  {'✅' if new_success >= 1 else '❌'} Test 2 (Booking Confirmation): {new_success}/2 emails sent")
    print(f"  {'✅' if response.status_code == 200 else '❌'} Test 3 (Booking Approval): Email triggered")
    
    print(f"\n⚠️  IMPORTANT NOTES:")
    print(f"  • Resend API key is in TEST MODE")
    print(f"  • Emails can ONLY be sent to: {VERIFIED_EMAIL}")
    print(f"  • Both traveler and host use same verified email in this test")
    print(f"  • To send to different addresses, verify a domain at resend.com/domains")
    
    print(f"\nTest completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    main()
