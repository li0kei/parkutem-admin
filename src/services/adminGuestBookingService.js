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
// DERIVE ENTRY STATUS PLACEHOLDER
// Actual entry/exit status will come from ANPR logs later.
// =====================================================

function deriveEntryStatus(booking) {
  if (booking.booking_status === "expired") {
    return "Not Entered"
  }

  if (booking.booking_status === "cancelled") {
    return "Not Entered"
  }

  return "Not Entered"
}

// =====================================================
// GET BOOKING REMARKS
// =====================================================

function getGuestBookingRemarks(booking) {
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
// MAP GUEST BOOKING FOR EXISTING ADMIN UI
// =====================================================

export function mapGuestBookingForAdmin(booking) {
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
    entryStatus: deriveEntryStatus(booking),
    entryTime: "-",
    exitTime: "-",

    bookingStatus: mapBookingStatus(booking.booking_status),

    expiredReason: mapExpiredReason(booking.expired_reason),
    expiredAt: formatAdminDateTime(booking.expired_at),
    noShowCheckedAt: formatAdminDateTime(booking.no_show_checked_at),

    remarks: getGuestBookingRemarks(booking),

    raw: booking,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN GUEST BOOKINGS
// =====================================================

export async function loadAdminGuestBookings() {
  const bookings = await fetchGuestBookings()

  return bookings.map(mapGuestBookingForAdmin)
}

// =====================================================
// SUBSCRIBE TO GUEST BOOKING CHANGES
// =====================================================

export function subscribeToGuestBookings(onChange) {
  const channel = supabase
    .channel("admin-guest-bookings")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "guest_bookings",
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

export function unsubscribeFromGuestBookings(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}