'use server';

import { db } from '../db';
import { z } from 'zod';
import { ComplianceDocument } from '../../types/compliance';
import { getComplianceDocuments } from '../fetchers/complianceFetchers';
import {
  createComplianceDocumentSchema,
  updateComplianceDocumentSchema,
  createHosLogSchema,
  updateHosLogSchema,
  createDvirSchema,
  updateDvirSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  createSafetyEventSchema,
  bulkComplianceOperationSchema
} from '@/schemas/compliance';
import { getCurrentUser } from '../auth';

// Document Management Actions
export async function createComplianceDocument(data: z.infer<typeof createComplianceDocumentSchema>) {
  try {
    const user = await getCurrentUser();
    const userId = user?.userId;
    const orgId = user?.organizationId;

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Validate input
    const validatedData = createComplianceDocumentSchema.parse(data);

    // Map entityType/entityId to driverId/vehicleId
    let driverId: string | null = null;
    let vehicleId: string | null = null;
    if (validatedData.entityType === 'driver') {
      driverId = validatedData.entityId;
    } else if (validatedData.entityType === 'vehicle') {
      vehicleId = validatedData.entityId;
    }

    // Check if document already exists for driver/vehicle if applicable
    if (driverId || vehicleId) {
      const existingDoc = await db.complianceDocument.findFirst({
        where: {
          organizationId: orgId,
          type: validatedData.type,
          driverId: driverId || undefined,
          vehicleId: vehicleId || undefined,
          expirationDate: { gte: new Date() }
        }
      });
      if (existingDoc) {
        throw new Error('A valid document of this type already exists');
      }
    }

    const document = await db.complianceDocument.create({
      data: {
        organizationId: orgId,
        driverId,
        vehicleId,
        type: validatedData.type,
        title: validatedData.name,
        documentNumber: validatedData.documentNumber,
        issuingAuthority: validatedData.issuingAuthority,
        fileUrl: undefined, // File upload handled elsewhere
        fileName: undefined,
        fileSize: undefined,
        mimeType: undefined,
        issueDate: validatedData.issuedDate ? new Date(validatedData.issuedDate) : undefined,
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : undefined,
        status: 'active',
        isVerified: false,
        notes: validatedData.notes,
        tags: validatedData.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, unitNumber: true, make: true, model: true } }
      }
    });

    // NOTE: Compliance alert logic removed (no such model in Prisma)
    // NOTE: Audit log and revalidatePath are stubbed/not implemented

    return { success: true, data: document };
  } catch (error) {
    console.error('Error creating compliance document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create compliance document'
    };
  }
}

export async function updateComplianceDocument(
  id: string,
  data: z.infer<typeof updateComplianceDocumentSchema>
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.userId;
    const orgId = user?.organizationId;

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    const validatedData = updateComplianceDocumentSchema.parse(data);

    const existingDocument = await db.complianceDocument.findFirst({
      where: { id, organizationId: orgId }
    });
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    // Map name to title if present
    const updateData: any = { ...validatedData, updatedAt: new Date() };
    if (validatedData.name) {
      updateData.title = validatedData.name;
      delete updateData.name;
    }
    if (validatedData.expirationDate) {
      updateData.expirationDate = new Date(validatedData.expirationDate);
    }

    const updatedDocument = await db.complianceDocument.update({
      where: { id },
      data: updateData,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, unitNumber: true, make: true, model: true } }
      }
    });

    // NOTE: Audit log and revalidatePath are stubbed/not implemented

    return { success: true, data: updatedDocument };
  } catch (error) {
    console.error('Error updating compliance document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update compliance document'
    };
  }
}

export async function deleteComplianceDocument(id: string) {
  try {
    const user = await getCurrentUser();
    const userId = user?.userId;
    const orgId = user?.organizationId;

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Get document for audit log
    const document = await db.complianceDocument.findFirst({
      where: { id, organizationId: orgId }
    });
    if (!document) {
      throw new Error('Document not found');
    }

    await db.complianceDocument.delete({
      where: { id }
    });

    // NOTE: Audit log and revalidatePath are stubbed/not implemented

    return { success: true };
  } catch (error) {
    console.error('Error deleting compliance document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete compliance document'
    };
  }
}



