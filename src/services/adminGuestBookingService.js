// PARKUTEM_PHASE_06D_R1_FIX1_POSTGREST_FK_HINT
// Explicit FK: guest_bookings_bay_id_fkey
// PARKUTEM_PHASE_06D_R1_GUEST_BAY_DISPLAY
// Historical guest bay assignment from guest_bookings.bay_id
// PARKUTEM_PHASE_06C_R1_SOURCE_LOCKED
// Billplz/provider-managed guest payment integrity
// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// CONSTANTS
// =====================================================

const GUEST_EMAIL_FUNCTION_NAME = "send-guest-booking-email"
const GUEST_CANCELLATION_EMAIL_FUNCTION_NAME =
  "send-guest-cancellation-email"

const GUEST_HOURLY_RATE = 1
const DEFAULT_ZONE_CODE = "A"

const GUEST_BOOKING_SELECT = `
  id,
  booking_reference,
  lookup_token,
  visitor_name,
  email,
  phone_number,
  plate_number,
  normalized_plate_number,
  purpose,
  host_department,
  zone_id,
  bay_id,
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
  updated_at,
  parking_zones (
    zone_code,
    zone_name,
    location_name
  ),
  assigned_bay:parking_bays!guest_bookings_bay_id_fkey (
    id,
    bay_code
  )
`

// =====================================================
// BASIC HELPERS
// =====================================================

function cleanText(value) {
  return String(value || "").trim()
}

function normalizeStatusText(value) {
  return cleanText(value).toLowerCase().replaceAll(" ", "_")
}

function nowIso() {
  return new Date().toISOString()
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return fallback
  }

  return number
}

function getBrowserCrypto() {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto
  }

  if (typeof crypto !== "undefined") {
    return crypto
  }

  return null
}

function getRandomHex(length = 6) {
  const values = new Uint8Array(Math.ceil(length / 2))
  const browserCrypto = getBrowserCrypto()

  if (browserCrypto?.getRandomValues) {
    browserCrypto.getRandomValues(values)
  } else {
    values.forEach((_, index) => {
      values[index] = Math.floor(Math.random() * 255)
    })
  }

  return Array.from(values)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length)
    .toUpperCase()
}

