/**
 * Authentication and Authorization Types for FleetFusion
 * 
 * Defines comprehensive ABAC (Attribute-Based Access Control) types
 * for multi-tenant fleet management system
 */

// Core user roles within an organization
export type UserRole = 
  | 'admin'        // Full access to organization
  | 'dispatcher'   // Can manage loads, drivers, vehicles
  | 'driver'       // Can view assigned loads, update status
  | 'compliance'   // Can view/manage compliance documents
  | 'accountant'   // Can access IFTA reports and financial data
  | 'viewer'       // Read-only access

// Aligned permission structure with ABAC types
export type Permission = string

// Resource types for ABAC
export type ResourceType = 
  | 'user'
  | 'driver'
  | 'vehicle'
  | 'load'
  | 'document'
  | 'ifta_report'
  | 'organization'
  | 'billing'

// Permission actions for ABAC
export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'assign'
  | 'approve'
  | 'report'

// Generate permission strings from resource and action
export function createPermission(action: PermissionAction, resource: ResourceType): Permission {
  return `${action}:${resource}`
}

// Role-based permission mapping using consistent structure
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to everything - generate all combinations
    'create:user', 'read:user', 'update:user', 'delete:user', 'manage:user',
    'create:driver', 'read:driver', 'update:driver', 'delete:driver', 'manage:driver',
    'create:vehicle', 'read:vehicle', 'update:vehicle', 'delete:vehicle', 'manage:vehicle',
    'create:load', 'read:load', 'update:load', 'delete:load', 'manage:load', 'assign:load',
    'create:document', 'read:document', 'update:document', 'delete:document', 'approve:document',
    'create:ifta_report', 'read:ifta_report', 'update:ifta_report', 'report:ifta_report',
    'read:organization', 'update:organization', 'manage:organization',
    'read:billing', 'manage:billing'
  ],
  
  dispatcher: [
    'read:vehicle', 'update:vehicle',
    'read:driver', 'update:driver',
    'create:load', 'read:load', 'update:load', 'assign:load',
    'read:document', 'report:load'
  ],
  
  driver: [
    'read:load', 'update:load', // Only assigned loads
    'read:document', 'create:document', // Own documents only
    'read:user' // Own profile only
  ],
  
  compliance: [
    'read:vehicle',
    'read:driver', 'update:driver',
    'create:document', 'read:document', 'update:document', 'delete:document', 'approve:document',
    'report:document'
  ],
  
    
  accountant: [
    'read:load',
    'read:driver',
    'read:vehicle',
    'create:ifta_report', 'read:ifta_report', 'update:ifta_report', 'report:ifta_report',
    'read:billing'
  ],
  
  viewer: [
    'read:load',
    'read:driver', 
    'read:vehicle',
    'read:document',
    'read:ifta_report'
  ]
} as const

// Clerk user metadata structure
export interface ClerkUserMetadata {
  organizationId: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
  lastLogin?: string
  onboardingCompleted: boolean
}

// Organization metadata in Clerk
export interface ClerkOrganizationMetadata {
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
  maxUsers: number
  features: string[]
  billingEmail: string
  createdAt: string
  dotNumber?: string
  mcNumber?: string
  settings: {
    timezone: string
    dateFormat: string
    distanceUnit: 'miles' | 'kilometers'
    fuelUnit: 'gallons' | 'liters'
  }
}

// Extended user context with ABAC data
export interface UserContext {
  name: string | undefined
  userId: string
  organizationId: string
  role: UserRole
  permissions: Permission[]
  email: string
  firstName?: string
  lastName?: string
  profileImage?: string
  isActive: boolean
  onboardingCompleted: boolean
  organizationMetadata: ClerkOrganizationMetadata
}

// Auth state for React context
export interface AuthState {
  user: UserContext | null
  isLoaded: boolean
  isSignedIn: boolean
  isLoading: boolean
  organization: {
    id: string
    name: string
    slug: string
    metadata: ClerkOrganizationMetadata
  } | null
  company: {
    id: string
    name: string
    dotNumber?: string
    mcNumber?: string
  } | null
}

// Webhook payload types for Clerk synchronization
export interface UserWebhookPayload {
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    profile_image_url?: string
    public_metadata: ClerkUserMetadata
    organization_memberships: Array<{
      organization: {
        id: string
        name: string
        slug: string
        public_metadata: ClerkOrganizationMetadata
      }
      role: string
      public_metadata: ClerkUserMetadata
    }>
  }
  type: 'user.created' | 'user.updated' | 'user.deleted'
}

export interface OrganizationWebhookPayload {
  data: {
    id: string
    name: string
    slug: string
    public_metadata: ClerkOrganizationMetadata
    members_count: number
  }
  type: 'organization.created' | 'organization.updated' | 'organization.deleted'
}

// Database sync types
export interface DatabaseUser {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  profileImage?: string
  organizationId: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseOrganization {
  id: string
  clerkId: string
  name: string
  slug: string
  subscriptionTier: string
  subscriptionStatus: string
  maxUsers: number
  billingEmail: string
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
