// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// CONSTANTS
// =====================================================

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
  account_status,
  must_change_password,
  last_login_at,
  last_activity_at,
  created_at,
  updated_at
`

const VEHICLE_RECORD_SELECT = `
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

// =====================================================
// FORMATTERS
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

function cleanText(value) {
  return String(value || "").trim()
}

function cleanOptionalText(value) {
  const cleanedValue = cleanText(value)

  return cleanedValue || null
}

function cleanUniversityId(value) {
  return cleanText(value).toUpperCase()
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase()
}

function cleanPlateNumber(value) {
  return cleanText(value).toUpperCase()
}

function normalizePlateNumber(value) {
  return cleanPlateNumber(value).replace(/[^A-Z0-9]/g, "")
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return fallback
  }

  return number
}

function generateFallbackTemporaryPassword(universityId) {
  const cleanedId = cleanUniversityId(universityId).replace(/[^A-Z0-9]/g, "")
  const suffix = cleanedId.slice(-6) || "000000"

  return `Park@${suffix}`
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

function mapRoleToDatabase(role) {
  const roleMap = {
    Student: "student",
    Staff: "staff",
    student: "student",
    staff: "staff",
  }

  return roleMap[role] || "student"
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
    active: "active",
    inactive: "inactive",
    suspended: "suspended",
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

function mapStickerStatusToDatabase(status) {
  const statusMap = {
    Active: "active",
    Pending: "pending",
    Expired: "expired",
    Rejected: "rejected",
    active: "active",
    pending: "pending",
    expired: "expired",
    rejected: "rejected",
  }

  return statusMap[status] || "pending"
}

function mapAnprAccessStatus(status) {
  const statusMap = {
    enabled: "Enabled",
    disabled: "Disabled",
  }

  return statusMap[status] || "Disabled"
}

function mapAnprAccessStatusToDatabase(status) {
  const statusMap = {
    Enabled: "enabled",
    Disabled: "disabled",
    enabled: "enabled",
    disabled: "disabled",
  }

  return statusMap[status] || "disabled"
}

// =====================================================
// ERROR HANDLING
// =====================================================

function getSupabaseErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage
  }

  const message = String(error.message || "").toLowerCase()

  if (error.code === "23505") {
    if (message.includes("university_users_university_id_key")) {
      return "This university ID already exists. Please use a different university ID."
    }

    if (message.includes("university_users_email_key")) {
      return "This email already exists. Please use a different email."
    }

    if (message.includes("vehicle_records_plate_unique")) {
      return "This vehicle plate already exists. Please use a different plate number."
    }

    return "Duplicate record detected. Please check university ID, email, or vehicle plate."
  }

  if (error.code === "23503") {
    return "This record is linked to other system records and cannot be deleted safely."
  }

  if (message.includes("row-level security") || message.includes("rls")) {
    return "Supabase blocked this action due to RLS policy. Please allow admin insert/update/delete for university_users and vehicle_records."
  }

  return error.message || fallbackMessage
}

// =====================================================
// PASSWORD HELPERS
// =====================================================

export async function generateTemporaryPassword(universityId) {
  const cleanedId = cleanUniversityId(universityId)

  if (!cleanedId) {
    throw new Error("University ID is required before generating password.")
  }

  const { data, error } = await supabase.rpc("generate_temp_password", {
    p_university_id: cleanedId,
  })

  if (error) {
    console.warn("Generate temporary password RPC failed:", error)
    return generateFallbackTemporaryPassword(cleanedId)
  }

  return data || generateFallbackTemporaryPassword(cleanedId)
}

export async function setUniversityUserPassword(
  userId,
  plainPassword,
  mustChangePassword = true
) {
  const password = cleanText(plainPassword)

  if (password.length < 8) {
    throw new Error("Temporary password must be at least 8 characters.")
  }

  const { data, error } = await supabase.rpc("set_university_user_password", {
    p_user_id: userId,
    p_plain_password: password,
    p_must_change_password: mustChangePassword,
  })

  if (error) {
    console.error("Set university user password error:", error)

    throw new Error(
      getSupabaseErrorMessage(error, "Failed to set user password.")
    )
  }

  return data
}

