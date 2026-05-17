// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// FORMATTERS
// =====================================================

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-MY")
}

function formatRM(value) {
  return `RM ${Number(value || 0).toFixed(2)}`
}

// =====================================================
// COUNT HELPER
// =====================================================

async function getCount(tableName, filters = []) {
  let query = supabase.from(tableName).select("id", {
    count: "exact",
    head: true,
  })

  filters.forEach((filter) => {
    const { column, operator, value } = filter

    if (operator === "eq") {
      query = query.eq(column, value)
    }

    if (operator === "gte") {
      query = query.gte(column, value)
    }

    if (operator === "lte") {
      query = query.lte(column, value)
    }

    if (operator === "lt") {
      query = query.lt(column, value)
    }

    if (operator === "in") {
      query = query.in(column, value)
    }

  })

  const { count, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return count || 0
}

// =====================================================
// GET TODAY START
// =====================================================

function getTodayStartIso() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today.toISOString()
}

// =====================================================
// NORMALIZE TEXT VALUE
// =====================================================

function normalizeText(value) {
  return String(value || "").trim().toLowerCase()
}

// =====================================================
// CHECK PAID STATUS
// =====================================================

function isPaidStatus(status) {
  const cleanStatus = normalizeText(status)

  return ["paid", "success", "completed"].includes(cleanStatus)
}

// =====================================================
// CHECK REFUND TRANSACTION
// =====================================================

function isRefundTransaction(payment) {
  const paymentType = normalizeText(payment.payment_type)
  const paymentStatus = normalizeText(payment.payment_status)

  return paymentType === "refund" || paymentStatus === "refunded"
}

// =====================================================
// CHECK TODAY DATE
// Uses browser local date.
// For your laptop/admin dashboard, this follows Malaysia time.
// =====================================================

function isTodayDate(value) {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(todayStart.getDate() + 1)

  return date >= todayStart && date < tomorrowStart
}

// =====================================================
// GET PAID PAYMENT TRANSACTION REVENUE TODAY
// Source: payment_transactions
// =====================================================

async function getTodayPaymentTransactionRevenue() {
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      `
      id,
      payment_type,
      amount,
      payment_status,
      paid_at,
      created_at
    `
    )

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).reduce((total, payment) => {
    const transactionDate = payment.paid_at || payment.created_at

    if (!isTodayDate(transactionDate)) {
      return total
    }

    if (!isPaidStatus(payment.payment_status)) {
      return total
    }

    if (isRefundTransaction(payment)) {
      return total
    }

    return total + Number(payment.amount || 0)
  }, 0)
}

// =====================================================
// CHECK IF RESERVATION FEES ALREADY EXIST IN TRANSACTIONS
// Prevents double counting later when app creates real payment rows.
// =====================================================

async function hasTodayReservationPaymentTransactions() {
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("id, payment_type, payment_status, paid_at, created_at")

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).some((payment) => {
    const paymentType = normalizeText(payment.payment_type)
    const transactionDate = payment.paid_at || payment.created_at

    const isReservationRelated =
      paymentType === "reservation_fee" ||
      paymentType === "reservation" ||
      paymentType === "parking_fee" ||
      paymentType === "after_7_parking_fee" ||
      paymentType === "after_7"

    return (
      isTodayDate(transactionDate) &&
      isPaidStatus(payment.payment_status) &&
      isReservationRelated
    )
  })
}

// =====================================================
// GET RESERVATION REVENUE TODAY
// Temporary fallback source: reservations table
// Used because current manual reservations are not inserted into
// payment_transactions yet.
// =====================================================

