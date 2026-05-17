// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// FORMAT DATE TIME
// =====================================================

export function formatAdminDateTime(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// =====================================================
// FORMAT DATE ONLY
// =====================================================

export function formatAdminDate(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// =====================================================
// FORMAT TIME ONLY
// =====================================================

export function formatAdminTime(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// =====================================================
// FORMAT DURATION
// =====================================================

export function formatDuration(durationHours) {
  const cleanDuration = Number(durationHours || 0)

  if (!cleanDuration) {
    return "-"
  }

  if (cleanDuration < 1) {
    return `${Math.round(cleanDuration * 60)} minutes`
  }

  if (!Number.isInteger(cleanDuration)) {
    const hours = Math.floor(cleanDuration)
    const minutes = Math.round((cleanDuration - hours) * 60)

    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
  }

  return `${cleanDuration} hour${cleanDuration > 1 ? "s" : ""}`
}

// =====================================================
// MAP STATUS TO ADMIN UI LABELS
// =====================================================

function mapPaymentStatus(status) {
  const statusMap = {
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
  }

  return statusMap[status] || "Pending"
}

function mapBookingStatus(status) {
  const statusMap = {
    pending_payment: "Pending Payment",
    confirmed: "Confirmed",
    expired: "Expired",
    cancelled: "Cancelled",
  }

  return statusMap[status] || "Pending Payment"
}

function mapAnprAccessStatus(status) {
  const statusMap = {
    active: "Enabled",
    inactive: "Not Enabled",
    expired: "Expired",
    blocked: "Blocked",
  }

  return statusMap[status] || "Not Enabled"
}

// =====================================================
// MAP EXPIRED REASON
// =====================================================

function mapExpiredReason(reason) {
  const reasonMap = {
    no_show: "No Show",
    time_ended: "Time Ended",
    cancelled: "Cancelled",
    system: "System Expired",
  }

  return reasonMap[reason] || "-"
}

// =====================================================
// GET LOG EVENT TIME
// =====================================================

function getLogEventTime(log) {
  if (!log) {
    return null
  }

  if (log.detection_type === "entry") {
    return log.entry_time || log.detected_at || log.created_at
  }

  if (log.detection_type === "exit") {
    return log.exit_time || log.detected_at || log.created_at
  }

  return log.detected_at || log.created_at
}

// =====================================================
// BUILD ANPR LOG MAP BY GUEST BOOKING
// =====================================================

function buildGuestAnprLogMap(anprLogs = []) {
  return anprLogs.reduce((map, log) => {
    const bookingId = log.matched_guest_booking_id

    if (!bookingId) {
      return map
    }

    if (!map[bookingId]) {
      map[bookingId] = {
        entryLog: null,
        exitLog: null,
      }
    }

    const currentLogTime = new Date(getLogEventTime(log) || 0).getTime()

    if (log.detection_type === "entry") {
      const currentEntryTime = new Date(
        getLogEventTime(map[bookingId].entryLog) || 0
      ).getTime()

      if (!map[bookingId].entryLog || currentLogTime > currentEntryTime) {
        map[bookingId].entryLog = log
      }
    }

    if (log.detection_type === "exit") {
      const currentExitTime = new Date(
        getLogEventTime(map[bookingId].exitLog) || 0
      ).getTime()

      if (!map[bookingId].exitLog || currentLogTime > currentExitTime) {
        map[bookingId].exitLog = log
      }
    }

    return map
  }, {})
}

// =====================================================
// CHECK GUEST OVERSTAY
// Overstay rule:
// Guest has entered, no exit detected, and current time is
// more than 1 hour after visit_end_at.
// =====================================================

function isGuestOverstay(booking, guestAnprLogMap = {}) {
  const logs = guestAnprLogMap[booking.id]

  if (!logs?.entryLog) {
    return false
  }

  if (logs?.exitLog) {
    return false
  }

  if (!booking.visit_end_at) {
    return false
  }

  const visitEndTime = new Date(booking.visit_end_at).getTime()
  const overstayThresholdTime = visitEndTime + 60 * 60 * 1000

  return Date.now() >= overstayThresholdTime
}

// =====================================================
// DERIVE GUEST ENTRY STATUS
// =====================================================

function deriveGuestEntryStatus(booking, guestAnprLogMap = {}) {
  const logs = guestAnprLogMap[booking.id]

  if (logs?.exitLog) {
    return "Exited"
  }

  if (isGuestOverstay(booking, guestAnprLogMap)) {
    return "Overstay"
  }

  if (logs?.entryLog) {
    return "Entered"
  }

  if (
    booking.booking_status === "expired" &&
    booking.expired_reason === "no_show"
  ) {
    return "No Show"
  }

  return "Not Entered"
}

// =====================================================
// GET GUEST ENTRY TIME
// =====================================================

function getGuestEntryTime(booking, guestAnprLogMap = {}) {
  const logs = guestAnprLogMap[booking.id]
  const entryTime = getLogEventTime(logs?.entryLog)

  return formatAdminDateTime(entryTime)
}

// =====================================================
// GET GUEST EXIT TIME
// =====================================================

function getGuestExitTime(booking, guestAnprLogMap = {}) {
  const logs = guestAnprLogMap[booking.id]
  const exitTime = getLogEventTime(logs?.exitLog)

  return formatAdminDateTime(exitTime)
}

// =====================================================
// GET BOOKING REMARKS
// =====================================================

function getGuestBookingRemarks(booking, guestAnprLogMap = {}) {
  const logs = guestAnprLogMap[booking.id]

  if (logs?.exitLog) {
    return "Guest vehicle has exited. ANPR exit record was detected."
  }

  if (isGuestOverstay(booking, guestAnprLogMap)) {
    return "Guest vehicle has entered but no exit record was detected more than 1 hour after the booked visit ended. Overstay email notification may be sent automatically."
  }

  if (logs?.entryLog) {
    return "Guest vehicle has entered through ANPR. No exit record detected yet."
  }

  if (booking.expired_reason === "no_show") {
    return "Guest did not enter within the 30-minute no-show grace period. Payment remains paid and non-refundable."
  }

  if (booking.expired_reason === "time_ended") {
    return "Guest booking has ended after the valid parking period."
  }

  if (booking.booking_status === "cancelled") {
    return "Guest booking was cancelled. ANPR access is not active."
  }

  if (booking.payment_status === "paid") {
    return "Guest paid successfully. Plate registered automatically for ANPR access."
  }

  return "Guest payment is not completed. ANPR access is not active."
}

// =====================================================
// FETCH GUEST BOOKINGS
// =====================================================

export async function fetchGuestBookings() {
  const { data, error } = await supabase
    .from("guest_bookings")
    .select(
      `
      id,
      booking_reference,
      visitor_name,
      email,
      phone_number,
      plate_number,
      normalized_plate_number,
      purpose,
      host_department,
      visit_start_at,
      visit_end_at,
      duration_hours,
      amount,
      payment_status,
      booking_status,
      anpr_access_status,
      approval_required,
      qr_required,
      paid_at,
      confirmed_at,
      expired_reason,
      expired_at,
      no_show_checked_at,
      created_at,
      parking_zones (
        zone_code,
        zone_name,
        location_name
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch guest bookings error:", error)
    throw new Error(error.message || "Failed to fetch guest bookings.")
  }

  return data || []
}

// =====================================================
// FETCH GUEST ANPR LOGS
// =====================================================

export async function fetchGuestAnprLogs() {
  const { data, error } = await supabase
    .from("anpr_logs")
    .select(
      `
      id,
      matched_guest_booking_id,
      detection_type,
      access_status,
      access_decision,
      reason,
      detected_at,
      entry_time,
      exit_time,
      created_at
      `
    )
    .not("matched_guest_booking_id", "is", null)
    .order("detected_at", { ascending: false })

  if (error) {
    console.error("Fetch guest ANPR logs error:", error)
    throw new Error(error.message || "Failed to fetch guest ANPR logs.")
  }

  return data || []
}

// =====================================================
// MAP GUEST BOOKING FOR EXISTING ADMIN UI
// =====================================================

export function mapGuestBookingForAdmin(booking, guestAnprLogMap = {}) {
  const zoneName = booking.parking_zones?.zone_name || "Zone A"
  const locationName = booking.parking_zones?.location_name || "-"

  return {
    id: booking.id,

    bookingId: booking.booking_reference,
    guestName: booking.visitor_name,
    email: booking.email,
    phone: booking.phone_number,
    vehiclePlate: booking.plate_number,
    visitPurpose: booking.purpose,
    hostDepartment: booking.host_department,

    // Guest is not assigned to a bay until ANPR / parking session phase.
    bayNumber: null,
    zone: zoneName,
    locationName,
    parkingAllocation: "Not assigned yet",

    bookingDate: formatAdminDate(booking.visit_start_at),
    startTime: formatAdminTime(booking.visit_start_at),
    endTime: formatAdminTime(booking.visit_end_at),
    duration: formatDuration(booking.duration_hours),

    parkingFee: Number(booking.amount || 0),
    paymentStatus: mapPaymentStatus(booking.payment_status),
    paymentMethod: "Simulated",
    receiptStatus: booking.payment_status === "paid" ? "Ready" : "Pending",

    anprAccess: mapAnprAccessStatus(booking.anpr_access_status),

    entryStatus: deriveGuestEntryStatus(booking, guestAnprLogMap),
    entryTime: getGuestEntryTime(booking, guestAnprLogMap),
    exitTime: getGuestExitTime(booking, guestAnprLogMap),

    bookingStatus: mapBookingStatus(booking.booking_status),

    expiredReason: mapExpiredReason(booking.expired_reason),
    expiredAt: formatAdminDateTime(booking.expired_at),
    noShowCheckedAt: formatAdminDateTime(booking.no_show_checked_at),

    remarks: getGuestBookingRemarks(booking, guestAnprLogMap),

    raw: booking,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN GUEST BOOKINGS
// =====================================================

export async function loadAdminGuestBookings() {
  const [bookings, anprLogs] = await Promise.all([
    fetchGuestBookings(),
    fetchGuestAnprLogs(),
  ])

  const guestAnprLogMap = buildGuestAnprLogMap(anprLogs)

  return bookings.map((booking) =>
    mapGuestBookingForAdmin(booking, guestAnprLogMap)
  )
}