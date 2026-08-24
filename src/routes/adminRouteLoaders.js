// =====================================================
// PARKUTEM ADMIN PHASE 08 R1 - ROUTE LOADERS
// =====================================================

export const adminRouteLoaders = {
  dashboard: () => import("../pages/Dashboard.jsx"),
  parking: () => import("../pages/ParkingManagement.jsx"),
  anprLogs: () => import("../pages/ANPRLogs.jsx"),
  users: () => import("../pages/Users.jsx"),
  vehicles: () => import("../pages/Vehicles.jsx"),
  reservations: () => import("../pages/Reservations.jsx"),
  guestBookings: () => import("../pages/GuestBookings.jsx"),
  payments: () => import("../pages/Payments.jsx"),
  reports: () => import("../pages/Reports.jsx"),
  issues: () => import("../pages/Issues.jsx"),
  settings: () => import("../pages/Settings.jsx"),
}

const routeLoaderByPath = {
  "/dashboard": adminRouteLoaders.dashboard,
  "/parking": adminRouteLoaders.parking,
  "/anpr-logs": adminRouteLoaders.anprLogs,
  "/users": adminRouteLoaders.users,
  "/vehicles": adminRouteLoaders.vehicles,
  "/reservations": adminRouteLoaders.reservations,
  "/guest-bookings": adminRouteLoaders.guestBookings,
  "/payments": adminRouteLoaders.payments,
  "/reports": adminRouteLoaders.reports,
  "/issues": adminRouteLoaders.issues,
  "/settings": adminRouteLoaders.settings,
}

export function prefetchAdminRoute(routePath) {
  const loader = routeLoaderByPath[routePath]

  if (!loader) {
    return
  }

  void loader()
}
