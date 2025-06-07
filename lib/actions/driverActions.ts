import { UserContext } from "@/types/auth";
"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth/auth"
import { hasPermission } from "@/lib/auth/permissions"
import { PermissionActions, ResourceTypes } from "@/types/abac"
import type {
  Driver,
  DriverFormData,
  DriverUpdateData,
  DriverActionResult,
  DriverBulkActionResult
} from "@/types/drivers"
import { db } from "@/lib/database/db"
import { logAuditEvent } from "@/lib/actions/auditActions"
import {
  driverFormSchema,
  driverUpdateSchema,
  driverStatusUpdateSchema,
  driverDocumentSchema,
  hosEntrySchema,
  driverAssignmentSchema,
  driverBulkUpdateSchema
} from "@/schemas/drivers"

// Helper function to convert Prisma Driver to Driver interface
function convertPrismaDriverToDriver(prismaDriver: any): Driver {
  return {
    ...prismaDriver,
    tenantId: prismaDriver.tenantId || prismaDriver.organizationId,
    address: prismaDriver.address ? JSON.parse(prismaDriver.address) : undefined,
    endorsements: prismaDriver.endorsements ? JSON.parse(prismaDriver.endorsements) : undefined,
    restrictions: prismaDriver.restrictions ? JSON.parse(prismaDriver.restrictions) : undefined,
    emergencyContact: prismaDriver.emergencyContact ? JSON.parse(prismaDriver.emergencyContact) : undefined,
    tags: prismaDriver.tags ? JSON.parse(prismaDriver.tags) : undefined,
    payRate: prismaDriver.payRate ? Number(prismaDriver.payRate) : undefined,
    createdAt: prismaDriver.createdAt.toISOString(),
    updatedAt: prismaDriver.updatedAt.toISOString(),
    hireDate: prismaDriver.hireDate?.toISOString() || '',
    medicalCardExpiration: prismaDriver.medicalCardExpiration?.toISOString() || ''
  } as Driver
}

// ================== Core CRUD Operations ==================

/**
 * Create a new driver
 */
export async function createDriverAction(
  tenantId: string,
  data: DriverFormData
): Promise<DriverActionResult> {
  const parsed = driverFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required", code: "UNAUTHORIZED" }
    }
    if (!hasPermission(user, PermissionActions.CREATE, ResourceTypes.DRIVER)) {
      return { success: false, error: "Insufficient permissions", code: "FORBIDDEN" }
    }

    // Validate permissions

    // Validate input data
    const validatedData = driverFormSchema.parse(data)    // Check for duplicate CDL number within tenant
    const existingDriver = await db.driver.findFirst({
      where: {
        organizationId: tenantId,
        licenseNumber: validatedData.cdlNumber,
        status: {
          not: "terminated"
        }
      }
    })

    if (existingDriver) {
      return { 
        success: false, 
        error: "A driver with this CDL number already exists", 
        code: "DUPLICATE_CDL" 
      }
    }    // Check for duplicate email within tenant
    const existingEmail = await db.driver.findFirst({
      where: {
        organizationId: tenantId,
        email: validatedData.email,
        status: {
          not: "terminated"
        }
      }
    })

    if (existingEmail) {
      return { 
        success: false, 
        error: "A driver with this email already exists", 
        code: "DUPLICATE_EMAIL" 
      }
    }    // Create driver record
    const newDriver = await db.driver.create({
      data: {
        organizationId: tenantId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        employeeId: validatedData.employeeId || null,
        hireDate: validatedData.hireDate,
        
        licenseNumber: validatedData.cdlNumber,
        licenseState: validatedData.cdlState,
        licenseClass: validatedData.cdlClass,
        licenseExpiration: validatedData.cdlExpiration,
        
        medicalCardExpiration: validatedData.medicalCardExpiration,
        
        status: 'active',
        
        emergencyContact1: validatedData.emergencyContact?.name || null,
        emergencyContact2: validatedData.emergencyContact?.phone || null,
        notes: validatedData.notes || null,
        
        customFields: validatedData.tags ? { tags: validatedData.tags } : {},
      }
    })

    if (!newDriver) {
      return { success: false, error: "Failed to create driver", code: "CREATE_FAILED" }
    }

    await logAuditEvent('driver.created', 'driver', newDriver.id, { driverName: `${newDriver.firstName} ${newDriver.lastName}`, cdlNumber: newDriver.licenseNumber })
    revalidatePath(`/dashboard/${tenantId}/drivers`)
    
    return { 
      success: true, 
      data: newDriver as unknown as Driver
    }

  } catch (error) {
    console.error("Error creating driver:", error)
    
    return { 
      success: false, 
      error: "Failed to create driver", 
      code: "INTERNAL_ERROR" 
    }
  }
}

