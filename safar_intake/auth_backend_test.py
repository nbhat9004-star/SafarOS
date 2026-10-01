#!/usr/bin/env python3
"""
Comprehensive Auth API Backend Test for Safar
Tests all authentication endpoints: register, login, logout, auth/me
Tests for traveler, host, and admin roles
"""
import os
import sys
import requests
import json
from pymongo import MongoClient
import bcrypt
import uuid
from datetime import datetime

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://app-ownership-patch.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'safar')

# Test credentials with timestamp to avoid conflicts
timestamp = datetime.now().strftime('%Y%m%d%H%M%S')

TEST_TRAVELER = {
    'name': 'Test Traveler',
    'email': f'test-traveler-{timestamp}@safar.com',
    'password': 'password123',
    'role': 'traveler'
}

TEST_HOST = {
    'name': 'Test Host',
    'email': f'test-host-{timestamp}@safar.com',
    'password': 'password123',
    'role': 'host'
}

TEST_ADMIN = {
    'name': 'Test Admin',
    'email': f'test-admin-{timestamp}@safar.com',
    'password': 'password123',
    'role': 'admin'
}

# Store tokens for later tests
tokens = {}
cookies = {}

def print_test(name):
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg):
    print(f"❌ FAIL: {msg}")
    sys.exit(1)

def print_info(msg):
    print(f"ℹ️  INFO: {msg}")

