// =====================================================
// ISSUE / SUPPORT DUMMY DATA
// =====================================================

export const issueTickets = [
  {
    id: "ISS-1001",
    title: "Payment deducted but reservation not confirmed",
    type: "Payment Issue",
    priority: "High",
    status: "Open",
    reportedBy: "Nur Aisyah",
    role: "Student",
    email: "b032310001@student.utem.edu.my",
    phone: "012-889 1021",
    relatedPlate: "MDA1234",
    relatedBay: "A-12",
    date: "15 May 2026",
    time: "9:18 AM",
    description:
      "Wallet balance was deducted for a reservation fee, but the reservation status still shows pending in the mobile app.",
    latestNote: "Needs payment transaction verification.",
  },
  {
    id: "ISS-1002",
    title: "ANPR detected wrong plate number",
    type: "ANPR Detection Issue",
    priority: "Critical",
    status: "Open",
    reportedBy: "Admin System",
    role: "System",
    email: "system@parkutem.com",
    phone: "-",
    relatedPlate: "WYY5510",
    relatedBay: "-",
    date: "15 May 2026",
    time: "9:25 AM",
    description:
      "Camera detected WYY5510 with low confidence. Plate requires manual review before access decision.",
    latestNote: "Flagged by ANPR confidence threshold.",
  },
  {
    id: "ISS-1003",
    title: "Reserved parking bay occupied by another vehicle",
    type: "Parking Bay Issue",
    priority: "High",
    status: "In Progress",
    reportedBy: "Muhammad Amir",
    role: "Staff",
    email: "amir.staff@utem.edu.my",
    phone: "013-772 1190",
    relatedPlate: "JKV9021",
    relatedBay: "B-03",
    date: "15 May 2026",
    time: "10:02 AM",
    description:
      "User arrived at reserved bay, but sensor showed the bay was occupied by another vehicle.",
    latestNote: "Checking sensor and ANPR entry log.",
  },
  {
    id: "ISS-1004",
    title: "Sticker approval still pending",
    type: "Sticker Issue",
    priority: "Medium",
    status: "Open",
    reportedBy: "Tan Wei Ming",
    role: "Student",
    email: "b032310044@student.utem.edu.my",
    phone: "011-220 5588",
    relatedPlate: "MEL7788",
    relatedBay: "-",
    date: "14 May 2026",
    time: "4:45 PM",
    description:
      "Vehicle sticker request was submitted but still pending after several days.",
    latestNote: "Pending admin document review.",
  },
  {
    id: "ISS-1005",
    title: "Unable to extend reservation duration",
    type: "Reservation Issue",
    priority: "Low",
    status: "Resolved",
    reportedBy: "Siti Hajar",
    role: "Student",
    email: "b032310088@student.utem.edu.my",
    phone: "019-445 2300",
    relatedPlate: "UTM8842",
    relatedBay: "C-09",
    date: "14 May 2026",
    time: "2:30 PM",
    description:
      "User could not extend reservation duration from the mobile app.",
    latestNote: "Resolved after frontend refresh.",
  },
  {
    id: "ISS-1006",
    title: "Guest booking receipt not received",
    type: "Payment Issue",
    priority: "Medium",
    status: "In Progress",
    reportedBy: "Daniel Lee",
    role: "Guest",
    email: "daniel.lee@email.com",
    phone: "016-777 9001",
    relatedPlate: "VST2098",
    relatedBay: "Visitor-04",
    date: "13 May 2026",
    time: "11:12 AM",
    description:
      "Guest payment was successful but the receipt email was not received.",
    latestNote: "Checking email delivery placeholder.",
  },
]

export const issueTypes = [
  "All Types",
  "Payment Issue",
  "ANPR Detection Issue",
  "Reservation Issue",
  "Sticker Issue",
  "Parking Bay Issue",
]

export const issueStatuses = ["All Status", "Open", "In Progress", "Resolved"]

export const issuePriorities = ["All Priority", "Critical", "High", "Medium", "Low"]