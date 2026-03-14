'use client';

import dynamic from 'next/dynamic';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const MarriageCreateContent = dynamic(() => import('./MarriageCreateContent'), {
  loading: () => (
    <AuthenticatedLayout>
      <p className="text-gray-600">Loading…</p>
    </AuthenticatedLayout>
  ),
});

export default function MarriageCreatePage() {
  return <MarriageCreateContent />;
}
