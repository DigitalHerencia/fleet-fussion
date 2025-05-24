"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, Truck, MoreVertical } from "lucide-react"
import { formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Load {
  id: string
  referenceNumber: string
  status: string
  customerName: string
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
  pickupDate: Date
  deliveryDate: Date
  driver?: {
    id: string
    firstName: string
    lastName: string
  } | null
  vehicle?: {
    id: string
    unitNumber: string
  } | null
}

interface LoadCardProps {
  load: Load
  onClick: () => void
  onStatusUpdate?: (loadId: string, status: string) => void
  isUpdating?: boolean
}

export function LoadCard({ load, onClick, onStatusUpdate, isUpdating }: LoadCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "assigned":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "in_transit":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return [
          { value: "assigned", label: "Mark Assigned" },
          { value: "cancelled", label: "Cancel Load" }
        ]
      case "assigned":
        return [
          { value: "in_transit", label: "Mark In Transit" },
          { value: "cancelled", label: "Cancel Load" }
        ]
      case "in_transit":
        return [
          { value: "completed", label: "Mark Completed" }
        ]
      default:
        return []
    }
  }

  const nextStatusOptions = getNextStatusOptions(load.status)

  const handleStatusClick = (e: React.MouseEvent, status: string) => {
    e.stopPropagation()
    onStatusUpdate?.(load.id, status)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not clicking on dropdown or status update buttons
    const target = e.target as HTMLElement
    if (!target.closest('[data-status-action]')) {
      onClick()
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{load.referenceNumber}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(load.status)}`}>{load.status.replace("_", " ")}</Badge>
            {onStatusUpdate && nextStatusOptions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    data-status-action
                    disabled={isUpdating}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-status-action>
                  {nextStatusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={(e) => handleStatusClick(e, option.value)}
                      disabled={isUpdating}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{load.customerName}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Origin</p>
              <p className="text-sm text-muted-foreground">
                {load.originCity}, {load.originState}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Destination</p>
              <p className="text-sm text-muted-foreground">
                {load.destinationCity}, {load.destinationState}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">{formatDate(load.pickupDate)}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <div className="w-full space-y-1">
          {load.driver ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Driver:</span>
              </div>
              <span className="text-xs font-medium">
                {load.driver.firstName} {load.driver.lastName}
              </span>
            </div>
          ) : null}
          {load.vehicle ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Vehicle:</span>
              </div>
              <span className="text-xs font-medium">{load.vehicle.unitNumber}</span>
            </div>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  )
}