export async function resetUniversityUserPassword(userId, universityId) {
  const temporaryPassword = await generateTemporaryPassword(universityId)

  await setUniversityUserPassword(userId, temporaryPassword, true)

  return temporaryPassword
}

// =====================================================
// VEHICLE HELPERS
// =====================================================

function mapVehicleForAdmin(vehicle) {
  return {
    id: vehicle.id,
    plateNumber: vehicle.plate_number || "-",
    normalizedPlateNumber: vehicle.normalized_plate_number || "-",
    vehicleModel: vehicle.vehicle_model || "-",
    vehicleColor: vehicle.vehicle_color || "-",
    ownerName: vehicle.owner_name || "-",
    universityId: vehicle.university_id || "-",
    userType: mapRole(vehicle.user_type),
    faculty: vehicle.faculty || "-",
    stickerStatus: mapStickerStatus(vehicle.sticker_status),
    anprAccessStatus: mapAnprAccessStatus(vehicle.anpr_access_status),
    registeredAt: formatAdminDateTime(vehicle.registered_at),
    expiryAt: formatAdminDateTime(vehicle.expiry_at),
    remarks: vehicle.remarks || "-",
    raw: vehicle,
  }
}

function resolveMainVehicle(vehicleRecords) {
  if (!vehicleRecords.length) {
    return {
      vehicleId: null,
      vehiclePlate: "-",
      vehicleModel: "No registered vehicle",
      vehicleColor: "-",
      stickerStatus: "Pending",
      anprAccessStatus: "Disabled",
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
    vehicleId: activeVehicle.id,
    vehiclePlate: activeVehicle.plate_number || "-",
    vehicleModel: activeVehicle.vehicle_model || "-",
    vehicleColor: activeVehicle.vehicle_color || "-",
    stickerStatus: mapStickerStatus(activeVehicle.sticker_status),
    anprAccessStatus: mapAnprAccessStatus(activeVehicle.anpr_access_status),
    activeStickerCount,
  }
}

// =====================================================
// MAP USER FOR ADMIN UI
// =====================================================

export function mapUserForAdmin(user, linkedVehicles = []) {
  const vehicleSummary = resolveMainVehicle(linkedVehicles)
  const mappedVehicles = linkedVehicles.map(mapVehicleForAdmin)

  return {
    id: user.id,

    universityId: user.university_id,
    name: user.full_name,
    role: mapRole(user.role),

    email: user.email,
    phone: user.phone_number || "-",

    faculty: user.faculty || "-",
    department: user.department || "-",

    vehicleId: vehicleSummary.vehicleId,
    vehiclePlate: vehicleSummary.vehiclePlate,
    vehicleModel: vehicleSummary.vehicleModel,
    vehicleColor: vehicleSummary.vehicleColor,
    stickerStatus: vehicleSummary.stickerStatus,
    anprAccessStatus: vehicleSummary.anprAccessStatus,
    activeStickerCount: vehicleSummary.activeStickerCount,
    vehicleCount: linkedVehicles.length,
    vehicles: mappedVehicles,

    walletBalance: Number(user.wallet_balance || 0),
    accountStatus: mapAccountStatus(user.account_status),
    mustChangePassword: Boolean(user.must_change_password),

    lastLogin: formatAdminDateTime(user.last_login_at),
    lastActivity: formatAdminDateTime(user.last_activity_at || user.updated_at),
    createdAt: formatAdminDateTime(user.created_at),
    updatedAt: formatAdminDateTime(user.updated_at),

    raw: {
      user,
      linkedVehicles,
    },

    source: "supabase",
  }
}

// =====================================================
// VALIDATION
// =====================================================

function validateUserPayload(payload) {
  if (!cleanText(payload.fullName || payload.name)) {
    throw new Error("Full name is required.")
  }

  if (!cleanText(payload.universityId)) {
    throw new Error("University ID is required.")
  }

  if (!cleanText(payload.email)) {
    throw new Error("Email is required.")
  }

  if (!cleanText(payload.role)) {
    throw new Error("Role is required.")
  }
}

function validateVehiclePayload(payload) {
  if (!cleanText(payload.vehiclePlate)) {
    return
  }

  if (!normalizePlateNumber(payload.vehiclePlate)) {
    throw new Error("Vehicle plate number is invalid.")
  }
}

// =====================================================
// BUILD DATABASE PAYLOADS
// =====================================================

function buildUserPayload(payload) {
  const role = mapRoleToDatabase(payload.role)

  return {
    university_id: cleanUniversityId(payload.universityId),
    full_name: cleanText(payload.fullName || payload.name),
    role,
    email: cleanEmail(payload.email),
    phone_number: cleanOptionalText(payload.phone),
    faculty: cleanText(payload.faculty) || "-",
    department: cleanText(payload.department) || "-",
    wallet_balance: safeNumber(payload.walletBalance, 0),
    account_status: mapAccountStatusToDatabase(payload.accountStatus),
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function buildVehiclePayload(payload, userPayload) {
  const plateNumber = cleanPlateNumber(payload.vehiclePlate)

  if (!plateNumber) {
    return null
  }

  const stickerStatus = mapStickerStatusToDatabase(payload.stickerStatus)

  const anprAccessStatus = mapAnprAccessStatusToDatabase(
    payload.anprAccessStatus ||
      (stickerStatus === "active" ? "Enabled" : "Disabled")
  )

  return {
    plate_number: plateNumber,
    normalized_plate_number: normalizePlateNumber(plateNumber),
    vehicle_model: cleanText(payload.vehicleModel) || "-",
    vehicle_color: cleanText(payload.vehicleColor) || "-",
    owner_name: userPayload.full_name,
    university_id: userPayload.university_id,
    user_type: userPayload.role,
    faculty: userPayload.faculty || "-",
    sticker_status: stickerStatus,
    anpr_access_status: anprAccessStatus,
    expiry_at: cleanOptionalText(payload.expiryAt),
    remarks: cleanOptionalText(payload.remarks),
    updated_at: new Date().toISOString(),
  }
}

// =====================================================
// FETCH UNIVERSITY USERS
// =====================================================

export async function fetchUniversityUsers() {
  // PARKUTEM_PHASE_04A_FIX3_USERS_BATCH
  // Supabase/PostgREST limits one response, so retrieve users in bounded ranges.
  const batchSize = 500
  const allUsers = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

    const { data, error } = await supabase
      .from("university_users")
      .select(UNIVERSITY_USER_SELECT)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch university users error:", error)

      throw new Error(
        getSupabaseErrorMessage(error, "Failed to fetch university users.")
      )
    }

    const rows = Array.isArray(data) ? data : []

    allUsers.push(...rows)

    if (rows.length < batchSize) {
      break
    }
  }

  return allUsers
}

// =====================================================
// FETCH VEHICLE RECORDS FOR USERS
// =====================================================

async function fetchVehicleRecordsForUsers(universityIds) {
  // PARKUTEM_PHASE_04A_FIX3_VEHICLES_BATCH
  // Keep the IN filter bounded and paginate vehicle rows per ID group.
  const safeIds = [...new Set(universityIds.filter(Boolean))]

  if (!safeIds.length) {
    return []
  }

  const idBatchSize = 100
  const rowBatchSize = 500
  const allVehicles = []

  for (
    let idOffset = 0;
    idOffset < safeIds.length;
    idOffset += idBatchSize
  ) {
    const idBatch = safeIds.slice(
      idOffset,
      idOffset + idBatchSize
    )

    for (let from = 0; ; from += rowBatchSize) {
      const to = from + rowBatchSize - 1

      const { data, error } = await supabase
        .from("vehicle_records")
        .select(VEHICLE_RECORD_SELECT)
        .in("university_id", idBatch)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Fetch linked vehicle records error:", error)

        throw new Error(
          getSupabaseErrorMessage(
            error,
            "Failed to fetch linked vehicle records."
          )
        )
      }

      const rows = Array.isArray(data) ? data : []

      allVehicles.push(...rows)

      if (rows.length < rowBatchSize) {
        break
      }
    }
  }

  return allVehicles
}

