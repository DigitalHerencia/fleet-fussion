import { listDriversByOrg } from "@/lib/fetchers/driverFetchers";
import { DriverCard } from "@/components/drivers/driver-card";
import { DriverForm } from "@/components/drivers/DriverForm";
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
          <DriverCard
            key={driver.id}
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
            onClick={() => {}}
          />
        ))}
      </div>
      {/* Pass a form prop as required by DriverFormProps */}
      <DriverForm
        form={{
          values: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            hireDate: "",
            homeTerminal: "",
            cdlNumber: "",
            cdlState: "",
            cdlClass: "A",
            cdlExpiration: "",
            medicalCardExpiration: "",
            tags: [],
          },
          errors: {},
          onChange: () => {},
          onSubmit: async () => {},
          submitting: false,
          mode: "create",
        }}
      />
    </div>
  );
}
