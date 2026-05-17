// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { loadBayAvailabilityByZoneData } from "../../services/adminDashboardService"
import ChartFrame from "./ChartFrame"

// =====================================================
// EMPTY OCCUPANCY DATA
// No fake data. Used while loading/fallback.
// =====================================================

const emptyOccupancyByZoneData = [
  {
    zone: "Zone A",
    available: 0,
    unavailable: 0,
    total: 0,
  },
  {
    zone: "Zone B",
    available: 0,
    unavailable: 0,
    total: 0,
  },
  {
    zone: "Zone C",
    available: 0,
    unavailable: 0,
    total: 0,
  },
  {
    zone: "Zone D",
    available: 0,
    unavailable: 0,
    total: 0,
  },
]

// =====================================================
// CUSTOM TOOLTIP
// =====================================================

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-black text-slate-900">{label}</p>

      {payload.map((item) => (
        <p key={item.dataKey} className="text-sm font-semibold text-slate-600">
          {item.name}:{" "}
          <span className="font-black text-slate-950">
            {Number(item.value || 0)}
          </span>
        </p>
      ))}
    </div>
  )
}

// =====================================================
// OCCUPANCY / BAY AVAILABILITY BY ZONE CHART
// =====================================================

function OccupancyByZoneChart({ refreshKey = 0 }) {
  const [chartData, setChartData] = useState(emptyOccupancyByZoneData)
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

      setChartData(
        Array.isArray(realData) && realData.length > 0
          ? realData
          : emptyOccupancyByZoneData
      )
    } catch (error) {
      console.error("Failed to load bay availability by zone:", error)

      setLoadError(
        error.message || "Unable to load bay availability from Supabase."
      )

      setChartData(emptyOccupancyByZoneData)
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

  const totalBays = useMemo(() => {
    return chartData.reduce((total, zone) => total + Number(zone.total || 0), 0)
  }, [chartData])

  const totalAvailable = useMemo(() => {
    return chartData.reduce(
      (total, zone) => total + Number(zone.available || 0),
      0
    )
  }, [chartData])

  const maxValue = useMemo(() => {
    const highest = chartData.reduce((max, zone) => {
      return Math.max(
        max,
        Number(zone.available || 0),
        Number(zone.unavailable || 0),
        Number(zone.total || 0)
      )
    }, 0)

    return Math.max(5, highest + 2)
  }, [chartData])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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

      <ChartFrame className="h-[288px] min-h-[288px] w-full">
        {({ width, height }) => (
          <BarChart
            width={width}
            height={height}
            data={chartData}
            margin={{
              top: 16,
              right: 20,
              left: 0,
              bottom: 8,
            }}
          >
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
              domain={[0, maxValue]}
              allowDecimals={false}
              width={36}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend verticalAlign="bottom" height={36} iconType="circle" />

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
        )}
      </ChartFrame>
    </div>
  )
}

export default OccupancyByZoneChart