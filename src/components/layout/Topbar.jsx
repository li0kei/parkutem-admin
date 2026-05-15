// =====================================================
// IMPORTS
// =====================================================

import { useLocation } from "react-router"
import { Bell, Menu, ShieldCheck } from "lucide-react"

import { getCurrentAdmin } from "../../utils/auth"

// =====================================================
// PAGE TITLE MAP
// =====================================================

const pageTitleMap = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor ParkUTeM parking operations in one place.",
  },
  "/parking-bays": {
    title: "Parking Bay Management",
    subtitle: "Track bay availability, sensor status, and zone usage.",
  },
  "/anpr-logs": {
    title: "ANPR Logs",
    subtitle:
      "Review vehicle entry, exit, detection confidence, and access status.",
  },
  "/users": {
    title: "Student/Staff Management",
    subtitle: "Manage university users, wallet balance, and vehicle ownership.",
  },
  "/vehicles": {
    title: "Vehicles & Stickers",
    subtitle: "Review plate records, sticker status, and ANPR access.",
  },
  "/reservations": {
    title: "Reservation Management",
    subtitle: "Monitor student and staff bay reservations.",
  },
  "/guest-bookings": {
    title: "Guest Booking Management",
    subtitle: "Monitor paid guest bookings and ANPR access status.",
  },
  "/payments": {
    title: "Wallet & Payment Transactions",
    subtitle: "Track reservation fees, parking fees, guest payments, and refunds.",
  },
  "/reports": {
    title: "Reports & Analytics",
    subtitle:
      "Analyse occupancy, revenue, reservations, guests, and ANPR performance.",
  },
  "/issues": {
    title: "Issue / Support Management",
    subtitle: "Track user-reported issues and support ticket progress.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Configure dummy parking policies and admin profile settings.",
  },
}

// =====================================================
// TOPBAR COMPONENT
// =====================================================

function Topbar({ setIsMobileOpen }) {
  const location = useLocation()
  const admin = getCurrentAdmin()

  const currentPage = pageTitleMap[location.pathname] || {
    title: "ParkUTeM Admin",
    subtitle: "Admin management console.",
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* =====================================================
            LEFT SIDE
            ===================================================== */}

        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              {currentPage.title}
            </h1>

            <p className="mt-1 hidden truncate text-sm text-slate-500 md:block">
              {currentPage.subtitle}
            </p>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
            ===================================================== */}

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-cyan-500" />
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-cyan-300">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">
                {admin.name}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {admin.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar