// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useState } from "react"

import StatCard from "../components/common/StatCard"

import OccupancyByZoneChart from "../components/dashboard/OccupancyByZoneChart"
import ParkingUsageChart from "../components/dashboard/ParkingUsageChart"
import RecentActivity from "../components/dashboard/RecentActivity"
import ReservationTrendChart from "../components/dashboard/ReservationTrendChart"
import RevenueBreakdownChart from "../components/dashboard/RevenueBreakdownChart"

import { dashboardStats } from "../data/dashboardData"

import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"

import { loadAdminDashboardStats } from "../services/adminDashboardService"

// =====================================================
// DASHBOARD REALTIME TABLES
// =====================================================

const dashboardRealtimeTables = [
  "guest_bookings",
  "payment_transactions",
  "parking_zones",
  "parking_bays",
  "anpr_logs",
  "reservations",
  "support_issues",
  "vehicle_records",
  "university_users",
  "guest_email_logs",
]

// =====================================================
// DASHBOARD PAGE
// =====================================================

function Dashboard() {
  const [stats, setStats] = useState(dashboardStats)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD DASHBOARD STATS
  // =====================================================

  async function loadDashboardStats({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const realStats = await loadAdminDashboardStats()
      setStats(realStats)
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)

      setLoadError(
        error.message || "Unable to load dashboard data from Supabase."
      )
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

    useEffect(() => {
      loadDashboardStats()
    }, [])

  // =====================================================
  // REALTIME REFRESH
  // =====================================================

  useAdminRealtimeRefresh({
    channelName: "admin-dashboard-realtime",
    tables: dashboardRealtimeTables,
      onRefresh: () => {
      loadDashboardStats({ silent: true })
      setRefreshKey((current) => current + 1)
    },
    onStatusChange: (statusInfo) => {
      console.log("Dashboard realtime:", statusInfo.label)
    },
  })

  return (
    <div className="space-y-6">
      {/* =====================================================
          SUPABASE LOAD STATUS
          ===================================================== */}

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          Loading real dashboard overview from Supabase...
        </div>
      )}

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
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      {/* =====================================================
          MAIN CHARTS
          ===================================================== */}

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <ParkingUsageChart refreshKey={refreshKey} />
        <RevenueBreakdownChart refreshKey={refreshKey} />
      </section>


      {/* =====================================================
          SECONDARY CHARTS AND ACTIVITY
          ===================================================== */}

        <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.05fr)]">
        <ReservationTrendChart refreshKey={refreshKey} />
        <OccupancyByZoneChart refreshKey={refreshKey} />
        <RecentActivity refreshKey={refreshKey} />
      </section>
    </div>
  )
}

export default Dashboard