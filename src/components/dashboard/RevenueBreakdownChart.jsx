// =====================================================
// IMPORTS
// =====================================================

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { revenueBreakdownData } from "../../data/dashboardData"

// =====================================================
// CHART COLORS
// =====================================================

const COLORS = ["#06b6d4", "#2563eb", "#14b8a6", "#f97316"]

// =====================================================
// REVENUE BREAKDOWN CHART
// =====================================================

function RevenueBreakdownChart() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-950">
          Revenue Breakdown
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Reservation fee, parking fee, guest fee, and refunds.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip formatter={(value) => `RM ${value}`} />
            <Legend />
            <Pie
              data={revenueBreakdownData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
            >
              {revenueBreakdownData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RevenueBreakdownChart