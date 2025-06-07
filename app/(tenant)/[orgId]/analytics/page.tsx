import { Suspense } from "react"
import { DollarSign, Truck, BarChart3, User, CalendarIcon, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PerformanceMetrics } from "@/components/analytics/performance-metrics"
import { FinancialMetrics } from "@/components/analytics/financial-metrics"
import { DriverPerformance } from "@/components/analytics/driver-performance"
import { VehicleUtilization } from "@/components/analytics/vehicle-utilization"
import { getDashboardSummary, getPerformanceAnalytics, getFinancialAnalytics, getDriverAnalytics, getVehicleAnalytics } from "@/lib/fetchers/analyticsFetchers"
import type { FinancialAnalytics } from "@/types/analytics"

export default async function AnalyticsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const timeRange = "30d"

  // Fetch all analytics data in parallel
  const [summary, performanceDataRaw, financialDataRaw, driverPerformanceMetricsRaw, vehicleDataRaw] = await Promise.all([
    getDashboardSummary(orgId, timeRange),
    getPerformanceAnalytics(orgId, timeRange),
    getFinancialAnalytics(orgId, timeRange),
    getDriverAnalytics(orgId, timeRange),
    getVehicleAnalytics(orgId, timeRange),
  ])

  // Defensive: ensure arrays/objects for all analytics data
  const performanceData = Array.isArray(performanceDataRaw) ? performanceDataRaw : [];
  const driverPerformanceMetrics = Array.isArray(driverPerformanceMetricsRaw) ? driverPerformanceMetricsRaw : [];
  const vehicleData = Array.isArray(vehicleDataRaw) ? vehicleDataRaw : [];
  const financialData: FinancialAnalytics =
    financialDataRaw && typeof financialDataRaw === 'object'
      ? (financialDataRaw as FinancialAnalytics)
      : { revenue: [], expenses: [], profitMargin: [] };

  // Metrics for cards
  const metrics = [
    {
      icon: <DollarSign className="h-4 w-4 text-[hsl(var(--info))]" />, label: "Total Revenue", value: summary ? `$${summary.totalRevenue.toLocaleString()}` : "-", change: summary && summary.totalRevenue && summary.averageRevenuePerMile ? `Avg $${summary.averageRevenuePerMile.toFixed(2)}/mile` : ""
    },
    {
      icon: <Truck className="h-4 w-4 text-[hsl(var(--info))]" />, label: "Total Miles", value: summary ? summary.totalMiles.toLocaleString() : "-", change: summary && summary.totalMiles ? `Loads: ${summary.totalLoads}` : ""
    },
    {
      icon: <BarChart3 className="h-4 w-4 text-[hsl(var(--info))]" />, label: "Load Count", value: summary ? summary.totalLoads.toLocaleString() : "-", change: summary && summary.totalLoads ? `Drivers: ${summary.activeDrivers}` : ""
    },
    {
      icon: <User className="h-4 w-4 text-[hsl(var(--info))]" />, label: "Active Vehicles", value: summary ? summary.activeVehicles.toLocaleString() : "-", change: summary && summary.activeVehicles ? `Active` : ""
    },
  ]

  return (
    <div className="pt-8 space-y-6 p-6 min-h-screen bg-neutral-900 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Analytics Dashboard</h1>
          <p className="text-base text-white/90">Track and analyze fleet performance metrics</p>
        </div>
        <div className="flex flex-row gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="border-gray-200 text-white">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button size="sm" className="bg-blue-500 text-white font-semibold">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Card className="bg-black border border-gray-200 rounded-md flex flex-col justify-between min-h-[120px]" key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-0 pt-4">
              <div className="flex items-center gap-2">
                {m.icon}
                <span className="text-sm font-medium text-white">{m.label}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-end flex-1 pb-4 pt-2">
              <span className="text-4xl font-extrabold text-white leading-tight">{m.value}</span>
              <span className="text-xs text-muted-foreground mt-1">{m.change}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="mt-4">
          <Card className="bg-black border border-gray-200 rounded-md">
            <CardHeader className="pb-2 pt-4">
              <span className="text-lg font-bold text-white">Performance Metrics</span>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-4">
              <PerformanceMetrics timeRange={timeRange} performanceData={performanceData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <Card className="bg-black border border-gray-200 rounded-md">
            <CardHeader className="pb-2 pt-4">
              <span className="text-lg font-bold text-white">Financial Metrics</span>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-4">
              <FinancialMetrics timeRange={timeRange} financialData={financialData.revenue} expenseBreakdown={financialData.expenses} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="drivers" className="mt-4">
          <Card className="bg-black border border-gray-200 rounded-md">
            <CardHeader className="pb-2 pt-4">
              <span className="text-lg font-bold text-white">Driver Performance</span>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-4">
              <DriverPerformance timeRange={timeRange} driverPerformanceMetrics={driverPerformanceMetrics} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicles" className="mt-4">
          <Card className="bg-black border border-gray-200 rounded-md">
            <CardHeader className="pb-2 pt-4">
              <span className="text-lg font-bold text-white">Vehicle Utilization</span>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-4">
              <VehicleUtilization timeRange={timeRange} vehicleData={vehicleData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
