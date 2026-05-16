// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { reservationTrendData } from "../../data/dashboardData"
import { loadReservationTrendData } from "../../services/adminDashboardService"

// =====================================================
// RESERVATION TREND CHART
// =====================================================

function ReservationTrendChart() {
  const [chartData, setChartData] = useState(reservationTrendData)
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

      setChartData(realData)
    } catch (error) {
      console.error("Failed to load reservation trend:", error)

      setLoadError(
        error.message || "Unable to load reservation trend from Supabase."
      )

      setChartData(reservationTrendData)
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

  const totalReservations = useMemo(() => {
    return chartData.reduce(
      (total, item) => total + Number(item.reservations || 0),
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

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
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
              allowDecimals={false}
            />

            <Tooltip />

            <Bar
              dataKey="reservations"
              name="Reservations"
              fill="#06b6d4"
              radius={[12, 12, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ReservationTrendChart