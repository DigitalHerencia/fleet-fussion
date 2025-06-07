
'use server';

import { clerkClient } from "@clerk/nextjs/server";
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface InvitationData {
  emailAddress: string;
  role: string;
  redirectUrl?: string;
}

export async function createOrganizationInvitation(data: InvitationData) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return { success: false, error: 'Unauthorized' };
    }

    await clerkClient.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress: data.emailAddress,
      role: data.role,
      redirectUrl: data.redirectUrl,
    });

    revalidatePath('/[orgId]/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error creating organization invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invitation'
    };
  }
}

export async function getOrganizationInvitations(organizationId?: string) {
  try {
    const { userId, orgId } = await auth();
    const targetOrgId = organizationId || orgId;

    if (!userId || !targetOrgId) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await clerkClient.organizations.getOrganizationInvitationList({
      organizationId: targetOrgId,
    });

    return { success: true, invitations: result.data };
  } catch (error) {
    console.error('Error getting organization invitations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invitations'
    };
  }
}
export async function revokeOrganizationInvitation(
  invitationId: string,
  organizationId?: string
) {
  try {
    const { userId, orgId } = await auth();
    const targetOrgId = organizationId || orgId;

    if (!userId || !targetOrgId) {
      return { success: false, error: 'Unauthorized' };
    }

    await clerkClient.organizations.revokeOrganizationInvitation({
      organizationId: targetOrgId,
      invitationId,
      requestingUserId: userId,
    });

    revalidatePath('/[orgId]/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error revoking organization invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke invitation'
    };
  }
}
