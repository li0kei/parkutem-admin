// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// CONSTANTS
// =====================================================

const MAX_NOTIFICATIONS = 14

export const notificationRealtimeTables = [
  "guest_bookings",
  "payment_transactions",
  "anpr_logs",
  "reservations",
  "support_issues",
  "guest_email_logs",
  "parking_bays",
  "vehicle_records",
  "university_users",
]

// =====================================================
// FORMATTERS
// =====================================================

function normalizeText(value) {
  return String(value || "").trim().toLowerCase()
}

function formatRM(value) {
  return `RM ${Number(value || 0).toFixed(2)}`
}

export function formatNotificationTime(value) {
  if (!value) {
    return "Just now"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Just now"
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) {
    return "Just now"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// =====================================================
// NOTIFICATION BUILDER
// =====================================================

function buildNotification({
  id,
  category,
  title,
  description,
  tone = "cyan",
  path = "/dashboard",
  createdAt,
}) {
  const safeCreatedAt = createdAt || new Date().toISOString()

  return {
    id,
    category,
    title,
    description,
    tone,
    path,
    createdAt: safeCreatedAt,
    timeLabel: formatNotificationTime(safeCreatedAt),
  }
}

function sortLatest(notifications) {
  return notifications
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, MAX_NOTIFICATIONS)
}

// =====================================================
// GUEST BOOKING NOTIFICATIONS
// =====================================================

async function fetchGuestBookingNotifications() {
  const { data, error } = await supabase
    .from("guest_bookings")
    .select(
      `
      id,
      booking_reference,
      visitor_name,
      plate_number,
      payment_status,
      booking_status,
      anpr_access_status,
      expired_reason,
      paid_at,
      confirmed_at,
      expired_at,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return (data || []).map((booking) => {
    const bookingStatus = normalizeText(booking.booking_status)
    const paymentStatus = normalizeText(booking.payment_status)

    let title = "Guest booking updated"
    let tone = "cyan"

    if (bookingStatus === "confirmed" && paymentStatus === "paid") {
      title = "New guest booking confirmed"
      tone = "emerald"
    }

    if (bookingStatus === "expired") {
      title =
        booking.expired_reason === "no_show"
          ? "Guest booking marked no-show"
          : "Guest booking expired"
      tone = "red"
    }

    if (bookingStatus === "cancelled") {
      title = "Guest booking cancelled"
      tone = "red"
    }

    return buildNotification({
      id: `guest-${booking.id}-${bookingStatus}-${paymentStatus}`,
      category: "guest",
      title,
      description: `${booking.booking_reference || "Guest booking"} • ${
        booking.visitor_name || "Guest"
      } • ${booking.plate_number || "-"}`,
      tone,
      path: "/guest-bookings",
      createdAt:
        booking.expired_at ||
        booking.confirmed_at ||
        booking.paid_at ||
        booking.created_at,
    })
  })
}

// =====================================================
// ANPR NOTIFICATIONS
// =====================================================

async function fetchAnprNotifications() {
  const { data, error } = await supabase
    .from("anpr_logs")
    .select(
      `
      id,
      plate_number,
      normalized_plate_number,
      user_type,
      gate_location,
      parking_zone,
      confidence,
      access_status,
      access_decision,
      detected_at
    `
    )
    .order("detected_at", { ascending: false })
    .limit(8)

  if (error) {
    throw error
  }

  return (data || []).map((log) => {
    const accessStatus = normalizeText(log.access_status)
    const accessDecision = normalizeText(log.access_decision)

    const isApproved =
      accessStatus === "approved" || accessDecision === "allowed"

    const isFlagged = accessStatus === "flagged" || accessDecision === "review"

    let title = "ANPR detection recorded"
    let tone = "cyan"

    if (isApproved) {
      title = "Vehicle allowed through ANPR"
      tone = "emerald"
    }

    if (isFlagged) {
      title = "ANPR detection needs review"
      tone = "amber"
    }

    if (!isApproved && !isFlagged) {
      title = "Unknown plate detected"
      tone = "red"
    }

    return buildNotification({
      id: `anpr-${log.id}-${accessStatus}-${accessDecision}`,
      category: "anpr",
      title,
      description: `${log.plate_number || log.normalized_plate_number || "-"} • ${
        log.gate_location || "Gate"
      } • ${Number(log.confidence || 0)}% confidence`,
      tone,
      path: "/anpr-logs",
      createdAt: log.detected_at,
    })
  })
}

// =====================================================
// PAYMENT NOTIFICATIONS
// =====================================================

async function fetchPaymentNotifications() {
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      `
      id,
      payment_type,
      amount,
      payment_method,
      payment_status,
      transaction_reference,
      paid_at,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return (data || []).map((payment) => {
    const paymentStatus = normalizeText(payment.payment_status)

    let title = "Payment transaction updated"
    let tone = "cyan"

    if (paymentStatus === "paid") {
      title = "Payment received"
      tone = "emerald"
    }

    if (paymentStatus === "pending") {
      title = "Payment pending"
      tone = "amber"
    }

    if (paymentStatus === "failed") {
      title = "Payment failed"
      tone = "red"
    }

    if (paymentStatus === "refunded") {
      title = "Payment refunded"
      tone = "violet"
    }

    return buildNotification({
      id: `payment-${payment.id}-${paymentStatus}`,
      category: "payment",
      title,
      description: `${payment.transaction_reference || "Transaction"} • ${formatRM(
        payment.amount
      )}`,
      tone,
      path: "/payments",
      createdAt: payment.paid_at || payment.created_at,
    })
  })
}

// =====================================================
// RESERVATION NOTIFICATIONS
// =====================================================

async function fetchReservationNotifications() {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_reference,
      user_name,
      plate_number,
      status,
      reservation_start_at,
      created_at,
      updated_at
    `
    )
    .order("updated_at", { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return (data || []).map((reservation) => {
    const status = normalizeText(reservation.status)

    let title = "Reservation updated"
    let tone = "cyan"

    if (status === "active") {
      title = "Reservation is now active"
      tone = "emerald"
    }

    if (status === "completed") {
      title = "Reservation completed"
      tone = "blue"
    }

    if (status === "cancelled") {
      title = "Reservation cancelled"
      tone = "red"
    }

    return buildNotification({
      id: `reservation-${reservation.id}-${status}-${reservation.updated_at}`,
      category: "reservation",
      title,
      description: `${reservation.reservation_reference || "Reservation"} • ${
        reservation.user_name || "Student/Staff"
      } • ${reservation.plate_number || "-"}`,
      tone,
      path: "/reservations",
      createdAt: reservation.updated_at || reservation.created_at,
    })
  })
}

// =====================================================
// SUPPORT ISSUE NOTIFICATIONS
// =====================================================

async function fetchSupportIssueNotifications() {
  const { data, error } = await supabase
    .from("support_issues")
    .select(
      `
      id,
      issue_reference,
      title,
      priority,
      status,
      reporter_name,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return (data || []).map((issue) => {
    const priority = normalizeText(issue.priority)
    const status = normalizeText(issue.status)

    let title = "Support ticket updated"
    let tone = "cyan"

    if (status === "open") {
      title = "New support ticket submitted"
      tone = priority === "critical" ? "red" : "amber"
    }

    if (status === "in_progress") {
      title = "Support ticket in progress"
      tone = "blue"
    }

    if (status === "resolved") {
      title = "Support ticket resolved"
      tone = "emerald"
    }

    return buildNotification({
      id: `issue-${issue.id}-${status}-${issue.updated_at}`,
      category: "issue",
      title,
      description: `${issue.issue_reference || "Ticket"} • ${
        issue.title || "Support issue"
      }`,
      tone,
      path: "/issues",
      createdAt: issue.updated_at || issue.created_at,
    })
  })
}

// =====================================================
// GUEST EMAIL LOG NOTIFICATIONS
// =====================================================

async function fetchGuestEmailNotifications() {
  const { data, error } = await supabase
    .from("guest_email_logs")
    .select(
      `
      id,
      email_type,
      recipient_email,
      status,
      error_message,
      sent_at,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return (data || []).map((emailLog) => {
    const emailType = normalizeText(emailLog.email_type)
    const status = normalizeText(emailLog.status)

    let title = "Guest email updated"
    let tone = "blue"

    if (emailType === "booking_confirmation") {
      title = "Guest booking email sent"
      tone = "emerald"
    }

    if (emailType === "overstay_1h") {
      title = "Overstay alert email sent"
      tone = "amber"
    }

    if (status === "failed") {
      title = "Guest email failed"
      tone = "red"
    }

    return buildNotification({
      id: `guest-email-${emailLog.id}-${status}`,
      category: "email",
      title,
      description:
        status === "failed"
          ? emailLog.error_message || "Email delivery failed."
          : emailLog.recipient_email || "Guest email notification",
      tone,
      path: "/guest-bookings",
      createdAt: emailLog.sent_at || emailLog.created_at,
    })
  })
}

// =====================================================
// LOAD ADMIN NOTIFICATIONS
// =====================================================

export async function loadAdminNotifications() {
  const loaders = [
    fetchGuestBookingNotifications,
    fetchAnprNotifications,
    fetchPaymentNotifications,
    fetchReservationNotifications,
    fetchSupportIssueNotifications,
    fetchGuestEmailNotifications,
  ]

  const results = await Promise.allSettled(loaders.map((loader) => loader()))

  const notifications = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return result.value
    }

    console.warn("Admin notification warning:", result.reason?.message)
    return []
  })

  return sortLatest(notifications)
}