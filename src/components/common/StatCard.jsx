// =====================================================
// IMPORTS
// =====================================================

import {
  Activity,
  CalendarCheck,
  Car,
  CircleDollarSign,
  ClockAlert,
  ParkingCircle,
  ScanLine,
  Users,
} from "lucide-react"

// =====================================================
// ICON MAP
// =====================================================

const iconMap = {
  parking: ParkingCircle,
  car: Car,
  activity: Activity,
  calendar: CalendarCheck,
  scan: ScanLine,
  users: Users,
  money: CircleDollarSign,
  alert: ClockAlert,
}

// =====================================================
// STAT CARD COMPONENT
// =====================================================

function StatCard({ stat }) {
  const Icon = iconMap[stat.icon] || Activity

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{stat.label}</p>

          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {stat.value}
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {stat.helper}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

export default StatCard