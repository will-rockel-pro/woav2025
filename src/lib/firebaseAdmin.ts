
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!serviceAccountKeyJson) {
  console.error('[firebaseAdmin] CRITICAL ERROR: The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. This is required for Firebase Admin SDK initialization. Please download your service account key from Firebase Console > Project Settings > Service accounts and set its JSON content to this environment variable.');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set.');
}

if (!projectId) {
  console.error('[firebaseAdmin] CRITICAL ERROR: The NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set. This is required for Firebase Admin SDK initialization.');
  throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
}

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });
    console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully via initializeApp.');
  } catch (e: any) {
    console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message, e.stack);
    throw new Error(
      'Failed to initialize Firebase Admin SDK. Ensure FIREBASE_SERVICE_ACCOUNT_KEY_JSON is valid and NEXT_PUBLIC_FIREBASE_PROJECT_ID is set. Original error: ' + e.message
    );
  }
} else {
  console.log('[firebaseAdmin] Firebase Admin SDK already initialized (admin.apps.length > 0).');
}

// Get instances after potential initialization
const tempAdminAuth = admin.auth();
const tempAdminDb = admin.firestore();
const tempAdminStorage = admin.storage();

// Verification step for adminDb
if (tempAdminDb && typeof tempAdminDb.collection === 'function') {
  console.log('[firebaseAdmin] Verification: tempAdminDb instance appears VALID before export. Type:', typeof tempAdminDb);
} else {
  console.error('[firebaseAdmin] CRITICAL VERIFICATION FAILURE: tempAdminDb instance is INVALID before export. Type:', typeof tempAdminDb, 'Does it have .collection?', !!(tempAdminDb as any)?.collection);
  // This indicates a fundamental issue with admin.firestore() or the admin SDK state.
  // To prevent further errors, we might throw here or ensure downstream code can handle a non-functional db.
  // For now, the error log is the most important diagnostic.
  // throw new Error('[firebaseAdmin] adminDb could not be correctly initialized or retrieved from admin.firestore().');
}

export const adminAuth = tempAdminAuth;
export const adminDb = tempAdminDb;
export const adminStorage = tempAdminStorage;
