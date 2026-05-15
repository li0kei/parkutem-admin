// =====================================================
// IMPORTS
// =====================================================

import { recentActivities } from "../../data/dashboardData"
import StatusBadge from "../common/StatusBadge"

// =====================================================
// RECENT ACTIVITY COMPONENT
// =====================================================

function RecentActivity() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Recent Activity
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Latest ANPR, booking, payment, and sticker events.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div
            key={activity.title}
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
    </div>
  )
}

export default RecentActivity