/**
 * Onboarding Welcome Page
 * 
 * Initial onboarding step - user profile setup
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Truck, Users, Building } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')  
  const [formData, setFormData] = useState({
    // Basic profile information
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: '',
    
    // Organization information
    orgName: '',
    orgSlug: '',
    
    // DOT compliance and TMS information
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dotNumber: '', // Department of Transportation Number
    mcNumber: '', // Motor Carrier Number
  })

  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full access to all features', icon: Building },
    { id: 'dispatcher', name: 'Dispatcher', description: 'Manage loads and dispatch', icon: Users },
    { id: 'driver', name: 'Driver', description: 'View assignments and logs', icon: Truck },
  ]
  // Generate slug from organization name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      orgName: name,
      orgSlug: generateSlug(name)
    }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.role) {
      toast({
        title: "Error",
        description: "Please select your role",
        variant: "destructive"
      })
      return
    }

    if (!formData.orgName.trim()) {
      toast({
        title: "Error", 
        description: "Please enter your organization name",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {      // Update user profile first
      if (user) {
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
          unsafeMetadata: {
            // Personal and company info needed for DOT compliance and TMS
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            dotNumber: formData.dotNumber,
            mcNumber: formData.mcNumber,
            // Moved from publicMetadata
            onboardingComplete: false, // Will be set to true after org creation
            role: formData.role
          }
        })
      }

      // Create organization using Clerk's API
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.orgName,
          slug: formData.orgSlug,
          createdBy: user?.id,
          publicMetadata: {
            industryType: 'logistics',
            setupComplete: false
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create organization')
      }

      const { organization } = await response.json()      // Update user to mark onboarding as complete
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
          organizationId: organization.id
        }
      })

      toast({
        title: "Success!",
        description: "Welcome to FleetFusion! Your organization has been created.",
      })

      // Redirect to dashboard - middleware will handle routing based on org membership
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Onboarding error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center space-x-2 mb-2">
            <Image
              src="/white_logo.png"
              alt="FleetFusion Logo"
              width={220}
              height={60}
              priority
            />
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold text-white">
            Welcome to FleetFusion
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Complete your profile and organization setup to get started.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-neutral-900 p-8 shadow-lg rounded-lg border border-neutral-800 space-y-6"
        >
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-200 text-sm font-medium">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
                className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-200 text-sm font-medium">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
                className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-gray-200 text-sm font-medium">What&apos;s your role?</Label>
            <div className="grid gap-3">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-neutral-800 transition-colors ${
                    formData.role === role.id ? 'border-blue-500 bg-neutral-800' : 'border-neutral-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    className="sr-only"
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  />
                  <div className="flex items-start gap-3">
                    <role.icon className="mt-1 h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{role.name}</span>
                        {role.id === 'admin' && (
                          <Badge variant="secondary" className="text-xs bg-blue-600 text-white">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Organization Setup */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-gray-200 text-sm font-medium">Organization Name</Label>
              <Input
                id="orgName"
                value={formData.orgName}
                onChange={handleOrgNameChange}
                required
                className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug" className="text-gray-200 text-sm font-medium">Organization Slug (auto-generated)</Label>
              <Input
                id="orgSlug"
                value={formData.orgSlug}
                onChange={(e) => setFormData(prev => ({ ...prev, orgSlug: e.target.value }))}
                placeholder="e.g. fleetfusion-inc"
                className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finish Onboarding
          </Button>
        </form>
      </div>
    </div>
  )
}
