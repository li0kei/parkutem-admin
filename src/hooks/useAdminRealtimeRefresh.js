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
  debounceMs = 500,
}) {
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
    if (!enabled || !channelName || !Array.isArray(tables) || tables.length === 0) {
      return undefined
    }

    let isMounted = true

    const subscription = subscribeToAdminRealtime({
      channelName,
      tables,
      debounceMs,
      onChange: (payload) => {
        if (!isMounted) {
          return
        }

        refreshRef.current?.(payload)
      },
      onStatusChange: (statusInfo) => {
        if (!isMounted) {
          return
        }

        statusRef.current?.(statusInfo)
      },
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [enabled, channelName, tableKey, debounceMs])
}