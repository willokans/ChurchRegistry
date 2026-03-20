'use client';

import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PendingSyncOutbox from '@/components/offline/PendingSyncOutbox';

export default function OfflineOutboxPage() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold text-sancta-maroon">
            Pending Sync / Outbox
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View offline submissions waiting to sync, and resolve any failures or record conflicts.
          </p>
        </div>

        <PendingSyncOutbox />
      </div>
    </AuthenticatedLayout>
  );
}

