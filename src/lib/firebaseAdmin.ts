
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

let adminApp: admin.app.App;

if (!admin.apps.length) {
  if (!serviceAccountKeyJson) {
    console.error('[firebaseAdmin] CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. Firebase Admin SDK cannot be initialized.');
    // To prevent hard crashes, we'll export undefined for services if this happens.
    // Consuming code should check for their existence.
  } else {
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
      // Export undefined for services if initialization fails.
    }
  }
} else {
  adminApp = admin.app();
  // console.log('[firebaseAdmin] Firebase Admin SDK already initialized. Using existing app.');
}

// Assign Firestore, Auth, Storage instances. They will be undefined if adminApp isn't set.
export const adminDb = adminApp!?.firestore() as admin.firestore.Firestore;
export const adminAuth = adminApp!?.auth() as admin.auth.Auth;
export const adminStorage = adminApp!?.storage() as admin.storage.Storage;

// Basic check for the exported services.
if (adminApp && (!adminDb || typeof adminDb.collection !== 'function')) {
  console.error('[firebaseAdmin] CRITICAL VALIDATION FAILURE: adminDb.collection is NOT a function, or adminDb is undefined even after supposed initialization. Firestore Admin SDK might not be working correctly.');
}
if (adminApp && (!adminAuth || typeof adminAuth.verifyIdToken !== 'function')) {
  console.error('[firebaseAdmin] CRITICAL VALIDATION FAILURE: adminAuth.verifyIdToken is NOT a function, or adminAuth is undefined. Auth Admin SDK might not be working correctly.');
}
