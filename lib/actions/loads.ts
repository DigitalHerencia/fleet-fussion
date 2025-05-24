"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/database"
import { loads } from "@/lib/database/schema"
import { eq, and, desc } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { DatabaseQueries } from "@/lib/database"

// Helper to get current user with organizationId
async function getCurrentUserWithOrg() {
  const { userId, orgId } = await auth()
  
  if (!userId || !orgId) {
    return null
  }

  try {
    // Get user from database with organizationId
    const dbUser = await DatabaseQueries.getUserByClerkId(userId)
    if (!dbUser) {
      return null
    }

    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      organizationId: dbUser.organizationId,
      email: dbUser.email,
      name: `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || dbUser.email,
      role: dbUser.role,
      permissions: dbUser.permissions
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return null
  }
}

// Schema for load creation/update
const loadSchema = z.object({
  driverId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  trailerId: z.string().uuid().optional().nullable(),
  status: z.enum(["pending", "assigned", "in_transit", "delivered", "cancelled"]).default("pending"),
  referenceNumber: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerContact: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  originAddress: z.string().min(1, "Origin address is required"),
  originCity: z.string().min(1, "Origin city is required"),
  originState: z.string().min(1, "Origin state is required"),
  originZip: z.string().min(1, "Origin ZIP is required"),
  destinationAddress: z.string().min(1, "Destination address is required"),
  destinationCity: z.string().min(1, "Destination city is required"),
  destinationState: z.string().min(1, "Destination state is required"),  destinationZip: z.string().min(1, "Destination ZIP is required"),
  scheduledPickupDate: z.string().optional(),
  scheduledDeliveryDate: z.string().optional(),  commodity: z.string().optional(),
  weight: z.number().optional(),
  rate: z.string().optional(),
  estimatedMiles: z.number().optional(),
  notes: z.string().optional(),
  instructions: z.string().optional(),
})

// Create a new load
export async function createLoad(formData: FormData) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
    }
  }

  try {
    const validatedFields = loadSchema.parse({
      driverId: formData.get("driverId") || null,
      vehicleId: formData.get("vehicleId") || null,
      trailerId: formData.get("trailerId") || null,
      status: formData.get("status") || "pending",
      referenceNumber: formData.get("referenceNumber"),
      customerName: formData.get("customerName"),
      customerContact: formData.get("customerContact"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: formData.get("customerEmail"),
      originAddress: formData.get("originAddress"),
      originCity: formData.get("originCity"),
      originState: formData.get("originState"),
      originZip: formData.get("originZip"),
      destinationAddress: formData.get("destinationAddress"),
      destinationCity: formData.get("destinationCity"),
      destinationState: formData.get("destinationState"),
      destinationZip: formData.get("destinationZip"),
      scheduledPickupDate: formData.get("pickupDate"),
      scheduledDeliveryDate: formData.get("deliveryDate"),
      commodity: formData.get("commodity"),      weight: formData.get("weight") ? Number(formData.get("weight")) : undefined,
      rate: formData.get("rate"),
      estimatedMiles: formData.get("estimatedMiles") ? Number(formData.get("estimatedMiles")) : undefined,
      notes: formData.get("notes"),
      instructions: formData.get("instructions"),
    })

    // Convert date strings to Date objects
    const scheduledPickupDateForDb = validatedFields.scheduledPickupDate ? new Date(validatedFields.scheduledPickupDate) : null
    const scheduledDeliveryDateForDb = validatedFields.scheduledDeliveryDate ? new Date(validatedFields.scheduledDeliveryDate) : null

    // Destructure validatedFields to exclude the original string date properties
    const { scheduledPickupDate, scheduledDeliveryDate, ...restOfValidatedFields } = validatedFields    // Generate a loadNumber (replace with your own logic if needed)
    const loadNumber = `LD-${Date.now()}`    // Insert the load into the database
    const [newLoad] = await db.insert(loads).values({
      ...restOfValidatedFields,
      loadNumber,
      organizationId: user.organizationId,
      scheduledPickupDate: scheduledPickupDateForDb,
      scheduledDeliveryDate: scheduledDeliveryDateForDb,
    }).returning()

    revalidatePath("/dispatch")
    revalidatePath("/loads")

    return {
      success: true,
      message: "Load created successfully",
      data: newLoad
    }
  } catch (error) {
    console.error("Error creating load:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid form data",
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: "Failed to create load",
    }
  }
}

// Update an existing load
export async function updateLoad(id: string, formData: FormData) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
    }
  }

  try {
    const validatedFields = loadSchema.parse({
      driverId: formData.get("driverId") || null,
      vehicleId: formData.get("vehicleId") || null,
      trailerId: formData.get("trailerId") || null,
      status: formData.get("status") || "pending",
      referenceNumber: formData.get("referenceNumber"),
      customerName: formData.get("customerName"),
      customerContact: formData.get("customerContact"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: formData.get("customerEmail"),
      originAddress: formData.get("originAddress"),
      originCity: formData.get("originCity"),
      originState: formData.get("originState"),
      originZip: formData.get("originZip"),
      destinationAddress: formData.get("destinationAddress"),
      destinationCity: formData.get("destinationCity"),
      destinationState: formData.get("destinationState"),
      destinationZip: formData.get("destinationZip"),      scheduledPickupDate: formData.get("pickupDate"),      scheduledDeliveryDate: formData.get("deliveryDate"),
      commodity: formData.get("commodity"),
      weight: formData.get("weight") ? Number(formData.get("weight")) : undefined,
      rate: formData.get("rate"),
      estimatedMiles: formData.get("estimatedMiles") ? Number(formData.get("estimatedMiles")) : undefined,
      notes: formData.get("notes"),
      instructions: formData.get("instructions"),
    })

    // Check if the load exists and belongs to the organization
    const existingLoad = await db.query.loads.findFirst({
      where: and(eq(loads.id, id), eq(loads.organizationId, user.organizationId)),
    })

    if (!existingLoad) {
      return {
        success: false,
        message: "Load not found",
      }
    }

    // Convert date strings to Date objects
    const scheduledPickupDateForDb = validatedFields.scheduledPickupDate ? new Date(validatedFields.scheduledPickupDate) : null
    const scheduledDeliveryDateForDb = validatedFields.scheduledDeliveryDate ? new Date(validatedFields.scheduledDeliveryDate) : null

    // Destructure validatedFields to exclude the original string date properties
    const { scheduledPickupDate, scheduledDeliveryDate, ...restOfValidatedFields } = validatedFields

    await db
      .update(loads)
      .set({
        
        updatedAt: new Date(),
      })
      .where(eq(loads.id, id))

    revalidatePath("/dispatch")
    revalidatePath("/loads")
    revalidatePath(`/loads/${id}`)

    return {
      success: true,
      message: "Load updated successfully",
    }
  } catch (error) {
    console.error("Error updating load:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid form data",
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: "Failed to update load",
    }
  }
}

// Update load status
export async function updateLoadStatus(id: string, status: string) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
    }
  }

  try {
    // Check if the load exists and belongs to the organization
    const existingLoad = await db.query.loads.findFirst({
      where: and(eq(loads.id, id), eq(loads.organizationId, user.organizationId)),
    })

    if (!existingLoad) {
      return {
        success: false,
        message: "Load not found",
      }
    }

    await db
      .update(loads)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(loads.id, id))

    revalidatePath("/dispatch")
    revalidatePath("/loads")
    revalidatePath(`/loads/${id}`)

    return {
      success: true,
      message: "Load status updated successfully",
    }
  } catch (error) {
    console.error("Error updating load status:", error)
    return {
      success: false,
      message: "Failed to update load status",
    }
  }
}

// Assign load to driver and vehicle
export async function assignLoad(id: string, driverId: string, vehicleId?: string, trailerId?: string) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
    }
  }

  try {
    // Check if the load exists and belongs to the organization
    const existingLoad = await db.query.loads.findFirst({
      where: and(eq(loads.id, id), eq(loads.organizationId, user.organizationId)),
    })

    if (!existingLoad) {
      return {
        success: false,
        message: "Load not found",
      }
    }

    await db
      .update(loads)
      .set({
        driverId,
        vehicleId: vehicleId || null,
        trailerId: trailerId || null,
        status: "assigned",
        updatedAt: new Date(),
      })
      .where(eq(loads.id, id))

    revalidatePath("/dispatch")
    revalidatePath("/loads")
    revalidatePath(`/loads/${id}`)

    return {
      success: true,
      message: "Load assigned successfully",
    }
  } catch (error) {
    console.error("Error assigning load:", error)
    return {
      success: false,
      message: "Failed to assign load",
    }
  }
}

// Delete a load
export async function deleteLoad(id: string) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
    }
  }

  try {
    // Check if the load exists and belongs to the organization
    const existingLoad = await db.query.loads.findFirst({
      where: and(eq(loads.id, id), eq(loads.organizationId, user.organizationId)),
    })

    if (!existingLoad) {
      return {
        success: false,
        message: "Load not found",
      }
    }

    await db.delete(loads).where(eq(loads.id, id))

    revalidatePath("/dispatch")
    revalidatePath("/loads")

    return {
      success: true,
      message: "Load deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting load:", error)
    return {
      success: false,
      message: "Failed to delete load",
    }
  }
}

// Get all loads for the current organization
export async function getLoads() {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
      data: [],
    }
  }

  try {
    const allLoads = await db.query.loads.findMany({
      where: eq(loads.organizationId, user.organizationId),
      with: {
        driver: true,
        vehicle: true,
        trailer: true,
      },
      orderBy: desc(loads.createdAt),
    })

    return {
      success: true,
      data: allLoads,
    }
  } catch (error) {
    console.error("Error fetching loads:", error)
    return {
      success: false,
      message: "Failed to fetch loads",
      data: [],
    }
  }
}

// Get a single load by ID
export async function getLoad(id: string) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
      data: null,
    }
  }

  try {
    const load = await db.query.loads.findFirst({
      where: and(eq(loads.id, id), eq(loads.organizationId, user.organizationId)),
      with: {
        driver: true,
        vehicle: true,
        trailer: true,
      },
    })

    if (!load) {
      return {
        success: false,
        message: "Load not found",
        data: null,
      }
    }

    return {
      success: true,
      data: load,
    }
  } catch (error) {
    console.error("Error fetching load:", error)
    return {
      success: false,
      message: "Failed to fetch load",
      data: null,
    }
  }
}

// Get loads by status
export async function getLoadsByStatus(status: string) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
      data: [],
    }
  }

  try {
    const statusLoads = await db.query.loads.findMany({
      where: and(eq(loads.organizationId, user.organizationId), eq(loads.status, status as any)),
      with: {
        driver: true,
        vehicle: true,
        trailer: true,
      },
      orderBy: desc(loads.createdAt),
    })

    return {
      success: true,
      data: statusLoads,
    }
  } catch (error) {
    console.error("Error fetching loads by status:", error)
    return {
      success: false,
      message: "Failed to fetch loads",
      data: [],
    }
  }
}

// Get loads for a specific driver
export async function getLoadsByDriver(driverId: string) {
  const user = await getCurrentUserWithOrg()

  if (!user) {
    return {
      success: false,
      message: "Authentication required",
      data: [],
    }
  }

  try {
    const driverLoads = await db.query.loads.findMany({
      where: and(
        eq(loads.organizationId, user.organizationId),
        eq(loads.driverId, driverId)
      ),
      with: {
        driver: true,
        vehicle: true,
        trailer: true,
      },
      orderBy: desc(loads.createdAt),
    })

    return {
      success: true,
      data: driverLoads,
    }
  } catch (error) {
    console.error("Error fetching loads by driver:", error)
    return {
      success: false,
      message: "Failed to fetch loads",
      data: [],
    }
  }
}