/**
 * Update an existing driver
 */
export async function updateDriverAction(
  driverId: string,
  data: DriverUpdateData
): Promise<DriverActionResult> {
  const parsed = driverUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Authentication required", code: "UNAUTHORIZED" }
    }

    // Get existing driver to check permissions
    const existingDriver = await db.driver.findUnique({
      where: { id: driverId }
    })

    if (!existingDriver) {
      return { success: false, error: "Driver not found", code: "NOT_FOUND" }
    }

    // Validate permissions
    


    // Validate input data
    const validatedData = driverUpdateSchema.parse(data)

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }

    // Update only provided fields
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.address !== undefined) updateData.address = validatedData.address ? JSON.stringify(validatedData.address) : null
    if (validatedData.payRate !== undefined) updateData.payRate = validatedData.payRate
    if (validatedData.payType !== undefined) updateData.payType = validatedData.payType
    if (validatedData.homeTerminal !== undefined) updateData.homeTerminal = validatedData.homeTerminal
    if (validatedData.cdlExpiration !== undefined) updateData.cdlExpiration = validatedData.cdlExpiration
    if (validatedData.endorsements !== undefined) updateData.endorsements = validatedData.endorsements ? JSON.stringify(validatedData.endorsements) : null
    if (validatedData.restrictions !== undefined) updateData.restrictions = validatedData.restrictions ? JSON.stringify(validatedData.restrictions) : null
    if (validatedData.medicalCardExpiration !== undefined) updateData.medicalCardExpiration = validatedData.medicalCardExpiration
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.availabilityStatus !== undefined) updateData.availabilityStatus = validatedData.availabilityStatus
    if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact ? JSON.stringify(validatedData.emergencyContact) : null
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags ? JSON.stringify(validatedData.tags) : null

    // Update driver
    const updatedDriver = await db.driver.update({
      where: { id: driverId },
      data: updateData
    })

    if (!updatedDriver) {
      return { success: false, error: "Failed to update driver", code: "UPDATE_FAILED" }
    }

    await logAuditEvent('driver.updated', 'driver', driverId, { updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'updatedBy') })
    return { 
      success: true, 
      data: updatedDriver as unknown as Driver
    }

  } catch (error) {
    console.error("Error updating driver:", error)
    
    return { 
      success: false, 
      error: "Failed to update driver", 
      code: "INTERNAL_ERROR" 
    }
  }
}

/**
 * Delete (deactivate) a driver
 */
