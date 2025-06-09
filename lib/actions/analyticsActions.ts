'use server';

import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth/auth';

import prisma from '@/lib/database/db';
import { hasPermission } from '@/lib/auth/permissions';
import { PermissionActions, ResourceTypes, SystemRoles } from '@/types/abac';
import { ClerkOrganizationMetadata } from '@/types/auth';
import type { AnalyticsActionResult } from '@/types/actions';

interface FleetMetrics {
  vehicleCount: number;
  activeVehicleCount: number;
  maintenanceVehicleCount: number;
  fleetUtilization: number;
  totalMiles: number;
}

interface LoadAnalytics {
  totalLoads: number;
  deliveredLoads: number;
  inTransitLoads: number;
  pendingLoads: number;
  completionRate: number;
}

interface ComplianceAnalytics {
  totalDocuments: number;
  expiredDocuments: number;
  expiringDocuments: number;
  complianceRate: number;
}

/**
 * Get fleet performance metrics
 */
export async function getFleetMetricsAction(
  orgId: string
): Promise<AnalyticsActionResult<FleetMetrics>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false };
    }

    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return { success: false };
    }

    const hasAccess = hasPermission(
      user,
      PermissionActions.READ,
      ResourceTypes.ORGANIZATION
    );
    if (!hasAccess) {
      return { success: false };
    }

    // Get fleet performance data
    const [
      vehicleCount,
      activeVehicleCount,
      maintenanceVehicleCount,
      totalMiles,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { organizationId: orgId } }),
      prisma.vehicle.count({
        where: { organizationId: orgId, status: 'active' },
      }),
      prisma.vehicle.count({
        where: { organizationId: orgId, status: 'maintenance' },
      }),
      prisma.vehicle.aggregate({
        where: { organizationId: orgId },
        _sum: { currentOdometer: true },
      }),
    ]);

    const metrics = {
      vehicleCount,
      activeVehicleCount,
      maintenanceVehicleCount,
      fleetUtilization:
        vehicleCount > 0 ? (activeVehicleCount / vehicleCount) * 100 : 0,
      totalMiles: totalMiles._sum.currentOdometer || 0,
    };

    return { success: true, data: metrics };
  } catch (error) {
    console.error('Get fleet metrics error:', error);
    return { success: false };
  }
}

/**
 * Get load analytics
 */
export async function getLoadAnalyticsAction(
  orgId: string
): Promise<AnalyticsActionResult<LoadAnalytics>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false };
    }

    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return { success: false };
    }

    const hasAccess = hasPermission(
      user,
      PermissionActions.READ,
      ResourceTypes.ORGANIZATION
    );
    if (!hasAccess) {
      return { success: false };
    }

    // Get load statistics
    const [totalLoads, deliveredLoads, inTransitLoads, pendingLoads] =
      await Promise.all([
        prisma.load.count({ where: { organizationId: orgId } }),
        prisma.load.count({
          where: { organizationId: orgId, status: 'delivered' },
        }),
        prisma.load.count({
          where: { organizationId: orgId, status: 'in_transit' },
        }),
        prisma.load.count({
          where: { organizationId: orgId, status: 'pending' },
        }),
      ]);

    // Calculate completion rate
    const completionRate =
      totalLoads > 0 ? (deliveredLoads / totalLoads) * 100 : 0;

    const analytics = {
      totalLoads,
      deliveredLoads,
      inTransitLoads,
      pendingLoads,
      completionRate,
    };

    return { success: true, data: analytics };
  } catch (error) {
    console.error('Get load analytics error:', error);
    return { success: false };
  }
}

/**
 * Get driver performance metrics
 */

/**
 * Get financial metrics
 */
export async function getFinancialMetricsAction(
  orgId: string
): Promise<AnalyticsActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false };
    }

    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return { success: false };
    }

    const hasAccess = hasPermission(
      user,
      PermissionActions.READ,
      ResourceTypes.ORGANIZATION
    );
    if (!hasAccess) {
      return { success: false };
    }

    // Get revenue from completed loads
    const revenueData = await prisma.load.aggregate({
      where: {
        organizationId: orgId,
        status: 'delivered',
        rate: { not: null },
      },
      _sum: { rate: true },
      _count: { id: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Get financial metrics error:', error);
    return { success: false };
  }
}

/**
 * Get compliance analytics
 */
export async function getComplianceAnalyticsAction(
  orgId: string
): Promise<AnalyticsActionResult<ComplianceAnalytics>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false };
    }

    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return { success: false };
    }

    const hasAccess = hasPermission(
      user,
      PermissionActions.READ,
      ResourceTypes.ORGANIZATION
    );
    if (!hasAccess) {
      return { success: false };
    }

    // Get compliance document statistics
    const [totalDocuments, expiredDocuments, expiringDocuments] =
      await Promise.all([
        prisma.complianceDocument.count({ where: { organizationId: orgId } }),
        prisma.complianceDocument.count({}),
        prisma.complianceDocument.count({
          where: {
            organizationId: orgId,
          },
        }),
      ]);

    const complianceRate =
      totalDocuments > 0
        ? ((totalDocuments - expiredDocuments) / totalDocuments) * 100
        : 100;

    const analytics = {
      totalDocuments,
      expiredDocuments,
      expiringDocuments,
      complianceRate,
    };

    return { success: true, data: analytics };
  } catch (error) {
    console.error('Get compliance analytics error:', error);
    return { success: false };
  }
}
