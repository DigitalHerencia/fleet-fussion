import { listDriversByOrg } from "@/lib/fetchers/driverFetchers";
import DriverListPage from "@/features/drivers/DriverListPage";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export default async function DriversPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const result = await listDriversByOrg(orgId);
  if (!result || !Array.isArray(result.drivers)) return notFound();

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Drivers</h1>
      <Suspense fallback={<div>Loading drivers...</div>}>
        <DriverListPage orgId={orgId} />
      </Suspense>
    </main>
  );
}
