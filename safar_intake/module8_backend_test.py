#!/usr/bin/env python3
"""
Module 8 Backend Test - Host Claim, Review & Publish Workflow
Tests all endpoints for the Safar Marketplace CRM Module 8
"""

import requests
import json
import time
from datetime import datetime, timedelta
from pymongo import MongoClient

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "safar"

# Super Admin credentials (auto-provisioned)
SUPER_ADMIN_EMAIL = "founder@safarcurated.com"
SUPER_ADMIN_PASSWORD = "SuperAdmin@2025"

# Test results
test_results = []
total_tests = 0
passed_tests = 0
failed_tests = 0

def log_test(test_num, description, passed, details=""):
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if passed:
        passed_tests += 1
        status = "✅ PASS"
    else:
        failed_tests += 1
        status = "❌ FAIL"
    
    result = f"{status} | Test {test_num}: {description}"
    if details:
        result += f"\n    Details: {details}"
    print(result)
    test_results.append({"test": test_num, "description": description, "passed": passed, "details": details})

def login_super_admin():
    """Login as super admin and return JWT token"""
    print("\n=== LOGGING IN AS SUPER ADMIN ===")
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("token")
        print(f"✅ Super admin login successful. Token: {token[:20]}...")
        return token
    else:
        print(f"❌ Super admin login failed: {response.status_code} - {response.text}")
        return None

def create_test_users(admin_token):
    """Create test traveler and host users"""
    print("\n=== CREATING TEST USERS ===")
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Create traveler
    traveler_email = f"test-traveler-{timestamp}@safar.com"
    traveler_response = requests.post(
        f"{API_BASE}/auth/register",
        json={
            "name": "Test Traveler",
            "email": traveler_email,
            "password": "password123",
            "role": "traveler"
        },
        timeout=10
    )
    
    traveler_token = None
    if traveler_response.status_code == 200:
        traveler_token = traveler_response.json().get("token")
        print(f"✅ Traveler created: {traveler_email}")
    else:
        print(f"❌ Traveler creation failed: {traveler_response.status_code}")
    
    # Create host
    host_email = f"test-host-{timestamp}@safar.com"
    host_response = requests.post(
        f"{API_BASE}/auth/register",
        json={
            "name": "Test Host",
            "email": host_email,
            "password": "password123",
            "role": "host"
        },
        timeout=10
    )
    
    host_token = None
    if host_response.status_code == 200:
        host_token = host_response.json().get("token")
        print(f"✅ Host created: {host_email}")
    else:
        print(f"❌ Host creation failed: {host_response.status_code}")
    
    return traveler_token, host_token

def get_or_create_listing(admin_token):
    """Get an existing approved listing or create one"""
    print("\n=== GETTING/CREATING TEST LISTING ===")
    
    # Try to get existing approved listing
    response = requests.get(
        f"{API_BASE}/listings?status=approved&limit=1",
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        listings = data.get("listings", [])
        if listings:
            listing_id = listings[0]["id"]
            print(f"✅ Using existing listing: {listing_id}")
            return listing_id
    
    # Create new listing as admin
    print("Creating new listing as admin...")
    response = requests.post(
        f"{API_BASE}/listings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Business for Module 8",
            "description": "This is a test business listing for Module 8 testing. It has a detailed description that meets the minimum length requirement.",
            "category": "stay",
            "subcategory": "hotel",
            "location": "Srinagar, Kashmir",
            "city": "Srinagar",
            "price": 5000,
            "images": ["https://example.com/image1.jpg"],
            "amenities": ["WiFi", "Parking"],
            "services": ["breakfast"]
        },
        timeout=10
    )
    
    if response.status_code == 201:
        listing_id = response.json()["listing"]["id"]
        print(f"✅ Created new listing: {listing_id}")
        return listing_id
    else:
        print(f"❌ Failed to create listing: {response.status_code} - {response.text}")
        return None

