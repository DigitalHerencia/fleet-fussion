"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/database/db";
import type { Prisma } from "@prisma/client";
import {
  createLoadSchema,
  updateLoadSchema,
  loadAssignmentSchema,
  loadStatusUpdateSchema,
  bulkLoadOperationSchema,
  type CreateLoadInput,
  type UpdateLoadInput,
  type LoadAssignmentInput,
  type LoadStatusUpdateInput,
  type BulkLoadOperationInput,
} from "@/schemas/dispatch";
import type { Load, LoadStatus, LoadStatusEvent, TrackingUpdate, LoadAlert } from "@/types/dispatch";

// Helper function to check user permissions
async function checkUserPermissions(orgId: string, requiredPermissions: string[]) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  // Check if user belongs to the organization and has required permissions
  const user = await prisma.user.findFirst({
    where: {
      clerkId: userId,
      organizationId: orgId,
    },
  });
  if (!user) {
    throw new Error("User not found or not member of organization");
  }
  let userPermissions: string[] = [];
  if (Array.isArray(user.permissions)) {
    userPermissions = user.permissions
      .map((p: any) => typeof p === "object" && p !== null && "name" in p ? p.name : null)
      .filter((name: any) => typeof name === "string");
  }
  const hasPermission = requiredPermissions.some(permission => 
    userPermissions.includes(permission) || userPermissions.includes("*")
  );
  if (!hasPermission) {
    throw new Error(`Insufficient permissions. Required: ${requiredPermissions.join(" or ")}`);
  }
  return user;
}

// Helper function to create audit log entry
async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  changes: Record<string, any>,
  userId: string,
  organizationId: string
) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      changes: changes as Prisma.JsonValue,
      userId,
      organizationId,
      timestamp: new Date(),
    },
  });
}

// Helper function to generate reference number
function generateReferenceNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `FL${timestamp.slice(-6)}${random}`;
}
// Create load action
export async function createLoadAction(orgId: string, data: CreateLoadInput) {
  try {
    const user = await checkUserPermissions(orgId, ["loads:create", "dispatch:manage"]);
    const validatedData = createLoadSchema.parse(data);
    let referenceNumber = validatedData.referenceNumber;
    if (!referenceNumber) {
      referenceNumber = generateReferenceNumber();
    }
    if (typeof referenceNumber !== "string") {
      referenceNumber = String(referenceNumber ?? "");
    }
    const existingLoad = await prisma.load.findFirst({
      where: {
        organizationId: orgId,
        referenceNumber,
      },
    });
    if (existingLoad) {
      return {
        success: false,
        error: "Reference number already exists",
      };
    }
    const { rate, customer, origin, destination, driver, vehicle, trailer, tags, createdBy, lastModifiedBy, priority, statusEvents, ...rest } = validatedData;
    const dbData: any = {
      ...rest,
      referenceNumber,
      rate,
      organizationId: orgId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: priority || "medium",
      tags: tags || [],
      createdBy: createdBy || user.id,
      lastModifiedBy: lastModifiedBy || user.id,
    };
    if (customer && typeof customer === "object") {
      dbData.customerName = customer.name ?? null;
      dbData.customerContact = customer.contactName ?? null;
      dbData.customerPhone = customer.phone ?? null;
      dbData.customerEmail = customer.email ?? null;
    }
    if (origin && typeof origin === "object") {
      dbData.originAddress = origin.address ?? null;
      dbData.originCity = origin.city ?? null;
      dbData.originState = origin.state ?? null;
      dbData.originZip = origin.zip ?? null;
      dbData.originLat = origin.latitude ?? null;
      dbData.originLng = origin.longitude ?? null;
    }
    if (destination && typeof destination === "object") {
      dbData.destinationAddress = destination.address ?? null;
      dbData.destinationCity = destination.city ?? null;
      dbData.destinationState = destination.state ?? null;
      dbData.destinationZip = destination.zip ?? null;
      dbData.destinationLat = destination.latitude ?? null;
      dbData.destinationLng = destination.longitude ?? null;
    }
    if (driver && typeof driver === "object" && driver.id) dbData.driverId = driver.id;
    if (vehicle && typeof vehicle === "object" && vehicle.id) dbData.vehicleId = vehicle.id;
    if (trailer && typeof trailer === "object" && trailer.id) dbData.trailerId = trailer.id;
    const createdLoad = await prisma.load.create({ data: dbData });
    // Create status events if provided
    if (Array.isArray(statusEvents) && statusEvents.length > 0) {
      for (const event of statusEvents) {
        await prisma.loadStatusEvent.create({
          data: {
            ...event,
            loadId: createdLoad.id,
          },
        });
      }
    }
    await createAuditLog(
      "CREATE",
      "Load",
      createdLoad.id,
      dbData,
      user.id,
      orgId
    );
    revalidatePath(`/dashboard/${orgId}/dispatch`);
    return {
      success: true,
      data: createdLoad,
    };
  } catch (error) {
    console.error("Error creating load:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create load",
    };
  }
}

