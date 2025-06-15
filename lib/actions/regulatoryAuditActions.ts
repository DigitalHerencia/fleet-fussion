'use server';

import db from '@/lib/database/db';
import { Prisma } from '@prisma/client';
import { logAuditEvent } from './auditActions';
import { getRegulatoryComplianceSummary } from '../compliance/regulatoryEngine';

export async function runRegulatoryAudit(
  organizationId: string,
  quarter: string,
  year: number
) {
  const summary = await getRegulatoryComplianceSummary(organizationId, quarter, year);

  const record = await db.regulatoryAudit.create({
    data: {
      organizationId,
      quarter,
      year,
      summary: summary as unknown as Prisma.InputJsonValue,
      createdAt: new Date(),
    },
  });

  await logAuditEvent('run_regulatory_audit', 'regulatory_audit', record.id, summary);

  return { success: true, data: record };
}
