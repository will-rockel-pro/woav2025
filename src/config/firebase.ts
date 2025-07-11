
// src/config/firebase.ts
import type { FirebaseOptions } from 'firebase/app';

// This object is now populated by the FirebaseProvider
export const firebaseConfig: FirebaseOptions = {};

// Instructions have been moved to README or will be handled by the provider.
// The .env.local file is still necessary for local development,
// and the values are read by the build system for deployment.

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