// DVIR Management Actions
export async function createDVIRReport(data: z.infer<typeof createDvirSchema>) {
  try {
    const authData = await getCurrentUser();
    const userId = authData?.userId;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Validate input



    // Create audit log
    // await createAuditLog({
    //   action: 'CREATE',
    //   resource: 'dvir_report',
    //   resourceId: dvirReport.id,
    //   details: {
    //     vehicleId: dvirReport.vehicleId,
    //     driverId: dvirReport.driverId,
    //     defectsFound: dvirReport.defectsFound,
    //     inspectionType: dvirReport.inspectionType
    //   },
    //   userId,
    //   organizationId: orgId
    // });

    // revalidatePath('/[orgId]/compliance/dvir');
  } catch (error) {
    console.error('Error creating DVIR report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create DVIR report'
    };
  }
}

// Maintenance Management Actions
    


    // Create audit log
    // await createAuditLog({
    //   action: 'CREATE',
    //   resource: 'maintenance_record',
    //   resourceId: maintenanceRecord.id,
    //   details: {
    //     vehicleId: maintenanceRecord.vehicleId,
    //     type: maintenanceRecord.type,
    //     cost: maintenanceRecord.cost
    //   },
    //   userId,
    //   organizationId: orgId
    // });

    // revalidatePath('/[orgId]/compliance/maintenance');
  
// Safety Event Management Actions

  


    // Create audit log
    // await createAuditLog({
    //   action: 'CREATE',
    //   resource: 'safety_event',
    //   resourceId: safetyEvent.id,
    //   details: {
    //     type: safetyEvent.type,
    //     severity: safetyEvent.severity,
    //     driverId: safetyEvent.driverId,
    //     vehicleId: safetyEvent.vehicleId
    //   },
    //   userId,
    //   organizationId: orgId
    // });

    // revalidatePath('/[orgId]/compliance/safety');

// Bulk Operations
export async function bulkUpdateComplianceDocuments(
  data: z.infer<typeof bulkComplianceOperationSchema>
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.userId;
    const orgId = user?.organizationId;

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    const validatedData = bulkComplianceOperationSchema.parse(data);

    const results = await Promise.allSettled(
      validatedData.ids.map(async (documentId: string) => {
        return db.complianceDocument.update({
          where: {
            id: documentId,
            organizationId: orgId
          },
          data: {
            ...validatedData.data,
            updatedAt: new Date()
          }
        });
      })
    );

    const successful = results.filter((r: any) => r.status === 'fulfilled').length;
    const failed = results.filter((r: any) => r.status === 'rejected').length;

    // NOTE: Audit log and revalidatePath are stubbed/not implemented

    return {
      success: true,
      data: { successful, failed, total: validatedData.ids.length }
    };
  } catch (error) {
    console.error('Error bulk updating compliance documents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk update compliance documents'
    };
  }
}

// Alert Management


// Helper Functions
// async function checkHOSViolations(driverId: string, orgId: string, userId: string) {
//   // Get driver's HOS logs for the past 7 days
//   const sevenDaysAgo = new Date();
//   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//   const hosLogs = await db.hOSLog.findMany({
//     where: {
//       driverId,
//       organizationId: orgId,
//       startTime: {
//         gte: sevenDaysAgo
//       }
//     },
//     orderBy: { startTime: 'asc' }
//   });

//   // Check for various HOS violations
//   const violations = [];

//   // Check 11-hour driving limit
//   const drivingHours = hosLogs
//     .filter(log => log.dutyStatus === 'driving')
//     .reduce((total, log) => total + log.duration, 0);

//   if (drivingHours > 11 * 60) { // 11 hours in minutes
//     violations.push({
//       type: 'driving_limit_exceeded',
//       severity: 'high' as const,
//       message: `Driver exceeded 11-hour driving limit (${Math.round(drivingHours / 60 * 10) / 10} hours)`
//     });
//   }

//   // Check 14-hour on-duty limit
//   const onDutyHours = hosLogs
//     .filter(log => ['driving', 'on_duty_not_driving'].includes(log.dutyStatus))
//     .reduce((total, log) => total + log.duration, 0);

//   if (onDutyHours > 14 * 60) { // 14 hours in minutes
//     violations.push({
//       type: 'on_duty_limit_exceeded',
//       severity: 'high' as const,
//       message: `Driver exceeded 14-hour on-duty limit (${Math.round(onDutyHours / 60 * 10) / 10} hours)`
//     });
//   }

//   // Create alerts for violations
//   for (const violation of violations) {
//     await db.complianceAlert.create({
//       data: {
//         organizationId: orgId,
//         type: 'hos_violation',
//         severity: violation.severity,
//         title: 'HOS Violation Detected',
//         message: violation.message,
//         driverId,
//         createdBy: userId
//       }
//     });
//   }
// }
