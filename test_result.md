#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Phase 4.1 — Quotation Engine Foundation: a professional quotation workspace connected to the CRM (list, create/edit, detail, pricing with markup/discount/tax, internal cost/profit, status workflow, duplicate, draft delete). Reuse auth/RBAC/tenant/CRM. Foundation only."

frontend:
  - task: "Quotation workspace — nav group, list, create/edit form, detail"
    implemented: true
    working: "NA"
    file: "components/safaros/app-experience.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Added QUOTATIONS nav group (Quotations, Create Quotation) in sidebar + mobile drawer. New components: Quotations (orchestrates list/create/edit/detail), QuotationList (table desktop / cards mobile, search + status filter, create button, empty state), QuotationForm (create+edit: CustomerPicker reusing /clients+/leads, destination, dates with auto-nights, travelers, line items with Category/Description/Qty/UnitCost/Markup%/SellPrice/Total + add/remove, discount fixed|percent, tax %, LIVE totals preview + Internal-only cost/profit), QuotationDetail (full detail, customer-facing vs internal sections separated with Lock, actions: Edit, Change status, Duplicate, Delete draft, PDF disabled 'soon', Convert to Booking disabled 'soon'). RBAC-aware via can('quotations:*'). Status badges draft/sent/approved/rejected/expired. Verified manually (no testing agent): list/detail/create render, no horizontal overflow at 1920/390, internal cost/profit hidden from customer-facing blocks."

backend:
  - task: "Quotation API — list/get/create/update/status/duplicate/delete + authoritative pricing"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "New collection 'quotations' (UUID ids, agencyId-stamped). Endpoints (all authenticated, tenant-scoped via tenantFilter, RBAC quotations:*): GET /quotations, GET /quotations/:id, POST /quotations (create, draft), PUT /quotations/:id (full edit), PUT /quotations/:id/status (status change), POST /quotations/:id/duplicate (new draft + new number), DELETE /quotations/:id (DRAFT only). Human-readable per-agency unique number QT-YYYY-#### via atomic $inc on agencies.quotationSeq (no ObjectId exposed). Authoritative server-side pricing computeQuotation(): item total=qty*sellingPrice, subtotal, internalCost=qty*unitCost, discount fixed|percent (clamped, no negative total), tax % on taxable, grandTotal, expectedProfit=taxable-internalCost. validateQuotationInput: customer+destination required, valid date order, non-negative qty/prices. Customer resolved+verified against agency's own clients/leads (tenant-safe, reuses CRM, no duplicate records). RBAC matrix extended quotations:read/create/update/delete; db.js adds unique index {agencyId,quotationNumber} + createdAt + status. Activity logged on create/duplicate/status. Manually verified via localhost curl: pricing exact (sub 650, disc 65, tax 29.25, grand 614.25, cost 420, profit 165); sequential numbers 0001/0002/0003; status change; non-draft delete rejected; duplicate; validation errors; cross-agency list/get/delete/customer-ref all blocked (tenant isolation intact). Auth/session/CRM/clients/members unchanged."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Quotation workspace — nav group, list, create/edit form, detail"
    - "Quotation API — list/get/create/update/status/duplicate/delete + authoritative pricing"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Phase 4.2 Package & Itinerary Builder Foundation complete. Backend (packages/itineraries endpoints, RBAC packages:*/itineraries:*, db.js indexes) was already present from a prior pass — the missing piece was the FRONTEND: components/safaros/app-experience.jsx referenced <Packages/> and <Itineraries/> (nav 'Travel Operations' group) but never defined them (would crash those tabs). Implemented: PackageList (search+status filter, responsive table/cards, empty state), PackageForm (create/edit; reuses CRM Clients/Leads via existing CustomerPicker, optional quotation link via QuotationPicker that prefills customer/destination/dates/travelers), PackageDetail (all fields + change status + create/open itinerary + delete-draft + embedded itinerary view), ItineraryEditor (day-by-day builder: add/remove/edit day, activities add/remove/edit, meals, transport, accommodation, notes, save via PUT /itineraries/:id), ItineraryView (polished read-only day cards), Itineraries workspace (list + view + edit), ItineraryViewPage. Added 'Create package' button on QuotationDetail that navigates to Packages prefilled from the quotation (reuses quotation record, no duplication). Also: /app/.env was MISSING after an environment reset (MONGO_URL/JWT_SECRET absent -> app could not connect/sign sessions); recreated it (local mongodb, DB_NAME safaros, fresh JWT_SECRET, preview NEXT_PUBLIC_BASE_URL) — DB was empty, no data lost; /api/health now healthy+connected. Verified via ESLint (clean) + Next.js compile + health check only. Per task HARD constraint: NO testing/browser/QA/autonomous testing agents were used and NO fake data was inserted. Tenant isolation (withAgency/tenantFilter, agencyId server-derived), RBAC, Team, CRM, Quotations + pricing all untouched/preserved.\n---\nPREVIOUS: Phase 4.1 Quotation Engine Foundation complete. Changed only: lib/rbac.js (quotations perms), lib/db.js (quotations indexes), app/api/[[...path]]/route.js (quotation endpoints + pricing), components/safaros/app-experience.jsx (QUOTATIONS nav + components). New collection: quotations (UUID ids, agencyId-stamped; per-agency unique number QT-YYYY-#### via agencies.quotationSeq). Reuses CRM clients/leads for customer selection — no duplicate records. Per task constraints NO automated testing agents were used — verified manually via localhost curl + screenshots. No fake/demo data inserted (all test data cleaned up). Tenant isolation + RBAC preserved; Team, CRM (Leads/Clients/Contacts/Follow-ups/Tasks/Activities), auth/session/landing all intact. PDF + Convert-to-Booking shown as disabled 'coming soon' (no fake implementation)."