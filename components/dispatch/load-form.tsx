"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { createLoad, updateLoad } from "@/lib/actions/loads"

interface Driver {
  id: string
  firstName: string
  lastName: string
}

interface Vehicle {
  id: string
  unitNumber: string
  type: string
}

interface LoadFormProps {
  drivers: Driver[]
  vehicles: Vehicle[]
  onClose?: () => void
  load?: {
    id: string
    referenceNumber: string
    status: string
    customerName: string
    customerContact: string
    customerPhone: string
    customerEmail: string
    originAddress: string
    originCity: string
    originState: string
    originZip: string
    destinationAddress: string
    destinationCity: string
    destinationState: string
    destinationZip: string
    pickupDate: string
    deliveryDate: string
    commodity: string
    weight: number
    rate: number
    miles: number
    notes: string
    driverId: string
    vehicleId: string
    trailerId: string
  }
}

export function LoadForm({ drivers, vehicles, load, onClose }: LoadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tractors = vehicles.filter((vehicle) => vehicle.type === "tractor")
  const trailers = vehicles.filter((vehicle) => vehicle.type === "trailer")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      if (load) {
        // Update existing load
        const result = await updateLoad(load.id, formData)
        if (result.success) {
          toast({
            title: "Load updated",
            description: "The load has been updated successfully.",
          })
          onClose?.()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to update load. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // Create new load
        const result = await createLoad(formData)
        if (result.success) {
          toast({
            title: "Load created",
            description: "The load has been created successfully.",
          })
          onClose?.()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to create load. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="details">Additional Details</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    name="referenceNumber"
                    defaultValue={load?.referenceNumber || ""}
                    placeholder="e.g., L-1001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={load?.status || "pending"}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  defaultValue={load?.customerName || ""}
                  placeholder="e.g., ABC Distributors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerContact">Contact Person</Label>
                  <Input
                    id="customerContact"
                    name="customerContact"
                    defaultValue={load?.customerContact || ""}
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    defaultValue={load?.customerPhone || ""}
                    placeholder="e.g., 555-123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    defaultValue={load?.customerEmail || ""}
                    placeholder="e.g., john@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Origin</CardTitle>
              <CardDescription>Enter the pickup location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originAddress">Address</Label>
                <Input
                  id="originAddress"
                  name="originAddress"
                  defaultValue={load?.originAddress || ""}
                  placeholder="e.g., 123 Shipping Lane"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originCity">City</Label>
                  <Input
                    id="originCity"
                    name="originCity"
                    defaultValue={load?.originCity || ""}
                    placeholder="e.g., El Paso"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originState">State</Label>
                  <Input
                    id="originState"
                    name="originState"
                    defaultValue={load?.originState || ""}
                    placeholder="e.g., TX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originZip">ZIP Code</Label>
                  <Input
                    id="originZip"
                    name="originZip"
                    defaultValue={load?.originZip || ""}
                    placeholder="e.g., 79901"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date & Time</Label>
                <Input id="pickupDate" name="pickupDate" type="datetime-local" defaultValue={load?.pickupDate || ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destination</CardTitle>
              <CardDescription>Enter the delivery location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destinationAddress">Address</Label>
                <Input
                  id="destinationAddress"
                  name="destinationAddress"
                  defaultValue={load?.destinationAddress || ""}
                  placeholder="e.g., 456 Receiving Blvd"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destinationCity">City</Label>
                  <Input
                    id="destinationCity"
                    name="destinationCity"
                    defaultValue={load?.destinationCity || ""}
                    placeholder="e.g., Albuquerque"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationState">State</Label>
                  <Input
                    id="destinationState"
                    name="destinationState"
                    defaultValue={load?.destinationState || ""}
                    placeholder="e.g., NM"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationZip">ZIP Code</Label>
                  <Input
                    id="destinationZip"
                    name="destinationZip"
                    defaultValue={load?.destinationZip || ""}
                    placeholder="e.g., 87102"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date & Time</Label>
                <Input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="datetime-local"
                  defaultValue={load?.deliveryDate || ""}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Assign driver and equipment to this load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driverId">Driver</Label>
                <Select name="driverId" defaultValue={load?.driverId || ""}>
                  <SelectTrigger id="driverId">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_assigned">Not Assigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleId">Tractor</Label>
                <Select name="vehicleId" defaultValue={load?.vehicleId || ""}>
                  <SelectTrigger id="vehicleId">
                    <SelectValue placeholder="Select a tractor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_assigned">Not Assigned</SelectItem>
                    {tractors.map((tractor) => (
                      <SelectItem key={tractor.id} value={tractor.id}>
                        {tractor.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trailerId">Trailer</Label>
                <Select name="trailerId" defaultValue={load?.trailerId || ""}>
                  <SelectTrigger id="trailerId">
                    <SelectValue placeholder="Select a trailer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_assigned">Not Assigned</SelectItem>
                    {trailers.map((trailer) => (
                      <SelectItem key={trailer.id} value={trailer.id}>
                        {trailer.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Enter additional information about the load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commodity">Commodity</Label>
                  <Input
                    id="commodity"
                    name="commodity"
                    defaultValue={load?.commodity || ""}
                    placeholder="e.g., Electronics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    defaultValue={load?.weight || ""}
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate ($)</Label>
                  <Input
                    id="rate"
                    name="rate"
                    type="number"
                    step="0.01"
                    defaultValue={load?.rate || ""}
                    placeholder="e.g., 2500.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="miles">Miles</Label>
                  <Input
                    id="miles"
                    name="miles"
                    type="number"
                    defaultValue={load?.miles || ""}
                    placeholder="e.g., 267"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={load?.notes || ""}
                  placeholder="Enter any additional notes about this load"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.push("/dispatch")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : load ? "Update Load" : "Create Load"}
        </Button>
      </div>
    </form>
  )
}
