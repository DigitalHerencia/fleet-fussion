import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RouteProtection } from "@/lib/auth/permissions";
import type { UserContext, ClerkOrganizationMetadata } from "@/types/auth";
import { SystemRoles, getPermissionsForRole, type SystemRole } from "@/types/abac";

// 1. Define public routes (no auth/RBAC required)
const publicRoutePatterns = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/api/clerk/webhook-handler',
  '/about',
  '/contact',
  '/pricing',
  '/features',
  '/services',
  '/privacy',
  '/terms',
  '/refund',
];
const isPublicRoute = createRouteMatcher(publicRoutePatterns);

// 2. RBAC session cache (optional, for performance)
const sessionCache = new Map<string, { userContext: UserContext; timestamp: number; ttl: number }>();
const SESSION_CACHE_TTL = 30 * 1000; // 30 seconds

function getCachedUserContext(sessionId: string): UserContext | null {
  const cached = sessionCache.get(sessionId);
  if (cached && Date.now() - cached.timestamp < cached.ttl) return cached.userContext;
  if (cached) sessionCache.delete(sessionId);
  return null;
}
function setCachedUserContext(sessionId: string, userContext: UserContext): void {
  sessionCache.set(sessionId, { userContext, timestamp: Date.now(), ttl: SESSION_CACHE_TTL });
}

// 3. Utility: Build user context from session claims
function buildUserContext(userId: string, sessionClaims: any, orgId: string | null): UserContext {
  // Extract role and permissions from session claims
  const userRole = sessionClaims?.abac?.role ||
    sessionClaims?.publicMetadata?.role ||
    sessionClaims?.metadata?.role ||
    SystemRoles.VIEWER;
  const userPermissions = sessionClaims?.abac?.permissions ||
    getPermissionsForRole(userRole as SystemRole);
  const organizationId = sessionClaims?.abac?.organizationId ||
    orgId ||
    sessionClaims?.publicMetadata?.organizationId ||
    sessionClaims?.metadata?.organizationId ||
    '';
  const onboardingComplete = sessionClaims?.publicMetadata?.onboardingComplete ||
    sessionClaims?.metadata?.onboardingComplete ||
    false;
  const isActive = sessionClaims?.metadata?.isActive !== false;
  const orgMetadata = sessionClaims?.org_public_metadata as ClerkOrganizationMetadata | undefined;

  return {
    userId,
    organizationId,
    role: userRole as SystemRole,
    permissions: userPermissions,
    isActive,
    name: sessionClaims?.firstName || sessionClaims?.fullName?.split(' ')[0] || '',
    email: sessionClaims?.primaryEmail || '',
    firstName: sessionClaims?.firstName || '',
    lastName: sessionClaims?.lastName || '',
    onboardingComplete,
    organizationMetadata: orgMetadata || {
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
      maxUsers: 5,
      features: [],
      billingEmail: '',
      createdAt: new Date().toISOString(),
      settings: {
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        distanceUnit: 'miles',
        fuelUnit: 'gallons',
      },
    },
  };
}

// 4. Utility: Get dashboard path by role (used for redirects)
function getDashboardPath(userContext: UserContext): string {
  const orgId = userContext.organizationId;
  const userId = userContext.userId;
  switch (userContext.role) {
    case 'admin':
    case 'accountant':
    case 'viewer':
      return `/${orgId}/dashboard/${userId}`;
    case 'dispatcher':
      return `/${orgId}/dispatch/${userId}`;
    case 'compliance_officer':
      return `/${orgId}/compliance/${userId}`;
    case 'driver':
      return `/${orgId}/drivers/${userId}`;
    default:
      return '/';
  }
}

// 5. Utility: Create response with user/org headers
function createResponseWithHeaders(userContext: UserContext, orgId: string | null): NextResponse {
  const response = NextResponse.next();
  response.headers.set('x-user-role', userContext.role);
  if (userContext.permissions.length > 0) {
    response.headers.set('x-user-permissions', JSON.stringify(userContext.permissions));
  }
  if (orgId) {
    response.headers.set('x-organization-id', orgId);
  }
  return response;
}

// 6. Utility: Forbidden or redirect
function forbiddenOrRedirect(req: NextRequest, redirectUrl?: string) {
  const isApi = req.nextUrl.pathname.startsWith('/api/') || req.headers.get('accept')?.includes('application/json');
  if (isApi) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
  }
  if (redirectUrl) {
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  return NextResponse.redirect(new URL('/sign-in', req.url));
}

// 7. Main middleware logic
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // [A] Intercept every request before route handlers/pages

  // [B] Check if route is public (no auth/RBAC required)
  if (isPublicRoute(req)) {
    // Allow public routes through
    return NextResponse.next();
  }

  // [C] Extract authentication credentials (session/cookies)
  const { userId, sessionClaims, orgId } = await auth();

  // [D] Validate credentials (is user authenticated?)
  if (!userId) {
    // Not authenticated: redirect to sign-in
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // [E] Build user context (roles, permissions, org, etc.)
  const sessionId = `${userId}-${orgId || 'no-org'}`;
  let userContext = getCachedUserContext(sessionId);
  if (!userContext) {
    userContext = buildUserContext(userId, sessionClaims, orgId || null);
    setCachedUserContext(sessionId, userContext);
  }

  // [F] Determine requested route/resource (pathname)
  const pathname = req.nextUrl.pathname;
  // [G] Check org context in route vs. user context (if applicable)
  // Example: /[orgId]/...
  const orgPathMatch = pathname.match(/^\/([^\/]+)\/(?:dashboard|drivers|dispatch|compliance|vehicles|analytics|ifta|settings)/);
  if (orgPathMatch && orgPathMatch[1]) {
    const requestedOrgId = orgPathMatch[1];
    if (userContext.organizationId && userContext.organizationId !== requestedOrgId) {
      // User's org does not match route org: redirect to correct dashboard
      return NextResponse.redirect(new URL(getDashboardPath(userContext), req.url));
    }
  }

  // [H] Check RBAC policy for this route/resource
  if (!RouteProtection.canAccessRoute(userContext, pathname)) {
    // User does not have permission for this route
    return forbiddenOrRedirect(req, '/sign-in');
  }

  // [I] Allow request to proceed, attach user/org info as headers
  return createResponseWithHeaders(userContext, orgId || null);
});

// 8. Next.js matcher config (which routes this middleware applies to)
export const config = {
  matcher: [
    // Exclude Next.js internals and static files from middleware
    "/((?!_next|_static|_vercel|favicon.ico|robots.txt|sitemap.xml|manifest.json|public|api\/clerk\/webhook-handler).*)",
  ],
};
