import { describe, it, expect } from 'vitest'
import { calculateHosStatus } from '../lib/utils/hos'
import { HosLog, HosEntry } from '../types/compliance'

function createEntry(status: HosEntry['status'], start: Date, minutes: number): HosEntry {
  return {
    id: Math.random().toString(),
    startTime: start,
    endTime: new Date(start.getTime() + minutes * 60000),
    status,
    location: '',
    automaticEntry: false,
    source: 'manual'
  }
}

describe('calculateHosStatus', () => {
  it('handles off-duty only logs', () => {
    const base = new Date()
    base.setHours(0,0,0,0)
    const log: HosLog = {
      id: '1',
      tenantId: 't1',
      driverId: 'd1',
      date: base,
      status: 'compliant',
      logs: [createEntry('off_duty', base, 60)],
      breaks: [],
      totalDriveTime: 0,
      totalOnDutyTime: 0,
      totalOffDutyTime: 60,
      sleeperBerthTime: 0,
      personalConveyanceTime: 0,
      yardMovesTime: 0,
      createdAt: base,
      updatedAt: base
    }
    const result = calculateHosStatus('d1', [log])
    expect(result.currentStatus).toBe('off_duty')
    expect(result.usedDriveTime).toBe(0)
    expect(result.complianceStatus).toBe('compliant')
  })

  it('computes on-duty driving within limits', () => {
    const base = new Date()
    base.setHours(0,0,0,0)
    const entries = [
      createEntry('on_duty', base, 120),
      createEntry('driving', new Date(base.getTime() + 120*60000), 300),
      createEntry('on_duty', new Date(base.getTime() + 420*60000), 60)
    ]
    const log: HosLog = {
      id: '2',
      tenantId: 't1',
      driverId: 'd1',
      date: base,
      status: 'compliant',
      logs: entries,
      breaks: [],
      totalDriveTime: 300,
      totalOnDutyTime: 480,
      totalOffDutyTime: 0,
      sleeperBerthTime: 0,
      personalConveyanceTime: 0,
      yardMovesTime: 0,
      createdAt: base,
      updatedAt: base
    }
    const res = calculateHosStatus('d1', [log])
    expect(res.usedDriveTime).toBe(300)
    expect(res.availableDriveTime).toBe(360)
    expect(res.currentStatus).toBe('on_duty')
    expect(res.complianceStatus).toBe('compliant')
  })

  it('detects driving violation', () => {
    const base = new Date()
    base.setHours(0,0,0,0)
    const log: HosLog = {
      id: '3',
      tenantId: 't1',
      driverId: 'd1',
      date: base,
      status: 'violation',
      logs: [createEntry('driving', base, 720)],
      breaks: [],
      totalDriveTime: 720,
      totalOnDutyTime: 720,
      totalOffDutyTime: 0,
      sleeperBerthTime: 0,
      personalConveyanceTime: 0,
      yardMovesTime: 0,
      createdAt: base,
      updatedAt: base
    }
    const res = calculateHosStatus('d1', [log])
    expect(res.complianceStatus).toBe('violation')
    expect(res.availableDriveTime).toBe(0)
  })

  it('flags near violation when less than 30 minutes remain', () => {
    const base = new Date()
    base.setHours(0,0,0,0)
    const log: HosLog = {
      id: '4',
      tenantId: 't1',
      driverId: 'd1',
      date: base,
      status: 'compliant',
      logs: [createEntry('driving', base, 645)],
      breaks: [],
      totalDriveTime: 645,
      totalOnDutyTime: 645,
      totalOffDutyTime: 0,
      sleeperBerthTime: 0,
      personalConveyanceTime: 0,
      yardMovesTime: 0,
      createdAt: base,
      updatedAt: base
    }
    const res = calculateHosStatus('d1', [log])
    expect(res.complianceStatus).toBe('compliant')
    expect(res.availableDriveTime).toBe(15)
  })
})
