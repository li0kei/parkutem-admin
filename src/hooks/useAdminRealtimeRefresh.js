// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useRef } from "react"
import { subscribeToAdminRealtime } from "../services/adminRealtimeService"

// =====================================================
// USE ADMIN REALTIME REFRESH
// =====================================================

export function useAdminRealtimeRefresh({
  channelName,
  tables,
  onRefresh,
  onStatusChange,
  enabled = true,
  debounceMs = 1200,
}) {
  // PARKUTEM_ADMIN_PHASE_08_R1_REALTIME_SMOOTHNESS
  const refreshRef = useRef(onRefresh)
  const statusRef = useRef(onStatusChange)

  useEffect(() => {
    refreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    statusRef.current = onStatusChange
  }, [onStatusChange])

  const tableKey = useMemo(() => {
    return Array.isArray(tables) ? tables.join("|") : ""
  }, [tables])

  useEffect(() => {
    const subscribedTables = tableKey
      .split("|")
      .map((table) => table.trim())
      .filter(Boolean)

    if (!enabled || !channelName || subscribedTables.length === 0) {
      return undefined
    }

    let isMounted = true
    let hiddenPayload = null

    function deliverRefresh(payload) {
      if (!isMounted) {
        return
      }

      if (document.visibilityState === "hidden") {
        hiddenPayload = payload
        return
      }

      hiddenPayload = null
      refreshRef.current?.(payload)
    }

    function handleVisibilityChange() {
      if (
        !isMounted ||
        document.visibilityState !== "visible" ||
        !hiddenPayload
      ) {
        return
      }

      const payload = hiddenPayload
      hiddenPayload = null
      refreshRef.current?.(payload)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    const subscription = subscribeToAdminRealtime({
      channelName,
      tables: subscribedTables,
      debounceMs,
      onChange: deliverRefresh,
      onStatusChange: (statusInfo) => {
        if (!isMounted) {
          return
        }

        statusRef.current?.(statusInfo)
      },
    })

    return () => {
      isMounted = false
      hiddenPayload = null
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      subscription.unsubscribe()
    }
  }, [channelName, debounceMs, enabled, tableKey])
}
