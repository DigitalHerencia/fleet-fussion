import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { getOrganizationId } from "@/lib/auth/utils";
import { getDriverComplianceStatuses, type DriverComplianceRow } from "@/lib/fetchers/complianceFetchers";
export async function DriverComplianceTable() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return <p className="text-red-500">Organization not found.</p>;
  }
  const drivers: DriverComplianceRow[] = await getDriverComplianceStatuses(orgId);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader className="bg-neutral-900">
          <TableRow>
            <TableHead>Driver Name</TableHead>
            <TableHead>CDL Status</TableHead>
            <TableHead>Medical Status</TableHead>
            <TableHead>HOS Status</TableHead>
            <TableHead>Last Violation</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No drivers found
              </TableCell>
            </TableRow>
          ) : (
            drivers.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{d.cdlStatus}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{d.medicalStatus}</Badge>
                </TableCell>
                <TableCell>{d.hosStatus}</TableCell>
                <TableCell>{d.lastViolation ? new Date(d.lastViolation).toLocaleDateString() : 'None'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
