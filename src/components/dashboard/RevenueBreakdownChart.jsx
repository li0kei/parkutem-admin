// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
} from "recharts"

import { revenueBreakdownData } from "../../data/dashboardData"
import { loadRevenueBreakdownData } from "../../services/adminDashboardService"
import ChartFrame from "./ChartFrame"

// =====================================================
// CHART COLORS
// =====================================================

const COLORS = ["#06b6d4", "#2563eb", "#14b8a6", "#22c55e", "#f97316"]

// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatRM(value) {
  return `RM ${Number(value || 0).toFixed(2)}`
}

// =====================================================
// REVENUE BREAKDOWN CHART
// =====================================================

function RevenueBreakdownChart({ refreshKey = 0 }) {
  const [chartData, setChartData] = useState(revenueBreakdownData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD REAL REVENUE BREAKDOWN
  // =====================================================

  async function loadChartData() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realData = await loadRevenueBreakdownData()
      setChartData(realData)
    } catch (error) {
      console.error("Failed to load revenue breakdown:", error)

      setLoadError(
        error.message || "Unable to load revenue breakdown from Supabase."
      )

      setChartData(revenueBreakdownData)
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD + REALTIME REFRESH
  // =====================================================

  useEffect(() => {
    loadChartData()
  }, [refreshKey])

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const totalRevenue = useMemo(() => {
    return chartData.reduce((total, item) => total + Number(item.value || 0), 0)
  }, [chartData])

  const visibleChartData = useMemo(() => {
    return chartData.filter((item) => Number(item.value || 0) > 0)
  }, [chartData])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Revenue Breakdown
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Real payment data from Supabase transactions.
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-50 px-4 py-2 text-right">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
            Total
          </p>

          <p className="text-sm font-black text-slate-950">
            {formatRM(totalRevenue)}
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          Loading revenue breakdown...
        </div>
      )}

      {visibleChartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <div>
            <p className="text-sm font-black text-slate-700">
              No paid revenue yet
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Revenue will appear here after payment transactions are recorded.
            </p>
          </div>
        </div>
      ) : (
        <ChartFrame className="h-[288px] min-h-[288px] w-full">
          {({ width, height }) => (
            <PieChart width={width} height={height}>
              <Tooltip formatter={(value) => formatRM(value)} />
              <Legend />

              <Pie
                data={visibleChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
              >
                {visibleChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          )}
        </ChartFrame>
      )}
    </div>
  )
}

export default RevenueBreakdownChart