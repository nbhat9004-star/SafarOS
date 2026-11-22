import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { encryptBusinessVerificationDocument } from '@/lib/business-verification-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
function err(message, status = 400) { return json({ error: message }, status); }
function safeRecord(record, documents = []) {
  if (!record) return null;
  const { _id, ...safe } = record;
  return { ...safe, documents: documents.map(({ _id: ignored, data, encryptedData, ...doc }) => doc) };
}
function validFile(bytes, type) {
  if (type === 'application/pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return false;
}

async function agencyAccess(request) {
  const session = getSession(request);
  if (!session?.agencyId) return { error: err('Authentication required', 401) };
  if (!can(session.role, 'agency:manage')) return { error: err('Only the agency owner can submit business verification documents', 403) };
  return { session };
}

export async function GET(request) {
  const access = await agencyAccess(request);
  if (access.error) return access.error;
  try {
    const db = await getDb();
    const record = await db.collection('agencyBusinessVerifications').findOne(
      { agencyId: String(access.session.agencyId) },
      { projection: { _id: 0 } }
    );
    if (!record) return json({ verification: null });
    const documents = record.documentIds?.length
      ? await db.collection('agencyBusinessVerificationDocuments').find(
          { agencyId: String(access.session.agencyId), id: { $in: record.documentIds } },
          { projection: { _id: 0, data: 0 } }
        ).sort({ createdAt: 1 }).toArray()
      : [];
    return json({ verification: safeRecord(record, documents) });
  } catch (error) {
    console.error('[business-verification] agency read failed:', String(error?.message || '').slice(0, 120));
    return err('Could not load business verification status', 500);
  }
}

export async function POST(request) {
  const access = await agencyAccess(request);
  if (access.error) return access.error;
  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 4_300_000) return err('Upload request is too large. Upload one document at a time (maximum 3 MB).', 413);
    body = await request.json();
  } catch { return err('A valid JSON request is required'); }

  const agencyId = String(access.session.agencyId);
  const now = new Date().toISOString();
  try {
    const db = await getDb();
    const records = db.collection('agencyBusinessVerifications');
    const docs = db.collection('agencyBusinessVerificationDocuments');
    const existing = await records.findOne({ agencyId });

    if (body.action === 'upload') {
      if (existing?.platformStatus === 'pending_review' || existing?.platformStatus === 'approved' || existing?.platformStatus === 'rejected') {
        return err('Documents cannot be changed while this review is locked. Contact SafarOS support if you need to correct a submission.', 409);
      }
      const fileName = String(body.fileName || '').trim().replace(/[\\/\\\\]/g, '_').slice(0, 180);
      const fileType = String(body.fileType || '').trim().toLowerCase();
      const content = String(body.content || '').replace(/^data:[^,]+,/, '').trim();
      if (!fileName || !ALLOWED_TYPES.has(fileType) || !content || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) {
        return err('Upload a PDF, JPEG or PNG business document');
      }
      const bytes = Buffer.from(content, 'base64');
      if (!bytes.length || bytes.length > MAX_FILE_BYTES || bytes.toString('base64').replace(/=+$/, '') !== content.replace(/=+$/, '')) {
        return err('Each document must be a valid file no larger than 3 MB');
      }
      if (!validFile(bytes, fileType)) return err('The file content does not match its selected PDF, JPEG or PNG type');
      const currentCount = existing ? await docs.countDocuments({ agencyId, verificationId: existing.id }) : 0;
      if (currentCount >= 3) return err('You can upload up to three documents');
      const verificationId = existing?.id || randomUUID();
      const document = {
        id: randomUUID(), verificationId, agencyId, fileName, fileType, fileSize: bytes.length,
        encryptedData: encryptBusinessVerificationDocument(bytes.toString('base64'), agencyId), uploadedBy: String(access.session.userId || ''),
        createdAt: now,
      };
      await docs.insertOne(document);
      await records.updateOne(
        { agencyId },
        {
          $set: { id: verificationId, agencyId, platformStatus: existing?.platformStatus || 'draft', updatedAt: now },
          $addToSet: { documentIds: document.id },
          $setOnInsert: { createdAt: now, submissionAttempts: 0, metaStatus: 'unknown' },
        },
        { upsert: true }
      );
      return json({ document: { id: document.id, fileName, fileType, fileSize: bytes.length, createdAt: now } }, 201);
    }

    if (body.action === 'remove') {
      const documentId = String(body.documentId || '').trim();
      if (!existing || !['draft', 'needs_information'].includes(existing.platformStatus || 'draft')) return err('Documents can only be removed from a draft or a submission awaiting more information', 409);
      const removed = await docs.deleteOne({ agencyId, verificationId: existing.id, id: documentId });
      if (!removed.deletedCount) return err('Document not found', 404);
      await records.updateOne({ agencyId }, { $pull: { documentIds: documentId }, $set: { updatedAt: now } });
      return json({ ok: true });
    }

    if (body.action === 'meta_status') {
      const metaStatus = ['not_started', 'in_progress', 'verified', 'rejected', 'unknown'].includes(body.metaStatus) ? body.metaStatus : '';
      if (!metaStatus) return err('Choose a valid Meta verification status');
      if (!existing) return err('Submit your business details to SafarOS before updating this status');
      await records.updateOne({ agencyId }, { $set: {
        metaStatus, metaStatusSource: 'agency_reported', metaStatusUpdatedAt: now, updatedAt: now,
      } });
      return json({ ok: true, metaStatus, metaStatusSource: 'agency_reported' });
    }

    if (body.action === 'submit') {
      const legalBusinessName = String(body.legalBusinessName || '').trim().slice(0, 180);
      const businessType = String(body.businessType || '').trim().slice(0, 60);
      const country = String(body.country || '').trim().slice(0, 80);
      const registrationNumber = String(body.registrationNumber || '').trim().slice(0, 100);
      const registeredAddress = String(body.registeredAddress || '').trim().slice(0, 500);
      const metaStatus = ['not_started', 'in_progress', 'verified', 'rejected', 'unknown'].includes(body.metaStatus) ? body.metaStatus : 'unknown';
      if (!legalBusinessName || !businessType || !country || !registeredAddress) return err('Legal business name, business type, country and registered address are required');
      if (!existing) return err('Upload at least one business document before submitting');
      if (['pending_review', 'approved', 'rejected'].includes(existing.platformStatus)) return err('This submission is locked. Contact SafarOS support if you need help.');
      const documentCount = await docs.countDocuments({ agencyId, verificationId: existing.id, id: { $in: existing.documentIds || [] } });
      if (documentCount < 1 || documentCount > 3) return err('Upload between one and three business documents before submitting');
      const set = {
        legalBusinessName, businessType, country, registrationNumber, registeredAddress,
        metaStatus, metaStatusSource: 'agency_reported',
        platformStatus: 'pending_review', submittedAt: now, updatedAt: now,
        submittedBy: String(access.session.userId || ''),
      };
      await records.updateOne({ agencyId }, { $set: set, $inc: { submissionAttempts: 1 } });
      const updated = await records.findOne({ agencyId }, { projection: { _id: 0 } });
      const documentRows = await docs.find({ agencyId, verificationId: existing.id }, { projection: { _id: 0, data: 0 } }).toArray();
      return json({ verification: safeRecord(updated, documentRows) }, 201);
    }

    return err('Unknown business verification action');
  } catch (error) {
    console.error('[business-verification] agency submit failed:', String(error?.message || '').slice(0, 120));
    return err('SafarOS could not save this business verification request', 500);
  }
}
