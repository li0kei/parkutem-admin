// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit3,
  Filter,
  LifeBuoy,
  Mail,
  MapPin,
  MoreVertical,
  ParkingCircle,
  Phone,
  Plus,
  Save,
  ScanLine,
  Search,
  Ticket,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react"

import StatusBadge from "../components/common/StatusBadge"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"
import IssueCreateModal from "../components/modals/IssueCreateModal"

import {
  issuePriorities,
  issueStatuses,
  issueTypes,
} from "../data/issues"

import {
  createSupportIssue,
  deleteSupportIssue,
  loadAdminSupportIssues,
  updateSupportIssue,
  updateSupportIssueStatus,
} from "../services/adminIssueService"

// =====================================================
// CONSTANTS
// =====================================================

const reporterTypes = ["Student", "Staff", "Guest", "System"]

const emptyEditForm = {
  title: "",
  type: "General Issue",
  priority: "Medium",
  status: "Open",
  reporterName: "",
  reporterType: "Student",
  reporterEmail: "",
  reporterPhone: "",
  relatedPlate: "",
  relatedBay: "",
  relatedBookingReference: "",
  description: "",
  latestNote: "",
  adminNotes: "",
}

// =====================================================
// MONTH HELPERS
// =====================================================

function getCurrentMonthValue() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

function getIssueDateValue(ticket) {
  return (
    ticket.raw?.created_at ||
    ticket.raw?.updated_at ||
    ticket.raw?.resolved_at ||
    null
  )
}

function isIssueInSelectedMonth(ticket, selectedMonth) {
  if (!selectedMonth) {
    return true
  }

  const issueDateValue = getIssueDateValue(ticket)

  if (!issueDateValue) {
    return false
  }

  const issueDate = new Date(issueDateValue)

  if (Number.isNaN(issueDate.getTime())) {
    return false
  }

  const issueMonth = `${issueDate.getFullYear()}-${String(
    issueDate.getMonth() + 1
  ).padStart(2, "0")}`

  return issueMonth === selectedMonth
}

function formatSelectedMonthLabel(selectedMonth) {
  if (!selectedMonth) {
    return "All months"
  }

  const [year, month] = selectedMonth.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  })
}

function buildEditFormFromTicket(ticket) {
  if (!ticket) {
    return emptyEditForm
  }

  return {
    title: ticket.title === "-" ? "" : ticket.title || "",
    type: ticket.type || "General Issue",
    priority: ticket.priority || "Medium",
    status: ticket.status || "Open",
    reporterName: ticket.reportedBy === "-" ? "" : ticket.reportedBy || "",
    reporterType: ticket.role || "Student",
    reporterEmail: ticket.email === "-" ? "" : ticket.email || "",
    reporterPhone: ticket.phone === "-" ? "" : ticket.phone || "",
    relatedPlate:
      ticket.relatedPlate === "-" ? "" : ticket.relatedPlate || "",
    relatedBay: ticket.relatedBay === "-" ? "" : ticket.relatedBay || "",
    relatedBookingReference:
      ticket.relatedBookingReference === "-"
        ? ""
        : ticket.relatedBookingReference || "",
    description: ticket.description === "-" ? "" : ticket.description || "",
    latestNote: ticket.latestNote === "-" ? "" : ticket.latestNote || "",
    adminNotes: ticket.raw?.admin_notes || "",
  }
}

// =====================================================
// ISSUE / SUPPORT MANAGEMENT PAGE
// =====================================================

