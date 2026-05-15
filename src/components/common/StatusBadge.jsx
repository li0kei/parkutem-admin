// =====================================================
// STATUS BADGE STYLES
// =====================================================

const statusStyles = {
  // General
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
  Suspended: "bg-red-50 text-red-700",
  Completed: "bg-blue-50 text-blue-700",
  Cancelled: "bg-red-50 text-red-700",
  Expired: "bg-orange-50 text-orange-700",

  // Parking bay
  Available: "bg-emerald-50 text-emerald-700",
  Occupied: "bg-blue-50 text-blue-700",
  Reserved: "bg-amber-50 text-amber-700",
  Maintenance: "bg-red-50 text-red-700",

  // Sticker
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",

  // Sensor
  Online: "bg-emerald-50 text-emerald-700",
  Offline: "bg-slate-100 text-slate-600",
  Warning: "bg-orange-50 text-orange-700",

  // ANPR / access
  Enabled: "bg-cyan-50 text-cyan-700",
  Disabled: "bg-slate-100 text-slate-600",
  "Not Enabled": "bg-slate-100 text-slate-600",
  Blocked: "bg-red-50 text-red-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Flagged: "bg-red-50 text-red-700",
  Unknown: "bg-slate-100 text-slate-600",

  // Payment / activity
  Success: "bg-emerald-50 text-emerald-700",
  Paid: "bg-cyan-50 text-cyan-700",
  Free: "bg-emerald-50 text-emerald-700",
  Failed: "bg-red-50 text-red-700",
  Refunded: "bg-violet-50 text-violet-700",
  Upcoming: "bg-amber-50 text-amber-700",
  Charged: "bg-blue-50 text-blue-700",
  Verified: "bg-violet-50 text-violet-700",
  Sent: "bg-emerald-50 text-emerald-700",
  "Not Sent": "bg-slate-100 text-slate-600",

  // Entry status
  "Not Entered": "bg-slate-100 text-slate-600",
  Entered: "bg-emerald-50 text-emerald-700",
  Exited: "bg-blue-50 text-blue-700",

  // Issues
  Open: "bg-red-50 text-red-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
}

// =====================================================
// STATUS BADGE COMPONENT
// =====================================================

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1 text-xs font-black ${
        statusStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  )
}

export default StatusBadge