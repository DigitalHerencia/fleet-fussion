"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/database/db";
import { hasPermission } from "@/lib/auth/permissions";
import { getOrganizationKPIs } from "@/lib/fetchers/kpiFetchers";
import type { OrganizationKPIs } from "@/types/kpi";

export interface DashboardActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Get dashboard overview statistics
 */
export async function getDashboardOverviewAction(): Promise<DashboardActionResult<OrganizationKPIs>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { organizationId: true, role: true }
    });

    if (!user?.organizationId) {
      return { success: false, error: "User organization not found" };
    }

    const overview = await getOrganizationKPIs(user.organizationId);

    // Revalidate to keep dashboard data fresh
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true, data: overview };
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get dashboard overview"
    };
  }
}

/**
 * Get recent activities for dashboard
 */


/**
 * Get dashboard alerts and notifications
 */
export type DashboardAlert = {
  id: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  type: string;
};

export async function getDashboardAlertsAction(organizationId: string): Promise<DashboardActionResult<DashboardAlert[]>> {
  if (!organizationId) {
    return { success: false, error: "Organization ID is required." };
  }
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const alerts: Array<{
      id: string;
      message: string;
      severity: string;
      timestamp: string;
      type: string;
    }> = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 1. Vehicle maintenance alerts
    const vehicleMaintenanceAlerts = await prisma.vehicle.findMany({
      where: {
        organizationId,
        OR: [
          {
            nextInspectionDue: {
              lte: thirtyDaysFromNow,
            },
          },
          {
            insuranceExpiration: {
              lte: thirtyDaysFromNow,
            },
          },
          {
            registrationExpiration: {
              lte: thirtyDaysFromNow,
            },
          },
        ],
      },
      select: {
        id: true,
        unitNumber: true,
        nextInspectionDue: true,
        insuranceExpiration: true,
        registrationExpiration: true,
      },
    });

    vehicleMaintenanceAlerts.forEach(vehicle => {
      if (vehicle.nextInspectionDue && vehicle.nextInspectionDue <= thirtyDaysFromNow) {
        const daysUntilDue = Math.ceil((vehicle.nextInspectionDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `vehicle-inspection-${vehicle.id}`,
          message: `Vehicle ${vehicle.unitNumber} inspection ${daysUntilDue <= 0 ? 'overdue' : `due in ${daysUntilDue} days`}`,
          severity: daysUntilDue <= 7 ? "high" : "medium",
          timestamp: new Date().toISOString(),
          type: "vehicle_maintenance",
        });
      }
      
      if (vehicle.insuranceExpiration && vehicle.insuranceExpiration <= thirtyDaysFromNow) {
        const daysUntilDue = Math.ceil((vehicle.insuranceExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `vehicle-insurance-${vehicle.id}`,
          message: `Vehicle ${vehicle.unitNumber} insurance ${daysUntilDue <= 0 ? 'expired' : `expires in ${daysUntilDue} days`}`,
          severity: daysUntilDue <= 7 ? "high" : "medium",
          timestamp: new Date().toISOString(),
          type: "vehicle_insurance",
        });
      }
    });

    // 2. Driver license expiration alerts
    const driverAlerts = await prisma.driver.findMany({
      where: {
        organizationId,
        status: 'active',
        OR: [
          {
            licenseExpiration: {
              lte: thirtyDaysFromNow,
            },
          },
          {
            medicalCardExpiration: {
              lte: thirtyDaysFromNow,
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        licenseExpiration: true,
        medicalCardExpiration: true,
      },
    });

    driverAlerts.forEach(driver => {
      if (driver.licenseExpiration && driver.licenseExpiration <= thirtyDaysFromNow) {
        const daysUntilDue = Math.ceil((driver.licenseExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `driver-license-${driver.id}`,
          message: `Driver ${driver.firstName} ${driver.lastName} license ${daysUntilDue <= 0 ? 'expired' : `expires in ${daysUntilDue} days`}`,
          severity: daysUntilDue <= 7 ? "high" : "medium",
          timestamp: new Date().toISOString(),
          type: "driver_license",
        });
      }
      
      if (driver.medicalCardExpiration && driver.medicalCardExpiration <= thirtyDaysFromNow) {
        const daysUntilDue = Math.ceil((driver.medicalCardExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `driver-medical-${driver.id}`,
          message: `Driver ${driver.firstName} ${driver.lastName} medical card ${daysUntilDue <= 0 ? 'expired' : `expires in ${daysUntilDue} days`}`,
          severity: daysUntilDue <= 7 ? "high" : "medium",
          timestamp: new Date().toISOString(),
          type: "driver_medical",
        });
      }
    });

    // 3. Load-related alerts (overdue, unassigned)
    const overdueLoads = await prisma.load.findMany({
      where: {
        organizationId,
        status: 'assigned',
        scheduledPickupDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        loadNumber: true,
        customerName: true,
      },
      take: 5, // Limit to recent alerts
    });

    overdueLoads.forEach(load => {
      alerts.push({
        id: `load-overdue-${load.id}`,
        message: `Load ${load.loadNumber} pickup is overdue (Customer: ${load.customerName})`,
        severity: "high",
        timestamp: new Date().toISOString(),
        type: "load_overdue",
      });
    });

    // Sort alerts by severity and timestamp
    const severityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
    const sortedAlerts = alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Ensure type safety for severity
    const typedAlerts: DashboardAlert[] = sortedAlerts.slice(0, 10).map(a => ({
      ...a,
      severity: (a.severity === 'high' || a.severity === 'medium' || a.severity === 'low') ? a.severity : 'low',
    }));

    return { success: true, data: typedAlerts }; // Return top 10 alerts
  } catch (error) {
    console.error("Error fetching dashboard alerts:", error);
    return { success: false, error: "Failed to fetch alerts." };
  }
}

/**
 * Get today's schedule for the dashboard
 */
export type DashboardScheduleItem = {
  id: string;
  description: string;
  timePeriod: string;
  count: number;
  type: string;
};

export async function getTodaysScheduleAction(organizationId: string): Promise<DashboardActionResult<DashboardScheduleItem[]>> {
  if (!organizationId) {
    return { success: false, error: "Organization ID is required." };
  }
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get today's scheduled pickups
    const scheduledPickups = await prisma.load.count({
      where: {
        organizationId,
        scheduledPickupDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['assigned', 'pending'],
        },
      },
    });

    // Get today's scheduled deliveries
    const scheduledDeliveries = await prisma.load.count({
      where: {
        organizationId,
        scheduledDeliveryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['in_transit', 'assigned'],
        },
      },
    });

    // Get vehicles scheduled for maintenance today
    const maintenanceScheduled = await prisma.vehicle.count({
      where: {
        organizationId,
        nextInspectionDue: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Get active loads in transit
    const loadsInTransit = await prisma.load.count({
      where: {
        organizationId,
        status: 'in_transit',
      },
    });

    const scheduleItems = [];

    if (scheduledPickups > 0) {
      scheduleItems.push({
        id: "pickups",
        description: `${scheduledPickups} load${scheduledPickups !== 1 ? 's' : ''} scheduled for pickup`,
        timePeriod: "Today",
        count: scheduledPickups,
        type: "pickup",
      });
    }

    if (scheduledDeliveries > 0) {
      scheduleItems.push({
        id: "deliveries",
        description: `${scheduledDeliveries} load${scheduledDeliveries !== 1 ? 's' : ''} scheduled for delivery`,
        timePeriod: "Today",
        count: scheduledDeliveries,
        type: "delivery",
      });
    }

    if (maintenanceScheduled > 0) {
      scheduleItems.push({
        id: "maintenance",
        description: `${maintenanceScheduled} vehicle${maintenanceScheduled !== 1 ? 's' : ''} scheduled for maintenance`,
        timePeriod: "Today",
        count: maintenanceScheduled,
        type: "maintenance",
      });
    }

    if (loadsInTransit > 0) {
      scheduleItems.push({
        id: "in-transit",
        description: `${loadsInTransit} load${loadsInTransit !== 1 ? 's' : ''} currently in transit`,
        timePeriod: "Active",
        count: loadsInTransit,
        type: "in_transit",
      });
    }

    // If no scheduled items, provide a default message
    if (scheduleItems.length === 0) {
      scheduleItems.push({
        id: "no-schedule",
        description: "No scheduled activities for today",
        timePeriod: "Today",
        count: 0,
        type: "none",
      });
    }

    return { success: true, data: scheduleItems };
  } catch (error) {
    console.error("Error fetching today's schedule:", error);
    return { success: false, error: "Failed to fetch schedule." };
  }
}

/**
 * Get dashboard performance metrics
 */

/**
 * Refresh dashboard data
 */
export async function refreshDashboardAction(): Promise<DashboardActionResult<{ message: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Revalidate dashboard-related paths
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true, data: { message: "Dashboard data refreshed" } };
  } catch (error) {
    console.error("Refresh dashboard error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refresh dashboard"
    };
  }
}
