import { Suspense } from 'react';

export default function NewHolyOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<p className="text-gray-600">Loading…</p>}>{children}</Suspense>;
}
