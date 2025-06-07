'use server';

import { z } from 'zod';
import { db } from '../database/db';
import { getCurrentUser } from '@/lib/auth/auth';
import { handleError } from '@/lib/errors/handleError';
import { generateUploadUrl } from '@vercel/blob';

export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().min(1),
  mimeType: z.string().min(1),
  url: z.string().url(),
  entityType: z.enum(['driver', 'vehicle', 'trailer', 'company']),
  entityId: z.string().min(1),
  documentType: z.string().min(1),
  notes: z.string().optional(),
});

export async function saveUploadedDocument(data: z.infer<typeof fileUploadSchema>) {
  try {
    const user = await getCurrentUser();
    const userId = user?.userId;
    const orgId = user?.organizationId;
    if (!userId || !orgId) throw new Error('Unauthorized');
    const validated = fileUploadSchema.parse(data);
    // Save document record
    const doc = await db.complianceDocument.create({
      data: {
        organizationId: orgId,
        driverId: validated.entityType === 'driver' ? validated.entityId : undefined,
        vehicleId: validated.entityType === 'vehicle' ? validated.entityId : undefined,
        type: validated.documentType,
        title: validated.fileName,
        fileUrl: validated.url,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        notes: validated.notes,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true, data: doc };
  } catch (error) {
    return handleError(error, 'File Upload Action');
  }
}

export async function generateBlobUploadUrl(fileName: string, mimeType: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.userId || !user?.organizationId) throw new Error('Unauthorized');
    const { url, token, pathname } = await generateUploadUrl({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType,
      pathname: fileName,
    });
    return { success: true, data: { url, token, pathname } };
  } catch (error) {
    return handleError(error, 'Generate Upload URL');
  }
}
