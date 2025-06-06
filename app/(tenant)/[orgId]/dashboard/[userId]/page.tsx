/**
 * Dashboard Page
 * 
 * Main dashboard showing key metrics, recent activity, and quick actions
 */

import { Suspense } from 'react'
import FleetOverviewHeader from '@/features/dashboard/fleet-overview-header'
import KpiGrid from '@/features/dashboard/kpi-grid'
import QuickActionsWidget from '@/features/dashboard/quick-actions-widget'
import RecentAlertsWidget from '@/features/dashboard/recent-alerts-widget'
import TodaysScheduleWidget from '@/features/dashboard/todays-schedule-widget'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default async function DashboardPage({ 
  params 
}: { 
  params: Promise<{ orgId: string; userId: string }> 
}) {
  const { orgId, userId } = await params;

  return (
    <div className="pt-8 space-y-6 p-6 min-h-screen bg-neutral-900">
      {/* Fleet Overview Header */}
      <Suspense fallback={<DashboardSkeleton />}>
        <FleetOverviewHeader orgId={orgId} />
      </Suspense>

      {/* Bottom Widgets Grid (now on top) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<DashboardSkeleton />}>
          <QuickActionsWidget />
        </Suspense>
        <Suspense fallback={<DashboardSkeleton />}>
          <RecentAlertsWidget orgId={orgId} />
        </Suspense>
        <Suspense fallback={<DashboardSkeleton />}>
          <TodaysScheduleWidget orgId={orgId} />
        </Suspense>
      </div>

      {/* KPI Grid */}
      <div>
        <Suspense fallback={<DashboardSkeleton />}>
          <KpiGrid orgId={orgId} />
        </Suspense>
      </div>
    </div>
  )
}
