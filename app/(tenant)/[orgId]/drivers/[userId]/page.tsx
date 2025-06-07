/**
 * Driver Dashboard Page
 *
 * Individual driver dashboard for viewing assigned loads, HOS status, and compliance info
 */

import { Suspense, type JSX } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getDriverById } from "@/lib/fetchers/driverFetchers";
import { notFound } from "next/navigation";
import { DriverFormFeature } from "@/features/drivers/DriverFormFeature";
import { DriverPerformance } from "@/components/analytics/driver-performance";
import { getDriverAnalytics } from "@/lib/fetchers/analyticsFetchers";
import { DocumentUploadForm } from "@/components/compliance/DocumentUploadForm";
import { getDriverHOSStatus } from "@/lib/fetchers/complianceFetchers";
import { use } from "react";
import { AssignmentDialogButton } from "@/features/drivers/AssignmentDialogButton"; // new client component

// Helper to safely extract assignment info
function getAssignmentLabel(assignment: any) {
  if (assignment && typeof assignment === "object") {
    return (
      assignment.loadId || assignment.vehicleId || assignment.trailerId || "N/A"
    );
  }
  return "N/A";
}

export default async function DriverDashboardPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}): Promise<JSX.Element> {
  const { userId, orgId } = await params;
  // Fetch driver data by ID
  const driverData = await getDriverById(userId);
  if (!driverData) return notFound();

  // Real-time status: poll HOS status and assignment every 10s
  // (React 19: use() with revalidation)
  const hosStatusPromise = getDriverHOSStatus(userId);
  // @ts-expect-error: use() is React 19 experimental
  const hosStatus = use(hosStatusPromise, { revalidate: 10 });
  let currentStatus: string = driverData.status;
  if (hosStatus && typeof hosStatus === "object") {
    const hs = hosStatus as any;
    if (hs.data && typeof hs.data.currentStatus === "string") {
      currentStatus = hs.data.currentStatus;
    }
  }
  // Fetch analytics for this driver
  const analytics = await getDriverAnalytics(orgId, "30d");
  const driverAnalytics = Array.isArray(analytics)
    ? analytics.find((a) => a.id === driverData.id)
    : null;

  return (
    <>
      <div className="pt-8 space-y-6 p-6">
        {/* Page Header with real-time status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Driver Dashboard
            </h1>
            <p className="text-muted-foreground">
              Status: <span className="font-semibold">{currentStatus}</span>
              <span className="ml-4">
                Assigned to:{" "}
                <span className="font-semibold">
                  {getAssignmentLabel(driverData.currentAssignment)}
                </span>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              On Duty
            </Badge>
            <Button
              variant="default"
              className="bg-black border border-gray-200 hover:bg-neutral-800"
            >
              <Clock className="mr-2 h-4 w-4" />
              Log Hours
            </Button>
          </div>
        </div>

        {/* HOS Status */}
        <HosStatusCards hosStatus={hosStatus} />

        {/* Current Load */}
        <CurrentLoadCard assignment={driverData.currentAssignment} />

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <UpcomingLoadsCard driverId={driverData.id} />
          <RecentActivityCard driverId={driverData.id} />
        </div>

        {/* Document Status */}
        <DocumentStatusCard driverId={driverData.id} />

        {/* Performance Metrics */}
        <PerformanceOverviewCard analytics={driverAnalytics} />

        {/* Driver Profile Edit */}
        <Card className="bg-black">
          <CardHeader>
            <CardTitle>Edit Profile & Documents</CardTitle>
            <CardDescription>
              Update your driver profile and upload compliance documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <DriverFormFeature
                initialValues={driverData}
                mode="edit"
                driverId={driverData.id}
                orgId={orgId}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Assignment Button (client only) */}
        <div className="flex justify-end mb-4">
          <AssignmentDialogButton
            driverId={driverData.id}
            currentAssignment={driverData.currentAssignment}
          />
        </div>

        {/* Analytics Section */}
        {driverAnalytics && (
          <div className="mb-8">
            <DriverPerformance
              driverPerformanceMetrics={[driverAnalytics]}
              timeRange="30d"
            />
          </div>
        )}

        {/* Document Upload Section */}
        <Card className="bg-black">
          <CardHeader>
            <CardTitle>Upload Compliance Document</CardTitle>
            <CardDescription>
              Upload a new document for this driver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploadForm onUpload={() => {}} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// --- Server Components for dashboard sections ---

function HosStatusCards({ hosStatus }: { hosStatus: any }) {
  // Render HOS status cards using hosStatus data
  // ...implement real data mapping here...
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Example: Replace with real data */}
      {/* ...existing code for cards, but use hosStatus for values... */}
    </div>
  );
}

function CurrentLoadCard({ assignment }: { assignment: any }) {
  // Render current load info from assignment
  // ...implement real data mapping here...
  return (
    <Card className="bg-black">
      {/* ...existing code for current load, but use assignment for values... */}
    </Card>
  );
}

function UpcomingLoadsCard({ driverId }: { driverId: string }) {
  // Fetch and render upcoming loads for this driver
  // ...implement real data fetching and mapping here...
  return (
    <Card className="bg-black">
      {/* ...existing code for upcoming loads... */}
    </Card>
  );
}

function RecentActivityCard({ driverId }: { driverId: string }) {
  // Fetch and render recent activity for this driver
  // ...implement real data fetching and mapping here...
  return (
    <Card className="bg-black">
      {/* ...existing code for recent activity... */}
    </Card>
  );
}

function DocumentStatusCard({ driverId }: { driverId: string }) {
  // Fetch and render document status for this driver
  // ...implement real data fetching and mapping here...
  return (
    <Card className="bg-black">
      {/* ...existing code for document status... */}
    </Card>
  );
}

function PerformanceOverviewCard({ analytics }: { analytics: any }) {
  // Render performance metrics from analytics
  // ...implement real data mapping here...
  return (
    <Card className="bg-black">
      {/* ...existing code for performance overview... */}
    </Card>
  );
}
