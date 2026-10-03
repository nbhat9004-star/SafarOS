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

// Idempotent foundational indexes for the EXISTING collections only.
// createIndex() is a no-op when an identical index already exists, so this is
// safe to run on every cold start without dropping/recreating anything.
async function ensureIndexes(db) {
  await Promise.all([
    db.collection('agencies').createIndex({ id: 1 }, { unique: true, name: 'uniq_agency_id' }),
    db.collection('agencies').createIndex({ slug: 1 }, { unique: true, name: 'uniq_agency_slug' }),
    db.collection('users').createIndex({ agencyId: 1, email: 1 }, { unique: true, name: 'uniq_user_agency_email' }),
    db.collection('users').createIndex({ agencyId: 1, status: 1 }, { name: 'user_agency_status' }),
    db.collection('clients').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'client_agency_createdAt' }),
    db.collection('clients').createIndex({ agencyId: 1, email: 1 }, { name: 'client_agency_email' }),
    // CRM collections — tenant-scoped, newest-first listing.
    db.collection('leads').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'lead_agency_createdAt' }),
    db.collection('leads').createIndex({ agencyId: 1, status: 1 }, { name: 'lead_agency_status' }),
    db.collection('followUps').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'followup_agency_createdAt' }),
    db.collection('tasks').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'task_agency_createdAt' }),
    db.collection('activities').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'activity_agency_createdAt' }),
    db.collection('quotations').createIndex({ agencyId: 1, quotationNumber: 1 }, { unique: true, name: 'quotation_agency_number' }),
    db.collection('quotations').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'quotation_agency_createdAt' }),
    db.collection('quotations').createIndex({ agencyId: 1, status: 1 }, { name: 'quotation_agency_status' }),
    db.collection('packages').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'package_agency_createdAt' }),
    db.collection('packages').createIndex({ agencyId: 1, status: 1 }, { name: 'package_agency_status' }),
    db.collection('itineraries').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'itinerary_agency_createdAt' }),
    db.collection('itineraries').createIndex({ agencyId: 1, packageId: 1 }, { name: 'itinerary_agency_package' }),
    db.collection('suppliers').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'supplier_agency_createdAt' }),
    db.collection('suppliers').createIndex({ agencyId: 1, type: 1 }, { name: 'supplier_agency_type' }),
    db.collection('suppliers').createIndex({ agencyId: 1, status: 1 }, { name: 'supplier_agency_status' }),
    db.collection('bookings').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'booking_agency_createdAt' }),
    db.collection('bookings').createIndex({ agencyId: 1, status: 1 }, { name: 'booking_agency_status' }),
    db.collection('bookings').createIndex({ agencyId: 1, bookingNumber: 1 }, { name: 'booking_agency_number', unique: true }),
    db.collection('vehicles').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'vehicle_agency_createdAt' }),
    db.collection('vehicles').createIndex({ agencyId: 1, status: 1 }, { name: 'vehicle_agency_status' }),
    db.collection('vehicles').createIndex({ agencyId: 1, vehicleNumber: 1 }, { name: 'vehicle_agency_number' }),
    db.collection('drivers').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'driver_agency_createdAt' }),
    db.collection('drivers').createIndex({ agencyId: 1, status: 1 }, { name: 'driver_agency_status' }),
    db.collection('drivers').createIndex({ agencyId: 1, phone: 1 }, { name: 'driver_agency_phone' }),
    db.collection('financialTransactions').createIndex({ agencyId: 1, transactionDate: -1 }, { name: 'fintxn_agency_date' }),
    db.collection('financialTransactions').createIndex({ agencyId: 1, type: 1 }, { name: 'fintxn_agency_type' }),
    db.collection('financialTransactions').createIndex({ agencyId: 1, bookingId: 1 }, { name: 'fintxn_agency_booking' }),
    db.collection('customerReceivables').createIndex({ agencyId: 1, clientId: 1 }, { name: 'recv_agency_client' }),
    db.collection('customerReceivables').createIndex({ agencyId: 1, status: 1 }, { name: 'recv_agency_status' }),
    db.collection('customerReceivables').createIndex({ agencyId: 1, dueDate: 1 }, { name: 'recv_agency_due' }),
    db.collection('supplierPayables').createIndex({ agencyId: 1, supplierId: 1 }, { name: 'pay_agency_supplier' }),
    db.collection('supplierPayables').createIndex({ agencyId: 1, status: 1 }, { name: 'pay_agency_status' }),
    db.collection('supplierPayables').createIndex({ agencyId: 1, dueDate: 1 }, { name: 'pay_agency_due' }),
    db.collection('expenses').createIndex({ agencyId: 1, expenseDate: -1 }, { name: 'exp_agency_date' }),
    db.collection('expenses').createIndex({ agencyId: 1, category: 1 }, { name: 'exp_agency_category' }),
    db.collection('expenses').createIndex({ agencyId: 1, status: 1 }, { name: 'exp_agency_status' }),
    db.collection('invoices').createIndex({ agencyId: 1, invoiceNumber: 1 }, { name: 'inv_agency_number', unique: true }),
    db.collection('invoices').createIndex({ agencyId: 1, clientId: 1 }, { name: 'inv_agency_client' }),
    db.collection('invoices').createIndex({ agencyId: 1, status: 1 }, { name: 'inv_agency_status' }),
    db.collection('invoices').createIndex({ agencyId: 1, dueDate: 1 }, { name: 'inv_agency_due' }),
    db.collection('payments').createIndex({ agencyId: 1, paymentDate: -1 }, { name: 'pmt_agency_date' }),
    db.collection('payments').createIndex({ agencyId: 1, paymentNumber: 1 }, { unique: true, name: 'pmt_agency_number' }),
    db.collection('payments').createIndex({ agencyId: 1, status: 1 }, { name: 'pmt_agency_status' }),
    db.collection('payments').createIndex({ agencyId: 1, clientId: 1 }, { name: 'pmt_agency_client' }),
    db.collection('payments').createIndex({ agencyId: 1, supplierId: 1 }, { name: 'pmt_agency_supplier' }),
    db.collection('payments').createIndex({ agencyId: 1, bookingId: 1 }, { name: 'pmt_agency_booking' }),
    db.collection('payments').createIndex({ agencyId: 1, invoiceId: 1 }, { name: 'pmt_agency_invoice' }),
    db.collection('paymentRefunds').createIndex({ agencyId: 1, paymentId: 1 }, { name: 'pref_agency_payment' }),
    db.collection('paymentRefunds').createIndex({ agencyId: 1, refundDate: -1 }, { name: 'pref_agency_date' }),
    db.collection('paymentRefunds').createIndex({ agencyId: 1, status: 1 }, { name: 'pref_agency_status' }),
    db.collection('communications').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'comm_agency_created' }),
    db.collection('communications').createIndex({ agencyId: 1, clientId: 1 }, { name: 'comm_agency_client' }),
    db.collection('communications').createIndex({ agencyId: 1, leadId: 1 }, { name: 'comm_agency_lead' }),
    db.collection('communications').createIndex({ agencyId: 1, bookingId: 1 }, { name: 'comm_agency_booking' }),
    db.collection('communications').createIndex({ agencyId: 1, channel: 1 }, { name: 'comm_agency_channel' }),
    db.collection('communicationTemplates').createIndex({ agencyId: 1, channel: 1 }, { name: 'ctpl_agency_channel' }),
    db.collection('communicationTemplates').createIndex({ agencyId: 1, status: 1 }, { name: 'ctpl_agency_status' }),
    db.collection('aiConversations').createIndex({ agencyId: 1, userId: 1 }, { name: 'ai_agency_user' }),
    db.collection('aiConversations').createIndex({ agencyId: 1, updatedAt: -1 }, { name: 'ai_agency_updated' }),
    db.collection('portalUsers').createIndex({ email: 1 }, { unique: true, name: 'portal_email_unique' }),
    db.collection('portalUsers').createIndex({ agencyId: 1, clientId: 1 }, { name: 'portal_agency_client' }),
    db.collection('portalUsers').createIndex({ agencyId: 1, status: 1 }, { name: 'portal_agency_status' }),
    db.collection('websiteSettings').createIndex({ agencyId: 1 }, { unique: true, name: 'web_agency' }),
    db.collection('websitePages').createIndex({ agencyId: 1, slug: 1 }, { unique: true, name: 'webpage_agency_slug' }),
    db.collection('websitePages').createIndex({ agencyId: 1, status: 1 }, { name: 'webpage_agency_status' }),
    db.collection('agencies').createIndex({ slug: 1 }, { name: 'agency_slug' }),
    // SaaS subscription & billing (Phase 5.9) — one active subscription per agency.
    db.collection('agencySubscriptions').createIndex({ agencyId: 1 }, { unique: true, name: 'subs_agency_unique' }),
    db.collection('agencySubscriptions').createIndex({ agencyId: 1, status: 1 }, { name: 'subs_agency_status' }),
    db.collection('agencySubscriptions').createIndex({ planId: 1 }, { name: 'subs_plan' }),
    db.collection('agencySubscriptions').createIndex({ currentPeriodEnd: 1 }, { name: 'subs_period_end' }),
    db.collection('saasInvoices').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'saasinv_agency_created' }),
    db.collection('saasInvoices').createIndex({ agencyId: 1, status: 1 }, { name: 'saasinv_agency_status' }),
    db.collection('saasInvoices').createIndex({ agencyId: 1, invoiceNumber: 1 }, { unique: true, name: 'saasinv_agency_number' }),
    db.collection('saasInvoices').createIndex({ subscriptionId: 1 }, { name: 'saasinv_subscription' }),
    db.collection('subscriptionHistory').createIndex({ agencyId: 1, changedAt: -1 }, { name: 'subhist_agency_changed' }),
    // Integrations foundation (Phase 5.10).
    db.collection('integrations').createIndex({ agencyId: 1, provider: 1 }, { unique: true, name: 'integ_agency_provider' }),
    db.collection('integrations').createIndex({ agencyId: 1, category: 1 }, { name: 'integ_agency_category' }),
    db.collection('integrations').createIndex({ agencyId: 1, status: 1 }, { name: 'integ_agency_status' }),
    db.collection('webhooks').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'wh_agency_created' }),
    db.collection('webhooks').createIndex({ agencyId: 1, status: 1 }, { name: 'wh_agency_status' }),
    db.collection('apiKeys').createIndex({ agencyId: 1, createdAt: -1 }, { name: 'apikey_agency_created' }),
    db.collection('apiKeys').createIndex({ hash: 1 }, { name: 'apikey_hash' }),
  ]);
}

export async function getDb() {
  if (cached.db) return cached.db;
  if (!cached.promise) {
    const uri = resolveUri();
    if (!uri) throw new Error('MONGO_URL is not configured');
    const client = new MongoClient(uri, clientOptions);
    cached.promise = client.connect().then(async (c) => {
      cached.client = c;
      cached.db = c.db(dbName);
      // Create indexes once per process; never block/break requests if this fails.
      await ensureIndexes(cached.db).catch((e) => {
        console.warn('[safaros] ensureIndexes skipped:', e.message);
      });
      return cached.db;
    });
  }
  await cached.promise;
  return cached.db;
}
