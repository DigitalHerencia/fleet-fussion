"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchIcon, UploadIcon, DownloadIcon, FilterIcon, FileTextIcon, FileWarningIcon, FileCheckIcon } from "lucide-react"
import React, { useState } from "react"
import type { TripReport } from "@/types/ifta"

interface IftaTripTableProps {
  trips: TripReport[];
}

export function IftaTripTable({ trips }: IftaTripTableProps) {
  const [searchTerm, setSearchTerm] = useState("")



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <UploadIcon className="mr-2 h-4 w-4" />
            Import Trips
          </Button>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Trips
          </Button>
          <Button variant="outline">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>Add Trip</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b bg-muted/50">
              <TableHead className="p-2 text-left text-sm font-medium">Date</TableHead>
              <TableHead className="p-2 text-left text-sm font-medium">Driver</TableHead>
              <TableHead className="p-2 text-left text-sm font-medium">Vehicle</TableHead>
              <TableHead className="p-2 text-left text-sm font-medium">Origin</TableHead>
              <TableHead className="p-2 text-left text-sm font-medium">Destination</TableHead>
              <TableHead className="p-2 text-right text-sm font-medium">Miles</TableHead>
              <TableHead className="p-2 text-left text-sm font-medium">Jurisdictions</TableHead>
              <TableHead className="p-2 text-left text-sm font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map(trip => (
              <TableRow key={trip.id} className="border-b">
                <TableCell className="p-2 text-sm">{trip.driverId}</TableCell>
                <TableCell className="p-2 text-sm">{trip.vehicleId}</TableCell>
                <TableCell className="p-2 text-sm">{trip.jurisdictions.map(j => j.jurisdiction).join(", ")}</TableCell>
                <TableCell className="p-2 text-sm">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <FileTextIcon className="h-5 w-5" />
                      <span className="sr-only">View Trip</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FileWarningIcon className="h-5 w-5 text-yellow-500" />
                      <span className="sr-only">View Discrepancies</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FileCheckIcon className="h-5 w-5 text-green-500" />
                      <span className="sr-only">Mark as Reconciled</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          View All Trips
        </Button>
      </div>
    </div>
  )
}
