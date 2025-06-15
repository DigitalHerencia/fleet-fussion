'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import db from '@/lib/database/db';
import { getIftaDataForPeriod, getIftaTripData } from '@/lib/fetchers/iftaFetchers';
import { pdfService } from '@/lib/services/pdfService';
import type {
  PDFGenerationRequest,
  PDFGenerationResult,
  PDFOptions,
  CustomReportOptions,
  IftaPDFGenerationLog,
  IftaReportPDF
} from '@/types/ifta';

const tripDataSchema = z.object({
  date: z.string(),
  distance: z.number(),
  jurisdiction: z.string(),
  fuelUsed: z.number().optional(),
  notes: z.string().optional(),
});

const fuelPurchaseSchema = z.object({
  date: z.string(),
  jurisdiction: z.string(),
  gallons: z.number(),
  amount: z.number(),
  vendor: z.string().optional(),
  receiptNumber: z.string().optional(),
});

async function checkIftaPermissions(orgId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await db.user.findFirst({
    where: { clerkId: userId, organizationId: orgId },
  });
  if (!user) throw new Error('User not found or not member of organization');
  // Robust permission check: coerce permissions to string[]
  let perms: string[] = [];
  if (Array.isArray(user.permissions)) {
    perms = user.permissions.map((p: any) =>
      typeof p === 'string' ? p : (p?.name ?? '')
    );
  } else if (typeof user.permissions === 'string') {
    perms = [user.permissions];
  }
  if (!perms.includes('ifta:manage') && !perms.includes('*')) {
    throw new Error('Insufficient permissions for IFTA actions');
  }
  return user;
}

export async function fetchIftaDataAction(
  orgId: string,
  quarter: string,
  year: string
) {
  try {
    await checkIftaPermissions(orgId);
    const data = await getIftaDataForPeriod(orgId, quarter, year);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch IFTA data',
    };
  }
}

