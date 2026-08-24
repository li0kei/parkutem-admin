// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// SUPABASE SELECT QUERY
// =====================================================

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
  created_at,
  updated_at,
  parking_zones (
    id,
    zone_code,
    zone_name,
    location_name
  )
`

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
// HELPERS
// =====================================================

function cleanBayCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
}

function getSupabaseErrorMessage(error, fallbackMessage) {
  if (error?.code === "23505") {
    return "This bay number already exists. Please use a different bay number."
  }

  if (error?.code === "23503") {
    return "This parking bay is linked to existing records. Set it to Maintenance instead of deleting it."
  }

  if (String(error?.message || "").toLowerCase().includes("row-level security")) {
    return "Supabase blocked this action due to RLS policy. Please allow admin insert/update/delete for parking_bays."
  }

  return error?.message || fallbackMessage
}

// =====================================================
// STATUS MAPPERS
// =====================================================

function mapBayStatus(status) {
  const statusMap = {
    available: "Available",
    occupied: "Occupied",
    reserved: "Reserved",
    maintenance: "Maintenance",
  }

  return statusMap[status] || "Available"
}

function mapBayStatusToDatabase(status) {
  const statusMap = {
    Available: "available",
    Occupied: "occupied",
    Reserved: "reserved",
    Maintenance: "maintenance",
  }

  return statusMap[status] || "available"
}

function mapSensorStatus(status) {
  const statusMap = {
    online: "Online",
    offline: "Offline",
    placeholder: "Placeholder",
  }

  return statusMap[status] || "Placeholder"
}

function mapSensorStatusToDatabase(status) {
  const statusMap = {
    Online: "online",
    Offline: "offline",
    Placeholder: "placeholder",
  }

  return statusMap[status] || "placeholder"
}

// =====================================================
// FETCH PARKING ZONES
// =====================================================

export async function fetchParkingZones() {
  const { data, error } = await supabase
    .from("parking_zones")
    .select("id, zone_code, zone_name, location_name, is_active")
    .eq("is_active", true)
    .order("zone_code", { ascending: true })

  if (error) {
    console.error("Fetch parking zones error:", error)
    throw new Error(error.message || "Failed to fetch parking zones.")
  }

  return data || []
}

export function mapParkingZoneForAdmin(zone) {
  return {
    id: zone.id,
    zoneCode: zone.zone_code,
    zoneName: zone.zone_name,
    locationName: zone.location_name,
    label: `${zone.zone_name} â€¢ ${zone.location_name}`,
    value: zone.zone_name,
    raw: zone,
  }
}

export async function loadAdminParkingZones() {
  const zones = await fetchParkingZones()

  return zones.map(mapParkingZoneForAdmin)
}

// =====================================================
// FETCH PARKING BAYS
// =====================================================

export async function fetchParkingBays() {
  const { data, error } = await supabase
    .from("parking_bays")
    .select(PARKING_BAY_SELECT)
    .order("bay_code", { ascending: true })

  if (error) {
    console.error("Fetch parking bays error:", error)
    throw new Error(error.message || "Failed to fetch parking bays.")
  }

  return data || []
}

// =====================================================
// MAP PARKING BAY FOR ADMIN UI
// =====================================================

export function mapParkingBayForAdmin(bay) {
  const sensorStatus = mapSensorStatus(bay.sensor_status)

  return {
    id: bay.id,
    zoneId: bay.zone_id,

    bayNumber: bay.bay_code || "-",
    zone: bay.parking_zones?.zone_name || "Unknown Zone",
    zoneCode: bay.parking_zones?.zone_code || "-",
    locationName: bay.parking_zones?.location_name || "-",

    status: mapBayStatus(bay.status),

    sensorStatus,
    sensorBattery: sensorStatus === "Placeholder" ? "N/A" : "N/A",

    currentVehicle: bay.current_plate_number || "-",
    currentUserType: bay.current_user_type || "-",
    currentGuestBookingId: bay.current_guest_booking_id || null,

    anprLinked: bay.current_plate_number
      ? "Plate currently linked to ANPR access"
      : "Pending IoT/ANPR integration",

    lastUpdated: formatAdminDateTime(
      bay.last_updated_at || bay.updated_at || bay.created_at
    ),

    raw: bay,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN PARKING BAYS
// =====================================================

export async function loadAdminParkingBays() {
  const bays = await fetchParkingBays()

  return bays.map(mapParkingBayForAdmin)
}

// =====================================================
// CREATE PARKING ZONE
// =====================================================

function cleanZoneCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
}

function cleanText(value) {
  return String(value || "").trim()
}

export async function createParkingZone(payload) {
  const zoneCode = cleanZoneCode(payload.zoneCode)
  const zoneName = cleanText(payload.zoneName)
  const locationName = cleanText(payload.locationName)
  const description = cleanText(payload.description)

  if (!zoneCode) {
    throw new Error("Zone code is required.")
  }

  if (!zoneName) {
    throw new Error("Zone name is required.")
  }

  if (!locationName) {
    throw new Error("Location name is required.")
  }

  const { data, error } = await supabase
    .from("parking_zones")
    .insert({
      zone_code: zoneCode,
      zone_name: zoneName,
      location_name: locationName,
      description: description || null,
      is_active: true,
    })
    .select("id, zone_code, zone_name, location_name, is_active")
    .single()

  if (error) {
    console.error("Create parking zone error:", error)

    if (error.code === "23505") {
      throw new Error("This zone code or zone name already exists.")
    }

    if (String(error.message || "").toLowerCase().includes("row-level security")) {
      throw new Error(
        "Supabase blocked this action due to RLS policy. Please allow admin insert for parking_zones."
      )
    }

    throw new Error(error.message || "Failed to create parking zone.")
  }

  return mapParkingZoneForAdmin(data)
}

// =====================================================
// CREATE PARKING BAY
// =====================================================

export async function createParkingBay(payload) {
  const bayCode = cleanBayCode(payload.bayNumber)
  const zoneId = payload.zoneId

  if (!bayCode) {
    throw new Error("Bay number is required.")
  }

  if (!zoneId) {
    throw new Error("Parking zone is required.")
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("parking_bays")
    .insert({
      zone_id: zoneId,
      bay_code: bayCode,
      status: mapBayStatusToDatabase(payload.status),
      sensor_status: mapSensorStatusToDatabase(payload.sensorStatus),
      last_updated_at: now,
      updated_at: now,
    })
    .select(PARKING_BAY_SELECT)
    .single()

  if (error) {
    console.error("Create parking bay error:", error)
    throw new Error(
      getSupabaseErrorMessage(error, "Failed to create parking bay.")
    )
  }

  return mapParkingBayForAdmin(data)
}

// =====================================================
// UPDATE PARKING BAY DETAILS
// =====================================================

export async function updateParkingBayDetails(bayId, payload) {
  if (!bayId) {
    throw new Error("Parking bay ID is required.")
  }

  const bayCode = cleanBayCode(payload.bayNumber)

  if (!bayCode) {
    throw new Error("Bay number is required.")
  }

  if (!payload.zoneId) {
    throw new Error("Parking zone is required.")
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("parking_bays")
    .update({
      zone_id: payload.zoneId,
      bay_code: bayCode,
      status: mapBayStatusToDatabase(payload.status),
      sensor_status: mapSensorStatusToDatabase(payload.sensorStatus),
      last_updated_at: now,
      updated_at: now,
    })
    .eq("id", bayId)
    .select(PARKING_BAY_SELECT)
    .single()

  if (error) {
    console.error("Update parking bay details error:", error)
    throw new Error(
      getSupabaseErrorMessage(error, "Failed to update parking bay.")
    )
  }

  return mapParkingBayForAdmin(data)
}

// =====================================================
// UPDATE PARKING BAY STATUS ONLY
// =====================================================

export async function updateParkingBayStatus(bayId, newStatus) {
  if (!bayId) {
    throw new Error("Parking bay ID is required.")
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("parking_bays")
    .update({
      status: mapBayStatusToDatabase(newStatus),
      last_updated_at: now,
      updated_at: now,
    })
    .eq("id", bayId)
    .select(PARKING_BAY_SELECT)
    .single()

  if (error) {
    console.error("Update parking bay status error:", error)
    throw new Error(
      getSupabaseErrorMessage(error, "Failed to update parking bay status.")
    )
  }

  return mapParkingBayForAdmin(data)
}

// =====================================================
// DELETE PARKING BAY
// =====================================================

export async function deleteParkingBay(bayId) {
  if (!bayId) {
    throw new Error("Parking bay ID is required.")
  }

  const { error } = await supabase
    .from("parking_bays")
    .delete()
    .eq("id", bayId)

  if (error) {
    console.error("Delete parking bay error:", error)
    throw new Error(
      getSupabaseErrorMessage(error, "Failed to delete parking bay.")
    )
  }

  return true
}

// =====================================================
// SUBSCRIBE TO PARKING BAY CHANGES
// =====================================================

export function subscribeToParkingBays(onChange) {
  const channel = supabase
    .channel("admin-parking-bays")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "parking_bays",
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

export function unsubscribeFromParkingBays(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}
// =====================================================
// PARKUTEM PHASE 03B - PARKING ZONE MAP MANAGEMENT
// =====================================================

const PARKING_ZONE_MANAGEMENT_SELECT = `
  id,
  zone_code,
  zone_name,
  location_name,
  description,
  is_active,
  guest_enabled,
  map_label,
  map_latitude,
  map_longitude,
  created_at,
  updated_at
