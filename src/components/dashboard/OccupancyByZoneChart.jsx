// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { occupancyByZoneData } from "../../data/dashboardData"
import { loadBayAvailabilityByZoneData } from "../../services/adminDashboardService"

// =====================================================
// TOOLTIP FORMATTER
// =====================================================

function formatTooltip(value, name) {
  const labelMap = {
    available: "Available Bays",
    unavailable: "Unavailable Bays",
  }

  return [value, labelMap[name] || name]
}

// =====================================================
// OCCUPANCY / BAY AVAILABILITY BY ZONE CHART
// =====================================================

function OccupancyByZoneChart() {
  const [chartData, setChartData] = useState(occupancyByZoneData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD REAL BAY AVAILABILITY
  // =====================================================

  async function loadChartData() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realData = await loadBayAvailabilityByZoneData()

      setChartData(realData)
    } catch (error) {
      console.error("Failed to load bay availability by zone:", error)

      setLoadError(
        error.message ||
          "Unable to load bay availability from Supabase."
      )

      setChartData(occupancyByZoneData)
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadChartData()
  }, [])

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const totalBays = useMemo(() => {
    return chartData.reduce((total, zone) => total + Number(zone.total || 0), 0)
  }, [chartData])

  const totalAvailable = useMemo(() => {
    return chartData.reduce(
      (total, zone) => total + Number(zone.available || 0),
      0
    )
  }, [chartData])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Bay Availability by Zone
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Database bay layout for Zone A-D. IoT sensor updates will be
            connected later.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-right">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            Available
          </p>

          <p className="text-sm font-black text-slate-950">
            {totalAvailable}/{totalBays}
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
          Loading bay availability by zone...
        </div>
      )}

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="zone"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />

            <Tooltip formatter={formatTooltip} />
            <Legend />

            <Bar
              dataKey="available"
              name="Available Bays"
              radius={[10, 10, 0, 0]}
              fill="#10b981"
            />

            <Bar
              dataKey="unavailable"
              name="Unavailable Bays"
              radius={[10, 10, 0, 0]}
              fill="#f97316"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default OccupancyByZoneChart