def cleanup_test_data():
    """Remove test users from MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Clean test users with timestamp pattern
        result = db['users'].delete_many({'email': {'$regex': 'test-(traveler|host|admin)-.*@safar.com'}})
        print_info(f"Cleaned up {result.deleted_count} test users")
        
        client.close()
    except Exception as e:
        print_fail(f"Cleanup failed: {e}")

def test_traveler_registration():
    """Test 1: Register a traveler account"""
    print_test("1. TRAVELER REGISTRATION")
    
    url = f"{API_BASE}/auth/register"
    response = requests.post(url, json=TEST_TRAVELER)
    
    print_info(f"POST {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print_fail(f"Expected 200, got {response.status_code}: {response.text}")
    
    data = response.json()
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    # Verify response structure
    if not data.get('ok'):
        print_fail(f"Response should have ok: true, got: {data}")
    
    if 'user' not in data:
        print_fail("Response should have 'user' field")
    
    if 'token' not in data:
        print_fail("Response should have 'token' field")
    
    user = data['user']
    
    # Verify user fields
    if user.get('role') != 'traveler':
        print_fail(f"User role should be 'traveler', got: {user.get('role')}")
    
    if not user.get('id'):
        print_fail("User should have 'id' field")
    
    if user.get('email') != TEST_TRAVELER['email'].lower():
        print_fail(f"Email should be {TEST_TRAVELER['email'].lower()}, got: {user.get('email')}")
    
    if user.get('name') != TEST_TRAVELER['name']:
        print_fail(f"Name should be {TEST_TRAVELER['name']}, got: {user.get('name')}")
    
    # Verify cookie is set
    if 'safar_token' not in response.cookies:
        print_fail("safar_token cookie should be set")
    
    # Store token and cookie for later tests
    tokens['traveler'] = data['token']
    cookies['traveler'] = response.cookies.get('safar_token')
    
    print_pass("Traveler registration successful")
    print_pass(f"User ID: {user['id']}")
    print_pass(f"User role: {user['role']}")
    print_pass(f"Token received: {data['token'][:20]}...")
    print_pass(f"Cookie set: safar_token")

def test_host_registration():
    """Test 2: Register a host account"""
    print_test("2. HOST REGISTRATION")
    
    url = f"{API_BASE}/auth/register"
    response = requests.post(url, json=TEST_HOST)
    
    print_info(f"POST {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print_fail(f"Expected 200, got {response.status_code}: {response.text}")
    
    data = response.json()
    
    if not data.get('ok'):
        print_fail(f"Response should have ok: true")
    
    user = data['user']
    
    if user.get('role') != 'host':
        print_fail(f"User role should be 'host', got: {user.get('role')}")
    
    # Store token and cookie
    tokens['host'] = data['token']
    cookies['host'] = response.cookies.get('safar_token')
    
    print_pass("Host registration successful")
    print_pass(f"User role: {user['role']}")

def test_login():
    """Test 3: Login with registered traveler credentials"""
    print_test("3. LOGIN TEST")
    
    url = f"{API_BASE}/auth/login"
    payload = {
        'email': TEST_TRAVELER['email'],
        'password': TEST_TRAVELER['password']
    }
    
    response = requests.post(url, json=payload)
    
    print_info(f"POST {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print_fail(f"Expected 200, got {response.status_code}: {response.text}")
    
    data = response.json()
    
    if not data.get('ok'):
        print_fail("Response should have ok: true")
    
    if 'user' not in data:
        print_fail("Response should have 'user' field")
    
    if 'token' not in data:
        print_fail("Response should have 'token' field")
    
    user = data['user']
    
    if user.get('email') != TEST_TRAVELER['email'].lower():
        print_fail(f"Email mismatch")
    
    # Verify cookie is set
    if 'safar_token' not in response.cookies:
        print_fail("safar_token cookie should be set")
    
    print_pass("Login successful")
    print_pass(f"User: {user['name']} ({user['email']})")
    print_pass(f"Token received: {data['token'][:20]}...")

def test_failed_login():
    """Test 4: Login with wrong password"""
    print_test("4. FAILED LOGIN TEST (Wrong Password)")
    
    url = f"{API_BASE}/auth/login"
    payload = {
        'email': TEST_TRAVELER['email'],
        'password': 'wrongpassword'
    }
    
    response = requests.post(url, json=payload)
    
    print_info(f"POST {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 401:
        print_fail(f"Expected 401, got {response.status_code}")
    
    data = response.json()
    
    if data.get('ok') != False:
        print_fail("Response should have ok: false")
    
    if 'error' not in data:
        print_fail("Response should have 'error' field")
    
    print_pass("Failed login correctly returns 401")
    print_pass(f"Error message: {data['error']}")

def test_auth_me_with_cookie():
    """Test 5: GET /api/auth/me with cookie"""
    print_test("5. AUTH ME TEST (With Cookie)")
    
    url = f"{API_BASE}/auth/me"
    
    # Use cookie from traveler registration
    cookies_dict = {'safar_token': cookies['traveler']}
    response = requests.get(url, cookies=cookies_dict)
    
    print_info(f"GET {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print_fail(f"Expected 200, got {response.status_code}: {response.text}")
    
    data = response.json()
    
    if not data.get('ok'):
        print_fail("Response should have ok: true")
    
    if 'user' not in data:
        print_fail("Response should have 'user' field")
    
    user = data['user']
    
    if user.get('email') != TEST_TRAVELER['email'].lower():
        print_fail(f"Email mismatch")
    
    print_pass("Auth me with cookie successful")
    print_pass(f"User: {user['name']} ({user['email']})")

def test_auth_me_with_bearer():
    """Test 6: GET /api/auth/me with Bearer token"""
    print_test("6. AUTH ME TEST (With Bearer Token)")
    
    url = f"{API_BASE}/auth/me"
    headers = {'Authorization': f"Bearer {tokens['traveler']}"}
    
    response = requests.get(url, headers=headers)
    
    print_info(f"GET {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print_fail(f"Expected 200, got {response.status_code}: {response.text}")
    
    data = response.json()
    
    if not data.get('ok'):
        print_fail("Response should have ok: true")
    
    user = data['user']
    
    if user.get('email') != TEST_TRAVELER['email'].lower():
        print_fail(f"Email mismatch")
    
    print_pass("Auth me with Bearer token successful")
    print_pass(f"User: {user['name']}")

def test_auth_me_no_auth():
    """Test 7: GET /api/auth/me without auth"""
    print_test("7. AUTH ME TEST (No Auth)")
    
    url = f"{API_BASE}/auth/me"
    response = requests.get(url)
    
    print_info(f"GET {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 401:
        print_fail(f"Expected 401, got {response.status_code}")
    
    data = response.json()
    
    if data.get('ok') != False:
        print_fail("Response should have ok: false")
    
    print_pass("Auth me without auth correctly returns 401")

def test_admin_creation():
    """Test 8: Create admin user via MongoDB"""
    print_test("8. ADMIN USER CREATION")
    
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        users = db['users']
        
        # First register as host, then update to admin
        url = f"{API_BASE}/auth/register"
        response = requests.post(url, json=TEST_ADMIN)
        
        if response.status_code != 200:
            print_fail(f"Admin registration failed: {response.status_code}")
        
        data = response.json()
        admin_id = data['user']['id']
        
        # Update role to admin in MongoDB
        result = users.update_one(
            {'id': admin_id},
            {'$set': {'role': 'admin'}}
        )
        
        if result.modified_count != 1:
            print_fail("Failed to update user to admin role")
        
        # Verify admin role in database
        admin_user = users.find_one({'id': admin_id})
        if admin_user['role'] != 'admin':
            print_fail(f"Admin role not set correctly: {admin_user['role']}")
        
        # Store admin token
        tokens['admin'] = data['token']
        cookies['admin'] = response.cookies.get('safar_token')
        
        client.close()
        
        print_pass("Admin user created successfully")
        print_pass(f"Admin ID: {admin_id}")
        
    except Exception as e:
        print_fail(f"Admin creation failed: {e}")

def test_admin_access():
    """Test 9: Admin can access GET /api/users endpoint"""
    print_test("9. ADMIN ACCESS TEST")
    
    url = f"{API_BASE}/users"
    headers = {'Authorization': f"Bearer {tokens['admin']}"}
    
    response = requests.get(url, headers=headers)
    
    print_info(f"GET {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print_fail(f"Expected 200, got {response.status_code}: {response.text}")
    
    data = response.json()
    
    if not data.get('ok'):
        print_fail("Response should have ok: true")
    
    if 'users' not in data:
        print_fail("Response should have 'users' field")
    
    users = data['users']
    
    if not isinstance(users, list):
        print_fail("Users should be a list")
    
    print_pass("Admin can access /api/users endpoint")
    print_pass(f"Found {len(users)} users in database")

def test_traveler_cannot_access_admin():
    """Test 10: Traveler cannot access admin endpoint"""
    print_test("10. TRAVELER ACCESS RESTRICTION TEST")
    
    url = f"{API_BASE}/users"
    headers = {'Authorization': f"Bearer {tokens['traveler']}"}
    
    response = requests.get(url, headers=headers)
    
    print_info(f"GET {url}")
    print_info(f"Status: {response.status_code}")
    
    if response.status_code != 403:
        print_fail(f"Expected 403, got {response.status_code}")
    
    data = response.json()
    
    if data.get('ok') != False:
        print_fail("Response should have ok: false")
    
    print_pass("Traveler correctly blocked from admin endpoint (403)")

def save_test_credentials():
    """Save test credentials to /app/memory/test_credentials.md"""
    print_test("11. SAVE TEST CREDENTIALS")
    
    credentials_content = f"""# Safar Test Credentials

