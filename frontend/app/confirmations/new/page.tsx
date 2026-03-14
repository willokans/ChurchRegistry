'use client';

import dynamic from 'next/dynamic';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const ConfirmationCreateContent = dynamic(() => import('./ConfirmationCreateContent'), {
  loading: () => (
    <AuthenticatedLayout>
      <p className="text-gray-600">Loading…</p>
    </AuthenticatedLayout>
  ),
});

export default function ConfirmationCreatePage() {
  return <ConfirmationCreateContent />;
}