export function normalizePlateNumber(plateNumber = "") {
  return cleanText(plateNumber).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

export function generateGuestBookingReference() {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const randomCode = getRandomHex(6)

  return `PKT-${year}${month}${day}-${randomCode}`
}

export function generateGuestLookupToken() {
  const browserCrypto = getBrowserCrypto()

  if (browserCrypto?.randomUUID) {
    return browserCrypto.randomUUID()
  }

  return `${Date.now()}-${getRandomHex(18)}`
}

// =====================================================
// ERROR HELPER
// =====================================================

function buildFriendlySupabaseError(error, fallbackMessage) {
  const message = error?.message || fallbackMessage || "Supabase request failed."
  const code = error?.code || ""

  if (
    code === "42501" ||
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("permission denied")
  ) {
    return new Error(
      "Permission denied by Supabase RLS. Please check admin insert/update policy for this table."
    )
  }

  if (code === "23505" || message.toLowerCase().includes("duplicate")) {
    return new Error(
      "Duplicate record detected. Please check booking reference, plate number, or transaction reference."
    )
  }

  if (code === "23503") {
    return new Error(
      "This action is blocked by a related database record. Payment, ANPR, or guest booking relation may still exist."
    )
  }

  if (code === "23502") {
    return new Error(
      "A required database field is missing. Please check all required guest booking fields."
    )
  }

  if (code === "23514") {
    return new Error(
      "This status value is not allowed by the current database constraint."
    )
  }

  if (code === "22P02") {
    return new Error(
      "Invalid database value format. Please check date, amount, status, or ID value."
    )
  }

  if (code === "PGRST204") {
    return new Error(
      "Database column mismatch. The admin code is trying to use a column that does not exist in Supabase."
    )
  }

  return new Error(message)
}

function isConstraintError(error) {
  const message = String(error?.message || "").toLowerCase()

  return (
    error?.code === "23514" ||
    message.includes("check constraint") ||
    message.includes("violates")
  )
}

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
// DATE / AMOUNT HELPERS
// =====================================================

export function buildVisitStartDateTime(visitDate, visitTime) {
  if (!visitDate || !visitTime) {
    throw new Error("Visit date and visit time are required.")
  }

  return new Date(`${visitDate}T${visitTime}:00`).toISOString()
}

export function calculateDurationHours(startAt, endAt) {
  if (!startAt || !endAt) {
    return 0
  }

  const start = new Date(startAt)
  const end = new Date(endAt)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  const diffMs = end.getTime() - start.getTime()

  if (diffMs <= 0) {
    return 0
  }

  return diffMs / (60 * 60 * 1000)
}

export function calculateGuestBookingAmount(durationHours) {
  const cleanDuration = safeNumber(durationHours, 0)

  if (cleanDuration <= 0) {
    return 0
  }

  return Number((cleanDuration * GUEST_HOURLY_RATE).toFixed(2))
}

function addHoursToIso(startAt, durationHours) {
  const start = new Date(startAt)

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid visit start date/time.")
  }

  start.setMinutes(start.getMinutes() + safeNumber(durationHours, 0) * 60)

  return start.toISOString()
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

function mapPaymentStatusToDb(status) {
  const cleanStatus = normalizeStatusText(status)

  const statusMap = {
    paid: "paid",
    pending: "pending",
    failed: "failed",
    refunded: "refunded",
  }

  return statusMap[cleanStatus] || "pending"
}

function mapBookingStatusToDb(status) {
  const cleanStatus = normalizeStatusText(status)

  const statusMap = {
    pending_payment: "pending_payment",
    pending: "pending_payment",
    confirmed: "confirmed",
    expired: "expired",
    cancelled: "cancelled",
  }

  return statusMap[cleanStatus] || "pending_payment"
}

function mapAnprAccessStatusToDb(status) {
  const cleanStatus = normalizeStatusText(status)

  const statusMap = {
    enabled: "active",
    active: "active",
    not_enabled: "inactive",
    inactive: "inactive",
    expired: "expired",
    blocked: "blocked",
  }

  return statusMap[cleanStatus] || "inactive"
}

function isConfirmedPaidActive({ paymentStatus, bookingStatus, anprAccessStatus }) {
  return (
    paymentStatus === "paid" &&
    bookingStatus === "confirmed" &&
    anprAccessStatus === "active"
  )
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
// BUILD PAYMENT MAP BY GUEST BOOKING
// =====================================================

function buildGuestPaymentMap(payments = []) {
  return payments.reduce((map, payment) => {
    const bookingId = payment.guest_booking_id

    if (!bookingId) {
      return map
    }

    if (!map[bookingId]) {
      map[bookingId] = payment
      return map
    }

    const currentTime = new Date(payment.paid_at || payment.created_at || 0)
    const existingTime = new Date(
      map[bookingId].paid_at || map[bookingId].created_at || 0
    )

    if (currentTime > existingTime) {
      map[bookingId] = payment
    }

    return map
  }, {})
}

// =====================================================
// CHECK GUEST OVERSTAY
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
// NORMALIZE ADMIN FORM PAYLOAD
// =====================================================

function normalizeAdminBookingPayload(formData = {}) {
  const visitorName = cleanText(
    formData.visitorName || formData.guestName || formData.visitor_name
  )

  const email = cleanText(formData.email || formData.guestEmail)
  const phoneNumber = cleanText(
    formData.phoneNumber || formData.phone || formData.phone_number
  )

  const plateNumber = cleanText(
    formData.plateNumber || formData.vehiclePlate || formData.plate_number
  ).toUpperCase()

  const normalizedPlateNumber =
    normalizePlateNumber(
      formData.normalizedPlateNumber ||
        formData.normalized_plate_number ||
        plateNumber
    ) || plateNumber

  const purpose = cleanText(formData.purpose || formData.visitPurpose)
  const hostDepartment = cleanText(
    formData.hostDepartment || formData.hostDept || formData.host_department
  )

  let visitStartAt =
    formData.visitStartAt ||
    formData.bookingStartAt ||
    formData.visit_start_at ||
    formData.parking_start_at ||
    null

  if (!visitStartAt && formData.visitDate && formData.visitTime) {
    visitStartAt = buildVisitStartDateTime(formData.visitDate, formData.visitTime)
  }

  if (visitStartAt) {
    visitStartAt = new Date(visitStartAt).toISOString()
  }

  let durationHours = safeNumber(
    formData.durationHours || formData.duration_hours,
    0
  )

  let visitEndAt =
    formData.visitEndAt ||
    formData.bookingEndAt ||
    formData.visit_end_at ||
    formData.parking_end_at ||
    null

  if (visitEndAt) {
    visitEndAt = new Date(visitEndAt).toISOString()
  }

  if (!durationHours && visitStartAt && visitEndAt) {
    durationHours = calculateDurationHours(visitStartAt, visitEndAt)
  }

  if (!visitEndAt && visitStartAt && durationHours) {
    visitEndAt = addHoursToIso(visitStartAt, durationHours)
  }

  if (!durationHours && visitStartAt && visitEndAt) {
    durationHours = calculateDurationHours(visitStartAt, visitEndAt)
  }

  const amount = safeNumber(
    formData.amount || formData.parkingFee || formData.totalAmount,
    calculateGuestBookingAmount(durationHours)
  )

  const paymentStatus = mapPaymentStatusToDb(
    formData.paymentStatus || formData.payment_status || "pending"
  )

  const bookingStatus = mapBookingStatusToDb(
    formData.bookingStatus || formData.booking_status || "pending_payment"
  )

  const anprAccessStatus = mapAnprAccessStatusToDb(
    formData.anprAccess ||
      formData.anprAccessStatus ||
      formData.anpr_access_status ||
      "inactive"
  )

  const zoneCode =
    cleanText(formData.zoneCode || formData.zone_code) || DEFAULT_ZONE_CODE

  const remarks = cleanText(formData.remarks || formData.adminNote || formData.note)

  return {
    visitorName,
    email,
    phoneNumber,
    plateNumber,
    normalizedPlateNumber,
    purpose,
    hostDepartment,
    visitStartAt,
    visitEndAt,
    durationHours,
    amount,
    paymentStatus,
    bookingStatus,
    anprAccessStatus,
    zoneCode,
    remarks,
  }
}

// =====================================================
// VALIDATE ADMIN BOOKING PAYLOAD
// =====================================================

function validateAdminBookingPayload(payload) {
  if (!payload.visitorName) {
    throw new Error("Guest name is required.")
  }

  if (!payload.email) {
    throw new Error("Guest email is required.")
  }

  if (!payload.phoneNumber) {
    throw new Error("Guest phone number is required.")
  }

  if (!payload.plateNumber) {
    throw new Error("Vehicle plate number is required.")
  }

  if (!payload.normalizedPlateNumber) {
    throw new Error("Normalized plate number is required.")
  }

  if (!payload.visitStartAt) {
    throw new Error("Booking start datetime is required.")
  }

  if (!payload.visitEndAt) {
    throw new Error("Booking end datetime is required.")
  }

  if (!payload.durationHours || payload.durationHours <= 0) {
    throw new Error("Booking duration must be more than 0 hour.")
  }

  if (payload.amount < 0) {
    throw new Error("Parking fee cannot be negative.")
  }
}

// =====================================================
// FETCH GUEST BOOKINGS
// =====================================================

export async function fetchGuestBookings() {
  // PARKUTEM_PHASE_06F_R1_GUEST_SCALABILITY
  const batchSize = 500
  const allBookings = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

    const { data, error } = await supabase
      .from("guest_bookings")
      .select(GUEST_BOOKING_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch guest bookings error:", error)
      throw buildFriendlySupabaseError(
        error,
        "Failed to fetch guest bookings."
      )
    }

    const batch = data || []
    allBookings.push(...batch)

    if (batch.length < batchSize) {
      break
    }
  }

  
  const unresolvedBayIds = [
    ...new Set(
      allBookings
        .filter((booking) => booking.bay_id && !booking.assigned_bay?.bay_code)
        .map((booking) => booking.bay_id)
    ),
  ]

  const bayCodeById = new Map()

  for (let index = 0; index < unresolvedBayIds.length; index += 100) {
    const ids = unresolvedBayIds.slice(index, index + 100)

    const { data: bays, error: bayError } = await supabase
      .from("parking_bays")
      .select("id, bay_code")
      .in("id", ids)

    if (bayError) {
      console.warn("Guest bay fallback lookup warning:", bayError.message)
      break
    }

    ;(bays || []).forEach((bay) => {
      bayCodeById.set(bay.id, bay.bay_code)
    })
  }

  return allBookings.map((booking) => ({
    ...booking,
    __bay_code_fallback: bayCodeById.get(booking.bay_id) || null,
  }))
}

// =====================================================
// FETCH ONE GUEST BOOKING BY ID
// =====================================================

export async function fetchGuestBookingById(bookingId) {
  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const { data, error } = await supabase
    .from("guest_bookings")
    .select(GUEST_BOOKING_SELECT)
    .eq("id", bookingId)
    .maybeSingle()

  if (error) {
    console.error("Fetch guest booking by ID error:", error)
    throw buildFriendlySupabaseError(
      error,
      "Failed to fetch guest booking details."
    )
  }

  return data
}

// =====================================================
// FETCH GUEST PAYMENT TRANSACTIONS
// =====================================================

export async function fetchGuestPaymentTransactions() {
  const batchSize = 500
  const allPayments = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

    const { data, error } = await supabase
      .from("payment_transactions")
      .select(
        `
        id,
        guest_booking_id,
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
        `
      )
      .not("guest_booking_id", "is", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch guest payment transactions error:", error)
      throw buildFriendlySupabaseError(
        error,
        "Failed to fetch guest payment transactions."
      )
    }

    const batch = data || []
    allPayments.push(...batch)

    if (batch.length < batchSize) {
      break
    }
  }

  return allPayments
}

