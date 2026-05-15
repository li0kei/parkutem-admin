// =====================================================
// DASHBOARD DUMMY DATA
// =====================================================

export const dashboardStats = [
  {
    label: "Total Parking Bays",
    value: "520",
    helper: "Across campus zones",
    icon: "parking",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    label: "Available Bays",
    value: "184",
    helper: "Ready for parking",
    icon: "car",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Occupied Bays",
    value: "286",
    helper: "Currently occupied",
    icon: "activity",
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Reserved Bays",
    value: "50",
    helper: "Active reservations",
    icon: "calendar",
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Guest Bookings",
    value: "32",
    helper: "Paid guest access",
    icon: "scan",
    color: "bg-violet-50 text-violet-600",
  },
  {
    label: "Active Vehicles",
    value: "1,248",
    helper: "Student/staff records",
    icon: "users",
    color: "bg-sky-50 text-sky-600",
  },
  {
    label: "Revenue Today",
    value: "RM 842.50",
    helper: "Fees and bookings",
    icon: "money",
    color: "bg-teal-50 text-teal-600",
  },
  {
    label: "Pending Issues",
    value: "7",
    helper: "Need admin review",
    icon: "alert",
    color: "bg-red-50 text-red-600",
  },
]

// =====================================================
// PARKING USAGE BY HOUR
// =====================================================

export const parkingUsageData = [
  { hour: "7AM", entries: 42, exits: 8 },
  { hour: "8AM", entries: 96, exits: 15 },
  { hour: "9AM", entries: 78, exits: 24 },
  { hour: "10AM", entries: 55, exits: 31 },
  { hour: "11AM", entries: 48, exits: 39 },
  { hour: "12PM", entries: 36, exits: 57 },
  { hour: "1PM", entries: 44, exits: 49 },
  { hour: "2PM", entries: 62, exits: 41 },
  { hour: "3PM", entries: 58, exits: 53 },
  { hour: "4PM", entries: 39, exits: 76 },
  { hour: "5PM", entries: 25, exits: 104 },
  { hour: "6PM", entries: 18, exits: 88 },
  { hour: "7PM", entries: 22, exits: 63 },
  { hour: "8PM", entries: 17, exits: 49 },
  { hour: "9PM", entries: 12, exits: 35 },
]

// =====================================================
// RESERVATION TREND
// =====================================================

export const reservationTrendData = [
  { day: "Mon", reservations: 38 },
  { day: "Tue", reservations: 45 },
  { day: "Wed", reservations: 52 },
  { day: "Thu", reservations: 49 },
  { day: "Fri", reservations: 61 },
  { day: "Sat", reservations: 24 },
  { day: "Sun", reservations: 18 },
]

// =====================================================
// REVENUE BREAKDOWN
// =====================================================

export const revenueBreakdownData = [
  { name: "Reservation Fee", value: 320 },
  { name: "Parking Fee", value: 210 },
  { name: "Guest Parking Fee", value: 275 },
  { name: "Refund", value: 37.5 },
]

// =====================================================
// OCCUPANCY BY ZONE
// =====================================================

export const occupancyByZoneData = [
  { zone: "Zone A", occupied: 76, available: 24 },
  { zone: "Zone B", occupied: 62, available: 38 },
  { zone: "Zone C", occupied: 81, available: 19 },
  { zone: "Zone D", occupied: 54, available: 46 },
  { zone: "Visitor", occupied: 43, available: 57 },
]

// =====================================================
// RECENT ACTIVITY
// =====================================================

export const recentActivities = [
  {
    title: "ANPR detected vehicle MDA1234",
    description: "Student vehicle matched active sticker record at Main Gate.",
    time: "2 minutes ago",
    status: "Approved",
  },
  {
    title: "Guest payment completed for MEL7788",
    description: "Guest plate has been registered for ANPR access.",
    time: "8 minutes ago",
    status: "Paid",
  },
  {
    title: "Reservation created for Bay A-12",
    description: "Fixed one-time reservation fee charged to wallet.",
    time: "15 minutes ago",
    status: "Upcoming",
  },
  {
    title: "Parking fee deducted after 7PM",
    description: "Student/staff parking fee charged based on actual usage.",
    time: "25 minutes ago",
    status: "Charged",
  },
  {
    title: "Sticker verified for vehicle JKV9021",
    description: "Vehicle sticker approved and ANPR access enabled.",
    time: "40 minutes ago",
    status: "Verified",
  },
]