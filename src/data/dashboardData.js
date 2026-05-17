// =====================================================
// DASHBOARD FALLBACK DATA
// Used only before Supabase data is loaded or if loading fails.
// Keep the data shape stable so charts/components do not break.
// =====================================================

export const dashboardStats = [
  {
    label: "Total Parking Bays",
    value: "0",
    helper: "Across campus zones",
    icon: "parking",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    label: "Available Bays",
    value: "0",
    helper: "Ready for parking",
    icon: "car",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Occupied Bays",
    value: "0",
    helper: "Currently occupied",
    icon: "activity",
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Reserved Bays",
    value: "0",
    helper: "Active reservations",
    icon: "calendar",
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Guest Bookings",
    value: "0",
    helper: "Paid guest access",
    icon: "scan",
    color: "bg-violet-50 text-violet-600",
  },
  {
    label: "Active Vehicles",
    value: "0",
    helper: "Student/staff records",
    icon: "users",
    color: "bg-sky-50 text-sky-600",
  },
  {
    label: "Revenue Today",
    value: "RM 0.00",
    helper: "Fees and bookings",
    icon: "money",
    color: "bg-teal-50 text-teal-600",
  },
  {
    label: "Pending Issues",
    value: "0",
    helper: "Need admin review",
    icon: "alert",
    color: "bg-red-50 text-red-600",
  },
]

// =====================================================
// PARKING USAGE BY HOUR FALLBACK
// =====================================================

export const parkingUsageData = [
  { hour: "7AM", entries: 0, exits: 0 },
  { hour: "8AM", entries: 0, exits: 0 },
  { hour: "9AM", entries: 0, exits: 0 },
  { hour: "10AM", entries: 0, exits: 0 },
  { hour: "11AM", entries: 0, exits: 0 },
  { hour: "12PM", entries: 0, exits: 0 },
  { hour: "1PM", entries: 0, exits: 0 },
  { hour: "2PM", entries: 0, exits: 0 },
  { hour: "3PM", entries: 0, exits: 0 },
  { hour: "4PM", entries: 0, exits: 0 },
  { hour: "5PM", entries: 0, exits: 0 },
  { hour: "6PM", entries: 0, exits: 0 },
  { hour: "7PM", entries: 0, exits: 0 },
  { hour: "8PM", entries: 0, exits: 0 },
  { hour: "9PM", entries: 0, exits: 0 },
]

// =====================================================
// RESERVATION TREND FALLBACK
// =====================================================

export const reservationTrendData = [
  { day: "Mon", reservations: 0 },
  { day: "Tue", reservations: 0 },
  { day: "Wed", reservations: 0 },
  { day: "Thu", reservations: 0 },
  { day: "Fri", reservations: 0 },
  { day: "Sat", reservations: 0 },
  { day: "Sun", reservations: 0 },
]

// =====================================================
// REVENUE BREAKDOWN FALLBACK
// =====================================================

export const revenueBreakdownData = [
  { name: "Reservation Fee", value: 0 },
  { name: "Parking Fee", value: 0 },
  { name: "Guest Parking Fee", value: 0 },
  { name: "Refund", value: 0 },
]

// =====================================================
// OCCUPANCY BY ZONE FALLBACK
// =====================================================

export const occupancyByZoneData = [
  { zone: "Zone A", total: 0, occupied: 0, available: 0, unavailable: 0 },
  { zone: "Zone B", total: 0, occupied: 0, available: 0, unavailable: 0 },
  { zone: "Zone C", total: 0, occupied: 0, available: 0, unavailable: 0 },
  { zone: "Zone D", total: 0, occupied: 0, available: 0, unavailable: 0 },
]

// =====================================================
// RECENT ACTIVITY FALLBACK
// =====================================================

export const recentActivities = []