// =====================================================
// VEHICLE & STICKER DUMMY DATA
// =====================================================

export const vehicles = [
  {
    id: 1,
    plateNumber: "MDA1234",
    vehicleModel: "Perodua Myvi",
    vehicleColor: "White",
    ownerName: "Ahmad Hakimi",
    universityId: "B032310123",
    userType: "Student",
    faculty: "FTMK",
    stickerStatus: "Active",
    anprStatus: "Enabled",
    registeredDate: "10 Jan 2026",
    expiryDate: "10 Jan 2027",
    remarks: "Active student vehicle sticker.",
  },
  {
    id: 2,
    plateNumber: "UTM8842",
    vehicleModel: "Honda City",
    vehicleColor: "Silver",
    ownerName: "Dr. Hafiz Rahman",
    universityId: "S019872",
    userType: "Staff",
    faculty: "FTMK",
    stickerStatus: "Active",
    anprStatus: "Enabled",
    registeredDate: "12 Jan 2026",
    expiryDate: "12 Jan 2027",
    remarks: "Staff vehicle with verified plate record.",
  },
  {
    id: 3,
    plateNumber: "JKV9021",
    vehicleModel: "Proton Iriz",
    vehicleColor: "Red",
    ownerName: "Siti Farah",
    universityId: "B032310456",
    userType: "Student",
    faculty: "FKEKK",
    stickerStatus: "Active",
    anprStatus: "Enabled",
    registeredDate: "18 Jan 2026",
    expiryDate: "18 Jan 2027",
    remarks: "Sticker verified by admin.",
  },
  {
    id: 4,
    plateNumber: "BKP4410",
    vehicleModel: "Toyota Vios",
    vehicleColor: "Black",
    ownerName: "Lim Wei Shen",
    universityId: "B032311004",
    userType: "Student",
    faculty: "FTMK",
    stickerStatus: "Pending",
    anprStatus: "Disabled",
    registeredDate: "14 May 2026",
    expiryDate: "-",
    remarks: "Waiting for admin sticker approval.",
  },
  {
    id: 5,
    plateNumber: "MCM2210",
    vehicleModel: "Mazda CX-5",
    vehicleColor: "Grey",
    ownerName: "Pn. Norliza",
    universityId: "S023441",
    userType: "Staff",
    faculty: "Registrar Office",
    stickerStatus: "Expired",
    anprStatus: "Disabled",
    registeredDate: "8 Jan 2025",
    expiryDate: "8 Jan 2026",
    remarks: "Sticker expired. Renewal required.",
  },
  {
    id: 6,
    plateNumber: "JTN4422",
    vehicleModel: "Perodua Axia",
    vehicleColor: "Blue",
    ownerName: "Nur Amirah",
    universityId: "B032312222",
    userType: "Student",
    faculty: "FPTT",
    stickerStatus: "Rejected",
    anprStatus: "Disabled",
    registeredDate: "13 May 2026",
    expiryDate: "-",
    remarks: "Sticker application rejected due to incomplete document.",
  },
  {
    id: 7,
    plateNumber: "WYY1209",
    vehicleModel: "Honda Jazz",
    vehicleColor: "White",
    ownerName: "Daniel Lee",
    universityId: "B032313333",
    userType: "Student",
    faculty: "FTMK",
    stickerStatus: "Active",
    anprStatus: "Enabled",
    registeredDate: "22 Feb 2026",
    expiryDate: "22 Feb 2027",
    remarks: "Active student vehicle record.",
  },
  {
    id: 8,
    plateNumber: "MEL2026",
    vehicleModel: "Nissan Almera",
    vehicleColor: "Black",
    ownerName: "En. Roslan",
    universityId: "S030145",
    userType: "Staff",
    faculty: "Facilities Unit",
    stickerStatus: "Pending",
    anprStatus: "Disabled",
    registeredDate: "15 May 2026",
    expiryDate: "-",
    remarks: "Pending staff vehicle verification.",
  },
]

// =====================================================
// FILTER OPTIONS
// =====================================================

export const vehicleUserTypeOptions = [
  "All Types",
  "Student",
  "Staff",
]

export const vehicleStickerStatusOptions = [
  "All Stickers",
  "Active",
  "Expired",
  "Pending",
  "Rejected",
]

export const vehicleAnprStatusOptions = [
  "All ANPR",
  "Enabled",
  "Disabled",
]

// =====================================================
// LIVE ALERTS DATA
// =====================================================

export const liveAlertsData = [
  {
    id: 1,
    title: "Unknown plate detected",
    description: "ABC9999 was detected at Main Gate but not found in student, staff, or guest records.",
    time: "Just now",
    category: "ANPR",
    status: "Flagged",
  },
  {
    id: 2,
    title: "Low ANPR confidence",
    description: "Plate WYY5510 was detected with 78% confidence. Manual review may be required.",
    time: "3 minutes ago",
    category: "ANPR",
    status: "Warning",
  },
  {
    id: 3,
    title: "Sensor battery warning",
    description: "Bay A-04 sensor battery is below 25%. Maintenance check recommended.",
    time: "8 minutes ago",
    category: "IoT Sensor",
    status: "Warning",
  },
  {
    id: 4,
    title: "Payment pending",
    description: "Guest booking GST-1004 payment is pending. ANPR access is not enabled yet.",
    time: "12 minutes ago",
    category: "Payment",
    status: "Pending",
  },
  {
    id: 5,
    title: "Reserved bay occupied",
    description: "Bay B-03 is reserved but sensor reports occupied. Admin review required.",
    time: "18 minutes ago",
    category: "Parking Bay",
    status: "Flagged",
  },
]