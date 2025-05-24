/**
 * Organizations API Route
 * 
 * Handles organization creation via Clerk API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, slug, createdBy, publicMetadata } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Create organization using Clerk API
    const organization = await (await clerkClient()).organizations.createOrganization({
      name,
      slug,
      createdBy: createdBy || userId,
      publicMetadata: {
        industryType: 'logistics',
        setupComplete: false,
        ...publicMetadata
      }
    })

    // The webhook will automatically handle database sync
    return NextResponse.json({ organization })

  } catch (error) {
    console.error('Error creating organization:', error)
    
    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes('slug')) {
        return NextResponse.json(
          { error: 'Organization slug already exists. Please choose a different name.' },
          { status: 400 }
        )
      }
      if (error.message.includes('name')) {
        return NextResponse.json(
          { error: 'Organization name already exists. Please choose a different name.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
