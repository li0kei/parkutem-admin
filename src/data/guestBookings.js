// =====================================================
// GUEST BOOKING FILTER OPTIONS
// Backend source: Supabase guest_bookings table
// =====================================================

export const guestBookingStatusOptions = [
  "All Status",
  "Pending Payment",
  "Confirmed",
  "Expired",
  "Cancelled",
]

// =====================================================
// GUEST PAYMENT STATUS OPTIONS
// =====================================================

export const guestPaymentStatusOptions = [
  "All Payments",
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
]

// =====================================================
// GUEST ANPR ACCESS OPTIONS
// =====================================================

export const guestAnprAccessOptions = [
  "All ANPR",
  "Enabled",
  "Not Enabled",
  "Expired",
  "Blocked",
]

// =====================================================
// GUEST ENTRY STATUS OPTIONS
// Entry/exit will be connected to ANPR logs later.
// =====================================================

export const guestEntryStatusOptions = [
  "All Entry",
  "Not Entered",
  "Entered",
  "Exited",
  "Overstay",
]

// =====================================================
// LEGACY EMPTY FALLBACK
// Dummy guest booking data has been removed after Supabase integration.
// Keep this export temporarily so old imports do not break.
// =====================================================

export const guestBookings = []