// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleDollarSign,
  LifeBuoy,
  Mail,
  Radio,
  TicketCheck,
  X,
} from "lucide-react"

import { useAdminRealtimeRefresh } from "../../hooks/useAdminRealtimeRefresh"

import {
  loadAdminNotifications,
  notificationRealtimeTables,
} from "../../services/adminNotificationService"

// =====================================================
// LOCAL STORAGE KEY
// =====================================================

const READ_NOTIFICATION_KEY = "parkutem_admin_read_notifications"

// =====================================================
// LOCAL STORAGE HELPERS
// =====================================================

function getStoredReadNotificationIds() {
  try {
    const storedValue = localStorage.getItem(READ_NOTIFICATION_KEY)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    return Array.isArray(parsedValue) ? parsedValue : []
  } catch (error) {
    console.warn("Failed to read notification cache:", error)
    return []
  }
}

function saveStoredReadNotificationIds(ids) {
  try {
    localStorage.setItem(READ_NOTIFICATION_KEY, JSON.stringify(ids))
  } catch (error) {
    console.warn("Failed to save notification cache:", error)
  }
}

// =====================================================
// TONE STYLES
// =====================================================

const toneStyles = {
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
}

const unreadDotStyles = {
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
}

// =====================================================
// ADMIN NOTIFICATION BELL
// =====================================================

function AdminNotificationBell() {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(
    () => new Set(getStoredReadNotificationIds())
  )
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  async function loadNotifications({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const latestNotifications = await loadAdminNotifications()
      setNotifications(latestNotifications)
    } catch (error) {
      console.error("Failed to load admin notifications:", error)

      setLoadError(
        error.message || "Unable to load admin notifications from Supabase."
      )
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadNotifications()
  }, [])

  // =====================================================
  // REALTIME REFRESH
  // =====================================================

  useAdminRealtimeRefresh({
    channelName: "admin-notification-bell-realtime",
    tables: notificationRealtimeTables,
    onRefresh: () => {
      loadNotifications({ silent: true })
    },
    onStatusChange: (statusInfo) => {
      console.log("Notification realtime:", statusInfo.label)
    },
  })

  // =====================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =====================================================

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) {
        return
      }

      if (!dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !readIds.has(notification.id))
      .length
  }, [notifications, readIds])

  // =====================================================
  // UPDATE READ IDS
  // =====================================================

  function updateReadIds(updater) {
    setReadIds((currentReadIds) => {
      const nextReadIds = updater(new Set(currentReadIds))
      saveStoredReadNotificationIds(Array.from(nextReadIds))

      return nextReadIds
    })
  }

  // =====================================================
  // MARK NOTIFICATION AS READ
  // =====================================================

  function markNotificationAsRead(notificationId) {
    updateReadIds((nextReadIds) => {
      nextReadIds.add(notificationId)
      return nextReadIds
    })
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  function handleMarkAllAsRead() {
    updateReadIds((nextReadIds) => {
      notifications.forEach((notification) => {
        nextReadIds.add(notification.id)
      })

      return nextReadIds
    })
  }

  // =====================================================
  // HANDLE NOTIFICATION CLICK
  // =====================================================

  function handleNotificationClick(notification) {
    markNotificationAsRead(notification.id)
    setIsOpen(false)
    navigate(notification.path)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* =====================================================
          BELL BUTTON
          ===================================================== */}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-black text-white ring-4 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {unreadCount === 0 && (
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500" />
        )}
      </button>

      {/* =====================================================
          DROPDOWN
          ===================================================== */}

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-[26rem] overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
                Live Alerts
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-950">
                Admin Notifications
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-cyan-700"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {loadError && (
            <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {loadError}
            </div>
          )}

          {isLoading && (
            <div className="m-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
              Loading admin notifications...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Bell className="h-6 w-6" />
              </div>

              <p className="text-sm font-black text-slate-800">
                No notifications yet
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Realtime updates will appear here once parking events are
                recorded.
              </p>
            </div>
          )}

          {notifications.length > 0 && (
            <div className="max-h-[28rem] overflow-y-auto p-2">
              {notifications.map((notification) => {
                const isUnread = !readIds.has(notification.id)

                return (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isUnread={isUnread}
                    onClick={() => handleNotificationClick(notification)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =====================================================
// NOTIFICATION ITEM
// =====================================================

function NotificationItem({ notification, isUnread, onClick }) {
  const toneClass = toneStyles[notification.tone] || toneStyles.cyan
  const unreadDotClass =
    unreadDotStyles[notification.tone] || unreadDotStyles.cyan

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-2 flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50 ${
        isUnread ? "bg-cyan-50/50" : "bg-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClass}`}
      >
        <NotificationIcon category={notification.category} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-1 text-sm font-black text-slate-900">
            {notification.title}
          </p>

          {isUnread && (
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${unreadDotClass}`}
            />
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
          {notification.description}
        </p>

        <p className="mt-2 text-xs font-bold text-slate-400">
          {notification.timeLabel}
        </p>
      </div>
    </button>
  )
}

// =====================================================
// NOTIFICATION ICON
// =====================================================

function NotificationIcon({ category }) {
  const iconMap = {
    guest: TicketCheck,
    anpr: Radio,
    payment: CircleDollarSign,
    reservation: TicketCheck,
    issue: LifeBuoy,
    email: Mail,
  }

  const Icon = iconMap[category] || AlertTriangle

  return <Icon className="h-5 w-5" />
}

export default AdminNotificationBell
