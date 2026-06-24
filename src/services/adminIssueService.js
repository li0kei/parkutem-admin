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
// FRIENDLY ERROR HANDLER
// =====================================================

function throwFriendlySupabaseError(error, fallbackMessage) {
  if (!error) {
    throw new Error(fallbackMessage)
  }

  const message = String(error.message || "").toLowerCase()
  const code = String(error.code || "")

  if (
    code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized")
  ) {
    throw new Error(
      "Supabase blocked this action. Please check the admin RLS policy for support_issues update/delete access."
    )
  }

  if (message.includes("duplicate key")) {
    throw new Error("A support issue with the same reference already exists.")
  }

  if (message.includes("violates check constraint")) {
    throw new Error(
      "The selected issue type, status, priority, or reporter type is not allowed by the support_issues table constraint."
    )
  }

  if (message.includes("foreign key")) {
    throw new Error(
      "This support issue cannot be deleted because it is linked to another record."
    )
  }

  throw new Error(error.message || fallbackMessage)
}

// =====================================================
// TEXT HELPERS
// =====================================================

function cleanRequiredText(value) {
  return String(value || "").trim()
}

function cleanOptionalText(value) {
  const cleanedValue = String(value || "").trim()

  return cleanedValue || null
}

// =====================================================
// UI TO DATABASE MAPPERS
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
    payment: "payment",
    anpr: "anpr",
    reservation: "reservation",
    sticker: "sticker",
    parking_bay: "parking_bay",
    general: "general",

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

function mapPriorityToDatabase(priority) {
  const priorityMap = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",

    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  }

  return priorityMap[priority] || "medium"
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

    open: "open",
    in_progress: "in_progress",
    resolved: "resolved",
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

function mapReporterTypeToDatabase(type) {
  const typeMap = {
    Student: "student",
    Staff: "staff",
    Guest: "guest",
    System: "system",

    student: "student",
    staff: "staff",
    guest: "guest",
    system: "system",
  }

  return typeMap[type] || "student"
}

// =====================================================
// SELECT COLUMNS
// =====================================================

