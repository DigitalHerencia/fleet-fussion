"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadCard } from "@/components/dispatch/load-card"
import { LoadForm } from "@/components/dispatch/load-form"
import { LoadDetailsDialog } from "@/components/dispatch/load-details-dialog"
import { PlusCircle, Filter } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateLoadAction } from "@/lib/actions/dispatchActions"
import type { BrokerInfo, CargoDetails, Customer, EquipmentRequirement, FactoringInfo, LoadAlert, LoadAssignedDriver, LoadAssignedTrailer, LoadAssignedVehicle, LoadDocument, LoadStatus, Rate, TrackingUpdate } from "@/types/dispatch"
import { string } from "zod"
import type { $Enums, LoadPriority, LoadStatusEvent } from "@prisma/client"

interface Driver {
  id: string
  firstName: string
  lastName: string
  status: string
  email?: string
  phone?: string
}

interface Vehicle {
status: $Enums.VehicleStatus;
    id: string;
    type: string;
    make: string | null;
    model: string | null;
    year: number | null;
    unitNumber: string;
    currentOdometer: number | null;
    lastInspectionDate: Date | null;
    nextInspectionDue: Date | null;
}

interface Load {
id: string
    organizationId: string
    referenceNumber: string
    status: LoadStatus
    priority: LoadPriority
    customer: Customer
    origin: string
    destination: string
    pickupDate: Date
    deliveryDate: Date
    estimatedPickupTime?: string
    estimatedDeliveryTime?: string
    actualPickupTime?: Date
    actualDeliveryTime?: Date
    driver?: LoadAssignedDriver
    vehicle?: LoadAssignedVehicle
    trailer?: LoadAssignedTrailer
    equipment?: EquipmentRequirement
    cargo: CargoDetails
    rate: Rate
    miles?: number
    estimatedMiles?: number
    fuelCost?: number
    notes?: string
    internalNotes?: string
    specialInstructions?: string
    documents?: LoadDocument[]
    statusHistory?: LoadStatusEvent[]
    trackingUpdates?: TrackingUpdate[]
    brokerInfo?: BrokerInfo
    factoring?: FactoringInfo
    alerts?: LoadAlert[]
    tags?: string[]
    createdAt: Date
    updatedAt: Date
    createdBy?: string
    lastModifiedBy?: string
    statusEvents?: LoadStatusEvent[]
}

interface DispatchBoardProps {
  loads: Load[]
  drivers: Driver[]
  vehicles: Vehicle[]
}

