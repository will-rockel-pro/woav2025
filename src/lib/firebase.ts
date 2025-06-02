
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/config/firebase';

// More robust check for critical Firebase configuration
const placeholderChecks = {
  apiKey: ['your_api_key', 'YOUR_API_KEY', 'YOUR-API-KEY'],
  projectId: ['your_project_id', 'YOUR_PROJECT_ID', 'your-project-id', 'your-project'],
  authDomain: ['your_auth_domain', 'YOUR_AUTH_DOMAIN', 'your-auth-domain.firebaseapp.com'],
};

const isPlaceholder = (value: string | undefined, type: keyof typeof placeholderChecks): boolean => {
  if (!value) return true; // Missing is a problem
  return placeholderChecks[type].some(placeholder => value.toLowerCase().includes(placeholder.toLowerCase()));
};

if (
  isPlaceholder(firebaseConfig.apiKey, 'apiKey') ||
  isPlaceholder(firebaseConfig.projectId, 'projectId') ||
  isPlaceholder(firebaseConfig.authDomain, 'authDomain') || // Auth domain is crucial for auth operations
  !firebaseConfig.storageBucket || // Also check other potentially important fields
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  const message =
    `CRITICAL FIREBASE CONFIG ERROR: Firebase configuration appears to be missing, incomplete, or using placeholder values. ` +
    `This is often due to an incorrect or missing .env.local file at the root of your project, or the environment variables not being loaded correctly. ` +
    `\n\nEXPECTED IN .env.local (create this file in your project root if it doesn't exist):` +
    `\n  NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY_FROM_FIREBASE_CONSOLE` +
    `\n  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_ACTUAL_AUTH_DOMAIN_FROM_FIREBASE_CONSOLE` +
    `\n  NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_ACTUAL_PROJECT_ID_FROM_FIREBASE_CONSOLE` +
    `\n  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_ACTUAL_STORAGE_BUCKET_FROM_FIREBASE_CONSOLE` +
    `\n  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_ACTUAL_MESSAGING_SENDER_ID_FROM_FIREBASE_CONSOLE` +
    `\n  NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_ACTUAL_APP_ID_FROM_FIREBASE_CONSOLE` +
    `\n\nCURRENT CONFIG VALUES LOADED BY THE APP:` +
    `\n  apiKey: '${firebaseConfig.apiKey}'` +
    `\n  authDomain: '${firebaseConfig.authDomain}'` +
    `\n  projectId: '${firebaseConfig.projectId}'` +
    `\n  storageBucket: '${firebaseConfig.storageBucket}'` +
    `\n  messagingSenderId: '${firebaseConfig.messagingSenderId}'` +
    `\n  appId: '${firebaseConfig.appId}'` +
    `\n\nPlease verify these values against your Firebase project settings in the Firebase Console. ` +
    `The application will NOT work correctly until this is fixed. If you've just updated .env.local, try restarting your development server.`;

  console.error(message);
  // For server-side and client-side during development, throwing an error is more direct.
  // This makes the issue unmissable.
  if (process.env.NODE_ENV === 'development') {
    throw new Error(message);
  }
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// These lines will throw errors if initializeApp succeeded but the config is still invalid from Firebase's perspective (e.g. auth/invalid-api-key)
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
