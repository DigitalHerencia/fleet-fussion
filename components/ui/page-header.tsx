import Image from "next/image"
import { cn } from "@/lib/utils"
import { UserNav } from "@/components/shared/user-nav"


interface PageHeaderProps {
  className?: string
}

export function PageHeader({ className }: PageHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-zinc-800 z-50">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Image src="/white_logo.png" alt="FleetFusion Logo" width={200} height={100} priority className="dark:invert-0"/>
        </div>
        <UserNav />
      </div>
    </header>
  )
}
