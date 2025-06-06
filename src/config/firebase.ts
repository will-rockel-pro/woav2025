
// src/config/firebase.ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Instructions for the user:
// Create a .env.local file in the root of your project and add your Firebase config:
/*
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
*/

// IMPORTANT: YOU MUST UPDATE YOUR FIRESTORE SECURITY RULES.
// Go to Firebase Console -> Firestore Database -> Rules and replace with:
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /collections/{collectionId} {
      // Allow public read if published is true
      // Allow authenticated user to read their own collections (even if not published)
      allow read: if resource.data.published == true ||
                     (request.auth != null && resource.data.owner == request.auth.uid);

      allow create: if request.auth != null && request.resource.data.owner == request.auth.uid;
      allow update: if request.auth != null && resource.data.owner == request.auth.uid;
      allow delete: if request.auth != null && resource.data.owner == request.auth.uid;
    }

    match /users/{userId} {
      // Allow anyone to read user profiles (needed for displaying owner info)
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /links/{linkId} {
      // Allow read if the link's parent collection is published OR if the user is authenticated.
      allow read: if get(/databases/$(database)/documents/collections/$(resource.data.collectionId)).data.published == true ||
                     request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              (resource.data.addedBy == request.auth.uid ||
                               get(/databases/$(database)/documents/collections/$(resource.data.collectionId)).data.owner == request.auth.uid);
    }
  }
}
*/