export function DispatchBoard({ loads, drivers, vehicles }: DispatchBoardProps) {
  const router = useRouter()
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  
  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    driverId: "",
    origin: "",
    destination: "",
    dateRange: ""
  })
  
  // Loading states for status updates
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const pendingLoads = loads.filter((load) => load.status === "pending")
  const assignedLoads = loads.filter((load) => load.status === "assigned")
  const inTransitLoads = loads.filter((load) => load.status === "in_transit")
  const completedLoads = loads.filter((load) => load.status === "completed")

  const handleLoadClick = (load: Load) => {
    setSelectedLoad(load)
    setIsDetailsOpen(true)
  }

  const handleNewLoadClick = () => {
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    // Refresh the page to show updated data
    router.refresh()
  }

  const handleFilterClick = () => {
    setIsFilterOpen(true)
  }

  // Filter apply function
  const applyFilters = () => {
    setIsFilterOpen(false)
    // Trigger a re-render by updating the active tab
    setActiveTab(activeTab)
  }

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      status: "",
      driverId: "",
      origin: "",
      destination: "",
      dateRange: ""
    })
  }
  
  // Handle status updates
  const handleStatusUpdate = async (loadId: string, newStatus: LoadStatus) => {
    setUpdatingId(loadId)
    try {
      const result = await updateLoadAction(loadId, { id: loadId, status: newStatus })
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Load status updated to ${newStatus.replace('_', ' ')}`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update load status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating load status:", error)
      toast({
        title: "Error",
        description: "Failed to update load status",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  // Apply filters to loads
  const filterLoads = (loadsToFilter: Load[]) => {
    return loadsToFilter.filter((load) => {
      if (filters.status && load.status !== filters.status) return false
      if (filters.driverId && load.driver?.id !== filters.driverId) return false
      if (filters.origin && load.origin !== filters.origin) return false
      if (filters.destination && load.destination !== filters.destination) return false
      
      // Date range filtering - simplified to show loads within last 30 days if "recent" is selected
      if (filters.dateRange === "recent") {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        if (new Date(load.pickupDate) < thirtyDaysAgo) return false
      }
      
      return true
    })
  }

  // Apply filters to each load category
  const filteredLoads = filterLoads(loads)
  const filteredPendingLoads = filterLoads(pendingLoads)
  const filteredAssignedLoads = filterLoads(assignedLoads)
  const filteredInTransitLoads = filterLoads(inTransitLoads)
  const filteredCompletedLoads = filterLoads(completedLoads)

  // Map vehicles to match LoadDetailsDialog expected type
  const mappedVehicles = vehicles.map((v) => ({
    ...v,
    make: v.make || "",
    model: v.model ?? "",
  }))

  if (!loads || loads.length === 0) {
    return <div className="text-gray-400 text-center py-12">No loads found for this organization.</div>
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto" onClick={handleNewLoadClick}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Load
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleFilterClick}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          {/* Quick stats */}
          <div className="text-sm text-muted-foreground">
            {filteredLoads.length} loads total • {filteredPendingLoads.length} pending • {filteredInTransitLoads.length} in transit
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-5 w-full min-w-[500px] bg-zinc-800 rounded-md p-1">
            <TabsTrigger value="all" className={activeTab === "all" ? "font-bold border-b-2 border-primary bg-zinc-900" : ""}>
              All <Badge className={`ml-2 ${activeTab === "all" ? "bg-primary text-white" : "bg-zinc-900 text-white"}`}>{filteredLoads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className={activeTab === "pending" ? "font-bold border-b-2 border-yellow-500 bg-zinc-900" : ""}>
              Pending <Badge className={`ml-2 ${activeTab === "pending" ? "bg-yellow-500 text-black" : "bg-yellow-500/30 text-yellow-200"}`}>{filteredPendingLoads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="assigned" className={activeTab === "assigned" ? "font-bold border-b-2 border-blue-500 bg-zinc-900" : ""}>
              Assigned <Badge className={`ml-2 ${activeTab === "assigned" ? "bg-blue-500 text-white" : "bg-blue-500/30 text-blue-200"}`}>{filteredAssignedLoads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in_transit" className={activeTab === "in_transit" ? "font-bold border-b-2 border-indigo-500 bg-zinc-900" : ""}>
              In Transit <Badge className={`ml-2 ${activeTab === "in_transit" ? "bg-indigo-500 text-white" : "bg-indigo-500/30 text-indigo-200"}`}>{filteredInTransitLoads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className={activeTab === "completed" ? "font-bold border-b-2 border-green-500 bg-zinc-900" : ""}>
              Completed <Badge className={`ml-2 ${activeTab === "completed" ? "bg-green-500 text-white" : "bg-green-500/30 text-green-200"}`}>{filteredCompletedLoads.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLoads.length > 0 ? (
              filteredLoads.map((load) => (
                <Card key={load.id} className="bg-neutral-900 border border-gray-700 shadow-lg flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white truncate">{load.referenceNumber || "Load"}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <LoadCard
                      load={load}
                      onClick={() => handleLoadClick(load)}
                      onStatusUpdate={(loadId, status) => handleStatusUpdate(loadId, status as LoadStatus)}
                      isUpdating={updatingId === load.id}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No loads found.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPendingLoads.length > 0 ? (
              filteredPendingLoads.map((load) => (
                <Card key={load.id} className="bg-neutral-900 border border-gray-700 shadow-lg flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white truncate">{load.referenceNumber || "Load"}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <LoadCard
                      load={load}
                      onClick={() => handleLoadClick(load)}
                      onStatusUpdate={(loadId, status) => handleStatusUpdate(loadId, status as LoadStatus)}
                      isUpdating={updatingId === load.id}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No pending loads found.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignedLoads.length > 0 ? (
              filteredAssignedLoads.map((load) => (
                <Card key={load.id} className="bg-neutral-900 border border-gray-700 shadow-lg flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white truncate">{load.referenceNumber || "Load"}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <LoadCard
                      load={load}
                      onClick={() => handleLoadClick(load)}
                      onStatusUpdate={(loadId, status) => handleStatusUpdate(loadId, status as LoadStatus)}
                      isUpdating={updatingId === load.id}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No assigned loads found.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in_transit" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInTransitLoads.length > 0 ? (
              filteredInTransitLoads.map((load) => (
                <Card key={load.id} className="bg-neutral-900 border border-gray-700 shadow-lg flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white truncate">{load.referenceNumber || "Load"}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <LoadCard
                      load={load}
                      onClick={() => handleLoadClick(load)}
                      onStatusUpdate={(loadId, status) => handleStatusUpdate(loadId, status as LoadStatus)}
                      isUpdating={updatingId === load.id}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No in-transit loads found.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompletedLoads.length > 0 ? (
              filteredCompletedLoads.map((load) => (
                <Card key={load.id} className="bg-neutral-900 border border-gray-700 shadow-lg flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white truncate">{load.referenceNumber || "Load"}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <LoadCard
                      load={load}
                      onClick={() => handleLoadClick(load)}
                      onStatusUpdate={(loadId, status) => handleStatusUpdate(loadId, status as LoadStatus)}
                      isUpdating={updatingId === load.id}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No completed loads found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load Form Dialog for New Load */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <LoadForm drivers={drivers} vehicles={vehicles} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>
      
      {/* Load Details Dialog for selected load */}
      {selectedLoad && (
        <LoadDetailsDialog
          load={selectedLoad}
          drivers={drivers}
          vehicles={mappedVehicles}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false)
            setSelectedLoad(null)
          }}
        />
      )}

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filter Loads</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver-filter">Driver</Label>
                <Select 
                  value={filters.driverId} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, driverId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All drivers</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin-filter">Origin State</Label>
                <Input
                  id="origin-filter"
                  placeholder="e.g., CA"
                  value={filters.origin}
                  onChange={(e) => setFilters(prev => ({ ...prev, originState: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination-filter">Destination State</Label>
                <Input
                  id="destination-filter"
                  placeholder="e.g., TX"
                  value={filters.destination}
                  onChange={(e) => setFilters(prev => ({ ...prev, destinationState: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-filter">Date Range</Label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All dates</SelectItem>
                    <SelectItem value="recent">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

