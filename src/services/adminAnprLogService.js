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
// PARKUTEM_ADMIN_PHASE_07_R1_SESSION_HELPERS
// =====================================================

function getAnprEventTime(log) {
  if (!log) return null

  return (
    (log.detection_type === "exit"
      ? log.exit_time || log.detected_at
      : log.entry_time || log.detected_at) ||
    log.created_at ||
    null
  )
}

function getAnprSessionKey(log) {
  return (
    log.matched_guest_booking_id ||
    log.matched_reservation_id ||
    log.matched_vehicle_id ||
    log.matched_user_id ||
    log.normalized_plate_number ||
    log.detected_plate_number ||
    log.plate_number ||
    log.id
  )
}

function buildEntryLookup(logs = []) {
  const byKey = new Map()

  const ascending = [...logs].sort(
    (a, b) =>
      new Date(getAnprEventTime(a) || 0).getTime() -
      new Date(getAnprEventTime(b) || 0).getTime()
  )

  for (const log of ascending) {
    const key = getAnprSessionKey(log)
    const type = String(log.detection_type || "").toLowerCase()
    const decision = String(log.access_decision || "").toLowerCase()

    if (type === "entry" && decision === "allowed") {
      byKey.set(key, getAnprEventTime(log))
      continue
    }

    if (type === "exit" && decision === "allowed") {
      log.__paired_entry_time = byKey.get(key) || null
      byKey.delete(key)
    }
  }

  return logs
}

function resolveProductionProcessingMode(log) {
  const requested = String(
    log.raw_payload?.requested_processing_mode || ""
  ).trim()

  const apiMode = String(log.raw_payload?.api_mode || "").trim()
  const source = String(log.source_device || "").trim().toLowerCase()

  if (
    requested === "tapo_rtsp_bridge_v1" ||
    source.startsWith("tapo_c211_")
  ) {
    return "Tapo RTSP + YOLO/PaddleOCR"
  }

  if (apiMode.includes("production_anpr")) {
    return "Production ANPR"
  }

  if (log.processing_mode === "phone_realtime") {
    return "Phone Realtime"
  }

  return log.processing_mode || requested || "-"
}

// =====================================================
// FETCH ANPR LOGS
// =====================================================

export async function fetchAnprLogs() {
  // PARKUTEM_ADMIN_PHASE_07_R1_ANPR_BATCHING
  const batchSize = 500
  const allLogs = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

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
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch ANPR logs error:", error)
      throw new Error(error.message || "Failed to fetch ANPR logs.")
    }

    const rows = data || []
    allLogs.push(...rows)

    if (rows.length < batchSize) {
      break
    }
  }

  return allLogs
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

  const entryTime =
    log.detection_type === "exit"
      ? log.__paired_entry_time || null
      : log.entry_time || log.detected_at
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
    processingMode: resolveProductionProcessingMode(log),

    raw: log,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN ANPR LOGS
// =====================================================

export async function loadAdminAnprLogs() {
  const logs = buildEntryLookup(await fetchAnprLogs())

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