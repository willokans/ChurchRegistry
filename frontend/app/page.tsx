'use client';

import { getStoredUser } from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function HomePage() {
  const user = getStoredUser();

  return (
    <AuthenticatedLayout>
      <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">
        Church Registry
      </h1>
      <p className="mt-4 text-gray-700">
        Welcome, {(user?.displayName || user?.username) ?? '…'}.
      </p>
    </AuthenticatedLayout>
  );
}
