// =====================================================
// PAYMENT FILTER OPTIONS
// Backend source: Supabase payment_transactions + reservations fallback
// =====================================================

export const payments = []

// =====================================================
// PAYMENT TYPE OPTIONS
// =====================================================

export const paymentTypeOptions = [
  "All Types",
  "Reservation Fee",
  "After 7PM Parking Fee",
  "Guest Parking Fee",
  "Wallet Top Up",
  "Refund",
]

// =====================================================
// PAYMENT STATUS OPTIONS
// =====================================================

export const paymentStatusOptions = [
  "All Status",
  "Paid",
  "Pending",
  "Failed",
  "Refunded",
]

// =====================================================
// PAYMENT USER TYPE OPTIONS
// =====================================================

export const paymentUserTypeOptions = [
  "All Users",
  "Student",
  "Staff",
  "Student/Staff",
  "Guest",
]

// =====================================================
// PAYMENT METHOD OPTIONS
// =====================================================

export const paymentMethodOptions = [
  "All Methods",
  "Simulated",
  "Wallet",
  "FPX",
  "Card",
  "TNG",
  "DuitNow",
  "Unknown",
]