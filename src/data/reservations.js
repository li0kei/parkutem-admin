// =====================================================
// RESERVATION FALLBACK DATA
// Real source: Supabase reservations table
// =====================================================

export const reservations = []

// =====================================================
// RESERVATION STATUS OPTIONS
// UI label options used by Reservation Management filters.
// Database values remain lowercase in service layer.
// =====================================================

export const reservationStatusOptions = [
  "All Status",
  "Upcoming",
  "Active",
  "Completed",
  "Cancelled",
]

// =====================================================
// RESERVATION ZONE OPTIONS
// Fallback options for filter UI.
// Actual reservation list still reads real zone_name from Supabase.
// =====================================================

export const reservationZoneOptions = [
  "All Zones",
  "Zone A",
  "Zone B",
  "Zone C",
  "Zone D",
]

// =====================================================
// RESERVATION USER TYPE OPTIONS
// UI label options used by Reservation Management filters.
// Database values remain student/staff in service layer.
// =====================================================

export const reservationUserTypeOptions = [
  "All Types",
  "Student",
  "Staff",
]

// =====================================================
// RESERVATION FORM STATUS OPTIONS
// Used for create/edit reservation form if needed later.
// =====================================================

export const reservationFormStatusOptions = [
  {
    label: "Upcoming",
    value: "upcoming",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Completed",
    value: "completed",
  },
  {
    label: "Cancelled",
    value: "cancelled",
  },
]

// =====================================================
// PAYMENT CONSTANTS
// =====================================================

export const reservationPaymentRule = {
  reservationFee: 2,
  paymentType: "reservation_fee",
  paymentMethod: "wallet",
  paymentStatus: "paid",
}