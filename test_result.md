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

user_problem_statement: "CRM Workspace Foundation: add a dedicated CRM area (Dashboard, Leads, Clients, Contacts, Follow-ups, Tasks, Activities) reusing existing auth/RBAC/tenant/clients. Build foundations only — no quotations/bookings/finance/AI/automation."

frontend:
  - task: "CRM workspace — nav group + Dashboard/Leads/Contacts/Follow-ups/Tasks/Activities + Clients reuse"
    implemented: true
    working: "NA"
    file: "components/safaros/app-experience.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Restructured sidebar+mobile-drawer NAV into a reusable NavList/NavButton with a 'CRM' group (Dashboard, Leads, Clients, Contacts, Follow-ups, Tasks, Activities). Added components: CrmDashboard (5 real-data stat cards -> totalLeads/activeLeads/totalClients/followUpsDue/openTasks, zero-states, clickable to sections), Leads (table/cards, search + status filter, add/edit dialog, detail dialog with Change status + Convert to Client, delete), Contacts (read-only directory derived from clients+leads, search), FollowUps (list + add dialog with related picker + mark complete/delete), Tasks (list + add dialog with assignee from /members + related picker + complete/delete), Activities (read-only auto-logged timeline). Existing Clients component reused inside CRM unchanged. RBAC-aware via can(). Verified manually (no testing agent): CRM dashboard shows real counts, Leads table + mobile drawer CRM group render, no horizontal overflow at 1920/390."

  - task: "Team & Employee Management (PRESERVED)"
    implemented: true
    working: true
    file: "components/safaros/app-experience.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Team module untouched; still reachable from nav (outside CRM group)."

backend:
  - task: "CRM API — leads, followUps, tasks, activities, crm/stats (+ convert-to-client)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Added tenant-scoped, RBAC-gated endpoints: GET /crm/stats; GET/POST /leads, PUT/DELETE /leads/:id, POST /leads/:id/convert (creates client in existing clients collection, marks lead converted); GET/POST /followups, PUT/DELETE /followups/:id; GET/POST /tasks, PUT/DELETE /tasks/:id; GET /activities (latest 50). Validation helpers for lead/followup/task (name/title required, email format+lowercase, status enums). Activities auto-logged on create + lead status change. New collections: leads, followUps, tasks, activities (each stamped with agencyId via withAgency, UUID ids). RBAC matrix extended (leads/followups/tasks/activities/crm) mirroring clients. db.js adds indexes for the new collections. Manually verified via localhost curl: empty stats=all zeros (no fake data); lead create/status-change/convert work; convert produces active client; activities timeline logs all events; cross-agency access returns not-found/empty (tenant isolation intact). Auth/session/clients/members endpoints unchanged."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "CRM workspace — nav group + Dashboard/Leads/Contacts/Follow-ups/Tasks/Activities + Clients reuse"
    - "CRM API — leads, followUps, tasks, activities, crm/stats (+ convert-to-client)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "CRM Workspace Foundation complete. Changed only: lib/rbac.js (CRM permissions), lib/db.js (indexes for new collections), app/api/[[...path]]/route.js (CRM endpoints), components/safaros/app-experience.jsx (CRM nav + components). New collections: leads, followUps, tasks, activities (all tenant-stamped, UUID ids). Existing clients collection reused (Convert-to-Client writes into clients). Per task constraints NO automated testing agents were used — verified manually via localhost curl + screenshots. No fake/demo data inserted (all test data cleaned up). Team & Clients modules preserved; auth/JWT/session/tenant/RBAC architecture intact."