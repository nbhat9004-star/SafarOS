// Firebase Admin SDK for server-side token verification
import * as admin from 'firebase-admin';

let adminApp;

export function getFirebaseAdmin() {
  if (adminApp) return adminApp;

  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      console.error('Firebase Admin credentials missing');
      return null;
    }

    adminApp = admin.apps.length === 0 
      ? admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        })
      : admin.app();

    return adminApp;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
}

export async function verifyFirebaseToken(idToken) {
  try {
    const app = getFirebaseAdmin();
    if (!app) throw new Error('Firebase Admin not initialized');
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { success: true, uid: decodedToken.uid, phone: decodedToken.phone_number };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: error.message };
  }
}