async function getTodayReservationRevenueFallback() {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_fee,
      after_7_parking_fee,
      status,
      reservation_start_at,
      created_at
    `
    )

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).reduce((total, reservation) => {
    if (reservation.status === "cancelled") {
      return total
    }

    const reservationDate =
      reservation.reservation_start_at || reservation.created_at

    if (!isTodayDate(reservationDate)) {
      return total
    }

    const reservationFee = Number(reservation.reservation_fee || 0)
    const after7Fee = Number(reservation.after_7_parking_fee || 0)

    return total + reservationFee + after7Fee
  }, 0)
}

// =====================================================
// GET TODAY REVENUE
// Source of truth:
// 1. payment_transactions for real paid transactions
// 2. reservations fallback only while reservation fees are not yet
//    inserted into payment_transactions
// =====================================================

async function getTodayRevenue() {
  const paymentRevenue = await getTodayPaymentTransactionRevenue()
  const hasReservationTransactions = await hasTodayReservationPaymentTransactions()

  if (hasReservationTransactions) {
    return paymentRevenue
  }

  const reservationRevenue = await getTodayReservationRevenueFallback()

  return paymentRevenue + reservationRevenue
}

// =====================================================
// REFRESH DASHBOARD MAINTENANCE STATUSES
// Runs lightweight backend status updates before dashboard aggregation.
// =====================================================

async function refreshDashboardMaintenanceStatuses() {
  const maintenanceJobs = [
    supabase.rpc("expire_guest_bookings"),
    supabase.rpc("update_reservation_statuses"),
  ]

  const results = await Promise.allSettled(maintenanceJobs)

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Dashboard maintenance warning:", result.reason)
    }

    if (result.status === "fulfilled" && result.value?.error) {
      console.warn("Dashboard maintenance warning:", result.value.error.message)
    }
  })
}

  // =====================================================
  // GET PENDING ISSUES COUNT
  // Source: support_issues.status
  // Counts Open / In Progress / Pending issues without probing missing columns.
  // =====================================================

  async function getPendingIssuesCount() {
    const activeIssueStatuses = [
      "open",
      "in_progress",
      "in progress",
      "pending",
      "Open",
      "In Progress",
      "Pending",
    ]

    const { data, error } = await supabase
      .from("support_issues")
      .select("id, status")

    if (error) {
      console.warn("Pending issues count warning:", error.message)
      return 0
    }

    return (data || []).filter((issue) => {
      const cleanStatus = normalizeText(issue.status)

      return activeIssueStatuses
        .map((status) => normalizeText(status))
        .includes(cleanStatus)
    }).length
  }

// =====================================================
// LOAD DASHBOARD STATS
// =====================================================

export async function loadAdminDashboardStats() {
  await refreshDashboardMaintenanceStatuses()

  const [
    totalBays,
    availableBays,
    occupiedBays,
    reservedBays,
    paidGuestBookings,
    anprLogs,
    todayRevenue,
    pendingIssues,
  ] = await Promise.all([
    getCount("parking_bays"),
    getCount("parking_bays", [
      { column: "status", operator: "eq", value: "available" },
    ]),
    getCount("parking_bays", [
      { column: "status", operator: "eq", value: "occupied" },
    ]),
    getCount("parking_bays", [
      { column: "status", operator: "eq", value: "reserved" },
    ]),
    getCount("guest_bookings", [
      { column: "payment_status", operator: "eq", value: "paid" },
    ]),
    getCount("anpr_logs"),
    getTodayRevenue(),
    getPendingIssuesCount(),
  ])

  return [
    {
      label: "Total Parking Bays",
      value: formatNumber(totalBays),
      helper: "Across Zone A-D",
      icon: "parking",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "Available Bays",
      value: formatNumber(availableBays),
      helper: "Ready for parking",
      icon: "car",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Occupied Bays",
      value: formatNumber(occupiedBays),
      helper: "Currently occupied",
      icon: "activity",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Reserved Bays",
      value: formatNumber(reservedBays),
      helper: "Active bay reservations",
      icon: "calendar",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Guest Bookings",
      value: formatNumber(paidGuestBookings),
      helper: "Paid guest access",
      icon: "scan",
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "ANPR Logs",
      value: formatNumber(anprLogs),
      helper: "Detection attempts",
      icon: "users",
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "Revenue Today",
      value: formatRM(todayRevenue),
      helper: "Paid transactions today",
      icon: "money",
      color: "bg-teal-50 text-teal-600",
    },
    {
      label: "Pending Issues",
      value: formatNumber(pendingIssues),
      helper: "Open / in progress reports",
      icon: "alert",
      color: "bg-red-50 text-red-600",
    },
  ]
}

// =====================================================
// SUBSCRIBE DASHBOARD CHANGES
// =====================================================

export function subscribeToDashboardChanges(onChange) {
  const watchedTables = [
    "guest_bookings",
    "payment_transactions",
    "parking_zones",
    "parking_bays",
    "anpr_logs",
    "reservations",
    "support_issues",
    "vehicle_records",
    "university_users",
  ]

  let channel = supabase.channel("admin-dashboard-overview")

  watchedTables.forEach((table) => {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      () => {
        onChange?.()
      }
    )
  })

  channel.subscribe()

  return channel
}

// =====================================================
// PAYMENT TYPE LABEL MAPPER
// =====================================================

function mapRevenuePaymentType(type) {
  const cleanType = normalizeText(type)

  const typeMap = {
    reservation_fee: "Reservation Fee",
    reservation: "Reservation Fee",

    parking_fee: "After 7PM Parking Fee",
    after_7_parking_fee: "After 7PM Parking Fee",
    after_7: "After 7PM Parking Fee",

    guest_parking: "Guest Parking Fee",
    guest_parking_fee: "Guest Parking Fee",
    guest: "Guest Parking Fee",

    wallet_topup: "Wallet Top Up",
    wallet_top_up: "Wallet Top Up",
    topup: "Wallet Top Up",

    refund: "Refund",
  }

  return typeMap[cleanType] || "Other"
}

// =====================================================
// CHECK IF RESERVATION PAYMENT ROW EXISTS
// Prevents double counting when reservation fees are later inserted
// into payment_transactions properly.
// =====================================================

function isReservationPaymentType(type) {
  const cleanType = normalizeText(type)

  return [
    "reservation_fee",
    "reservation",
    "parking_fee",
    "after_7_parking_fee",
    "after_7",
  ].includes(cleanType)
}

// =====================================================
// LOAD PAYMENT TRANSACTION BREAKDOWN
// Source: payment_transactions
// =====================================================

async function loadPaymentTransactionBreakdownTotals() {
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      `
      payment_type,
      amount,
      payment_status,
      paid_at,
      created_at
    `
    )

  if (error) {
    console.error("Load payment transaction breakdown error:", error)
    throw new Error(error.message || "Failed to load payment breakdown.")
  }

  const totals = {
    "Guest Parking Fee": 0,
    "Reservation Fee": 0,
    "After 7PM Parking Fee": 0,
    "Wallet Top Up": 0,
    Refund: 0,
    Other: 0,
  }

  let hasReservationPaymentTransactions = false

  ;(data || []).forEach((payment) => {
    const transactionDate = payment.paid_at || payment.created_at

    if (!isTodayDate(transactionDate)) {
      return
    }

    const amount = Number(payment.amount || 0)
    const typeLabel = mapRevenuePaymentType(payment.payment_type)

    if (isReservationPaymentType(payment.payment_type)) {
      hasReservationPaymentTransactions = true
    }

    if (isRefundTransaction(payment)) {
      totals.Refund += Math.abs(amount)
      return
    }

    if (!isPaidStatus(payment.payment_status)) {
      return
    }

    totals[typeLabel] = (totals[typeLabel] || 0) + amount
  })

  return {
    totals,
    hasReservationPaymentTransactions,
  }
}

// =====================================================
// ADD RESERVATION FALLBACK BREAKDOWN
// Source: reservations table
// Used while reservation fee / after 7PM fee are not yet inserted
// into payment_transactions.
// =====================================================

async function addReservationFallbackBreakdownTotals(totals) {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      reservation_fee,
      after_7_parking_fee,
      status,
      reservation_start_at,
      created_at
    `
    )

  if (error) {
    console.error("Load reservation breakdown fallback error:", error)
    throw new Error(
      error.message || "Failed to load reservation revenue fallback."
    )
  }

  ;(data || []).forEach((reservation) => {
    if (reservation.status === "cancelled") {
      return
    }

    const reservationDate =
      reservation.reservation_start_at || reservation.created_at

    if (!isTodayDate(reservationDate)) {
      return
    }

    totals["Reservation Fee"] += Number(reservation.reservation_fee || 0)
    totals["After 7PM Parking Fee"] += Number(
      reservation.after_7_parking_fee || 0
    )
  })

  return totals
}