function Issues() {
  const [tickets, setTickets] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All Types")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedPriority, setSelectedPriority] = useState("All Priority")
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue())

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketModalMode, setTicketModalMode] = useState("view")
  const [updatingTicketId, setUpdatingTicketId] = useState("")
  const [deletingTicketId, setDeletingTicketId] = useState("")

  // =====================================================
  // LOAD SUPPORT ISSUES FROM SUPABASE
  // =====================================================

  async function loadIssues({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const realIssues = await loadAdminSupportIssues()

      setTickets(realIssues)

      return realIssues
    } catch (error) {
      console.error("Failed to load support issues:", error)

      setLoadError(
        error.message || "Unable to load support issues from Supabase."
      )

      setTickets([])

      return []
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    void window.setTimeout(() => {
      void loadIssues()
    }, 0)
  }, [])

  // =====================================================
  // REALTIME REFRESH
  // =====================================================

  useAdminRealtimeRefresh({
    channelName: "admin-issues-realtime",
    tables: [
      "support_issues",
      "guest_bookings",
      "reservations",
      "anpr_logs",
      "vehicle_records",
      "parking_bays",
      "payment_transactions",
    ],
    onRefresh: () => {
      loadIssues({ silent: true })
    },
    onStatusChange: (statusInfo) => {
      console.log("Issues realtime:", statusInfo.label)
    },
  })

  // =====================================================
  // MONTHLY TICKET DATA
  // =====================================================

  const monthlyTickets = useMemo(() => {
    return tickets.filter((ticket) =>
      isIssueInSelectedMonth(ticket, selectedMonth)
    )
  }, [tickets, selectedMonth])

  // =====================================================
  // FILTERED TICKETS
  // =====================================================

  const filteredTickets = useMemo(() => {
    return monthlyTickets.filter((ticket) => {
      const searchValue = searchTerm.toLowerCase()

      const searchMatch =
        String(ticket.id || "").toLowerCase().includes(searchValue) ||
        String(ticket.title || "").toLowerCase().includes(searchValue) ||
        String(ticket.reportedBy || "").toLowerCase().includes(searchValue) ||
        String(ticket.relatedPlate || "").toLowerCase().includes(searchValue)

      const typeMatch =
        selectedType === "All Types" || ticket.type === selectedType

      const statusMatch =
        selectedStatus === "All Status" || ticket.status === selectedStatus

      const priorityMatch =
        selectedPriority === "All Priority" ||
        ticket.priority === selectedPriority

      return searchMatch && typeMatch && statusMatch && priorityMatch
    })
  }, [monthlyTickets, searchTerm, selectedType, selectedStatus, selectedPriority])

  // =====================================================
  // SUMMARY DATA
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: monthlyTickets.length,

      open: monthlyTickets.filter((ticket) => ticket.status === "Open").length,

      inProgress: monthlyTickets.filter(
        (ticket) => ticket.status === "In Progress"
      ).length,

      resolved: monthlyTickets.filter((ticket) => ticket.status === "Resolved")
        .length,

      critical: monthlyTickets.filter(
        (ticket) => ticket.priority === "Critical"
      ).length,

      high: monthlyTickets.filter((ticket) => ticket.priority === "High")
        .length,
    }
  }, [monthlyTickets])

  // =====================================================
  // UI HELPERS
  // =====================================================

  function clearFeedback() {
    setLoadError("")
    setSuccessMessage("")
  }

  function openTicketModal(ticket, mode = "view") {
    clearFeedback()
    setSelectedTicket(ticket)
    setTicketModalMode(mode)
  }

  function closeTicketModal() {
    setSelectedTicket(null)
    setTicketModalMode("view")
  }

  function syncSelectedTicket(ticketId, freshTickets) {
    const freshTicket = freshTickets.find((ticket) => ticket.id === ticketId)

    setSelectedTicket((currentTicket) => {
      if (!currentTicket || currentTicket.id !== ticketId) {
        return currentTicket
      }

      return freshTicket || null
    })

    return freshTicket
  }

  // =====================================================
  // CREATE ISSUE
  // =====================================================

  async function handleCreateIssue(issueDraft) {
    clearFeedback()

    try {
      await createSupportIssue(issueDraft)

      await loadIssues({ silent: true })

      setSuccessMessage("Support issue created successfully.")
    } catch (error) {
      console.error("Failed to create support issue:", error)

      setLoadError(
        error.message || "Unable to create support issue in Supabase."
      )

      throw error
    }
  }

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  async function handleStatusChange(ticketId, newStatus) {
    clearFeedback()

    const currentTicket = tickets.find((ticket) => ticket.id === ticketId)

    if (!currentTicket || currentTicket.status === newStatus) {
      return
    }

    if (newStatus === "Resolved") {
      const confirmed = window.confirm(
        `Mark ticket ${ticketId} as Resolved? This will set resolved_at in Supabase.`
      )

      if (!confirmed) {
        return
      }
    }

    setUpdatingTicketId(ticketId)

    try {
      await updateSupportIssueStatus(ticketId, newStatus)

      const freshTickets = await loadIssues({ silent: true })

      syncSelectedTicket(ticketId, freshTickets)

      setSuccessMessage(`Ticket ${ticketId} status updated to ${newStatus}.`)
    } catch (error) {
      console.error("Failed to update support issue status:", error)

      setLoadError(
        error.message || "Unable to update support issue status in Supabase."
      )
    } finally {
      setUpdatingTicketId("")
    }
  }

  // =====================================================
  // UPDATE ISSUE DETAILS
  // =====================================================

  async function handleUpdateTicket(ticketId, updateDraft) {
    clearFeedback()
    setUpdatingTicketId(ticketId)

    try {
      await updateSupportIssue(ticketId, updateDraft)

      const freshTickets = await loadIssues({ silent: true })
      const freshTicket = syncSelectedTicket(ticketId, freshTickets)

      if (freshTicket) {
        setTicketModalMode("view")
      }

      setSuccessMessage(`Ticket ${ticketId} updated successfully.`)

      return freshTicket
    } catch (error) {
      console.error("Failed to update support issue:", error)

      setLoadError(
        error.message || "Unable to update support issue in Supabase."
      )

      throw error
    } finally {
      setUpdatingTicketId("")
    }
  }

  // =====================================================
  // DELETE ISSUE
  // =====================================================

  async function handleDeleteTicket(ticketId) {
    clearFeedback()

    const confirmed = window.confirm(
      `Delete ticket ${ticketId}? This action cannot be undone because support_issues has no deleted_at column.`
    )

    if (!confirmed) {
      return
    }

    setDeletingTicketId(ticketId)

    try {
      await deleteSupportIssue(ticketId)

      await loadIssues({ silent: true })

      if (selectedTicket?.id === ticketId) {
        closeTicketModal()
      }

      setSuccessMessage(`Ticket ${ticketId} deleted successfully.`)
    } catch (error) {
      console.error("Failed to delete support issue:", error)

      setLoadError(
        error.message ||
          "Unable to delete support issue. Check admin RLS policy or related database restrictions."
      )
    } finally {
      setDeletingTicketId("")
    }
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function resetFilters() {
    setSearchTerm("")
    setSelectedType("All Types")
    setSelectedStatus("All Status")
    setSelectedPriority("All Priority")
    setSelectedMonth(getCurrentMonthValue())
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          SUPABASE LOAD STATUS
          ===================================================== */}

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {loadError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          Loading support issues from Supabase...
        </div>
      )}

      {/* =====================================================
          ISSUES OVERVIEW
          ===================================================== */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Support Operations
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Issue & Support Management
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Monitor reported payment, ANPR, reservation, sticker, and
                parking bay issues from one admin workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4">
              <p className="text-xs font-bold text-slate-400">Need Review</p>
              <p className="mt-1 text-2xl font-black text-cyan-300">
                {summary.open + summary.inProgress}
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <IssueSummaryCard
              label="Total Tickets"
              value={summary.total}
              icon={LifeBuoy}
              tone="cyan"
            />

            <IssueSummaryCard
              label="Open"
              value={summary.open}
              icon={AlertCircle}
              tone="red"
            />

            <IssueSummaryCard
              label="In Progress"
              value={summary.inProgress}
              icon={Clock3}
              tone="amber"
            />

            <IssueSummaryCard
              label="Resolved"
              value={summary.resolved}
              icon={CheckCircle2}
              tone="emerald"
            />

            <IssueSummaryCard
              label="Critical"
              value={summary.critical}
              icon={Wrench}
              tone="violet"
            />

            <IssueSummaryCard
              label="High Priority"
              value={summary.high}
              icon={Filter}
              tone="orange"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          MONTH FILTER PANEL
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Issue Month
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              {formatSelectedMonthLabel(selectedMonth)}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Support tickets, open issues, resolved cases, and priority counts
              are filtered by selected month.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-[52px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />

            <button
              type="button"
              onClick={() => setSelectedMonth(getCurrentMonthValue())}
              className="h-[52px] rounded-2xl border border-cyan-200 bg-cyan-50 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() => setSelectedMonth("")}
              className="h-[52px] rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              All Months
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Search
            </label>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search ticket, name, plate, or issue..."
                className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              />
            </div>
          </div>

          <FilterSelect
            label="Issue Type"
            value={selectedType}
            onChange={setSelectedType}
            options={issueTypes}
          />

          <FilterSelect
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={issueStatuses}
          />

          <FilterSelect
            label="Priority"
            value={selectedPriority}
            onChange={setSelectedPriority}
            options={issuePriorities}
          />

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="h-[52px] w-full rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 xl:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          TICKET LIST
          ===================================================== */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Support Ticket List
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredTickets.length} of {monthlyTickets.length} issue
              tickets.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="w-fit rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
              Supabase Support Tickets
            </span>

            <button
              type="button"
              onClick={() => {
                clearFeedback()
                setIsCreateModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Issue
            </button>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Plate / Bay</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <IssueTableRow
                  key={ticket.id}
                  ticket={ticket}
                  isUpdating={updatingTicketId === ticket.id}
                  isDeleting={deletingTicketId === ticket.id}
                  onStatusChange={handleStatusChange}
                  onView={() => openTicketModal(ticket, "view")}
                  onEdit={() => openTicketModal(ticket, "edit")}
                  onDelete={() => handleDeleteTicket(ticket.id)}
                />
              ))}

              {!isLoading && filteredTickets.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="font-black text-slate-800">
                      No support tickets found.
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Try changing the month, search term, or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 p-4 xl:hidden">
          {filteredTickets.map((ticket) => (
            <IssueMobileCard
              key={ticket.id}
              ticket={ticket}
              isUpdating={updatingTicketId === ticket.id}
              isDeleting={deletingTicketId === ticket.id}
              onStatusChange={handleStatusChange}
              onView={() => openTicketModal(ticket, "view")}
              onEdit={() => openTicketModal(ticket, "edit")}
              onDelete={() => handleDeleteTicket(ticket.id)}
            />
          ))}

          {!isLoading && filteredTickets.length === 0 && (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="font-black text-slate-800">
                No support tickets found.
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Try changing the month, search term, or filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedTicket && (
        <IssueDetailModal
          ticket={selectedTicket}
          mode={ticketModalMode}
          isUpdating={updatingTicketId === selectedTicket.id}
          isDeleting={deletingTicketId === selectedTicket.id}
          onClose={closeTicketModal}
          onModeChange={setTicketModalMode}
          onStatusChange={handleStatusChange}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
        />
      )}

      <IssueCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateIssue={handleCreateIssue}
      />
    </div>
  )
}

