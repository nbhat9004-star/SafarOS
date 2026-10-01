# SafarOS — Phase 1: Snapshot Intake + Redacted Secret Inventory

**Source:** `nbhat9004-star/Safar.travel.9004` @ `main`
**Snapshot commit:** `bead320fbae8117e01f9b26d80d3686856f7e437` (verified)
**Intake location:** `/app/safar_intake/`
**Files imported:** 496

## Intake guardrails — verified
| Guardrail | Status |
|---|---|
| Single `main` snapshot, files only | PASS — cloned `--depth 1`, then copied excluding `.git` |
| No git history carried over | PASS — `.git` absent in intake folder |
| No upstream remote | PASS — `git remote -v` empty (no repo inside intake) |
| Source repo untouched | PASS — read-only clone, zero writes to origin |
| No prod data (DB dumps / auth records) | PASS — none present in repo |

## Secret scan — result: NO LIVE SECRETS COMMITTED
The source repo was hygienic. `.env*`, `*.pem`, `*.key`, `*credentials*`, `*serviceAccount*` are gitignored and **absent** from the snapshot. Code reads credentials exclusively from environment variables. Only placeholders / illustrative examples exist in docs.

### Redacted inventory (what was found + where)
| # | Location | Type | Value status | Action |
|---|---|---|---|---|
| 1 | `lib/db.js` (comment) | Mongo SRV format example `mongodb+srv://<user>:<pass>@...` | Placeholder | Left as-is (no real value) |
| 2 | `DEPLOYMENT_ENV_VARS.md` | Mongo URI with `<USER>:<PASSWORD>` | Placeholder | Left as-is |
| 3 | `VERCEL_DEPLOYMENT_GUIDE.md` | `mongodb://localhost:27017` + `<username>:<password>` examples | Placeholder / localhost | Left as-is |
| 4 | `ISSUES_REFERENCE.md` | `JWT_SECRET=change-me-...`, localhost, `yourdomain.com` | Placeholder | Left as-is |
| 5 | `EMAIL_WHATSAPP_GUIDE.md` | `RESEND_API_KEY=re_your_actual_api_key_here` | Placeholder | Left as-is |
| 6 | `DIAGNOSTIC_REPORT.md` | Google-API-key *format example* string | Fake example (matched real format) | **REDACTED** -> `<REDACTED_GOOGLE_API_KEY_EXAMPLE>` (precaution) |

### Env variable NAMES referenced by code (structure preserved, no values)
Auth/DB: `MONGO_URL`, `MONGODB_URI`, `DATABASE_URL`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`
Firebase: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
AI/LLM: `EMERGENT_LLM_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`
Email: `RESEND_API_KEY`, `FROM_EMAIL`, `SUPPORT_EMAIL`
Payments/misc: `PAYMENT_ENCRYPTION_KEY`, `BOOKING_ENGINE_CRON_KEY`, `BOOKING_PENDING_TTL_MS`, `ALLOW_BOOKINGS_WITHOUT_PAYMENT`, `CORS_ORIGINS`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_CIRCLE_URL`, `NODE_ENV`

**Conclusion:** No real credentials, keys, DB passwords, tokens, or private keys were carried over. SafarOS will supply entirely separate credentials via its own env config in Phase 3.
