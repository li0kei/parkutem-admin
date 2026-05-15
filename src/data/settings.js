// =====================================================
// SETTINGS DUMMY DATA
// =====================================================

export const adminProfile = {
  name: "ParkUTeM Admin",
  email: "admin@parkutem.com",
  role: "System Administrator",
  department: "Campus Parking Operations",
  phone: "06-270 1000",
}

export const parkingPolicy = {
  freeStartTime: "07:00",
  freeEndTime: "19:00",
  afterHourRate: 1.5,
  afterHourRateUnit: "per hour",
  maxDailyCharge: 12,
  gracePeriodMinutes: 15,
}

export const reservationPolicy = {
  reservationFee: 2,
  reservationFeeType: "Fixed one-time fee",
  maxReservationHours: 4,
  cancellationWindowMinutes: 30,
  allowExtension: true,
}

export const guestPolicy = {
  guestParkingRate: 3,
  guestParkingRateUnit: "per booking",
  autoRegisterPlateAfterPayment: true,
  requireAdminApproval: false,
  sendReceiptEmail: true,
  sendQrEmail: false,
}

export const anprPolicy = {
  minimumConfidence: 85,
  allowGuestAutoAccess: true,
  flagUnknownPlate: true,
  flagLowConfidence: true,
  cameraHealthCheck: true,
}

export const systemPreferences = {
  maintenanceMode: false,
  emailNotifications: true,
  issueAlerts: true,
  sensorAlerts: true,
  paymentAlerts: true,
}