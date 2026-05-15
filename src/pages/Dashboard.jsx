// =====================================================
// IMPORTS
// =====================================================

import StatCard from "../components/common/StatCard"

import OccupancyByZoneChart from "../components/dashboard/OccupancyByZoneChart"
import ParkingUsageChart from "../components/dashboard/ParkingUsageChart"
import RecentActivity from "../components/dashboard/RecentActivity"
import ReservationTrendChart from "../components/dashboard/ReservationTrendChart"
import RevenueBreakdownChart from "../components/dashboard/RevenueBreakdownChart"

import { dashboardStats } from "../data/dashboardData"

// =====================================================
// DASHBOARD PAGE
// =====================================================

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* =====================================================
          WELCOME PANEL
          ===================================================== */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Admin Overview
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                ParkUTeM Operations Dashboard
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Monitor ANPR access, bay availability, guest bookings,
                reservations, payments, stickers, and user support activity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-black text-cyan-300">98.2%</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  ANPR accuracy
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-black text-cyan-300">Online</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  System status
                </p>
              </div>

              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur sm:col-span-1">
                <p className="text-2xl font-black text-cyan-300">7AM–7PM</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Free student/staff parking
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      {/* =====================================================
          MAIN CHARTS
          ===================================================== */}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ParkingUsageChart />
        <RevenueBreakdownChart />
      </section>

      {/* =====================================================
          SECONDARY CHARTS AND ACTIVITY
          ===================================================== */}

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_1fr_1.05fr]">
        <ReservationTrendChart />
        <OccupancyByZoneChart />
        <RecentActivity />
      </section>
    </div>
  )
}

export default Dashboard