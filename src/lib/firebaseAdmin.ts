
import admin from 'firebase-admin';

// Check if we're in a build environment on App Hosting.
// process.env.K_REVISION is a variable set by Cloud Run, which App Hosting uses.
const isBuildProcess = !!process.env.K_REVISION;

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

let adminApp: admin.app.App | undefined;
let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;
let adminStorage: admin.storage.Storage | undefined;

if (!admin.apps.length) {
  // Only attempt to initialize if not in a build process and the key exists.
  if (!isBuildProcess && serviceAccountKeyJson && serviceAccountKeyJson.trim().startsWith('{')) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKeyJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message);
    }
  } else if (isBuildProcess) {
    console.warn('[firebaseAdmin] In build process, skipping Firebase Admin SDK initialization.');
  } else {
    console.warn('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not a valid JSON object or is not set. Skipping Admin SDK initialization.');
  }
} else {
  adminApp = admin.app();
  console.log('[firebaseAdmin] Reusing existing Firebase Admin SDK app instance.');
}

if (adminApp) {
    adminDb = adminApp.firestore();
    adminAuth = adminApp.auth();
    adminStorage = adminApp.storage();
}

export { adminDb, adminAuth, adminStorage };