export async function logIftaTripDataAction(
  orgId: string,
  vehicleId: string,
  tripData: any
) {
  try {
    await checkIftaPermissions(orgId);
    const validated = tripDataSchema.parse(tripData);
    const trip = await db.iftaTrip.create({
      data: {
        organizationId: orgId,
        vehicleId,
        date: new Date(validated.date),
        distance: validated.distance,
        jurisdiction: validated.jurisdiction,
        fuelUsed: validated.fuelUsed ?? null,
        notes: validated.notes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    revalidatePath(`/dashboard/${orgId}/ifta`);
    return { success: true, data: trip };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to log IFTA trip data',
    };
  }
}

export async function logFuelPurchaseAction(
  orgId: string,
  vehicleId: string,
  purchaseData: any
) {
  try {
    await checkIftaPermissions(orgId);
    const validated = fuelPurchaseSchema.parse(purchaseData);
    // Use the correct camelCase accessor for the Prisma model
    const purchase = await db.iftaFuelPurchase.create({
      data: {
        organizationId: orgId,
        vehicleId,
        date: new Date(validated.date),
        jurisdiction: validated.jurisdiction,
        gallons: validated.gallons,
        amount: validated.amount,
        vendor: validated.vendor ?? null,
        receiptNumber: validated.receiptNumber ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    revalidatePath(`/dashboard/${orgId}/ifta`);
    return { success: true, data: purchase };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to log fuel purchase',
    };
  }
}

export async function generateIftaReportAction(
  orgId: string,
  quarter: string,
  year: string
) {
  try {
    const user = await checkIftaPermissions(orgId);
    const q = parseInt(quarter);
    const y = parseInt(year);
    
    if (isNaN(q) || isNaN(y) || q < 1 || q > 4) {
      throw new Error('Invalid quarter or year');
    }

    // Get IFTA data for the period
    const { getIftaDataForPeriod, calculateQuarterlyTaxes } = await import('@/lib/fetchers/iftaFetchers');
    const iftaData = await getIftaDataForPeriod(orgId, `Q${q}`, year);
    const taxCalculations = await calculateQuarterlyTaxes(orgId, `Q${q}`, year);

    // Check if report already exists
    let report = await db.iftaReport.findFirst({
      where: {
        organizationId: orgId,
        quarter: q,
        year: y,
      },
    });

    // Create or update the report
    const reportData = {
      organizationId: orgId,
      quarter: q,
      year: y,
      status: 'draft',
      totalMiles: iftaData.summary.totalMiles,
      totalGallons: iftaData.summary.totalGallons,
      totalTaxOwed: taxCalculations.summary.totalTaxDue,
      totalTaxPaid: taxCalculations.summary.totalCredits,
      calculationData: {
        summary: taxCalculations.summary,
        jurisdictions: taxCalculations.jurisdictions,
        period: taxCalculations.period,
        calculatedAt: taxCalculations.calculatedAt,
      },
      submittedBy: user.id,
      dueDate: calculateQuarterDueDate(q, y),
      notes: `Auto-generated report for Q${q} ${y}`,
      updatedAt: new Date(),
    };

    if (report) {
      report = await db.iftaReport.update({
        where: { id: report.id },
        data: reportData,
      });
    } else {
      report = await db.iftaReport.create({
        data: {
          ...reportData,
          createdAt: new Date(),
        },
      });
    }

    // Create tax calculations records
    await Promise.all(
      taxCalculations.jurisdictions.map(async (jurisdiction: any) => {
        await db.iftaTaxCalculation.upsert({
          where: {
            report_jurisdiction_unique: {
              reportId: report.id,
              jurisdiction: jurisdiction.jurisdiction
            }
          },
          create: {
            organizationId: orgId,
            reportId: report.id,
            jurisdiction: jurisdiction.jurisdiction,
            totalMiles: jurisdiction.miles,
            taxableMiles: jurisdiction.miles,
            fuelPurchased: jurisdiction.fuelPurchased,
            fuelConsumed: jurisdiction.fuelConsumed,
            taxRate: jurisdiction.taxRate,
            taxDue: jurisdiction.taxDue,
            taxPaid: jurisdiction.credits,
            taxCredits: jurisdiction.credits,
            adjustments: 0,
            netTaxDue: jurisdiction.netTax,
            calculatedBy: user.id,
            isValidated: false,
          },
          update: {
            totalMiles: jurisdiction.miles,
            taxableMiles: jurisdiction.miles,
            fuelPurchased: jurisdiction.fuelPurchased,
            fuelConsumed: jurisdiction.fuelConsumed,
            taxRate: jurisdiction.taxRate,
            taxDue: jurisdiction.taxDue,
            taxPaid: jurisdiction.credits,
            taxCredits: jurisdiction.credits,
            netTaxDue: jurisdiction.netTax,
            calculatedBy: user.id,
          },
        });
      })
    );

    // Create audit log
    await db.iftaAuditLog.create({
      data: {
        organizationId: orgId,
        entityType: 'REPORT',
        entityId: report.id,
        action: report ? 'UPDATE' : 'CREATE',
        newValues: reportData,
        userId: user.id,
        notes: `IFTA report ${report ? 'updated' : 'created'} for Q${q} ${y}`,
      },
    });

    revalidatePath(`/dashboard/${orgId}/ifta`);
    
    return {
      success: true,
      data: {
        ...report,
        taxCalculations: taxCalculations.jurisdictions,
        summary: taxCalculations.summary,
      },
    };
  } catch (error) {
    console.error('Error generating IFTA report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate IFTA report',
    };
  }
}

// Helper function to calculate quarter due dates
function calculateQuarterDueDate(quarter: number, year: number): Date {
  // IFTA quarter due dates: Q1=April 30, Q2=July 31, Q3=October 31, Q4=January 31 (next year)
  const dueDateMap = {
    1: new Date(year, 3, 30), // April 30
    2: new Date(year, 6, 31), // July 31
    3: new Date(year, 9, 31), // October 31
    4: new Date(year + 1, 0, 31), // January 31 next year
  };
  return dueDateMap[quarter as keyof typeof dueDateMap];
}

// -------------------- PDF Generation Actions --------------------

/**
 * Generate IFTA Quarterly Report PDF
 */
export async function generateIFTAReportPDF(
  orgId: string,
  quarter: string,
  year: string,
  options: PDFOptions = {
    format: 'Letter',
    orientation: 'portrait',
    includeSignature: false,
    watermark: 'draft'
  }
): Promise<PDFGenerationResult> {
  try {
    // Validate inputs
    if (!orgId || !quarter || !year) {
      return {
        success: false,
        error: 'Missing required parameters: orgId, quarter, or year',
      };
    }

    // Validate quarter format
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      return {
        success: false,
        error: 'Invalid quarter format. Must be Q1, Q2, Q3, or Q4',
      };
    }

    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > new Date().getFullYear() + 1) {
      return {
        success: false,
        error: 'Invalid year. Must be between 2020 and next year',
      };
    }    // Log PDF generation start
    await db.iftaPDFGenerationLog.create({
      data: {
        organizationId: orgId,
        userId: 'system', // Would be actual user ID in production
        reportType: 'QUARTERLY',
        parameters: JSON.parse(JSON.stringify({ quarter, year, options })),
        status: 'PENDING',
      },
    });    // Generate PDF using service
    const serviceOptions = {
      ...options,
      watermark: options.watermark || 'draft'
    };
    const result = await pdfService.generateQuarterlyReport(orgId, quarter, yearNum, serviceOptions);

    // Save PDF record if successful
    if (result.success && result.filePath) {
      await db.iftaReportPDF.create({
        data: {
          organizationId: orgId,
          reportId: `quarterly-${quarter}-${year}`, // Would link to actual report
          reportType: 'QUARTERLY',
          quarter,
          year: yearNum,
          fileName: result.fileName!,
          filePath: result.filePath,
          fileSize: result.fileSize!,
          generatedBy: 'system',
          isOfficial: options.watermark === 'official',
          watermark: options.watermark,
          metadata: result.metadata,
        },
      });
    }

    return result;

  } catch (error) {
    console.error('Error generating IFTA report PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate IFTA Trip Log PDF
 */
export async function generateTripLogPDF(
  orgId: string,
  options: PDFOptions & {
    vehicleId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<PDFGenerationResult> {
  try {
    // Validate inputs
    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID is required',
      };
    }

    // Parse dates if provided
    const parsedOptions = {
      ...options,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
    };

    // Validate date range
    if (parsedOptions.startDate && parsedOptions.endDate) {
      if (parsedOptions.startDate > parsedOptions.endDate) {
        return {
          success: false,
          error: 'Start date cannot be after end date',
        };
      }
    }    // Log PDF generation start
    await db.iftaPDFGenerationLog.create({
      data: {
        organizationId: orgId,
        userId: 'system',
        reportType: 'TRIP_LOG',
        parameters: JSON.parse(JSON.stringify(parsedOptions)),
        status: 'PENDING',
      },
    });    // Generate PDF using service
    const serviceOptions = {
      ...parsedOptions,
      reportType: 'TRIP_LOG'
    };
    const result = await pdfService.generateTripLogReport(orgId, serviceOptions);

    // Save PDF record if successful
    if (result.success && result.filePath) {
      await db.iftaReportPDF.create({
        data: {
          organizationId: orgId,
          reportId: `trip-log-${Date.now()}`,
          reportType: 'TRIP_LOG',
          fileName: result.fileName!,
          filePath: result.filePath,
          fileSize: result.fileSize!,
          generatedBy: 'system',
          isOfficial: options.watermark === 'official',
          watermark: options.watermark,
          metadata: result.metadata,
        },
      });
    }

    return result;

  } catch (error) {
    console.error('Error generating trip log PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate IFTA Fuel Summary PDF
 */
export async function generateFuelSummaryPDF(
  orgId: string,
  dateRange: { startDate: string; endDate: string },
  options: PDFOptions = {
    format: 'Letter',
    orientation: 'portrait',
    includeSignature: false,
    watermark: 'draft'
  }
): Promise<PDFGenerationResult> {
  try {
    // Validate inputs
    if (!orgId || !dateRange.startDate || !dateRange.endDate) {
      return {
        success: false,
        error: 'Organization ID and date range are required',
      };
    }

    // Parse and validate dates
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    if (startDate > endDate) {
      return {
        success: false,
        error: 'Start date cannot be after end date',
      };
    }    // Log PDF generation start
    await db.iftaPDFGenerationLog.create({
      data: {
        organizationId: orgId,
        userId: 'system',
        reportType: 'FUEL_SUMMARY',
        parameters: JSON.parse(JSON.stringify({ dateRange, options })),
        status: 'PENDING',
      },
    });

    // Generate PDF using service
    const result = await pdfService.generateFuelSummaryReport(orgId, {
      ...options,
      reportType: 'FUEL_SUMMARY',
      startDate,
      endDate,
    });

    // Save PDF record if successful
    if (result.success && result.filePath) {
      await db.iftaReportPDF.create({
        data: {
          organizationId: orgId,
          reportId: `fuel-summary-${Date.now()}`,
          reportType: 'FUEL_SUMMARY',
          fileName: result.fileName!,
          filePath: result.filePath,
          fileSize: result.fileSize!,
          generatedBy: 'system',
          isOfficial: options.watermark === 'official',
          watermark: options.watermark,
          metadata: result.metadata,
        },
      });
    }

    return result;

  } catch (error) {
    console.error('Error generating fuel summary PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate Custom IFTA Report PDF
 */
export async function generateCustomIFTAReport(
  orgId: string,
  customOptions: CustomReportOptions
): Promise<PDFGenerationResult> {
  try {
    // Validate inputs
    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID is required',
      };
    }

    // Validate custom options
    if (!customOptions.reportType) {
      return {
        success: false,
        error: 'Report type is required',
      };
    }

    // Validate date range if provided
    if (customOptions.dateRange) {
      const { startDate, endDate } = customOptions.dateRange;
      if (startDate > endDate) {
        return {
          success: false,
          error: 'Start date cannot be after end date',
        };
      }
    }    // Log PDF generation start
    await db.iftaPDFGenerationLog.create({
      data: {
        organizationId: orgId,
        userId: 'system',
        reportType: 'CUSTOM',
        parameters: JSON.parse(JSON.stringify(customOptions)),
        status: 'PENDING',
      },
    });

    // For now, use the appropriate generator based on report content
    let result: PDFGenerationResult;

    if (customOptions.includeTrips && !customOptions.includeFuel) {
      // Generate trip log style report
      result = await pdfService.generateTripLogReport(orgId, customOptions);
    } else if (customOptions.includeFuel && !customOptions.includeTrips) {
      // Generate fuel summary style report
      result = await pdfService.generateFuelSummaryReport(orgId, customOptions);
    } else {
      // Generate comprehensive report (would need custom implementation)
      result = {
        success: false,
        error: 'Custom comprehensive reports not yet implemented',
      };
    }

    // Save PDF record if successful
    if (result.success && result.filePath) {
      await db.iftaReportPDF.create({
        data: {
          organizationId: orgId,
          reportId: `custom-${Date.now()}`,
          reportType: 'CUSTOM',
          fileName: result.fileName!,
          filePath: result.filePath,
          fileSize: result.fileSize!,
          generatedBy: 'system',
          isOfficial: customOptions.watermark === 'official',
          watermark: customOptions.watermark,
          metadata: result.metadata,
        },
      });
    }

    return result;

  } catch (error) {
    console.error('Error generating custom IFTA report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get PDF Generation History
 */
export async function getPDFGenerationHistory(
  orgId: string,
  limit: number = 20
): Promise<IftaPDFGenerationLog[]> {
  try {
    const logs = await db.iftaPDFGenerationLog.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return logs.map(log => ({
      id: log.id,
      organizationId: log.organizationId,
      userId: log.userId,
      reportType: log.reportType,
      parameters: log.parameters as Record<string, any>,
      status: log.status,
      filePath: log.filePath || undefined,
      fileName: log.fileName || undefined,
      fileSize: log.fileSize || undefined,
      errorMessage: log.errorMessage || undefined,
      startedAt: log.startedAt,
      completedAt: log.completedAt || undefined,
      user: log.user ? {
        firstName: log.user.firstName || undefined,
        lastName: log.user.lastName || undefined,
        email: log.user.email || undefined,
      } : undefined,
    }));

  } catch (error) {
    console.error('Error fetching PDF generation history:', error);
    return [];
  }
}

/**
 * Get Available PDF Reports
 */
export async function getAvailablePDFReports(
  orgId: string,
  reportType?: string
): Promise<IftaReportPDF[]> {
  try {
    const reports = await db.iftaReportPDF.findMany({
      where: {
        organizationId: orgId,
        ...(reportType && { reportType }),
      },
      orderBy: {
        generatedAt: 'desc',
      },
      include: {
        generatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return reports.map(report => ({
      id: report.id,
      organizationId: report.organizationId,
      reportId: report.reportId,
      reportType: report.reportType,
      quarter: report.quarter || undefined,
      year: report.year || undefined,
      fileName: report.fileName,
      filePath: report.filePath,
      fileSize: report.fileSize,
      mimeType: report.mimeType,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      isOfficial: report.isOfficial,
      watermark: report.watermark || undefined,
      downloadCount: report.downloadCount,
      lastDownload: report.lastDownload || undefined,
      metadata: report.metadata as Record<string, any> || undefined,
      generatedByUser: report.generatedByUser ? {
        firstName: report.generatedByUser.firstName || undefined,
        lastName: report.generatedByUser.lastName || undefined,
        email: report.generatedByUser.email || undefined,
      } : undefined,
    }));

  } catch (error) {
    console.error('Error fetching available PDF reports:', error);
    return [];
  }
}

/**
 * Delete PDF Report
 */
export async function deletePDFReport(
  orgId: string,
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const report = await db.iftaReportPDF.findFirst({
      where: {
        id: reportId,
        organizationId: orgId,
      },
    });

    if (!report) {
      return {
        success: false,
        error: 'PDF report not found or access denied',
      };
    }

    // Delete from database
    await db.iftaReportPDF.delete({
      where: {
        id: reportId,
      },
    });

    // TODO: Delete actual file from storage
    // await fs.unlink(report.filePath);

    return { success: true };

  } catch (error) {
    console.error('Error deleting PDF report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Submit IFTA Report for Filing
 */
export async function submitIftaReportAction(
  orgId: string,
  reportId: string
) {
  try {
    const user = await checkIftaPermissions(orgId);
    
    // Get the report with calculations
    const report = await db.iftaReport.findFirst({
      where: {
        id: reportId,
        organizationId: orgId,
      },
      include: {
        taxCalculations: true,
      },
    });

    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    if (report.status === 'submitted') {
      return { success: false, error: 'Report already submitted' };
    }

    // Validate all tax calculations
    const validationErrors = [];
    for (const calc of report.taxCalculations) {
      if (!calc.isValidated) {
        validationErrors.push(`${calc.jurisdiction} tax calculation not validated`);
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Validation required: ${validationErrors.join(', ')}`,
      };
    }

    // Update report status
    const submittedReport = await db.iftaReport.update({
      where: { id: reportId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: user.id,
        filedDate: new Date(),
      },
    });

    // Create submission audit log
    await db.iftaAuditLog.create({
      data: {
        organizationId: orgId,
        entityType: 'REPORT',
        entityId: reportId,
        action: 'SUBMIT',
        oldValues: { status: 'draft' },
        newValues: { status: 'submitted', submittedAt: new Date() },
        userId: user.id,
        notes: 'IFTA report submitted for filing',
      },
    });

    revalidatePath(`/dashboard/${orgId}/ifta`);

    return {
      success: true,
      data: submittedReport,
    };
  } catch (error) {
    console.error('Error submitting IFTA report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit report',
    };
  }
}

/**
 * Validate Tax Calculation
 */
export async function validateTaxCalculationAction(
  orgId: string,
  calculationId: string
) {
  try {
    const user = await checkIftaPermissions(orgId);
    
    const calculation = await db.iftaTaxCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId: orgId,
      },
    });

    if (!calculation) {
      return { success: false, error: 'Tax calculation not found' };
    }

    // Perform validation checks
    const validationErrors = [];
    
    // Check for reasonable fuel efficiency (3-12 MPG for commercial vehicles)
    const mpg = calculation.totalMiles / Number(calculation.fuelConsumed);
    if (mpg < 3 || mpg > 12) {
      validationErrors.push(`Unusual fuel efficiency: ${mpg.toFixed(2)} MPG`);
    }

    // Check for negative values
    if (Number(calculation.fuelPurchased) < 0 || Number(calculation.fuelConsumed) < 0) {
      validationErrors.push('Negative fuel values detected');
    }

    // Check if tax rate is reasonable (0.05 to 0.60 per gallon)
    const taxRate = Number(calculation.taxRate);
    if (taxRate < 0.05 || taxRate > 0.60) {
      validationErrors.push(`Unusual tax rate: $${taxRate.toFixed(4)} per gallon`);
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`,
        warnings: validationErrors,
      };
    }

    // Mark as validated
    const validatedCalculation = await db.iftaTaxCalculation.update({
      where: { id: calculationId },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: user.id,
      },
    });

    // Create validation audit log
    await db.iftaAuditLog.create({
      data: {
        organizationId: orgId,
        entityType: 'TAX_CALCULATION',
        entityId: calculationId,
        action: 'APPROVE',
        oldValues: { isValidated: false },
        newValues: { isValidated: true, validatedAt: new Date() },
        userId: user.id,
        notes: `Tax calculation validated for ${calculation.jurisdiction}`,
      },
    });

    return {
      success: true,
      data: validatedCalculation,
    };
  } catch (error) {
    console.error('Error validating tax calculation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate calculation',
    };
  }
}

/**
 * Update Tax Calculation with Manual Adjustments
 */
export async function updateTaxCalculationAction(
  orgId: string,
  calculationId: string,
  adjustments: {
    adjustments?: number;
    taxCredits?: number;
    notes?: string;
  }
) {
  try {
    const user = await checkIftaPermissions(orgId);
    
    const calculation = await db.iftaTaxCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId: orgId,
      },
    });

    if (!calculation) {
      return { success: false, error: 'Tax calculation not found' };
    }

    // Calculate new net tax due
    const adjustmentAmount = adjustments.adjustments || 0;
    const newCredits = adjustments.taxCredits !== undefined 
      ? adjustments.taxCredits 
      : Number(calculation.taxCredits);
    const newNetTaxDue = Number(calculation.taxDue) + adjustmentAmount - newCredits;

    const updatedCalculation = await db.iftaTaxCalculation.update({
      where: { id: calculationId },
      data: {
        adjustments: adjustmentAmount,
        taxCredits: newCredits,
        netTaxDue: newNetTaxDue,
        isValidated: false, // Reset validation when manually adjusted
        calculatedBy: user.id,
      },
    });

    // Create adjustment audit log
    await db.iftaAuditLog.create({
      data: {
        organizationId: orgId,
        entityType: 'TAX_CALCULATION',
        entityId: calculationId,
        action: 'UPDATE',
        oldValues: {
          adjustments: Number(calculation.adjustments),
          taxCredits: Number(calculation.taxCredits),
          netTaxDue: Number(calculation.netTaxDue),
        },
        newValues: {
          adjustments: adjustmentAmount,
          taxCredits: newCredits,
          netTaxDue: newNetTaxDue,
        },
        userId: user.id,
        notes: adjustments.notes || 'Manual tax calculation adjustment',
      },
    });

    return {
      success: true,
      data: updatedCalculation,
    };
  } catch (error) {
    console.error('Error updating tax calculation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update calculation',
    };
  }
}

/**
 * Get IFTA Report Status and Summary
 */
export async function getIftaReportStatusAction(
  orgId: string,
  reportId: string
) {
  try {
    await checkIftaPermissions(orgId);
    
    const report = await db.iftaReport.findFirst({
      where: {
        id: reportId,
        organizationId: orgId,
      },
      include: {
        taxCalculations: {
          include: {
            calculatedByUser: {
              select: { firstName: true, lastName: true },
            },
            validatedByUser: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        submittedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    // Calculate summary statistics
    const totalJurisdictions = report.taxCalculations.length;
    const validatedJurisdictions = report.taxCalculations.filter(calc => calc.isValidated).length;
    const totalNetTaxDue = report.taxCalculations.reduce(
      (sum, calc) => sum + Number(calc.netTaxDue), 
      0
    );

    const summary = {
      reportId: report.id,
      quarter: report.quarter,
      year: report.year,
      status: report.status,
      totalJurisdictions,
      validatedJurisdictions,
      validationProgress: (validatedJurisdictions / totalJurisdictions) * 100,
      totalMiles: report.totalMiles,
      totalGallons: Number(report.totalGallons),
      totalNetTaxDue,
      dueDate: report.dueDate,
      submittedAt: report.submittedAt,
      submittedBy: report.submittedByUser ? 
        `${report.submittedByUser.firstName} ${report.submittedByUser.lastName}` : null,
      canSubmit: validatedJurisdictions === totalJurisdictions && report.status === 'draft',
    };

    return {
      success: true,
      data: {
        report: summary,
        taxCalculations: report.taxCalculations,
      },
    };
  } catch (error) {
    console.error('Error getting report status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get report status',
    };
  }
}
