
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app = getApps().length > 0 ? getApp() : null;

export function initializeAppIfNeeded(config: FirebaseOptions) {
  if (!app) {
    if (
      !config.apiKey || config.apiKey.includes('YOUR_') ||
      !config.authDomain || config.authDomain.includes('YOUR_') ||
      !config.projectId || config.projectId.includes('YOUR_')
    ) {
      console.warn(
        `WARNING: Firebase configuration might be missing or using placeholder values.`
      );
      // We don't initialize if the config is clearly invalid.
      // This can happen during build if env vars are not set.
      return;
    }
    app = initializeApp(config);
  }
  return app;
}

function getInitializedApp() {
  if (!app) {
    // This case might happen if a component tries to use firebase before the provider has initialized.
    // Throwing an error makes it clear what the problem is.
    throw new Error(
      "Firebase has not been initialized. Make sure your app is wrapped in a FirebaseProvider."
    );
  }
  return app;
}

// Lazy-loaded instances
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

export const auth = new Proxy({}, {
  get: (target, prop) => {
    if (!authInstance) authInstance = getAuth(getInitializedApp());
    return (authInstance as any)[prop];
  }
}) as ReturnType<typeof getAuth>;

export const db = new Proxy({}, {
  get: (target, prop) => {
    if (!dbInstance) dbInstance = getFirestore(getInitializedApp());
    return (dbInstance as any)[prop];
  }
}) as ReturnType<typeof getFirestore>;

export const storage = new Proxy({}, {
  get: (target, prop) => {
    if (!storageInstance) storageInstance = getStorage(getInitializedApp());
    return (storageInstance as any)[prop];
  }
}) as ReturnType<typeof getStorage>;

export const googleProvider = new Proxy({}, {
  get: (target, prop) => {
    if (!googleProviderInstance) googleProviderInstance = new GoogleAuthProvider();
    return (googleProviderInstance as any)[prop];
  }
}) as GoogleAuthProvider;

// We export `app` as a function now to ensure it's always initialized when called.
export { getInitializedApp as app };
