#!/usr/bin/env python3
"""
Module 18 — Enterprise CMS & Website Builder Backend Test
Tests all CMS endpoints with super_admin authentication
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://app-ownership-patch.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Super Admin credentials
SUPER_ADMIN_EMAIL = "founder@safarcurated.com"
SUPER_ADMIN_PASSWORD = "SuperAdmin@2025"

# Test state
token = None
created_home_page_id = None
created_home_page_id_2 = None
created_page_id = None
created_media_id = None
created_navigation_id = None
created_global_id = None
original_site_state = None

# Test results
tests_passed = 0
tests_failed = 0
test_results = []

def log_test(name, passed, message=""):
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status}: {name}"
    if message:
        result += f" - {message}"
    print(result)
    test_results.append({"name": name, "passed": passed, "message": message})
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1

def login_super_admin():
    """Login as super admin and get token"""
    global token
    print("\n=== LOGGING IN AS SUPER ADMIN ===")
    try:
        res = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD},
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            token = data.get("token")
            user = data.get("user", {})
            print(f"✅ Logged in as {user.get('name')} (role: {user.get('role')})")
            return True
        else:
            print(f"❌ Login failed: {res.status_code} - {res.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

def headers():
    """Return auth headers"""
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ============================================================================
# A) AUTH GUARD TESTS (super_admin only)
# ============================================================================

def test_auth_guard():
    """Test 1-3: Auth guard for CMS endpoints"""
    print("\n=== A) AUTH GUARD TESTS ===")
    
    # Test 1: No auth → 401
    try:
        res = requests.get(f"{API_BASE}/cms/templates", timeout=10)
        log_test("A1: GET /cms/templates without auth → 401", res.status_code == 401)
    except Exception as e:
        log_test("A1: GET /cms/templates without auth → 401", False, str(e))
    
    # Test 2: Fresh traveler → 403
    # Register a new traveler with unique timestamp email
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    traveler_email = f"traveler-{timestamp}@test.com"
    try:
        reg_res = requests.post(
            f"{API_BASE}/auth/register",
            json={
                "name": "Test Traveler",
                "email": traveler_email,
                "password": "password123",
                "role": "traveler"
            },
            timeout=10
        )
        if reg_res.status_code == 200:
            traveler_token = reg_res.json().get("token")
            traveler_headers = {"Authorization": f"Bearer {traveler_token}"}
            res = requests.get(f"{API_BASE}/cms/templates", headers=traveler_headers, timeout=10)
            log_test("A2: GET /cms/templates as traveler → 403", res.status_code == 403)
        else:
            log_test("A2: GET /cms/templates as traveler → 403", False, f"Traveler registration failed: {reg_res.status_code}")
    except Exception as e:
        log_test("A2: GET /cms/templates as traveler → 403", False, str(e))
    
    # Test 3: Super admin → 200, 8 templates
    try:
        res = requests.get(f"{API_BASE}/cms/templates", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            templates = data.get("templates", [])
            has_8_templates = len(templates) == 8
            all_have_keys = all("key" in t and "name" in t and "description" in t for t in templates)
            log_test(
                "A3: GET /cms/templates as super_admin → 200, 8 templates with key/name/description",
                has_8_templates and all_have_keys,
                f"Found {len(templates)} templates, all have required fields: {all_have_keys}"
            )
        else:
            log_test("A3: GET /cms/templates as super_admin → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("A3: GET /cms/templates as super_admin → 200", False, str(e))

# ============================================================================
# B) HOME PAGES CRUD + template flow
# ============================================================================

def test_home_pages_crud():
    """Test 4-10: Home pages CRUD operations"""
    global created_home_page_id, created_home_page_id_2, original_site_state
    print("\n=== B) HOME PAGES CRUD + TEMPLATE FLOW ===")
    
    # Test 4: Create home page from template
    try:
        res = requests.post(
            f"{API_BASE}/cms/home-pages",
            headers=headers(),
            json={"name": "Test HP", "templateKey": "safar-signature"},
            timeout=10
        )
        if res.status_code == 201:
            data = res.json()
            home_page = data.get("homePage", {})
            created_home_page_id = home_page.get("id")
            sections_count = len(home_page.get("sections", []))
            status = home_page.get("status")
            is_active = home_page.get("isActive")
            log_test(
                "B4: POST /cms/home-pages with template → 201, sections >= 8, status=draft, isActive=false",
                sections_count >= 8 and status == "draft" and is_active == False,
                f"sections: {sections_count}, status: {status}, isActive: {is_active}"
            )
        else:
            log_test("B4: POST /cms/home-pages with template → 201", False, f"Status: {res.status_code}, Body: {res.text}")
    except Exception as e:
        log_test("B4: POST /cms/home-pages with template → 201", False, str(e))
    
    # Test 5: Create without name → 400
    try:
        res = requests.post(
            f"{API_BASE}/cms/home-pages",
            headers=headers(),
            json={},
            timeout=10
        )
        log_test("B5: POST /cms/home-pages without name → 400", res.status_code == 400)
    except Exception as e:
        log_test("B5: POST /cms/home-pages without name → 400", False, str(e))
    
    # Test 6: List home pages
    try:
        res = requests.get(f"{API_BASE}/cms/home-pages", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            home_pages = data.get("homePages", [])
            includes_created = any(hp.get("id") == created_home_page_id for hp in home_pages)
            log_test("B6: GET /cms/home-pages includes created id", includes_created, f"Found {len(home_pages)} home pages")
        else:
            log_test("B6: GET /cms/home-pages includes created id", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("B6: GET /cms/home-pages includes created id", False, str(e))
    
    # Test 7: Get single home page
    try:
        res = requests.get(f"{API_BASE}/cms/home-pages/{created_home_page_id}", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            home_page = data.get("homePage", {})
            has_sections = len(home_page.get("sections", [])) > 0
            log_test("B7: GET /cms/home-pages/:id returns doc with sections", has_sections)
        else:
            log_test("B7: GET /cms/home-pages/:id returns doc with sections", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("B7: GET /cms/home-pages/:id returns doc with sections", False, str(e))
    
    # Test 8: Update home page sections
    try:
        res = requests.put(
            f"{API_BASE}/cms/home-pages/{created_home_page_id}",
            headers=headers(),
            json={"sections": [{"id": "x", "type": "hero", "hidden": False, "props": {"title": "Updated"}}]},
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            home_page = data.get("homePage", {})
            sections_count = len(home_page.get("sections", []))
            log_test("B8: PUT /cms/home-pages/:id updates sections → 200, sections length == 1", sections_count == 1)
        else:
            log_test("B8: PUT /cms/home-pages/:id updates sections → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("B8: PUT /cms/home-pages/:id updates sections → 200", False, str(e))
    
    # Test 9: Duplicate home page
    try:
        res = requests.post(
            f"{API_BASE}/cms/home-pages/{created_home_page_id}/duplicate",
            headers=headers(),
            timeout=10
        )
        if res.status_code == 201:
            data = res.json()
            duplicated = data.get("homePage", {})
            created_home_page_id_2 = duplicated.get("id")
            is_different_id = created_home_page_id_2 != created_home_page_id
            is_inactive = duplicated.get("isActive") == False
            name_has_copy = "(Copy)" in duplicated.get("name", "")
            log_test(
                "B9: POST /cms/home-pages/:id/duplicate → 201, new id, isActive=false, name ends with (Copy)",
                is_different_id and is_inactive and name_has_copy,
                f"New id: {created_home_page_id_2}, isActive: {is_inactive}, name: {duplicated.get('name')}"
            )
        else:
            log_test("B9: POST /cms/home-pages/:id/duplicate → 201", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("B9: POST /cms/home-pages/:id/duplicate → 201", False, str(e))
    
    # Test 10: Publish then try to delete (should fail)
    try:
        # First publish
        pub_res = requests.post(
            f"{API_BASE}/cms/home-pages/{created_home_page_id}/publish",
            headers=headers(),
            timeout=10
        )
        if pub_res.status_code == 200:
            pub_data = pub_res.json()
            is_active = pub_data.get("homePage", {}).get("isActive")
            # Now try to delete
            del_res = requests.delete(
                f"{API_BASE}/cms/home-pages/{created_home_page_id}",
                headers=headers(),
                timeout=10
            )
            log_test(
                "B10: Publish then DELETE active home page → 400 (blocked)",
                is_active == True and del_res.status_code == 400,
                f"Publish isActive: {is_active}, Delete status: {del_res.status_code}"
            )
        else:
            log_test("B10: Publish then DELETE active home page → 400", False, f"Publish failed: {pub_res.status_code}")
    except Exception as e:
        log_test("B10: Publish then DELETE active home page → 400", False, str(e))

# ============================================================================
# C) PUBLISH FLOW
# ============================================================================

def test_publish_flow():
    """Test 11-15: Publish flow and public site endpoint"""
    global original_site_state
    print("\n=== C) PUBLISH FLOW ===")
    
    # Test 11: Get current public site state
    try:
        res = requests.get(f"{API_BASE}/public/site", timeout=10)
        if res.status_code == 200:
            data = res.json()
            original_site_state = data.get("home")
            log_test(
                "C11: GET /public/site (no auth) → 200, observe current state",
                True,
                f"Current home: {'null' if original_site_state is None else 'exists'}"
            )
        else:
            log_test("C11: GET /public/site (no auth) → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("C11: GET /public/site (no auth) → 200", False, str(e))
    
    # Test 12: Publish home page (already published in B10)
    try:
        res = requests.get(f"{API_BASE}/cms/home-pages/{created_home_page_id}", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            home_page = data.get("homePage", {})
            is_active = home_page.get("isActive")
            status = home_page.get("status")
            log_test(
                "C12: Published home page has isActive=true, status=published",
                is_active == True and status == "published",
                f"isActive: {is_active}, status: {status}"
            )
        else:
            log_test("C12: Published home page has isActive=true", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("C12: Published home page has isActive=true", False, str(e))
    
    # Test 13: Public site returns published home page
    try:
        res = requests.get(f"{API_BASE}/public/site", timeout=10)
        if res.status_code == 200:
            data = res.json()
            home = data.get("home")
            if home:
                home_id = home.get("id")
                sections = home.get("sections", [])
                log_test(
                    "C13: GET /public/site returns published home page with matching id and sections",
                    home_id == created_home_page_id and len(sections) > 0,
                    f"home.id: {home_id}, sections: {len(sections)}"
                )
            else:
                log_test("C13: GET /public/site returns published home page", False, "home is null")
        else:
            log_test("C13: GET /public/site returns published home page", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("C13: GET /public/site returns published home page", False, str(e))
    
    # Test 14: Publish second home page (only one active at a time)
    try:
        # First create another home page from template
        create_res = requests.post(
            f"{API_BASE}/cms/home-pages",
            headers=headers(),
            json={"name": "Test HP 2", "templateKey": "minimal-modern"},
            timeout=10
        )
        if create_res.status_code == 201:
            hp2_id = create_res.json().get("homePage", {}).get("id")
            # Publish it
            pub_res = requests.post(
                f"{API_BASE}/cms/home-pages/{hp2_id}/publish",
                headers=headers(),
                timeout=10
            )
            if pub_res.status_code == 200:
                # Check first home page is now inactive
                check_res = requests.get(f"{API_BASE}/cms/home-pages/{created_home_page_id}", headers=headers(), timeout=10)
                if check_res.status_code == 200:
                    first_hp = check_res.json().get("homePage", {})
                    is_inactive = first_hp.get("isActive") == False
                    log_test(
                        "C14: Publish second home page → first becomes isActive=false (only one active)",
                        is_inactive,
                        f"First home page isActive: {first_hp.get('isActive')}"
                    )
                    # Store second id for unpublish test
                    global created_home_page_id_2
                    created_home_page_id_2 = hp2_id
                else:
                    log_test("C14: Publish second home page → first becomes inactive", False, f"Check failed: {check_res.status_code}")
            else:
                log_test("C14: Publish second home page → first becomes inactive", False, f"Publish failed: {pub_res.status_code}")
        else:
            log_test("C14: Publish second home page → first becomes inactive", False, f"Create failed: {create_res.status_code}")
    except Exception as e:
        log_test("C14: Publish second home page → first becomes inactive", False, str(e))
    
    # Test 15: Unpublish second home page
    try:
        res = requests.post(
            f"{API_BASE}/cms/home-pages/{created_home_page_id_2}/unpublish",
            headers=headers(),
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            home_page = data.get("homePage", {})
            is_inactive = home_page.get("isActive") == False
            status = home_page.get("status")
            log_test(
                "C15: POST /cms/home-pages/:id/unpublish → 200, isActive=false, status=draft",
                is_inactive and status == "draft",
                f"isActive: {is_inactive}, status: {status}"
            )
        else:
            log_test("C15: POST /cms/home-pages/:id/unpublish → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("C15: POST /cms/home-pages/:id/unpublish → 200", False, str(e))

# ============================================================================
# D) PAGES
# ============================================================================

def test_pages():
    """Test 16-20: CMS Pages CRUD and publish"""
    global created_page_id
    print("\n=== D) PAGES ===")
    
    # Test 16: Create page
    try:
        res = requests.post(
            f"{API_BASE}/cms/pages",
            headers=headers(),
            json={"title": "About Us", "slug": "about-us"},
            timeout=10
        )
        if res.status_code == 201:
            data = res.json()
            page = data.get("page", {})
            created_page_id = page.get("id")
            status = page.get("status")
            log_test(
                "D16: POST /cms/pages → 201, status=draft",
                status == "draft",
                f"Page id: {created_page_id}, status: {status}"
            )
        else:
            log_test("D16: POST /cms/pages → 201", False, f"Status: {res.status_code}, Body: {res.text}")
    except Exception as e:
        log_test("D16: POST /cms/pages → 201", False, str(e))
    
    # Test 17: Duplicate slug → 409
    try:
        res = requests.post(
            f"{API_BASE}/cms/pages",
            headers=headers(),
            json={"title": "About Us 2", "slug": "about-us"},
            timeout=10
        )
        log_test("D17: POST /cms/pages with duplicate slug → 409", res.status_code == 409)
    except Exception as e:
        log_test("D17: POST /cms/pages with duplicate slug → 409", False, str(e))
    
    # Test 18: Update page
    try:
        res = requests.put(
            f"{API_BASE}/cms/pages/{created_page_id}",
            headers=headers(),
            json={
                "sections": [{"id": "h", "type": "hero", "props": {"title": "Hi"}}],
                "seo": {"title": "About", "description": "d"}
            },
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            page = data.get("page", {})
            sections = page.get("sections", [])
            seo = page.get("seo", {})
            log_test(
                "D18: PUT /cms/pages/:id updates sections and seo → 200",
                len(sections) == 1 and seo.get("title") == "About",
                f"sections: {len(sections)}, seo.title: {seo.get('title')}"
            )
        else:
            log_test("D18: PUT /cms/pages/:id updates sections and seo → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("D18: PUT /cms/pages/:id updates sections and seo → 200", False, str(e))
    
    # Test 19: Publish page
    try:
        res = requests.post(
            f"{API_BASE}/cms/pages/{created_page_id}/publish",
            headers=headers(),
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            page = data.get("page", {})
            status = page.get("status")
            log_test("D19: POST /cms/pages/:id/publish → 200, status=published", status == "published")
        else:
            log_test("D19: POST /cms/pages/:id/publish → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("D19: POST /cms/pages/:id/publish → 200", False, str(e))
    
    # Test 20: Public page endpoints
    try:
        # Get published page
        res = requests.get(f"{API_BASE}/public/page/about-us", timeout=10)
        success_200 = res.status_code == 200
        
        # Get non-existent page
        res_404 = requests.get(f"{API_BASE}/public/page/does-not-exist", timeout=10)
        success_404 = res_404.status_code == 404
        
        log_test(
            "D20: GET /public/page/about-us → 200, /public/page/does-not-exist → 404",
            success_200 and success_404,
            f"about-us: {res.status_code}, does-not-exist: {res_404.status_code}"
        )
    except Exception as e:
        log_test("D20: GET /public/page/:slug endpoints", False, str(e))

# ============================================================================
# E) HEADER / FOOTER / THEME / MEDIA / NAVIGATION / GLOBAL
# ============================================================================

def test_singletons_and_collections():
    """Test 21-27: Header, Footer, Theme, Media, Navigation, Global"""
    global created_media_id, created_navigation_id, created_global_id
    print("\n=== E) HEADER / FOOTER / THEME / MEDIA / NAVIGATION / GLOBAL ===")
    
    # Test 21: Get header (auto-seed)
    try:
        res = requests.get(f"{API_BASE}/cms/header", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            header = data.get("header", {})
            has_logo = "logo" in header
            has_nav = "nav" in header and isinstance(header["nav"], list)
            has_settings = "settings" in header
            log_test(
                "E21: GET /cms/header → 200 with logo, nav array, settings",
                has_logo and has_nav and has_settings,
                f"logo: {has_logo}, nav: {has_nav}, settings: {has_settings}"
            )
        else:
            log_test("E21: GET /cms/header → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("E21: GET /cms/header → 200", False, str(e))
    
    # Test 22: Update header
    try:
        res = requests.put(
            f"{API_BASE}/cms/header",
            headers=headers(),
            json={"nav": [{"label": "Test", "href": "/test"}]},
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            header = data.get("header", {})
            nav = header.get("nav", [])
            has_test_link = any(item.get("label") == "Test" for item in nav)
            log_test(
                "E22: PUT /cms/header updates nav → 200",
                has_test_link,
                f"nav length: {len(nav)}, has Test link: {has_test_link}"
            )
        else:
            log_test("E22: PUT /cms/header updates nav → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("E22: PUT /cms/header updates nav → 200", False, str(e))
    
    # Test 23: Get footer (auto-seed)
    try:
        res = requests.get(f"{API_BASE}/cms/footer", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            footer = data.get("footer", {})
            has_columns = "columns" in footer and isinstance(footer["columns"], list)
            log_test("E23: GET /cms/footer → 200 with columns array", has_columns)
        else:
            log_test("E23: GET /cms/footer → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("E23: GET /cms/footer → 200", False, str(e))
    
    # Test 24: Get theme (auto-seed)
    try:
        res = requests.get(f"{API_BASE}/cms/theme", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            theme = data.get("theme", {})
            has_colors = "colors" in theme
            has_primary = theme.get("colors", {}).get("primary") is not None
            log_test(
                "E24: GET /cms/theme → 200 with colors.primary",
                has_colors and has_primary,
                f"colors: {has_colors}, primary: {has_primary}"
            )
        else:
            log_test("E24: GET /cms/theme → 200", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("E24: GET /cms/theme → 200", False, str(e))
    
    # Test 25: Media CRUD
    try:
        # Create media
        create_res = requests.post(
            f"{API_BASE}/cms/media",
            headers=headers(),
            json={"url": "https://example.com/a.jpg", "name": "a.jpg", "alt": "test", "type": "image"},
            timeout=10
        )
        if create_res.status_code == 201:
            created_media_id = create_res.json().get("media", {}).get("id")
            
            # List media
            list_res = requests.get(f"{API_BASE}/cms/media", headers=headers(), timeout=10)
            if list_res.status_code == 200:
                media_list = list_res.json().get("media", [])
                contains_created = any(m.get("id") == created_media_id for m in media_list)
                
                # Delete media
                del_res = requests.delete(f"{API_BASE}/cms/media/{created_media_id}", headers=headers(), timeout=10)
                deleted = del_res.status_code == 200 and del_res.json().get("deleted") == True
                
                log_test(
                    "E25: POST /cms/media → 201, GET /cms/media contains it, DELETE → 200 deleted=true",
                    contains_created and deleted,
                    f"Created: {created_media_id}, Listed: {contains_created}, Deleted: {deleted}"
                )
            else:
                log_test("E25: Media CRUD", False, f"List failed: {list_res.status_code}")
        else:
            log_test("E25: Media CRUD", False, f"Create failed: {create_res.status_code}")
    except Exception as e:
        log_test("E25: Media CRUD", False, str(e))
    
    # Test 26: Navigation CRUD
    try:
        # Create navigation
        create_res = requests.post(
            f"{API_BASE}/cms/navigation",
            headers=headers(),
            json={"name": "test-menu", "items": [{"label": "A", "href": "/a"}]},
            timeout=10
        )
        if create_res.status_code == 201:
            created_navigation_id = create_res.json().get("navigation", {}).get("id")
            
            # Get public navigation
            pub_res = requests.get(f"{API_BASE}/public/navigation/test-menu", timeout=10)
            if pub_res.status_code == 200:
                nav_data = pub_res.json().get("navigation", {})
                has_items = nav_data and len(nav_data.get("items", [])) > 0
            else:
                has_items = False
            
            # Delete navigation
            del_res = requests.delete(f"{API_BASE}/cms/navigation/{created_navigation_id}", headers=headers(), timeout=10)
            deleted = del_res.status_code == 200
            
            log_test(
                "E26: POST /cms/navigation → 201, GET /public/navigation/:name → 200 with items, DELETE → 200",
                has_items and deleted,
                f"Created: {created_navigation_id}, Public has items: {has_items}, Deleted: {deleted}"
            )
        else:
            log_test("E26: Navigation CRUD", False, f"Create failed: {create_res.status_code}")
    except Exception as e:
        log_test("E26: Navigation CRUD", False, str(e))
    
    # Test 27: Global CRUD
    try:
        # Create global
        create_res = requests.post(
            f"{API_BASE}/cms/global",
            headers=headers(),
            json={"key": "top-banner", "name": "Top Banner", "kind": "banner", "data": {"text": "Hi"}},
            timeout=10
        )
        if create_res.status_code == 201:
            created_global_id = create_res.json().get("component", {}).get("id")
            
            # Delete global
            del_res = requests.delete(f"{API_BASE}/cms/global/{created_global_id}", headers=headers(), timeout=10)
            deleted = del_res.status_code == 200
            
            log_test(
                "E27: POST /cms/global → 201, DELETE → 200",
                deleted,
                f"Created: {created_global_id}, Deleted: {deleted}"
            )
        else:
            log_test("E27: Global CRUD", False, f"Create failed: {create_res.status_code}")
    except Exception as e:
        log_test("E27: Global CRUD", False, str(e))

# ============================================================================
# F) VERSIONS / RESTORE
# ============================================================================

def test_versions():
    """Test 28-29: Versions and restore"""
    print("\n=== F) VERSIONS / RESTORE ===")
    
    # Test 28: Get versions (should be non-empty from our CRUD above)
    try:
        res = requests.get(f"{API_BASE}/cms/versions", headers=headers(), timeout=10)
        if res.status_code == 200:
            data = res.json()
            versions = data.get("versions", [])
            is_non_empty = len(versions) > 0
            log_test(
                "F28: GET /cms/versions → non-empty (entries created by CRUD)",
                is_non_empty,
                f"Found {len(versions)} versions"
            )
        else:
            log_test("F28: GET /cms/versions → non-empty", False, f"Status: {res.status_code}")
    except Exception as e:
        log_test("F28: GET /cms/versions → non-empty", False, str(e))
    
    # Test 29: Restore a version
    try:
        # Get versions and find one with entity=home_page
        list_res = requests.get(f"{API_BASE}/cms/versions", headers=headers(), timeout=10)
        if list_res.status_code == 200:
            versions = list_res.json().get("versions", [])
            home_page_version = next((v for v in versions if v.get("entity") == "home_page"), None)
            
            if home_page_version:
                version_id = home_page_version.get("id")
                restore_res = requests.post(
                    f"{API_BASE}/cms/versions/{version_id}/restore",
                    headers=headers(),
                    timeout=10
                )
                if restore_res.status_code == 200:
                    restored = restore_res.json().get("restored") == True
                    log_test(
                        "F29: POST /cms/versions/:id/restore → 200, restored=true",
                        restored,
                        f"Version id: {version_id}, restored: {restored}"
                    )
                else:
                    log_test("F29: POST /cms/versions/:id/restore → 200", False, f"Status: {restore_res.status_code}")
            else:
                log_test("F29: POST /cms/versions/:id/restore → 200", False, "No home_page version found")
        else:
            log_test("F29: POST /cms/versions/:id/restore → 200", False, f"List failed: {list_res.status_code}")
    except Exception as e:
        log_test("F29: POST /cms/versions/:id/restore → 200", False, str(e))

# ============================================================================
# G) CLEANUP
# ============================================================================

def test_cleanup():
    """Test 30-31: Cleanup - unpublish and delete created resources"""
    print("\n=== G) CLEANUP ===")
    
    # Test 30: Unpublish and delete all created home pages
    try:
        # Get all home pages
        list_res = requests.get(f"{API_BASE}/cms/home-pages", headers=headers(), timeout=10)
        if list_res.status_code == 200:
            home_pages = list_res.json().get("homePages", [])
            cleanup_success = True
            
            for hp in home_pages:
                hp_id = hp.get("id")
                is_active = hp.get("isActive")
                
                # Unpublish if active
                if is_active:
                    unpub_res = requests.post(
                        f"{API_BASE}/cms/home-pages/{hp_id}/unpublish",
                        headers=headers(),
                        timeout=10
                    )
                    if unpub_res.status_code != 200:
                        cleanup_success = False
                        print(f"  ⚠ Failed to unpublish {hp_id}: {unpub_res.status_code}")
                
                # Delete
                del_res = requests.delete(
                    f"{API_BASE}/cms/home-pages/{hp_id}",
                    headers=headers(),
                    timeout=10
                )
                if del_res.status_code != 200:
                    cleanup_success = False
                    print(f"  ⚠ Failed to delete {hp_id}: {del_res.status_code}")
            
            # Verify public site returns to original state
            site_res = requests.get(f"{API_BASE}/public/site", timeout=10)
            if site_res.status_code == 200:
                current_home = site_res.json().get("home")
                is_null = current_home is None
                log_test(
                    "G30: Unpublish and delete all home pages, public site.home returns to null",
                    cleanup_success and is_null,
                    f"Cleanup success: {cleanup_success}, home is null: {is_null}"
                )
            else:
                log_test("G30: Cleanup home pages", False, f"Site check failed: {site_res.status_code}")
        else:
            log_test("G30: Cleanup home pages", False, f"List failed: {list_res.status_code}")
    except Exception as e:
        log_test("G30: Cleanup home pages", False, str(e))
    
    # Test 31: Delete created page
    try:
        if created_page_id:
            del_res = requests.delete(
                f"{API_BASE}/cms/pages/{created_page_id}",
                headers=headers(),
                timeout=10
            )
            log_test("G31: DELETE created page → 200", del_res.status_code == 200)
        else:
            log_test("G31: DELETE created page → 200", False, "No page id to delete")
    except Exception as e:
        log_test("G31: DELETE created page → 200", False, str(e))

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    print("=" * 80)
    print("MODULE 18 — ENTERPRISE CMS & WEBSITE BUILDER BACKEND TEST")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Super Admin: {SUPER_ADMIN_EMAIL}")
    print("=" * 80)
    
    # Login
    if not login_super_admin():
        print("\n❌ FATAL: Could not login as super admin. Aborting tests.")
        sys.exit(1)
    
    # Run all test suites
    test_auth_guard()
    test_home_pages_crud()
    test_publish_flow()
    test_pages()
    test_singletons_and_collections()
    test_versions()
    test_cleanup()
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"✅ PASSED: {tests_passed}")
    print(f"❌ FAILED: {tests_failed}")
    print(f"📊 TOTAL:  {tests_passed + tests_failed}")
    print(f"📈 SUCCESS RATE: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
    print("=" * 80)
    
    # Print failed tests details
    if tests_failed > 0:
        print("\n❌ FAILED TESTS:")
        for result in test_results:
            if not result["passed"]:
                print(f"  - {result['name']}")
                if result["message"]:
                    print(f"    {result['message']}")
    
    # Exit with appropriate code
    sys.exit(0 if tests_failed == 0 else 1)

if __name__ == "__main__":
    main()
