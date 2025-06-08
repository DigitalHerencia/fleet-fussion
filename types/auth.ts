/**
 * Authentication and Authorization Types for FleetFusion
 * 
 * Defines comprehensive ABAC (Attribute-Based Access Control) types
 * for multi-tenant fleet management system
 * 
 * NOTE: This file aligns with the documented ABAC specifications from
 * types/abac.ts to ensure consistency across the codebase.
 */

// Import ABAC types as the source of truth
import { 
  SystemRole, 
  SystemRoles, 
  ResourceType, 
  ResourceTypes,
  PermissionAction, 
  PermissionActions,
  Permission,
  RolePermissions as ABACRolePermissions
} from './abac';

// Use ABAC system roles as the canonical role definition
export const UserRole = SystemRoles;
export type UserRole = SystemRole;

// Use ABAC permission structure as canonical
export type { Permission, ResourceType, PermissionAction };

// Re-export for backwards compatibility
export { ResourceTypes, PermissionActions };

// Use ABAC role permissions as the source of truth
export const ROLE_PERMISSIONS = ABACRolePermissions;

// Clerk user metadata structure (aligned with JWT claims)
export interface ClerkUserMetadata {
  organizationId: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
  lastLogin?: string
  onboardingComplete: boolean // Must match JWT/session claim
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
  // Business address fields
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
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
  onboardingComplete: boolean // Standardized to match Clerk and DB field names
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
  id: string; // Clerk User ID
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  // Fields from ClerkUserMetadata, synced via webhook
  organizationId: string | null;
  role: UserRole | null;
  isActive: boolean;
  lastLogin?: string | null;
  onboardingComplete: boolean // Standardized to match ClerkUserMetadata and database schema
  // Standard database timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseOrganization {
  id: string; // Clerk Organization ID
  name: string;
  slug: string;
  // Fields from ClerkOrganizationMetadata, synced via webhook
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  maxUsers: number;
  features: string[]; // Consider storing as JSON or in a related table
  billingEmail: string;
  clerkCreatedAt: string; // Timestamp from Clerk, renamed to avoid conflict
  dotNumber?: string | null;
  mcNumber?: string | null;
  // Settings from ClerkOrganizationMetadata (flattened or as JSON)
  settings_timezone: string;
  settings_dateFormat: string;
  settings_distanceUnit: 'miles' | 'kilometers';
  settings_fuelUnit: 'gallons' | 'liters';
  // membersCount from OrganizationWebhookPayload
  membersCount?: number;
  // Standard database timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Onboarding types
export interface OnboardingData {
  userId: string
  companyName: string
  orgName: string
  orgSlug: string
  dotNumber: string
  mcNumber: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  role: UserRole
  onboardingComplete: boolean
}

export interface SetClerkMetadataResult {
  success: boolean
  organizationId?: string
  userId?: string
  error?: string
}

// Organization invitation representation from Clerk
export interface OrganizationInvitation {
  id: string
  emailAddress: string
  role: UserRole
  status: 'pending' | 'accepted' | 'revoked'
  publicMetadata?: Record<string, any>
  createdAt: string
}

// Generic action result used by server actions
export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}
