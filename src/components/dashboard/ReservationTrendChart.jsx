// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { loadReservationTrendData } from "../../services/adminDashboardService"
import ChartFrame from "./ChartFrame"

// =====================================================
// EMPTY RESERVATION TREND DATA
// No fake data. Used while loading/fallback.
// =====================================================

const emptyReservationTrendData = [
  { day: "Mon", reservations: 0 },
  { day: "Tue", reservations: 0 },
  { day: "Wed", reservations: 0 },
  { day: "Thu", reservations: 0 },
  { day: "Fri", reservations: 0 },
  { day: "Sat", reservations: 0 },
  { day: "Sun", reservations: 0 },
]

// =====================================================
// CUSTOM TOOLTIP
// =====================================================

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const reservations = Number(payload[0]?.value || 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-black text-slate-900">{label}</p>

      <p className="text-sm font-semibold text-slate-600">
        Reservations:{" "}
        <span className="font-black text-slate-950">
          {reservations}
        </span>
      </p>
    </div>
  )
}

// =====================================================
// RESERVATION TREND CHART
// =====================================================

function ReservationTrendChart({ refreshKey = 0 }) {
  const [chartData, setChartData] = useState(emptyReservationTrendData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD REAL RESERVATION TREND
  // =====================================================

  async function loadChartData() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realData = await loadReservationTrendData()

      setChartData(
        Array.isArray(realData) && realData.length > 0
          ? realData
          : emptyReservationTrendData
      )
    } catch (error) {
      console.error("Failed to load reservation trend:", error)

      setLoadError(
        error.message || "Unable to load reservation trend from Supabase."
      )

      setChartData(emptyReservationTrendData)
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

  const totalReservations = useMemo(() => {
    return chartData.reduce(
      (total, item) => total + Number(item.reservations || 0),
      0
    )
  }, [chartData])

  const maxValue = useMemo(() => {
    const highest = chartData.reduce((max, item) => {
      return Math.max(max, Number(item.reservations || 0))
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
            Reservation Trend
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Current week student and staff bay reservations.
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-50 px-4 py-2 text-right">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
            This Week
          </p>

          <p className="text-sm font-black text-slate-950">
            {totalReservations} reservations
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
          Loading reservation trend...
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            <XAxis
              dataKey="day"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, maxValue]}
              allowDecimals={false}
              width={36}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar
              dataKey="reservations"
              name="Reservations"
              fill="#06b6d4"
              radius={[12, 12, 0, 0]}
            />
          </BarChart>
        )}
      </ChartFrame>
    </div>
  )
}

export default ReservationTrendChart