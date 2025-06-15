"use client"

import type React from 'react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TopNavBar } from '@/components/shared/TopNavBar';
import { MainNav } from '@/components/shared/MainNav';
import { MobileNav } from '@/components/shared/MobileNav';
import { useUserContext } from '@/components/auth/context';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: { orgId: string };
}
/**
 * Client Component for Tenant Layout
 * Receives orgId from server component and uses auth context for userId
 */
export function TenantLayout({ children, params }: TenantLayoutProps) {
  const { orgId } = params;
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userContext = useUserContext();
  const userId = userContext?.userId || '';

  // Prepare user and org data for TopNavBar
  const user = userContext ? {
    name: userContext.name || 'Guest', // Ensure string fallback
    email: userContext.email,
    profileImage: userContext.profileImage || '',
  } : null;

  const organization = userContext?.organizationMetadata ? {
    name: userContext.organizationMetadata.name || 'Organization',
  } : null;


  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="fixed top-0 left-0 z-50 w-full border-b border-gray-700 bg-gray-800 shadow-lg">
          <TopNavBar
            user={user || { name: 'Guest', email: 'guest@example.com', profileImage: '' }}
            organization={organization || { name: 'Guest Organization' }}
          />
        </header>
        <div className="pt-[64px]">
          <MobileNav />
          <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 80 : 256;
  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="fixed top-0 left-0 z-50 w-full">
        <TopNavBar
          user={user || { name: 'Guest', email: 'guest@example.com', profileImage: '' }}
          organization={organization || { name: 'Guest Organization' }}
        />
      </header>
      <MainNav
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        orgId={orgId} // Uses orgId from URL params
        userId={userId} // Uses userId from auth context
      />
      <div
        className="flex min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <main className="flex-1 pt-16">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
