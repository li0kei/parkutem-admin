// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// FORMAT DATE TIME
// =====================================================

function formatAdminDate(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatAdminTime(value) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// =====================================================
// MAPPERS
// =====================================================

function mapIssueType(type) {
  const typeMap = {
    payment: "Payment Issue",
    anpr: "ANPR Detection Issue",
    reservation: "Reservation Issue",
    sticker: "Sticker Issue",
    parking_bay: "Parking Bay Issue",
    general: "General Issue",
  }

  return typeMap[type] || "General Issue"
}

function mapIssueTypeToDatabase(type) {
  const typeMap = {
    "Payment Issue": "payment",
    "ANPR Detection Issue": "anpr",
    "Reservation Issue": "reservation",
    "Sticker Issue": "sticker",
    "Parking Bay Issue": "parking_bay",
    "General Issue": "general",
  }

  return typeMap[type] || "general"
}

function mapPriority(priority) {
  const priorityMap = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  }

  return priorityMap[priority] || "Medium"
}

function mapStatus(status) {
  const statusMap = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
  }

  return statusMap[status] || "Open"
}

function mapStatusToDatabase(status) {
  const statusMap = {
    Open: "open",
    "In Progress": "in_progress",
    Resolved: "resolved",
  }

  return statusMap[status] || "open"
}

function mapReporterType(type) {
  const typeMap = {
    student: "Student",
    staff: "Staff",
    guest: "Guest",
    system: "System",
  }

  return typeMap[type] || "Student"
}

// =====================================================
// FETCH SUPPORT ISSUES
// =====================================================

export async function fetchSupportIssues() {
  const { data, error } = await supabase
    .from("support_issues")
    .select(
      `
      id,
      issue_reference,
      title,
      issue_type,
      priority,
      status,
      reporter_name,
      reporter_type,
      reporter_email,
      reporter_phone,
      related_plate,
      related_bay,
      related_booking_reference,
      description,
      latest_note,
      admin_notes,
      resolved_at,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch support issues error:", error)
    throw new Error(error.message || "Failed to fetch support issues.")
  }

  return data || []
}

// =====================================================
// MAP SUPPORT ISSUE FOR ADMIN UI
// =====================================================

export function mapSupportIssueForAdmin(issue) {
  return {
    rawId: issue.id,

    // Keep id as reference because existing UI displays ticket.id
    id: issue.issue_reference,

    title: issue.title || "-",
    type: mapIssueType(issue.issue_type),
    priority: mapPriority(issue.priority),
    status: mapStatus(issue.status),

    reportedBy: issue.reporter_name || "-",
    role: mapReporterType(issue.reporter_type),

    email: issue.reporter_email || "-",
    phone: issue.reporter_phone || "-",

    relatedPlate: issue.related_plate || "-",
    relatedBay: issue.related_bay || "-",
    relatedBookingReference: issue.related_booking_reference || "-",

    date: formatAdminDate(issue.created_at),
    time: formatAdminTime(issue.created_at),

    description: issue.description || "-",
    latestNote: issue.latest_note || issue.admin_notes || "-",

    raw: issue,
    source: "supabase",
  }
}

// =====================================================
// LOAD ADMIN SUPPORT ISSUES
// =====================================================

export async function loadAdminSupportIssues() {
  const issues = await fetchSupportIssues()

  return issues.map(mapSupportIssueForAdmin)
}

// =====================================================
// UPDATE ISSUE STATUS
// =====================================================

export async function updateSupportIssueStatus(issueReference, newStatus) {
  const dbStatus = mapStatusToDatabase(newStatus)

  const updatePayload = {
    status: dbStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === "Resolved") {
    updatePayload.resolved_at = new Date().toISOString()
    updatePayload.latest_note = "Issue marked as resolved by admin."
  }

  if (newStatus !== "Resolved") {
    updatePayload.resolved_at = null
  }

  const { data, error } = await supabase
    .from("support_issues")
    .update(updatePayload)
    .eq("issue_reference", issueReference)
    .select()
    .single()

  if (error) {
    console.error("Update support issue status error:", error)
    throw new Error(error.message || "Failed to update issue status.")
  }

  return mapSupportIssueForAdmin(data)
}

// =====================================================
// SUBSCRIBE TO SUPPORT ISSUE CHANGES
// =====================================================

export function subscribeToSupportIssues(onChange) {
  const channel = supabase
    .channel("admin-support-issues")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_issues",
      },
      () => {
        onChange?.()
      }
    )
    .subscribe()

  return channel
}

// =====================================================
// REMOVE SUBSCRIPTION
// =====================================================

export function unsubscribeFromSupportIssues(channel) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}