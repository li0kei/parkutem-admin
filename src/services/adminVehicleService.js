// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// FORMAT DATE
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

function mapUserTypeToDatabase(type) {
  const typeMap = {
    Student: "student",
    Staff: "staff",
  }

  return typeMap[type] || "student"
}

function mapStickerStatus(status) {
  const statusMap = {
    active: "Active",
    pending: "Pending",
    expired: "Expired",
    rejected: "Rejected",
  }

  return statusMap[status] || "Pending"
}

function mapStickerStatusToDatabase(status) {
  const statusMap = {
    Active: "active",
    Pending: "pending",
    Expired: "expired",
    Rejected: "rejected",
  }

  return statusMap[status] || "pending"
}

function mapAnprStatus(status) {
  const statusMap = {
    enabled: "Enabled",
    disabled: "Disabled",
  }

  return statusMap[status] || "Disabled"
}

function mapAnprStatusToDatabase(status) {
  const statusMap = {
    Enabled: "enabled",
    Disabled: "disabled",
  }

  return statusMap[status] || "disabled"
}

// =====================================================
// FETCH VEHICLE RECORDS
// =====================================================

export async function fetchVehicleRecords() {
  const { data, error } = await supabase
    .from("vehicle_records")
    .select(
      `
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
      anpr_access_status,
      registered_at,
      expiry_at,
      remarks,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch vehicle records error:", error)
    throw new Error(error.message || "Failed to fetch vehicle records.")
  }

  return data || []
}

// =====================================================
// MAP VEHICLE RECORD FOR ADMIN UI
// =====================================================

export function mapVehicleRecordForAdmin(vehicle) {
  return {
    id: vehicle.id,

    plateNumber: vehicle.plate_number || "-",
    normalizedPlateNumber: vehicle.normalized_plate_number || "-",

    vehicleModel: vehicle.vehicle_model || "-",
    vehicleColor: vehicle.vehicle_color || "-",

    ownerName: vehicle.owner_name || "-",
    universityId: vehicle.university_id || "-",
    userType: mapUserType(vehicle.user_type),
    faculty: vehicle.faculty || "-",

    stickerStatus: mapStickerStatus(vehicle.sticker_status),
    anprStatus: mapAnprStatus(vehicle.anpr_access_status),

    registeredDate: formatAdminDate(vehicle.registered_at),
    expiryDate: formatAdminDate(vehicle.expiry_at),

    remarks: vehicle.remarks || "-",

    raw: vehicle,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN VEHICLES
// =====================================================

export async function loadAdminVehicleRecords() {
  const vehicles = await fetchVehicleRecords()

  return vehicles.map(mapVehicleRecordForAdmin)
}

// =====================================================
// UPDATE STICKER STATUS
// =====================================================

export async function updateVehicleStickerStatus(vehicleId, newStatus) {
  const dbStickerStatus = mapStickerStatusToDatabase(newStatus)

  const updatePayload = {
    sticker_status: dbStickerStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === "Active") {
    updatePayload.anpr_access_status = "enabled"
    updatePayload.expiry_at = new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    ).toISOString()
    updatePayload.remarks =
      "Sticker approved by admin. ANPR access is enabled."
  }

  if (newStatus === "Expired" || newStatus === "Rejected") {
    updatePayload.anpr_access_status = "disabled"
  }

  const { data, error } = await supabase
    .from("vehicle_records")
    .update(updatePayload)
    .eq("id", vehicleId)
    .select()
    .single()

  if (error) {
    console.error("Update vehicle sticker status error:", error)
    throw new Error(error.message || "Failed to update sticker status.")
  }

  return mapVehicleRecordForAdmin(data)
}

// =====================================================
// UPDATE ANPR STATUS
// =====================================================

export async function updateVehicleAnprStatus(vehicleId, newStatus) {
  const dbAnprStatus = mapAnprStatusToDatabase(newStatus)

  const { data, error } = await supabase
    .from("vehicle_records")
    .update({
      anpr_access_status: dbAnprStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId)
    .select()
    .single()

  if (error) {
    console.error("Update vehicle ANPR status error:", error)
    throw new Error(error.message || "Failed to update ANPR status.")
  }

  return mapVehicleRecordForAdmin(data)
}

// =====================================================
// SUBSCRIBE TO VEHICLE RECORD CHANGES
// =====================================================

export function subscribeToVehicleRecords(onChange) {
  const channel = supabase
    .channel("admin-vehicle-records")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vehicle_records",
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

export function unsubscribeFromVehicleRecords(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}