// =====================================================
// FETCH ALL VEHICLE RECORDS FOR ADMIN LIST
// =====================================================

async function fetchAllVehicleRecordsForAdmin() {
  const batchSize = 500
  const allVehicles = []

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1

    const { data, error } = await supabase
      .from("vehicle_records")
      .select(VEHICLE_RECORD_SELECT)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch full vehicle registry error:", error)

      throw new Error(
        getSupabaseErrorMessage(
          error,
          "Failed to fetch vehicle records for Admin users."
        )
      )
    }

    const rows = Array.isArray(data) ? data : []
    allVehicles.push(...rows)

    if (rows.length < batchSize) {
      break
    }
  }

  return allVehicles
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
// LOAD ADMIN USERS
// =====================================================

export async function loadAdminUsers() {
  // PARKUTEM_ADMIN_PHASE_08_R1_PARALLEL_USER_VEHICLE_LOAD
  const [users, vehicleRecords] = await Promise.all([
    fetchUniversityUsers(),
    fetchAllVehicleRecordsForAdmin(),
  ])

  const vehicleGroups = groupVehiclesByUniversityId(vehicleRecords)

  return users.map((user) =>
    mapUserForAdmin(user, vehicleGroups[user.university_id] || [])
  )
}

// =====================================================
// LOAD SINGLE USER
// =====================================================