export async function deleteDriverAction(driverId: string): Promise<DriverActionResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Authentication required", code: "UNAUTHORIZED" }
    }

    // Get existing driver to check permissions
    const existingDriver = await db.driver.findUnique({
      where: { id: driverId }
    })

    if (!existingDriver) {
      return { success: false, error: "Driver not found", code: "NOT_FOUND" }
    }

    // Validate permissions




    // Soft delete (deactivate) driver
    const deletedDriver = await db.driver.update({
      where: { id: driverId },
      data: {
        status: 'terminated',
        terminationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    if (!deletedDriver) {
      return { success: false, error: "Failed to delete driver", code: "DELETE_FAILED" }
    }

    await logAuditEvent('driver.deleted', 'driver', driverId)
    
    return { success: true }

  } catch (error) {
    console.error("Error deleting driver:", error)
    return { 
      success: false, 
      error: "Failed to delete driver", 
      code: "INTERNAL_ERROR" 
    }
  }
}

// ================== Status Management ==================

/**
 * Update driver status
 */
export async function updateDriverStatusAction(
  driverId: string,
  statusUpdate: z.infer<typeof driverStatusUpdateSchema>
): Promise<DriverActionResult> {
  const parsed = driverStatusUpdateSchema.safeParse(statusUpdate)
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Authentication required", code: "UNAUTHORIZED" }
    }

    // Get existing driver
    const existingDriver = await db.driver.findUnique({
      where: { id: driverId }
    })

    if (!existingDriver) {
      return { success: false, error: "Driver not found", code: "NOT_FOUND" }
    }

    // Validate permissions

    // Validate input
    const validatedData = driverStatusUpdateSchema.parse(statusUpdate)

    // Update driver status
    const updateData: any = {
      status: validatedData.status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }

    if (validatedData.availabilityStatus) {
      updateData.availabilityStatus = validatedData.availabilityStatus
    }

    if (validatedData.location) {
      updateData.currentLocation = JSON.stringify(validatedData.location)
    }

    const updatedDriver = await db.driver.update({
      where: { id: driverId },
      data: updateData
    })

    await logAuditEvent('driver.statusUpdated', 'driver', driverId, { status: validatedData.status, availabilityStatus: validatedData.availabilityStatus })
    return { 
      success: true, 
      data: updatedDriver as unknown as Driver
    }
  } catch (error) {
    console.error("Error updating driver status:", error)
    return { 
      success: false, 
      error: "Failed to update driver status", 
      code: "INTERNAL_ERROR" 
    }
  }
}

// ================== Bulk Operations ==================

/**
 * Bulk update drivers
 */
export async function bulkUpdateDriversAction(
  bulkUpdate: z.infer<typeof driverBulkUpdateSchema>
): Promise<DriverBulkActionResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { 
        success: false, 
        processed: 0, 
        succeeded: 0, 
        failed: bulkUpdate.driverIds.length,
        errors: bulkUpdate.driverIds.map(id => ({ driverId: id, error: "Authentication required" }))
      }
    }

    // Validate input
    const validatedData = driverBulkUpdateSchema.parse(bulkUpdate)
    
    let succeeded = 0
    let failed = 0
    const errors: Array<{ driverId: string; error: string }> = []

    // Process each driver
    for (const driverId of validatedData.driverIds) {
      try {
        // Get driver to check permissions
        const driver = await db.driver.findUnique({
          where: { id: driverId }
        })

        if (!driver) {
          errors.push({ driverId, error: "Driver not found" })
          failed++
          continue
        }

        // Check permissions
    
        // Prepare update
        const updateData: any = {
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        }

        if (validatedData.updates.status) updateData.status = validatedData.updates.status
        if (validatedData.updates.availabilityStatus) updateData.availabilityStatus = validatedData.updates.availabilityStatus
        if (validatedData.updates.homeTerminal) updateData.homeTerminal = validatedData.updates.homeTerminal
        if (validatedData.updates.tags) updateData.tags = JSON.stringify(validatedData.updates.tags)

        // Update driver
        await db.driver.update({
          where: { id: driverId },
          data: updateData
        })

        succeeded++

      

      } catch (error) {
        console.error(`Error updating driver ${driverId}:`, error)
        errors.push({ driverId, error: "Update failed" })
        failed++
      }
    }

    // Revalidate paths for all affected tenants
  
  
    return {
      success: succeeded > 0,
      processed: validatedData.driverIds.length,
      succeeded,
      failed,
      errors
    }

  } catch (error) {
    console.error("Error in bulk update:", error)
    return {
      success: false,
      processed: bulkUpdate.driverIds.length,
      succeeded: 0,
      failed: bulkUpdate.driverIds.length,
      errors: bulkUpdate.driverIds.map(id => ({ driverId: id, error: "Internal error" }))
    }
  }
}

// ================== Assignment Management ==================

/**
 * Assign driver to a load/vehicle
 */
