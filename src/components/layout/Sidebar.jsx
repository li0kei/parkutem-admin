// =====================================================
// IMPORTS
// =====================================================

import { NavLink, useNavigate } from "react-router"
import {
  BarChart3,
  CalendarCheck,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MonitorCog,
  ScanLine,
  Settings,
  TicketCheck,
  Users,
  X,
} from "lucide-react"

import { logoutAdmin } from "../../utils/auth"

// =====================================================
// SIDEBAR NAVIGATION ITEMS
// =====================================================

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Parking Bays",
    path: "/parking-bays",
    icon: MonitorCog,
  },
  {
    label: "ANPR Logs",
    path: "/anpr-logs",
    icon: ScanLine,
  },
  {
    label: "Student/Staff",
    path: "/users",
    icon: Users,
  },
  {
    label: "Vehicles & Stickers",
    path: "/vehicles",
    icon: Car,
  },
  {
    label: "Reservations",
    path: "/reservations",
    icon: CalendarCheck,
  },
  {
    label: "Guest Bookings",
    path: "/guest-bookings",
    icon: TicketCheck,
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CircleDollarSign,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
  },
  {
    label: "Issues",
    path: "/issues",
    icon: LifeBuoy,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
]

// =====================================================
// SIDEBAR COMPONENT
// =====================================================

function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const navigate = useNavigate()

  // =====================================================
  // HANDLE LOGOUT
  // =====================================================

  function handleLogout() {
    logoutAdmin()
    navigate("/login", { replace: true })
  }

  // =====================================================
  // CLOSE MOBILE SIDEBAR AFTER CLICK
  // =====================================================

  function handleNavClick() {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] min-h-[100dvh] flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 transition-all duration-300
        ${isCollapsed ? "lg:w-24" : "lg:w-72"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        w-[78vw] max-w-[22rem] sm:w-72`}
      >
        {/* =====================================================
            SIDEBAR HEADER
            ===================================================== */}

        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-black">
              <img
                src="/parkutem-logo.jpeg"
                alt="ParkUTeM Logo"
                className="h-full w-full object-cover"
              />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight">
                  Park<span className="text-cyan-300">UTeM</span>
                </h1>
                <p className="truncate text-xs font-semibold text-slate-400">
                  Admin Portal
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            NAVIGATION - SCROLLABLE
            ===================================================== */}

        <nav className="min-h-0 flex-1 touch-pan-y space-y-1 overflow-y-auto overscroll-contain px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition
                  ${
                    isActive
                      ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/10"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }
                  ${isCollapsed ? "lg:justify-center lg:px-3" : ""}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />

                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* =====================================================
            SIDEBAR FOOTER
            ===================================================== */}

        <div className="shrink-0 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="mb-3 hidden w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                Collapse
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/10 hover:text-red-100 ${
              isCollapsed ? "lg:justify-center lg:px-3" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar