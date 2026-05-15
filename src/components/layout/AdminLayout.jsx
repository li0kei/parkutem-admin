// =====================================================
// IMPORTS
// =====================================================

import { useState } from "react"
import { Outlet } from "react-router"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

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
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout