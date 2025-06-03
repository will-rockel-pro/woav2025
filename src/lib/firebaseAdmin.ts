
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

let adminInitialized = false;
let adminApp: admin.app.App | undefined = undefined;

if (!admin.apps.length) {
  if (serviceAccountKeyJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKeyJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
      adminInitialized = true;
    } catch (e: any) {
      console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message, e.stack);
      // adminInitialized remains false
    }
  } else {
    console.error('[firebaseAdmin] CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. Firebase Admin SDK cannot be initialized.');
    // adminInitialized remains false
  }
} else {
  adminApp = admin.app(); // Get the default app if already initialized
  // console.log('[firebaseAdmin] Firebase Admin SDK already initialized. Using existing app.');
  adminInitialized = true;
}

// Assign Firestore, Auth, Storage instances if adminApp was successfully initialized/retrieved
const tempAdminDb = adminApp ? adminApp.firestore() : undefined;
const tempAdminAuth = adminApp ? adminApp.auth() : undefined;
const tempAdminStorage = adminApp ? adminApp.storage() : undefined;

// Perform a check right after attempting to get the firestore instance
if (adminInitialized && adminApp) {
  if (tempAdminDb && typeof tempAdminDb.collection === 'function') {
    // console.log('[firebaseAdmin] VALIDATION: tempAdminDb.collection IS a function. Exporting valid adminDb.');
  } else {
    console.error('[firebaseAdmin] CRITICAL VALIDATION FAILURE: tempAdminDb.collection is NOT a function, or tempAdminDb is undefined even after supposed initialization. Firestore Admin SDK might not be working correctly.');
  }
} else if (!adminInitialized) {
    console.warn('[firebaseAdmin] Admin SDK was not initialized. Exported admin services will be non-functional.');
}


// Export the instances. They will be undefined if initialization failed.
// Type assertions are used to satisfy TypeScript's expectation of the export type,
// but runtime checks in consuming code are crucial.
export const adminDb = tempAdminDb as admin.firestore.Firestore;
export const adminAuth = tempAdminAuth as admin.auth.Auth;
export const adminStorage = tempAdminStorage as admin.storage.Storage;
