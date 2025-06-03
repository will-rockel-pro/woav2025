
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountKeyJson) {
  const errorMessage = '[firebaseAdmin] CRITICAL ERROR: The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. This is required for Firebase Admin SDK initialization. Please download your service account key from Firebase Console > Project Settings > Service accounts and set its JSON content to this environment variable.';
  console.error(errorMessage);
  // In a server environment, failing hard here is often appropriate
  // as many functionalities will depend on the Admin SDK.
  throw new Error(errorMessage);
}

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // projectId is usually inferred from the service account.
      // If you have issues, you can explicitly add:
      // projectId: serviceAccount.project_id,
    });
    console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
  } catch (e: any) {
    console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message, e.stack);
    // Re-throw to ensure the server fails loudly if admin SDK can't init
    // This helps in diagnosing startup problems.
    throw new Error(`Failed to initialize Firebase Admin SDK: ${e.message}`);
  }
} else {
  // This case is normal if the module is imported multiple times in a hot-reloading dev environment
  // console.log('[firebaseAdmin] Firebase Admin SDK already initialized.');
}

// Export initialized services
// These should be valid if initializeApp succeeded or was already done.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
