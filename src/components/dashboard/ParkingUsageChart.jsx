// =====================================================
// IMPORTS
// =====================================================

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { parkingUsageData } from "../../data/dashboardData"

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

function ParkingUsageChart() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-black text-slate-950">
          Parking Usage by Hour
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Number of vehicles entering and exiting campus by hour.
        </p>
      </div>

      {/* =====================================================
          MOBILE HORIZONTAL SCROLL CHART AREA ONLY
          ===================================================== */}

      <div
        className="max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="h-80 w-[760px] lg:w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={parkingUsageData}
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
                domain={[0, 120]}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />

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
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-1 text-center text-xs font-semibold text-slate-400 lg:hidden">
        Swipe chart sideways to view all hourly data
      </p>
    </div>
  )
}

export default ParkingUsageChart