// =====================================================
// ISSUE SUMMARY CARD
// =====================================================

function IssueSummaryCard({ label, value, icon: Icon, tone }) {
  const toneClasses = {
    cyan: "bg-cyan-300/10 text-cyan-300",
    red: "bg-red-300/10 text-red-300",
    amber: "bg-amber-300/10 text-amber-300",
    emerald: "bg-emerald-300/10 text-emerald-300",
    violet: "bg-violet-300/10 text-violet-300",
    orange: "bg-orange-300/10 text-orange-300",
  }

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-300">{label}</p>
    </div>
  )
}

// =====================================================
// FILTER SELECT
// =====================================================

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

// =====================================================
// ISSUE TABLE ROW
// =====================================================

function IssueTableRow({
  ticket,
  isUpdating,
  isDeleting,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-6 py-5">
        <p className="font-black text-slate-950">{ticket.id}</p>
        <p className="mt-1 max-w-[280px] text-sm leading-6 text-slate-500">
          {ticket.title}
        </p>
      </td>

      <td className="px-6 py-5">
        <IssueTypeLabel type={ticket.type} />
      </td>

      <td className="px-6 py-5">
        <p className="font-bold text-slate-800">{ticket.reportedBy}</p>
        <p className="text-sm text-slate-500">{ticket.role}</p>
      </td>

      <td className="px-6 py-5">
        <p className="font-black text-slate-800">{ticket.relatedPlate}</p>
        <p className="text-sm text-slate-500">Bay: {ticket.relatedBay}</p>
      </td>

      <td className="px-6 py-5">
        <PriorityBadge priority={ticket.priority} />
      </td>

      <td className="px-6 py-5">
        <select
          value={ticket.status}
          disabled={isUpdating || isDeleting}
          onChange={(event) => onStatusChange(ticket.id, event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {issueStatuses
            .filter((status) => status !== "All Status")
            .map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
        </select>

        {isUpdating && (
          <p className="mt-2 text-xs font-bold text-cyan-600">Saving...</p>
        )}
      </td>

      <td className="px-6 py-5">
        <p className="font-bold text-slate-700">{ticket.date}</p>
        <p className="text-sm text-slate-500">{ticket.time}</p>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
          >
            View
          </button>

          <IssueActionMenu
            ticket={ticket}
            isBusy={isUpdating || isDeleting}
            onViewEdit={onEdit}
            onMarkInProgress={() =>
              onStatusChange(ticket.id, "In Progress")
            }
            onMarkResolved={() => onStatusChange(ticket.id, "Resolved")}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  )
}

// =====================================================
// ISSUE MOBILE CARD
// =====================================================

function IssueMobileCard({
  ticket,
  isUpdating,
  isDeleting,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-black text-slate-950">{ticket.id}</p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {ticket.title}
          </p>
        </div>

        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="mb-4 grid gap-3 text-sm text-slate-600">
        <InfoLine label="Type" value={ticket.type} />
        <InfoLine
          label="Reporter"
          value={`${ticket.reportedBy || "-"} (${ticket.role || "-"})`}
        />
        <InfoLine label="Plate" value={ticket.relatedPlate || "-"} />
        <InfoLine label="Bay" value={ticket.relatedBay || "-"} />
        <InfoLine label="Date" value={`${ticket.date}, ${ticket.time}`} />
      </div>

      <div className="flex gap-3">
        <select
          value={ticket.status}
          disabled={isUpdating || isDeleting}
          onChange={(event) => onStatusChange(ticket.id, event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {issueStatuses
            .filter((status) => status !== "All Status")
            .map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
        </select>

        <button
          type="button"
          onClick={onView}
          className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
        >
          View
        </button>

        <IssueActionMenu
          ticket={ticket}
          isBusy={isUpdating || isDeleting}
          onViewEdit={onEdit}
          onMarkInProgress={() => onStatusChange(ticket.id, "In Progress")}
          onMarkResolved={() => onStatusChange(ticket.id, "Resolved")}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

// =====================================================
// ISSUE ACTION MENU
// =====================================================

function IssueActionMenu({
  ticket,
  isBusy,
  onViewEdit,
  onMarkInProgress,
  onMarkResolved,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false)

  function handleMenuAction(action) {
    setIsOpen(false)
    action()
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={isBusy}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        title={`Actions for ${ticket.id}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close action menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-20 cursor-default bg-transparent"
          />

          <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <MenuButton
              icon={Edit3}
              label="View / Edit"
              onClick={() => handleMenuAction(onViewEdit)}
            />

            <MenuButton
              icon={Clock3}
              label="Mark In Progress"
              disabled={ticket.status === "In Progress"}
              onClick={() => handleMenuAction(onMarkInProgress)}
            />

            <MenuButton
              icon={CheckCircle2}
              label="Mark Resolved"
              disabled={ticket.status === "Resolved"}
              onClick={() => handleMenuAction(onMarkResolved)}
            />

            <div className="my-2 h-px bg-slate-100" />

            <MenuButton
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => handleMenuAction(onDelete)}
            />
          </div>
        </>
      )}
    </div>
  )
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

// =====================================================
// ISSUE DETAIL MODAL
// =====================================================

function IssueDetailModal({
  ticket,
  mode,
  isUpdating,
  isDeleting,
  onClose,
  onModeChange,
  onStatusChange,
  onUpdateTicket,
  onDeleteTicket,
}) {
  const [formData, setFormData] = useState(() =>
    buildEditFormFromTicket(ticket)
  )
  const [formError, setFormError] = useState("")

  useEffect(() => {
    void window.setTimeout(() => {
      setFormData(buildEditFormFromTicket(ticket))
      setFormError("")
    }, 0)
  }, [ticket])

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setFormError("")

    if (!formData.title.trim()) {
      setFormError("Issue title is required.")
      return
    }

    if (!formData.description.trim()) {
      setFormError("Issue description is required.")
      return
    }

    if (formData.status === "Resolved" && ticket.status !== "Resolved") {
      const confirmed = window.confirm(
        `Save changes and mark ticket ${ticket.id} as Resolved? This will set resolved_at in Supabase.`
      )

      if (!confirmed) {
        return
      }
    }

    try {
      await onUpdateTicket(ticket.id, formData)
    } catch (error) {
      setFormError(error.message || "Unable to save issue changes.")
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
              {mode === "edit" ? "Edit Ticket" : "Ticket Detail"}
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              {ticket.id}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {mode === "edit"
                ? "Update support issue details and save changes to Supabase."
                : "View support issue details and status progress."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mode === "view" ? (
              <button
                type="button"
                onClick={() => onModeChange("edit")}
                className="hidden rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-black text-cyan-700 transition hover:bg-cyan-100 sm:inline-flex"
              >
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormData(buildEditFormFromTicket(ticket))
                  setFormError("")
                  onModeChange("view")
                }}
                className="hidden rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mode === "edit" ? (
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {formError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                {formError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Issue Title"
                value={formData.title}
                onChange={(value) => updateField("title", value)}
                placeholder="Example: ANPR detected wrong plate number"
                required
                className="md:col-span-2"
              />

              <FormSelect
                label="Issue Type"
                value={formData.type}
                onChange={(value) => updateField("type", value)}
                options={issueTypes.filter((type) => type !== "All Types")}
              />

              <FormSelect
                label="Priority"
                value={formData.priority}
                onChange={(value) => updateField("priority", value)}
                options={issuePriorities.filter(
                  (priority) => priority !== "All Priority"
                )}
              />

              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(value) => updateField("status", value)}
                options={issueStatuses.filter(
                  (status) => status !== "All Status"
                )}
              />

              <FormSelect
                label="Reporter Type"
                value={formData.reporterType}
                onChange={(value) => updateField("reporterType", value)}
                options={reporterTypes}
              />

              <FormInput
                label="Reporter Name"
                value={formData.reporterName}
                onChange={(value) => updateField("reporterName", value)}
                placeholder="Reporter name"
              />

              <FormInput
                label="Reporter Email"
                value={formData.reporterEmail}
                onChange={(value) => updateField("reporterEmail", value)}
                placeholder="Optional"
              />

              <FormInput
                label="Reporter Phone"
                value={formData.reporterPhone}
                onChange={(value) => updateField("reporterPhone", value)}
                placeholder="Optional"
              />

              <FormInput
                label="Related Plate"
                value={formData.relatedPlate}
                onChange={(value) => updateField("relatedPlate", value)}
                placeholder="Example: WYY5510"
              />

              <FormInput
                label="Related Bay"
                value={formData.relatedBay}
                onChange={(value) => updateField("relatedBay", value)}
                placeholder="Example: D-05"
              />

              <FormInput
                label="Booking / Reservation Reference"
                value={formData.relatedBookingReference}
                onChange={(value) =>
                  updateField("relatedBookingReference", value)
                }
                placeholder="Optional"
                className="md:col-span-2"
              />
            </div>

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(value) => updateField("description", value)}
              placeholder="Describe the issue clearly..."
              required
            />

            <FormTextarea
              label="Latest Admin Note"
              value={formData.latestNote}
              onChange={(value) => updateField("latestNote", value)}
              placeholder="Update latest note for this issue..."
            />

            <FormTextarea
              label="Internal Admin Notes"
              value={formData.adminNotes}
              onChange={(value) => updateField("adminNotes", value)}
              placeholder="Optional internal admin notes..."
            />

            <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-black text-red-700">
                    Danger Area
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-red-600">
                    This table has no deleted_at column, so delete will remove
                    this ticket from support_issues.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isDeleting || isUpdating}
                  onClick={() => onDeleteTicket(ticket.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Ticket"}
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormData(buildEditFormFromTicket(ticket))
                  setFormError("")
                  onModeChange("view")
                }}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUpdating || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 p-6">
            {/* =====================================================
                TITLE + BADGES
                ===================================================== */}

            <div>
              <h4 className="text-2xl font-black leading-tight text-slate-950">
                {ticket.title}
              </h4>

              <div className="mt-4 flex flex-wrap gap-2">
                <IssueTypeLabel type={ticket.type} />
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            {/* =====================================================
                DESCRIPTION
                ===================================================== */}

            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Description
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {ticket.description || "-"}
              </p>
            </div>

            {/* =====================================================
                REPORTER INFO
                ===================================================== */}

            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Reporter Information
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailBox
                  icon={User}
                  label="Reporter Name"
                  value={ticket.reportedBy}
                />

                <DetailBox
                  icon={LifeBuoy}
                  label="Reporter Type"
                  value={ticket.role}
                />

                <DetailBox icon={Mail} label="Email" value={ticket.email} />

                <DetailBox icon={Phone} label="Phone" value={ticket.phone} />
              </div>
            </div>

            {/* =====================================================
                RELATED PARKING INFO
                ===================================================== */}

            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Related Parking Information
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailBox
                  icon={ParkingCircle}
                  label="Vehicle Plate"
                  value={ticket.relatedPlate}
                />

                <DetailBox
                  icon={MapPin}
                  label="Related Bay"
                  value={ticket.relatedBay}
                />

                <DetailBox
                  icon={Ticket}
                  label="Booking / Reservation Reference"
                  value={ticket.relatedBookingReference}
                />

                <DetailBox
                  icon={CalendarClock}
                  label="Reported"
                  value={`${ticket.date}, ${ticket.time}`}
                />
              </div>
            </div>

            {/* =====================================================
                ADMIN NOTE
                ===================================================== */}

            <div className="rounded-[1.5rem] border border-slate-200 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Latest Admin Note
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {ticket.latestNote || "-"}
              </p>
            </div>

            {/* =====================================================
                STATUS UPDATE
                ===================================================== */}

            <div className="flex flex-col justify-between gap-3 rounded-[1.5rem] bg-slate-950 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-slate-400">
                  Update Ticket Status
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  Saved to Supabase
                </p>
              </div>

              <select
                value={ticket.status}
                disabled={isUpdating || isDeleting}
                onChange={(event) =>
                  onStatusChange(ticket.id, event.target.value)
                }
                className="h-12 rounded-2xl border border-white/10 bg-white px-4 text-sm font-black text-slate-800 outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {issueStatuses
                  .filter((status) => status !== "All Status")
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
            </div>

            {/* =====================================================
                FOOTER ACTIONS
                ===================================================== */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              <button
                type="button"
                disabled={isDeleting || isUpdating}
                onClick={() => onDeleteTicket(ticket.id)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => onModeChange("edit")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// FORM INPUT
// =====================================================

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  )
}

// =====================================================
// FORM SELECT
// =====================================================

function FormSelect({ label, value, onChange, options }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

// =====================================================
// FORM TEXTAREA
// =====================================================

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <textarea
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  )
}

// =====================================================
// SMALL UI COMPONENTS
// =====================================================

function IssueTypeLabel({ type }) {
  const icons = {
    "Payment Issue": CircleDollarSign,
    "ANPR Detection Issue": ScanLine,
    "Reservation Issue": CalendarClock,
    "Sticker Issue": BadgeCheck,
    "Parking Bay Issue": ParkingCircle,
  }

  const Icon = icons[type] || LifeBuoy

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700">
      <Icon className="h-4 w-4" />
      {type}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const styles = {
    Critical: "bg-red-50 text-red-700",
    High: "bg-orange-50 text-orange-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bg-slate-100 text-slate-600",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        styles[priority] || styles.Low
      }`}
    >
      {priority}
    </span>
  )
}

// =====================================================
// DETAIL BOX
// =====================================================

function DetailBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-bold text-slate-800">
        {value || "-"}
      </p>
    </div>
  )
}

// =====================================================
// INFO LINE
// =====================================================

function InfoLine({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-bold text-slate-400">{label}</span>
      <span className="break-words text-right font-black text-slate-800">
        {value || "-"}
      </span>
    </div>
  )
}

export default Issues