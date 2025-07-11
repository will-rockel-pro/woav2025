
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

let adminApp: admin.app.App | undefined;
let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;
let adminStorage: admin.storage.Storage | undefined;

if (!admin.apps.length) {
  // Check if the serviceAccountKeyJson is present and looks like a JSON object before trying to parse.
  if (serviceAccountKeyJson && serviceAccountKeyJson.trim().startsWith('{')) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKeyJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message);
      if (e.message.includes('json')) {
        console.error('[firebaseAdmin] This might be due to an invalid JSON string in FIREBASE_SERVICE_ACCOUNT_KEY_JSON.');
      }
    }
  } else {
    // This will be the case during the build process on App Hosting if .env is not set up.
    console.warn('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not a valid JSON object or is not set. Skipping Admin SDK initialization. This is expected during client-side rendering and some build processes.');
  }
} else {
  adminApp = admin.app();
  console.log('[firebaseAdmin] Reusing existing Firebase Admin SDK app instance.');
}

if (adminApp) {
    adminDb = adminApp.firestore();
    adminAuth = adminApp.auth();
    adminStorage = adminApp.storage();

    if (adminDb && typeof adminDb.collection !== 'function') {
        console.error('[firebaseAdmin] CRITICAL VALIDATION FAILURE: adminDb.collection is NOT a function, or adminDb is undefined even after supposed initialization. Firestore Admin SDK might not be working correctly.');
    }
    if (adminAuth && typeof adminAuth.verifyIdToken !== 'function') {
        console.error('[firebaseAdmin] CRITICAL VALIDATION FAILURE: adminAuth.verifyIdToken is NOT a function, or adminAuth is undefined. Auth Admin SDK might not be working correctly.');
    }
}


export { adminDb, adminAuth, adminStorage };