def run_module8_tests():
    """Run all Module 8 tests"""
    print("\n" + "="*80)
    print("MODULE 8 - HOST CLAIM, REVIEW & PUBLISH WORKFLOW - BACKEND TESTS")
    print("="*80)
    
    # Login as super admin
    admin_token = login_super_admin()
    if not admin_token:
        print("❌ Cannot proceed without super admin token")
        return
    
    # Create test users
    traveler_token, host_token = create_test_users(admin_token)
    
    # Get or create listing
    listing_id = get_or_create_listing(admin_token)
    if not listing_id:
        print("❌ Cannot proceed without listing")
        return
    
    print(f"\n=== TESTING WITH LISTING ID: {listing_id} ===\n")
    
    # Store tokens for later use
    review_token = None
    presentation_token = None
    review_link_url = None
    presentation_link_url = None
    
    # ========================================================================
    # MODULE 8 - LINKS
    # ========================================================================
    print("\n" + "="*80)
    print("MODULE 8 - LINKS GENERATION & MANAGEMENT")
    print("="*80)
    
    # Test 1: Generate review link
    print("\n--- Test 1: Generate Review Link ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/generate-link",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"type": "review", "expiryDays": 30},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            link = data.get("link", {})
            review_link_url = link.get("url", "")
            review_token = review_link_url.split("/")[-1] if review_link_url else None
            
            # Validate response
            checks = []
            checks.append(("url contains /review/", "/review/" in review_link_url))
            checks.append(("token is 48 chars", len(review_token) == 48 if review_token else False))
            checks.append(("type is 'review'", link.get("type") == "review"))
            checks.append(("revoked is false", link.get("revoked") == False))
            checks.append(("expiresAt exists", "expiresAt" in link))
            
            all_passed = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
            log_test(1, "POST /api/marketplace/crm/business/:id/generate-link (review)", all_passed, details)
        else:
            log_test(1, "POST /api/marketplace/crm/business/:id/generate-link (review)", False, 
                    f"Status: {response.status_code}, Response: {response.text[:200]}")
    except Exception as e:
        log_test(1, "POST /api/marketplace/crm/business/:id/generate-link (review)", False, str(e))
    
    # Test 2: Generate presentation link
    print("\n--- Test 2: Generate Presentation Link ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/generate-link",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"type": "presentation"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            link = data.get("link", {})
            presentation_link_url = link.get("url", "")
            presentation_token = presentation_link_url.split("/")[-1] if presentation_link_url else None
            
            checks = []
            checks.append(("url contains /present/", "/present/" in presentation_link_url))
            checks.append(("token is 48 chars", len(presentation_token) == 48 if presentation_token else False))
            checks.append(("type is 'presentation'", link.get("type") == "presentation"))
            checks.append(("revoked is false", link.get("revoked") == False))
            
            all_passed = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
            log_test(2, "POST /api/marketplace/crm/business/:id/generate-link (presentation)", all_passed, details)
        else:
            log_test(2, "POST /api/marketplace/crm/business/:id/generate-link (presentation)", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(2, "POST /api/marketplace/crm/business/:id/generate-link (presentation)", False, str(e))
    
    # Test 3: Get links
    print("\n--- Test 3: Get Links ---")
    try:
        response = requests.get(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/links",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            links = data.get("links", [])
            
            review_links = [l for l in links if l.get("type") == "review" and not l.get("revoked")]
            presentation_links = [l for l in links if l.get("type") == "presentation" and not l.get("revoked")]
            
            checks = []
            checks.append(("has review link", len(review_links) >= 1))
            checks.append(("has presentation link", len(presentation_links) >= 1))
            checks.append(("links have url field", all("url" in l for l in links)))
            
            all_passed = all(check[1] for check in checks)
            details = f"Total links: {len(links)}, Active review: {len(review_links)}, Active presentation: {len(presentation_links)}"
            log_test(3, "GET /api/marketplace/crm/business/:id/links", all_passed, details)
        else:
            log_test(3, "GET /api/marketplace/crm/business/:id/links", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test(3, "GET /api/marketplace/crm/business/:id/links", False, str(e))
    
    # Test 4: Auth check - no auth should return 401
    print("\n--- Test 4: Auth Check - No Auth ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/generate-link",
            json={"type": "review"},
            timeout=10
        )
        
        passed = response.status_code == 401
        log_test(4, "POST generate-link without auth returns 401", passed, f"Status: {response.status_code}")
    except Exception as e:
        log_test(4, "POST generate-link without auth returns 401", False, str(e))
    
    # Test 4b: Auth check - traveler should return 403
    print("\n--- Test 4b: Auth Check - Traveler ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/generate-link",
            headers={"Authorization": f"Bearer {traveler_token}"},
            json={"type": "review"},
            timeout=10
        )
        
        passed = response.status_code == 403
        log_test("4b", "POST generate-link with traveler auth returns 403", passed, f"Status: {response.status_code}")
    except Exception as e:
        log_test("4b", "POST generate-link with traveler auth returns 403", False, str(e))
    
    # ========================================================================
    # PUBLIC RESOLVE
    # ========================================================================
    print("\n" + "="*80)
    print("PUBLIC TOKEN RESOLVE")
    print("="*80)
    
    # Test 5: Resolve review token
    print("\n--- Test 5: Resolve Review Token ---")
    try:
        if review_token:
            response = requests.get(
                f"{API_BASE}/public/token/{review_token}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                checks = []
                checks.append(("type is 'review'", data.get("type") == "review"))
                checks.append(("listing object exists", "listing" in data))
                checks.append(("expiresAt exists", "expiresAt" in data))
                
                all_passed = all(check[1] for check in checks)
                details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
                log_test(5, "GET /api/public/token/<review_token>", all_passed, details)
            else:
                log_test(5, "GET /api/public/token/<review_token>", False, f"Status: {response.status_code}")
        else:
            log_test(5, "GET /api/public/token/<review_token>", False, "No review token available")
    except Exception as e:
        log_test(5, "GET /api/public/token/<review_token>", False, str(e))
    
    # Test 6: Resolve presentation token
    print("\n--- Test 6: Resolve Presentation Token ---")
    try:
        if presentation_token:
            response = requests.get(
                f"{API_BASE}/public/token/{presentation_token}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                checks = []
                checks.append(("type is 'presentation'", data.get("type") == "presentation"))
                checks.append(("listing object exists", "listing" in data))
                
                all_passed = all(check[1] for check in checks)
                details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
                log_test(6, "GET /api/public/token/<present_token>", all_passed, details)
            else:
                log_test(6, "GET /api/public/token/<present_token>", False, f"Status: {response.status_code}")
        else:
            log_test(6, "GET /api/public/token/<present_token>", False, "No presentation token available")
    except Exception as e:
        log_test(6, "GET /api/public/token/<present_token>", False, str(e))
    
    # Test 7: Resolve bad token
    print("\n--- Test 7: Resolve Bad Token ---")
    try:
        response = requests.get(
            f"{API_BASE}/public/token/bad-token-12345678901234567890123456789012",
            timeout=10
        )
        
        passed = response.status_code == 404
        details = f"Status: {response.status_code}"
        if response.status_code == 404:
            details += f", Message: {response.json().get('error', '')}"
        log_test(7, "GET /api/public/token/bad-token returns 404", passed, details)
    except Exception as e:
        log_test(7, "GET /api/public/token/bad-token returns 404", False, str(e))
    
    # ========================================================================
    # REVIEW SUBMIT (PUBLIC)
    # ========================================================================
    print("\n" + "="*80)
    print("REVIEW SUBMIT (PUBLIC)")
    print("="*80)
    
    # Test 8: Submit review with corrections
    print("\n--- Test 8: Submit Review Corrections ---")
    try:
        if review_token:
            response = requests.post(
                f"{API_BASE}/public/review/{review_token}/submit",
                json={
                    "sections": {
                        "description": "Please shorten the description.",
                        "photos": "Replace hero photo.",
                        "amenities": ""
                    },
                    "generalComment": "Overall very happy, thank you!",
                    "photos": ["https://example.com/new-hero.jpg"],
                    "documents": ["https://example.com/business-license.pdf"],
                    "submitterName": "Test Host",
                    "submitterEmail": "host@example.com"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                tasks_created = data.get("tasksCreated", 0)
                
                # Should create 3 tasks: 2 non-empty sections + 1 general
                passed = tasks_created == 3
                details = f"Tasks created: {tasks_created} (expected 3: description, photos, general)"
                log_test(8, "POST /api/public/review/<token>/submit", passed, details)
            else:
                log_test(8, "POST /api/public/review/<token>/submit", False, 
                        f"Status: {response.status_code}, Response: {response.text[:200]}")
        else:
            log_test(8, "POST /api/public/review/<token>/submit", False, "No review token available")
    except Exception as e:
        log_test(8, "POST /api/public/review/<token>/submit", False, str(e))
    
    # Test 9: Submit review to presentation token (should fail)
    print("\n--- Test 9: Submit Review to Presentation Token ---")
    try:
        if presentation_token:
            response = requests.post(
                f"{API_BASE}/public/review/{presentation_token}/submit",
                json={
                    "sections": {"description": "test"},
                    "submitterName": "Test",
                    "submitterEmail": "test@example.com"
                },
                timeout=10
            )
            
            passed = response.status_code == 403
            details = f"Status: {response.status_code}"
            if response.status_code == 403:
                details += f", Message: {response.json().get('error', '')}"
            log_test(9, "POST review to presentation token returns 403", passed, details)
        else:
            log_test(9, "POST review to presentation token returns 403", False, "No presentation token available")
    except Exception as e:
        log_test(9, "POST review to presentation token returns 403", False, str(e))
    
    # Test 10: Get change requests
    print("\n--- Test 10: Get Change Requests ---")
    try:
        response = requests.get(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/change-requests",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            change_requests = data.get("changeRequests", [])
            
            passed = len(change_requests) >= 1
            details = f"Change requests count: {len(change_requests)}"
            log_test(10, "GET /api/marketplace/crm/business/:id/change-requests", passed, details)
        else:
            log_test(10, "GET /api/marketplace/crm/business/:id/change-requests", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(10, "GET /api/marketplace/crm/business/:id/change-requests", False, str(e))
    
    # Test 11: Get tasks
    print("\n--- Test 11: Get Tasks ---")
    task_id = None
    try:
        response = requests.get(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            tasks = data.get("tasks", [])
            
            # Check for expected task titles
            task_titles = [t.get("title", "") for t in tasks]
            expected_titles = ["Fix Description", "Fix Photos", "General feedback from host"]
            
            checks = []
            checks.append(("has Fix Description", "Fix Description" in task_titles))
            checks.append(("has Fix Photos", "Fix Photos" in task_titles))
            checks.append(("has General feedback", "General feedback from host" in task_titles))
            
            all_passed = all(check[1] for check in checks)
            details = f"Tasks count: {len(tasks)}, Titles: {', '.join(task_titles)}"
            log_test(11, "GET /api/marketplace/crm/business/:id/tasks", all_passed, details)
            
            # Store first task ID for next test
            if tasks:
                task_id = tasks[0].get("id")
        else:
            log_test(11, "GET /api/marketplace/crm/business/:id/tasks", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test(11, "GET /api/marketplace/crm/business/:id/tasks", False, str(e))
    
    # Test 12: Update task status
    print("\n--- Test 12: Update Task Status ---")
    try:
        if task_id:
            response = requests.post(
                f"{API_BASE}/marketplace/crm/tasks/{task_id}/status",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"status": "done"},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify status was updated
                verify_response = requests.get(
                    f"{API_BASE}/marketplace/crm/business/{listing_id}/tasks",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    tasks = verify_response.json().get("tasks", [])
                    updated_task = next((t for t in tasks if t.get("id") == task_id), None)
                    
                    passed = updated_task and updated_task.get("status") == "done"
                    details = f"Task status: {updated_task.get('status') if updated_task else 'not found'}"
                    log_test(12, "POST /api/marketplace/crm/tasks/:id/status", passed, details)
                else:
                    log_test(12, "POST /api/marketplace/crm/tasks/:id/status", False, "Failed to verify")
            else:
                log_test(12, "POST /api/marketplace/crm/tasks/:id/status", False, 
                        f"Status: {response.status_code}")
        else:
            log_test(12, "POST /api/marketplace/crm/tasks/:id/status", False, "No task ID available")
    except Exception as e:
        log_test(12, "POST /api/marketplace/crm/tasks/:id/status", False, str(e))
    
    # ========================================================================
    # CLAIM SUBMIT + ADMIN ACTIONS
    # ========================================================================
    print("\n" + "="*80)
    print("CLAIM SUBMIT + ADMIN ACTIONS")
    print("="*80)
    
    # Test 13: Submit claim
    print("\n--- Test 13: Submit Claim ---")
    claim_id = None
    new_host_email = f"newhost-{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    try:
        if review_token:
            response = requests.post(
                f"{API_BASE}/public/claim/{review_token}/submit",
                json={
                    "name": "Ali Khan",
                    "email": new_host_email,
                    "phone": "+919876543210",
                    "businessRole": "Owner",
                    "identityProofUrl": "https://x/id.jpg",
                    "businessProofUrl": "https://x/biz.pdf",
                    "message": "I own this business"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                claim = data.get("claim", {})
                claim_id = claim.get("id")
                
                checks = []
                checks.append(("claim has id", claim_id is not None))
                checks.append(("status is 'pending'", claim.get("status") == "pending"))
                checks.append(("email matches", claim.get("email") == new_host_email))
                
                all_passed = all(check[1] for check in checks)
                details = f"Claim ID: {claim_id}, Status: {claim.get('status')}"
                log_test(13, "POST /api/public/claim/<token>/submit", all_passed, details)
            else:
                log_test(13, "POST /api/public/claim/<token>/submit", False, 
                        f"Status: {response.status_code}, Response: {response.text[:200]}")
        else:
            log_test(13, "POST /api/public/claim/<token>/submit", False, "No review token available")
    except Exception as e:
        log_test(13, "POST /api/public/claim/<token>/submit", False, str(e))
    
    # Test 14: Claim validation - missing fields
    print("\n--- Test 14: Claim Validation ---")
    try:
        if review_token:
            # Test missing name
            response = requests.post(
                f"{API_BASE}/public/claim/{review_token}/submit",
                json={
                    "email": "test@example.com",
                    "phone": "+919876543210",
                    "businessRole": "Owner"
                },
                timeout=10
            )
            check1 = response.status_code == 400
            
            # Test missing email
            response = requests.post(
                f"{API_BASE}/public/claim/{review_token}/submit",
                json={
                    "name": "Test",
                    "phone": "+919876543210",
                    "businessRole": "Owner"
                },
                timeout=10
            )
            check2 = response.status_code == 400
            
            # Test missing phone
            response = requests.post(
                f"{API_BASE}/public/claim/{review_token}/submit",
                json={
                    "name": "Test",
                    "email": "test@example.com",
                    "businessRole": "Owner"
                },
                timeout=10
            )
            check3 = response.status_code == 400
            
            # Test missing businessRole
            response = requests.post(
                f"{API_BASE}/public/claim/{review_token}/submit",
                json={
                    "name": "Test",
                    "email": "test@example.com",
                    "phone": "+919876543210"
                },
                timeout=10
            )
            check4 = response.status_code == 400
            
            passed = check1 and check2 and check3 and check4
            details = f"Missing name: {check1}, email: {check2}, phone: {check3}, role: {check4}"
            log_test(14, "Claim validation - missing fields return 400", passed, details)
        else:
            log_test(14, "Claim validation - missing fields return 400", False, "No review token available")
    except Exception as e:
        log_test(14, "Claim validation - missing fields return 400", False, str(e))
    
    # Test 15: Get claims
    print("\n--- Test 15: Get Claims ---")
    try:
        response = requests.get(
            f"{API_BASE}/marketplace/crm/claims",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            claims = data.get("claims", [])
            
            # Check if our claim is in the list
            our_claim = next((c for c in claims if c.get("id") == claim_id), None) if claim_id else None
            
            passed = len(claims) >= 1 and (our_claim is not None if claim_id else True)
            details = f"Claims count: {len(claims)}, Our claim found: {our_claim is not None if claim_id else 'N/A'}"
            log_test(15, "GET /api/marketplace/crm/claims", passed, details)
        else:
            log_test(15, "GET /api/marketplace/crm/claims", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test(15, "GET /api/marketplace/crm/claims", False, str(e))
    
    # Test 16: Claim action - request info
    print("\n--- Test 16: Claim Action - Request Info ---")
    try:
        if claim_id:
            response = requests.post(
                f"{API_BASE}/marketplace/crm/claims/{claim_id}/action",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"action": "request_info", "notes": "Please send GST cert"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify status was updated
                verify_response = requests.get(
                    f"{API_BASE}/marketplace/crm/claims",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    claims = verify_response.json().get("claims", [])
                    updated_claim = next((c for c in claims if c.get("id") == claim_id), None)
                    
                    passed = updated_claim and updated_claim.get("status") == "info_requested"
                    details = f"Claim status: {updated_claim.get('status') if updated_claim else 'not found'}"
                    log_test(16, "POST /api/marketplace/crm/claims/:id/action (request_info)", passed, details)
                else:
                    log_test(16, "POST /api/marketplace/crm/claims/:id/action (request_info)", False, "Failed to verify")
            else:
                log_test(16, "POST /api/marketplace/crm/claims/:id/action (request_info)", False, 
                        f"Status: {response.status_code}")
        else:
            log_test(16, "POST /api/marketplace/crm/claims/:id/action (request_info)", False, "No claim ID available")
    except Exception as e:
        log_test(16, "POST /api/marketplace/crm/claims/:id/action (request_info)", False, str(e))
    
    # Test 17: Claim action - approve
    print("\n--- Test 17: Claim Action - Approve ---")
    try:
        if claim_id:
            response = requests.post(
                f"{API_BASE}/marketplace/crm/claims/{claim_id}/action",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"action": "approve"},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify in MongoDB
                client = MongoClient(MONGO_URI)
                db = client[DB_NAME]
                
                # Check user was created/updated
                user = db.users.find_one({"email": new_host_email})
                user_check = user is not None and user.get("role") == "host"
                
                # Check listing was updated
                listing = db.listings.find_one({"id": listing_id})
                listing_checks = []
                if listing:
                    listing_checks.append(("hostId set", listing.get("hostId") == user.get("id") if user else False))
                    listing_checks.append(("claimStatus approved", listing.get("claimStatus") == "approved"))
                    listing_checks.append(("verified true", listing.get("verified") == True))
                
                all_passed = user_check and all(check[1] for check in listing_checks)
                details = f"User created: {user_check}, Listing checks: {', '.join([f'{c[0]}: {c[1]}' for c in listing_checks])}"
                log_test(17, "POST /api/marketplace/crm/claims/:id/action (approve)", all_passed, details)
                
                client.close()
            else:
                log_test(17, "POST /api/marketplace/crm/claims/:id/action (approve)", False, 
                        f"Status: {response.status_code}")
        else:
            log_test(17, "POST /api/marketplace/crm/claims/:id/action (approve)", False, "No claim ID available")
    except Exception as e:
        log_test(17, "POST /api/marketplace/crm/claims/:id/action (approve)", False, str(e))
    
    # ========================================================================
    # PUBLISH / ARCHIVE
    # ========================================================================
    print("\n" + "="*80)
    print("PUBLISH / ARCHIVE")
    print("="*80)
    
    # Test 18: Publish listing
    print("\n--- Test 18: Publish Listing ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/publish",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            # Verify in MongoDB
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME]
            listing = db.listings.find_one({"id": listing_id})
            
            checks = []
            if listing:
                checks.append(("status is 'approved'", listing.get("status") == "approved"))
                checks.append(("isPublished is true", listing.get("isPublished") == True))
                checks.append(("publishedAt is set", listing.get("publishedAt") is not None))
            
            all_passed = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
            log_test(18, "POST /api/marketplace/crm/business/:id/publish", all_passed, details)
            
            client.close()
        else:
            log_test(18, "POST /api/marketplace/crm/business/:id/publish", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(18, "POST /api/marketplace/crm/business/:id/publish", False, str(e))
    
    # Test 19: Archive listing
    print("\n--- Test 19: Archive Listing ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/archive",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            # Verify in MongoDB
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME]
            listing = db.listings.find_one({"id": listing_id})
            
            checks = []
            if listing:
                checks.append(("status is 'archived'", listing.get("status") == "archived"))
                checks.append(("isPublished is false", listing.get("isPublished") == False))
            
            all_passed = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
            log_test(19, "POST /api/marketplace/crm/business/:id/archive", all_passed, details)
            
            client.close()
        else:
            log_test(19, "POST /api/marketplace/crm/business/:id/archive", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(19, "POST /api/marketplace/crm/business/:id/archive", False, str(e))
    
    # ========================================================================
    # REVOKE / REGENERATE / EXPIRY
    # ========================================================================
    print("\n" + "="*80)
    print("REVOKE / REGENERATE / EXPIRY")
    print("="*80)
    
    # Test 20: Revoke link
    print("\n--- Test 20: Revoke Link ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/revoke-link",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"type": "review"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            revoked_count = data.get("revokedCount", 0)
            
            # Try to access the revoked token
            if review_token:
                verify_response = requests.get(
                    f"{API_BASE}/public/token/{review_token}",
                    timeout=10
                )
                
                is_revoked = verify_response.status_code == 410
                error_msg = verify_response.json().get("error", "") if verify_response.status_code == 410 else ""
                has_revoked_msg = "revoked" in error_msg.lower()
                
                passed = revoked_count >= 1 and is_revoked and has_revoked_msg
                details = f"Revoked count: {revoked_count}, Status: {verify_response.status_code}, Has 'revoked' msg: {has_revoked_msg}"
                log_test(20, "POST /api/marketplace/crm/business/:id/revoke-link", passed, details)
            else:
                passed = revoked_count >= 1
                log_test(20, "POST /api/marketplace/crm/business/:id/revoke-link", passed, 
                        f"Revoked count: {revoked_count}")
        else:
            log_test(20, "POST /api/marketplace/crm/business/:id/revoke-link", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(20, "POST /api/marketplace/crm/business/:id/revoke-link", False, str(e))
    
    # Test 21: Regenerate link
    print("\n--- Test 21: Regenerate Link ---")
    new_review_token = None
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/regenerate-link",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"type": "review"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            link = data.get("link", {})
            new_url = link.get("url", "")
            new_review_token = new_url.split("/")[-1] if new_url else None
            
            # Verify new token is different and works
            token_different = new_review_token != review_token
            
            # Check links endpoint
            links_response = requests.get(
                f"{API_BASE}/marketplace/crm/business/{listing_id}/links",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if links_response.status_code == 200:
                links = links_response.json().get("links", [])
                review_links = [l for l in links if l.get("type") == "review"]
                active_review = [l for l in review_links if not l.get("revoked")]
                revoked_review = [l for l in review_links if l.get("revoked")]
                
                checks = []
                checks.append(("new token different", token_different))
                checks.append(("has 1 active review link", len(active_review) == 1))
                checks.append(("has revoked links", len(revoked_review) >= 1))
                
                all_passed = all(check[1] for check in checks)
                details = f"Active: {len(active_review)}, Revoked: {len(revoked_review)}, Token changed: {token_different}"
                log_test(21, "POST /api/marketplace/crm/business/:id/regenerate-link", all_passed, details)
            else:
                log_test(21, "POST /api/marketplace/crm/business/:id/regenerate-link", False, "Failed to verify links")
        else:
            log_test(21, "POST /api/marketplace/crm/business/:id/regenerate-link", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(21, "POST /api/marketplace/crm/business/:id/regenerate-link", False, str(e))
    
    # Test 22: Expired token
    print("\n--- Test 22: Expired Token ---")
    try:
        if new_review_token:
            # Update token in MongoDB to be expired
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME]
            
            # Set expiresAt to 1 minute ago
            past_time = datetime.now() - timedelta(minutes=1)
            result = db.mpTokens.update_one(
                {"token": new_review_token},
                {"$set": {"expiresAt": past_time}}
            )
            
            if result.modified_count > 0:
                # Try to access expired token
                response = requests.get(
                    f"{API_BASE}/public/token/{new_review_token}",
                    timeout=10
                )
                
                is_expired = response.status_code == 410
                error_msg = response.json().get("error", "") if response.status_code == 410 else ""
                has_expired_msg = "expired" in error_msg.lower()
                
                passed = is_expired and has_expired_msg
                details = f"Status: {response.status_code}, Has 'expired' msg: {has_expired_msg}, Error: {error_msg}"
                log_test(22, "GET /api/public/token/<expired_token> returns 410", passed, details)
            else:
                log_test(22, "GET /api/public/token/<expired_token> returns 410", False, 
                        "Failed to update token expiry")
            
            client.close()
        else:
            log_test(22, "GET /api/public/token/<expired_token> returns 410", False, "No new review token available")
    except Exception as e:
        log_test(22, "GET /api/public/token/<expired_token> returns 410", False, str(e))
    
    # ========================================================================
    # INVITE HOST
    # ========================================================================
    print("\n" + "="*80)
    print("INVITE HOST")
    print("="*80)
    
    # Test 23: Invite host
    print("\n--- Test 23: Invite Host ---")
    try:
        response = requests.post(
            f"{API_BASE}/marketplace/crm/business/{listing_id}/invite-host",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": "invited@example.com",
                "name": "Invited Host",
                "message": "Please review your listing"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            checks = []
            checks.append(("sent is true", data.get("sent") == True))
            checks.append(("reviewUrl exists", "reviewUrl" in data))
            checks.append(("reviewUrl is string", isinstance(data.get("reviewUrl"), str)))
            
            all_passed = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {check[1]}" for check in checks])
            log_test(23, "POST /api/marketplace/crm/business/:id/invite-host", all_passed, details)
        else:
            log_test(23, "POST /api/marketplace/crm/business/:id/invite-host", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test(23, "POST /api/marketplace/crm/business/:id/invite-host", False, str(e))
    
    # ========================================================================
    # REGRESSION SPOT-CHECK
    # ========================================================================
    print("\n" + "="*80)
    print("REGRESSION SPOT-CHECK")
    print("="*80)
    
    # Test 24: Auth me
    print("\n--- Test 24: Regression - Auth Me ---")
    try:
        response = requests.get(
            f"{API_BASE}/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        passed = response.status_code == 200
        details = f"Status: {response.status_code}"
        if passed:
            user = response.json().get("user", {})
            details += f", User: {user.get('email', 'N/A')}"
        log_test(24, "Regression - GET /api/auth/me", passed, details)
    except Exception as e:
        log_test(24, "Regression - GET /api/auth/me", False, str(e))
    
    # Test 25: Listings
    print("\n--- Test 25: Regression - Listings ---")
    try:
        response = requests.get(
            f"{API_BASE}/listings",
            timeout=10
        )
        
        passed = response.status_code == 200
        details = f"Status: {response.status_code}"
        if passed:
            listings = response.json().get("listings", [])
            details += f", Listings count: {len(listings)}"
        log_test(25, "Regression - GET /api/listings", passed, details)
    except Exception as e:
        log_test(25, "Regression - GET /api/listings", False, str(e))
    
    # Test 26: CRM Dashboard
    print("\n--- Test 26: Regression - CRM Dashboard ---")
    try:
        response = requests.get(
            f"{API_BASE}/marketplace/crm/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        passed = response.status_code == 200
        details = f"Status: {response.status_code}"
        log_test(26, "Regression - GET /api/marketplace/crm/dashboard", passed, details)
    except Exception as e:
        log_test(26, "Regression - GET /api/marketplace/crm/dashboard", False, str(e))
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"\nTotal Tests: {total_tests}")
    print(f"Passed: {passed_tests} ✅")
    print(f"Failed: {failed_tests} ❌")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
    
    print("\n" + "="*80)
    print("DETAILED RESULTS")
    print("="*80)
    for result in test_results:
        status = "✅ PASS" if result["passed"] else "❌ FAIL"
        print(f"{status} | Test {result['test']}: {result['description']}")
        if result["details"]:
            print(f"    {result['details']}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    try:
        success = run_module8_tests()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
