// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// CONSTANTS
// =====================================================

const RESERVATION_FEE_AMOUNT = 2
const AFTER_7_RATE_PER_HOUR = 1

const RESERVATION_STATUSES = ["upcoming", "active", "completed", "cancelled"]

const ACTIVE_RESERVATION_STATUSES = ["upcoming", "active"]

const RESERVATION_SELECT = `
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
    id,
    bay_code,
    status,
    parking_zones (
      id,
      zone_name,
      zone_code,
      location_name
    )
  )
`

const UNIVERSITY_USER_SELECT = `
  id,
  university_id,
  full_name,
  role,
  email,
  phone_number,
  faculty,
  department,
  wallet_balance,
  account_status
`

const VEHICLE_SELECT = `
  id,
  plate_number,
  normalized_plate_number,
  vehicle_model,
  vehicle_color,
  owner_name,
  university_id,
  user_type,
  faculty,
  sticker_status,
  anpr_access_status
`

const PARKING_BAY_SELECT = `
  id,
  zone_id,
  bay_code,
  status,
  sensor_status,
  current_plate_number,
  current_user_type,
  current_guest_booking_id,
  last_updated_at,
  parking_zones (
    id,
    zone_code,
    zone_name,
    location_name,
    is_active
  )
`

// =====================================================
// BASIC HELPERS
// =====================================================

function roundMoney(value) {
  return Number((Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100).toFixed(2))
}

function normalizePlateNumber(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function getPayloadValue(payload, keys, fallback = null) {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(payload || {}, key) &&
      payload[key] !== undefined &&
      payload[key] !== null &&
      payload[key] !== ""
    ) {
      return payload[key]
    }
  }

  return fallback
}

function requirePayloadValue(payload, keys, label) {
  const value = getPayloadValue(payload, keys)

  if (!value) {
    throw new Error(`${label} is required.`)
  }

  return value
}

function createFriendlyError(error, fallbackMessage) {
  const message = error?.message || fallbackMessage
  const code = error?.code || ""

  if (code === "23505" || message.toLowerCase().includes("duplicate")) {
    return new Error("Duplicate reservation or transaction reference detected. Please try again.")
  }

  if (code === "23503" || message.toLowerCase().includes("foreign key")) {
    return new Error("Selected user, vehicle, bay, or reservation record is no longer valid.")
  }

  if (code === "23514" || message.toLowerCase().includes("check constraint")) {
    return new Error("One of the selected values does not match the allowed database status or type.")
  }

  if (
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("permission denied") ||
    message.toLowerCase().includes("not authorized")
  ) {
    return new Error(
      "This action is blocked by Supabase RLS. Keep RLS enabled, but add the correct admin policy or RPC permission."
    )
  }

  return new Error(message || fallbackMessage)
}

// =====================================================
// DATE + TIME HELPERS
// =====================================================

