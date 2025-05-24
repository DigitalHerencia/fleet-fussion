/**
 * Clerk Webhook API Route
 * 
 * Handles Clerk authentication events and synchronizes them with our Neon PostgreSQL database
 * for multi-tenant ABAC system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook, UserWebhookHandler, OrganizationWebhookHandler } from '@/lib/clerk'
import { 
  UserWebhookPayload, 
  OrganizationWebhookPayload
} from '@/types/auth'

/**
 * Handle POST requests from Clerk webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature and get payload
    const { eventType, payload } = await verifyWebhook(request) as { eventType: string, payload: any }
    
    console.log(`Processing webhook event: ${eventType}`)
    
    // Route to appropriate handler based on event type
    switch (eventType) {
      // User events
      case 'user.created':
        await UserWebhookHandler.handleUserCreated(payload as UserWebhookPayload)
        break
        
      case 'user.updated':
        await UserWebhookHandler.handleUserUpdated(payload as UserWebhookPayload)
        break
        
      case 'user.deleted':
        await UserWebhookHandler.handleUserDeleted(payload as UserWebhookPayload)
        break
        
      // Organization events
      case 'organization.created':
        await OrganizationWebhookHandler.handleOrganizationCreated(payload as OrganizationWebhookPayload)
        break
        
      case 'organization.updated':
        await OrganizationWebhookHandler.handleOrganizationUpdated(payload as OrganizationWebhookPayload)
        break
        
      case 'organization.deleted':
        await OrganizationWebhookHandler.handleOrganizationDeleted(payload as OrganizationWebhookPayload)
        break          // Organization membership events
      case 'organizationMembership.created':
        await OrganizationWebhookHandler.handleOrganizationMembershipCreated(payload as any)
        break
        
      case 'organizationMembership.updated':
        await OrganizationWebhookHandler.handleOrganizationMembershipUpdated(payload as any)
        break
        
      case 'organizationMembership.deleted':
        await OrganizationWebhookHandler.handleOrganizationMembershipDeleted(payload as any)
        break
        
      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }
    
    return NextResponse.json({ success: true }, { status: 200 })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Invalid signature')) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' }, 
          { status: 401 }
        )
      }
      
      if (error.message.includes('Invalid payload')) {
        return NextResponse.json(
          { error: 'Invalid webhook payload' }, 
          { status: 400 }
        )
      }
    }
    
    // Internal server error for unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * Handle GET requests (for webhook endpoint verification)
 */
export async function GET() {
  return NextResponse.json(
    { message: 'Clerk webhook endpoint is active' }, 
    { status: 200 }
  )
}
