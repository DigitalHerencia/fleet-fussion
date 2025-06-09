'use server';

import { addDays } from 'date-fns';
import { z } from 'zod';
import { db } from '@/lib/database/db';
import { getCurrentUser } from '@/lib/auth/auth';
import { handleError } from '@/lib/errors/handleError';

const daysSchema = z.number().int().positive();

export async function checkExpiringDocuments(days = 30) {
  try {
    const validatedDays = daysSchema.parse(days);
    const user = await getCurrentUser();
    const orgId = user?.organizationId;
    const userId = user?.userId;
    if (!orgId || !userId) throw new Error('Unauthorized');

    const cutoff = addDays(new Date(), validatedDays);
    const docs = await db.complianceDocument.findMany({
      where: {
        organizationId: orgId,
        expirationDate: { lte: cutoff, gte: new Date() },
        status: 'active',
      },
    });

    await Promise.all(
      docs.map((doc: any) =>
        db.complianceAlert.create({
          data: {
            organizationId: orgId,
            userId,
            driverId: doc.driverId || undefined,
            vehicleId: doc.vehicleId || undefined,
            type: 'expiring_document',
            severity: 'medium',
            title: 'Document Expiring Soon',
            message: `Document ${doc.title} expires on ${doc.expirationDate?.toISOString().slice(0,10)}`,
            entityType: doc.driverId ? 'driver' : doc.vehicleId ? 'vehicle' : 'company',
            entityId: doc.driverId || doc.vehicleId || orgId,
            dueDate: doc.expirationDate || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      )
    );

    return { success: true, count: docs.length };
  } catch (error) {
    return handleError(error, 'Check Expiring Documents');
  }
}
