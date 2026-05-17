// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { loadParkingUsageByHourData } from "../../services/adminDashboardService"
import ChartFrame from "./ChartFrame"

// =====================================================
// EMPTY PARKING USAGE DATA
// =====================================================

const emptyParkingUsageData = [
  { hour: "7AM", entries: 0, exits: 0 },
  { hour: "8AM", entries: 0, exits: 0 },
  { hour: "9AM", entries: 0, exits: 0 },
  { hour: "10AM", entries: 0, exits: 0 },
  { hour: "11AM", entries: 0, exits: 0 },
  { hour: "12PM", entries: 0, exits: 0 },
  { hour: "1PM", entries: 0, exits: 0 },
  { hour: "2PM", entries: 0, exits: 0 },
  { hour: "3PM", entries: 0, exits: 0 },
  { hour: "4PM", entries: 0, exits: 0 },
  { hour: "5PM", entries: 0, exits: 0 },
  { hour: "6PM", entries: 0, exits: 0 },
  { hour: "7PM", entries: 0, exits: 0 },
  { hour: "8PM", entries: 0, exits: 0 },
  { hour: "9PM", entries: 0, exits: 0 },
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
            {item.value} vehicles
          </span>
        </p>
      ))}
    </div>
  )
}

// =====================================================
// PARKING USAGE CHART
// =====================================================

function ParkingUsageChart({ refreshKey = 0 }) {
  const [chartData, setChartData] = useState(emptyParkingUsageData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD REAL PARKING USAGE
  // =====================================================

  async function loadChartData() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realData = await loadParkingUsageByHourData()

      setChartData(
        Array.isArray(realData) && realData.length > 0
          ? realData
          : emptyParkingUsageData
      )
    } catch (error) {
      console.error("Failed to load parking usage by hour:", error)

      setLoadError(
        error.message || "Unable to load parking usage from Supabase."
      )

      setChartData(emptyParkingUsageData)
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

  const totalEntries = useMemo(() => {
    return chartData.reduce(
      (total, item) => total + Number(item.entries || 0),
      0
    )
  }, [chartData])

  const totalExits = useMemo(() => {
    return chartData.reduce(
      (total, item) => total + Number(item.exits || 0),
      0
    )
  }, [chartData])

  const maxValue = useMemo(() => {
    const highest = chartData.reduce((max, item) => {
      return Math.max(max, Number(item.entries || 0), Number(item.exits || 0))
    }, 0)

    return Math.max(5, highest + 2)
  }, [chartData])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Parking Usage by Hour
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Today&apos;s ANPR entry and exit logs grouped by hour.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-cyan-50 px-4 py-2 text-right">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
              Entries
            </p>

            <p className="text-sm font-black text-slate-950">
              {totalEntries}
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 px-4 py-2 text-right">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
              Exits
            </p>

            <p className="text-sm font-black text-slate-950">
              {totalExits}
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          Loading parking usage from ANPR logs...
        </div>
      )}

      {/* =====================================================
          MOBILE HORIZONTAL SCROLL CHART AREA ONLY
          ===================================================== */}

      <div
        className="max-w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <ChartFrame className="h-[320px] min-h-[320px] w-[760px] min-w-[760px] lg:w-full lg:min-w-0">
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              margin={{
                top: 16,
                right: 30,
                left: 4,
                bottom: 8,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

              <XAxis
                dataKey="hour"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                padding={{ left: 24, right: 24 }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickMargin={8}
                domain={[0, maxValue]}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend verticalAlign="bottom" height={36} iconType="circle" />

              <Line
                type="monotone"
                dataKey="entries"
                name="Entries"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
                activeDot={{
                  r: 6,
                }}
              />

              <Line
                type="monotone"
                dataKey="exits"
                name="Exits"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          )}
        </ChartFrame>
      </div>

      <p className="mt-1 text-center text-xs font-semibold text-slate-400 lg:hidden">
        Swipe chart sideways to view all hourly data
      </p>
    </div>
  )
}

export default ParkingUsageChart