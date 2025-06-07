/**
 * Type definitions for the IFTA (International Fuel Tax Agreement) module
 */

export interface FuelPurchase {
  id: string
  tenantId: string
  vehicleId: string
  driverId: string
  date: Date
  location: {
    name: string
    address?: string
    city: string
    state: string
    country: string
  }
  gallons: number
  cost: number
  odometer: number
  fuelType: "diesel" | "gasoline"
  receiptUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface MileageByJurisdiction {
  id: string
  tenantId: string
  vehicleId: string
  quarter: number
  year: number
  jurisdictions: JurisdictionMileage[]
  totalMiles: number
  createdAt: Date
  updatedAt: Date
}

export interface JurisdictionMileage {
  jurisdiction: string // State/Province code
  miles: number
  fuelGallons?: number
  taxPaid?: number
}

export interface IftaReport {
  id: string
  tenantId: string
  quarter: number
  year: number
  status: "draft" | "submitted" | "accepted" | "rejected"
  dueDate: Date
  submittedDate?: Date
  totalMiles: number
  totalGallons: number
  mpg: number
  jurisdictionSummaries: IftaJurisdictionSummary[]
  netTaxDue: number
  createdAt: Date
  updatedAt: Date
}

export interface IftaJurisdictionSummary {
  jurisdiction: string
  totalMiles: number
  taxableMiles: number
  taxableGallons: number
  taxRate: number
  taxDue: number
  taxPaid: number
  netTaxDue: number
}

export interface TripReport {
  id: string
  tenantId: string
  vehicleId: string
  driverId: string
  loadId?: string
  startDate: Date
  endDate: Date
  startOdometer: number
  endOdometer: number
  totalMiles: number
  jurisdictions: {
    jurisdiction: string
    miles: number
  }[]
  fuelPurchases: FuelPurchase[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface IftaSummary {
  totalMiles: number
  totalGallons: number
  averageMpg: number
  totalFuelCost: number
}

export interface IftaReportSummary {
  id: string
  status: string
  submittedAt: Date | null
  dueDate: Date
}

export interface IftaData {
  period: { quarter: number; year: number }
  summary: IftaSummary
  trips: TripReport[]
  fuelPurchases: FuelPurchase[]
  jurisdictionSummary: IftaJurisdictionSummary[]
  report: IftaReportSummary | null
}