function toValidDate(value, label) {
  if (!value) {
    throw new Error(`${label} is required.`)
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is invalid.`)
  }

  return date
}

function toIsoString(value, label) {
  return toValidDate(value, label).toISOString()
}

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

function getOverlapMinutes(start, end, windowStart, windowEnd) {
  const overlapStart = Math.max(start.getTime(), windowStart.getTime())
  const overlapEnd = Math.min(end.getTime(), windowEnd.getTime())

  if (overlapEnd <= overlapStart) {
    return 0
  }

  return Math.floor((overlapEnd - overlapStart) / 60000)
}

export function calculateAfter7ParkingFee(startValue, endValue) {
  const start = toValidDate(startValue, "Reservation start time")
  const end = toValidDate(endValue, "Reservation end time")

  if (end <= start) {
    throw new Error("Reservation end time must be later than start time.")
  }

  let totalPaidMinutes = 0

  const currentDay = new Date(start)
  currentDay.setHours(0, 0, 0, 0)

  while (currentDay < end) {
    const nextDay = new Date(currentDay)
    nextDay.setDate(nextDay.getDate() + 1)

    const earlyMorningStart = new Date(currentDay)
    earlyMorningStart.setHours(0, 0, 0, 0)

    const earlyMorningEnd = new Date(currentDay)
    earlyMorningEnd.setHours(7, 0, 0, 0)

    const eveningStart = new Date(currentDay)
    eveningStart.setHours(19, 0, 0, 0)

    const eveningEnd = new Date(nextDay)
    eveningEnd.setHours(0, 0, 0, 0)

    totalPaidMinutes += getOverlapMinutes(
      start,
      end,
      earlyMorningStart,
      earlyMorningEnd
    )

    totalPaidMinutes += getOverlapMinutes(
      start,
      end,
      eveningStart,
      eveningEnd
    )

    currentDay.setDate(currentDay.getDate() + 1)
  }

  const payableHours = totalPaidMinutes / 60

  return roundMoney(payableHours * AFTER_7_RATE_PER_HOUR)
}

export function calculateReservationFees(startValue, endValue) {
  const reservationFee = RESERVATION_FEE_AMOUNT
  const after7ParkingFee = calculateAfter7ParkingFee(startValue, endValue)

  return {
    reservationFee: roundMoney(reservationFee),
    after7ParkingFee: roundMoney(after7ParkingFee),
    totalAmount: roundMoney(reservationFee + after7ParkingFee),
  }
}

// =====================================================
// STATUS MAPPERS
// =====================================================

function mapUserType(type) {
  const typeMap = {
    student: "Student",
    staff: "Staff",
  }

  return typeMap[String(type || "").toLowerCase()] || "Student"
}

function mapStatus(status) {
  const statusMap = {
    upcoming: "Upcoming",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  }

  return statusMap[String(status || "").toLowerCase()] || "Upcoming"
}

function normalizeReservationStatus(status) {
  const value = String(status || "upcoming").trim().toLowerCase()

  const statusMap = {
    upcoming: "upcoming",
    active: "active",
    completed: "completed",
    cancelled: "cancelled",
    Upcoming: "upcoming",
    Active: "active",
    Completed: "completed",
    Cancelled: "cancelled",
  }

  const dbStatus = statusMap[status] || statusMap[value] || value

  if (!RESERVATION_STATUSES.includes(dbStatus)) {
    throw new Error("Invalid reservation status selected.")
  }

  return dbStatus
}

// =====================================================
// MAP RESERVATION FOR ADMIN UI
// =====================================================

export function mapReservationForAdmin(reservation) {
  const bay = reservation.parking_bays
  const zone = bay?.parking_zones

  const startAt = reservation.reservation_start_at
  const endAt = reservation.reservation_end_at

  const reservationFee = Number(reservation.reservation_fee || 0)
  const after7Fee = Number(reservation.after_7_parking_fee || 0)

  return {
    id: reservation.id,

    reservationId: reservation.reservation_reference,
    reservationReference: reservation.reservation_reference,

    universityUserId: reservation.university_user_id,
    vehicleRecordId: reservation.vehicle_record_id,
    bayId: reservation.bay_id,

    userName: reservation.user_name,
    universityId: reservation.university_id,
    userType: mapUserType(reservation.user_type),

    vehiclePlate: reservation.plate_number,
    normalizedPlateNumber: reservation.normalized_plate_number,

    bayNumber: bay?.bay_code || "-",
    bayStatus: bay?.status || "-",
    zone:
      zone?.zone_name ||
      (zone?.zone_code ? `Zone ${zone.zone_code}` : "-"),
    zoneCode: zone?.zone_code || "-",
    locationName: zone?.location_name || "-",

    date: formatAdminDate(startAt),
    startTime: formatAdminTime(startAt),
    endTime: formatAdminTime(endAt),
    duration: formatDuration(startAt, endAt),

    reservationStartAt: startAt,
    reservationEndAt: endAt,

    reservationFee,
    after7ParkingFee: after7Fee,
    totalFee: roundMoney(reservationFee + after7Fee),

    parkingFeeRule:
      after7Fee > 0
        ? "After 7PM parking fee applied"
        : "No after-7PM parking fee recorded",

    paymentMethod: reservation.payment_method || "wallet",
    status: mapStatus(reservation.status),
    statusValue: reservation.status || "upcoming",

    remarks: reservation.remarks || "-",

    createdAt: reservation.created_at,
    updatedAt: reservation.updated_at,

    raw: reservation,
    source: "supabase",
  }
}

// =====================================================
// FETCH RESERVATIONS
// =====================================================

export async function fetchReservations() {
  // PARKUTEM_PHASE_06G_R1_RESERVATIONS_SCALABILITY
  const batchSize = 500
  const allReservations = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

    const { data, error } = await supabase
      .from("reservations")
      .select(RESERVATION_SELECT)
      .order("reservation_start_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch reservations error:", error)
      throw createFriendlyError(error, "Failed to fetch reservations.")
    }

    const batch = data || []
    allReservations.push(...batch)

    if (batch.length < batchSize) {
      break
    }
  }

  return allReservations
}

async function fetchReservationRecordById(reservationId) {
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_SELECT)
    .eq("id", reservationId)
    .single()

  if (error) {
    console.error("Fetch reservation detail error:", error)
    throw createFriendlyError(error, "Failed to fetch reservation detail.")
  }

  return data
}

export async function fetchReservationById(reservationId) {
  const reservation = await fetchReservationRecordById(reservationId)

  return mapReservationForAdmin(reservation)
}

export async function loadAdminReservations() {
  // PARKUTEM_PHASE_06G_R3B_ADMIN_ATOMIC_CUTOVER
  // Reservation lifecycle maintenance is owned by pg_cron, not page loads.
  const reservations = await fetchReservations()

  return reservations.map(mapReservationForAdmin)
}

// =====================================================
// FORM OPTION LOADERS
// =====================================================

function mapUniversityUserForForm(user) {
  return {
    id: user.id,
    universityId: user.university_id,
    fullName: user.full_name,
    role: user.role,
    userType: mapUserType(user.role),
    email: user.email || "",
    phoneNumber: user.phone_number || "",
    faculty: user.faculty || "",
    department: user.department || "",
    walletBalance: Number(user.wallet_balance || 0),
    accountStatus: user.account_status || "active",
    label: `${user.full_name} - ${user.university_id}`,
    raw: user,
  }
}

function mapVehicleForForm(vehicle) {
  return {
    id: vehicle.id,
    plateNumber: vehicle.plate_number,
    normalizedPlateNumber:
      vehicle.normalized_plate_number || normalizePlateNumber(vehicle.plate_number),
    vehicleModel: vehicle.vehicle_model || "",
    vehicleColor: vehicle.vehicle_color || "",
    ownerName: vehicle.owner_name || "",
    universityId: vehicle.university_id,
    userType: mapUserType(vehicle.user_type),
    faculty: vehicle.faculty || "",
    stickerStatus: vehicle.sticker_status || "",
    anprAccessStatus: vehicle.anpr_access_status || "",
    label: `${vehicle.plate_number} - ${vehicle.vehicle_model || "Vehicle"}`,
    raw: vehicle,
  }
}

function mapBayForForm(bay) {
  const zone = bay.parking_zones

  return {
    id: bay.id,
    bayCode: bay.bay_code,
    status: bay.status,
    sensorStatus: bay.sensor_status || "",
    zoneId: bay.zone_id,
    zoneCode: zone?.zone_code || "",
    zoneName: zone?.zone_name || "",
    locationName: zone?.location_name || "",
    label: `${bay.bay_code} - ${zone?.zone_name || zone?.zone_code || "Zone"}`,
    raw: bay,
  }
}

export async function loadReservationFormOptions() {
  const batchSize = 500

  async function fetchAllOptionRows({
    table,
    selectClause,
    applyFilters,
    orderColumn,
  }) {
    const allRows = []

    for (let from = 0; ; from += batchSize) {
      const to = from + batchSize - 1

      let query = supabase
        .from(table)
        .select(selectClause)

      if (applyFilters) {
        query = applyFilters(query)
      }

      const { data, error } = await query
        .order(orderColumn, { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)

      if (error) {
        throw createFriendlyError(
          error,
          `Failed to load reservation options from ${table}.`
        )
      }

      const batch = data || []
      allRows.push(...batch)

      if (batch.length < batchSize) {
        break
      }
    }

    return allRows
  }

  const [
    users,
    vehicles,
    parkingBays,
    zones,
  ] = await Promise.all([
    fetchAllOptionRows({
      table: "university_users",
      selectClause: UNIVERSITY_USER_SELECT,
      applyFilters: (query) =>
        query
          .eq("account_status", "active")
          .in("role", ["student", "staff"]),
      orderColumn: "full_name",
    }),

    fetchAllOptionRows({
      table: "vehicle_records",
      selectClause: VEHICLE_SELECT,
      applyFilters: (query) =>
        query.in("user_type", ["student", "staff"]),
      orderColumn: "plate_number",
    }),

    fetchAllOptionRows({
      table: "parking_bays",
      selectClause: PARKING_BAY_SELECT,
      orderColumn: "bay_code",
    }),

    fetchAllOptionRows({
      table: "parking_zones",
      selectClause: "id, zone_code, zone_name, location_name, is_active",
      applyFilters: (query) =>
        query.eq("is_active", true),
      orderColumn: "zone_code",
    }),
  ])

  return {
    users: users.map(mapUniversityUserForForm),
    vehicles: vehicles.map(mapVehicleForForm),
    parkingBays: parkingBays.map(mapBayForForm),
    zones,
  }
}

export async function loadVehiclesForUniversityUser(universityUserId) {
  const user = await fetchUniversityUserForReservation(universityUserId)

  const { data, error } = await supabase
    .from("vehicle_records")
    .select(VEHICLE_SELECT)
    .eq("university_id", user.university_id)
    .eq("user_type", user.role)
    .order("plate_number", { ascending: true })

  if (error) {
    console.error("Load user vehicles error:", error)
    throw createFriendlyError(error, "Failed to load user vehicles.")
  }

  return (data || []).map(mapVehicleForForm)
}

// =====================================================
// RECORD FETCHERS
// =====================================================

async function fetchUniversityUserForReservation(universityUserId) {
  const { data, error } = await supabase
    .from("university_users")
    .select(UNIVERSITY_USER_SELECT)
    .eq("id", universityUserId)
    .single()

  if (error) {
    console.error("Fetch reservation user error:", error)
    throw createFriendlyError(error, "Selected user could not be loaded.")
  }

  if (data.account_status && data.account_status !== "active") {
    throw new Error("Selected university user account is not active.")
  }

  if (!["student", "staff"].includes(data.role)) {
    throw new Error("Reservation can only be created for student or staff users.")
  }

  return data
}

async function fetchVehicleForReservation(vehicleRecordId) {
  const { data, error } = await supabase
    .from("vehicle_records")
    .select(VEHICLE_SELECT)
    .eq("id", vehicleRecordId)
    .single()

  if (error) {
    console.error("Fetch reservation vehicle error:", error)
    throw createFriendlyError(error, "Selected vehicle could not be loaded.")
  }

  if (data.sticker_status && data.sticker_status !== "active") {
    throw new Error("Selected vehicle sticker is not active.")
  }

  if (data.anpr_access_status && data.anpr_access_status !== "enabled") {
    throw new Error("Selected vehicle ANPR access is not enabled.")
  }

  return data
}

async function fetchParkingBayForReservation(bayId) {
  const { data, error } = await supabase
    .from("parking_bays")
    .select(PARKING_BAY_SELECT)
    .eq("id", bayId)
    .single()

  if (error) {
    console.error("Fetch reservation bay error:", error)
    throw createFriendlyError(error, "Selected parking bay could not be loaded.")
  }

  return data
}

// =====================================================
// VALIDATION
// =====================================================

function ensureVehicleBelongsToUser(user, vehicle) {
  if (String(vehicle.university_id || "") !== String(user.university_id || "")) {
    throw new Error("Selected vehicle is not linked to the selected university user.")
  }

  if (
    vehicle.user_type &&
    user.role &&
    String(vehicle.user_type).toLowerCase() !== String(user.role).toLowerCase()
  ) {
    throw new Error("Selected vehicle user type does not match the selected user.")
  }
}

export async function checkReservationBayAvailability({
  bayId,
  reservationStartAt,
  reservationEndAt,
  excludeReservationId = null,
}) {
  const startIso = toIsoString(reservationStartAt, "Reservation start time")
  const endIso = toIsoString(reservationEndAt, "Reservation end time")

  if (new Date(endIso) <= new Date(startIso)) {
    throw new Error("Reservation end time must be later than start time.")
  }

  let query = supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_reference,
      status,
      reservation_start_at,
      reservation_end_at
    `
    )
    .eq("bay_id", bayId)
    .in("status", ACTIVE_RESERVATION_STATUSES)
    .lt("reservation_start_at", endIso)
    .gt("reservation_end_at", startIso)
    .limit(5)

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Check reservation bay availability error:", error)
    throw createFriendlyError(error, "Failed to check bay availability.")
  }

  const conflicts = data || []

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}