// =====================================================
// LOAD REVENUE BREAKDOWN
// =====================================================

export async function loadRevenueBreakdownData() {
  const { totals, hasReservationPaymentTransactions } =
    await loadPaymentTransactionBreakdownTotals()

  if (!hasReservationPaymentTransactions) {
    await addReservationFallbackBreakdownTotals(totals)
  }

  return Object.entries(totals)
    .filter(([, value]) => Number(value || 0) > 0)
    .map(([name, value]) => ({
      name,
      value,
    }))
}

// =====================================================
// UNSUBSCRIBE DASHBOARD CHANGES
// =====================================================

export function unsubscribeFromDashboardChanges(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}

// =====================================================
// FORMAT TIME AGO
// =====================================================

function formatTimeAgo(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

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
// PAYMENT TYPE ACTIVITY LABEL
// =====================================================

function mapActivityPaymentType(type) {
  const typeMap = {
    guest_parking: "Guest parking payment",
    reservation_fee: "Reservation fee",
    parking_fee: "Parking fee",
    wallet_topup: "Wallet top-up",
    refund: "Refund",
  }

  return typeMap[type] || "Payment"
}

// =====================================================
// BUILD GUEST BOOKING ACTIVITY
// =====================================================

function buildGuestBookingActivity(booking) {
  const timestamp =
    booking.expired_at || booking.confirmed_at || booking.created_at

  if (booking.booking_status === "expired") {
    return {
      title: `Guest booking expired for ${booking.plate_number}`,
      description:
        booking.expired_reason === "no_show"
          ? `${booking.visitor_name}'s booking expired due to no-show. Payment remains paid and non-refundable.`
          : `${booking.visitor_name}'s guest booking has expired.`,
      time: formatTimeAgo(timestamp),
      status: "Expired",
      timestamp,
    }
  }

  if (booking.booking_status === "confirmed") {
    return {
      title: `Guest booking confirmed for ${booking.plate_number}`,
      description: `${booking.visitor_name}'s plate is active for ANPR guest access.`,
      time: formatTimeAgo(timestamp),
      status: "Confirmed",
      timestamp,
    }
  }

  return {
    title: `Guest booking created for ${booking.plate_number}`,
    description: `${booking.visitor_name} submitted a guest parking booking.`,
    time: formatTimeAgo(timestamp),
    status: "Pending",
    timestamp,
  }
}

// =====================================================
// BUILD PAYMENT ACTIVITY
// =====================================================

function buildPaymentActivity(payment) {
  const guestBooking = payment.guest_bookings
  const timestamp = payment.paid_at || payment.created_at
  const paymentType = mapActivityPaymentType(payment.payment_type)
  const amount = Number(payment.amount || 0).toFixed(2)

  return {
    title: `${paymentType} recorded`,
    description: guestBooking
      ? `${guestBooking.visitor_name} paid RM ${amount} for booking ${guestBooking.booking_reference}.`
      : `RM ${amount} transaction recorded in ParkUTeM.`,
    time: formatTimeAgo(timestamp),
    status: payment.payment_status === "paid" ? "Paid" : "Pending",
    timestamp,
  }
}

// =====================================================
// LOAD RECENT DASHBOARD ACTIVITIES
// =====================================================

export async function loadRecentDashboardActivities() {
  const [guestBookingsResult, paymentsResult] = await Promise.all([
    supabase
      .from("guest_bookings")
      .select(
        `
        id,
        booking_reference,
        visitor_name,
        plate_number,
        payment_status,
        booking_status,
        anpr_access_status,
        expired_reason,
        expired_at,
        confirmed_at,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(8),

    supabase
      .from("payment_transactions")
      .select(
        `
        id,
        transaction_reference,
        payment_type,
        amount,
        payment_method,
        payment_status,
        paid_at,
        created_at,
        guest_bookings (
          booking_reference,
          visitor_name,
          plate_number
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  if (guestBookingsResult.error) {
    throw new Error(guestBookingsResult.error.message)
  }

  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message)
  }

  const bookingActivities = (guestBookingsResult.data || []).map(
    buildGuestBookingActivity
  )

  const paymentActivities = (paymentsResult.data || []).map(
    buildPaymentActivity
  )

  return [...bookingActivities, ...paymentActivities]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)
}

// =====================================================
// LOAD BAY AVAILABILITY BY ZONE
// Source: parking_bays + parking_zones
// Note: This is database bay status, not IoT sensor live occupancy yet.
// =====================================================

export async function loadBayAvailabilityByZoneData() {
  const { data, error } = await supabase
    .from("parking_bays")
    .select(
      `
      id,
      status,
      parking_zones (
        zone_code,
        zone_name,
        location_name
      )
    `
    )

  if (error) {
    console.error("Load bay availability by zone error:", error)
    throw new Error(error.message || "Failed to load bay availability by zone.")
  }

  const zoneMap = {
    "Zone A": {
      zone: "Zone A",
      available: 0,
      unavailable: 0,
      total: 0,
    },
    "Zone B": {
      zone: "Zone B",
      available: 0,
      unavailable: 0,
      total: 0,
    },
    "Zone C": {
      zone: "Zone C",
      available: 0,
      unavailable: 0,
      total: 0,
    },
    "Zone D": {
      zone: "Zone D",
      available: 0,
      unavailable: 0,
      total: 0,
    },
  }

  ;(data || []).forEach((bay) => {
    const zoneName = bay.parking_zones?.zone_name || "Unassigned"

    if (!zoneMap[zoneName]) {
      return
    }

    zoneMap[zoneName].total += 1

    if (bay.status === "available") {
      zoneMap[zoneName].available += 1
      return
    }

    zoneMap[zoneName].unavailable += 1
  })

  return Object.values(zoneMap)
}

// =====================================================
// GET CURRENT WEEK RANGE
// Monday to Sunday
// =====================================================

function getCurrentWeekRange() {
  const today = new Date()
  const dayIndex = today.getDay()
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  return {
    startIso: weekStart.toISOString(),
    endIso: weekEnd.toISOString(),
  }
}

// =====================================================
// LOAD RESERVATION TREND DATA
// Source: reservations table
// =====================================================

export async function loadReservationTrendData() {
  const { startIso, endIso } = getCurrentWeekRange()

  const { data, error } = await supabase
    .from("reservations")
    .select("id, reservation_start_at")
    .gte("reservation_start_at", startIso)
    .lt("reservation_start_at", endIso)

  if (error) {
    console.error("Load reservation trend error:", error)
    throw new Error(error.message || "Failed to load reservation trend.")
  }

  const trendMap = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  ;(data || []).forEach((reservation) => {
    const date = new Date(reservation.reservation_start_at)

    if (Number.isNaN(date.getTime())) {
      return
    }

    const dayLabel = dayLabels[date.getDay()]

    if (trendMap[dayLabel] !== undefined) {
      trendMap[dayLabel] += 1
    }
  })

  return Object.entries(trendMap).map(([day, reservations]) => ({
    day,
    reservations,
  }))
}

// =====================================================
// PARKING USAGE HOUR BUCKETS
// 7AM to 9PM dashboard view
// =====================================================

function createParkingUsageBuckets() {
  return [
    { hour: "7AM", entries: 0, exits: 0, hour24: 7 },
    { hour: "8AM", entries: 0, exits: 0, hour24: 8 },
    { hour: "9AM", entries: 0, exits: 0, hour24: 9 },
    { hour: "10AM", entries: 0, exits: 0, hour24: 10 },
    { hour: "11AM", entries: 0, exits: 0, hour24: 11 },
    { hour: "12PM", entries: 0, exits: 0, hour24: 12 },
    { hour: "1PM", entries: 0, exits: 0, hour24: 13 },
    { hour: "2PM", entries: 0, exits: 0, hour24: 14 },
    { hour: "3PM", entries: 0, exits: 0, hour24: 15 },
    { hour: "4PM", entries: 0, exits: 0, hour24: 16 },
    { hour: "5PM", entries: 0, exits: 0, hour24: 17 },
    { hour: "6PM", entries: 0, exits: 0, hour24: 18 },
    { hour: "7PM", entries: 0, exits: 0, hour24: 19 },
    { hour: "8PM", entries: 0, exits: 0, hour24: 20 },
    { hour: "9PM", entries: 0, exits: 0, hour24: 21 },
  ]
}

// =====================================================
// GET TODAY RANGE
// =====================================================

function getTodayRangeIso() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

// =====================================================
// LOAD PARKING USAGE BY HOUR
// Source: anpr_logs table
// =====================================================

export async function loadParkingUsageByHourData() {
  const { startIso, endIso } = getTodayRangeIso()

  const { data, error } = await supabase
    .from("anpr_logs")
    .select(
      `
      id,
      detection_type,
      entry_time,
      exit_time,
      detected_at
    `
    )
    .gte("detected_at", startIso)
    .lt("detected_at", endIso)

  if (error) {
    console.error("Load parking usage by hour error:", error)
    throw new Error(error.message || "Failed to load parking usage by hour.")
  }

  const buckets = createParkingUsageBuckets()
  const bucketMap = buckets.reduce((map, bucket) => {
    map[bucket.hour24] = bucket
    return map
  }, {})

  ;(data || []).forEach((log) => {
    const detectionType = log.detection_type || "entry"

    const eventTime =
      detectionType === "exit"
        ? log.exit_time || log.detected_at
        : log.entry_time || log.detected_at

    const date = new Date(eventTime)

    if (Number.isNaN(date.getTime())) {
      return
    }

    const hour = date.getHours()
    const bucket = bucketMap[hour]

    if (!bucket) {
      return
    }

    if (detectionType === "exit") {
      bucket.exits += 1
      return
    }

    bucket.entries += 1
  })

  return buckets.map(({ hour, entries, exits }) => ({
    hour,
    entries,
    exits,
  }))
}