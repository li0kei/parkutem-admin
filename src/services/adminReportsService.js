// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// DATE HELPERS
// =====================================================

function getTodayIsoRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function getDateRangeIso(startDate, endDate) {
  const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date()
  const end = endDate ? new Date(`${endDate}T23:59:59`) : new Date()

  if (!startDate) {
    start.setHours(0, 0, 0, 0)
  }

  if (!endDate) {
    end.setHours(23, 59, 59, 999)
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function getMonthRangeIso(month, year) {
  const start = new Date(Number(year), Number(month) - 1, 1)
  const end = new Date(Number(year), Number(month), 1)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function isWithinRange(value, startIso, endIso) {
  if (!value) {
    return false
  }

  const time = new Date(value).getTime()
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()

  return time >= start && time <= end
}

function isWithinHalfOpenRange(value, startIso, endIso) {
  if (!value) {
    return false
  }

  const time = new Date(value).getTime()
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()

  return time >= start && time < end
}

// =====================================================
// FORMAT HELPERS
// =====================================================

function formatRM(value) {
  return Number(value || 0).toFixed(2)
}

function formatTimeAgo(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)

  if (diffMinutes < 1) {
    return "Just now"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

// =====================================================
// DAY / MONTH BUCKET HELPERS
// =====================================================

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


function getDayLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return DAY_LABELS[date.getDay()]
}

function createTrafficWeekData(anprLogs, parkingBays) {
  const buckets = {
    Mon: { label: "Mon", entries: 0, exits: 0, occupancy: 0 },
    Tue: { label: "Tue", entries: 0, exits: 0, occupancy: 0 },
    Wed: { label: "Wed", entries: 0, exits: 0, occupancy: 0 },
    Thu: { label: "Thu", entries: 0, exits: 0, occupancy: 0 },
    Fri: { label: "Fri", entries: 0, exits: 0, occupancy: 0 },
    Sat: { label: "Sat", entries: 0, exits: 0, occupancy: 0 },
    Sun: { label: "Sun", entries: 0, exits: 0, occupancy: 0 },
  }

  anprLogs.forEach((log) => {
    const eventTime = log.detected_at || log.entry_time || log.exit_time
    const label = getDayLabel(eventTime)

    if (!label || !buckets[label]) {
      return
    }

    if (log.detection_type === "exit") {
      buckets[label].exits += 1
      return
    }

    buckets[label].entries += 1
  })

  const totalBays = parkingBays.length
  const unavailableBays = parkingBays.filter(
    (bay) => bay.status !== "available"
  ).length

  const occupancy =
    totalBays > 0 ? Math.round((unavailableBays / totalBays) * 100) : 0

  return Object.values(buckets).map((item) => ({
    ...item,
    occupancy,
  }))
}

function createTrafficMonthData(anprLogs) {
  const buckets = {
    Jan: { label: "Jan", entries: 0, exits: 0, occupancy: 0 },
    Feb: { label: "Feb", entries: 0, exits: 0, occupancy: 0 },
    Mar: { label: "Mar", entries: 0, exits: 0, occupancy: 0 },
    Apr: { label: "Apr", entries: 0, exits: 0, occupancy: 0 },
    May: { label: "May", entries: 0, exits: 0, occupancy: 0 },
    Jun: { label: "Jun", entries: 0, exits: 0, occupancy: 0 },
    Jul: { label: "Jul", entries: 0, exits: 0, occupancy: 0 },
    Aug: { label: "Aug", entries: 0, exits: 0, occupancy: 0 },
    Sep: { label: "Sep", entries: 0, exits: 0, occupancy: 0 },
    Oct: { label: "Oct", entries: 0, exits: 0, occupancy: 0 },
    Nov: { label: "Nov", entries: 0, exits: 0, occupancy: 0 },
    Dec: { label: "Dec", entries: 0, exits: 0, occupancy: 0 },
  }

  const monthLabels = Object.keys(buckets)

  anprLogs.forEach((log) => {
    const eventTime = log.detected_at || log.entry_time || log.exit_time
    const date = new Date(eventTime)

    if (Number.isNaN(date.getTime())) {
      return
    }

    const label = monthLabels[date.getMonth()]

    if (!label) {
      return
    }

    if (log.detection_type === "exit") {
      buckets[label].exits += 1
      return
    }

    buckets[label].entries += 1
  })

  return Object.values(buckets)
}

function normalizeReportPaymentType(value) {
  return String(value || "").trim().toLowerCase()
}

function getPaymentEventAt(payment) {
  return payment?.paid_at || payment?.created_at || null
}

function isGuestRevenueType(type) {
  return ["guest_parking", "guest_parking_fee", "guest"].includes(
    normalizeReportPaymentType(type)
  )
}

function summarizeReportRevenue(payments = []) {
  let guest = 0
  let refund = 0

  payments.forEach((payment) => {
    if (!payment.guest_booking_id) {
      return
    }

    const type = normalizeReportPaymentType(payment.payment_type)
    const amount = Number(payment.amount || 0)

    if (
      payment.payment_status === "refunded" ||
      type === "refund"
    ) {
      refund += Math.abs(amount)
      return
    }

    if (payment.payment_status !== "paid") {
      return
    }

    if (isGuestRevenueType(type)) {
      guest += amount
    }
  })

  return {
    guest: Number(guest.toFixed(2)),
    refund: Number(refund.toFixed(2)),
    totalRevenue: Number(guest.toFixed(2)),
  }
}

function createRevenueTrendData(payments) {
  const buckets = {
    Mon: { label: "Mon", guest: 0, refund: 0 },
    Tue: { label: "Tue", guest: 0, refund: 0 },
    Wed: { label: "Wed", guest: 0, refund: 0 },
    Thu: { label: "Thu", guest: 0, refund: 0 },
    Fri: { label: "Fri", guest: 0, refund: 0 },
    Sat: { label: "Sat", guest: 0, refund: 0 },
    Sun: { label: "Sun", guest: 0, refund: 0 },
  }

  payments.forEach((payment) => {
    if (!payment.guest_booking_id) {
      return
    }

    const label = getDayLabel(getPaymentEventAt(payment))

    if (!label || !buckets[label]) {
      return
    }

    const type = normalizeReportPaymentType(payment.payment_type)
    const amount = Number(payment.amount || 0)

    if (
      payment.payment_status === "refunded" ||
      type === "refund"
    ) {
      buckets[label].refund += Math.abs(amount)
      return
    }

    if (payment.payment_status !== "paid") {
      return
    }

    if (isGuestRevenueType(type)) {
      buckets[label].guest += amount
    }
  })

  return Object.values(buckets).map((item) => ({
    ...item,
    guest: Number(item.guest.toFixed(2)),
    refund: Number(item.refund.toFixed(2)),
  }))
}

function createZoneOccupancyData(parkingBays) {
  const zoneMap = new Map()

  parkingBays.forEach((bay) => {
    const zoneName =
      bay.parking_zones?.zone_name ||
      bay.parking_zones?.zone_code ||
      "Unassigned"

    if (!zoneMap.has(zoneName)) {
      zoneMap.set(zoneName, {
        zone: zoneName,
        occupied: 0,
        available: 0,
      })
    }

    const zone = zoneMap.get(zoneName)

    if (bay.status === "available") {
      zone.available += 1
      return
    }

    zone.occupied += 1
  })

  return [...zoneMap.values()].sort((a, b) =>
    a.zone.localeCompare(b.zone)
  )
}

function createAnprDetectionData(anprLogs) {
  const buckets = {
    Mon: { label: "Mon", approved: 0, flagged: 0, unknown: 0 },
    Tue: { label: "Tue", approved: 0, flagged: 0, unknown: 0 },
    Wed: { label: "Wed", approved: 0, flagged: 0, unknown: 0 },
    Thu: { label: "Thu", approved: 0, flagged: 0, unknown: 0 },
    Fri: { label: "Fri", approved: 0, flagged: 0, unknown: 0 },
    Sat: { label: "Sat", approved: 0, flagged: 0, unknown: 0 },
    Sun: { label: "Sun", approved: 0, flagged: 0, unknown: 0 },
  }

  anprLogs.forEach((log) => {
    const label = getDayLabel(log.detected_at)

    if (!label || !buckets[label]) {
      return
    }

    if (log.access_status === "approved") {
      buckets[label].approved += 1
      return
    }

    if (log.access_status === "flagged") {
      buckets[label].flagged += 1
      return
    }

    buckets[label].unknown += 1
  })

  return Object.values(buckets)
}

function createStatusData(items, statusKey, statusLabels) {
  return statusLabels.map((item) => ({
    name: item.label,
    value: items.filter((row) => row[statusKey] === item.value).length,
  }))
}

function createBookingFlowData(guestBookings, reservations, anprLogs) {
  return [
    {
      label: "Created",
      guest: guestBookings.length,
      reservation: reservations.length,
    },
    {
      label: "Paid",
      guest: guestBookings.filter((item) => item.payment_status === "paid")
        .length,
      reservation: reservations.length,
    },
    {
      label: "Active",
      guest: guestBookings.filter((item) => item.anpr_access_status === "active")
        .length,
      reservation: reservations.filter((item) =>
        ["upcoming", "active"].includes(item.status)
      ).length,
    },
    {
      label: "Entered",
      guest: anprLogs.filter((item) => item.user_type === "guest").length,
      reservation: anprLogs.filter((item) =>
        ["student", "staff"].includes(item.user_type)
      ).length,
    },
  ]
}

function createLiveActivityData({
  guestBookings,
  payments,
  reservations,
  anprLogs,
  issues,
}) {
  const activities = []

  guestBookings.slice(0, 5).forEach((booking) => {
    activities.push({
      id: `guest-${booking.id}`,
      time: formatTimeAgo(booking.created_at),
      title: `Guest booking ${booking.booking_reference}`,
      description: `${booking.visitor_name} registered plate ${booking.plate_number}.`,
      type: "Guest",
      status:
        booking.booking_status === "expired"
          ? "Expired"
          : booking.payment_status === "paid"
            ? "Paid"
            : "Pending",
      timestamp: booking.created_at,
    })
  })

  payments.slice(0, 5).forEach((payment) => {
    activities.push({
      id: `payment-${payment.id}`,
      time: formatTimeAgo(payment.created_at),
      title: "Payment transaction recorded",
      description: `RM ${formatRM(payment.amount)} payment recorded.`,
      type: "Payment",
      status: payment.payment_status === "paid" ? "Paid" : "Pending",
      timestamp: payment.created_at,
    })
  })

  reservations.slice(0, 5).forEach((reservation) => {
    activities.push({
      id: `reservation-${reservation.id}`,
      time: formatTimeAgo(reservation.created_at),
      title: `Reservation ${reservation.reservation_reference}`,
      description: `${reservation.user_name} reserved bay for ${reservation.plate_number}.`,
      type: "Reservation",
      status:
        reservation.status === "upcoming"
          ? "Upcoming"
          : reservation.status === "active"
            ? "Active"
            : reservation.status === "completed"
              ? "Completed"
              : "Cancelled",
      timestamp: reservation.created_at,
    })
  })

  anprLogs.slice(0, 5).forEach((log) => {
    activities.push({
      id: `anpr-${log.id}`,
      time: formatTimeAgo(log.detected_at),
      title: `ANPR detected ${log.detected_plate_number || log.plate_number}`,
      description: log.reason || log.remarks || "ANPR detection recorded.",
      type: "ANPR",
      status:
        log.access_status === "approved"
          ? "Approved"
          : log.access_status === "flagged"
            ? "Flagged"
            : "Unknown",
      timestamp: log.detected_at,
    })
  })

  issues.slice(0, 5).forEach((issue) => {
    activities.push({
      id: `issue-${issue.id}`,
      time: formatTimeAgo(issue.created_at),
      title: issue.title,
      description: issue.description,
      type: "Issue",
      status:
        issue.status === "resolved"
          ? "Resolved"
          : issue.status === "in_progress"
            ? "In Progress"
            : "Open",
      timestamp: issue.created_at,
    })
  })

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)
}

function createLiveAlertsData({ anprLogs, issues, guestBookings }) {
  const alerts = []

  anprLogs
    .filter((log) => log.access_status !== "approved")
    .slice(0, 5)
    .forEach((log) => {
      alerts.push({
        id: `anpr-alert-${log.id}`,
        title: `ANPR ${log.access_status}`,
        description:
          log.reason ||
          `Plate ${log.detected_plate_number || log.plate_number} requires review.`,
        time: formatTimeAgo(log.detected_at),
        category: "ANPR",
        status: log.access_status === "flagged" ? "Flagged" : "Unknown",
        timestamp: log.detected_at,
      })
    })

  issues
    .filter((issue) => issue.status !== "resolved")
    .slice(0, 5)
    .forEach((issue) => {
      alerts.push({
        id: `issue-alert-${issue.id}`,
        title: issue.title,
        description: issue.latest_note || issue.description,
        time: formatTimeAgo(issue.created_at),
        category: "Issue",
        status:
          issue.priority === "critical"
            ? "Critical"
            : issue.priority === "high"
              ? "High"
              : "Open",
        timestamp: issue.created_at,
      })
    })

  guestBookings
    .filter((booking) => booking.booking_status === "expired")
    .slice(0, 5)
    .forEach((booking) => {
      alerts.push({
        id: `guest-alert-${booking.id}`,
        title: `Guest booking expired`,
        description: `${booking.booking_reference} expired for plate ${booking.plate_number}.`,
        time: formatTimeAgo(booking.expired_at || booking.updated_at),
        category: "Guest",
        status: "Expired",
        timestamp: booking.expired_at || booking.updated_at,
      })
    })

  return alerts
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)
}

// =====================================================
// CREATE LIVE PARKING FLOW DATA
// Source: anpr_logs
// Uses 5-minute buckets around the latest ANPR movement today.
// This prevents the live graph from showing only one ugly hour label.
// =====================================================

function createLiveParkingFlowData(anprLogs = []) {
  const { startIso, endIso } = getTodayIsoRange()

  const bucketSizeMinutes = 5
  const windowMinutes = 60

  // =====================================================
  // GET LOG EVENT TIME
  // =====================================================

  function getLogEventTime(log) {
    if (!log) {
      return null
    }

    if (log.detection_type === "exit") {
      return log.exit_time || log.detected_at || log.created_at
    }

    return log.entry_time || log.detected_at || log.created_at
  }

  // =====================================================
  // FLOOR DATE TO 5-MINUTE BUCKET
  // =====================================================

  function floorToBucket(date) {
    const bucketDate = new Date(date)
    const minutes = bucketDate.getMinutes()
    const flooredMinutes =
      Math.floor(minutes / bucketSizeMinutes) * bucketSizeMinutes

    bucketDate.setMinutes(flooredMinutes, 0, 0)

    return bucketDate
  }

  // =====================================================
  // FORMAT BUCKET LABEL
  // =====================================================

  function formatBucketLabel(date) {
    return date.toLocaleTimeString("en-MY", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // =====================================================
  // FILTER TODAY LOGS
  // =====================================================

  const todayLogs = anprLogs
    .map((log) => ({
      ...log,
      event_time: getLogEventTime(log),
    }))
    .filter((log) => isWithinHalfOpenRange(log.event_time, startIso, endIso))
    .sort((a, b) => new Date(a.event_time) - new Date(b.event_time))

  // =====================================================
  // USE LATEST TODAY LOG AS ANCHOR
  // If no logs exist, use current time.
  // =====================================================

  const latestLog = todayLogs[todayLogs.length - 1]
  const anchorDate = latestLog?.event_time
    ? new Date(latestLog.event_time)
    : new Date()

  const windowEnd = floorToBucket(anchorDate)
  const windowStart = new Date(
    windowEnd.getTime() - windowMinutes * 60 * 1000
  )

  // =====================================================
  // CREATE EMPTY 5-MINUTE BUCKETS
  // =====================================================

  const bucketMap = {}

  for (
    let cursor = new Date(windowStart);
    cursor <= windowEnd;
    cursor = new Date(cursor.getTime() + bucketSizeMinutes * 60 * 1000)
  ) {
    const key = cursor.toISOString()
    const label = formatBucketLabel(cursor)

    bucketMap[key] = {
      time: label,
      label,
      entries: 0,
      exits: 0,
      active: 0,
    }
  }

  // =====================================================
  // GET ACTIVE COUNT BEFORE WINDOW START
  // So active sessions do not reset to zero when graph window starts.
  // =====================================================

  let activeBeforeWindow = 0

  todayLogs.forEach((log) => {
    const eventTime = new Date(log.event_time)

    if (Number.isNaN(eventTime.getTime())) {
      return
    }

    if (eventTime >= windowStart) {
      return
    }

    if (log.detection_type === "exit") {
      activeBeforeWindow = Math.max(0, activeBeforeWindow - 1)
      return
    }

    activeBeforeWindow += 1
  })

  // =====================================================
  // FILL BUCKETS WITH ENTRY / EXIT COUNTS
  // =====================================================

  todayLogs.forEach((log) => {
    const eventTime = new Date(log.event_time)

    if (Number.isNaN(eventTime.getTime())) {
      return
    }

    if (eventTime < windowStart || eventTime > windowEnd) {
      return
    }

    const bucketKey = floorToBucket(eventTime).toISOString()
    const bucket = bucketMap[bucketKey]

    if (!bucket) {
      return
    }

    if (log.detection_type === "exit") {
      bucket.exits += 1
      return
    }

    bucket.entries += 1
  })

  // =====================================================
  // CALCULATE ACTIVE COUNT OVER TIME
  // =====================================================

  let active = activeBeforeWindow

  return Object.values(bucketMap).map((bucket) => {
    active = Math.max(0, active + bucket.entries - bucket.exits)

    return {
      ...bucket,
      active,
    }
  })
}

// =====================================================
// EMPTY REPORT DATA
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
  monthlySummary: null,
  compareSummary: null,
  monthlyTrafficData: [],
  monthlyRevenueData: [],
  monthlyComparisonChartData: [],
}

// =====================================================
// FETCH REPORT TABLES
// =====================================================

async function fetchReportTables() {
  // PARKUTEM_PHASE_06E_R1_REPORT_DATA_CORRECTNESS
  const REPORT_FETCH_BATCH_SIZE = 500

  async function fetchAllReportRows({
    table,
    selectClause = "*",
    orderColumn,
    ascending = false,
  }) {
    const allRows = []

    for (let from = 0; ; from += REPORT_FETCH_BATCH_SIZE) {
      const to = from + REPORT_FETCH_BATCH_SIZE - 1

      const { data, error } = await supabase
        .from(table)
        .select(selectClause)
        .order(orderColumn, { ascending })
        .range(from, to)

      if (error) {
        throw new Error(
          `Failed to fetch report data from ${table}: ${error.message}`
        )
      }

      const batch = data || []
      allRows.push(...batch)

      if (batch.length < REPORT_FETCH_BATCH_SIZE) {
        break
      }
    }

    return allRows
  }

  const [
    guestBookings,
    payments,
    reservations,
    anprLogs,
    parkingBays,
    vehicleRecords,
    universityUsers,
    issues,
  ] = await Promise.all([
    fetchAllReportRows({
      table: "guest_bookings",
      orderColumn: "created_at",
    }),

    fetchAllReportRows({
      table: "payment_transactions",
      selectClause: `
        id,
        guest_booking_id,
        reservation_id,
        parking_session_id,
        payment_type,
        amount,
        payment_method,
        payment_status,
        transaction_reference,
        payment_provider,
        provider_bill_id,
        provider_reference,
        provider_status,
        provider_reason,
        provider_updated_at,
        paid_at,
        created_at,
        updated_at
      `,
      orderColumn: "created_at",
    }),

    fetchAllReportRows({
      table: "reservations",
      orderColumn: "created_at",
    }),

    fetchAllReportRows({
      table: "anpr_logs",
      orderColumn: "detected_at",
    }),

    fetchAllReportRows({
      table: "parking_bays",
      selectClause: `
        *,
        parking_zones (
          zone_code,
          zone_name,
          location_name
        )
      `,
      orderColumn: "bay_code",
      ascending: true,
    }),

    fetchAllReportRows({
      table: "vehicle_records",
      orderColumn: "created_at",
    }),

    fetchAllReportRows({
      table: "university_users",
      orderColumn: "created_at",
    }),

    fetchAllReportRows({
      table: "support_issues",
      orderColumn: "created_at",
    }),
  ])

  return {
    guestBookings,
    payments,
    reservations,
    anprLogs,
    parkingBays,
    vehicleRecords,
    universityUsers,
    issues,
  }
}

// =====================================================
// BUILD REPORTS DATA
// =====================================================

function buildReportsData(rawData, filters) {
  const { startDate, endDate, selectedMonth, selectedYear, compareMonth, compareYear } =
    filters

  const { startIso, endIso } = getDateRangeIso(startDate, endDate)
  const monthRange = getMonthRangeIso(selectedMonth, selectedYear)
  const compareRange = getMonthRangeIso(compareMonth, compareYear)

  const guestPayments = rawData.payments.filter(
    (item) => Boolean(item.guest_booking_id)
  )

  const rangeGuestBookings = rawData.guestBookings.filter((item) =>
    isWithinRange(item.created_at, startIso, endIso)
  )

  const rangePayments = guestPayments.filter((item) =>
    isWithinRange(getPaymentEventAt(item), startIso, endIso)
  )

  const rangeReservations = rawData.reservations.filter((item) =>
    isWithinRange(item.created_at, startIso, endIso)
  )

  const rangeAnprLogs = rawData.anprLogs.filter((item) =>
    isWithinRange(item.detected_at, startIso, endIso)
  )

  const rangeIssues = rawData.issues.filter((item) =>
    isWithinRange(item.created_at, startIso, endIso)
  )

  const revenueSummary = summarizeReportRevenue(rangePayments)

  const totalRevenue = revenueSummary.totalRevenue

  const totalBays = rawData.parkingBays.length
  const unavailableBays = rawData.parkingBays.filter(
    (bay) => bay.status !== "available"
  ).length

  const averageOccupancy =
    totalBays > 0 ? `${Math.round((unavailableBays / totalBays) * 100)}%` : "0%"

  const approvedAnpr = rangeAnprLogs.filter(
    (log) => log.access_status === "approved"
  ).length

  const anprAccuracy =
    rangeAnprLogs.length > 0
      ? `${((approvedAnpr / rangeAnprLogs.length) * 100).toFixed(1)}%`
      : "0%"

  const analyticsSummary = {
    totalVehicles: rawData.vehicleRecords.length,
    averageOccupancy,
    totalRevenue: formatRM(totalRevenue),
    reservations: rangeReservations.length,
    guestBookings: rangeGuestBookings.length,
    anprAccuracy,
    flaggedDetections: rangeAnprLogs.filter(
      (log) => log.access_status === "flagged"
    ).length,
    activeIssues: rangeIssues.filter((issue) => issue.status !== "resolved")
      .length,
  }

  const revenueBreakdownReportData = [
    {
      name: "Guest Parking Fee",
      value: revenueSummary.guest,
    },
    {
      name: "Refund",
      value: revenueSummary.refund,
    },
  ]

  const monthlyGuestBookings = rawData.guestBookings.filter((item) =>
    isWithinHalfOpenRange(item.created_at, monthRange.startIso, monthRange.endIso)
  )

  const monthlyReservations = rawData.reservations.filter((item) =>
    isWithinHalfOpenRange(item.created_at, monthRange.startIso, monthRange.endIso)
  )

  const monthlyPayments = guestPayments.filter((item) =>
    isWithinHalfOpenRange(
      getPaymentEventAt(item),
      monthRange.startIso,
      monthRange.endIso
    )
  )

  const monthlyAnprLogs = rawData.anprLogs.filter((item) =>
    isWithinHalfOpenRange(item.detected_at, monthRange.startIso, monthRange.endIso)
  )

  const monthlyIssues = rawData.issues.filter((item) =>
    isWithinHalfOpenRange(item.created_at, monthRange.startIso, monthRange.endIso)
  )

  const compareGuestBookings = rawData.guestBookings.filter((item) =>
    isWithinHalfOpenRange(item.created_at, compareRange.startIso, compareRange.endIso)
  )

  const compareReservations = rawData.reservations.filter((item) =>
    isWithinHalfOpenRange(item.created_at, compareRange.startIso, compareRange.endIso)
  )

  const comparePayments = guestPayments.filter((item) =>
    isWithinHalfOpenRange(
      getPaymentEventAt(item),
      compareRange.startIso,
      compareRange.endIso
    )
  )

  const compareAnprLogs = rawData.anprLogs.filter((item) =>
    isWithinHalfOpenRange(item.detected_at, compareRange.startIso, compareRange.endIso)
  )

  function createMonthSummary({
    guestBookings,
    reservations,
    payments,
    anprLogs,
    issues,
  }) {
    const revenueSummary = summarizeReportRevenue(payments)

    const approved = anprLogs.filter(
      (item) => item.access_status === "approved"
    ).length

    return {
      totalVehicles: anprLogs.length,
      averageOccupancy,
      totalRevenue: revenueSummary.totalRevenue,
      reservations: reservations.length,
      guestBookings: guestBookings.length,
      anprAccuracy:
        anprLogs.length > 0
          ? `${((approved / anprLogs.length) * 100).toFixed(1)}%`
          : "0%",
      flaggedDetections: anprLogs.filter(
        (item) => item.access_status === "flagged"
      ).length,
      activeIssues: issues.filter((issue) => issue.status !== "resolved").length,
    }
  }

  const monthlySummary = createMonthSummary({
    guestBookings: monthlyGuestBookings,
    reservations: monthlyReservations,
    payments: monthlyPayments,
    anprLogs: monthlyAnprLogs,
    issues: monthlyIssues,
  })

  const compareSummary = createMonthSummary({
    guestBookings: compareGuestBookings,
    reservations: compareReservations,
    payments: comparePayments,
    anprLogs: compareAnprLogs,
    issues: rawData.issues.filter((issue) =>
      isWithinHalfOpenRange(issue.created_at, compareRange.startIso, compareRange.endIso)
    ),
  })

  const monthlyComparisonChartData = [
    {
      metric: "Vehicles",
      current: monthlySummary.totalVehicles,
      compare: compareSummary.totalVehicles,
    },
    {
      metric: "Revenue",
      current: monthlySummary.totalRevenue,
      compare: compareSummary.totalRevenue,
    },
    {
      metric: "Reservations",
      current: monthlySummary.reservations,
      compare: compareSummary.reservations,
    },
    {
      metric: "Guests",
      current: monthlySummary.guestBookings,
      compare: compareSummary.guestBookings,
    },
  ]

  return {
    analyticsSummary,
    trafficByDayData: createTrafficWeekData(rangeAnprLogs, rawData.parkingBays),
    trafficByMonthData: createTrafficMonthData(rawData.anprLogs),
    revenueTrendData: createRevenueTrendData(rangePayments),
    revenueBreakdownReportData,
    conversionData: createBookingFlowData(
      rangeGuestBookings,
      rangeReservations,
      rangeAnprLogs
    ),
    reservationStatusReportData: createStatusData(rangeReservations, "status", [
      { label: "Upcoming", value: "upcoming" },
      { label: "Active", value: "active" },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
    ]),
    guestStatusReportData: createStatusData(rangeGuestBookings, "booking_status", [
      { label: "Confirmed", value: "confirmed" },
      { label: "Expired", value: "expired" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Pending Payment", value: "pending_payment" },
    ]),
    anprDetectionData: createAnprDetectionData(rangeAnprLogs),
    zoneOccupancyReportData: createZoneOccupancyData(rawData.parkingBays),
    liveActivityData: createLiveActivityData({
      ...rawData,
      payments: guestPayments,
    }),
    liveAlertsData: createLiveAlertsData(rawData),
    liveParkingFlowData: createLiveParkingFlowData(rawData.anprLogs),
    monthlySummary,
    compareSummary,
    monthlyTrafficData: createTrafficWeekData(monthlyAnprLogs, rawData.parkingBays),
    monthlyRevenueData: createRevenueTrendData(monthlyPayments),
    monthlyComparisonChartData,
  }
}

// =====================================================
// LOAD ADMIN REPORTS DATA
// =====================================================

export async function loadAdminReportsData(filters) {
  const rawData = await fetchReportTables()

  return buildReportsData(rawData, filters)
}

// =====================================================
// SUBSCRIBE REPORT DATA CHANGES
// =====================================================

export function subscribeToReportsData(onChange) {
  const channel = supabase
    .channel("admin-reports-data")
    .on("postgres_changes", { event: "*", schema: "public", table: "guest_bookings" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "payment_transactions" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "anpr_logs" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "parking_bays" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_records" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "university_users" }, () => onChange?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "support_issues" }, () => onChange?.())
    .subscribe()

  return channel
}

export function unsubscribeFromReportsData(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}