// =====================================================
// PAYMENT + WALLET
// =====================================================

// =====================================================
// BAY STATUS SYNC
// =====================================================

// =====================================================
// CREATE / UPDATE PAYLOAD BUILDER
// =====================================================

async function buildReservationPayload(inputPayload, existingReservation = null) {
  const universityUserId = getPayloadValue(
    inputPayload,
    ["universityUserId", "university_user_id"],
    existingReservation?.university_user_id
  )

  const vehicleRecordId = getPayloadValue(
    inputPayload,
    ["vehicleRecordId", "vehicle_record_id"],
    existingReservation?.vehicle_record_id
  )

  const bayId = getPayloadValue(
    inputPayload,
    ["bayId", "bay_id"],
    existingReservation?.bay_id
  )

  const reservationStartAt = getPayloadValue(
    inputPayload,
    ["reservationStartAt", "reservation_start_at", "startAt", "start_at"],
    existingReservation?.reservation_start_at
  )

  const reservationEndAt = getPayloadValue(
    inputPayload,
    ["reservationEndAt", "reservation_end_at", "endAt", "end_at"],
    existingReservation?.reservation_end_at
  )

  const status = normalizeReservationStatus(
    getPayloadValue(inputPayload, ["status"], existingReservation?.status || "upcoming")
  )

  const remarks = getPayloadValue(
    inputPayload,
    ["remarks"],
    existingReservation?.remarks || null
  )

  if (!universityUserId) {
    throw new Error("University user is required.")
  }

  if (!vehicleRecordId) {
    throw new Error("Vehicle is required.")
  }

  if (!bayId) {
    throw new Error("Parking bay is required.")
  }

  const startIso = toIsoString(reservationStartAt, "Reservation start time")
  const endIso = toIsoString(reservationEndAt, "Reservation end time")

  if (new Date(endIso) <= new Date(startIso)) {
    throw new Error("Reservation end time must be later than start time.")
  }

  const [user, vehicle, bay] = await Promise.all([
    fetchUniversityUserForReservation(universityUserId),
    fetchVehicleForReservation(vehicleRecordId),
    fetchParkingBayForReservation(bayId),
  ])

  ensureVehicleBelongsToUser(user, vehicle)

  const fees = calculateReservationFees(startIso, endIso)

  return {
    user,
    vehicle,
    bay,
    values: {
      university_user_id: user.id,
      vehicle_record_id: vehicle.id,
      bay_id: bay.id,
      university_id: user.university_id,
      user_name: user.full_name,
      user_type: user.role,
      plate_number: vehicle.plate_number,
      normalized_plate_number:
        vehicle.normalized_plate_number || normalizePlateNumber(vehicle.plate_number),
      reservation_start_at: startIso,
      reservation_end_at: endIso,
      reservation_fee: fees.reservationFee,
      after_7_parking_fee: fees.after7ParkingFee,
      payment_method: "wallet",
      status,
      remarks,
      updated_at: new Date().toISOString(),
    },
    fees,
  }
}

