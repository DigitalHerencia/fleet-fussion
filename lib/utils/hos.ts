import { HosEntry, HosLog, HosViolation } from '@/types/compliance';

export interface DriverHOSStatus {
  driverId: string;
  currentStatus: HosEntry['status'] | 'off_duty';
  availableDriveTime: number;
  availableOnDutyTime: number;
  usedDriveTime: number;
  usedOnDutyTime: number;
  cycleHours: number;
  usedCycleHours: number;
  restartAvailable: boolean;
  violations: HosViolation[];
  lastLoggedAt: Date | null;
  complianceStatus: 'compliant' | 'violation' | 'pending';
}

const DRIVE_LIMIT = 11 * 60;
const ON_DUTY_LIMIT = 14 * 60;
const CYCLE_LIMIT = 70 * 60;

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / 60000);
}

export function calculateHosStatus(
  driverId: string,
  hosLogs: HosLog[]
): DriverHOSStatus {
  if (!hosLogs.length) {
    return {
      driverId,
      currentStatus: 'off_duty',
      availableDriveTime: DRIVE_LIMIT,
      availableOnDutyTime: ON_DUTY_LIMIT,
      usedDriveTime: 0,
      usedOnDutyTime: 0,
      cycleHours: CYCLE_LIMIT,
      usedCycleHours: 0,
      restartAvailable: false,
      violations: [],
      lastLoggedAt: null,
      complianceStatus: 'pending',
    };
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const cycleStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let usedDrive = 0;
  let usedOnDuty = 0;
  let cycleUsed = 0;
  const entries: HosEntry[] = [];

  for (const log of hosLogs) {
    if (Array.isArray(log.logs)) {
      entries.push(...log.logs);
    }
  }
  entries.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (const entry of entries) {
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    const mins = minutesBetween(start, end);

    if (start >= startOfToday) {
      if (entry.status === 'driving') usedDrive += mins;
      if (['driving', 'on_duty'].includes(entry.status)) usedOnDuty += mins;
    }
    if (start >= cycleStart) {
      if (['driving', 'on_duty'].includes(entry.status)) cycleUsed += mins;
    }
  }

  const lastEntry = entries[entries.length - 1];
  let lastOnDutyEnd: Date | null = null;
  for (const entry of entries) {
    if (!['off_duty', 'sleeper_berth'].includes(entry.status)) {
      const end = new Date(entry.endTime);
      if (!lastOnDutyEnd || end > lastOnDutyEnd) lastOnDutyEnd = end;
    }
  }
  const restartAvailable =
    !lastOnDutyEnd ||
    now.getTime() - lastOnDutyEnd.getTime() >= 34 * 60 * 60 * 1000;

  const violations: HosViolation[] = [];
  if (usedDrive >= DRIVE_LIMIT) {
    violations.push({
      id: '11',
      type: '11_hour',
      description: 'Exceeded 11-hour driving limit',
      severity: 'major',
      timestamp: now,
      resolved: false,
      status: 'open',
    });
  }
  if (usedOnDuty >= ON_DUTY_LIMIT) {
    violations.push({
      id: '14',
      type: '14_hour',
      description: 'Exceeded 14-hour on-duty limit',
      severity: 'major',
      timestamp: now,
      resolved: false,
      status: 'open',
    });
  }
  if (cycleUsed >= CYCLE_LIMIT) {
    violations.push({
      id: '70',
      type: '70_hour',
      description: 'Exceeded 70-hour 8-day limit',
      severity: 'major',
      timestamp: now,
      resolved: false,
      status: 'open',
    });
  }

  return {
    driverId,
    currentStatus: lastEntry ? lastEntry.status : 'off_duty',
    availableDriveTime: Math.max(DRIVE_LIMIT - usedDrive, 0),
    availableOnDutyTime: Math.max(ON_DUTY_LIMIT - usedOnDuty, 0),
    usedDriveTime: usedDrive,
    usedOnDutyTime: usedOnDuty,
    cycleHours: CYCLE_LIMIT,
    usedCycleHours: cycleUsed,
    restartAvailable,
    violations,
    lastLoggedAt: lastEntry ? new Date(lastEntry.endTime) : null,
    complianceStatus: violations.length > 0 ? 'violation' : 'compliant',
  };
}
