import { listDriversByOrg } from "@/lib/fetchers/driverFetchers";
import { DriverCard } from "@/components/drivers/driver-card";
import { DriverFormFeature } from "@/features/drivers/DriverFormFeature";
import Link from "next/link";
import type { DriverFilters } from "@/types/drivers";

interface DriverListPageProps {
  orgId: string;
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function DriverListPage({
  orgId,
  searchParams,
}: DriverListPageProps) {
  const filters: DriverFilters = {
    page: searchParams?.page ? Number(searchParams.page) : 1,
    limit: searchParams?.limit ? Number(searchParams.limit) : 20,
  };
  if (typeof searchParams?.q === "string") {
    filters.search = searchParams.q;
  }

  const { drivers } = await listDriversByOrg(orgId, filters);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => (
          <Link key={driver.id} href={`/${orgId}/drivers/${driver.id}`}>
            <DriverCard
              driver={{
              id: driver.id ?? "",
              firstName: driver.firstName ?? "",
              lastName: driver.lastName ?? "",
              email: driver.email ?? "",
              phone: driver.phone ?? "",
              status: driver.status ?? "",
              licenseState: driver.cdlState ?? "",
              licenseExpiration:
                driver.cdlExpiration !== null && driver.cdlExpiration !== undefined
                  ? new Date(driver.cdlExpiration)
                  : new Date(0),
              medicalCardExpiration:
                driver.medicalCardExpiration !== null && driver.medicalCardExpiration !== undefined
                  ? new Date(driver.medicalCardExpiration)
                  : new Date(0),
              hireDate:
                driver.hireDate !== null && driver.hireDate !== undefined
                  ? new Date(driver.hireDate)
                  : new Date(0),
              }}
            />
          </Link>
        ))}
      </div>
      <DriverFormFeature orgId={orgId} mode="create" />
    </div>
  );
}
