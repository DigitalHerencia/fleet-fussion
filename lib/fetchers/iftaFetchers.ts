"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/database/db";
import { getCachedData, setCachedData, CACHE_TTL } from "@/lib/cache/auth-cache";

/**
 * Check user access to organization
 */
async function checkUserAccess(organizationId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { organizationId: true, role: true },
  });

  if (!user?.organizationId || user.organizationId !== organizationId) {
    throw new Error("Access denied");
  }

  return user;
}

/**
 * Get IFTA data for a specific period
 */
import type { IftaData, IftaJurisdictionSummary } from "@/types/ifta"

export async function getIftaDataForPeriod(orgId: string, quarter: string, year: string): Promise<IftaData> {
  try {
    await checkUserAccess(orgId);

    const quarterNum = parseInt(quarter.replace('Q', ''));
    const yearNum = parseInt(year);

    if (isNaN(quarterNum) || isNaN(yearNum) || quarterNum < 1 || quarterNum > 4) {
      throw new Error("Invalid quarter or year format");
    }

    const cacheKey = `ifta:${orgId}:${year}:Q${quarterNum}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range for the quarter
    const startMonth = (quarterNum - 1) * 3;
    const startDate = new Date(yearNum, startMonth, 1);
    const endDate = new Date(yearNum, startMonth + 3, 0, 23, 59, 59);

    // Get trip data for the period
    const trips = await prisma.iftaTrip.findMany({
      where: {
        organizationId: orgId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            unitNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Get fuel purchase data for the period
    const fuelPurchases = await prisma.iftaFuelPurchase.findMany({
      where: {
        organizationId: orgId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            unitNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate summary statistics
    const totalMiles = trips.reduce((sum, trip) => sum + trip.distance, 0);
    const totalGallons = fuelPurchases.reduce((sum, purchase) => sum + Number(purchase.gallons), 0);
    const averageMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
    const totalFuelCost = fuelPurchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0);

    // Group by jurisdiction
    const jurisdictionSummary = trips.reduce((acc, trip) => {
      const jurisdiction = trip.jurisdiction;
      if (!acc[jurisdiction]) {
        acc[jurisdiction] = {
          jurisdiction,
          miles: 0,
          fuelGallons: 0,
          taxPaid: 0,
        };
      }
      acc[jurisdiction].miles += trip.distance;
      return acc;
    }, {} as Record<string, IftaJurisdictionSummary>);

    // Add fuel data to jurisdiction summary
    fuelPurchases.forEach(purchase => {
      const jurisdiction = purchase.jurisdiction;
      if (jurisdictionSummary[jurisdiction]) {
        jurisdictionSummary[jurisdiction].fuelGallons += Number(purchase.gallons);
      }
    });

    // Check for existing IFTA report for this period
    const existingReport = await prisma.iftaReport.findFirst({
      where: {
        organizationId: orgId,
        quarter: quarterNum,
        year: yearNum,
      },
    });

    const result = {
      period: { quarter: quarterNum, year: yearNum },
      summary: {
        totalMiles,
        totalGallons,
        averageMpg: Math.round(averageMpg * 100) / 100,
        totalFuelCost,
      },
      trips: trips.map(trip => ({
        id: trip.id,
        date: trip.date,
        vehicleId: trip.vehicleId,
        vehicle: trip.vehicle,
        jurisdiction: trip.jurisdiction,
        distance: trip.distance,
        fuelUsed: trip.fuelUsed ? Number(trip.fuelUsed) : null,
        notes: trip.notes,
      })),
      fuelPurchases: fuelPurchases.map(purchase => ({
        id: purchase.id,
        date: purchase.date,
        vehicleId: purchase.vehicleId,
        vehicle: purchase.vehicle,
        jurisdiction: purchase.jurisdiction,
        gallons: Number(purchase.gallons),
        amount: Number(purchase.amount),
        vendor: purchase.vendor,
        receiptNumber: purchase.receiptNumber,
        notes: purchase.notes,
      })),
      jurisdictionSummary: Object.values(jurisdictionSummary),
      report: existingReport ? {
        id: existingReport.id,
        status: existingReport.status,
        submittedAt: existingReport.submittedAt,
        dueDate: existingReport.dueDate,
      } : null,
    };

    // Cache the result for 1 hour
    setCachedData(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  } catch (error) {
    console.error("Error fetching IFTA data:", error);
    throw new Error("Failed to fetch IFTA data");
  }
}

/**
 * Get IFTA trip data with filters
 */
export async function getIftaTripData(
  orgId: string,
  filters: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    jurisdiction?: string;
  } = {}
) {
  try {
    await checkUserAccess(orgId);

    const where: any = {
      organizationId: orgId,
    };

    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters.jurisdiction) {
      where.jurisdiction = filters.jurisdiction;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const trips = await prisma.iftaTrip.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            unitNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return {
      success: true,
      data: trips.map(trip => ({
        id: trip.id,
        date: trip.date,
        vehicleId: trip.vehicleId,
        vehicle: trip.vehicle,
        jurisdiction: trip.jurisdiction,
        distance: trip.distance,
        fuelUsed: trip.fuelUsed ? Number(trip.fuelUsed) : null,
        notes: trip.notes,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching IFTA trip data:", error);
    throw new Error("Failed to fetch IFTA trip data");
  }
}

/**
 * Get IFTA fuel purchase data with filters
 */
export async function getIftaFuelPurchases(
  orgId: string,
  filters: {
    vehicleId?: string;
    startDate?: string;
    endDate?: string;
    jurisdiction?: string;
  } = {}
) {
  try {
    await checkUserAccess(orgId);

    const where: any = {
      organizationId: orgId,
    };

    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters.jurisdiction) {
      where.jurisdiction = filters.jurisdiction;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const purchases = await prisma.iftaFuelPurchase.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            unitNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return {
      success: true,
      data: purchases.map(purchase => ({
        id: purchase.id,
        date: purchase.date,
        vehicleId: purchase.vehicleId,
        vehicle: purchase.vehicle,
        jurisdiction: purchase.jurisdiction,
        gallons: Number(purchase.gallons),
        amount: Number(purchase.amount),
        vendor: purchase.vendor,
        receiptNumber: purchase.receiptNumber,
        notes: purchase.notes,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching IFTA fuel purchases:", error);
    throw new Error("Failed to fetch IFTA fuel purchases");
  }
}

/**
 * Get IFTA reports for organization
 */
export async function getIftaReports(orgId: string, year?: number) {
  try {
    await checkUserAccess(orgId);

    const where: any = {
      organizationId: orgId,
    };

    if (year) {
      where.year = year;
    }

    const reports = await prisma.iftaReport.findMany({
      where,
      include: {
        submittedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { quarter: 'desc' },
      ],
    });

    return {
      success: true,
      data: reports.map(report => ({
        id: report.id,
        quarter: report.quarter,
        year: report.year,
        status: report.status,
        totalMiles: report.totalMiles,
        totalGallons: report.totalGallons ? Number(report.totalGallons) : null,
        totalTaxOwed: report.totalTaxOwed ? Number(report.totalTaxOwed) : null,
        totalTaxPaid: report.totalTaxPaid ? Number(report.totalTaxPaid) : null,
        submittedAt: report.submittedAt,
        submittedBy: report.submittedByUser,
        dueDate: report.dueDate,
        filedDate: report.filedDate,
        reportFileUrl: report.reportFileUrl,
        notes: report.notes,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching IFTA reports:", error);
    throw new Error("Failed to fetch IFTA reports");
  }
}
