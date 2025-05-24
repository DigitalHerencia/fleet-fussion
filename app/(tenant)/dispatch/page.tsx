import { Suspense } from "react"
import { DispatchBoard } from "@/components/dispatch/dispatch-board"
import { DispatchSkeleton } from "@/components/dispatch/dispatch-skeleton"
import { getLoads, getDrivers, getVehicles } from "@/lib/fetchers/fetchers"
import { auth } from "@clerk/nextjs/server"
import { DatabaseQueries } from "@/lib/database"


async function DispatchData() {
	const { userId, orgId } = await auth()
	
	if (!userId || !orgId) {
		return <div className="p-4 text-[hsl(var(--muted-foreground))]">Please sign in to access dispatch.</div>
	}

	// Get user to verify organization access
	const user = await DatabaseQueries.getUserByClerkId(userId)
	if (!user) {
		return <div className="p-4 text-[hsl(var(--muted-foreground))]">User not found. Please complete setup.</div>
	}

	// Fetch all required data in parallel
	const [loads, drivers, vehicles] = await Promise.all([
		getLoads(user.organizationId),
		getDrivers(user.organizationId),
		getVehicles(user.organizationId)
	])

	return <DispatchBoard loads={loads} drivers={drivers} vehicles={vehicles} />
}

export default function DispatchPage() {
	return (
		<div className="w-full max-w-7xl mx-auto flex flex-col gap-8 mt-10 dispatch-page">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
				<div>
					<h1 className="page-title">Dispatch Board</h1>
					<p className="page-subtitle">Manage and track your loads</p>
				</div>
			</div>
			<Suspense fallback={<DispatchSkeleton />}>
				<DispatchData />
			</Suspense>
		</div>
	)
}


