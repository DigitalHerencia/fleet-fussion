import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { listDriversByOrg } from '@/lib/fetchers/driverFetchers';
import DriverListPage from '@/features/drivers/DriverListPage';

// Cache control for auth-required dynamic pages
export const dynamic = 'force-dynamic';

export default async function DriversPage({
  params,
}: {
  params: Promise<{ orgId: string; userId?: string }>;
}) {
  const { orgId, userId } = await params;
  const result = await listDriversByOrg(orgId);
  if (!result || !Array.isArray(result.drivers)) return notFound();

  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-bold">Drivers</h1>
      <Suspense fallback={<div>Loading drivers...</div>}>
        <DriverListPage orgId={orgId} />
      </Suspense>
    </main>
  );
}