// =====================================================
// FETCH GUEST ANPR LOGS
// =====================================================

export async function fetchGuestAnprLogs() {
  const batchSize = 500
  const allLogs = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

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
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch guest ANPR logs error:", error)
      throw buildFriendlySupabaseError(
        error,
        "Failed to fetch guest ANPR logs."
      )
    }

    const batch = data || []
    allLogs.push(...batch)

    if (batch.length < batchSize) {
      break
    }
  }

  return allLogs
}

// =====================================================
// MAP GUEST BOOKING FOR EXISTING ADMIN UI
// =====================================================

// PARKUTEM_ADMIN_PHASE_07_R1_GUEST_BAY_FALLBACK
export function mapGuestBookingForAdmin(
  booking,
  guestAnprLogMap = {},
  guestPaymentMap = {}
) {
  const paymentTransaction = guestPaymentMap[booking.id] || null

  const zoneName = booking.parking_zones?.zone_name || "Zone A"
  const locationName = booking.parking_zones?.location_name || "-"
  const bayNumber =
    booking.assigned_bay?.bay_code ||
    booking.__bay_code_fallback ||
    null

  const paymentProvider = cleanText(
    paymentTransaction?.payment_provider
  ).toLowerCase()

  const providerManaged = Boolean(paymentProvider)

  const paymentStatus = providerManaged
    ? paymentTransaction?.payment_status || booking.payment_status
    : booking.payment_status || paymentTransaction?.payment_status

  return {
    id: booking.id,

    bookingId: booking.booking_reference,
    lookupToken: booking.lookup_token,

    guestName: booking.visitor_name,
    email: booking.email,
    phone: booking.phone_number,
    vehiclePlate: booking.plate_number,
    normalizedPlateNumber: booking.normalized_plate_number,
    visitPurpose: booking.purpose,
    hostDepartment: booking.host_department,

    bayNumber,
    zone: zoneName,
    locationName,
    parkingAllocation: bayNumber
      ? `${bayNumber} â€¢ ${zoneName}`
      : booking.bay_id
        ? "Assigned bay unavailable"
        : "Not assigned yet",

    bookingDate: formatAdminDate(booking.visit_start_at),
    startTime: formatAdminTime(booking.visit_start_at),
    endTime: formatAdminTime(booking.visit_end_at),
    duration: formatDuration(booking.duration_hours),

    parkingFee: Number(booking.amount || 0),
    paymentStatus: mapPaymentStatus(paymentStatus),
    paymentMethod: paymentTransaction?.payment_method || "-",
    paymentReference: paymentTransaction?.transaction_reference || "-",

    paymentProvider:
      paymentProvider === "billplz"
        ? "Billplz"
        : paymentProvider || "-",

    providerManaged,
    providerBillId: paymentTransaction?.provider_bill_id || "-",
    providerReference: paymentTransaction?.provider_reference || "-",
    providerStatus: paymentTransaction?.provider_status || "-",
    providerReason: paymentTransaction?.provider_reason || "-",
    providerUpdatedAt: formatAdminDateTime(
      paymentTransaction?.provider_updated_at
    ),

    receiptStatus: paymentStatus === "paid" ? "Ready" : "Pending",

    anprAccess: mapAnprAccessStatus(booking.anpr_access_status),

    entryStatus: deriveGuestEntryStatus(booking, guestAnprLogMap),
    entryTime: getGuestEntryTime(booking, guestAnprLogMap),
    exitTime: getGuestExitTime(booking, guestAnprLogMap),

    bookingStatus: mapBookingStatus(booking.booking_status),

    expiredReason: mapExpiredReason(booking.expired_reason),
    expiredAt: formatAdminDateTime(booking.expired_at),
    noShowCheckedAt: formatAdminDateTime(booking.no_show_checked_at),

    paidAt: formatAdminDateTime(booking.paid_at),
    confirmedAt: formatAdminDateTime(booking.confirmed_at),

    remarks: getGuestBookingRemarks(booking, guestAnprLogMap),

    raw: booking,
    paymentTransaction,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN GUEST BOOKINGS
// =====================================================

export async function loadAdminGuestBookings() {
  const [bookings, anprLogs, payments] = await Promise.all([
    fetchGuestBookings(),
    fetchGuestAnprLogs(),
    fetchGuestPaymentTransactions(),
  ])

  const guestAnprLogMap = buildGuestAnprLogMap(anprLogs)
  const guestPaymentMap = buildGuestPaymentMap(payments)

  return bookings.map((booking) =>
    mapGuestBookingForAdmin(booking, guestAnprLogMap, guestPaymentMap)
  )
}

// =====================================================
// SEND / RESEND CONFIRMATION EMAIL
// =====================================================

export async function sendGuestBookingConfirmationEmail({
  bookingReference,
  lookupToken,
}) {
  if (!bookingReference || !lookupToken) {
    throw new Error(
      "Booking reference and lookup token are required before sending confirmation email."
    )
  }

  const { data, error } = await supabase.functions.invoke(
    GUEST_EMAIL_FUNCTION_NAME,
    {
      body: {
        bookingReference,
        lookupToken,
      },
    }
  )

  if (error) {
    console.error("Guest booking email error:", error)

    throw new Error(
      error.message ||
        "Failed to send guest booking confirmation email through Edge Function."
    )
  }

  if (data?.success === false) {
    throw new Error(data.error || "Guest booking confirmation email failed.")
  }

  return data
}

export async function resendGuestBookingConfirmationEmail(bookingInput) {
  const rawBooking = bookingInput?.raw || bookingInput || {}

  const bookingReference =
    rawBooking.booking_reference ||
    bookingInput?.bookingId ||
    bookingInput?.bookingReference

  const lookupToken =
    rawBooking.lookup_token || bookingInput?.lookupToken || bookingInput?.lookup_token

  return sendGuestBookingConfirmationEmail({
    bookingReference,
    lookupToken,
  })
}

// =====================================================
// SEND CANCELLATION EMAIL
// =====================================================

export async function sendGuestBookingCancellationEmail({
  bookingReference,
  lookupToken,
  cancellationMessage,
}) {
  if (!bookingReference || !lookupToken) {
    throw new Error(
      "Booking reference and lookup token are required before sending cancellation email."
    )
  }

  const { data, error } = await supabase.functions.invoke(
    GUEST_CANCELLATION_EMAIL_FUNCTION_NAME,
    {
      body: {
        bookingReference,
        lookupToken,
        cancellationMessage:
          cleanText(cancellationMessage) ||
          "Your booking has been cancelled by the parking administrator.",
      },
    }
  )

  if (error) {
    console.error("Guest booking cancellation email error:", error)

    throw new Error(
      error.message ||
        "Failed to send guest booking cancellation email through Edge Function."
    )
  }

  if (data?.success === false) {
    throw new Error(data.error || "Guest booking cancellation email failed.")
  }

  return data
}

// =====================================================
// CREATE PAYMENT TRANSACTION REFERENCE
// =====================================================

function generateGuestPaymentReference() {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `GPT-${year}${month}${day}-${getRandomHex(6)}`
}

// =====================================================
// FIND EXISTING GUEST PAYMENT TRANSACTION
// =====================================================

async function findGuestPaymentTransaction(guestBookingId) {
  if (!guestBookingId) {
    return null
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      `
      id,
      guest_booking_id,
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
      `
    )
    .eq("guest_booking_id", guestBookingId)
    .in("payment_type", ["guest_parking", "guest_parking_fee", "guest"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw buildFriendlySupabaseError(
      error,
      "Failed to check guest payment transaction."
    )
  }

  return data
}

// =====================================================
// SYNC GUEST PAYMENT TRANSACTION
// =====================================================

export async function syncGuestPaymentTransaction(booking, paymentStatusValue) {
  if (!booking?.id) {
    throw new Error("Guest booking is required before syncing payment.")
  }

  const paymentStatus = mapPaymentStatusToDb(
    paymentStatusValue || booking.payment_status || "pending"
  )

  const existingTransaction = await findGuestPaymentTransaction(booking.id)

  if (existingTransaction?.payment_provider) {
    if (paymentStatus !== existingTransaction.payment_status) {
      throw new Error(
        "Provider-managed payment transaction is read-only. Payment status must come from the verified payment provider callback."
      )
    }

    return existingTransaction
  }

  const transactionPayload = {
    guest_booking_id: booking.id,
    payment_type: "guest_parking",
    amount: Number(booking.amount || 0),
    payment_method: existingTransaction?.payment_method || "simulated",
    payment_status: paymentStatus,
    transaction_reference:
      existingTransaction?.transaction_reference || generateGuestPaymentReference(),
    updated_at: nowIso(),
  }

  if (paymentStatus === "paid") {
    transactionPayload.paid_at = existingTransaction?.paid_at || nowIso()
  }

  if (!existingTransaction) {
    transactionPayload.created_at = nowIso()

    const { data, error } = await supabase
      .from("payment_transactions")
      .insert(transactionPayload)
      .select()
      .single()

    if (error) {
      console.error("Create guest payment transaction error:", error)
      throw buildFriendlySupabaseError(
        error,
        "Failed to create guest payment transaction."
      )
    }

    return data
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .update(transactionPayload)
    .eq("id", existingTransaction.id)
    .select()
    .single()

  if (error) {
    console.error("Update guest payment transaction error:", error)
    throw buildFriendlySupabaseError(
      error,
      "Failed to update guest payment transaction."
    )
  }

  return data
}

// =====================================================
// CREATE CONFIRMED GUEST BOOKING THROUGH EXISTING RPC
// =====================================================

async function createConfirmedGuestBookingThroughRpc(payload) {
  const { data, error } = await supabase.rpc("create_confirmed_guest_booking", {
    p_visitor_name: payload.visitorName,
    p_email: payload.email,
    p_phone_number: payload.phoneNumber,
    p_plate_number: payload.plateNumber,
    p_purpose: payload.purpose,
    p_host_department: payload.hostDepartment,
    p_visit_start_at: payload.visitStartAt,
    p_duration_hours: payload.durationHours,
    p_amount: payload.amount,
    p_zone_code: payload.zoneCode || DEFAULT_ZONE_CODE,
  })

  if (error) {
    console.error("Create confirmed guest booking RPC error:", error)
    throw buildFriendlySupabaseError(
      error,
      "Failed to create confirmed guest booking."
    )
  }

  const booking = Array.isArray(data) ? data[0] : data

  if (!booking) {
    throw new Error("No guest booking was returned from Supabase RPC.")
  }

  const bookingId = booking.id
  const bookingReference = booking.booking_reference || booking.bookingReference

  if (bookingId) {
    const latestBooking = await fetchGuestBookingById(bookingId)

    if (latestBooking) {
      return latestBooking
    }
  }

  if (bookingReference) {
    const { data: latestBooking, error: fetchError } = await supabase
      .from("guest_bookings")
      .select(GUEST_BOOKING_SELECT)
      .eq("booking_reference", bookingReference)
      .maybeSingle()

    if (fetchError) {
      throw buildFriendlySupabaseError(
        fetchError,
        "Guest booking was created but failed to reload."
      )
    }

    if (latestBooking) {
      return latestBooking
    }
  }

  return booking
}

// =====================================================
// CREATE GUEST BOOKING DIRECTLY
// =====================================================

async function createGuestBookingDirectly(payload) {
  const bookingReference = generateGuestBookingReference()
  const lookupToken = generateGuestLookupToken()

  const insertPayload = {
    booking_reference: bookingReference,
    lookup_token: lookupToken,
    visitor_name: payload.visitorName,
    email: payload.email,
    phone_number: payload.phoneNumber,
    plate_number: payload.plateNumber,
    normalized_plate_number: payload.normalizedPlateNumber,
    purpose: payload.purpose,
    host_department: payload.hostDepartment,
    visit_start_at: payload.visitStartAt,
    visit_end_at: payload.visitEndAt,
    duration_hours: payload.durationHours,
    amount: payload.amount,
    payment_status: payload.paymentStatus,
    booking_status: payload.bookingStatus,
    anpr_access_status: payload.anprAccessStatus,
    approval_required: false,
    qr_required: false,
    paid_at: payload.paymentStatus === "paid" ? nowIso() : null,
    confirmed_at: payload.bookingStatus === "confirmed" ? nowIso() : null,
    expired_reason:
      payload.bookingStatus === "cancelled"
        ? "cancelled"
        : payload.bookingStatus === "expired"
          ? "system"
          : null,
    expired_at:
      payload.bookingStatus === "cancelled" || payload.bookingStatus === "expired"
        ? nowIso()
        : null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  const { data, error } = await supabase
    .from("guest_bookings")
    .insert(insertPayload)
    .select(GUEST_BOOKING_SELECT)
    .single()

  if (error) {
    console.error("Create guest booking error:", error)
    throw buildFriendlySupabaseError(error, "Failed to create guest booking.")
  }

  return data
}

// =====================================================
// CREATE ADMIN GUEST BOOKING
// =====================================================

export async function createAdminGuestBooking(formData, options = {}) {
  const { sendConfirmationEmail = true } = options

  const payload = normalizeAdminBookingPayload(formData)
  validateAdminBookingPayload(payload)

  let paymentWarning = ""
  let emailResult = null
  let emailWarning = ""

  const shouldUseConfirmedRpc = isConfirmedPaidActive({
    paymentStatus: payload.paymentStatus,
    bookingStatus: payload.bookingStatus,
    anprAccessStatus: payload.anprAccessStatus,
  })

  const booking = shouldUseConfirmedRpc
    ? await createConfirmedGuestBookingThroughRpc(payload)
    : await createGuestBookingDirectly(payload)

  try {
    if (payload.paymentStatus === "paid") {
      await syncGuestPaymentTransaction(booking, payload.paymentStatus)
    }
  } catch (error) {
    paymentWarning =
      error.message ||
      "Guest booking was saved, but payment transaction could not be synced."
  }

  if (
    sendConfirmationEmail &&
    booking?.booking_reference &&
    booking?.lookup_token &&
    isConfirmedPaidActive({
      paymentStatus: booking.payment_status,
      bookingStatus: booking.booking_status,
      anprAccessStatus: booking.anpr_access_status,
    })
  ) {
    try {
      emailResult = await sendGuestBookingConfirmationEmail({
        bookingReference: booking.booking_reference,
        lookupToken: booking.lookup_token,
      })
    } catch (error) {
      emailWarning =
        error.message ||
        "Guest booking was saved, but confirmation email failed to send."
    }
  }

  return {
    booking,
    emailResult,
    paymentWarning,
    emailWarning,
  }
}

// =====================================================
// UPDATE ADMIN GUEST BOOKING
// =====================================================

export async function updateAdminGuestBooking(bookingId, formData, options = {}) {
  const { sendConfirmationEmail = false } = options

  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const currentBooking = await fetchGuestBookingById(bookingId)

  if (!currentBooking) {
    throw new Error("Guest booking not found.")
  }

  const providerManagedPayment =
    await findGuestPaymentTransaction(bookingId)

  const payload = normalizeAdminBookingPayload({
    ...currentBooking,
    ...formData,
  })

  validateAdminBookingPayload(payload)

  if (providerManagedPayment?.payment_provider) {
    if (payload.paymentStatus !== providerManagedPayment.payment_status) {
      throw new Error(
        "Payment status is locked because this booking is managed by the verified payment provider."
      )
    }

    if (
      Math.abs(
        Number(payload.amount || 0) -
          Number(providerManagedPayment.amount || 0)
      ) > 0.009
    ) {
      throw new Error(
        "Parking fee is locked because this booking already has a provider-managed payment."
      )
    }

    payload.paymentStatus = providerManagedPayment.payment_status
    payload.amount = Number(providerManagedPayment.amount || 0)
  }

  const updatePayload = {
    visitor_name: payload.visitorName,
    email: payload.email,
    phone_number: payload.phoneNumber,
    plate_number: payload.plateNumber,
    normalized_plate_number: payload.normalizedPlateNumber,
    purpose: payload.purpose,
    host_department: payload.hostDepartment,
    visit_start_at: payload.visitStartAt,
    visit_end_at: payload.visitEndAt,
    duration_hours: payload.durationHours,
    amount: payload.amount,
    payment_status: payload.paymentStatus,
    booking_status: payload.bookingStatus,
    anpr_access_status: payload.anprAccessStatus,
    updated_at: nowIso(),
  }

  if (payload.paymentStatus === "paid" && !currentBooking.paid_at) {
    updatePayload.paid_at = nowIso()
  }

  if (payload.bookingStatus === "confirmed" && !currentBooking.confirmed_at) {
    updatePayload.confirmed_at = nowIso()
  }

  if (payload.bookingStatus === "expired") {
    updatePayload.expired_reason = currentBooking.expired_reason || "system"
    updatePayload.expired_at = currentBooking.expired_at || nowIso()
  }

  if (payload.bookingStatus === "cancelled") {
    updatePayload.expired_reason = "cancelled"
    updatePayload.expired_at = currentBooking.expired_at || nowIso()
  }

  const { data, error } = await supabase
    .from("guest_bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .select(GUEST_BOOKING_SELECT)
    .single()

  if (error) {
    console.error("Update guest booking error:", error)
    throw buildFriendlySupabaseError(error, "Failed to update guest booking.")
  }

  let paymentWarning = ""
  let emailResult = null
  let emailWarning = ""

  try {
    await syncGuestPaymentTransaction(data, payload.paymentStatus)
  } catch (paymentError) {
    paymentWarning =
      paymentError.message ||
      "Guest booking was updated, but payment transaction could not be synced."
  }

  if (
    sendConfirmationEmail &&
    data?.booking_reference &&
    data?.lookup_token &&
    isConfirmedPaidActive({
      paymentStatus: data.payment_status,
      bookingStatus: data.booking_status,
      anprAccessStatus: data.anpr_access_status,
    })
  ) {
    try {
      emailResult = await sendGuestBookingConfirmationEmail({
        bookingReference: data.booking_reference,
        lookupToken: data.lookup_token,
      })
    } catch (emailError) {
      emailWarning =
        emailError.message ||
        "Guest booking was updated, but confirmation email failed to send."
    }
  }

  return {
    booking: data,
    emailResult,
    paymentWarning,
    emailWarning,
  }
}

// =====================================================
// UPDATE BOOKING STATUS
// =====================================================

export async function updateGuestBookingStatus(bookingId, status) {
  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const bookingStatus = mapBookingStatusToDb(status)

  const updatePayload = {
    booking_status: bookingStatus,
    updated_at: nowIso(),
  }

  if (bookingStatus === "confirmed") {
    updatePayload.confirmed_at = nowIso()
  }

  if (bookingStatus === "expired") {
    updatePayload.anpr_access_status = "expired"
    updatePayload.expired_reason = "system"
    updatePayload.expired_at = nowIso()
  }

  if (bookingStatus === "cancelled") {
    updatePayload.anpr_access_status = "blocked"
    updatePayload.expired_reason = "cancelled"
    updatePayload.expired_at = nowIso()
  }

  const { data, error } = await supabase
    .from("guest_bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .select(GUEST_BOOKING_SELECT)
    .single()

  if (error) {
    console.error("Update guest booking status error:", error)
    throw buildFriendlySupabaseError(
      error,
      "Failed to update guest booking status."
    )
  }

  return data
}

// =====================================================
// UPDATE PAYMENT STATUS
// =====================================================

export async function updateGuestPaymentStatus(
  bookingId,
  status,
  options = {}
) {
  const { sendConfirmationEmail = false } = options

  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const paymentStatus = mapPaymentStatusToDb(status)
  const currentBooking = await fetchGuestBookingById(bookingId)

  if (!currentBooking) {
    throw new Error("Guest booking not found.")
  }

  const providerManagedPayment =
    await findGuestPaymentTransaction(bookingId)

  if (providerManagedPayment?.payment_provider) {
    throw new Error(
      "This payment is managed by the verified payment provider and cannot be changed manually."
    )
  }

  const updatePayload = {
    payment_status: paymentStatus,
    updated_at: nowIso(),
  }

  if (paymentStatus === "paid") {
    updatePayload.booking_status = "confirmed"
    updatePayload.anpr_access_status = "active"
    updatePayload.paid_at = currentBooking.paid_at || nowIso()
    updatePayload.confirmed_at = currentBooking.confirmed_at || nowIso()
  }

  if (paymentStatus === "pending" || paymentStatus === "failed") {
    updatePayload.booking_status = "pending_payment"
    updatePayload.anpr_access_status = "inactive"
  }

  if (paymentStatus === "refunded") {
    updatePayload.booking_status = "cancelled"
    updatePayload.anpr_access_status = "blocked"
    updatePayload.expired_reason = "cancelled"
    updatePayload.expired_at = currentBooking.expired_at || nowIso()
  }

  const { data, error } = await supabase
    .from("guest_bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .select(GUEST_BOOKING_SELECT)
    .single()

  if (error) {
    console.error("Update guest payment status error:", error)
    throw buildFriendlySupabaseError(
      error,
      "Failed to update guest payment status."
    )
  }

  await syncGuestPaymentTransaction(data, paymentStatus)

  let emailResult = null

  if (
    sendConfirmationEmail &&
    data.booking_reference &&
    data.lookup_token &&
    isConfirmedPaidActive({
      paymentStatus: data.payment_status,
      bookingStatus: data.booking_status,
      anprAccessStatus: data.anpr_access_status,
    })
  ) {
    emailResult = await sendGuestBookingConfirmationEmail({
      bookingReference: data.booking_reference,
      lookupToken: data.lookup_token,
    })
  }

  return {
    booking: data,
    emailResult,
  }
}

// =====================================================
// UPDATE ANPR ACCESS STATUS
// =====================================================

export async function updateGuestAnprAccessStatus(bookingId, status) {
  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const anprAccessStatus = mapAnprAccessStatusToDb(status)

  const updatePayload = {
    anpr_access_status: anprAccessStatus,
    updated_at: nowIso(),
  }

  if (anprAccessStatus === "expired") {
    updatePayload.booking_status = "expired"
    updatePayload.expired_reason = "system"
    updatePayload.expired_at = nowIso()
  }

  if (anprAccessStatus === "blocked") {
    updatePayload.booking_status = "cancelled"
    updatePayload.expired_reason = "cancelled"
    updatePayload.expired_at = nowIso()
  }

  const { data, error } = await supabase
    .from("guest_bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .select(GUEST_BOOKING_SELECT)
    .single()

  if (error) {
    console.error("Update guest ANPR access error:", error)
    throw buildFriendlySupabaseError(
      error,
      "Failed to update guest ANPR access status."
    )
  }

  return data
}

// =====================================================
// UPDATE ENTRY STATUS
// =====================================================

export async function updateGuestEntryStatus(bookingId, entryStatus) {
  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const cleanStatus = normalizeStatusText(entryStatus)

  if (cleanStatus === "no_show") {
    const { data, error } = await supabase
      .from("guest_bookings")
      .update({
        booking_status: "expired",
        anpr_access_status: "expired",
        expired_reason: "no_show",
        expired_at: nowIso(),
        no_show_checked_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq("id", bookingId)
      .select(GUEST_BOOKING_SELECT)
      .single()

    if (error) {
      console.error("Update guest entry no-show error:", error)
      throw buildFriendlySupabaseError(
        error,
        "Failed to mark guest booking as no-show."
      )
    }

    return data
  }

  throw new Error(
    "Entry status is derived from ANPR logs. Only No Show can be updated manually from Guest Booking Management."
  )
}

// =====================================================
// CANCEL GUEST BOOKING SAFELY
// Payment history is preserved.
// Booking is cancelled first, then cancellation email is sent.
// If email fails, booking remains cancelled and emailWarning is returned.
//
// Important:
// Do not use .single() for update here because Supabase/PostgREST
// can return "Cannot coerce the result to a single JSON object".
// We update first, then reload booking by ID.
// =====================================================

export async function cancelGuestBooking(
  bookingId,
  cancellationMessage = "",
  options = {}
) {
  const { sendCancellationEmail = true } = options

  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const cleanCancellationMessage =
    cleanText(cancellationMessage) ||
    "Your booking has been cancelled by the parking administrator."

  const basePayload = {
    booking_status: "cancelled",
    expired_reason: "cancelled",
    expired_at: nowIso(),
    updated_at: nowIso(),
  }

  const cancelPayloadWithBlocked = {
    ...basePayload,
    anpr_access_status: "blocked",
  }

  const cancelPayloadWithExpired = {
    ...basePayload,
    anpr_access_status: "expired",
  }

  let cancelledBooking
  let warning = ""

  // First attempt: use blocked ANPR access.
  const firstAttempt = await supabase
    .from("guest_bookings")
    .update(cancelPayloadWithBlocked)
    .eq("id", bookingId)
    .select(GUEST_BOOKING_SELECT)

  if (!firstAttempt.error) {
    const updatedRows = Array.isArray(firstAttempt.data)
      ? firstAttempt.data
      : []

    cancelledBooking = updatedRows[0] || null
  } else {
    if (!isConstraintError(firstAttempt.error)) {
      console.error("Cancel guest booking error:", firstAttempt.error)

      throw buildFriendlySupabaseError(
        firstAttempt.error,
        "Failed to cancel guest booking."
      )
    }

    // Fallback attempt: use expired ANPR access if blocked is rejected
    // by database constraint.
    const fallbackAttempt = await supabase
      .from("guest_bookings")
      .update(cancelPayloadWithExpired)
      .eq("id", bookingId)
      .select(GUEST_BOOKING_SELECT)

    if (fallbackAttempt.error) {
      console.error("Cancel guest booking fallback error:", fallbackAttempt.error)

      throw buildFriendlySupabaseError(
        fallbackAttempt.error,
        "Failed to cancel guest booking."
      )
    }

    const fallbackRows = Array.isArray(fallbackAttempt.data)
      ? fallbackAttempt.data
      : []

    cancelledBooking = fallbackRows[0] || null
    warning =
      "Booking was cancelled. ANPR access was set to Expired because Blocked is not accepted by the current database constraint."
  }

  // If Supabase update returns empty array, reload the booking.
  // This avoids PostgREST single-object coercion issue.
  if (!cancelledBooking) {
    cancelledBooking = await fetchGuestBookingById(bookingId)
  }

  if (!cancelledBooking) {
    throw new Error(
      "Cancel request completed but booking could not be reloaded. Please refresh and check the booking."
    )
  }

  // Safety check: make sure cancel really applied.
  if (cancelledBooking.booking_status !== "cancelled") {
    throw new Error(
      "Cancel did not apply to this booking. Please check Supabase RLS update policy for guest_bookings."
    )
  }

  let cancellationEmailResult = null
  let emailWarning = ""

  if (
    sendCancellationEmail &&
    cancelledBooking?.booking_reference &&
    cancelledBooking?.lookup_token
  ) {
    try {
      cancellationEmailResult = await sendGuestBookingCancellationEmail({
        bookingReference: cancelledBooking.booking_reference,
        lookupToken: cancelledBooking.lookup_token,
        cancellationMessage: cleanCancellationMessage,
      })
    } catch (error) {
      emailWarning =
        error.message ||
        "Guest booking was cancelled, but cancellation email failed to send."
    }
  }

  return {
    booking: cancelledBooking,
    cancellationMessage: cleanCancellationMessage,
    cancellationEmailResult,
    warning,
    emailWarning,
  }
}

// =====================================================
// DELETE GUEST BOOKING SAFELY
// =====================================================

export async function deleteGuestBookingSafely(bookingId) {
  if (!bookingId) {
    throw new Error("Guest booking ID is required.")
  }

  const existingPayment = await findGuestPaymentTransaction(bookingId)

  if (existingPayment) {
    throw new Error(
      "This guest booking has payment history. Use Cancel instead so payment records are preserved."
    )
  }

  const { error } = await supabase
    .from("guest_bookings")
    .delete()
    .eq("id", bookingId)

  if (error) {
    console.error("Delete guest booking error:", error)
    throw buildFriendlySupabaseError(error, "Failed to delete guest booking.")
  }

  return {
    success: true,
  }
}

// =====================================================
// GUEST BOOKING FILTER OPTIONS
// =====================================================

export const guestBookingStatusOptions = [
  "All Status",
  "Pending Payment",
  "Confirmed",
  "Expired",
  "Cancelled",
]

// =====================================================
// GUEST PAYMENT STATUS OPTIONS
// =====================================================

export const guestPaymentStatusOptions = [
  "All Payments",
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
]

// =====================================================
// GUEST ANPR ACCESS OPTIONS
// =====================================================

export const guestAnprAccessOptions = [
  "All ANPR",
  "Enabled",
  "Not Enabled",
  "Expired",
  "Blocked",
]

// =====================================================
// GUEST ENTRY STATUS OPTIONS
// =====================================================

export const guestEntryStatusOptions = [
  "All Entry",
  "Not Entered",
  "Entered",
  "Overstay",
  "Exited",
  "No Show",
]

// =====================================================
// LEGACY EMPTY FALLBACK
// =====================================================

export const guestBookings = []