// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// DATE FORMATTER
// =====================================================

export function formatAdminDateTime(value) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// =====================================================
// NORMALIZE TEXT
// =====================================================

function normalizeText(value) {
  return String(value || "").trim().toLowerCase()
}

// =====================================================
// PAYMENT TYPE MAPPER
// =====================================================

function mapPaymentType(type) {
  const cleanType = normalizeText(type)

  const typeMap = {
    guest_parking: "Guest Parking Fee",
    guest_parking_fee: "Guest Parking Fee",

    reservation_fee: "Reservation Fee",
    reservation: "Reservation Fee",

    parking_fee: "After 7PM Parking Fee",
    after_7_parking_fee: "After 7PM Parking Fee",
    after_7: "After 7PM Parking Fee",

    wallet_topup: "Wallet Top Up",
    wallet_top_up: "Wallet Top Up",
    topup: "Wallet Top Up",

    refund: "Refund",
  }

  return typeMap[cleanType] || "Payment"
}

// =====================================================
// PAYMENT METHOD MAPPER
// =====================================================

function mapPaymentMethod(method) {
  const cleanMethod = normalizeText(method)

  const methodMap = {
    simulated: "Simulated",
    fpx: "FPX",
    card: "Card",
    tng: "TNG",
    duitnow: "DuitNow",
    wallet: "Wallet",
  }

  return methodMap[cleanMethod] || "Unknown"
}

// =====================================================
// PAYMENT STATUS MAPPER
// =====================================================

function mapPaymentStatus(status) {
  const cleanStatus = normalizeText(status)

  const statusMap = {
    pending: "Pending",
    paid: "Paid",
    success: "Paid",
    completed: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  }

  return statusMap[cleanStatus] || "Pending"
}

// =====================================================
// SOURCE MAPPER
// =====================================================

function mapPaymentSource(type) {
  const cleanType = normalizeText(type)

  if (cleanType === "guest_parking" || cleanType === "guest_parking_fee") {
    return "Guest Web Portal"
  }

  if (cleanType === "wallet_topup" || cleanType === "wallet_top_up") {
    return "Student/Staff App"
  }

  if (
    cleanType === "parking_fee" ||
    cleanType === "after_7_parking_fee" ||
    cleanType === "after_7"
  ) {
    return "After-7PM Parking Charge"
  }

  if (cleanType === "reservation_fee" || cleanType === "reservation") {
    return "Reservation Module"
  }

  if (cleanType === "refund") {
    return "Refund Module"
  }

  return "ParkUTeM System"
}

// =====================================================
// CHECK RESERVATION PAYMENT TYPE
// Used to prevent duplicate fallback rows later.
// =====================================================

function isReservationPaymentType(type) {
  const cleanType = normalizeText(type)

  return [
    "reservation_fee",
    "reservation",
    "parking_fee",
    "after_7_parking_fee",
    "after_7",
  ].includes(cleanType)
}

// =====================================================
// FETCH PAYMENT TRANSACTIONS
// Source: payment_transactions
// =====================================================

export async function fetchPaymentTransactions() {
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      `
      id,
      payer_user_id,
      guest_booking_id,
      reservation_id,
      parking_session_id,
      payment_type,
      amount,
      payment_method,
      payment_status,
      transaction_reference,
      paid_at,
      created_at,
      guest_bookings (
        booking_reference,
        visitor_name,
        email,
        phone_number,
        plate_number,
        normalized_plate_number
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch payment transactions error:", error)
    throw new Error(error.message || "Failed to fetch payment transactions.")
  }

  return data || []
}

// =====================================================
// FETCH RESERVATION PAYMENT FALLBACKS
// Source: reservations table
// Temporary until reservation wallet deductions insert real rows
// into payment_transactions.
// =====================================================

export async function fetchReservationPaymentFallbacks() {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_reference,
      university_user_id,
      vehicle_record_id,
      bay_id,
      university_id,
      user_name,
      user_type,
      plate_number,
      normalized_plate_number,
      reservation_start_at,
      reservation_end_at,
      reservation_fee,
      after_7_parking_fee,
      payment_method,
      status,
      remarks,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch reservation payment fallback error:", error)
    throw new Error(
      error.message || "Failed to fetch reservation payment fallback records."
    )
  }

  return data || []
}

// =====================================================
// MAP PAYMENT TRANSACTION FOR ADMIN UI
// =====================================================

export function mapPaymentForAdmin(payment) {
  const guestBooking = payment.guest_bookings

  const paymentType = mapPaymentType(payment.payment_type)
  const paymentMethod = mapPaymentMethod(payment.payment_method)
  const status = mapPaymentStatus(payment.payment_status)

  const isGuestPayment =
    normalizeText(payment.payment_type) === "guest_parking" ||
    normalizeText(payment.payment_type) === "guest_parking_fee"

  return {
    id: payment.id,

    transactionId: payment.transaction_reference || payment.id,
    type: paymentType,
    amount: Number(payment.amount || 0),

    userName: isGuestPayment
      ? guestBooking?.visitor_name || "Guest"
      : "Student/Staff User",

    userType: isGuestPayment ? "Guest" : "Student/Staff",

    reference:
      guestBooking?.booking_reference ||
      payment.transaction_reference ||
      payment.id,

    vehiclePlate: guestBooking?.plate_number || "-",

    dateTime: formatAdminDateTime(payment.paid_at || payment.created_at),

    paymentMethod,
    status,
    source: mapPaymentSource(payment.payment_type),

    remarks:
      status === "Paid"
        ? `${paymentType} completed successfully through ${paymentMethod}.`
        : `${paymentType} is currently ${status.toLowerCase()}.`,

    raw: payment,
    dataSource: "payment_transactions",
  }
}

// =====================================================
// MAP RESERVATION FEE FALLBACK FOR ADMIN UI
// =====================================================

function mapReservationFeeFallbackForAdmin(reservation) {
  const status = reservation.status === "cancelled" ? "Refunded" : "Paid"

  return {
    id: `${reservation.id}-reservation-fee`,

    transactionId: `${reservation.reservation_reference}-FEE`,
    type: "Reservation Fee",
    amount: Number(reservation.reservation_fee || 0),

    userName: reservation.user_name || "Student/Staff User",
    userType:
      reservation.user_type === "student"
        ? "Student"
        : reservation.user_type === "staff"
          ? "Staff"
          : "Student/Staff",

    reference: reservation.reservation_reference,
    vehiclePlate: reservation.plate_number || "-",

    dateTime: formatAdminDateTime(reservation.created_at),

    paymentMethod: mapPaymentMethod(reservation.payment_method),
    status,
    source: "Reservation Module",

    remarks:
      status === "Paid"
        ? "Reservation fee is calculated from the reservations table until wallet deduction creates a real payment transaction."
        : "Reservation was cancelled. Refund handling will be connected through backend payment logic later.",

    raw: reservation,
    dataSource: "reservation_fallback",
  }
}

// =====================================================
// MAP AFTER 7PM PARKING FALLBACK FOR ADMIN UI
// =====================================================

function mapAfter7ParkingFallbackForAdmin(reservation) {
  const status = reservation.status === "cancelled" ? "Refunded" : "Paid"

  return {
    id: `${reservation.id}-after-7-parking-fee`,

    transactionId: `${reservation.reservation_reference}-A7`,
    type: "After 7PM Parking Fee",
    amount: Number(reservation.after_7_parking_fee || 0),

    userName: reservation.user_name || "Student/Staff User",
    userType:
      reservation.user_type === "student"
        ? "Student"
        : reservation.user_type === "staff"
          ? "Staff"
          : "Student/Staff",

    reference: reservation.reservation_reference,
    vehiclePlate: reservation.plate_number || "-",

    dateTime: formatAdminDateTime(reservation.reservation_start_at),

    paymentMethod: mapPaymentMethod(reservation.payment_method),
    status,
    source: "After-7PM Parking Charge",

    remarks:
      status === "Paid"
        ? "After-7PM parking fee is calculated from the reservation record until real parking session billing is connected."
        : "Reservation was cancelled. Refund handling will be connected through backend payment logic later.",

    raw: reservation,
    dataSource: "reservation_fallback",
  }
}

// =====================================================
// BUILD RESERVATION FALLBACK PAYMENT ROWS
// =====================================================

function buildReservationFallbackPaymentRows(reservations, existingPayments) {
  const existingReservationPaymentIds = new Set(
    existingPayments
      .filter((payment) => isReservationPaymentType(payment.payment_type))
      .map((payment) => payment.reservation_id)
      .filter(Boolean)
  )

  return (reservations || []).flatMap((reservation) => {
    if (existingReservationPaymentIds.has(reservation.id)) {
      return []
    }

    const rows = []

    if (Number(reservation.reservation_fee || 0) > 0) {
      rows.push(mapReservationFeeFallbackForAdmin(reservation))
    }

    if (Number(reservation.after_7_parking_fee || 0) > 0) {
      rows.push(mapAfter7ParkingFallbackForAdmin(reservation))
    }

    return rows
  })
}

// =====================================================
// LOAD ADMIN PAYMENTS
// =====================================================

export async function loadAdminPayments() {
  const [payments, reservations] = await Promise.all([
    fetchPaymentTransactions(),
    fetchReservationPaymentFallbacks(),
  ])

  const mappedPayments = payments.map(mapPaymentForAdmin)
  const fallbackPayments = buildReservationFallbackPaymentRows(
    reservations,
    payments
  )

  return [...mappedPayments, ...fallbackPayments].sort((a, b) => {
    const firstDate = new Date(a.raw?.paid_at || a.raw?.created_at || 0)
    const secondDate = new Date(b.raw?.paid_at || b.raw?.created_at || 0)

    return secondDate - firstDate
  })
}

// =====================================================
// MAP ADMIN PAYMENT STATUS TO DATABASE STATUS
// =====================================================

function mapAdminStatusToDatabase(status) {
  const statusMap = {
    Pending: "pending",
    Paid: "paid",
    Failed: "failed",
    Refunded: "refunded",
  }

  return statusMap[status] || normalizeText(status)
}

// =====================================================
// UPDATE PAYMENT TRANSACTION STATUS
// Source: payment_transactions
// =====================================================

export async function updatePaymentTransactionStatus(paymentId, newStatus) {
  if (!paymentId) {
    throw new Error("Payment ID is required.")
  }

  const databaseStatus = mapAdminStatusToDatabase(newStatus)

  const updatePayload = {
    payment_status: databaseStatus,
  }

  if (databaseStatus === "paid") {
    updatePayload.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .update(updatePayload)
    .eq("id", paymentId)
    .select(
      `
      id,
      payer_user_id,
      guest_booking_id,
      reservation_id,
      parking_session_id,
      payment_type,
      amount,
      payment_method,
      payment_status,
      transaction_reference,
      paid_at,
      created_at,
      guest_bookings (
        booking_reference,
        visitor_name,
        email,
        phone_number,
        plate_number,
        normalized_plate_number
      )
    `
    )
    .single()

  if (error) {
    console.error("Update payment transaction status error:", error)
    throw new Error(error.message || "Failed to update payment status.")
  }

  return mapPaymentForAdmin(data)
}

// =====================================================
// SUBSCRIBE TO PAYMENT CHANGES
// =====================================================

export function subscribeToPayments(onChange) {
  const watchedTables = ["payment_transactions", "reservations"]

  let channel = supabase.channel("admin-payment-transactions")

  watchedTables.forEach((table) => {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      () => {
        onChange?.()
      }
    )
  })

  channel.subscribe()

  return channel
}

// =====================================================
// REMOVE SUBSCRIPTION
// =====================================================

export function unsubscribeFromPayments(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}