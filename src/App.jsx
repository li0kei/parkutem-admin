// =====================================================
// IMPORTS
// =====================================================

import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

import ParkingBays from "./pages/ParkingBays"
import ANPRLogs from "./pages/ANPRLogs"
import Users from "./pages/Users"
import Vehicles from "./pages/Vehicles"
import Reservations from "./pages/Reservations"
import GuestBookings from "./pages/GuestBookings"
import Payments from "./pages/Payments"
import Reports from "./pages/Reports"
import Issues from "./pages/Issues"
import Settings from "./pages/Settings"


import ProtectedRoute from "./components/layout/ProtectedRoute"
import AdminLayout from "./components/layout/AdminLayout"



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

          <Route path="/parking-bays" element={<ParkingBays />} />

          <Route
            path="/anpr-logs"
            element={<ANPRLogs />}
          />

          <Route
            path="/users"
            element={<Users />}
          />

          <Route
            path="/vehicles"
            element={<Vehicles />}
          />

          <Route
            path="/reservations"
            element={<Reservations />}
          />

          <Route
            path="/guest-bookings"
            element={<GuestBookings />}
          />

          <Route
            path="/payments"
            element={<Payments />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/issues"
            element={<Issues />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App