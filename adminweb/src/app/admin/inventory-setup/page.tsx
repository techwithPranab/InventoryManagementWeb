'use client';

import { Suspense } from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import InventorySetupContent from './InventorySetupContent';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function InventorySetup() {
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingFallback />}>
        <InventorySetupContent />
      </Suspense>
    </AdminLayout>
  );
}