export async function loadAdminUserById(userId) {
  const { data, error } = await supabase
    .from("university_users")
    .select(UNIVERSITY_USER_SELECT)
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Load university user by id error:", error)

    throw new Error(
      getSupabaseErrorMessage(error, "Failed to load university user.")
    )
  }

  const vehicleRecords = await fetchVehicleRecordsForUsers([data.university_id])

  return mapUserForAdmin(data, vehicleRecords)
}

// =====================================================
// CREATE UNIVERSITY USER
// =====================================================

export async function createUniversityUser(payload) {
  validateUserPayload(payload)
  validateVehiclePayload(payload)

  const userPayload = {
    ...buildUserPayload(payload),
    created_at: new Date().toISOString(),
  }

  const temporaryPassword =
    cleanText(payload.temporaryPassword) ||
    (await generateTemporaryPassword(userPayload.university_id))

  const { data: createdUser, error: userError } = await supabase
    .from("university_users")
    .insert(userPayload)
    .select(UNIVERSITY_USER_SELECT)
    .single()

  if (userError) {
    console.error("Create university user error:", userError)

    throw new Error(
      getSupabaseErrorMessage(userError, "Failed to create university user.")
    )
  }

  try {
    await setUniversityUserPassword(createdUser.id, temporaryPassword, true)

    const vehiclePayload = buildVehiclePayload(payload, userPayload)

    if (vehiclePayload) {
      const { error: vehicleError } = await supabase
        .from("vehicle_records")
        .insert({
          ...vehiclePayload,
          registered_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })

      if (vehicleError) {
        console.error("Create linked vehicle record error:", vehicleError)

        throw new Error(
          getSupabaseErrorMessage(
            vehicleError,
            "User was not saved because linked vehicle creation failed."
          )
        )
      }
    }
  } catch (error) {
    await supabase.from("vehicle_records").delete().eq("university_id", createdUser.university_id)
    await supabase.from("university_users").delete().eq("id", createdUser.id)

    throw error
  }

  const vehicleRecords = await fetchVehicleRecordsForUsers([
    createdUser.university_id,
  ])

  return {
    ...mapUserForAdmin(
      {
        ...createdUser,
        must_change_password: true,
      },
      vehicleRecords
    ),
    temporaryPassword,
  }
}

// =====================================================
// UPDATE UNIVERSITY USER DETAILS
// =====================================================

