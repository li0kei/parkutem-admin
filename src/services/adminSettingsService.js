// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// DEFAULT ADMIN SETTINGS
// Used as fallback when Supabase setting rows are missing.
// =====================================================

export const defaultAdminSettings = {
  adminProfile: {
    name: "ParkUTeM Admin",
    email: "admin@parkutem.com",
    role: "System Administrator",
    department: "Campus Parking Operations",
    phone: "06-270 1000",
  },

  parkingPolicy: {
    freeStartTime: "07:00",
    freeEndTime: "19:00",
    afterHourRate: 1.5,
    afterHourRateUnit: "per hour",
    maxDailyCharge: 12,
    gracePeriodMinutes: 15,
  },

  reservationPolicy: {
    reservationFee: 2,
    reservationFeeType: "Fixed one-time fee",
    maxReservationHours: 4,
    cancellationWindowMinutes: 30,
    allowExtension: true,
  },

  guestPolicy: {
    guestParkingRate: 3,
    guestParkingRateUnit: "per booking",
    noShowGraceMinutes: 30,
    overstayEmailAfterMinutes: 60,
    autoRegisterPlateAfterPayment: true,
    requireAdminApproval: false,
    sendReceiptEmail: true,
    sendQrEmail: false,
  },

  anprPolicy: {
    minimumConfidence: 85,
    allowGuestAutoAccess: true,
    flagUnknownPlate: true,
    flagLowConfidence: true,
    cameraHealthCheck: true,
  },

  systemPreferences: {
    maintenanceMode: false,
    emailNotifications: true,
    issueAlerts: true,
    sensorAlerts: true,
    paymentAlerts: true,
  },
}

// =====================================================
// DATABASE SETTING KEY MAP
// =====================================================

const settingKeyMap = {
  admin_profile: "adminProfile",
  parking_policy: "parkingPolicy",
  reservation_policy: "reservationPolicy",
  guest_policy: "guestPolicy",
  anpr_policy: "anprPolicy",
  system_preferences: "systemPreferences",
}

const reverseSettingKeyMap = {
  adminProfile: "admin_profile",
  parkingPolicy: "parking_policy",
  reservationPolicy: "reservation_policy",
  guestPolicy: "guest_policy",
  anprPolicy: "anpr_policy",
  systemPreferences: "system_preferences",
}

// =====================================================
// CLONE DEFAULT SETTINGS
// =====================================================

function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(defaultAdminSettings))
}

// =====================================================
// GET SETTING GROUP
// =====================================================

function getSettingGroup(databaseKey) {
  const groupMap = {
    admin_profile: "admin",
    parking_policy: "parking",
    reservation_policy: "reservation",
    guest_policy: "guest",
    anpr_policy: "anpr",
    system_preferences: "system",
  }

  return groupMap[databaseKey] || "system"
}

// =====================================================
// MERGE SETTINGS WITH DEFAULTS
// Prevents missing Supabase fields from breaking frontend.
// =====================================================

function mergeSettingsWithDefaults(rows = []) {
  const mergedSettings = cloneDefaultSettings()

  rows.forEach((row) => {
    const frontendKey = settingKeyMap[row.setting_key]

    if (!frontendKey) {
      return
    }

    mergedSettings[frontendKey] = {
      ...mergedSettings[frontendKey],
      ...(row.setting_value || {}),
    }
  })

  return mergedSettings
}

// =====================================================
// LOAD ADMIN SETTINGS
// =====================================================

export async function loadAdminSettings() {
  const { data, error } = await supabase
    .from("system_settings")
    .select(
      `
      id,
      setting_key,
      setting_group,
      setting_value,
      description,
      created_at,
      updated_at
      `
    )
    .order("setting_group", { ascending: true })

  if (error) {
    console.error("Load admin settings error:", error)
    throw new Error(error.message || "Failed to load system settings.")
  }

  return mergeSettingsWithDefaults(data || [])
}

// =====================================================
// SAVE ADMIN SETTINGS
// =====================================================

export async function saveAdminSettings(settings) {
  const rows = Object.entries(reverseSettingKeyMap).map(
    ([frontendKey, databaseKey]) => ({
      setting_key: databaseKey,
      setting_group: getSettingGroup(databaseKey),
      setting_value: settings[frontendKey] || {},
      updated_at: new Date().toISOString(),
    })
  )

  const { error } = await supabase
    .from("system_settings")
    .upsert(rows, {
      onConflict: "setting_key",
    })

  if (error) {
    console.error("Save admin settings error:", error)
    throw new Error(error.message || "Failed to save system settings.")
  }

  return loadAdminSettings()
}

// =====================================================
// RESET ADMIN SETTINGS TO DEFAULTS
// =====================================================

export async function resetAdminSettings() {
  return saveAdminSettings(defaultAdminSettings)
}

// =====================================================
// SUBSCRIBE TO SETTINGS CHANGES
// =====================================================

export function subscribeToSettings(onChange) {
  const channel = supabase
    .channel("admin-system-settings")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "system_settings",
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

export function unsubscribeFromSettings(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}