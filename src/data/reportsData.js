// =====================================================
// REPORTS / ANALYTICS FALLBACK DATA
// Real source: Supabase via adminReportsService.js
// =====================================================

export const emptyReportsData = {
  analyticsSummary: {
    totalVehicles: 0,
    averageOccupancy: "0%",
    totalRevenue: "0.00",
    reservations: 0,
    guestBookings: 0,
    anprAccuracy: "0%",
    flaggedDetections: 0,
    activeIssues: 0,
  },

  trafficByDayData: [],
  trafficByMonthData: [],

  revenueTrendData: [],
  revenueBreakdownReportData: [],

  conversionData: [],
  reservationStatusReportData: [],
  guestStatusReportData: [],

  anprDetectionData: [],
  zoneOccupancyReportData: [],

  liveActivityData: [],
  liveAlertsData: [],
  liveParkingFlowData: [],

  monthlySummary: {
    totalVehicles: 0,
    averageOccupancy: "0%",
    totalRevenue: 0,
    reservations: 0,
    guestBookings: 0,
    anprAccuracy: "0%",
    flaggedDetections: 0,
    activeIssues: 0,
  },

  compareSummary: {
    totalVehicles: 0,
    averageOccupancy: "0%",
    totalRevenue: 0,
    reservations: 0,
    guestBookings: 0,
    anprAccuracy: "0%",
    flaggedDetections: 0,
    activeIssues: 0,
  },

  monthlyTrafficData: [],
  monthlyRevenueData: [],
  monthlyComparisonChartData: [],
}