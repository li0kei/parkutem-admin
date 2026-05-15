// =====================================================
// REPORTS / ANALYTICS DUMMY DATA
// =====================================================

export const analyticsSummary = {
  totalVehicles: 1842,
  averageOccupancy: "72%",
  totalRevenue: 1248.5,
  reservations: 268,
  guestBookings: 94,
  anprAccuracy: "96.8%",
  flaggedDetections: 17,
  activeIssues: 9,
}

// =====================================================
// TRAFFIC ANALYTICS
// =====================================================

export const trafficByDayData = [
  { label: "Mon", entries: 420, exits: 390, occupancy: 72 },
  { label: "Tue", entries: 510, exits: 470, occupancy: 78 },
  { label: "Wed", entries: 486, exits: 455, occupancy: 75 },
  { label: "Thu", entries: 545, exits: 502, occupancy: 81 },
  { label: "Fri", entries: 612, exits: 588, occupancy: 84 },
  { label: "Sat", entries: 220, exits: 210, occupancy: 42 },
  { label: "Sun", entries: 168, exits: 155, occupancy: 35 },
]

export const trafficByMonthData = [
  { label: "Jan", entries: 10420, exits: 10110, occupancy: 68 },
  { label: "Feb", entries: 11880, exits: 11420, occupancy: 71 },
  { label: "Mar", entries: 12540, exits: 12210, occupancy: 76 },
  { label: "Apr", entries: 13200, exits: 12840, occupancy: 79 },
  { label: "May", entries: 14260, exits: 13990, occupancy: 82 },
  { label: "Jun", entries: 12680, exits: 12330, occupancy: 74 },
]

// =====================================================
// REVENUE ANALYTICS
// =====================================================

export const revenueTrendData = [
  { label: "Mon", reservation: 76, parking: 44, guest: 45, refund: 0 },
  { label: "Tue", reservation: 90, parking: 61, guest: 55, refund: 5 },
  { label: "Wed", reservation: 104, parking: 73, guest: 65, refund: 0 },
  { label: "Thu", reservation: 98, parking: 88, guest: 40, refund: 10 },
  { label: "Fri", reservation: 122, parking: 108, guest: 90, refund: 0 },
  { label: "Sat", reservation: 48, parking: 32, guest: 70, refund: 5 },
  { label: "Sun", reservation: 36, parking: 24, guest: 55, refund: 0 },
]

export const revenueBreakdownReportData = [
  { name: "Reservation Fee", value: 574 },
  { name: "After 7PM Parking Fee", value: 430 },
  { name: "Guest Parking Fee", value: 420 },
  { name: "Refund", value: 20 },
]

// =====================================================
// CONVERSION / BOOKING ANALYTICS
// =====================================================

export const conversionData = [
  { label: "Viewed", guest: 520, reservation: 410 },
  { label: "Started", guest: 310, reservation: 288 },
  { label: "Paid", guest: 194, reservation: 268 },
  { label: "Entered", guest: 176, reservation: 242 },
]

export const reservationStatusReportData = [
  { name: "Upcoming", value: 86 },
  { name: "Active", value: 34 },
  { name: "Completed", value: 130 },
  { name: "Cancelled", value: 18 },
]

export const guestStatusReportData = [
  { name: "Upcoming", value: 28 },
  { name: "Active", value: 16 },
  { name: "Completed", value: 42 },
  { name: "Cancelled", value: 5 },
  { name: "Expired", value: 3 },
]

// =====================================================
// ANPR ANALYTICS
// =====================================================

export const anprDetectionData = [
  { label: "Mon", approved: 398, flagged: 6, unknown: 3 },
  { label: "Tue", approved: 486, flagged: 4, unknown: 5 },
  { label: "Wed", approved: 466, flagged: 8, unknown: 4 },
  { label: "Thu", approved: 512, flagged: 7, unknown: 6 },
  { label: "Fri", approved: 588, flagged: 10, unknown: 7 },
  { label: "Sat", approved: 210, flagged: 5, unknown: 4 },
  { label: "Sun", approved: 156, flagged: 3, unknown: 2 },
]

