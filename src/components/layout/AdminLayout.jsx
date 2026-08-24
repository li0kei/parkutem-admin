// =====================================================
// IMPORTS
// =====================================================

import { Suspense, useState } from "react"
import { Outlet } from "react-router"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

// =====================================================
// ROUTE LOADING FALLBACK
// =====================================================

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="rounded-2xl border border-cyan-100 bg-white px-6 py-5 text-center shadow-sm">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
        <p className="mt-3 text-sm font-black text-slate-700">
          Loading admin module...
        </p>
      </div>
    </div>
  )
}

// =====================================================
// ADMIN LAYOUT
// =====================================================

function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f3f7fb] text-slate-950">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        <Topbar setIsMobileOpen={setIsMobileOpen} />

        <main className="px-4 py-6 sm:px-6">
          {/* PARKUTEM_ADMIN_PHASE_08_R1_ROUTE_SUSPENSE */}
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
