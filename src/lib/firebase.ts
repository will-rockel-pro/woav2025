
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/config/firebase';

// Basic check for obviously missing or placeholder values
if (
  !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_') || firebaseConfig.apiKey.includes('your_') ||
  !firebaseConfig.authDomain || firebaseConfig.authDomain.includes('YOUR_') || firebaseConfig.authDomain.includes('your_') ||
  !firebaseConfig.projectId || firebaseConfig.projectId.includes('YOUR_') || firebaseConfig.projectId.includes('your_')
) {
  console.warn(
    `WARNING: Firebase configuration in .env.local might be missing or using placeholder values. ` +
    `Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are correctly set. ` +
    `\n  Current apiKey: '${firebaseConfig.apiKey}'` +
    `\n  Current authDomain: '${firebaseConfig.authDomain}'` +
    `\n  Current projectId: '${firebaseConfig.projectId}'`
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