// =====================================================
// CREATE RESERVATION
// =====================================================

export async function createAdminReservation(payload) {
  requirePayloadValue(payload, ["universityUserId", "university_user_id"], "University user")
  requirePayloadValue(payload, ["vehicleRecordId", "vehicle_record_id"], "Vehicle")
  requirePayloadValue(payload, ["bayId", "bay_id"], "Parking bay")
  requirePayloadValue(
    payload,
    ["reservationStartAt", "reservation_start_at", "startAt", "start_at"],
    "Start time"
  )
  requirePayloadValue(
    payload,
    ["reservationEndAt", "reservation_end_at", "endAt", "end_at"],
    "End time"
  )

  const chargeWallet =
    getPayloadValue(payload, ["chargeWallet", "charge_wallet"], true) !== false

  const { values } = await buildReservationPayload(payload)

  const { data, error } = await supabase.rpc("admin_create_reservation_atomic", {
    p_university_user_id: values.university_user_id,
    p_vehicle_record_id: values.vehicle_record_id,
    p_bay_id: values.bay_id,
    p_reservation_start_at: values.reservation_start_at,
    p_reservation_end_at: values.reservation_end_at,
    p_status: values.status,
    p_remarks: values.remarks,
    p_charge_wallet: chargeWallet,
  })

  if (error) {
    console.error("Create reservation atomic RPC error:", error)
    throw createFriendlyError(error, "Failed to create reservation.")
  }

  const reservationId = data?.reservation_id

  if (!reservationId) {
    throw new Error("Reservation was created but no reservation ID was returned.")
  }

  return fetchReservationById(reservationId)
}

