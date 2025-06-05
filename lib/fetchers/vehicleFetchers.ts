"use server";

import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { z } from "zod";

import prisma from "@/lib/database/db";
import { vehicleFilterSchema, type VehicleFiltersData } from "@/schemas/vehicles";
import type { Vehicle, VehicleListResponse } from "@/types/vehicles";

/**
 * List vehicles for an organization with optional filtering and pagination.
 * - Validates the filter input using `vehicleFilterSchema`.
 * - Returns paginated results (vehicles, total, page, limit, totalPages).
 * - Server-first, feature-driven.
 */
export const listVehiclesByOrg = cache(async (
  orgId: string,
  filters: VehicleFiltersData = {} as VehicleFiltersData
): Promise<VehicleListResponse> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { vehicles: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }

    const parsed = vehicleFilterSchema.parse(filters);

    const where: any = { organizationId: orgId };

    if (parsed.search) {
      const term = parsed.search;
      where.OR = [
        { unitNumber: { contains: term, mode: "insensitive" } },
        { vin: { contains: term, mode: "insensitive" } },
        { make: { contains: term, mode: "insensitive" } },
        { model: { contains: term, mode: "insensitive" } },
        { licensePlate: { contains: term, mode: "insensitive" } },
      ];
    }

    if (parsed.type) {
      where.type = parsed.type;
    }

    if (parsed.status) {
      where.status = parsed.status;
    }

    if (parsed.make) {
      where.make = { contains: parsed.make, mode: "insensitive" };
    }

    if (parsed.model) {
      where.model = { contains: parsed.model, mode: "insensitive" };
    }

    if (parsed.year) {
      where.year = parsed.year;
    }

    if (parsed.assignedDriverId) {
      where.currentDriverId = parsed.assignedDriverId;
    }

    if (parsed.maintenanceDue) {
      // Support both nextMaintenanceDate and nextInspectionDue fields
      where.OR = [
        { nextMaintenanceDate: { lte: new Date() } },
        { nextInspectionDue: { lte: new Date() } },
      ];
    }

    // Pagination
    const page = parsed.page || 1;
    const limit = Math.min(parsed.limit || 10, 100);
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: { unitNumber: "asc" },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    // Map Prisma result to public Vehicle type
    const vehicles: Vehicle[] = results.map((v) => ({
      id: v.id,
      organizationId: v.organizationId,
      type: v.type as Vehicle["type"],
      status: v.status as Vehicle["status"],
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ?? 0,
      vin: v.vin ?? "",
      licensePlate: v.licensePlate ?? undefined,
      unitNumber: v.unitNumber ?? undefined,
      grossVehicleWeight: undefined,
      maxPayload: undefined,
      fuelType: v.fuelType ?? undefined,
      engineType: undefined,
      registrationNumber: undefined,
      registrationExpiry: v.registrationExpiration ?? undefined,
      insuranceProvider: undefined,
      insurancePolicyNumber: undefined,
      insuranceExpiry: v.insuranceExpiration ?? undefined,
      currentDriverId: v.currentDriverId ?? undefined,
      currentLoadId: undefined,
      currentLocation: undefined,
      totalMileage: v.currentOdometer ?? undefined,
      lastMaintenanceMileage: undefined,
      nextMaintenanceDate: v.nextMaintenanceDate ?? v.nextInspectionDue ?? undefined,
      nextMaintenanceMileage: undefined,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      driver: v.driver
        ? {
            id: v.driver.id,
            firstName: v.driver.firstName,
            lastName: v.driver.lastName,
          }
        : undefined,
      organization: v.organization
        ? { id: v.organization.id, name: v.organization.name }
        : undefined,
    }));

    return {
      vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error listing vehicles:", error);
    return { vehicles: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
});