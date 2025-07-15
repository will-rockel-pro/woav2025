
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// This function now safely handles initialization and is the single source of truth.
export const getFirebaseApp = (config: FirebaseOptions): FirebaseApp => {
  if (!getApps().length) {
    return initializeApp(config);
  }
  return getApp();
};

// We no longer try to initialize anything here. These exports are now simple functions
// that will be called by client components after initialization.

export const getFirebaseAuth = (app: FirebaseApp) => getAuth(app);
export const getFirebaseDb = (app: FirebaseApp) => getFirestore(app);
export const getFirebaseStorage = (app: FirebaseApp) => getStorage(app);
export const getGoogleAuthProvider = () => new GoogleAuthProvider();

// The direct exports below are removed to prevent uninitialized access.
// Components should now use the provider to get initialized services.
// export const auth = getAuth(getFirebaseApp(firebaseConfig));
// export const db = getFirestore(getFirebaseApp(firebaseConfig));
// export const storage = getStorage(getFirebaseApp(firebaseConfig));
// export const googleProvider = new GoogleAuthProvider();
