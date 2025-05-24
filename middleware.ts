import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about',
  '/contact',
  '/pricing',
  '/features',
  '/services',
  '/privacy',
  '/terms',
  '/refund',
  '/api/webhooks/clerk', // Allow webhook endpoint
]);

// Define onboarding routes
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/settings/billing',
  '/settings/organization',
  '/settings/users',
]);

// Define dispatcher routes
const isDispatcherRoute = createRouteMatcher([
  '/dispatch(.*)',
  '/analytics(.*)',
]);

// Define driver routes (restricted to driver-specific data)
const isDriverRoute = createRouteMatcher([
  '/driver(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check if user is authenticated for public routes
  const authResult = await auth();
  
  // Redirect authenticated users away from auth pages
  if (authResult.userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all other routes - this will redirect to sign-in if not authenticated
  const { userId, orgId, sessionClaims } = await auth.protect();

  // Get user metadata from session claims
  const userMetadata = sessionClaims?.metadata as any;
  const userRole = userMetadata?.role || 'viewer';
  const isActive = userMetadata?.isActive !== false;
  const onboardingCompleted = userMetadata?.onboardingCompleted === true;
  const userPermissions: string[] = userMetadata?.permissions || [];

  // Check if user is active
  if (!isActive) {
    return forbiddenOrRedirect(req, '/sign-in?error=account_disabled');
  }

  // Handle onboarding flow
  if (!onboardingCompleted && !isOnboardingRoute(req)) {
    return forbiddenOrRedirect(req, '/onboarding');
  }

  // Prevent access to onboarding if already completed
  if (onboardingCompleted && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Check organization membership for tenant routes
  if (!isPublicRoute(req) && !isOnboardingRoute(req)) {
    if (!orgId) {
      return forbiddenOrRedirect(req, '/onboarding/organization');
    }
  }

  // Role-based route protection
  if (isAdminRoute(req) && userRole !== 'admin') {
    return forbiddenOrRedirect(req, '/dashboard?error=insufficient_permissions');
  }

  if (isDispatcherRoute(req) && !['admin', 'dispatcher'].includes(userRole)) {
    return forbiddenOrRedirect(req, '/dashboard?error=insufficient_permissions');
  }

  if (isDriverRoute(req) && !['admin', 'dispatcher', 'driver'].includes(userRole)) {
    return forbiddenOrRedirect(req, '/dashboard?error=insufficient_permissions');
  }

  // Example: ABAC permission enforcement for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Example: require 'fleet:view' permission for /api/vehicles
    if (req.nextUrl.pathname.startsWith('/api/vehicles') && !userPermissions.includes('fleet:view')) {
      return forbiddenOrRedirect(req);
    }
    // Add more API route/permission checks as needed
  }

  // Add custom headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-role', userRole);
  response.headers.set('x-user-id', userId);
  if (orgId) {
    response.headers.set('x-org-id', orgId);
  }
  if (userPermissions.length > 0) {
    response.headers.set('x-user-permissions', userPermissions.join(','));
  }
  return response;
});

// Helper: Return 403 for API/non-browser, redirect for browser
function forbiddenOrRedirect(req: NextRequest, redirectUrl?: string) {
  const isApi = req.nextUrl.pathname.startsWith('/api/') || req.headers.get('accept')?.includes('application/json');
  if (isApi) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
  }
  if (redirectUrl) {
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  return NextResponse.redirect(new URL('/dashboard?error=forbidden', req.url));
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|static|favicon.ico|logo|icons|images).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};