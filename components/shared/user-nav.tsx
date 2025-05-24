"use client"

import { useAuth } from "@/lib/auth/context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export function UserNav() {
  const { user, organization } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    // Using Clerk's signOut from the useClerk hook
    router.push("/login")
  }

  if (!user || !organization) {
    return null
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Open user menu"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src="/black_logo.png" alt={user.name} />
              <AvatarFallback>
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {/* Status dot */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/black_logo.png" alt={user.name} />
              <AvatarFallback>
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-semibold leading-tight">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              <span className="mt-1 inline-block rounded bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{organization.name}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="rounded-md px-3 py-2 hover:bg-accent/60 transition-colors cursor-pointer">Profile</DropdownMenuItem>
          <DropdownMenuItem className="rounded-md px-3 py-2 hover:bg-accent/60 transition-colors cursor-pointer">Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="rounded-md px-3 py-2 text-destructive hover:bg-destructive/10 cursor-pointer">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
