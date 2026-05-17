// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  CarFront,
  CircleCheck,
  CircleHelp,
  MapPin,
  ScanLine,
  ShieldAlert,
  Timer,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"
import { loadAdminAnprLogs } from "../services/adminAnprLogService"

import {
  anprStatusOptions,
  gateOptions,
  userTypeOptions,
} from "../data/anprLogs"


// =====================================================
// ANPR LOGS PAGE
// =====================================================

function ANPRLogs() {
  const [logData, setLogData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedUserType, setSelectedUserType] = useState("All Types")
  const [selectedGate, setSelectedGate] = useState("All Gates")

  // =====================================================
  // LOAD ANPR LOGS FROM SUPABASE
  // =====================================================

    async function loadLogs({ silent = false } = {}) {
      if (!silent) {
        setIsLoading(true)
      }

      setLoadError("")

      try {
        const realLogs = await loadAdminAnprLogs()
        setLogData(realLogs)
      } catch (error) {
        console.error("Failed to load ANPR logs:", error)

        setLoadError(
          error.message ||
            "Unable to load ANPR logs from Supabase. Please check table access or schema."
        )

        setLogData([])
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
      loadLogs()
    }, [])

    // =====================================================
    // REALTIME REFRESH
    // =====================================================

    useAdminRealtimeRefresh({
      channelName: "admin-anpr-logs-realtime",
      tables: [
        "anpr_logs",
        "guest_bookings",
        "vehicle_records",
        "university_users",
        "reservations",
        "parking_bays",
        "payment_transactions",
      ],
      onRefresh: () => {
        loadLogs({ silent: true })
      },
      onStatusChange: (statusInfo) => {
        console.log("ANPR logs realtime:", statusInfo.label)
      },
    })

  // =====================================================
  // FILTERED LOGS
  // =====================================================

  const filteredLogs = useMemo(() => {
    return logData.filter((log) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        String(log.plateNumber || "").toLowerCase().includes(searchValue) ||
        String(log.ownerName || "").toLowerCase().includes(searchValue) ||
        String(log.gateLocation || "").toLowerCase().includes(searchValue) ||
        String(log.parkingZone || "").toLowerCase().includes(searchValue)

      const matchesStatus =
        selectedStatus === "All Status" || log.status === selectedStatus

      const matchesUserType =
        selectedUserType === "All Types" || log.userType === selectedUserType

      const matchesGate =
        selectedGate === "All Gates" || log.gateLocation === selectedGate

      return matchesSearch && matchesStatus && matchesUserType && matchesGate
    })
  }, [logData, searchTerm, selectedStatus, selectedUserType, selectedGate])

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: logData.length,
      approved: logData.filter((log) => log.status === "Approved").length,
      flagged: logData.filter((log) => log.status === "Flagged").length,
      unknown: logData.filter((log) => log.status === "Unknown").length,
      guests: logData.filter((log) => log.userType === "Guest").length,
      active: logData.filter(
        (log) => log.exitTime === "-" && log.status === "Approved"
      ).length,
    }
  }, [logData])

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function handleResetFilters() {
    setSearchTerm("")
    setSelectedStatus("All Status")
    setSelectedUserType("All Types")
    setSelectedGate("All Gates")
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
                Loading ANPR logs from Supabase...
              </div>
            )}

      {/* =====================================================
          SUMMARY PANEL
          ===================================================== */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
        <div className="relative p-4 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                ANPR Monitoring
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Vehicle Entry & Exit Logs
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Track detected vehicle plates, gate movement, confidence scores,
              and parking access decisions.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryCard
              label="Total Logs"
              value={summary.total}
              icon={ScanLine}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Approved"
              value={summary.approved}
              icon={CircleCheck}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Flagged"
              value={summary.flagged}
              icon={ShieldAlert}
              className="bg-red-300/10 text-red-300"
            />

            <SummaryCard
              label="Unknown"
              value={summary.unknown}
              icon={CircleHelp}
              className="bg-slate-300/10 text-slate-300"
            />

            <SummaryCard
              label="Guest Logs"
              value={summary.guests}
              icon={CarFront}
              className="bg-violet-300/10 text-violet-300"
            />

            <SummaryCard
              label="Active Sessions"
              value={summary.active}
              icon={Timer}
              className="bg-amber-300/10 text-amber-300"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTER PANEL
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] xl:items-end">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Search
            </label>

            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search plate, owner, gate, or zone..."
            />
          </div>

          <FilterSelect
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={anprStatusOptions}
          />

          <FilterSelect
            label="User Type"
            value={selectedUserType}
            onChange={setSelectedUserType}
            options={userTypeOptions}
          />

          <FilterSelect
            label="Gate"
            value={selectedGate}
            onChange={setSelectedGate}
            options={gateOptions}
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </section>

      {/* =====================================================
          DESKTOP TABLE
          ===================================================== */}

      <section className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm backdrop-blur lg:block">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              ANPR Detection List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
             Showing {filteredLogs.length} of {logData.length} vehicle logs.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Entry / Exit Tracking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>Vehicle</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Entry / Exit</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {log.plateNumber}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {log.ownerName === "-" ? "No matched owner" : log.ownerName}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <UserTypePill type={log.userType} />
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-slate-700">
                        In: {log.entryTime}
                      </p>

                      <p className="font-semibold text-slate-500">
                        Out: {log.exitTime}
                      </p>

                      <p className="text-xs font-bold text-cyan-700">
                        Duration: {log.duration}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <p className="text-sm font-black text-slate-700">
                          {log.gateLocation}
                        </p>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {log.parkingZone}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <ConfidenceBar value={log.confidence} />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} />
                  </td>

                  <td className="px-6 py-4">
                    <PaymentPill status={log.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && <EmptyResult onReset={handleResetFilters} />}
      </section>

      {/* =====================================================
          MOBILE CARDS
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            ANPR Detection List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredLogs.length} of {logData.length} logs.
          </p>
        </div>

        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {log.plateNumber}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {log.ownerName === "-" ? "No matched owner" : log.ownerName}
                </p>
              </div>

              <StatusBadge status={log.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <UserTypePill type={log.userType} />
              <PaymentPill status={log.paymentStatus} />
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo label="Entry Time" value={log.entryTime} />
              <MobileInfo label="Exit Time" value={log.exitTime} />
              <MobileInfo label="Duration" value={log.duration} />
              <MobileInfo label="Gate" value={`${log.gateLocation} • ${log.parkingZone}`} />

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                  Detection Confidence
                </p>

                <ConfidenceBar value={log.confidence} />
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                  Remarks
                </p>

                <p className="text-sm font-semibold leading-6 text-slate-600">
                  {log.remarks}
                </p>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && <EmptyResult onReset={handleResetFilters} />}
      </section>
    </div>
  )
}

// =====================================================
// TABLE HEAD
// =====================================================

function TableHead({ children }) {
  return (
    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
      {children}
    </th>
  )
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({ label, value, icon: Icon, className }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur sm:rounded-[1.5rem] sm:p-5">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl sm:mb-4 sm:h-11 sm:w-11 ${className}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xl font-black text-white sm:text-2xl">{value}</p>

      <p className="mt-1 text-xs font-bold text-slate-300 sm:text-sm">
        {label}
      </p>
    </div>
  )
}

// =====================================================
// USER TYPE PILL
// =====================================================

function UserTypePill({ type }) {
  const styles = {
    Student: "bg-blue-50 text-blue-700",
    Staff: "bg-cyan-50 text-cyan-700",
    Guest: "bg-violet-50 text-violet-700",
    Unknown: "bg-slate-100 text-slate-600",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        styles[type] || "bg-slate-100 text-slate-600"
      }`}
    >
      {type}
    </span>
  )
}

// =====================================================
// PAYMENT PILL
// =====================================================

function PaymentPill({ status }) {
  const styles = {
    Free: "bg-emerald-50 text-emerald-700",
    Paid: "bg-cyan-50 text-cyan-700",
    Charged: "bg-blue-50 text-blue-700",
    Pending: "bg-amber-50 text-amber-700",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  )
}

// =====================================================
// CONFIDENCE BAR
// =====================================================

function ConfidenceBar({ value }) {
  const safeValue = Number(value || 0)

  const color =
    safeValue >= 90
      ? "bg-emerald-500"
      : safeValue >= 80
        ? "bg-cyan-500"
        : "bg-orange-500"

  return (
    <div className="w-40 max-w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-black text-slate-700">{safeValue}%</p>
        <p className="text-xs font-semibold text-slate-400">confidence</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(safeValue, 100)}%` }}
        />
      </div>
    </div>
  )
}

// =====================================================
// MOBILE INFO
// =====================================================

function MobileInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="text-sm font-black text-slate-700">{value}</p>
    </div>
  )
}

// =====================================================
// EMPTY RESULT
// =====================================================

function EmptyResult({ onReset }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-black text-slate-950">
        No ANPR logs found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search keyword or selected filters.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
      >
        Reset Filters
      </button>
    </div>
  )
}

export default ANPRLogs