export async function assignDriverAction(
  assignmentData: z.infer<typeof driverAssignmentSchema>
): Promise<DriverActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required", code: "UNAUTHORIZED" }
    }
    if (!hasPermission(user, PermissionActions.ASSIGN, ResourceTypes.DRIVER)) {
      return { success: false, error: "Insufficient permissions", code: "FORBIDDEN" }
    }

    // Validate input
    const validatedData = driverAssignmentSchema.parse(assignmentData)    // Get driver to check permissions
    const driver = await db.driver.findUnique({
      where: { id: validatedData.driverId },
      include: {
        loads: {
          where: {
            status: {
              in: ['assigned', 'dispatched', 'in_transit', 'at_pickup', 'picked_up', 'en_route']
            }
          }
        }
      }
    })

    if (!driver) {
      return { success: false, error: "Driver not found", code: "NOT_FOUND" }
    }

    // Check if driver is available for assignment
    if (driver.status !== 'active') {
      return { 
        success: false, 
        error: "Driver is not active and cannot be assigned", 
        code: "DRIVER_NOT_AVAILABLE" 
      }
    }

    // Check if driver already has active assignments
    if (driver.loads.length > 0) {
      return { 
        success: false, 
        error: "Driver is already assigned to an active load", 
        code: "DRIVER_ALREADY_ASSIGNED" 
      }
    }

    // Start database transaction for assignment
    const result = await db.$transaction(async (tx) => {
      const updates: any[] = []

      // If assigning to a load
      if (validatedData.loadId) {
        // Verify load exists and is available
        const load = await tx.load.findUnique({
          where: { id: validatedData.loadId },
        })

        if (!load) {
          throw new Error("Load not found")
        }

        if (load.driverId && load.driverId !== validatedData.driverId) {
          throw new Error("Load is already assigned to another driver")
        }

        // Update load assignment
        updates.push(
          tx.load.update({
            where: { id: validatedData.loadId },
            data: {
              driverId: validatedData.driverId,
              status: load.status === 'pending' ? 'assigned' : load.status,
              updatedAt: new Date(),
            }
          })
        )

        // Create load status event
        updates.push(
          tx.loadStatusEvent.create({
            data: {
              loadId: validatedData.loadId,
              status: load.status === 'pending' ? 'assigned' : load.status,
              timestamp: new Date(),
              notes: `Driver assigned: ${driver.firstName} ${driver.lastName}`,
              automaticUpdate: false,
              source: 'dispatcher'
            }
          })
        )
      }

      // If assigning to a vehicle
      if (validatedData.vehicleId) {
        // Verify vehicle exists and is available
        const vehicle = await tx.vehicle.findUnique({
          where: { id: validatedData.vehicleId },
        })

        if (!vehicle) {
          throw new Error("Vehicle not found")
        }

        if (vehicle.status !== 'active') {
          throw new Error("Vehicle is not active and cannot be assigned")
        }

        // For vehicle assignment, we may need to create a maintenance or training load
        if (validatedData.assignmentType === 'maintenance' || validatedData.assignmentType === 'training') {
          const assignmentLoad = await tx.load.create({
            data: {
              organizationId: driver.organizationId,
              driverId: validatedData.driverId,
              vehicleId: validatedData.vehicleId,
              loadNumber: `${validatedData.assignmentType.toUpperCase()}-${Date.now()}`,
              status: 'assigned',
              originAddress: 'Assignment',
              originCity: '',
              originState: '',
              originZip: '',
              destinationAddress: validatedData.assignmentType === 'maintenance' ? 'Maintenance Facility' : 'Training Center',
              destinationCity: '',
              destinationState: '',
              destinationZip: '',
              scheduledPickupDate: new Date(validatedData.scheduledStart),
              scheduledDeliveryDate: validatedData.scheduledEnd ? new Date(validatedData.scheduledEnd) : undefined,
              instructions: validatedData.instructions,
              notes: `${validatedData.assignmentType} assignment`,
              priority: validatedData.priority === 'urgent' ? 'urgent' : validatedData.priority === 'high' ? 'high' : 'medium',
              createdBy: user.userId,
              lastModifiedBy: user.userId,
            }
          })

          // Create status event for the assignment load
          updates.push(
            tx.loadStatusEvent.create({
              data: {
                loadId: assignmentLoad.id,
                status: 'assigned',
                timestamp: new Date(),
                notes: `${validatedData.assignmentType} assignment created`,
                automaticUpdate: false,
                source: 'dispatcher'
              }
            })
          )
        }
      }      // Update driver's last assignment time (don't change status for assignments)
      updates.push(
        tx.driver.update({
          where: { id: validatedData.driverId },
          data: {
            updatedAt: new Date(),
          }
        })
      )

      // Execute all updates
      await Promise.all(updates)

      return true
    })

    // Log audit event
    await logAuditEvent(
      'driver.assigned', 
      'driver', 
      validatedData.driverId, 
      { 
        loadId: validatedData.loadId,
        vehicleId: validatedData.vehicleId,
        assignmentType: validatedData.assignmentType,
        assignedBy: user.userId
      }
    )

    // Revalidate related pages
    revalidatePath('/[orgId]/drivers', 'page')
    revalidatePath('/[orgId]/dispatch', 'page')
    if (validatedData.loadId) {
      revalidatePath(`/[orgId]/dispatch/loads/${validatedData.loadId}`, 'page')
    }

    return { success: true }

  } catch (error) {
    console.error("Error assigning driver:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Invalid assignment data", 
        code: "VALIDATION_ERROR" 
      }
    }
    
    return { 
      success: false, 
      error: "Failed to assign driver", 
      code: "INTERNAL_ERROR" 
    }
  }
}

