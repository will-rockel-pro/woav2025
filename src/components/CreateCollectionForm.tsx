"use client";

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Assuming you export db and auth from this file
import { useAuthState } from 'react-firebase-hooks/auth'; // Using react-firebase-hooks for auth state

const CreateCollectionForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, authLoading, authError] = useAuthState(auth);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError('You must be signed in to create a collection.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'collections'), {
        title,
        description,
        userId: user.uid,
        createdAt: new Date(), // Optional: add a timestamp
      });
      setTitle('');
      setDescription('');
      console.log('Collection created successfully!');
      // Optionally provide user feedback (e.g., a success message)
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating collection:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <p>Loading user...</p>;
  }

  if (authError) {
    return <p>Error loading user: {authError.message}</p>;
  }

  if (!user) {
    return <p>Please sign in to create a collection.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        ></textarea>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Collection'}
      </button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </form>
  );
};

export default CreateCollectionForm;