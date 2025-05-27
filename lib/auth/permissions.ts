/**
 * ABAC (Attribute-Based Access Control) Utilities
 * 
 * Provides permission checking and role management utilities
 * for the FleetFusion multi-tenant system with aligned type structure
 */

import { UserRole, Permission, ROLE_PERMISSIONS, PermissionAction, ResourceType, UserContext } from '@/types/auth';

/**
 * Create a permission string from action and resource
 */
export function createPermission(action: PermissionAction, resource: ResourceType): Permission {
  return `${action}:${resource}`
}

/**
 * Parse a permission string into action and resource
 */
export function parsePermission(permission: Permission): { action: PermissionAction; resource: ResourceType } | null {
  const parts = permission.split(':')
  if (parts.length !== 2) return null
  return { action: parts[0] as PermissionAction, resource: parts[1] as ResourceType }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserContext | null, permission: Permission): boolean {
  if (!user || user.isActive === false) return false
  return user.permissions?.includes(permission) || false
}

/**
 * Check if a user has a specific action on a resource
 */
export function hasResourcePermission(
  user: UserContext | null, 
  action: PermissionAction, 
  resource: ResourceType
): boolean {
  const permission = createPermission(action, resource)
  return hasPermission(user, permission) || hasPermission(user, createPermission('manage', resource))
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: UserContext | null, permissions: Permission[]): boolean {
  if (!user || user.isActive === false || !user.permissions) return false
  return permissions.some(permission => user.permissions!.includes(permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: UserContext | null, permissions: Permission[]): boolean {
  if (!user || user.isActive === false || !user.permissions) return false
  return permissions.every(permission => user.permissions!.includes(permission))
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserContext | null, role: UserRole): boolean {
  if (!user || user.isActive === false || !user.role) return false
  return user.role === role
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: UserContext | null, roles: UserRole[]): boolean {
  if (!user || user.isActive === false) return false
  return roles.includes(user.role as UserRole)
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: UserContext | null): boolean {
  return hasRole(user, 'admin')
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
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
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
    if (hasPermission(user, 'drivers:view')) return true
    
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
    if (hasPermission(user, 'dispatch:view')) return true
    
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
    if (hasPermission(user, 'compliance:view')) return true
    
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
      // This would be used with the auth context
      // Implementation would check permissions and render component or fallback
      return Component as any // Placeholder for type checking
    }
  }
}

/**
 * Route protection utilities
 */
export class RouteProtection {  // Define PROTECTED_ROUTES using the imported UserRole
  static PROTECTED_ROUTES: Record<string, UserRole[]> = {
    '/dashboard': [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER, UserRole.DRIVER, UserRole.ACCOUNTANT, UserRole.COMPLIANCE, UserRole.DISPATCHER],
    '/admin': [UserRole.ADMIN],
    '/tenant': [UserRole.ADMIN, UserRole.MANAGER],
    '/settings': [UserRole.ADMIN, UserRole.MANAGER],
    '/users': [UserRole.ADMIN, UserRole.MANAGER],
    '/analytics': [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.COMPLIANCE],
    '/dispatch': [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER],
    '/drivers': [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.DRIVER],
    '/vehicles': [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER],
    '/compliance': [UserRole.ADMIN, UserRole.MANAGER, UserRole.COMPLIANCE],
    '/ifta': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
    '/billing': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
    // Add other routes and their required roles
  };
  
  /**
   * Check if user can access a specific route
   */
  static canAccessRoute(user: UserContext | null, path: string): boolean {
    if (!user || user.isActive === false) {
      return false; // Deny access if user is null or not active
    }

    const matchedRoute = Object.keys(RouteProtection.PROTECTED_ROUTES).find(routePattern => {
      if (path === routePattern) return true;
      // Basic prefix matching for routes like /tenant/*
      if (routePattern.endsWith('/') && path.startsWith(routePattern)) return true;
      // More specific prefix matching for /tenant, ensuring it doesn't incorrectly match /tenant-something
      if (!routePattern.endsWith('/') && path.startsWith(routePattern + '/')) return true; 
      return false;
    });

    if (matchedRoute) {
      const requiredRoles = RouteProtection.PROTECTED_ROUTES[matchedRoute];
      return hasAnyRole(user, requiredRoles);
    }
    
    // Default to true if not in protected routes (meaning it's accessible to any authenticated, active user)
    return true; 
  }
}