## Traveler Account
Email: {TEST_TRAVELER['email']}
Password: {TEST_TRAVELER['password']}
Role: traveler
Token: {tokens.get('traveler', 'N/A')}

## Host Account  
Email: {TEST_HOST['email']}
Password: {TEST_HOST['password']}
Role: host
Token: {tokens.get('host', 'N/A')}

## Admin Account
Email: {TEST_ADMIN['email']}
Password: {TEST_ADMIN['password']}
Role: admin
Token: {tokens.get('admin', 'N/A')}

---
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Base URL: {BASE_URL}
"""
    
    try:
        with open('/app/memory/test_credentials.md', 'w') as f:
            f.write(credentials_content)
        
        print_pass("Test credentials saved to /app/memory/test_credentials.md")
        print_info(f"Traveler: {TEST_TRAVELER['email']}")
        print_info(f"Host: {TEST_HOST['email']}")
        print_info(f"Admin: {TEST_ADMIN['email']}")
        
    except Exception as e:
        print_fail(f"Failed to save credentials: {e}")

def verify_mongodb_persistence():
    """Test 12: Verify users are stored correctly in MongoDB"""
    print_test("12. MONGODB PERSISTENCE VERIFICATION")
    
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        users = db['users']
        
        # Check traveler
        traveler = users.find_one({'email': TEST_TRAVELER['email'].lower()})
        if not traveler:
            print_fail("Traveler not found in database")
        
        # Verify password is hashed
        if not traveler['passwordHash'].startswith('$2'):
            print_fail("Password should be bcrypt hashed (start with $2)")
        
        # Verify no plain password field
        if 'password' in traveler:
            print_fail("Plain password should not be stored")
        
        # Verify UUID format
        if len(traveler['id']) != 36:
            print_fail(f"ID should be UUID format (36 chars), got {len(traveler['id'])}")
        
        print_pass("Users stored correctly in MongoDB")
        print_pass(f"Password hashed: {traveler['passwordHash'][:20]}...")
        print_pass(f"User ID format: UUID ({traveler['id']})")
        
        client.close()
        
    except Exception as e:
        print_fail(f"MongoDB verification failed: {e}")

def main():
    print("\n" + "="*80)
    print("SAFAR AUTH API BACKEND TEST SUITE")
    print("="*80)
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"API Base: {API_BASE}")
    print_info(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    
    # Cleanup old test data
    print_test("CLEANUP")
    cleanup_test_data()
    
    try:
        # Run all tests
        test_traveler_registration()
        test_host_registration()
        test_login()
        test_failed_login()
        test_auth_me_with_cookie()
        test_auth_me_with_bearer()
        test_auth_me_no_auth()
        test_admin_creation()
        test_admin_access()
        test_traveler_cannot_access_admin()
        save_test_credentials()
        verify_mongodb_persistence()
        
        # Summary
        print("\n" + "="*80)
        print("✅ ALL AUTH TESTS PASSED (12/12)")
        print("="*80)
        print_pass("Registration: Traveler and Host accounts created")
        print_pass("Login: Valid credentials work, invalid credentials rejected")
        print_pass("Auth Me: Cookie and Bearer token authentication working")
        print_pass("Admin: Admin user created and can access protected endpoints")
        print_pass("Authorization: Role-based access control working")
        print_pass("MongoDB: Users stored with bcrypt-hashed passwords")
        print_pass("Credentials: Saved to /app/memory/test_credentials.md")
        print("\n")
        
    except Exception as e:
        print_fail(f"Test suite failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
