/**
 * Core type definitions for the FleetFusion TMS application
 *
 * This file contains the base types used throughout the application
 * TODO: Expand types as needed when implementing real backend services
 *
 * NOTE: All ABAC/auth types (UserRole, Permission, ResourceType, etc.)
 * are now defined in types/auth.ts or types/abac.ts. Do not define or export them here.
 *
 * IMPORTANT: If you need UserRole, Permission, ResourceType, etc., import them from '@/types/auth' or '@/types/abac'.
 */

// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: import("./auth").UserRole // Use canonical type
  tenantId: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// Removed duplicate UserRole, Permission, ResourceType, etc. Use from types/auth or types/abac

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: SubscriptionPlan
  createdAt: Date
  updatedAt: Date
  settings: TenantSettings
  status: "active" | "suspended" | "pending"
}

export interface TenantSettings {
  logo?: string
  primaryColor?: string
  companyAddress?: string
  contactEmail?: string
  contactPhone?: string
  dotNumber?: string
  mcNumber?: string
  timeZone: string
  features: {
    dispatch: boolean
    maintenance: boolean
    ifta: boolean
    analytics: boolean
    compliance: boolean
    accounting: boolean
  }
}

export type SubscriptionPlan = "free" | "starter" | "professional" | "enterprise"

// Dashboard Types
export interface DashboardMetrics {
  activeLoads: number
  availableDrivers: number
  pendingMaintenance: number
  monthlyRevenue: number
  fuelExpenses: number
  complianceScore: number
}

// Common Types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