export async function updateUniversityUserDetails(userId, payload) {
  validateUserPayload(payload)
  validateVehiclePayload(payload)

  const currentUser = await loadAdminUserById(userId)
  const userPayload = buildUserPayload(payload)
  const oldUniversityId = currentUser.universityId

  const { data: updatedUser, error: userError } = await supabase
    .from("university_users")
    .update(userPayload)
    .eq("id", userId)
    .select(UNIVERSITY_USER_SELECT)
    .single()

  if (userError) {
    console.error("Update university user error:", userError)

    throw new Error(
      getSupabaseErrorMessage(userError, "Failed to update university user.")
    )
  }

  if (oldUniversityId !== updatedUser.university_id) {
    const { error: syncVehicleOwnerError } = await supabase
      .from("vehicle_records")
      .update({
        university_id: updatedUser.university_id,
        owner_name: updatedUser.full_name,
        user_type: updatedUser.role,
        faculty: updatedUser.faculty,
        updated_at: new Date().toISOString(),
      })
      .eq("university_id", oldUniversityId)

    if (syncVehicleOwnerError) {
      console.error("Sync vehicle owner error:", syncVehicleOwnerError)

      throw new Error(
        getSupabaseErrorMessage(
          syncVehicleOwnerError,
          "User updated, but linked vehicle owner sync failed."
        )
      )
    }
  } else {
    const { error: syncVehicleOwnerError } = await supabase
      .from("vehicle_records")
      .update({
        owner_name: updatedUser.full_name,
        user_type: updatedUser.role,
        faculty: updatedUser.faculty,
        updated_at: new Date().toISOString(),
      })
      .eq("university_id", updatedUser.university_id)

    if (syncVehicleOwnerError) {
      console.error("Sync vehicle owner error:", syncVehicleOwnerError)

      throw new Error(
        getSupabaseErrorMessage(
          syncVehicleOwnerError,
          "User updated, but linked vehicle owner sync failed."
        )
      )
    }
  }

  const vehiclePayload = buildVehiclePayload(payload, userPayload)

  if (vehiclePayload) {
    if (payload.vehicleId) {
      const { error: vehicleError } = await supabase
        .from("vehicle_records")
        .update(vehiclePayload)
        .eq("id", payload.vehicleId)

      if (vehicleError) {
        console.error("Update linked vehicle record error:", vehicleError)

        throw new Error(
          getSupabaseErrorMessage(
            vehicleError,
            "Failed to update linked vehicle record."
          )
        )
      }
    } else {
      const { error: vehicleError } = await supabase
        .from("vehicle_records")
        .insert({
          ...vehiclePayload,
          registered_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })

      if (vehicleError) {
        console.error("Create linked vehicle record error:", vehicleError)

        throw new Error(
          getSupabaseErrorMessage(
            vehicleError,
            "Failed to create linked vehicle record."
          )
        )
      }
    }
  }

  const vehicleRecords = await fetchVehicleRecordsForUsers([
    updatedUser.university_id,
  ])

  return mapUserForAdmin(updatedUser, vehicleRecords)
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
    .select(UNIVERSITY_USER_SELECT)
    .single()

  if (error) {
    console.error("Update university user account status error:", error)

    throw new Error(
      getSupabaseErrorMessage(error, "Failed to update user account status.")
    )
  }

  const vehicleRecords = await fetchVehicleRecordsForUsers([data.university_id])

  return mapUserForAdmin(data, vehicleRecords)
}

// =====================================================
// DELETE UNIVERSITY USER
// =====================================================

export async function deleteUniversityUser(userId) {
  const user = await loadAdminUserById(userId)

  const { error: vehicleError } = await supabase
    .from("vehicle_records")
    .delete()
    .eq("university_id", user.universityId)

  if (vehicleError) {
    console.error("Delete linked vehicle records error:", vehicleError)

    throw new Error(
      getSupabaseErrorMessage(
        vehicleError,
        "Failed to delete linked vehicle records."
      )
    )
  }

  const { error: userError } = await supabase
    .from("university_users")
    .delete()
    .eq("id", userId)

  if (userError) {
    console.error("Delete university user error:", userError)

    throw new Error(
      getSupabaseErrorMessage(userError, "Failed to delete university user.")
    )
  }

  return userId
}

// =====================================================
// DELETE SINGLE VEHICLE RECORD
// =====================================================

export async function deleteVehicleRecord(vehicleId) {
  const { error } = await supabase
    .from("vehicle_records")
    .delete()
    .eq("id", vehicleId)

  if (error) {
    console.error("Delete vehicle record error:", error)

    throw new Error(
      getSupabaseErrorMessage(error, "Failed to delete vehicle record.")
    )
  }

  return vehicleId
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