`

function parseOptionalCoordinate(value, label, minimum, maximum) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`)
  }

  if (parsed < minimum || parsed > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`)
  }

  return Number(parsed.toFixed(6))
}

function buildParkingZoneMutationPayload(payload) {
  const zoneCode = cleanZoneCode(payload.zoneCode)
  const zoneName = cleanText(payload.zoneName)
  const locationName = cleanText(payload.locationName)
  const description = cleanText(payload.description)
  const mapLabel = cleanText(payload.mapLabel)

  if (!zoneCode) {
    throw new Error("Zone code is required.")
  }

  if (!zoneName) {
    throw new Error("Zone name is required.")
  }

  if (!locationName) {
    throw new Error("Location name is required.")
  }

  const mapLatitude = parseOptionalCoordinate(
    payload.mapLatitude,
    "Latitude",
    -90,
    90
  )

  const mapLongitude = parseOptionalCoordinate(
    payload.mapLongitude,
    "Longitude",
    -180,
    180
  )

  const hasLatitude = mapLatitude !== null
  const hasLongitude = mapLongitude !== null

  if (hasLatitude !== hasLongitude) {
    throw new Error("Latitude and longitude must either both be set or both be empty.")
  }

  return {
    zone_code: zoneCode,
    zone_name: zoneName,
    location_name: locationName,
    description: description || null,
    is_active: payload.isActive !== false,
    guest_enabled: payload.guestEnabled !== false,
    map_label: mapLabel || null,
    map_latitude: mapLatitude,
    map_longitude: mapLongitude,
    updated_at: new Date().toISOString(),
  }
}

export function mapParkingZoneForManagement(zone) {
  return {
    id: zone.id,
    zoneCode: zone.zone_code,
    zoneName: zone.zone_name,
    locationName: zone.location_name,
    description: zone.description || "",
    isActive: zone.is_active !== false,
    guestEnabled: zone.guest_enabled !== false,
    mapLabel: zone.map_label || "",
    mapLatitude:
      zone.map_latitude === null || zone.map_latitude === undefined
        ? null
        : Number(zone.map_latitude),
    mapLongitude:
      zone.map_longitude === null || zone.map_longitude === undefined
        ? null
        : Number(zone.map_longitude),
    createdAt: zone.created_at || null,
    updatedAt: zone.updated_at || null,
    raw: zone,
  }
}

export async function loadAdminParkingZonesForManagement() {
  const { data, error } = await supabase
    .from("parking_zones")
    .select(PARKING_ZONE_MANAGEMENT_SELECT)
    .order("zone_code", { ascending: true })

  if (error) {
    console.error("Load parking zones for management error:", error)
    throw new Error(error.message || "Failed to load parking zones.")
  }

  return (data || []).map(mapParkingZoneForManagement)
}

export async function createParkingZoneWithMap(payload) {
  const mutation = buildParkingZoneMutationPayload(payload)

  const { data, error } = await supabase
    .from("parking_zones")
    .insert(mutation)
    .select(PARKING_ZONE_MANAGEMENT_SELECT)
    .single()

  if (error) {
    console.error("Create parking zone with map error:", error)

    if (error.code === "23505") {
      throw new Error("This zone code or zone name already exists.")
    }

    throw new Error(error.message || "Failed to create parking zone.")
  }

  return mapParkingZoneForManagement(data)
}

export async function updateParkingZoneDetails(zoneId, payload) {
  if (!zoneId) {
    throw new Error("Parking zone ID is required.")
  }

  const mutation = buildParkingZoneMutationPayload(payload)

  const { data, error } = await supabase
    .from("parking_zones")
    .update(mutation)
    .eq("id", zoneId)
    .select(PARKING_ZONE_MANAGEMENT_SELECT)
    .single()

  if (error) {
    console.error("Update parking zone details error:", error)

    if (error.code === "23505") {
      throw new Error("This zone code or zone name already exists.")
    }

    throw new Error(error.message || "Failed to update parking zone.")
  }

  return mapParkingZoneForManagement(data)
}

