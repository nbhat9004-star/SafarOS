#!/usr/bin/env python3
"""
Safar Circle Module 2 (Collaboration Engine) Backend Test
Tests all Module 2 endpoints: members, join, settings, notifications
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://app-ownership-patch.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "safar"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def register_user(email, password, name, role="traveler"):
    """Register a new user and return token"""
    url = f"{BASE_URL}/auth/register"
    payload = {"email": email, "password": password, "name": name, "role": role}
    resp = requests.post(url, json=payload)
    if resp.status_code == 200:
        data = resp.json()
        return data.get("token"), data.get("user")
    return None, None

def login_user(email, password):
    """Login and return token"""
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email, "password": password}
    resp = requests.post(url, json=payload)
    if resp.status_code == 200:
        data = resp.json()
        return data.get("token"), data.get("user")
    return None, None

def create_journey(token, name, destination_name, max_members=3):
    """Create a public journey"""
    url = f"{BASE_URL}/circle/journeys"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": name,
        "description": "Test journey for Module 2",
        "destination": {
            "name": destination_name,
            "district": "Srinagar",
            "state": "Jammu & Kashmir",
            "country": "India"
        },
        "maxMembers": max_members,
        "visibility": "public",
        "theme": "adventure",
        "difficulty": "moderate"
    }
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code == 201:
        data = resp.json()
        return data.get("journey", {}).get("id"), data.get("journey", {}).get("slug")
    return None, None

def main():
    log("=" * 80)
    log("SAFAR CIRCLE MODULE 2 (COLLABORATION ENGINE) BACKEND TEST")
    log("=" * 80)
    
    timestamp = int(time.time())
    
    # Test credentials
    curator_email = f"curator-{timestamp}@test.com"
    curator_password = "TestPass123!"
    curator_name = "Test Curator"
    
    traveler1_email = f"traveler1-{timestamp}@test.com"
    traveler1_password = "TestPass123!"
    traveler1_name = "Test Traveler 1"
    
    traveler2_email = f"traveler2-{timestamp}@test.com"
    traveler2_password = "TestPass123!"
    traveler2_name = "Test Traveler 2"
    
    passed = 0
    failed = 0
    
    try:
        # ========== SETUP: Register users ==========
        log("\n[SETUP] Registering test users...")
        
        curator_token, curator_user = register_user(curator_email, curator_password, curator_name, "traveler")
        if not curator_token:
            log("❌ Failed to register curator")
            return
        log(f"✅ Curator registered: {curator_user['id']}")
        
        traveler1_token, traveler1_user = register_user(traveler1_email, traveler1_password, traveler1_name, "traveler")
        if not traveler1_token:
            log("❌ Failed to register traveler1")
            return
        log(f"✅ Traveler1 registered: {traveler1_user['id']}")
        
        traveler2_token, traveler2_user = register_user(traveler2_email, traveler2_password, traveler2_name, "traveler")
        if not traveler2_token:
            log("❌ Failed to register traveler2")
            return
        log(f"✅ Traveler2 registered: {traveler2_user['id']}")
        
        # ========== SETUP: Create journey ==========
        log("\n[SETUP] Creating test journey...")
        
        journey_id, journey_slug = create_journey(curator_token, "Kashmir Adventure", "Srinagar", max_members=3)
        if not journey_id:
            log("❌ Failed to create journey")
            return
        log(f"✅ Journey created: {journey_id} (slug: {journey_slug})")
        
        # ========== TEST 1: GET /api/circle/journeys/:id/members (anonymous) ==========
        log("\n[TEST 1] GET /api/circle/journeys/:id/members (anonymous)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members"
            resp = requests.get(url)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert "journey" in data, "Missing 'journey' field"
            assert "owner" in data, "Missing 'owner' field"
            assert "coCurators" in data, "Missing 'coCurators' field"
            assert "travelers" in data, "Missing 'travelers' field"
            assert "pending" in data, "Missing 'pending' field"
            assert data["pending"] == [], "Anonymous should see empty pending list"
            assert data["acceptedCount"] == 1, f"Expected acceptedCount=1 (curator only), got {data['acceptedCount']}"
            assert data["acceptedSeats"] == 1, f"Expected acceptedSeats=1, got {data['acceptedSeats']}"
            assert data["seatsRemaining"] == 2, f"Expected seatsRemaining=2, got {data['seatsRemaining']}"
            assert data["canManage"] == False, "Anonymous should not be able to manage"
            log(f"✅ TEST 1 PASSED: Anonymous can view members, pending=[], acceptedCount=1, seatsRemaining=2")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 1 FAILED: {e}")
            failed += 1
        
        # ========== TEST 2: POST /api/circle/journeys/:id/join (no auth) ==========
        log("\n[TEST 2] POST /api/circle/journeys/:id/join (no auth)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            resp = requests.post(url, json={"seats": 1, "message": "Test"})
            assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
            log(f"✅ TEST 2 PASSED: 401 when not signed in")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 2 FAILED: {e}")
            failed += 1
        
        # ========== TEST 3: POST /api/circle/journeys/:id/join (curator tries to join own journey) ==========
        log("\n[TEST 3] POST /api/circle/journeys/:id/join (curator tries to join own journey)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers)
            assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
            data = resp.json()
            assert "curator" in data.get("error", "").lower(), "Error should mention curator"
            log(f"✅ TEST 3 PASSED: 400 when curator tries to join own journey")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 3 FAILED: {e}")
            failed += 1
        
        # ========== TEST 4: POST /api/circle/journeys/:id/join (valid request) ==========
        log("\n[TEST 4] POST /api/circle/journeys/:id/join (valid request)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers = {"Authorization": f"Bearer {traveler1_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Excited to join!"}, headers=headers)
            assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert "membership" in data, "Missing 'membership' field"
            membership = data["membership"]
            assert membership["status"] == "pending", f"Expected status=pending, got {membership['status']}"
            assert membership["seats"] == 1, f"Expected seats=1, got {membership['seats']}"
            assert membership["message"] == "Excited to join!", f"Message mismatch"
            traveler1_membership_id = membership["id"]
            log(f"✅ TEST 4 PASSED: 201 with membership id={traveler1_membership_id}, status=pending")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 4 FAILED: {e}")
            failed += 1
        
        # ========== TEST 5: POST /api/circle/journeys/:id/join (duplicate request) ==========
        log("\n[TEST 5] POST /api/circle/journeys/:id/join (duplicate request)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers = {"Authorization": f"Bearer {traveler1_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers)
            assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
            data = resp.json()
            assert "pending" in data.get("error", "").lower(), "Error should mention pending request"
            log(f"✅ TEST 5 PASSED: 400 when duplicate pending request")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 5 FAILED: {e}")
            failed += 1
        
        # ========== TEST 6: GET /api/circle/journeys/:id/members (curator sees pending) ==========
        log("\n[TEST 6] GET /api/circle/journeys/:id/members (curator sees pending)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.get(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert len(data["pending"]) == 1, f"Expected 1 pending request, got {len(data['pending'])}"
            pending_req = data["pending"][0]
            assert pending_req["userId"] == traveler1_user["id"], "Pending request userId mismatch"
            assert pending_req["userName"] == traveler1_name, "Pending request userName mismatch"
            assert pending_req["seats"] == 1, "Pending request seats mismatch"
            assert pending_req["message"] == "Excited to join!", "Pending request message mismatch"
            assert pending_req["status"] == "pending", "Pending request status mismatch"
            assert data["acceptedCount"] == 1, f"Expected acceptedCount=1, got {data['acceptedCount']}"
            assert data["seatsRemaining"] == 2, f"Expected seatsRemaining=2, got {data['seatsRemaining']}"
            assert data["canManage"] == True, "Curator should be able to manage"
            log(f"✅ TEST 6 PASSED: Curator sees 1 pending request with correct details")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 6 FAILED: {e}")
            failed += 1
        
        # ========== TEST 7: POST /api/circle/journeys/:id/members/:memberId/accept ==========
        log("\n[TEST 7] POST /api/circle/journeys/:id/members/:memberId/accept")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler1_membership_id}/accept"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("status") == "accepted", f"Expected status=accepted, got {data.get('status')}"
            log(f"✅ TEST 7 PASSED: Membership accepted")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 7 FAILED: {e}")
            failed += 1
        
        # ========== TEST 8: GET /api/circle/journeys/:id/members (verify accepted member) ==========
        log("\n[TEST 8] GET /api/circle/journeys/:id/members (verify accepted member)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.get(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert len(data["travelers"]) == 1, f"Expected 1 traveler, got {len(data['travelers'])}"
            assert data["acceptedCount"] == 2, f"Expected acceptedCount=2, got {data['acceptedCount']}"
            assert data["acceptedSeats"] == 2, f"Expected acceptedSeats=2, got {data['acceptedSeats']}"
            assert data["seatsRemaining"] == 1, f"Expected seatsRemaining=1, got {data['seatsRemaining']}"
            assert len(data["pending"]) == 0, f"Expected 0 pending, got {len(data['pending'])}"
            log(f"✅ TEST 8 PASSED: Traveler now in travelers[], acceptedCount=2, seatsRemaining=1")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 8 FAILED: {e}")
            failed += 1
        
        # ========== TEST 9: Check notification for traveler1 (circle_request_accepted) ==========
        log("\n[TEST 9] Check notification for traveler1 (circle_request_accepted)")
        try:
            # Query MongoDB directly for notification
            from pymongo import MongoClient
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            notif = db.notifications.find_one({
                "userId": traveler1_user["id"],
                "type": "circle_request_accepted"
            })
            assert notif is not None, "Notification not found"
            assert notif["category"] == "circle", f"Expected category=circle, got {notif['category']}"
            assert "accepted" in notif["title"].lower() or "joined" in notif["body"].lower(), "Notification content mismatch"
            log(f"✅ TEST 9 PASSED: Notification created with type=circle_request_accepted")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 9 FAILED: {e}")
            failed += 1
        
        # ========== TEST 10: POST /api/circle/journeys/:id/members/:memberId/promote ==========
        log("\n[TEST 10] POST /api/circle/journeys/:id/members/:memberId/promote")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler1_membership_id}/promote"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("role") == "co_curator", f"Expected role=co_curator, got {data.get('role')}"
            log(f"✅ TEST 10 PASSED: Traveler promoted to co_curator")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 10 FAILED: {e}")
            failed += 1
        
        # ========== TEST 11: GET /api/circle/journeys/:id/members (verify co-curator) ==========
        log("\n[TEST 11] GET /api/circle/journeys/:id/members (verify co-curator)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.get(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert len(data["coCurators"]) == 1, f"Expected 1 co-curator, got {len(data['coCurators'])}"
            assert len(data["travelers"]) == 0, f"Expected 0 travelers, got {len(data['travelers'])}"
            log(f"✅ TEST 11 PASSED: Traveler now in coCurators[], travelers=[]")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 11 FAILED: {e}")
            failed += 1
        
        # ========== TEST 12: POST /api/circle/journeys/:id/members/:memberId/demote ==========
        log("\n[TEST 12] POST /api/circle/journeys/:id/members/:memberId/demote")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler1_membership_id}/demote"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("role") == "traveler", f"Expected role=traveler, got {data.get('role')}"
            log(f"✅ TEST 12 PASSED: Co-curator demoted to traveler")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 12 FAILED: {e}")
            failed += 1
        
        # ========== TEST 13: PATCH /api/circle/journeys/:id/settings (registrationsClosed=true) ==========
        log("\n[TEST 13] PATCH /api/circle/journeys/:id/settings (registrationsClosed=true)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/settings"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.patch(url, json={"registrationsClosed": True}, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data["journey"]["registrationsClosed"] == True, "registrationsClosed should be true"
            log(f"✅ TEST 13 PASSED: registrationsClosed set to true")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 13 FAILED: {e}")
            failed += 1
        
        # ========== TEST 14: POST /api/circle/journeys/:id/join (registrations closed) ==========
        log("\n[TEST 14] POST /api/circle/journeys/:id/join (registrations closed)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers = {"Authorization": f"Bearer {traveler2_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers)
            assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
            data = resp.json()
            assert "closed" in data.get("error", "").lower(), "Error should mention closed registrations"
            log(f"✅ TEST 14 PASSED: 403 when registrations closed")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 14 FAILED: {e}")
            failed += 1
        
        # ========== TEST 15: PATCH /api/circle/journeys/:id/settings (registrationsClosed=false, maxMembers=5) ==========
        log("\n[TEST 15] PATCH /api/circle/journeys/:id/settings (registrationsClosed=false, maxMembers=5)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/settings"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.patch(url, json={"registrationsClosed": False, "maxMembers": 5}, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data["journey"]["registrationsClosed"] == False, "registrationsClosed should be false"
            assert data["journey"]["maxMembers"] == 5, f"Expected maxMembers=5, got {data['journey']['maxMembers']}"
            log(f"✅ TEST 15 PASSED: registrationsClosed=false, maxMembers=5")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 15 FAILED: {e}")
            failed += 1
        
        # ========== TEST 16: PATCH /api/circle/journeys/:id/settings (reduce maxMembers below acceptedSeats) ==========
        log("\n[TEST 16] PATCH /api/circle/journeys/:id/settings (reduce maxMembers below acceptedSeats)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/settings"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.patch(url, json={"maxMembers": 1}, headers=headers)
            assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
            data = resp.json()
            assert "below" in data.get("error", "").lower() or "current" in data.get("error", "").lower(), "Error should mention capacity constraint"
            log(f"✅ TEST 16 PASSED: 400 when reducing maxMembers below acceptedSeats")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 16 FAILED: {e}")
            failed += 1
        
        # ========== TEST 17: POST /api/circle/journeys/:id/leave ==========
        log("\n[TEST 17] POST /api/circle/journeys/:id/leave")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/leave"
            headers = {"Authorization": f"Bearer {traveler1_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("left") == True, "Expected left=true"
            log(f"✅ TEST 17 PASSED: Traveler left journey")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 17 FAILED: {e}")
            failed += 1
        
        # ========== TEST 18: Check notification for curator (circle_member_left) ==========
        log("\n[TEST 18] Check notification for curator (circle_member_left)")
        try:
            from pymongo import MongoClient
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            notif = db.notifications.find_one({
                "userId": curator_user["id"],
                "type": "circle_member_left"
            })
            assert notif is not None, "Notification not found"
            assert notif["category"] == "circle", f"Expected category=circle, got {notif['category']}"
            assert "left" in notif["title"].lower() or "left" in notif["body"].lower(), "Notification content mismatch"
            log(f"✅ TEST 18 PASSED: Notification created with type=circle_member_left")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 18 FAILED: {e}")
            failed += 1
        
        # ========== TEST 19: POST /api/circle/journeys/:id/join (traveler2 with seats=10) ==========
        log("\n[TEST 19] POST /api/circle/journeys/:id/join (traveler2 with seats=10)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers = {"Authorization": f"Bearer {traveler2_token}"}
            resp = requests.post(url, json={"seats": 10, "message": "Test"}, headers=headers)
            assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
            data = resp.json()
            assert "seat" in data.get("error", "").lower() or "remaining" in data.get("error", "").lower(), "Error should mention capacity"
            log(f"✅ TEST 19 PASSED: 400 when requesting more seats than available")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 19 FAILED: {e}")
            failed += 1
        
        # ========== TEST 20: POST /api/circle/journeys/:id/cancel-request ==========
        log("\n[TEST 20] POST /api/circle/journeys/:id/cancel-request")
        try:
            # First, traveler2 makes a request
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers = {"Authorization": f"Bearer {traveler2_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers)
            assert resp.status_code == 201, f"Expected 201, got {resp.status_code}"
            
            # Now cancel it
            url = f"{BASE_URL}/circle/journeys/{journey_id}/cancel-request"
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("cancelled") == True, "Expected cancelled=true"
            log(f"✅ TEST 20 PASSED: Traveler cancelled pending request")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 20 FAILED: {e}")
            failed += 1
        
        # ========== TEST 21: POST /api/circle/journeys/:id/members/:memberId/decline ==========
        log("\n[TEST 21] POST /api/circle/journeys/:id/members/:memberId/decline")
        try:
            # First, traveler2 makes a new request
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers_t2 = {"Authorization": f"Bearer {traveler2_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers_t2)
            assert resp.status_code == 201, f"Expected 201, got {resp.status_code}"
            traveler2_membership_id = resp.json()["membership"]["id"]
            
            # Curator declines it
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler2_membership_id}/decline"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("status") == "declined", f"Expected status=declined, got {data.get('status')}"
            log(f"✅ TEST 21 PASSED: Curator declined request")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 21 FAILED: {e}")
            failed += 1
        
        # ========== TEST 22: Check notification for traveler2 (circle_request_declined) ==========
        log("\n[TEST 22] Check notification for traveler2 (circle_request_declined)")
        try:
            from pymongo import MongoClient
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            notif = db.notifications.find_one({
                "userId": traveler2_user["id"],
                "type": "circle_request_declined"
            })
            assert notif is not None, "Notification not found"
            assert notif["category"] == "circle", f"Expected category=circle, got {notif['category']}"
            assert "declined" in notif["title"].lower() or "declined" in notif["body"].lower(), "Notification content mismatch"
            log(f"✅ TEST 22 PASSED: Notification created with type=circle_request_declined")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 22 FAILED: {e}")
            failed += 1
        
        # ========== TEST 23: POST /api/circle/journeys/:id/members/:memberId/remove ==========
        log("\n[TEST 23] POST /api/circle/journeys/:id/members/:memberId/remove")
        try:
            # First, traveler2 makes a new request and gets accepted
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers_t2 = {"Authorization": f"Bearer {traveler2_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers_t2)
            assert resp.status_code == 201, f"Expected 201, got {resp.status_code}"
            traveler2_membership_id = resp.json()["membership"]["id"]
            
            # Curator accepts it
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler2_membership_id}/accept"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            
            # Curator removes it
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler2_membership_id}/remove"
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("status") == "removed", f"Expected status=removed, got {data.get('status')}"
            log(f"✅ TEST 23 PASSED: Curator removed accepted member")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 23 FAILED: {e}")
            failed += 1
        
        # ========== TEST 24: Check notification for traveler2 (circle_member_removed) ==========
        log("\n[TEST 24] Check notification for traveler2 (circle_member_removed)")
        try:
            from pymongo import MongoClient
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            notif = db.notifications.find_one({
                "userId": traveler2_user["id"],
                "type": "circle_member_removed"
            })
            assert notif is not None, "Notification not found"
            assert notif["category"] == "circle", f"Expected category=circle, got {notif['category']}"
            assert "removed" in notif["title"].lower() or "removed" in notif["body"].lower(), "Notification content mismatch"
            log(f"✅ TEST 24 PASSED: Notification created with type=circle_member_removed")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 24 FAILED: {e}")
            failed += 1
        
        # ========== TEST 25: PATCH /api/circle/journeys/:id/settings (non-curator) ==========
        log("\n[TEST 25] PATCH /api/circle/journeys/:id/settings (non-curator)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/settings"
            headers = {"Authorization": f"Bearer {traveler1_token}"}
            resp = requests.patch(url, json={"maxMembers": 10}, headers=headers)
            assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
            log(f"✅ TEST 25 PASSED: 403 when non-curator tries to change settings")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 25 FAILED: {e}")
            failed += 1
        
        # ========== TEST 26: POST /api/circle/journeys/:id/members/:memberId/accept (non-curator) ==========
        log("\n[TEST 26] POST /api/circle/journeys/:id/members/:memberId/accept (non-curator)")
        try:
            # First, traveler2 makes a new request
            url = f"{BASE_URL}/circle/journeys/{journey_id}/join"
            headers_t2 = {"Authorization": f"Bearer {traveler2_token}"}
            resp = requests.post(url, json={"seats": 1, "message": "Test"}, headers=headers_t2)
            assert resp.status_code == 201, f"Expected 201, got {resp.status_code}"
            traveler2_membership_id = resp.json()["membership"]["id"]
            
            # Traveler1 tries to accept it
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members/{traveler2_membership_id}/accept"
            headers = {"Authorization": f"Bearer {traveler1_token}"}
            resp = requests.post(url, headers=headers)
            assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
            log(f"✅ TEST 26 PASSED: 403 when non-curator tries to accept request")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 26 FAILED: {e}")
            failed += 1
        
        # ========== TEST 27: PATCH /api/circle/journeys/:id/settings (invalid visibility) ==========
        log("\n[TEST 27] PATCH /api/circle/journeys/:id/settings (invalid visibility)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/settings"
            headers = {"Authorization": f"Bearer {curator_token}"}
            resp = requests.patch(url, json={"visibility": "invalid"}, headers=headers)
            assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
            log(f"✅ TEST 27 PASSED: 400 when invalid visibility")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 27 FAILED: {e}")
            failed += 1
        
        # ========== TEST 28: GET /api/circle/journeys/:id/members (traveler sees myMembership) ==========
        log("\n[TEST 28] GET /api/circle/journeys/:id/members (traveler sees myMembership)")
        try:
            url = f"{BASE_URL}/circle/journeys/{journey_id}/members"
            headers = {"Authorization": f"Bearer {traveler1_token}"}
            resp = requests.get(url, headers=headers)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert data["myMembership"] is not None, "myMembership should not be null"
            assert data["myMembership"]["userId"] == traveler1_user["id"], "myMembership userId mismatch"
            assert data["myMembership"]["status"] == "left", f"Expected status=left, got {data['myMembership']['status']}"
            log(f"✅ TEST 28 PASSED: Traveler sees myMembership with status=left")
            passed += 1
        except Exception as e:
            log(f"❌ TEST 28 FAILED: {e}")
            failed += 1
        
    except Exception as e:
        log(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # ========== SUMMARY ==========
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    log(f"✅ PASSED: {passed}")
    log(f"❌ FAILED: {failed}")
    log(f"TOTAL: {passed + failed}")
    log(f"SUCCESS RATE: {(passed / (passed + failed) * 100):.1f}%")
    log("=" * 80)
    
    if failed == 0:
        log("\n🎉 ALL TESTS PASSED! Module 2 backend is working correctly.")
    else:
        log(f"\n⚠️  {failed} test(s) failed. Please review the errors above.")

if __name__ == "__main__":
    main()
