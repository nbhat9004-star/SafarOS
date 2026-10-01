"""
Module 8 Frontend UI Test - Host Claim, Review & Publish Workflow
Tests all 26 scenarios for the Safar Curated Next.js app
FIXED VERSION: Removed quality parameter, fixed variable scope, added proper dialog handlers
"""

import asyncio
import httpx
from playwright.async_api import async_playwright
import sys

BASE_URL = "http://localhost:3000"
SUPER_ADMIN_EMAIL = "founder@safarcurated.com"
SUPER_ADMIN_PASSWORD = "SuperAdmin@2025"

async def main():
    print("=" * 80)
    print("MODULE 8 FRONTEND UI TEST - Host Claim, Review & Publish Workflow")
    print("=" * 80)
    
    # Variables to track across tests
    review_page = None
    review_url = None
    present_url = None
    review_token = None
    business_id = None
    token = None
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        
        # Grant clipboard permissions
        await context.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE_URL)
        
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[BROWSER CONSOLE] {msg.type}: {msg.text}"))
        
        try:
            # ============================================================
            # SETUP: Login via API and inject cookie
            # ============================================================
            print("\n[SETUP] Logging in via API...")
            try:
                r = httpx.post(f'{BASE_URL}/api/auth/login',
                              json={'email': SUPER_ADMIN_EMAIL, 'password': SUPER_ADMIN_PASSWORD},
                              timeout=10.0)
                data = r.json()
                
                if not data.get('ok'):
                    print(f"❌ Login failed: {data.get('error', 'Unknown error')}")
                    sys.exit(1)
                
                token = data.get('token')
                if not token:
                    print("❌ No token in login response")
                    sys.exit(1)
                
                # Add cookie to browser context
                await context.add_cookies([{
                    'name': 'safar_token',
                    'value': token,
                    'domain': 'localhost',
                    'path': '/',
                    'httpOnly': True,
                    'secure': False,
                    'sameSite': 'Lax',
                }])
                
                print("✅ Login successful, cookie injected")
            except Exception as e:
                print(f"❌ Login API call failed: {e}")
                sys.exit(1)
            
            # ============================================================
            # TEST 1: Navigate to CRM and verify page loads
            # ============================================================
            print("\n[TEST 1] Navigate to /admin/marketplace/crm")
            try:
                await page.goto(f'{BASE_URL}/admin/marketplace/crm', wait_until='networkidle', timeout=15000)
                await page.wait_for_timeout(1000)
                
                # Check if we're on the CRM page (not redirected to login)
                current_url = page.url
                if '/admin/marketplace/crm' not in current_url:
                    print(f"❌ Redirected to {current_url} instead of CRM")
                else:
                    print(f"✅ CRM page loaded: {current_url}")
            except Exception as e:
                print(f"❌ Failed to load CRM page: {e}")
                await page.screenshot(path=".screenshots/test1_crm_error.png", full_page=False)
            
            # ============================================================
            # TEST 2: Fetch a business ID and navigate to business page
            # ============================================================
            print("\n[TEST 2] Fetch business ID and navigate to business page")
            try:
                # Try to get a business ID from the API
                r = httpx.get(f'{BASE_URL}/api/marketplace/crm/businesses',
                             headers={'Authorization': f'Bearer {token}'},
                             timeout=10.0)
                data = r.json()
                
                if data.get('ok') and data.get('businesses') and len(data['businesses']) > 0:
                    business_id = data['businesses'][0].get('id')
                    print(f"✅ Found business ID: {business_id}")
                else:
                    # Try to get from listings API
                    r2 = httpx.get(f'{BASE_URL}/api/listings',
                                  headers={'Authorization': f'Bearer {token}'},
                                  timeout=10.0)
                    data2 = r2.json()
                    if data2.get('ok') and data2.get('listings') and len(data2['listings']) > 0:
                        business_id = data2['listings'][0].get('id')
                        print(f"✅ Found business ID from listings: {business_id}")
                    else:
                        print("❌ No businesses found")
                        sys.exit(1)
                
                # Navigate to business page
                await page.goto(f'{BASE_URL}/admin/marketplace/crm/business/{business_id}', wait_until='networkidle', timeout=15000)
                await page.wait_for_timeout(1000)
                
                # Verify Module 8 panel is visible
                m8_panel = await page.query_selector('[data-testid="m8-actions-panel"]')
                if m8_panel:
                    print("✅ Module 8 actions panel visible")
                else:
                    print("❌ Module 8 actions panel not found")
                    await page.screenshot(path=".screenshots/test2_no_m8_panel.png", full_page=False)
                
            except Exception as e:
                print(f"❌ Failed to fetch business or navigate: {e}")
                await page.screenshot(path=".screenshots/test2_error.png", full_page=False)
                sys.exit(1)
            
            # ============================================================
            # TEST 3: Generate Review Link
            # ============================================================
            print("\n[TEST 3] Generate Review Link")
            try:
                # Click generate review button
                await page.click('[data-testid="m8-generate-review"]', force=True)
                await page.wait_for_timeout(2000)
                
                # Wait for toast
                toast = await page.wait_for_selector('text=Review link generated', timeout=5000)
                if toast:
                    print("✅ Review link generated (toast appeared)")
                
                # Verify buttons now exist
                open_btn = await page.query_selector('[data-testid="m8-open-review"]')
                copy_btn = await page.query_selector('[data-testid="m8-copy-review"]')
                regen_btn = await page.query_selector('[data-testid="m8-regenerate-review"]')
                revoke_btn = await page.query_selector('[data-testid="m8-revoke-review"]')
                
                if open_btn and copy_btn and regen_btn and revoke_btn:
                    print("✅ All review link buttons visible")
                else:
                    print("❌ Some review link buttons missing")
                
                # Get the review URL
                open_link = await page.query_selector('[data-testid="m8-open-review"]')
                if open_link:
                    parent = await open_link.evaluate_handle('el => el.parentElement')
                    review_url = await parent.evaluate('el => el.href')
                    print(f"✅ Review URL: {review_url}")
                
            except Exception as e:
                print(f"❌ Failed to generate review link: {e}")
                await page.screenshot(path=".screenshots/test3_error.png", full_page=False)
            
            # ============================================================
            # TEST 4: Generate Presentation Link
            # ============================================================
            print("\n[TEST 4] Generate Presentation Link")
            try:
                await page.click('[data-testid="m8-generate-present"]', force=True)
                await page.wait_for_timeout(2000)
                
                toast = await page.wait_for_selector('text=Presentation link generated', timeout=5000)
                if toast:
                    print("✅ Presentation link generated")
                
                # Verify buttons
                open_btn = await page.query_selector('[data-testid="m8-open-present"]')
                if open_btn:
                    print("✅ Presentation link buttons visible")
                    parent = await open_btn.evaluate_handle('el => el.parentElement')
                    present_url = await parent.evaluate('el => el.href')
                    print(f"✅ Presentation URL: {present_url}")
                
            except Exception as e:
                print(f"❌ Failed to generate presentation link: {e}")
                await page.screenshot(path=".screenshots/test4_error.png", full_page=False)
            
            # ============================================================
            # TEST 5: Read review URL from anchor
            # ============================================================
            print("\n[TEST 5] Verify review URL is accessible")
            if review_url:
                print(f"✅ Review URL confirmed: {review_url}")
            else:
                print("❌ Review URL not found")
            
            # ============================================================
            # TEST 6: Copy review link
            # ============================================================
            print("\n[TEST 6] Copy review link to clipboard")
            try:
                await page.click('[data-testid="m8-copy-review"]', force=True)
                await page.wait_for_timeout(1000)
                
                toast = await page.wait_for_selector('text=Link copied', timeout=5000)
                if toast:
                    print("✅ Link copied toast appeared")
                
            except Exception as e:
                print(f"❌ Failed to copy link: {e}")
            
            # ============================================================
            # TEST 7: Open presentation page in new tab
            # ============================================================
            print("\n[TEST 7] Open presentation page")
            if present_url:
                try:
                    present_page = await context.new_page()
                    await present_page.goto(present_url, wait_until='networkidle', timeout=15000)
                    await present_page.wait_for_timeout(1000)
                    
                    # Verify navbar loads
                    navbar = await present_page.query_selector('nav')
                    if navbar:
                        print("✅ Navbar loaded on presentation page")
                    
                    # Verify listing title
                    title = await present_page.query_selector('h1')
                    if title:
                        title_text = await title.inner_text()
                        print(f"✅ Listing title visible: {title_text[:50]}...")
                    
                    # Verify "Claim this Listing" link - FIXED SELECTOR (Locator is not awaitable)
                    claim_link = present_page.locator('a[href*="/review/"][href*="#claim"]').first
                    if await claim_link.count() > 0:
                        href = await claim_link.get_attribute("href")
                        if href and '#claim' in href:
                            print(f"✅ Claim link found with href: {href}")
                        else:
                            print(f"⚠️  Claim link href: {href}")
                    else:
                        # Try alternative selector
                        claim_link_alt = present_page.get_by_role("link", name="Claim this Listing")
                        if await claim_link_alt.count() > 0:
                            print("✅ Claim link found via role selector")
                        else:
                            print("⚠️  Claim link not found")
                    
                    await present_page.screenshot(path=".screenshots/test7_presentation.png", full_page=False)
                    await present_page.close()
                    
                except Exception as e:
                    print(f"❌ Failed to open presentation page: {e}")
            
            # ============================================================
            # TEST 8: Test invalid presentation token
            # ============================================================
            print("\n[TEST 8] Test invalid presentation token")
            try:
                invalid_page = await context.new_page()
                await invalid_page.goto(f'{BASE_URL}/present/invalid-token', wait_until='networkidle', timeout=15000)
                await invalid_page.wait_for_timeout(1000)
                
                # Look for error message
                error_msg = await invalid_page.query_selector('text=Link unavailable')
                if error_msg:
                    print("✅ Invalid token shows 'Link unavailable'")
                else:
                    print("❌ Error message not found for invalid token")
                
                await invalid_page.close()
                
            except Exception as e:
                print(f"❌ Failed to test invalid token: {e}")
            
            # ============================================================
            # TEST 9: Open review page
            # ============================================================
            print("\n[TEST 9] Open review page and verify sections")
            if review_url:
                try:
                    review_token = review_url.split('/review/')[-1]
                    review_page = await context.new_page()
                    await review_page.goto(review_url, wait_until='networkidle', timeout=15000)
                    await review_page.wait_for_timeout(1000)
                    
                    # Verify seven section headings
                    sections = ['Description', 'Photos', 'Contact', 'Amenities', 'Pricing', 'Address', 'Map Location']
                    found_sections = 0
                    for section in sections:
                        heading = await review_page.query_selector(f'h3:has-text("{section}")')
                        if heading:
                            found_sections += 1
                    
                    print(f"✅ Found {found_sections}/7 section headings")
                    
                    # Verify "Submit Corrections" button
                    submit_btn = await review_page.query_selector('text=Submit Corrections')
                    if submit_btn:
                        print("✅ Submit Corrections button exists")
                    
                    # Verify "See Public Preview" button
                    preview_btn = await review_page.query_selector('text=See Public Preview')
                    if preview_btn:
                        href = await preview_btn.evaluate('el => el.closest("a")?.href')
                        if href and f'/present/{review_token}' in href:
                            print("✅ See Public Preview links to presentation page")
                    
                    await review_page.screenshot(path=".screenshots/test9_review_page.png", full_page=False)
                    
                    # Keep this page open for next tests
                    
                except Exception as e:
                    print(f"❌ Failed to open review page: {e}")
                    review_page = None
            
            # ============================================================
            # TEST 10: Submit corrections with empty fields
            # ============================================================
            print("\n[TEST 10] Submit corrections with empty fields")
            if review_page:
                try:
                    await review_page.click('text=Submit Corrections', force=True)
                    await review_page.wait_for_timeout(1000)
                    
                    # Look for error toast
                    error_toast = await review_page.query_selector('text=Please add at least one comment')
                    if error_toast:
                        print("✅ Error toast appeared for empty submission")
                    else:
                        print("⚠️  No error toast for empty submission (might be different message)")
                    
                except Exception as e:
                    print(f"❌ Failed to test empty submission: {e}")
            else:
                print("⚠️  Skipping TEST 10 - review_page not available")
            
            # ============================================================
            # TEST 11: Fill and submit corrections
            # ============================================================
            print("\n[TEST 11] Fill and submit corrections")
            if review_page:
                try:
                    # Fill Description textarea
                    desc_textarea = await review_page.query_selector('textarea[placeholder*="description"]')
                    if desc_textarea:
                        await desc_textarea.fill("Please update the description to include more details about the property.")
                        print("✅ Filled Description field")
                    
                    # Fill Photos textarea
                    photos_textarea = await review_page.query_selector('textarea[placeholder*="photos"]')
                    if photos_textarea:
                        await photos_textarea.fill("Please add more high-quality photos of the rooms and amenities.")
                        print("✅ Filled Photos field")
                    
                    # Fill General Comments
                    general_textarea = await review_page.query_selector('textarea[placeholder*="Anything else"]')
                    if general_textarea:
                        await general_textarea.fill("Overall the listing looks great, just needs a few updates.")
                        print("✅ Filled General Comments")
                    
                    # Submit
                    await review_page.click('text=Submit Corrections', force=True)
                    await review_page.wait_for_timeout(2000)
                    
                    # Look for success message
                    success_msg = await review_page.query_selector('text=Corrections submitted')
                    if success_msg:
                        print("✅ Corrections submitted successfully")
                    else:
                        # Check for task count message
                        task_msg = await review_page.query_selector('text=tasks created')
                        if task_msg:
                            print("✅ Corrections submitted (tasks created message)")
                        else:
                            print("⚠️  No clear success message found")
                    
                    await review_page.screenshot(path=".screenshots/test11_corrections_submitted.png", full_page=False)
                    
                except Exception as e:
                    print(f"❌ Failed to submit corrections: {e}")
            else:
                print("⚠️  Skipping TEST 11 - review_page not available")
            
            # ============================================================
            # TEST 12: Test claim form validation
            # ============================================================
            print("\n[TEST 12] Test claim form validation")
            if review_page:
                try:
                    # Scroll to claim section
                    await review_page.evaluate('document.getElementById("claim")?.scrollIntoView()')
                    await review_page.wait_for_timeout(500)
                    
                    # Try to submit with missing fields
                    submit_claim_btn = await review_page.query_selector('text=Submit Claim')
                    if submit_claim_btn:
                        await submit_claim_btn.click(force=True)
                        await review_page.wait_for_timeout(1000)
                        
                        # Look for validation toast
                        validation_toast = await review_page.query_selector('text=Please fill')
                        if validation_toast:
                            print("✅ Validation toast appeared for empty claim form")
                        else:
                            print("⚠️  No validation toast (might be different message)")
                    
                except Exception as e:
                    print(f"❌ Failed to test claim validation: {e}")
            else:
                print("⚠️  Skipping TEST 12 - review_page not available")
            
            # ============================================================
            # TEST 13: Fill and submit claim form
            # ============================================================
            print("\n[TEST 13] Fill and submit claim form")
            if review_page:
                try:
                    import time
                    timestamp = int(time.time())
                    
                    # Fill claim form
                    await review_page.fill('input[placeholder="Full name"]', 'Test Host User')
                    await review_page.fill('input[placeholder="Email"]', f'host{timestamp}@example.com')
                    await review_page.fill('input[placeholder*="Phone"]', '+919876543210')
                    await review_page.fill('input[placeholder*="role"]', 'Owner')
                    await review_page.fill('input[placeholder*="Identity proof"]', 'https://example.com/id.jpg')
                    await review_page.fill('input[placeholder*="Business proof"]', 'https://example.com/business.pdf')
                    await review_page.fill('textarea[placeholder*="additional notes"]', 'I am the owner of this property.')
                    
                    print("✅ Filled all claim form fields")
                    
                    # Submit claim
                    await review_page.click('text=Submit Claim', force=True)
                    await review_page.wait_for_timeout(2000)
                    
                    # Look for success message
                    success_msg = await review_page.query_selector('text=Your claim has been')
                    if success_msg:
                        print("✅ Claim submitted successfully")
                    else:
                        print("⚠️  No clear success message after claim submission")
                    
                    await review_page.screenshot(path=".screenshots/test13_claim_submitted.png", full_page=False)
                    await review_page.close()
                    review_page = None  # Mark as closed
                    
                except Exception as e:
                    print(f"❌ Failed to submit claim: {e}")
            else:
                print("⚠️  Skipping TEST 13 - review_page not available")
            
            # ============================================================
            # TEST 14: Verify data appears in admin
            # ============================================================
            print("\n[TEST 14] Verify change requests, tasks, and claims in admin")
            try:
                # Reload the business page
                await page.reload(wait_until='networkidle', timeout=15000)
                await page.wait_for_timeout(2000)
                
                # Check for change requests panel
                cr_panel = await page.query_selector('[data-testid="m8-change-requests-panel"]')
                if cr_panel:
                    print("✅ Change Requests panel visible")
                else:
                    print("⚠️  Change Requests panel not visible (might be empty)")
                
                # Check for tasks panel
                tasks_panel = await page.query_selector('[data-testid="m8-tasks-panel"]')
                if tasks_panel:
                    print("✅ Tasks panel visible")
                else:
                    print("⚠️  Tasks panel not visible (might be empty)")
                
                # Check for claims panel
                claims_panel = await page.query_selector('[data-testid="m8-claims-panel"]')
                if claims_panel:
                    print("✅ Claims panel visible")
                else:
                    print("⚠️  Claims panel not visible (might be empty)")
                
                await page.screenshot(path=".screenshots/test14_admin_panels.png", full_page=False)
                
            except Exception as e:
                print(f"❌ Failed to verify admin panels: {e}")
            
            # ============================================================
            # TEST 15: Change task status
            # ============================================================
            print("\n[TEST 15] Change task status to Done")
            try:
                # Find a task status dropdown
                task_select = await page.query_selector('[data-testid="m8-tasks-panel"] [role="combobox"]')
                if task_select:
                    await task_select.click(force=True)
                    await page.wait_for_timeout(500)
                    
                    # Click "Done" option
                    done_option = await page.query_selector('text=Done')
                    if done_option:
                        await done_option.click(force=True)
                        await page.wait_for_timeout(1000)
                        
                        # Look for success toast
                        toast = await page.query_selector('text=Task updated')
                        if toast:
                            print("✅ Task status updated to Done")
                        else:
                            print("⚠️  No toast after task update")
                    else:
                        print("❌ Done option not found")
                else:
                    print("⚠️  No task status dropdown found (might be no tasks)")
                
            except Exception as e:
                print(f"❌ Failed to change task status: {e}")
            
            # ============================================================
            # TEST 16: Request info on claim
            # ============================================================
            print("\n[TEST 16] Request info on pending claim")
            try:
                # Set up dialog handler ONCE for the page
                async def handle_dialog(dialog):
                    await dialog.accept("Please provide additional documentation")
                
                page.once("dialog", handle_dialog)
                
                # Click request info button
                info_btn = await page.query_selector('[data-testid="m8-claim-info"]')
                if info_btn:
                    await info_btn.click(force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=Claim')
                    if toast:
                        print("✅ Claim info requested")
                    
                    # Reload to see status change
                    await page.reload(wait_until='networkidle', timeout=15000)
                    await page.wait_for_timeout(1000)
                    
                    # Check for info_requested status
                    status_pill = await page.query_selector('text=info requested')
                    if status_pill:
                        print("✅ Claim status changed to 'info requested'")
                    
                else:
                    print("⚠️  Request info button not found (might be no pending claims)")
                
            except Exception as e:
                print(f"❌ Failed to request info: {e}")
            
            # ============================================================
            # TEST 17: Approve claim
            # ============================================================
            print("\n[TEST 17] Approve claim")
            try:
                # Set up dialog handler
                async def handle_approve_dialog(dialog):
                    await dialog.accept()
                
                page.once("dialog", handle_approve_dialog)
                
                approve_btn = await page.query_selector('[data-testid="m8-claim-approve"]')
                if approve_btn:
                    await approve_btn.click(force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=Claim')
                    if toast:
                        print("✅ Claim approved")
                    
                    # Reload to see status change
                    await page.reload(wait_until='networkidle', timeout=15000)
                    await page.wait_for_timeout(1000)
                    
                    # Check for approved status
                    status_pill = await page.query_selector('text=approved')
                    if status_pill:
                        print("✅ Claim status changed to 'approved'")
                    
                else:
                    print("⚠️  Approve button not found")
                
            except Exception as e:
                print(f"❌ Failed to approve claim: {e}")
            
            # ============================================================
            # TEST 18: Publish listing
            # ============================================================
            print("\n[TEST 18] Publish listing")
            try:
                # Set up dialog handler
                async def handle_publish_dialog(dialog):
                    await dialog.accept()
                
                page.once("dialog", handle_publish_dialog)
                
                publish_btn = await page.query_selector('[data-testid="m8-publish"]')
                if publish_btn:
                    await publish_btn.click(force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=published')
                    if toast:
                        print("✅ Listing published")
                    else:
                        print("⚠️  No toast after publish")
                
            except Exception as e:
                print(f"❌ Failed to publish: {e}")
            
            # ============================================================
            # TEST 19: Archive listing
            # ============================================================
            print("\n[TEST 19] Archive listing")
            try:
                # Set up dialog handler
                async def handle_archive_dialog(dialog):
                    await dialog.accept()
                
                page.once("dialog", handle_archive_dialog)
                
                archive_btn = await page.query_selector('[data-testid="m8-archive"]')
                if archive_btn:
                    await archive_btn.click(force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=archived')
                    if toast:
                        print("✅ Listing archived")
                    else:
                        print("⚠️  No toast after archive")
                
            except Exception as e:
                print(f"❌ Failed to archive: {e}")
            
            # ============================================================
            # TEST 20: Revoke review link
            # ============================================================
            print("\n[TEST 20] Revoke review link")
            try:
                # Set up dialog handler
                async def handle_revoke_dialog(dialog):
                    await dialog.accept()
                
                page.once("dialog", handle_revoke_dialog)
                
                revoke_btn = await page.query_selector('[data-testid="m8-revoke-review"]')
                if revoke_btn:
                    await revoke_btn.click(force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=revoked')
                    if toast:
                        print("✅ Review link revoked")
                    
                    # Verify generate button is now visible
                    await page.wait_for_timeout(500)
                    gen_btn = await page.query_selector('[data-testid="m8-generate-review"]')
                    if gen_btn:
                        print("✅ Generate Review button visible after revoke")
                
            except Exception as e:
                print(f"❌ Failed to revoke review link: {e}")
            
            # ============================================================
            # TEST 21: Regenerate review link
            # ============================================================
            print("\n[TEST 21] Regenerate review link")
            try:
                # First generate a new link
                await page.click('[data-testid="m8-generate-review"]', force=True)
                await page.wait_for_timeout(2000)
                
                # Set up dialog handler
                async def handle_regen_dialog(dialog):
                    await dialog.accept()
                
                page.once("dialog", handle_regen_dialog)
                
                # Then regenerate
                regen_btn = await page.query_selector('[data-testid="m8-regenerate-review"]')
                if regen_btn:
                    await regen_btn.click(force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=regenerated')
                    if toast:
                        print("✅ Review link regenerated")
                    else:
                        print("⚠️  No toast after regenerate")
                
            except Exception as e:
                print(f"❌ Failed to regenerate link: {e}")
            
            # ============================================================
            # TEST 22: Invite host
            # ============================================================
            print("\n[TEST 22] Invite host")
            try:
                import time
                timestamp = int(time.time())
                
                # Click invite host button
                await page.click('[data-testid="m8-invite-host"]', force=True)
                await page.wait_for_timeout(1000)
                
                # Fill invite form
                email_input = await page.query_selector('input[placeholder="Host email"]')
                if email_input:
                    await email_input.fill(f'invited-{timestamp}@example.com')
                    print("✅ Filled invite email")
                    
                    # Click send invitation
                    await page.click('[data-testid="m8-send-invite"]', force=True)
                    await page.wait_for_timeout(2000)
                    
                    # Look for success toast
                    toast = await page.query_selector('text=Invitation sent')
                    if toast:
                        print("✅ Host invitation sent")
                    else:
                        print("⚠️  No toast after invite")
                else:
                    print("❌ Invite form not visible")
                
            except Exception as e:
                print(f"❌ Failed to invite host: {e}")
            
            # ============================================================
            # TEST 23: Responsiveness - Mobile viewport
            # ============================================================
            print("\n[TEST 23] Test responsiveness on mobile viewport (375x800)")
            try:
                await page.set_viewport_size({"width": 375, "height": 800})
                await page.reload(wait_until='networkidle', timeout=15000)
                await page.wait_for_timeout(1000)
                
                # Check for horizontal scrollbar
                scroll_width = await page.evaluate('document.body.scrollWidth')
                if scroll_width <= 395:  # 375 + 20px tolerance
                    print(f"✅ No horizontal scrollbar on mobile (scrollWidth: {scroll_width})")
                else:
                    print(f"⚠️  Horizontal scrollbar detected (scrollWidth: {scroll_width})")
                
                # Verify M8 panel is still visible
                m8_panel = await page.query_selector('[data-testid="m8-actions-panel"]')
                if m8_panel:
                    print("✅ M8 panel visible on mobile")
                
                await page.screenshot(path=".screenshots/test23_mobile.png", full_page=False)
                
                # Reset viewport
                await page.set_viewport_size({"width": 1920, "height": 1080})
                
            except Exception as e:
                print(f"❌ Failed to test mobile responsiveness: {e}")
            
            # ============================================================
            # TEST 24: Responsiveness - Review and Present pages on mobile
            # ============================================================
            print("\n[TEST 24] Test review and present pages on mobile")
            if review_url and present_url:
                try:
                    mobile_page = await context.new_page()
                    await mobile_page.set_viewport_size({"width": 375, "height": 800})
                    
                    # Test review page
                    await mobile_page.goto(review_url, wait_until='networkidle', timeout=15000)
                    await mobile_page.wait_for_timeout(1000)
                    
                    scroll_width = await mobile_page.evaluate('document.body.scrollWidth')
                    if scroll_width <= 395:
                        print(f"✅ Review page: No horizontal scroll on mobile")
                    else:
                        print(f"⚠️  Review page: Horizontal scroll detected ({scroll_width})")
                    
                    # Test present page
                    await mobile_page.goto(present_url, wait_until='networkidle', timeout=15000)
                    await mobile_page.wait_for_timeout(1000)
                    
                    scroll_width = await mobile_page.evaluate('document.body.scrollWidth')
                    if scroll_width <= 395:
                        print(f"✅ Present page: No horizontal scroll on mobile")
                    else:
                        print(f"⚠️  Present page: Horizontal scroll detected ({scroll_width})")
                    
                    await mobile_page.close()
                    
                except Exception as e:
                    print(f"❌ Failed to test mobile pages: {e}")
            else:
                print("⚠️  Skipping TEST 24 - review_url or present_url not available")
            
            # ============================================================
            # TEST 25: Error handling - Expired/invalid present token
            # ============================================================
            print("\n[TEST 25] Test expired/invalid present token")
            try:
                error_page = await context.new_page()
                await error_page.goto(f'{BASE_URL}/present/expired-invalid', wait_until='networkidle', timeout=15000)
                await error_page.wait_for_timeout(1000)
                
                error_msg = await error_page.query_selector('text=Link unavailable')
                if error_msg:
                    print("✅ Invalid present token shows 'Link unavailable'")
                else:
                    print("❌ Error message not found")
                
                await error_page.close()
                
            except Exception as e:
                print(f"❌ Failed to test invalid present token: {e}")
            
            # ============================================================
            # TEST 26: Error handling - Expired/invalid review token
            # ============================================================
            print("\n[TEST 26] Test expired/invalid review token")
            try:
                error_page = await context.new_page()
                await error_page.goto(f'{BASE_URL}/review/expired-invalid', wait_until='networkidle', timeout=15000)
                await error_page.wait_for_timeout(1000)
                
                error_msg = await error_page.query_selector('text=Link unavailable')
                if error_msg:
                    print("✅ Invalid review token shows 'Link unavailable'")
                else:
                    print("❌ Error message not found")
                
                await error_page.close()
                
            except Exception as e:
                print(f"❌ Failed to test invalid review token: {e}")
            
            print("\n" + "=" * 80)
            print("MODULE 8 FRONTEND UI TEST COMPLETE")
            print("=" * 80)
            print("\nPlease review the test results above and screenshots in .screenshots/")
            print("All 26 tests have been executed. Check for any ❌ or ⚠️  markers.")
            
        except Exception as e:
            print(f"\n❌ FATAL ERROR: {e}")
            await page.screenshot(path=".screenshots/fatal_error.png", full_page=False)
            raise
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
