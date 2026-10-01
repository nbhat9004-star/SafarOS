// SafarOS — MongoDB connection helper (KEEP, re-pointed to its own `safaros` DB).
// Env-driven only. No hardcoded credentials. Serverless-friendly pooling.
import { MongoClient } from 'mongodb';

function resolveUri() {
  return (
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    ''
  );
}

const dbName = process.env.DB_NAME || 'safaros';

const clientOptions = {
  maxPoolSize: 5,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  appName: 'safaros',
};

let cached = global._safarosMongo;
if (!cached) cached = global._safarosMongo = { client: null, db: null, promise: null };

export async function getDb() {
  if (cached.db) return cached.db;
  if (!cached.promise) {
    const uri = resolveUri();
    if (!uri) throw new Error('MONGO_URL is not configured');
    const client = new MongoClient(uri, clientOptions);
    cached.promise = client.connect().then((c) => {
      cached.client = c;
      cached.db = c.db(dbName);
      return cached.db;
    });
  }
  await cached.promise;
  return cached.db;
}
