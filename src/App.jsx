// =====================================================
// IMPORTS
// =====================================================

import { lazy } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import Login from "./pages/Login"

import ProtectedRoute from "./components/layout/ProtectedRoute"
import AdminLayout from "./components/layout/AdminLayout"

import { adminRouteLoaders } from "./routes/adminRouteLoaders"

// PARKUTEM_ADMIN_PHASE_08_R1_ROUTE_CODE_SPLITTING
const Dashboard = lazy(adminRouteLoaders.dashboard)
const ParkingManagement = lazy(adminRouteLoaders.parking)
const ANPRLogs = lazy(adminRouteLoaders.anprLogs)
const Users = lazy(adminRouteLoaders.users)
const Vehicles = lazy(adminRouteLoaders.vehicles)
const Reservations = lazy(adminRouteLoaders.reservations)
const GuestBookings = lazy(adminRouteLoaders.guestBookings)
const Payments = lazy(adminRouteLoaders.payments)
const Reports = lazy(adminRouteLoaders.reports)
const Issues = lazy(adminRouteLoaders.issues)
const Settings = lazy(adminRouteLoaders.settings)

// =====================================================
// APP ROUTES
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/parking" element={<ParkingManagement />} />

          <Route
            path="/parking-bays"
            element={<Navigate to="/parking?view=bays" replace />}
          />

          <Route
            path="/parking-zones"
            element={<Navigate to="/parking?view=zones" replace />}
          />

          <Route path="/anpr-logs" element={<ANPRLogs />} />
          <Route path="/users" element={<Users />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/guest-bookings" element={<GuestBookings />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
