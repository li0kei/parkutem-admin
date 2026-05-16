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
  Filter,
  LifeBuoy,
  Mail,
  ParkingCircle,
  Phone,
  ScanLine,
  Search,
  Wrench,
  X,
} from "lucide-react"

import StatusBadge from "../components/common/StatusBadge"

import {
  issuePriorities,
  issueStatuses,
  issueTickets,
  issueTypes,
} from "../data/issues"

import {
  loadAdminSupportIssues,
  subscribeToSupportIssues,
  unsubscribeFromSupportIssues,
  updateSupportIssueStatus,
} from "../services/adminIssueService"

// =====================================================
// ISSUE / SUPPORT MANAGEMENT PAGE
// =====================================================

function Issues() {
  const [tickets, setTickets] = useState(issueTickets)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All Types")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedPriority, setSelectedPriority] = useState("All Priority")
  const [selectedTicket, setSelectedTicket] = useState(null)

    // =====================================================
  // LOAD SUPPORT ISSUES FROM SUPABASE
  // =====================================================

  async function loadIssues() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realIssues = await loadAdminSupportIssues()

      setTickets(realIssues)
    } catch (error) {
      console.error("Failed to load support issues:", error)

      setLoadError(
        error.message || "Unable to load support issues from Supabase."
      )

      setTickets(issueTickets)
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD + REALTIME SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    loadIssues()

    const channel = subscribeToSupportIssues(() => {
      loadIssues()
    })

    return () => {
      unsubscribeFromSupportIssues(channel)
    }
  }, [])

  // =====================================================
  // FILTERED TICKETS
  // =====================================================

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {

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
  }, [tickets, searchTerm, selectedType, selectedStatus, selectedPriority])

  // =====================================================
  // SUMMARY DATA
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "Open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "In Progress")
        .length,
      resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
      critical: tickets.filter((ticket) => ticket.priority === "Critical")
        .length,
      high: tickets.filter((ticket) => ticket.priority === "High").length,
    }
  }, [tickets])

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  async function handleStatusChange(ticketId, newStatus) {
    try {
      const updatedTicket = await updateSupportIssueStatus(ticketId, newStatus)

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === ticketId ? updatedTicket : ticket
        )
      )

      setSelectedTicket((currentTicket) =>
        currentTicket && currentTicket.id === ticketId
          ? updatedTicket
          : currentTicket
      )
    } catch (error) {
      console.error("Failed to update support issue:", error)

      setLoadError(
        error.message || "Unable to update support issue status in Supabase."
      )
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
                className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
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
              Showing {filteredTickets.length} of {tickets.length} issue tickets.
            </p>
          </div>

          <span className="w-fit rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
            Supabase Support Tickets
          </span>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Plate / Bay</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <IssueTableRow
                  key={ticket.id}
                  ticket={ticket}
                  onStatusChange={handleStatusChange}
                  onView={() => setSelectedTicket(ticket)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 p-4 xl:hidden">
          {filteredTickets.map((ticket) => (
            <IssueMobileCard
              key={ticket.id}
              ticket={ticket}
              onStatusChange={handleStatusChange}
              onView={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      </section>

      {selectedTicket && (
        <IssueDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
        />
      )}
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

function IssueTableRow({ ticket, onStatusChange, onView }) {
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
          onChange={(event) => onStatusChange(ticket.id, event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
        >
          {issueStatuses
            .filter((status) => status !== "All Status")
            .map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
        </select>
      </td>

      <td className="px-6 py-5">
        <p className="font-bold text-slate-700">{ticket.date}</p>
        <p className="text-sm text-slate-500">{ticket.time}</p>
      </td>

      <td className="px-6 py-5">
        <button
          type="button"
          onClick={onView}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
        >
          View
        </button>
      </td>
    </tr>
  )
}

// =====================================================
// ISSUE MOBILE CARD
// =====================================================

function IssueMobileCard({ ticket, onStatusChange, onView }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{ticket.id}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {ticket.title}
          </p>
        </div>

        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="mb-4 grid gap-3 text-sm text-slate-600">
        <InfoLine label="Type" value={ticket.type} />
        <InfoLine label="Reporter" value={`${ticket.reportedBy} (${ticket.role})`} />
        <InfoLine label="Plate" value={ticket.relatedPlate} />
        <InfoLine label="Bay" value={ticket.relatedBay} />
        <InfoLine label="Date" value={`${ticket.date}, ${ticket.time}`} />
      </div>

      <div className="flex gap-3">
        <select
          value={ticket.status}
          onChange={(event) => onStatusChange(ticket.id, event.target.value)}
          className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none"
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
          className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
        >
          View
        </button>
      </div>
    </div>
  )
}

// =====================================================
// ISSUE DETAIL MODAL
// =====================================================

function IssueDetailModal({ ticket, onClose, onStatusChange }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
              Ticket Detail
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {ticket.id}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h4 className="text-2xl font-black text-slate-950">
              {ticket.title}
            </h4>

            <div className="mt-4 flex flex-wrap gap-2">
              <IssueTypeLabel type={ticket.type} />
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Description
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {ticket.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailBox icon={Mail} label="Email" value={ticket.email} />
            <DetailBox icon={Phone} label="Phone" value={ticket.phone} />
            <DetailBox
              icon={ParkingCircle}
              label="Vehicle Plate"
              value={ticket.relatedPlate}
            />
            <DetailBox
              icon={CalendarClock}
              label="Reported"
              value={`${ticket.date}, ${ticket.time}`}
            />
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Latest Admin Note
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {ticket.latestNote}
            </p>
          </div>

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
              onChange={(event) =>
                onStatusChange(ticket.id, event.target.value)
              }
              className="h-12 rounded-2xl border border-white/10 bg-white px-4 text-sm font-black text-slate-800 outline-none"
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
        </div>
      </div>
    </div>
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

function DetailBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-bold text-slate-800">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-bold text-slate-400">{label}</span>
      <span className="text-right font-black text-slate-800">{value}</span>
    </div>
  )
}

export default Issues