export const zoneOccupancyReportData = [
  { zone: "Zone A", occupied: 82, available: 18 },
  { zone: "Zone B", occupied: 74, available: 26 },
  { zone: "Zone C", occupied: 88, available: 12 },
  { zone: "Zone D", occupied: 63, available: 37 },
  { zone: "Visitor", occupied: 49, available: 51 },
]

// =====================================================
// LIVE ACTIVITY DATA
// =====================================================

export const liveActivityData = [
  {
    id: 1,
    time: "Just now",
    title: "ANPR detected MDA1234",
    description: "Student vehicle approved at Main Gate.",
    type: "ANPR",
    status: "Approved",
  },
  {
    id: 2,
    time: "2 minutes ago",
    title: "Guest payment completed",
    description: "MEL7788 registered automatically for guest ANPR access.",
    type: "Guest",
    status: "Paid",
  },
  {
    id: 3,
    time: "6 minutes ago",
    title: "After 7PM parking fee charged",
    description: "Wallet deducted RM3.00 based on actual usage.",
    type: "Payment",
    status: "Charged",
  },
  {
    id: 4,
    time: "11 minutes ago",
    title: "Reservation created",
    description: "Bay A-12 reserved with fixed one-time reservation fee.",
    type: "Reservation",
    status: "Upcoming",
  },
  {
    id: 5,
    time: "18 minutes ago",
    title: "Unknown plate flagged",
    description: "ABC9999 was not found in student/staff/guest records.",
    type: "ANPR",
    status: "Flagged",
  },
]

// =====================================================
// LIVE PARKING FLOW DATA
// =====================================================

export const liveParkingFlowData = [
  { time: "09:00", entries: 18, exits: 6, active: 32 },
  { time: "09:05", entries: 24, exits: 9, active: 47 },
  { time: "09:10", entries: 21, exits: 12, active: 56 },
  { time: "09:15", entries: 30, exits: 14, active: 72 },
  { time: "09:20", entries: 26, exits: 18, active: 80 },
  { time: "09:25", entries: 34, exits: 21, active: 93 },
  { time: "09:30", entries: 28, exits: 25, active: 96 },
  { time: "09:35", entries: 22, exits: 19, active: 99 },
  { time: "09:40", entries: 31, exits: 23, active: 107 },
  { time: "09:45", entries: 27, exits: 29, active: 105 },
]

// =====================================================
// LIVE ALERTS DATA
// =====================================================

export const liveAlertsData = [
  {
    id: 1,
    title: "Unknown plate detected",
    description:
      "ABC9999 was detected at Main Gate but not found in student, staff, or guest records.",
    time: "Just now",
    category: "ANPR",
    status: "Flagged",
  },
  {
    id: 2,
    title: "Low ANPR confidence",
    description:
      "Plate WYY5510 was detected with 78% confidence. Manual review may be required.",
    time: "3 minutes ago",
    category: "ANPR",
    status: "Warning",
  },
  {
    id: 3,
    title: "Sensor battery warning",
    description:
      "Bay A-04 sensor battery is below 25%. Maintenance check recommended.",
    time: "8 minutes ago",
    category: "IoT Sensor",
    status: "Warning",
  },
  {
    id: 4,
    title: "Payment pending",
    description:
      "Guest booking GST-1004 payment is pending. ANPR access is not enabled yet.",
    time: "12 minutes ago",
    category: "Payment",
    status: "Pending",
  },
  {
    id: 5,
    title: "Reserved bay occupied",
    description:
      "Bay B-03 is reserved but sensor reports occupied. Admin review required.",
    time: "18 minutes ago",
    category: "Parking Bay",
    status: "Flagged",
  },
]