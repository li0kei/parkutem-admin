// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// FORMATTERS
// =====================================================

function formatAdminDate(value) {
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

function formatAdminTime(value) {
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

function formatDuration(startValue, endValue) {
  const start = new Date(startValue)
  const end = new Date(endValue)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-"
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 60000)
  )

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours <= 0) {
    return `${minutes} minutes`
  }

  if (minutes <= 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`
  }

  return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
}

// =====================================================
// STATUS MAPPERS
// =====================================================

function mapUserType(type) {
  const typeMap = {
    student: "Student",
    staff: "Staff",
  }

  return typeMap[type] || "Student"
}

function mapStatus(status) {
  const statusMap = {
    upcoming: "Upcoming",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  }

  return statusMap[status] || "Upcoming"
}

function mapStatusToDatabase(status) {
  const statusMap = {
    Upcoming: "upcoming",
    Active: "active",
    Completed: "completed",
    Cancelled: "cancelled",
  }

  return statusMap[status] || "upcoming"
}

// =====================================================
// FETCH RESERVATIONS
// =====================================================

export async function fetchReservations() {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_reference,
      university_user_id,
      vehicle_record_id,
      bay_id,
      university_id,
      user_name,
      user_type,
      plate_number,
      normalized_plate_number,
      reservation_start_at,
      reservation_end_at,
      reservation_fee,
      after_7_parking_fee,
      payment_method,
      status,
      remarks,
      created_at,
      updated_at,
      parking_bays (
        bay_code,
        parking_zones (
          zone_name,
          zone_code,
          location_name
        )
      )
    `
    )
    .order("reservation_start_at", { ascending: false })

  if (error) {
    console.error("Fetch reservations error:", error)
    throw new Error(error.message || "Failed to fetch reservations.")
  }

  return data || []
}

// =====================================================
// MAP RESERVATION FOR ADMIN UI
// =====================================================

export function mapReservationForAdmin(reservation) {
  const bay = reservation.parking_bays
  const zone = bay?.parking_zones

  const startAt = reservation.reservation_start_at
  const endAt = reservation.reservation_end_at
  const after7Fee = Number(reservation.after_7_parking_fee || 0)

  return {
    id: reservation.id,

    reservationId: reservation.reservation_reference,
    userName: reservation.user_name,
    universityId: reservation.university_id,
    userType: mapUserType(reservation.user_type),

    vehiclePlate: reservation.plate_number,

    bayNumber: bay?.bay_code || "-",
    zone: zone?.zone_name || "-",

    date: formatAdminDate(startAt),
    startTime: formatAdminTime(startAt),
    endTime: formatAdminTime(endAt),
    duration: formatDuration(startAt, endAt),

    reservationFee: Number(reservation.reservation_fee || 0),
    after7ParkingFee: after7Fee,

    parkingFeeRule:
      after7Fee > 0
        ? "After 7PM parking fee applied"
        : "No after-7PM parking fee recorded",

    paymentMethod: reservation.payment_method || "wallet",
    status: mapStatus(reservation.status),

    remarks: reservation.remarks || "-",

    raw: reservation,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN RESERVATIONS
// =====================================================

export async function loadAdminReservations() {
  await refreshReservationStatuses()

  const reservations = await fetchReservations()

  return reservations.map(mapReservationForAdmin)
}

// =====================================================
// UPDATE RESERVATION STATUS
// =====================================================

export async function updateReservationStatus(reservationId, newStatus) {
  const dbStatus = mapStatusToDatabase(newStatus)

  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: dbStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .select(
      `
      id,
      reservation_reference,
      university_user_id,
      vehicle_record_id,
      bay_id,
      university_id,
      user_name,
      user_type,
      plate_number,
      normalized_plate_number,
      reservation_start_at,
      reservation_end_at,
      reservation_fee,
      after_7_parking_fee,
      payment_method,
      status,
      remarks,
      created_at,
      updated_at,
      parking_bays (
        bay_code,
        parking_zones (
          zone_name,
          zone_code,
          location_name
        )
      )
    `
    )
    .single()

  if (error) {
    console.error("Update reservation status error:", error)
    throw new Error(error.message || "Failed to update reservation status.")
  }

  if (data?.bay_id) {
    const shouldReleaseBay =
      newStatus === "Completed" || newStatus === "Cancelled"

    await supabase
      .from("parking_bays")
      .update({
        status: shouldReleaseBay ? "available" : "reserved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.bay_id)
  }

  return mapReservationForAdmin(data)
}

// =====================================================
// SUBSCRIBE TO RESERVATION CHANGES
// =====================================================

export function subscribeToReservations(onChange) {
  const channel = supabase
    .channel("admin-reservations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservations",
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

export function unsubscribeFromReservations(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}

// =====================================================
// REFRESH RESERVATION STATUSES
// Temporary admin-side maintenance trigger.
// Proper backend scheduling should still use Supabase Cron.
// =====================================================

export async function refreshReservationStatuses() {
  const { data, error } = await supabase.rpc("update_reservation_statuses")

  if (error) {
    console.warn("Refresh reservation statuses warning:", error.message)
    return null
  }

  return data?.[0] || null
}