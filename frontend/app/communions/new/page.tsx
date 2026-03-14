'use client';

import dynamic from 'next/dynamic';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const CommunionCreateContent = dynamic(() => import('./CommunionCreateContent'), {
  loading: () => (
    <AuthenticatedLayout>
      <p className="text-gray-600">Loading…</p>
    </AuthenticatedLayout>
  ),
});

export default function CommunionCreatePage() {
  return <CommunionCreateContent />;
}
