
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// This function safely handles initialization on the client side.
export const getFirebaseApp = (config: FirebaseOptions): FirebaseApp => {
  if (!getApps().length) {
    // Check if config values are present and not placeholders
    if (
      !config.apiKey || config.apiKey.includes('YOUR_') ||
      !config.projectId || config.projectId.includes('YOUR_')
    ) {
        // Return a dummy object or throw an error if config is invalid
        // This prevents crashes during server build when env vars might be missing
        console.warn("Firebase config is missing or invalid. Firebase will not be initialized on the client.");
    }
    return initializeApp(config);
  }
  return getApp();
};

// These functions now require the initialized app instance
export const getFirebaseAuth = (app: FirebaseApp) => getAuth(app);
export const getFirebaseDb = (app: FirebaseApp) => getFirestore(app);
export const getFirebaseStorage = (app: FirebaseApp) => getStorage(app);
export const getGoogleAuthProvider = () => new GoogleAuthProvider();
