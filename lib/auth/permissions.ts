/**
 * ABAC (Attribute-Based Access Control) Utilities
 * 
 * Provides permission checking and role management utilities
 * for the FleetFusion multi-tenant system with aligned type structure
 */

// NOTE: All ABAC/auth types (UserRole, Permission, ResourceType, etc.)
// are now defined in types/auth.ts or types/abac.ts. Do not define or export them here.
//
// IMPORTANT: If you need UserRole, Permission, ResourceType, etc., import them from '@/types/auth' or '@/types/abac'.

import { 
  SystemRole, 
  SystemRoles, 
  Permission, 
  PermissionAction, 
  ResourceType,
  hasPermission as abacHasPermission,
  getPermissionsForRole as abacGetPermissionsForRole
} from '@/types/abac';
import type { UserContext } from '@/types/auth';
import React from 'react';




/**
 * Create a permission string from action and resource
 */
export function createPermission(action: PermissionAction, resource: ResourceType): string {
  return `${action}:${resource}`;
}

/**
 * Parse a permission string into action and resource
 */
export function parsePermission(permission: string): { action: PermissionAction; resource: ResourceType } | null {
  const parts = permission.split(':');
  if (parts.length !== 2) return null;
  return { action: parts[0] as PermissionAction, resource: parts[1] as ResourceType };
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserContext | null, action: PermissionAction, resource: ResourceType): boolean {
  if (!user || user.isActive === false) return false;
  return abacHasPermission(user.permissions, action, resource);
}

/**
 * Check if a user has a specific action on a resource
 */
export function hasResourcePermission(
  user: UserContext | null, 
  action: PermissionAction, 
  resource: ResourceType
): boolean {
  return hasPermission(user, action, resource);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: UserContext | null, permissions: Array<{action: PermissionAction, resource: ResourceType}>): boolean {
  if (!user || user.isActive === false || !user.permissions) return false;
  return permissions.some(perm => abacHasPermission(user.permissions, perm.action, perm.resource));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: UserContext | null, permissions: Array<{action: PermissionAction, resource: ResourceType}>): boolean {
  if (!user || user.isActive === false || !user.permissions) return false;
  return permissions.every(perm => abacHasPermission(user.permissions, perm.action, perm.resource));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserContext | null, role: SystemRole): boolean {
  if (!user || user.isActive === false || !user.role) return false;
  return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: UserContext | null, roles: SystemRole[]): boolean {
  if (!user || user.isActive === false) return false;
  return roles.includes(user.role as SystemRole);
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: UserContext | null): boolean {
  return hasRole(user, SystemRoles.ADMIN);
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(user: UserContext | null): boolean {
  return hasResourcePermission(user, 'manage', 'user')
}

/**
 * Check if a user can view billing information
 */
export function canViewBilling(user: UserContext | null): boolean {
  return hasResourcePermission(user, 'read', 'billing')
}

/**
 * Check if a user can manage organization settings
 */
export function canManageSettings(user: UserContext | null): boolean {
  return hasResourcePermission(user, 'update', 'organization')
}

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: SystemRole): Permission[] {
  return abacGetPermissionsForRole(role);
}

/**
 * Check if a user belongs to a specific organization
 */
export function belongsToOrganization(user: UserContext | null, organizationId: string): boolean {
  if (!user) return false;
  return user.organizationId === organizationId; // Corrected: Use organizationId from UserContext
}

/**
 * Resource-specific permission checks - Updated for new permission structure
 */