/**
 * Unassign driver from current assignment
 */
export async function unassignDriverAction(driverId: string): Promise<DriverActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required", code: "UNAUTHORIZED" }
    }
    if (!hasPermission(user, PermissionActions.ASSIGN, ResourceTypes.DRIVER)) {
      return { success: false, error: "Insufficient permissions", code: "FORBIDDEN" }
    }
    // Get driver with current assignments
    const driver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        loads: {
          where: {
            status: {
              in: ['assigned', 'dispatched', 'in_transit', 'at_pickup', 'picked_up', 'en_route']
            }
          }
        }
      }
    })

    if (!driver) {
      return { success: false, error: "Driver not found", code: "NOT_FOUND" }
    }

    // Check if driver has any active assignments
    if (driver.loads.length === 0) {
      return { 
        success: false, 
        error: "Driver has no active assignments to unassign", 
        code: "NO_ASSIGNMENT" 
      }
    }

    // Start database transaction for unassignment
    await db.$transaction(async (tx) => {
      const updates: any[] = []

      // Unassign from all active loads
      for (const load of driver.loads) {
        // Update load to remove driver assignment
        updates.push(
          tx.load.update({
            where: { id: load.id },
            data: {
              driverId: null,
              status: load.status === 'assigned' ? 'pending' : load.status,
              updatedAt: new Date(),
            }
          })
        )

        // Create load status event
        updates.push(
          tx.loadStatusEvent.create({
            data: {
              loadId: load.id,
              status: load.status === 'assigned' ? 'pending' : load.status,
              timestamp: new Date(),
              notes: `Driver unassigned: ${driver.firstName} ${driver.lastName}`,
              automaticUpdate: false,
              source: 'dispatcher'
            }
          })
        )
      }      // Update driver's last modification time (don't change base status)
      updates.push(
        tx.driver.update({
          where: { id: driverId },
          data: {
            updatedAt: new Date(),
          }
        })
      )

      // Execute all updates
      await Promise.all(updates)
    })

    // Log audit event
    await logAuditEvent(
      'driver.unassigned', 
      'driver', 
      driverId, 
      { 
        loadIds: driver.loads.map(l => l.id),
        unassignedBy: user.userId
      }
    )

    // Revalidate related pages
    revalidatePath('/[orgId]/drivers', 'page')
    revalidatePath('/[orgId]/dispatch', 'page')
    
    return { success: true }

  } catch (error) {
    console.error("Error unassigning driver:", error)
    return { 
      success: false, 
      error: "Failed to unassign driver", 
      code: "INTERNAL_ERROR" 
    }
  }
}