// =====================================================
// UPDATE RESERVATION
// =====================================================

export async function updateAdminReservation(reservationId, payload) {
  const existingReservation = await fetchReservationRecordById(reservationId)

  const chargeWallet =
    getPayloadValue(payload, ["chargeWallet", "charge_wallet"], false) === true

  const { values } = await buildReservationPayload(payload, existingReservation)

  const { data, error } = await supabase.rpc("admin_update_reservation_atomic", {
    p_reservation_id: reservationId,
    p_university_user_id: values.university_user_id,
    p_vehicle_record_id: values.vehicle_record_id,
    p_bay_id: values.bay_id,
    p_reservation_start_at: values.reservation_start_at,
    p_reservation_end_at: values.reservation_end_at,
    p_status: values.status,
    p_remarks: values.remarks,
    p_charge_wallet: chargeWallet,
  })

  if (error) {
    console.error("Update reservation atomic RPC error:", error)
    throw createFriendlyError(error, "Failed to update reservation.")
  }

  const updatedReservationId = data?.reservation_id || reservationId

  return fetchReservationById(updatedReservationId)
}

// =====================================================
// UPDATE RESERVATION STATUS
// =====================================================

export async function updateReservationStatus(reservationId, newStatus) {
  const dbStatus = normalizeReservationStatus(newStatus)

  const { data, error } = await supabase.rpc(
    "admin_update_reservation_status_atomic",
    {
      p_reservation_id: reservationId,
      p_status: dbStatus,
    }
  )

  if (error) {
    console.error("Update reservation status atomic RPC error:", error)
    throw createFriendlyError(error, "Failed to update reservation status.")
  }

  const updatedReservationId = data?.reservation_id || reservationId

  return fetchReservationById(updatedReservationId)
}

export async function cancelAdminReservation(reservationId) {
  return updateReservationStatus(reservationId, "cancelled")
}

// =====================================================
// DELETE RESERVATION
// Payment rows are preserved by detaching reservation_id.
// =====================================================

export async function deleteAdminReservation(reservationId) {
  const { data, error } = await supabase.rpc(
    "admin_delete_reservation_atomic",
    {
      p_reservation_id: reservationId,
    }
  )

  if (error) {
    console.error("Delete reservation atomic RPC error:", error)
    throw createFriendlyError(error, "Failed to delete reservation.")
  }

  return {
    deletedReservationId: data?.deleted_reservation_id || reservationId,
    bayId: data?.bay_id || null,
  }
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