const supportIssueSelectColumns = `
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

// =====================================================
// FETCH SUPPORT ISSUES
// =====================================================

export async function fetchSupportIssues() {
  const { data, error } = await supabase
    .from("support_issues")
    .select(supportIssueSelectColumns)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch support issues error:", error)

    throwFriendlySupabaseError(
      error,
      "Failed to fetch support issues from Supabase."
    )
  }

  return data || []
}

// =====================================================
// MAP SUPPORT ISSUE FOR ADMIN UI
// =====================================================

export function mapSupportIssueForAdmin(issue) {
  return {
    rawId: issue.id,

    // Existing UI displays ticket.id, so keep this as issue reference.
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
// GET SINGLE SUPPORT ISSUE BY REFERENCE
// =====================================================

export async function getSupportIssueByReference(issueReference) {
  if (!issueReference) {
    throw new Error("Issue reference is required.")
  }

  const { data, error } = await supabase
    .from("support_issues")
    .select(supportIssueSelectColumns)
    .eq("issue_reference", issueReference)
    .single()

  if (error) {
    console.error("Get support issue error:", error)

    throwFriendlySupabaseError(
      error,
      "Failed to get support issue from Supabase."
    )
  }

  return mapSupportIssueForAdmin(data)
}

// =====================================================
// UPDATE ISSUE STATUS
// =====================================================

export async function updateSupportIssueStatus(issueReference, newStatus) {
  if (!issueReference) {
    throw new Error("Issue reference is required.")
  }

  const dbStatus = mapStatusToDatabase(newStatus)
  const now = new Date().toISOString()

  const updatePayload = {
    status: dbStatus,
    updated_at: now,
  }

  if (dbStatus === "resolved") {
    updatePayload.resolved_at = now
    updatePayload.latest_note = "Issue marked as resolved by admin."
  } else {
    updatePayload.resolved_at = null
  }

  const { data, error } = await supabase
    .from("support_issues")
    .update(updatePayload)
    .eq("issue_reference", issueReference)
    .select(supportIssueSelectColumns)
    .single()

  if (error) {
    console.error("Update support issue status error:", error)

    throwFriendlySupabaseError(
      error,
      "Failed to update support issue status."
    )
  }

  return mapSupportIssueForAdmin(data)
}

// =====================================================
// UPDATE SUPPORT ISSUE DETAILS
// =====================================================

export async function updateSupportIssue(issueReference, issueDraft) {
  if (!issueReference) {
    throw new Error("Issue reference is required.")
  }

  const title = cleanRequiredText(issueDraft?.title)
  const description = cleanRequiredText(issueDraft?.description)

  if (!title) {
    throw new Error("Issue title is required.")
  }

  if (!description) {
    throw new Error("Issue description is required.")
  }

  const dbStatus = mapStatusToDatabase(issueDraft?.status)
  const now = new Date().toISOString()

  const updatePayload = {
    title,
    issue_type: mapIssueTypeToDatabase(issueDraft?.type),
    priority: mapPriorityToDatabase(issueDraft?.priority),
    status: dbStatus,

    reporter_name: cleanRequiredText(issueDraft?.reporterName) || "Admin",
    reporter_type: mapReporterTypeToDatabase(issueDraft?.reporterType),
    reporter_email: cleanOptionalText(issueDraft?.reporterEmail),
    reporter_phone: cleanOptionalText(issueDraft?.reporterPhone),

    related_plate: cleanOptionalText(issueDraft?.relatedPlate),
    related_bay: cleanOptionalText(issueDraft?.relatedBay),
    related_booking_reference: cleanOptionalText(
      issueDraft?.relatedBookingReference
    ),

    description,
    latest_note: cleanOptionalText(issueDraft?.latestNote),
    admin_notes: cleanOptionalText(issueDraft?.adminNotes),

    updated_at: now,
    resolved_at: dbStatus === "resolved" ? now : null,
  }

  const { data, error } = await supabase
    .from("support_issues")
    .update(updatePayload)
    .eq("issue_reference", issueReference)
    .select(supportIssueSelectColumns)
    .single()

  if (error) {
    console.error("Update support issue error:", error)

    throwFriendlySupabaseError(error, "Failed to update support issue.")
  }

  return mapSupportIssueForAdmin(data)
}

// =====================================================
// DELETE SUPPORT ISSUE
// Schema has no deleted_at column, so this is hard delete.
// =====================================================

export async function deleteSupportIssue(issueReference) {
  if (!issueReference) {
    throw new Error("Issue reference is required.")
  }

  const { data, error } = await supabase
    .from("support_issues")
    .delete()
    .eq("issue_reference", issueReference)
    .select("id, issue_reference")
    .single()

  if (error) {
    console.error("Delete support issue error:", error)

    throwFriendlySupabaseError(error, "Failed to delete support issue.")
  }

  return data
}

// =====================================================
// GENERATE ISSUE REFERENCE
// =====================================================

function generateIssueReference() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  const randomCode = Math.random().toString(16).slice(2, 6).toUpperCase()

  return `ISS-${year}${month}${day}-${randomCode}`
}

// =====================================================
// CREATE SUPPORT ISSUE
// =====================================================

export async function createSupportIssue(issueDraft) {
  const title = cleanRequiredText(issueDraft?.title)
  const description = cleanRequiredText(issueDraft?.description)

  if (!title) {
    throw new Error("Issue title is required.")
  }

  if (!description) {
    throw new Error("Issue description is required.")
  }

  const insertPayload = {
    issue_reference: generateIssueReference(),
    title,
    issue_type: mapIssueTypeToDatabase(issueDraft?.type),
    priority: mapPriorityToDatabase(issueDraft?.priority),
    status: "open",

    reporter_name: cleanRequiredText(issueDraft?.reporterName) || "Admin",
    reporter_type: "system",
    reporter_email: cleanOptionalText(issueDraft?.reporterEmail),
    reporter_phone: cleanOptionalText(issueDraft?.reporterPhone),

    related_plate: cleanOptionalText(issueDraft?.relatedPlate),
    related_bay: cleanOptionalText(issueDraft?.relatedBay),
    related_booking_reference: cleanOptionalText(
      issueDraft?.relatedBookingReference
    ),

    description,
    latest_note:
      cleanOptionalText(issueDraft?.latestNote) ||
      "Issue manually created by admin from ParkUTeM admin portal.",
    admin_notes:
      cleanOptionalText(issueDraft?.adminNotes) ||
      "Manual admin-created support ticket.",
  }

  const { data, error } = await supabase
    .from("support_issues")
    .insert(insertPayload)
    .select(supportIssueSelectColumns)
    .single()

  if (error) {
    console.error("Create support issue error:", error)

    throwFriendlySupabaseError(error, "Failed to create support issue.")
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