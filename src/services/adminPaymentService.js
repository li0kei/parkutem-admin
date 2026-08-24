// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// PARKUTEM_PHASE_06B_PAYMENT_BATCH_PAGINATION
const PAYMENT_FETCH_BATCH_SIZE = 500

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
// PAYMENT PROVIDER MAPPERS
// =====================================================

function mapPaymentProvider(provider) {
  const cleanProvider = normalizeText(provider)

  if (!cleanProvider) {
    return "-"
  }

  const providerMap = {
    billplz: "Billplz",
  }

  return (
    providerMap[cleanProvider] ||
    cleanProvider.charAt(0).toUpperCase() + cleanProvider.slice(1)
  )
}

function mapProviderStatus(status) {
  const cleanStatus = normalizeText(status)

  if (!cleanStatus) {
    return "-"
  }

  const statusMap = {
    due: "Due",
    paid: "Paid",
    deleted: "Deleted",
    failed: "Failed",
    pending: "Pending",
  }

  return (
    statusMap[cleanStatus] ||
    cleanStatus
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

function mapProviderReason(reason) {
  const cleanReason = String(reason || "").trim()

  if (!cleanReason) {
    return "-"
  }

  return cleanReason.replaceAll("_", " ")
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
// Fetches in 500-row ranges to avoid Supabase response row caps.
// =====================================================

export async function fetchPaymentTransactions() {
  const allPayments = []

  for (let from = 0; ; from += PAYMENT_FETCH_BATCH_SIZE) {
    const to = from + PAYMENT_FETCH_BATCH_SIZE - 1

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
        payment_provider,
        provider_bill_id,
        provider_reference,
        provider_status,
        provider_reason,
        provider_updated_at,
        paid_at,
        created_at,
        updated_at,
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
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch payment transactions error:", error)
      throw new Error(error.message || "Failed to fetch payment transactions.")
    }

    const batch = data || []
    allPayments.push(...batch)

    if (batch.length < PAYMENT_FETCH_BATCH_SIZE) {
      break
    }
  }

  return allPayments
}

// =====================================================
// FETCH RESERVATION PAYMENT FALLBACKS
// Source: reservations table
// Temporary until all reservation billing creates transaction rows.
// Fetches in 500-row ranges to avoid Supabase response row caps.
// =====================================================

export async function fetchReservationPaymentFallbacks() {
  const allReservations = []

  for (let from = 0; ; from += PAYMENT_FETCH_BATCH_SIZE) {
    const to = from + PAYMENT_FETCH_BATCH_SIZE - 1

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
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Fetch reservation payment fallback error:", error)
      throw new Error(
        error.message || "Failed to fetch reservation payment fallback records."
      )
    }

    const batch = data || []
    allReservations.push(...batch)

    if (batch.length < PAYMENT_FETCH_BATCH_SIZE) {
      break
    }
  }

  return allReservations
}

// =====================================================
// MAP PAYMENT TRANSACTION FOR ADMIN UI
// =====================================================

export function mapPaymentForAdmin(payment) {
  const guestBooking = payment.guest_bookings

  const paymentType = mapPaymentType(payment.payment_type)
  const paymentMethod = mapPaymentMethod(payment.payment_method)
  const status = mapPaymentStatus(payment.payment_status)

  const cleanProvider = normalizeText(payment.payment_provider)
  const isProviderManaged = Boolean(cleanProvider)
  const isBillplz = cleanProvider === "billplz"

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

    paymentProvider: mapPaymentProvider(payment.payment_provider),
    providerBillId: payment.provider_bill_id || "-",
    providerReference: payment.provider_reference || "-",
    providerStatus: mapProviderStatus(payment.provider_status),
    providerReason: mapProviderReason(payment.provider_reason),
    providerUpdatedAt: formatAdminDateTime(payment.provider_updated_at),

    isProviderManaged,
    isBillplz,

    remarks:
      isBillplz && status === "Paid"
        ? `${paymentType} was verified through Billplz and recorded as ${paymentMethod}.`
        : status === "Paid"
          ? `${paymentType} completed successfully through ${paymentMethod}.`
          : `${paymentType} is currently ${status.toLowerCase()}.`,

    raw: payment,
    dataSource: "payment_transactions",
  }
}

// =====================================================
// FALLBACK PROVIDER FIELDS
// =====================================================

function getFallbackProviderFields() {
  return {
    paymentProvider: "-",
    providerBillId: "-",
    providerReference: "-",
    providerStatus: "-",
    providerReason: "-",
    providerUpdatedAt: "-",
    isProviderManaged: false,
    isBillplz: false,
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

    ...getFallbackProviderFields(),

    remarks:
      status === "Paid"
        ? "Reservation fee is calculated from the reservations table when no real payment transaction exists."
        : "Reservation was cancelled. Refund handling requires backend payment logic.",

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

    ...getFallbackProviderFields(),

    remarks:
      status === "Paid"
        ? "After-7PM parking fee is calculated from the reservation record when no real parking-session payment exists."
        : "Reservation was cancelled. Refund handling requires backend payment logic.",

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
    const firstDate = new Date(
      a.raw?.paid_at || a.raw?.created_at || a.raw?.reservation_start_at || 0
    )

    const secondDate = new Date(
      b.raw?.paid_at || b.raw?.created_at || b.raw?.reservation_start_at || 0
    )

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
// Retained only for non-provider-managed internal transactions.
// Billplz/provider-managed rows are strictly read-only here.
// =====================================================

export async function updatePaymentTransactionStatus(paymentId, newStatus) {
  if (!paymentId) {
    throw new Error("Payment ID is required.")
  }

  const { data: currentPayment, error: currentPaymentError } = await supabase
    .from("payment_transactions")
    .select("id, payment_provider")
    .eq("id", paymentId)
    .single()

  if (currentPaymentError) {
    console.error("Load payment before status update error:", currentPaymentError)
    throw new Error(
      currentPaymentError.message || "Failed to verify payment transaction."
    )
  }

  if (normalizeText(currentPayment?.payment_provider)) {
    throw new Error(
      "Provider-managed payment status is read-only. It must be updated by the verified payment provider callback."
    )
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
      payment_provider,
      provider_bill_id,
      provider_reference,
      provider_status,
      provider_reason,
      provider_updated_at,
      paid_at,
      created_at,
      updated_at,
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