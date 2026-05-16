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
    warning: "Warning",
    placeholder: "Placeholder",
  }

  return statusMap[status] || "Placeholder"
}

// =====================================================
// FETCH PARKING BAYS
// =====================================================

export async function fetchParkingBays() {
  const { data, error } = await supabase
    .from("parking_bays")
    .select(
      `
      id,
      bay_code,
      status,
      sensor_status,
      created_at,
      updated_at,
      parking_zones (
        zone_code,
        zone_name,
        location_name
      )
    `
    )
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
    bayNumber: bay.bay_code || "-",
    zone: bay.parking_zones?.zone_name || "Zone A",
    locationName: bay.parking_zones?.location_name || "-",

    status: mapBayStatus(bay.status),

    sensorStatus,
    sensorBattery: sensorStatus === "Placeholder" ? "N/A" : "N/A",

    currentVehicle: "-",
    anprLinked: "Pending IoT/ANPR integration",
    lastUpdated: formatAdminDateTime(bay.updated_at || bay.created_at),

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
// UPDATE PARKING BAY STATUS
// =====================================================

export async function updateParkingBayStatus(bayId, newStatus) {
  const dbStatus = mapBayStatusToDatabase(newStatus)

  const { data, error } = await supabase
    .from("parking_bays")
    .update({
      status: dbStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bayId)
    .select(
      `
      id,
      bay_code,
      status,
      sensor_status,
      created_at,
      updated_at,
      parking_zones (
        zone_code,
        zone_name,
        location_name
      )
    `
    )
    .single()

  if (error) {
    console.error("Update parking bay status error:", error)
    throw new Error(error.message || "Failed to update parking bay status.")
  }

  return mapParkingBayForAdmin(data)
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