export const PermissionChecks = {
  // Vehicle Management
  canViewVehicles: (user: UserContext | null) => hasResourcePermission(user, 'read', 'vehicle'),
  canCreateVehicles: (user: UserContext | null) => hasResourcePermission(user, 'create', 'vehicle'),
  canUpdateVehicles: (user: UserContext | null) => hasResourcePermission(user, 'update', 'vehicle'),
  canDeleteVehicles: (user: UserContext | null) => hasResourcePermission(user, 'delete', 'vehicle'),
  
  // Driver Management
  canViewDrivers: (user: UserContext | null) => hasResourcePermission(user, 'read', 'driver'),
  canCreateDrivers: (user: UserContext | null) => hasResourcePermission(user, 'create', 'driver'),
  canUpdateDrivers: (user: UserContext | null) => hasResourcePermission(user, 'update', 'driver'),
  canDeleteDrivers: (user: UserContext | null) => hasResourcePermission(user, 'delete', 'driver'),
  
  // Load Management
  canViewLoads: (user: UserContext | null) => hasResourcePermission(user, 'read', 'load'),
  canCreateLoads: (user: UserContext | null) => hasResourcePermission(user, 'create', 'load'),
  canUpdateLoads: (user: UserContext | null) => hasResourcePermission(user, 'update', 'load'),
  canDeleteLoads: (user: UserContext | null) => hasResourcePermission(user, 'delete', 'load'),
  canAssignLoads: (user: UserContext | null) => hasResourcePermission(user, 'assign', 'load'),
  
  // Document Management
  canViewDocuments: (user: UserContext | null) => hasResourcePermission(user, 'read', 'document'),
  canCreateDocuments: (user: UserContext | null) => hasResourcePermission(user, 'create', 'document'),
  canUpdateDocuments: (user: UserContext | null) => hasResourcePermission(user, 'update', 'document'),
  canDeleteDocuments: (user: UserContext | null) => hasResourcePermission(user, 'delete', 'document'),
  canApproveDocuments: (user: UserContext | null) => hasResourcePermission(user, 'approve', 'document'),
  
  // IFTA Management
  canViewIFTA: (user: UserContext | null) => hasResourcePermission(user, 'read', 'ifta_report'),
  canCreateIFTA: (user: UserContext | null) => hasResourcePermission(user, 'create', 'ifta_report'),
  canUpdateIFTA: (user: UserContext | null) => hasResourcePermission(user, 'update', 'ifta_report'),
  canReportIFTA: (user: UserContext | null) => hasResourcePermission(user, 'report', 'ifta_report'),
  
  // Organization & Administration
  canViewOrganization: (user: UserContext | null) => hasResourcePermission(user, 'read', 'organization'),
  canUpdateOrganization: (user: UserContext | null) => hasResourcePermission(user, 'update', 'organization'),
  canViewBilling: (user: UserContext | null) => hasResourcePermission(user, 'read', 'billing'),
  canManageBilling: (user: UserContext | null) => hasResourcePermission(user, 'manage', 'billing'),
  
  // User Management
  canViewUsers: (user: UserContext | null) => hasResourcePermission(user, 'read', 'user'),
  canCreateUsers: (user: UserContext | null) => hasResourcePermission(user, 'create', 'user'),
  canUpdateUsers: (user: UserContext | null) => hasResourcePermission(user, 'update', 'user'),
  canDeleteUsers: (user: UserContext | null) => hasResourcePermission(user, 'delete', 'user'),
  canManageUsers: (user: UserContext | null) => hasResourcePermission(user, 'manage', 'user'),
} as const

/**
 * Context-aware permission checks for specific resources
 */
export class ResourcePermissions {
  /**
   * Check if user can access a specific driver's data
   * Drivers can only access their own data unless they have broader permissions
   */
  static canAccessDriver(user: UserContext | null, driverId: string): boolean {
    if (!user) return false
    
    // If user has general driver permissions, allow access
    if (hasPermission(user, 'read', 'driver')) return true
    
    // If user is the driver themselves, allow access to own data
    if (user.role === 'driver' && user.userId === driverId) return true
    
    return false
  }
  
  /**
   * Check if user can access a specific load/dispatch
   * Drivers can only see their assigned loads
   */
  static canAccessLoad(user: UserContext | null, loadDriverId?: string): boolean {
    if (!user) return false
    
    // If user has general dispatch permissions, allow access
    if (hasPermission(user, 'read', 'load')) return true
    
    // If user is a driver and the load is assigned to them, allow access
    if (user.role === 'driver' && loadDriverId === user.userId) return true
    
    return false
  }
  
  /**
   * Check if user can access compliance documents
   * Drivers can only see their own compliance documents
   */
  static canAccessComplianceDocument(user: UserContext | null, documentDriverId?: string): boolean {
    if (!user) return false
    
    // If user has general compliance permissions, allow access
    if (hasPermission(user, 'read', 'document')) return true
    
    // If user is a driver and the document belongs to them, allow access
    if (user.role === 'driver' && documentDriverId === user.userId) return true
    
    return false
  }
}

