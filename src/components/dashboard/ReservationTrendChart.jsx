// =====================================================
// IMPORTS
// =====================================================

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

// =====================================================
// RESERVATION TREND CHART
// =====================================================

function ReservationTrendChart() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-950">
          Reservation Trend
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Student and staff advance parking reservations.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reservationTrendData}>
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