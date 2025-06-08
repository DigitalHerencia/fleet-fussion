// filepath: lib/actions/auditActions.ts
'use server';

import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/database/db';

export interface AuditLogEntry {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Log an audit event for tracking user actions across the system
 */
export async function logAuditEvent(
  action: string,
  resource: string,
  resourceId?: string,
  metadata: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('User must be authenticated');
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to log audit event',
    };
  }
}

/**
 * Get audit logs for an organization with filtering and pagination
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
  pagination: {
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('User must be authenticated');
    }

    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const where = {
      organizationId: orgId,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.action && { action: filters.action }),
      ...(filters.startDate &&
        filters.endDate && {
          timestamp: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get audit logs',
    };
  }
}

/**
 * Log a driver action audit event
 */
export async function logDriverAction(
  action: string,
  driverId: string,
  metadata: Record<string, any> = {},
  p0: string,
  entityType: any,
  p1: string,
  entityId: any,
  id: string,
  details: any,
  p2: { driverName: string; cdlNumber: string | null; email: string | null }
) {
  return logAuditEvent(action, 'driver', driverId, metadata);
}

/**
 * Log a vehicle action audit event
 */
export async function logVehicleAction(
  action: string,
  vehicleId: string,
  metadata: Record<string, any> = {}
) {
  return logAuditEvent(action, 'vehicle', vehicleId, metadata);
}

/**
 * Log a dispatch action audit event
 */
export async function logDispatchAction(
  action: string,
  loadId: string,
  metadata: Record<string, any> = {}
) {
  return logAuditEvent(action, 'dispatch', loadId, metadata);
}

/**
 * Log a compliance action audit event
 */
export async function logComplianceAction(
  action: string,
  resourceId: string,
  metadata: Record<string, any> = {}
) {
  return logAuditEvent(action, 'compliance', resourceId, metadata);
}

/**
 * Log an IFTA action audit event
 */
export async function logIftaAction(
  action: string,
  reportId: string,
  metadata: Record<string, any> = {}
) {
  return logAuditEvent(action, 'ifta', reportId, metadata);
}

/**
 * Delete old audit logs (for data retention compliance)
 */
export async function cleanupAuditLogs(daysToKeep: number = 365) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('User must be authenticated');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await db.auditLog.deleteMany({
      where: {
        organizationId: orgId,
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      deletedCount: deletedCount.count,
    };
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cleanup audit logs',
    };
  }
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogs(
  filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('User must be authenticated');
    }

    const where = {
      organizationId: orgId,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.action && { action: filters.action }),
      ...(filters.startDate &&
        filters.endDate && {
          timestamp: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Convert to CSV format
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Resource',
      'Resource ID',
      'IP Address',
      'User Agent',
      'Metadata',
    ];

    return {
      success: true,
      filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
    };
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to export audit logs',
    };
  }
}
