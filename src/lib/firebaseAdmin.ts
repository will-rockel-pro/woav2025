
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountKeyJson) {
  throw new Error(
    'The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. ' +
    'This is required for Firebase Admin SDK initialization. ' +
    'Please download your service account key from Firebase Console > Project Settings > Service accounts ' +
    'and set its JSON content to this environment variable.'
  );
}

// Function to ensure Firebase Admin is initialized
export async function ensureAdminInitialized() {
  if (!admin.apps.length) {
    console.log('[firebaseAdmin] Initializing Firebase Admin SDK...');
    try {
      const serviceAccount = JSON.parse(serviceAccountKeyJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('[firebaseAdmin] Firebase Admin SDK service account JSON parsing error or initialization error:', e.message);
      // Optionally re-throw or handle as critical error
      throw new Error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON or initialize Admin SDK. Ensure it is valid JSON. ' + e.message
      );
    }
  } else {
    // console.log('[firebaseAdmin] Firebase Admin SDK already initialized.');
  }
}


// Call it once to ensure it attempts initialization when this module is loaded
ensureAdminInitialized().catch(err => {
  // This catch is to prevent unhandled promise rejection if ensureAdminInitialized throws
  // The actual error throwing is handled inside ensureAdminInitialized
  console.error("[firebaseAdmin] Initial call to ensureAdminInitialized failed:", err.message);
});

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
