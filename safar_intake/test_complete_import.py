#!/usr/bin/env python3
"""
Complete end-to-end test of the import flow
"""
import requests
import json
import time

BASE_URL = "http://localhost:3000/api"

# Login
print("=== Logging in ===")
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "founder@safarcurated.com",
    "password": "SuperAdmin@2025"
})

headers = {"Authorization": f"Bearer {login_res.json()['token']}"}
print("✅ Logged in\n")

# Test 1: Search for businesses
print("=== Test 1: Business Discovery ===")
discover_res = requests.post(f"{BASE_URL}/marketplace/discover", 
                            json={"query": "hotels", "city": "Mumbai"}, 
                            headers=headers)

if discover_res.ok:
    data = discover_res.json()
    results = data.get("results", [])
    print(f"✅ Found {len(results)} businesses")
    
    # Count duplicates
    duplicates = [r for r in results if r.get("isDuplicate")]
    non_duplicates = [r for r in results if not r.get("isDuplicate")]
    
    print(f"  - {len(duplicates)} already imported (duplicates)")
    print(f"  - {len(non_duplicates)} new businesses")
    
    if len(results) > 0:
        print("\nFirst business structure:")
        first = results[0]
        print(f"  - placeId: {first.get('placeId')}")
        print(f"  - name: {first.get('name')}")
        print(f"  - address: {first.get('address')}")
        print(f"  - isDuplicate: {first.get('isDuplicate')}")
        print(f"  - All keys: {list(first.keys())}")
        
        # Test 2: Import first non-duplicate business
        if non_duplicates:
            print("\n=== Test 2: Importing first new business ===")
            to_import = non_duplicates[:1]
            print(f"Importing: {to_import[0]['name']}")
            
            import_res = requests.post(f"{BASE_URL}/marketplace/import",
                                      json={"businesses": to_import},
                                      headers=headers)
            
            if import_res.ok:
                job_id = import_res.json().get("jobId")
                print(f"✅ Import started: {job_id}")
                
                # Wait and check status
                time.sleep(5)
                job_res = requests.get(f"{BASE_URL}/marketplace/jobs/{job_id}", headers=headers)
                
                if job_res.ok:
                    job = job_res.json().get("job", {})
                    print("\nJob Results:")
                    print(f"  - Status: {job.get('status')}")
                    print(f"  - Imported: {job.get('imported')}")
                    print(f"  - Skipped: {job.get('skipped')}")
                    print(f"  - Failed: {job.get('failed')}")
                    
                    if job.get('imported') > 0:
                        print("\n✅ SUCCESS: Business imported successfully!")
                    elif job.get('skipped') > 0:
                        print("\n⚠️  Business was skipped (likely duplicate)")
                    else:
                        print("\n❌ Import failed")
                        if job.get('errors'):
                            print(f"Errors: {job.get('errors')}")
            else:
                print(f"❌ Import request failed: {import_res.status_code}")
                print(import_res.json())
        else:
            print("\n⚠️  No new businesses to import (all are duplicates)")
            
            # Try importing a duplicate to verify skip behavior
            if duplicates:
                print("\n=== Test 3: Attempting to import a duplicate ===")
                print(f"Trying: {duplicates[0]['name']}")
                
                import_res = requests.post(f"{BASE_URL}/marketplace/import",
                                          json={"businesses": duplicates[:1]},
                                          headers=headers)
                
                if import_res.ok:
                    job_id = import_res.json().get("jobId")
                    time.sleep(3)
                    job_res = requests.get(f"{BASE_URL}/marketplace/jobs/{job_id}", headers=headers)
                    
                    if job_res.ok:
                        job = job_res.json().get("job", {})
                        print("\nJob Results:")
                        print(f"  - Imported: {job.get('imported')}")
                        print(f"  - Skipped: {job.get('skipped')}")
                        
                        if job.get('skipped') > 0 and job.get('imported') == 0:
                            print("\n✅ CORRECT: Duplicate was skipped as expected")
                        else:
                            print("\n❌ UNEXPECTED: Duplicate was not skipped")
    else:
        print("⚠️  No results found")
else:
    print(f"❌ Discovery failed: {discover_res.status_code}")
    print(discover_res.text)

print("\n" + "="*60)
print("✅ Complete test finished")
