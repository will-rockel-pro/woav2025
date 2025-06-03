
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

try {
  const serviceAccount = JSON.parse(serviceAccountKeyJson);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Optional: if not auto-detected or for RTDB
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Ensure this is set for clarity
    });
  }
} catch (e: any) {
  console.error('Firebase Admin SDK service account JSON parsing error:', e.message);
  throw new Error(
    'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Ensure it is valid JSON. ' + e.message
  );
}


export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage(); // If you need admin access to storage
