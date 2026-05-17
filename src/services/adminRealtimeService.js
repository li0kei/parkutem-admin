// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// ADMIN REALTIME TABLES
// =====================================================

export const adminRealtimeTables = [
  "admin_users",
  "guest_bookings",
  "payment_transactions",
  "parking_zones",
  "parking_bays",
  "anpr_logs",
  "vehicle_records",
  "university_users",
  "reservations",
  "support_issues",
  "guest_email_logs",
]

// =====================================================
// REALTIME STATUS LABELS
// =====================================================

export const realtimeStatusLabels = {
  SUBSCRIBED: "Connected",
  CHANNEL_ERROR: "Connection Error",
  TIMED_OUT: "Timed Out",
  CLOSED: "Closed",
}

// =====================================================
// SUBSCRIBE TO ADMIN REALTIME CHANGES
// =====================================================

export function subscribeToAdminRealtime({
  channelName = "admin-realtime",
  tables = adminRealtimeTables,
  onChange,
  onStatusChange,
  debounceMs = 500,
}) {
  let refreshTimer = null

  const safeTables = Array.isArray(tables)
    ? [...new Set(tables)].filter(Boolean)
    : []

  const finalChannelName = `${channelName}-${Date.now()}`

  let channel = supabase.channel(finalChannelName)

  function scheduleRefresh(payload) {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    refreshTimer = setTimeout(() => {
      onChange?.(payload)
    }, debounceMs)
  }

  safeTables.forEach((table) => {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      (payload) => {
        scheduleRefresh(payload)
      }
    )
  })

  channel.subscribe((status, error) => {
    onStatusChange?.({
      status,
      label: realtimeStatusLabels[status] || status,
      error,
    })

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.warn("Admin realtime warning:", {
        channel: finalChannelName,
        status,
        error,
      })
    }
  })

  return {
    channel,
    unsubscribe: () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      supabase.removeChannel(channel)
    },
  }
}