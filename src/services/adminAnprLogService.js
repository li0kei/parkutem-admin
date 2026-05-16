// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// FORMAT DATE TIME
// =====================================================

function formatAdminDateTime(value) {
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
// FORMAT DURATION
// =====================================================

function formatDuration(entryTime, exitTime) {
  if (!entryTime || !exitTime) {
    return "Active"
  }

  const entry = new Date(entryTime)
  const exit = new Date(exitTime)

  if (Number.isNaN(entry.getTime()) || Number.isNaN(exit.getTime())) {
    return "-"
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((exit.getTime() - entry.getTime()) / 60000)
  )

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours <= 0) {
    return `${minutes}m`
  }

  return `${hours}h ${minutes}m`
}

// =====================================================
// NORMALIZE UI STATUS
// =====================================================

function mapAccessStatus(status, decision) {
  if (status === "approved" || decision === "allowed") {
    return "Approved"
  }

  if (status === "flagged" || decision === "review") {
    return "Flagged"
  }

  return "Unknown"
}

// =====================================================
// NORMALIZE USER TYPE
// =====================================================

function mapUserType(type) {
  const typeMap = {
    student: "Student",
    staff: "Staff",
    guest: "Guest",
    unknown: "Unknown",
  }

  return typeMap[type] || "Unknown"
}

// =====================================================
// NORMALIZE PAYMENT STATUS
// =====================================================

function mapPaymentStatus(status, userType) {
  if (userType === "Student" || userType === "Staff") {
    return status === "charged" ? "Charged" : "Free"
  }

  if (userType === "Guest") {
    return status === "paid" ? "Paid" : "Pending"
  }

  return "Pending"
}

// =====================================================
// FETCH ANPR LOGS
// =====================================================

export async function fetchAnprLogs() {
  const { data, error } = await supabase
    .from("anpr_logs")
    .select(
      `
      id,
      plate_number,
      normalized_plate_number,
      owner_name,
      user_type,
      detection_type,
      gate_location,
      parking_zone,
      confidence,
      access_status,
      access_decision,
      payment_status,
      remarks,
      entry_time,
      exit_time,
      detected_at,
      matched_guest_booking_id,
      guest_bookings (
        booking_reference,
        visitor_name,
        payment_status,
        booking_status,
        anpr_access_status
      )
    `
    )
    .order("detected_at", { ascending: false })

  if (error) {
    console.error("Fetch ANPR logs error:", error)
    throw new Error(error.message || "Failed to fetch ANPR logs.")
  }

  return data || []
}

// =====================================================
// MAP ANPR LOG FOR ADMIN UI
// =====================================================

export function mapAnprLogForAdmin(log) {
  const userType = mapUserType(log.user_type)
  const guestBooking = log.guest_bookings

  const ownerName =
    log.owner_name ||
    guestBooking?.visitor_name ||
    (userType === "Unknown" ? "-" : "Matched User")

  const entryTime = log.entry_time || log.detected_at
  const exitTime = log.exit_time

  return {
    id: log.id,

    plateNumber: log.plate_number || log.normalized_plate_number || "-",
    ownerName,
    userType,

    entryTime: formatAdminDateTime(entryTime),
    exitTime: formatAdminDateTime(exitTime),
    duration: formatDuration(entryTime, exitTime),

    gateLocation: log.gate_location || "Main Gate",
    parkingZone: log.parking_zone || "-",

    confidence: Number(log.confidence || 0),

    status: mapAccessStatus(log.access_status, log.access_decision),

    paymentStatus: mapPaymentStatus(log.payment_status, userType),

    remarks:
      log.remarks ||
      (guestBooking
        ? `Matched guest booking ${guestBooking.booking_reference}.`
        : "ANPR detection attempt recorded."),

    raw: log,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN ANPR LOGS
// =====================================================

export async function loadAdminAnprLogs() {
  const logs = await fetchAnprLogs()

  return logs.map(mapAnprLogForAdmin)
}

// =====================================================
// SUBSCRIBE TO ANPR LOG CHANGES
// =====================================================

export function subscribeToAnprLogs(onChange) {
  const channel = supabase
    .channel("admin-anpr-logs")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "anpr_logs",
      },
      () => {
        onChange?.()
      }
    )
    .subscribe()

  return channel
}

// =====================================================
// REMOVE SUBSCRIPTION
// =====================================================

export function unsubscribeFromAnprLogs(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}