// Update load action
export async function updateLoadAction(loadId: string, data: UpdateLoadInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const existingLoad = await prisma.load.findUnique({
      where: { id: loadId },
      select: { organizationId: true, status: true },
    });
    if (!existingLoad) {
      return {
        success: false,
        error: "Load not found",
      };
    }
    const user = await checkUserPermissions(existingLoad.organizationId, ["loads:update", "dispatch:manage"]);
    const validatedData = updateLoadSchema.parse(data);
    const { id, rate, customer, origin, destination, driver, vehicle, trailer, tags, lastModifiedBy, priority, statusEvents, ...updateData } = validatedData;
    const dbData: any = {
      ...updateData,
      updatedAt: new Date(),
      priority: priority || undefined,
      tags: tags || undefined,
      lastModifiedBy: lastModifiedBy || user.id,
    };
    if (typeof rate !== "undefined") dbData.rate = rate;
    if (customer && typeof customer === "object") {
      dbData.customerName = customer.name ?? null;
      dbData.customerContact = customer.contactName ?? null;
      dbData.customerPhone = customer.phone ?? null;
      dbData.customerEmail = customer.email ?? null;
    }
    if (origin && typeof origin === "object") {
      dbData.originAddress = origin.address ?? null;
      dbData.originCity = origin.city ?? null;
      dbData.originState = origin.state ?? null;
      dbData.originZip = origin.zip ?? null;
      dbData.originLat = origin.latitude ?? null;
      dbData.originLng = origin.longitude ?? null;
    }
    if (destination && typeof destination === "object") {
      dbData.destinationAddress = destination.address ?? null;
      dbData.destinationCity = destination.city ?? null;
      dbData.destinationState = destination.state ?? null;
      dbData.destinationZip = destination.zip ?? null;
      dbData.destinationLat = destination.latitude ?? null;
      dbData.destinationLng = destination.longitude ?? null;
    }
    if (driver && typeof driver === "object" && driver.id) dbData.driverId = driver.id;
    if (vehicle && typeof vehicle === "object" && vehicle.id) dbData.vehicleId = vehicle.id;
    if (trailer && typeof trailer === "object" && trailer.id) dbData.trailerId = trailer.id;
    const updatedLoad = await prisma.load.update({
      where: { id: loadId },
      data: dbData,
    });
    // Update status events if provided
    if (Array.isArray(statusEvents) && statusEvents.length > 0) {
      for (const event of statusEvents) {
        await prisma.loadStatusEvent.create({
          data: {
            ...event,
            loadId: loadId,
          },
        });
      }
    }
    await createAuditLog(
      "UPDATE",
      "Load",
      loadId,
      updateData,
      user.id,
      existingLoad.organizationId
    );
    revalidatePath(`/dashboard/${existingLoad.organizationId}/dispatch`);
    revalidatePath(`/dashboard/${existingLoad.organizationId}/dispatch/${loadId}`);
    return {
      success: true,
      data: updatedLoad,
    };
  } catch (error) {
    console.error("Error updating load:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update load",
    };
  }
}

// Delete load action
export async function deleteLoadAction(loadId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const existingLoad = await prisma.load.findUnique({
      where: { id: loadId },
      select: { organizationId: true, status: true, referenceNumber: true },
    });
    if (!existingLoad) {
      return {
        success: false,
        error: "Load not found",
      };
    }
    const user = await checkUserPermissions(existingLoad.organizationId, ["loads:delete", "dispatch:manage"]);
    if (
      existingLoad.status !== "pending" &&
      existingLoad.status !== "cancelled"
    ) {
      return {
        success: false,
        error: "Cannot delete load in current status",
      };
    }
    await prisma.load.delete({ where: { id: loadId } });
    await createAuditLog(
      "DELETE",
      "Load",
      loadId,
      { referenceNumber: existingLoad.referenceNumber },
      user.id,
      existingLoad.organizationId
    );
    revalidatePath(`/dashboard/${existingLoad.organizationId}/dispatch`);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting load:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete load",
    };
  }
}

// Update load status action

