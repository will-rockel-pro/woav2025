
import admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!serviceAccountKeyJson) {
  throw new Error(
    'The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. ' +
    'This is required for Firebase Admin SDK initialization. ' +
    'Please download your service account key from Firebase Console > Project Settings > Service accounts ' +
    'and set its JSON content to this environment variable.'
  );
}

if (!projectId) {
  throw new Error(
    'The NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set. ' +
    'This is required for Firebase Admin SDK initialization.'
  );
}

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });
    console.log('[firebaseAdmin] Firebase Admin SDK initialized successfully.');
  } catch (e: any) {
    console.error('[firebaseAdmin] Firebase Admin SDK initialization error:', e.message, e.stack);
    // Throw a more specific error to halt execution if init fails
    throw new Error(
      'Failed to initialize Firebase Admin SDK. Ensure FIREBASE_SERVICE_ACCOUNT_KEY_JSON is valid and NEXT_PUBLIC_FIREBASE_PROJECT_ID is set. Original error: ' + e.message
    );
  }
} else {
  // console.log('[firebaseAdmin] Firebase Admin SDK already initialized.');
}

// Export the initialized services
const adminAuth = admin.auth();
const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { adminAuth, adminDb, adminStorage };
