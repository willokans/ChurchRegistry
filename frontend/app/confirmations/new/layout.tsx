import { Suspense } from 'react';

export default function NewConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<p className="text-gray-600">Loading…</p>}>{children}</Suspense>;
}
