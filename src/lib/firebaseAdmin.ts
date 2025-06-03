
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountKeyJson) {
  const errorMessage = '[firebaseAdmin] CRITICAL ERROR: The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. This is required for Firebase Admin SDK initialization. Please download your service account key from Firebase Console > Project Settings > Service accounts and set its JSON content to this environment variable.';
  console.error(errorMessage);
  // In a server environment, failing hard here is often appropriate
  // as many functionalities will depend on the Admin SDK.
  throw new Error(errorMessage);
}

let adminAppInstance: admin.app.App;

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    adminAppInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
  } catch (e: any) {
    console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message, e.stack);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${e.message}`);
  }
} else {
  adminAppInstance = admin.app(); // Get the default app if already initialized
  // console.log('[firebaseAdmin] Firebase Admin SDK already initialized. Using existing app.');
}

export const adminAuth = adminAppInstance.auth();
export const adminDb = adminAppInstance.firestore();
export const adminStorage = adminAppInstance.storage();

// Basic check to see if adminDb seems like a valid Firestore instance after initialization
if (typeof adminDb?.collection !== 'function') {
  console.error('[firebaseAdmin] CRITICAL VALIDATION FAILURE: adminDb.collection is not a function after initialization. Firestore Admin SDK might not be working correctly.');
}
