#!/usr/bin/env python3
"""
Test the import flow to verify the payload structure
"""
import requests
import json

BASE_URL = "http://localhost:3000/api"

# Login as super admin
print("=== Logging in as Super Admin ===")
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "founder@safarcurated.com",
    "password": "SuperAdmin@2025"
})

if not login_res.ok:
    print(f"❌ Login failed: {login_res.status_code}")
    print(login_res.text)
    exit(1)

cookies = login_res.cookies
token = login_res.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

print("✅ Logged in successfully\n")

# Test 1: Create a test import with correct payload structure
print("=== Test 1: Import with CORRECT payload structure ===")
correct_payload = {
    "businesses": [
        {
            "placeId": "test-place-correct-001",
            "name": "Test Restaurant Correct",
            "address": "123 Test St, Mumbai, India",
            "phone": "+91-1234567890",
            "website": "https://test-correct.com",
            "coordinates": {"lat": 19.0760, "lng": 72.8777},
            "rating": 4.5,
            "reviewCount": 100,
            "category": "restaurant",
            "openingHours": ["Monday: 9:00 AM - 10:00 PM"],
            "photos": [{"reference": "ref1", "url": "https://example.com/photo1.jpg"}],
            "businessStatus": "OPERATIONAL",
            "googleMapsUrl": "https://maps.google.com/?cid=123"
        }
    ]
}

print("Payload structure:")
print(f"  - Type: {type(correct_payload['businesses'])}")
print(f"  - Length: {len(correct_payload['businesses'])}")
print(f"  - First business keys: {list(correct_payload['businesses'][0].keys())}")
print(f"  - First business name: {correct_payload['businesses'][0]['name']}")

import_res = requests.post(f"{BASE_URL}/marketplace/import", 
                           json=correct_payload, 
                           headers=headers)

print(f"\nResponse: {import_res.status_code}")
print(f"Body: {json.dumps(import_res.json(), indent=2)}")

if import_res.ok:
    job_id = import_res.json().get("jobId")
    print(f"\n✅ Import job created: {job_id}")
    
    # Check job status
    import time
    time.sleep(3)
    
    job_res = requests.get(f"{BASE_URL}/marketplace/jobs/{job_id}", headers=headers)
    if job_res.ok:
        job = job_res.json().get("job", {})
        print("\nJob Status:")
        print(f"  - Status: {job.get('status')}")
        print(f"  - Processed: {job.get('processed')}")
        print(f"  - Imported: {job.get('imported')}")
        print(f"  - Skipped: {job.get('skipped')}")
        print(f"  - Failed: {job.get('failed')}")
        
        if job.get('skipped') > 0 and job.get('imported') == 0:
            print("\n❌ ISSUE: All businesses were skipped!")
        elif job.get('imported') > 0:
            print("\n✅ SUCCESS: Business was imported!")
    else:
        print(f"❌ Failed to get job status: {job_res.status_code}")
else:
    print("\n❌ Import failed")

print("\n" + "="*60 + "\n")

# Test 2: Test with INCORRECT payload (simulate potential frontend bug)
print("=== Test 2: Import with INCORRECT payload (wrong structure) ===")

# Simulate if frontend was sending the OBJECTS instead of an array
incorrect_payload_1 = {
    "businesses": {  # WRONG: object instead of array
        "placeId": "test-place-wrong-001",
        "name": "Test Restaurant Wrong"
    }
}

print("Attempting incorrect payload (object instead of array)...")
import_res2 = requests.post(f"{BASE_URL}/marketplace/import", 
                            json=incorrect_payload_1, 
                            headers=headers)
print(f"Response: {import_res2.status_code}")
print(f"Body: {json.dumps(import_res2.json(), indent=2)}")

print("\n" + "="*60)
print("✅ Test complete")
