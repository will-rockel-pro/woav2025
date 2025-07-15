import CreateCollectionForm from '@/components/CreateCollectionForm';

export default function CreateCollectionPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Create New Collection</h1>
      <CreateCollectionForm />
    </div>
  );
}
