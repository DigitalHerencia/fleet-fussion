import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 flex flex-col items-center justify-center">
        {children}
      </main>
    </div>
  )
}
