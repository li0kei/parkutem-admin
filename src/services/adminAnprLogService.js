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

function mapAccessStatus(status) {
  if (status === "approved") {
    return "Approved"
  }

  if (status === "flagged") {
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
      detected_plate_number,
      normalized_plate_number,
      confidence_score,
      user_type,
      detection_type,
      zone_id,
      bay_id,
      matched_user_id,
      matched_vehicle_id,
      matched_guest_booking_id,
      matched_reservation_id,
      access_status,
      access_decision,
      reason,
      image_url,
      source_device,
      processing_mode,
      detected_at,
      created_at,
      updated_at,
      plate_number,
      owner_name,
      gate_location,
      parking_zone,
      confidence,
      payment_status,
      remarks,
      entry_time,
      exit_time,
      raw_payload,
      model_name,
      model_version,
      ocr_engine,
      ocr_raw_text,
      ocr_confidence,
      yolo_confidence,
      processing_time_ms,
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
// PROCESS ADMIN ANPR DETECTION
// =====================================================

export async function processAdminAnprDetection({
  plateNumber,
  detectionType,
  gateLocation = "Main Gate",
  sourceDevice = "admin_simulator",
  processingMode = "manual_test",
  confidenceScore = 99,
  duplicateWindowSeconds = 0,
}) {
  const cleanPlate = String(plateNumber || "").trim()

  if (!cleanPlate) {
    throw new Error("Please enter a plate number.")
  }

  const { data, error } = await supabase.rpc("process_anpr_detection", {
    p_plate_number: cleanPlate,
    p_detection_type: detectionType,
    p_gate_location: gateLocation,
    p_source_device: sourceDevice,
    p_processing_mode: processingMode,
    p_confidence_score: Number(confidenceScore || 0),
    p_raw_payload: {
      source: "admin_anpr_simulator_ui",
      submitted_at: new Date().toISOString(),
    },
    p_duplicate_window_seconds: duplicateWindowSeconds,
  })

  if (error) {
    console.error("Process ANPR detection error:", error)
    throw new Error(error.message || "Failed to process ANPR detection.")
  }

  if (!data?.success) {
    throw new Error(data?.error || "ANPR detection was not processed.")
  }

  return data
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

  const confidenceValue =
    log.confidence_score ?? log.confidence ?? log.yolo_confidence ?? 0

  return {
    id: log.id,

    plateNumber:
      log.plate_number ||
      log.detected_plate_number ||
      log.normalized_plate_number ||
      "-",

    normalizedPlateNumber: log.normalized_plate_number || "-",
    ownerName,
    userType,

    detectionType: log.detection_type || "-",

    entryTime: formatAdminDateTime(entryTime),
    exitTime: formatAdminDateTime(exitTime),
    duration: formatDuration(entryTime, exitTime),

    gateLocation: log.gate_location || "Main Gate",
    parkingZone: log.parking_zone || "-",

    confidence: Number(confidenceValue || 0),

    status: mapAccessStatus(log.access_status),
    accessDecision: log.access_decision || "denied",

    paymentStatus: mapPaymentStatus(log.payment_status, userType),

    remarks:
      log.reason ||
      log.remarks ||
      (guestBooking
        ? `Matched guest booking ${guestBooking.booking_reference}.`
        : "ANPR detection attempt recorded."),

    sourceDevice: log.source_device || "-",
    processingMode: log.processing_mode || "-",

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