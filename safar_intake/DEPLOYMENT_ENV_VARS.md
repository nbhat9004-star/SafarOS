# 🚀 Safar.travel — Production Environment Variables

This document lists the **exact environment variables** required to deploy the build that just passed (`yarn build` ✓ — 14 routes generated).

---

## 1️⃣ MongoDB Atlas Setup

### Step A — Create the cluster
1. Go to <https://cloud.mongodb.com> → **Build a Database** → free **M0** tier (or paid).
2. **Database Access** → Add a database user (e.g. `safar_app`) → save the password.
3. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere — required for Vercel serverless).
4. **Connect** → **Drivers** → Node.js → copy the connection string.

### Step B — Connection string format
```
mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/safar?retryWrites=true&w=majority&appName=Safar
```
The trailing `/safar` sets the default database name to match `DB_NAME=safar`.

> ⚠️ URL-encode the password if it contains `@`, `:`, `/`, `?`, `#`, `[`, `]`, `%`, etc.

---

## 2️⃣ Vercel Environment Variables

In Vercel: **Project → Settings → Environment Variables** → add the following for **Production**, **Preview**, and **Development** (all three checkboxes).

| Variable | Required? | Value | Notes |
|---|---|---|---|
| `MONGO_URL` | ✅ Required (preferred) | `mongodb+srv://safar_app:<PASSWORD>@<CLUSTER>.mongodb.net/safar?retryWrites=true&w=majority&appName=Safar` | From Atlas Step B. Code also accepts `MONGODB_URI` or `DATABASE_URL` as fallback. |
| `DB_NAME` | ✅ Required | `safar` | Used by `lib/db.js` |
| `JWT_SECRET` | ✅ Required | Generate with `openssl rand -hex 32` (min 32 chars) | **Do NOT reuse the dev value** |
| `JWT_EXPIRES_IN` | Optional | `7d` | Defaults to `7d` if omitted |
| `NODE_ENV` | Auto-set by Vercel | `production` | Don't manually set — Vercel handles this |
| `NEXT_PUBLIC_BASE_URL` | Recommended | `https://<your-domain>.vercel.app` | Public — used by client. After domain attach, change to custom domain. |

### Generate a strong JWT_SECRET
```bash
openssl rand -hex 32
# Example output (use your own!):
# 9c4b1e8f7a3d2c5e6f9a0b8c7d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e
```

---

## 3️⃣ Vercel Project Configuration

| Setting | Value |
|---|---|
| Framework Preset | **Next.js** |
| Build Command | `yarn build` (default) |
| Install Command | `yarn install` (default) |
| Output Directory | `.next` (default) |
| Node.js Version | **18.x** or **20.x** |
| Root Directory | `./` |

No `vercel.json` is required — the default Next.js preset works.

---

## 4️⃣ Post-Deploy Smoke Test

After first deploy, test these in your browser / curl:

```bash
# Health (you can add a /api/health endpoint later)
curl https://<your-app>.vercel.app/

# Register a user
curl -X POST https://<your-app>.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test12345","role":"traveler"}'

# Login
curl -X POST https://<your-app>.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test12345"}'
```

---

## 5️⃣ Common Deployment Pitfalls

| Symptom | Fix |
|---|---|
| `MongoServerSelectionError` | Atlas Network Access → add `0.0.0.0/0` |
| `bad auth: authentication failed` | URL-encode special chars in MONGO_URL password |
| `JWT must be provided` / random logouts | `JWT_SECRET` missing or different across environments |
| Cookies not set in browser | Ensure deployed on HTTPS (Vercel handles this) |
| `Module not found: @/lib/auth-context` | Should NOT happen — fixed in this session |

---

## ✅ Build Verification (June 2025)

```
✓ Compiled successfully
✓ Generating static pages (14/14)
Done in 16.27s.
```

All 14 routes built cleanly. The app is ready to deploy to Vercel once the variables above are configured.
