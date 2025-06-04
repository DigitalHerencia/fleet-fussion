"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExpenseMetrics, ProfitabilityMetrics } from "@/types/analytics" // Assuming types are defined in @/types

interface FinancialMetricsProps {
  timeRange: string
  financialData: ProfitabilityMetrics[] // Updated prop type to ProfitabilityMetrics
  expenseBreakdown: ExpenseMetrics[] // Updated prop type to ExpenseMetrics
}

export function FinancialMetrics({ timeRange, financialData, expenseBreakdown }: FinancialMetricsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-black border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-bold text-white mb-4">Revenue & Expenses</h3>
        <ChartContainer
          config={{
            revenue: {
              label: "Revenue",
              color: "hsl(var(--chart-1))",
            },
            expenses: {
              label: "Expenses",
              color: "hsl(var(--chart-2))",
            },
            profit: {
              label: "Profit",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={financialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-black border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-bold text-white mb-4">Expense Breakdown</h3>
          <ChartContainer
            config={{
              value: {
                label: "Amount",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseBreakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="value" fill="var(--color-value)" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="bg-black border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-bold text-white mb-4">Financial Summary</h3>
          <div className="rounded-md border border-gray-200 bg-zinc-900 text-white">
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
                  <td className="p-2 text-sm font-medium">Total Revenue</td>
                  <td className="p-2 text-sm text-right">$128,450</td>
                  <td className="p-2 text-sm text-right">$114,750</td>
                  <td className="p-2 text-sm text-right text-green-600">+12.0%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-sm font-medium">Total Expenses</td>
                  <td className="p-2 text-sm text-right">$93,892</td>
                  <td className="p-2 text-sm text-right">$85,320</td>
                  <td className="p-2 text-sm text-right text-red-600">+10.0%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-sm font-medium">Net Profit</td>
                  <td className="p-2 text-sm text-right">$34,558</td>
                  <td className="p-2 text-sm text-right">$29,430</td>
                  <td className="p-2 text-sm text-right text-green-600">+17.4%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-sm font-medium">Profit Margin</td>
                  <td className="p-2 text-sm text-right">26.9%</td>
                  <td className="p-2 text-sm text-right">25.6%</td>
                  <td className="p-2 text-sm text-right text-green-600">+1.3%</td>
                </tr>
                <tr>
                  <td className="p-2 text-sm font-medium">Revenue per Mile</td>
                  <td className="p-2 text-sm text-right">$3.02</td>
                  <td className="p-2 text-sm text-right">$2.85</td>
                  <td className="p-2 text-sm text-right text-green-600">+6.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
