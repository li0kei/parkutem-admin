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
    refund: "Guest Refund",
  }

  return typeMap[cleanType] || "Guest Payment"
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

  if (cleanType === "refund") {
    return "Guest Refund"
  }

  return "Guest Web Portal"
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
      .not("guest_booking_id", "is", null)
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

  return {
    id: payment.id,

    transactionId: payment.transaction_reference || payment.id,
    type: paymentType,
    amount: Number(payment.amount || 0),

    userName: guestBooking?.visitor_name || "Guest",
    userType: "Guest",

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
// LOAD ADMIN PAYMENTS
// Guest-only active Admin view.
// Historical Student/Staff payment rows remain preserved in the database.
// =====================================================

export async function loadAdminPayments() {
  const payments = await fetchPaymentTransactions()

  return payments.map(mapPaymentForAdmin)
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
    .select("id, guest_booking_id, payment_provider")
    .eq("id", paymentId)
    .single()

  if (currentPaymentError) {
    console.error("Load payment before status update error:", currentPaymentError)
    throw new Error(
      currentPaymentError.message || "Failed to verify payment transaction."
    )
  }

  if (!currentPayment?.guest_booking_id) {
    throw new Error("Only Guest payment transactions are available in Admin Payments.")
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
  const watchedTables = ["payment_transactions", "guest_bookings"]

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
