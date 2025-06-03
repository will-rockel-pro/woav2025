
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uuid: string;
  username: string; // Globally unique, not email
  profile_name: string;
  profile_picture?: string | null; // Optional URL, explicitly allow null
  // bio?: string | null; // Bio feature temporarily removed for stability
}

export interface Collection {
  id: string; // auto-generated
  title: string;
  description?: string;
  image?: string; // URL to image in Firebase Storage
  owner: string; // reference to users.uuid
  published: boolean;
  collaborators: string[]; // Array of user UUIDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Link {
  id: string; // auto-generated
  collectionId: string; // reference to collections.id
  url: string;
  title?: string; // Often fetched from URL metadata
  description?: string;
  favicon?: string; // URL to favicon
  createdAt: Timestamp;
  addedBy: string; // user UUID
}

// This is for when a user saves/bookmarks a collection created by someone else.
export interface SavedCollection {
  id: string; // auto-generated
  sourceCollectionId: string; // reference to collections.id
  userId: string; // user who saved this collection
  readOnly: true; // All saved collections are read-only copies for the saver
  createdAt: Timestamp;
}
