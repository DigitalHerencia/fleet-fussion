"use client"
import Link from "next/link"
import { MapPinned } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 px-4 lg:px-6 h-16 flex items-center border-b bg-black dark:bg-black">
      <div className="flex flex-1 items-center">
        <Link className="flex items-center justify-center" href="/">
          <MapPinned className="h-6 w-6 text-primary mr-1" />
          <span className="font-extrabold text-blue-700 dark:text-blue-400 text-2xl">FleetFusion</span>
        </Link>
      </div>      <nav className="flex items-center gap-6">
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/features">
          
          Features
        </Link>
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
          Pricing
        </Link>
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about">
          About
        </Link>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/sign-in">
            Sign In
          </Link>
        </Button>
      </nav>
    </header>
  )
}