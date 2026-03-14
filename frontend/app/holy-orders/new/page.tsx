'use client';

import dynamic from 'next/dynamic';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const HolyOrderCreateContent = dynamic(() => import('./HolyOrderCreateContent'), {
  loading: () => (
    <AuthenticatedLayout>
      <p className="text-gray-600">Loading…</p>
    </AuthenticatedLayout>
  ),
});

export default function HolyOrderCreatePage() {
  return <HolyOrderCreateContent />;
}
