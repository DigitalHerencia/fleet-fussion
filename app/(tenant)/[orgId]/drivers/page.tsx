import DriverListPage from '@/features/drivers/DriverListPage';
import { Suspense } from 'react';

export default async function DriversPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Drivers</h1>
      <Suspense fallback={<div>Loading drivers...</div>}>
        <DriverListPage orgId={orgId} />
      </Suspense>
    </main>
  );
}
