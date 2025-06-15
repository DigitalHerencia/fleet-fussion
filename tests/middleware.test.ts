import { describe, it, expect } from 'vitest';
import { RouteProtection } from '../lib/auth/permissions';
import { SystemRoles } from '../types/abac';
import type { UserContext } from '../types/auth';

const baseUser: UserContext = {
  name: 'Admin',
  userId: '1',
  organizationId: 'org1',
  role: SystemRoles.ADMIN,
  permissions: [],
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  profileImage: '',
  isActive: true,
  onboardingComplete: true,
  organizationMetadata: {} as any,
};

describe('RouteProtection admin routes', () => {
  it('allows admin user', () => {
    expect(RouteProtection.canAccessRoute(baseUser, '/org1/admin')).toBe(true);
    expect(RouteProtection.canAccessRoute(baseUser, '/org1/admin/123')).toBe(true);
  });

  it('denies non-admin user', () => {
    const member = { ...baseUser, role: SystemRoles.MEMBER } as UserContext;
    expect(RouteProtection.canAccessRoute(member, '/org1/admin')).toBe(false);
  });
});
