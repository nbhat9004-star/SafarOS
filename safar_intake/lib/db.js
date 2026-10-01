// Cached MongoDB connection helper for Next.js — tuned for serverless (Vercel) + Atlas.
//
// Supported connection-string env vars (first match wins):
//   1. MONGO_URL      (project default, used in .env)
//   2. MONGODB_URI    (Atlas/MongoDB official docs default — common on Vercel)
//   3. DATABASE_URL   (Prisma/Heroku-style convention)
//
// Atlas connection-string format is fully compatible:
//   mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
//
import { MongoClient } from 'mongodb';

function resolveUri() {
  return (
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    ''
  );
}

const dbName = process.env.DB_NAME || 'safar';

// Serverless-friendly client options. maxPoolSize is intentionally LOW because each
// warm Vercel Lambda keeps its own pool — high values exhaust Atlas free-tier (500 cap).
const clientOptions = {
  maxPoolSize: 5,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 10000, // fail fast on bad URI / network
  socketTimeoutMS: 45000,
  // appName surfaces in Atlas → Metrics → Real-Time → very useful for debugging
  appName: 'safar-travel',
};

// Persist the connection across hot-reloads in dev and across warm invocations in
// serverless production. `global` is the only place that survives module re-evaluation.
let cached = global._safarMongo;
if (!cached) cached = global._safarMongo = { client: null, db: null, promise: null };

export async function getDb() {
  if (cached.db) return cached.db;

  if (!cached.promise) {
    const uri = resolveUri();
    if (!uri) {
      // Throw INSIDE the async function (not at module load) so Next.js build /
      // static analysis never crashes when env vars aren't injected yet.
      throw new Error(
        'MongoDB connection string is not defined. Set MONGO_URL (preferred), ' +
          'MONGODB_URI, or DATABASE_URL in your environment.'
      );
    }

    cached.promise = MongoClient.connect(uri, clientOptions)
      .then((client) => {
        cached.client = client;
        cached.db = client.db(dbName);
        return cached.db;
      })
      .catch((err) => {
        // Reset so the next request can retry instead of getting a permanently-rejected promise.
        cached.promise = null;
        throw err;
      });
  }

  return cached.promise;
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

// Lightweight health probe usable by /api/health or readiness checks.
export async function pingDb() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'db ping failed' };
  }
}

// Ensure indexes (idempotent, called lazily by routes that need them).
let _ensured = false;
export async function ensureIndexes() {
  if (_ensured) return;
  const users = await getCollection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  _ensured = true;
}
