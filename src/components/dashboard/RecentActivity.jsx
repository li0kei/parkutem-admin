// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useState } from "react"

import { recentActivities } from "../../data/dashboardData"
import { loadRecentDashboardActivities } from "../../services/adminDashboardService"
import StatusBadge from "../common/StatusBadge"

// =====================================================
// RECENT ACTIVITY COMPONENT
// =====================================================

function RecentActivity() {
  const [activities, setActivities] = useState(recentActivities)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD RECENT ACTIVITIES
  // =====================================================

  async function loadActivities() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realActivities = await loadRecentDashboardActivities()

      setActivities(realActivities)
    } catch (error) {
      console.error("Failed to load recent activities:", error)

      setLoadError(
        error.message || "Unable to load recent activities from Supabase."
      )

      setActivities(recentActivities)
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadActivities()
  }, [])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Recent Activity
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Latest guest booking and payment events.
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
          Loading recent activities...
        </div>
      )}

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={`${activity.title}-${activity.time}`}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-800">
                  {activity.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {activity.description}
                </p>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {activity.time}
                </p>
              </div>

              <StatusBadge status={activity.status} />
            </div>
          </div>
        ))}
      </div>

      {!isLoading && activities.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-black text-slate-700">
            No recent activity yet
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Guest bookings and payments will appear here once recorded.
          </p>
        </div>
      )}
    </div>
  )
}

export default RecentActivity