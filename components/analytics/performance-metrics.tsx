"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { RevenueMetrics } from "@/types/analytics"

interface PerformanceMetricsProps {
  timeRange: string
  performanceData: RevenueMetrics[] // Updated prop type to RevenueMetrics
}

export function PerformanceMetrics({ performanceData }: PerformanceMetricsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-black border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-bold text-white mb-4">Loads Delivered</h3>
          <ChartContainer
            config={{
              loads: {
                label: "Loads",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="loads" stroke="var(--color-loads)" name="Loads" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="bg-black border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-bold text-white mb-4">Miles Driven</h3>
          <ChartContainer
            config={{
              miles: {
                label: "Miles",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="miles" stroke="var(--color-miles)" name="Miles" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="bg-black border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-bold text-white mb-4">On-Time Delivery (%)</h3>
          <ChartContainer
            config={{
              onTimeDelivery: {
                label: "On-Time Delivery",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[80, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="onTimeDelivery"
                  stroke="var(--color-onTimeDelivery)"
                  name="On-Time Delivery"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="bg-black border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-bold text-white mb-4">Fleet Utilization (%)</h3>
          <ChartContainer
            config={{
              utilization: {
                label: "Utilization",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[80, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="utilization" stroke="var(--color-utilization)" name="Utilization" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-black text-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-zinc-900/50">
              <th className="p-2 text-left text-sm font-medium">Metric</th>
              <th className="p-2 text-right text-sm font-medium">Current Period</th>
              <th className="p-2 text-right text-sm font-medium">Previous Period</th>
              <th className="p-2 text-right text-sm font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 text-sm font-medium">Total Loads</td>
              <td className="p-2 text-sm text-right">209</td>
              <td className="p-2 text-sm text-right">195</td>
              <td className="p-2 text-sm text-right text-green-600">+7.2%</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-sm font-medium">Total Miles</td>
              <td className="p-2 text-sm text-right">62,350</td>
              <td className="p-2 text-sm text-right">58,450</td>
              <td className="p-2 text-sm text-right text-green-600">+6.7%</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-sm font-medium">Average Load Distance</td>
              <td className="p-2 text-sm text-right">298 mi</td>
              <td className="p-2 text-sm text-right">300 mi</td>
              <td className="p-2 text-sm text-right text-red-600">-0.7%</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-sm font-medium">On-Time Delivery Rate</td>
              <td className="p-2 text-sm text-right">94.2%</td>
              <td className="p-2 text-sm text-right">92.5%</td>
              <td className="p-2 text-sm text-right text-green-600">+1.8%</td>
            </tr>
            <tr>
              <td className="p-2 text-sm font-medium">Fleet Utilization</td>
              <td className="p-2 text-sm text-right">87.8%</td>
              <td className="p-2 text-sm text-right">85.2%</td>
              <td className="p-2 text-sm text-right text-green-600">+3.1%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
