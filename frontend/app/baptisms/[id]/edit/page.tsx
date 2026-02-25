'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function BaptismEditPage() {
  const params = useParams();
  const id = params?.id ?? '';

  return (
    <AuthenticatedLayout>
      <div className="mb-4">
        <Link href={`/baptisms/${id}`} className="text-sancta-maroon hover:underline">
          ← Back to baptism record
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Edit baptism</h1>
      <p className="mt-4 text-gray-600">Edit form coming soon. Use the back link to return to the record.</p>
    </AuthenticatedLayout>
  );
}
