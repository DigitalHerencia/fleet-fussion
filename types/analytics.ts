/**
 * Type definitions for the analytics module
 */

export interface AnalyticsTimeframe {
  start: Date
  end: Date
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
}

export interface RevenueMetrics {
  timeframe: AnalyticsTimeframe
  totalRevenue: number
  revenueByCustomer: {
    customerId: string
    customerName: string
    revenue: number
    percentage: number
  }[]
  revenueByService: {
    service: string
    revenue: number
    percentage: number
  }[]
  averageRatePerMile: number
  revenuePerTruck: number
  revenuePerDriver: number
  revenueByPeriod: {
    period: string
    revenue: number
    target?: number
  }[]
}

export interface ExpenseMetrics {
  timeframe: AnalyticsTimeframe
  totalExpenses: number
  expensesByCategory: {
    category: string
    amount: number
    percentage: number
  }[]
  fuelExpenses: number
  maintenanceExpenses: number
  driverPayroll: number
  insuranceCosts: number
  expensesByPeriod: {
    period: string
    expenses: number
    budget?: number
  }[]
}

export interface OperationalMetrics {
  timeframe: AnalyticsTimeframe
  totalMiles: number
  loadedMiles: number
  emptyMiles: number
  deadheadPercentage: number
  totalLoads: number
  averageLengthOfHaul: number
  fuelEfficiency: number
  utilizationRate: number
  onTimeDeliveryRate: number
  driverRetention: number
}

export interface DriverPerformanceMetrics {
  timeframe: AnalyticsTimeframe
  drivers: {
    driverId: string
    driverName: string
    miles: number
    loads: number
    revenue: number
    fuelEfficiency: number
    onTimeDelivery: number
    safetyScore: number
  }[]
  averageMilesPerDriver: number
  averageLoadsPerDriver: number
  averageRevenuePerDriver: number
}

export interface VehiclePerformanceMetrics {
  timeframe: AnalyticsTimeframe
  vehicles: {
    vehicleId: string
    vehicleNumber: string
    miles: number
    loads: number
    revenue: number
    fuelEfficiency: number
    maintenanceCosts: number
    utilization: number
  }[]
  averageMilesPerVehicle: number
  averageLoadsPerVehicle: number
  averageRevenuePerVehicle: number
  maintenanceCostPerMile: number
}

export interface ProfitabilityMetrics {
  timeframe: AnalyticsTimeframe
  grossRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  operatingRatio: number
  costPerMile: number
  revenuePerMile: number
  profitPerMile: number
  profitByPeriod: {
    period: string
    profit: number
    margin: number
  }[]
}

export interface RevenueEntry {
  date: string
  revenue: number
  loads: number
}

export interface ExpenseEntry {
  date: string
  amount: number
  gallons: number
}

export interface ProfitMarginEntry {
  date: string
  revenue: number
  expenses: number
  profit: number
  margin: number
}

export interface FinancialAnalytics {
  revenue: RevenueEntry[]
  expenses: ExpenseEntry[]
  profitMargin: ProfitMarginEntry[]
}
