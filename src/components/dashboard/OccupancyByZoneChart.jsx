// =====================================================
// IMPORTS
// =====================================================

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

// =====================================================
// OCCUPANCY BY ZONE CHART
// =====================================================

function OccupancyByZoneChart() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-950">
          Occupancy by Zone
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Current occupied and available bay distribution.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={occupancyByZoneData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="zone"
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
            <Legend />
            <Bar
              dataKey="occupied"
              name="Occupied"
              fill="#2563eb"
              radius={[12, 12, 0, 0]}
            />
            <Bar
              dataKey="available"
              name="Available"
              fill="#06b6d4"
              radius={[12, 12, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default OccupancyByZoneChart