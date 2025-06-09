'use server';

import { z } from 'zod';
import { db } from '@/lib/database/db';
import { getCurrentUser } from '@/lib/auth/auth';
import { handleError } from '@/lib/errors/handleError';

const scheduleInspectionSchema = z.object({
  vehicleId: z.string().min(1),
  inspectionDate: z.string().min(1),
  inspector: z.string().optional(),
  notes: z.string().optional(),
});

export async function scheduleVehicleInspection(data: z.infer<typeof scheduleInspectionSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user?.organizationId) throw new Error('Unauthorized');
    const validated = scheduleInspectionSchema.parse(data);
    const inspectionDate = new Date(validated.inspectionDate);
    await db.vehicle.update({
      where: { id: validated.vehicleId },
      data: {
        lastInspectionDate: inspectionDate,
        nextInspectionDue: null,
      },
    });
    await db.complianceAlert.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        vehicleId: validated.vehicleId,
        type: 'inspection_due',
        severity: 'low',
        title: 'Inspection Completed',
        message: `Vehicle inspected on ${inspectionDate.toISOString().slice(0,10)}`,
        entityType: 'vehicle',
        entityId: validated.vehicleId,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    return handleError(error, 'Schedule Vehicle Inspection');
  }
}