/**
 * Higher-order component utilities for permission-based rendering
 */
export function requirePermission(permission: Permission) {
  return function<T extends object>(Component: React.ComponentType<T>) {
    return function PermissionWrapper(props: T) {
      // Implementation would check permissions and render component or fallback
      return <Component {...props} />
    }
  }
}

/**
 * Route protection utilities
 */
export class RouteProtection {  // Define PROTECTED_ROUTES using SystemRole and real route patterns
  static PROTECTED_ROUTES: Record<string, SystemRole[]> = {
    // Dashboard: All authenticated users should access their dashboard
    '/:orgId/dashboard/:userId': [
      SystemRoles.ADMIN,
      SystemRoles.DISPATCHER,
      SystemRoles.DRIVER,
      SystemRoles.COMPLIANCE_OFFICER,
      SystemRoles.ACCOUNTANT,
      SystemRoles.VIEWER
    ],
    // Compliance dashboard: Compliance Officer, Admin
    '/:orgId/compliance/:userId': [
      SystemRoles.COMPLIANCE_OFFICER,
      SystemRoles.ADMIN
    ],    // Drivers list: Admin, Dispatcher, Compliance (need to see drivers for compliance), Viewer, Accountant (for payroll/financial reporting)
    '/:orgId/drivers': [
      SystemRoles.ADMIN,
      SystemRoles.DISPATCHER,
      SystemRoles.COMPLIANCE_OFFICER,
      SystemRoles.VIEWER,
      SystemRoles.ACCOUNTANT
    ],
    // Drivers dashboard: Driver (own profile), Admin, Dispatcher, Compliance
    '/:orgId/drivers/:userId': [
      SystemRoles.DRIVER,
      SystemRoles.ADMIN,
      SystemRoles.DISPATCHER,
      SystemRoles.COMPLIANCE_OFFICER
    ],
    // Dispatch dashboard: Dispatcher, Admin
    '/:orgId/dispatch/:userId': [
      SystemRoles.DISPATCHER,
      SystemRoles.ADMIN
    ],    // Analytics: Admin, Dispatcher, Compliance Officer, Viewer (read-only), Accountant (for financial analytics)
    '/:orgId/analytics': [
      SystemRoles.ADMIN,
      SystemRoles.DISPATCHER,
      SystemRoles.COMPLIANCE_OFFICER,
      SystemRoles.VIEWER,
      SystemRoles.ACCOUNTANT
    ],
    // Vehicles list: Admin, Dispatcher, Compliance (for inspections), Viewer, Accountant (for asset tracking/financial reporting)
    '/:orgId/vehicles': [
      SystemRoles.ADMIN,
      SystemRoles.DISPATCHER,
      SystemRoles.COMPLIANCE_OFFICER,
      SystemRoles.VIEWER,
      SystemRoles.ACCOUNTANT
    ],
    // IFTA: Admin, Accountant
    '/:orgId/ifta': [
      SystemRoles.ADMIN,
      SystemRoles.ACCOUNTANT
    ],
    // Settings: Admin only
    '/:orgId/settings': [
      SystemRoles.ADMIN
    ],
    // Add more as needed for other tenant routes
  };
    /**
   * Check if user can access a specific route
   */
  static canAccessRoute(user: UserContext | null, path: string): boolean {
    if (!user || user.isActive === false) {
      return false; // Deny access if user is null or not active
    }

    // Helper function to match dynamic routes
    const matchesRoute = (pattern: string, actualPath: string): boolean => {
      // Convert pattern like "/:orgId/drivers/:userId" to regex
      const regexPattern = pattern
        .replace(/:[^\/]+/g, '[^/]+') // Replace :param with [^/]+ (non-slash characters)
        .replace(/\//g, '\\/'); // Escape forward slashes
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(actualPath);
    };

    const matchedRoute = Object.keys(RouteProtection.PROTECTED_ROUTES).find(routePattern => {
      return matchesRoute(routePattern, path);
    });

    if (matchedRoute) {
      const requiredRoles = RouteProtection.PROTECTED_ROUTES[matchedRoute];
      return hasAnyRole(user, requiredRoles);
    }
    
    // Default to true if not in protected routes (meaning it's accessible to any authenticated, active user)
    return true; 
  }
}