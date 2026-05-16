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

function mapRole(role) {
  const roleMap = {
    student: "Student",
    staff: "Staff",
  }

  return roleMap[role] || "Student"
}

function mapAccountStatus(status) {
  const statusMap = {
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
  }

  return statusMap[status] || "Active"
}

function mapAccountStatusToDatabase(status) {
  const statusMap = {
    Active: "active",
    Inactive: "inactive",
    Suspended: "suspended",
  }

  return statusMap[status] || "active"
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

// =====================================================
// RESOLVE MAIN VEHICLE
// =====================================================

function resolveMainVehicle(vehicleRecords) {
  if (!vehicleRecords.length) {
    return {
      vehiclePlate: "-",
      vehicleModel: "No registered vehicle",
      stickerStatus: "Pending",
      activeStickerCount: 0,
    }
  }

  const activeVehicle =
    vehicleRecords.find((vehicle) => vehicle.sticker_status === "active") ||
    vehicleRecords[0]

  const activeStickerCount = vehicleRecords.filter(
    (vehicle) => vehicle.sticker_status === "active"
  ).length

  return {
    vehiclePlate: activeVehicle.plate_number || "-",
    vehicleModel: activeVehicle.vehicle_model || "-",
    stickerStatus: mapStickerStatus(activeVehicle.sticker_status),
    activeStickerCount,
  }
}

// =====================================================
// FETCH UNIVERSITY USERS
// =====================================================

export async function fetchUniversityUsers() {
  const { data, error } = await supabase
    .from("university_users")
    .select(
      `
      id,
      university_id,
      full_name,
      role,
      email,
      phone_number,
      faculty,
      department,
      wallet_balance,
      account_status,
      last_activity_at,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch university users error:", error)
    throw new Error(error.message || "Failed to fetch university users.")
  }

  return data || []
}

// =====================================================
// FETCH VEHICLE RECORDS FOR USERS
// =====================================================

async function fetchVehicleRecordsForUsers(universityIds) {
  if (!universityIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("vehicle_records")
    .select(
      `
      id,
      university_id,
      plate_number,
      vehicle_model,
      vehicle_color,
      sticker_status,
      anpr_access_status
    `
    )
    .in("university_id", universityIds)

  if (error) {
    console.error("Fetch linked vehicle records error:", error)
    throw new Error(error.message || "Failed to fetch linked vehicle records.")
  }

  return data || []
}

// =====================================================
// GROUP VEHICLES BY UNIVERSITY ID
// =====================================================

function groupVehiclesByUniversityId(vehicleRecords) {
  return vehicleRecords.reduce((groups, vehicle) => {
    const key = vehicle.university_id

    if (!groups[key]) {
      groups[key] = []
    }

    groups[key].push(vehicle)

    return groups
  }, {})
}

// =====================================================
// MAP USER FOR ADMIN UI
// =====================================================

export function mapUserForAdmin(user, linkedVehicles = []) {
  const vehicleSummary = resolveMainVehicle(linkedVehicles)

  return {
    id: user.id,

    universityId: user.university_id,
    name: user.full_name,
    role: mapRole(user.role),

    email: user.email,
    phone: user.phone_number || "-",

    faculty: user.faculty || "-",
    department: user.department || "-",

    vehiclePlate: vehicleSummary.vehiclePlate,
    vehicleModel: vehicleSummary.vehicleModel,
    stickerStatus: vehicleSummary.stickerStatus,
    activeStickerCount: vehicleSummary.activeStickerCount,
    vehicleCount: linkedVehicles.length,

    walletBalance: Number(user.wallet_balance || 0),
    accountStatus: mapAccountStatus(user.account_status),

    lastActivity: formatAdminDateTime(user.last_activity_at || user.updated_at),

    raw: {
      user,
      linkedVehicles,
    },

    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN USERS
// =====================================================

export async function loadAdminUsers() {
  const users = await fetchUniversityUsers()
  const universityIds = users.map((user) => user.university_id)

  const vehicleRecords = await fetchVehicleRecordsForUsers(universityIds)
  const vehicleGroups = groupVehiclesByUniversityId(vehicleRecords)

  return users.map((user) =>
    mapUserForAdmin(user, vehicleGroups[user.university_id] || [])
  )
}

// =====================================================
// UPDATE USER ACCOUNT STATUS
// =====================================================

export async function updateUniversityUserAccountStatus(userId, newStatus) {
  const dbStatus = mapAccountStatusToDatabase(newStatus)

  const { data, error } = await supabase
    .from("university_users")
    .update({
      account_status: dbStatus,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Update university user account status error:", error)
    throw new Error(error.message || "Failed to update user account status.")
  }

  const vehicleRecords = await fetchVehicleRecordsForUsers([data.university_id])

  return mapUserForAdmin(data, vehicleRecords)
}

// =====================================================
// SUBSCRIBE TO USER CHANGES
// =====================================================

export function subscribeToUniversityUsers(onChange) {
  const channel = supabase
    .channel("admin-university-users")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "university_users",
      },
      () => {
        onChange?.()
      }
    )
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

export function unsubscribeFromUniversityUsers(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}