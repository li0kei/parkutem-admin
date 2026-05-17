// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  CalendarCheck,
  CheckCircle,
  Clock3,
  CreditCard,
  MoreHorizontal,
  Moon,
  Timer,
  XCircle,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import ReservationDetailModal from "../components/modals/ReservationDetailModal"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"

import {
  reservationStatusOptions,
  reservationUserTypeOptions,
  reservationZoneOptions,
} from "../data/reservations"

import {
  loadAdminReservations,
  updateReservationStatus,
} from "../services/adminReservationService"

// =====================================================
// MONTH HELPERS
// =====================================================

function getCurrentMonthValue() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

function getReservationDateValue(reservation) {
  return (
    reservation.raw?.reservation_start_at ||
    reservation.raw?.created_at ||
    reservation.raw?.updated_at ||
    null
  )
}

function isReservationInSelectedMonth(reservation, selectedMonth) {
  if (!selectedMonth) {
    return true
  }

  const reservationDateValue = getReservationDateValue(reservation)

  if (!reservationDateValue) {
    return false
  }

  const reservationDate = new Date(reservationDateValue)

  if (Number.isNaN(reservationDate.getTime())) {
    return false
  }

  const reservationMonth = `${reservationDate.getFullYear()}-${String(
    reservationDate.getMonth() + 1
  ).padStart(2, "0")}`

  return reservationMonth === selectedMonth
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

// =====================================================
// RESERVATION MANAGEMENT PAGE
// =====================================================

function Reservations() {
  const [reservationData, setReservationData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedZone, setSelectedZone] = useState("All Zones")
  const [selectedUserType, setSelectedUserType] = useState("All Types")
  const [selectedReservation, setSelectedReservation] = useState(null)

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue())

// =====================================================
// LOAD RESERVATIONS FROM SUPABASE
// =====================================================

  async function loadReservations({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const realReservations = await loadAdminReservations()
      setReservationData(realReservations)
    } catch (error) {
      console.error("Failed to load reservations:", error)

      setLoadError(
        error.message || "Unable to load reservations from Supabase."
      )

      setReservationData([])
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
  loadReservations()
}, [])

// =====================================================
// REALTIME REFRESH
// =====================================================

useAdminRealtimeRefresh({
  channelName: "admin-reservations-realtime",
  tables: [
    "reservations",
    "parking_bays",
    "parking_zones",
    "anpr_logs",
    "payment_transactions",
    "university_users",
    "vehicle_records",
  ],
  onRefresh: () => {
    loadReservations({ silent: true })
  },
  onStatusChange: (statusInfo) => {
    console.log("Reservations realtime:", statusInfo.label)
  },
})

// =====================================================
// MONTHLY RESERVATION DATA
// =====================================================

const monthlyReservationData = useMemo(() => {
  return reservationData.filter((reservation) =>
    isReservationInSelectedMonth(reservation, selectedMonth)
  )
}, [reservationData, selectedMonth])

  // =====================================================
  // FILTERED RESERVATIONS
  // =====================================================

  const filteredReservations = useMemo(() => {
    return monthlyReservationData.filter((reservation) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        String(reservation.reservationId || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reservation.userName || "").toLowerCase().includes(searchValue) ||
        String(reservation.universityId || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reservation.vehiclePlate || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reservation.bayNumber || "").toLowerCase().includes(searchValue) ||
        String(reservation.zone || "").toLowerCase().includes(searchValue)

      const matchesStatus =
        selectedStatus === "All Status" ||
        reservation.status === selectedStatus

      const matchesZone =
        selectedZone === "All Zones" || reservation.zone === selectedZone

      const matchesUserType =
        selectedUserType === "All Types" ||
        reservation.userType === selectedUserType

      return matchesSearch && matchesStatus && matchesZone && matchesUserType
    })
  }, [monthlyReservationData, searchTerm, selectedStatus, selectedZone, selectedUserType])

// =====================================================
// SUMMARY COUNTS
// =====================================================

const summary = useMemo(() => {
  const reservationRevenue = monthlyReservationData.reduce(
    (total, item) => total + Number(item.reservationFee || 0),
    0
  )

  const after7Revenue = monthlyReservationData.reduce(
    (total, item) => total + Number(item.after7ParkingFee || 0),
    0
  )

  return {
    total: monthlyReservationData.length,

    upcoming: monthlyReservationData.filter(
      (item) => item.status === "Upcoming"
    ).length,

    active: monthlyReservationData.filter(
      (item) => item.status === "Active"
    ).length,

    completed: monthlyReservationData.filter(
      (item) => item.status === "Completed"
    ).length,

    cancelled: monthlyReservationData.filter(
      (item) => item.status === "Cancelled"
    ).length,

    after7: monthlyReservationData.filter(
      (item) => Number(item.after7ParkingFee || 0) > 0
    ).length,

    reservationRevenue,
    after7Revenue,
  }
}, [monthlyReservationData])

  // =====================================================
  // UPDATE RESERVATION STATUS
  // =====================================================

  async function handleUpdateStatus(reservationId, newStatus) {
    try {
      const updatedReservation = await updateReservationStatus(
        reservationId,
        newStatus
      )

      setReservationData((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId ? updatedReservation : reservation
        )
      )

      setSelectedReservation((prev) => {
        if (!prev || prev.id !== reservationId) {
          return prev
        }

        return updatedReservation
      })
    } catch (error) {
      console.error("Failed to update reservation status:", error)

      setLoadError(
        error.message || "Unable to update reservation status in Supabase."
      )
    }
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

function handleResetFilters() {
    setSearchTerm("")
    setSelectedStatus("All Status")
    setSelectedZone("All Zones")
    setSelectedUserType("All Types")
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

          {isLoading && (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
              Loading reservation records from Supabase...
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
                Reservation Control
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Student & Staff Bay Reservations
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Monitor advance bay reservations, fixed reservation fees, and
              after-7PM parking charges.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryCard
              label="Total Reservations"
              value={summary.total}
              icon={CalendarCheck}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Upcoming"
              value={summary.upcoming}
              icon={Clock3}
              className="bg-amber-300/10 text-amber-300"
            />

            <SummaryCard
              label="Active"
              value={summary.active}
              icon={Timer}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Completed"
              value={summary.completed}
              icon={CheckCircle}
              className="bg-blue-300/10 text-blue-300"
            />

            <SummaryCard
              label="Cancelled"
              value={summary.cancelled}
              icon={XCircle}
              className="bg-red-300/10 text-red-300"
            />

            <SummaryCard
              label="After 7PM"
              value={summary.after7}
              icon={Moon}
              className="bg-violet-300/10 text-violet-300"
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
                Reservation Month
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-950">
                {formatSelectedMonthLabel(selectedMonth)}
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Reservation counts, fixed fees, and after-7PM charges are filtered by
                selected reservation month.
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
          FEE RULE PANEL
          ===================================================== */}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600">
            <CreditCard className="h-5 w-5" />
          </div>

          <h3 className="text-lg font-black text-slate-950">
            Fixed Reservation Fee
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Student/staff reservation fee is charged once when booking a bay.
            It does not depend on reservation duration.
          </p>

          <p className="mt-4 text-2xl font-black text-cyan-700">
            RM {summary.reservationRevenue.toFixed(2)}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-500">
            Total reservation fee recorded
          </p>
        </div>

        <div className="rounded-[2rem] border border-violet-100 bg-violet-50 p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600">
            <Moon className="h-5 w-5" />
          </div>

          <h3 className="text-lg font-black text-slate-950">
            After 7PM Parking Fee
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Student/staff normal parking is free from 7AM to 7PM. After 7PM,
            parking fee is charged separately based on actual usage.
          </p>

          <p className="mt-4 text-2xl font-black text-violet-700">
            RM {summary.after7Revenue.toFixed(2)}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-500">
            Total after-7PM parking fee recorded
          </p>
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
              placeholder="Search reservation, user, plate, bay, zone..."
            />
          </div>

          <FilterSelect
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={reservationStatusOptions}
          />

          <FilterSelect
            label="Zone"
            value={selectedZone}
            onChange={setSelectedZone}
            options={reservationZoneOptions}
          />

          <FilterSelect
            label="User Type"
            value={selectedUserType}
            onChange={setSelectedUserType}
            options={reservationUserTypeOptions}
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
              Reservation List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredReservations.length} of {monthlyReservationData.length} reservations.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Fixed Fee + After 7PM Rule
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>Reservation</TableHead>
                <TableHead>User / Vehicle</TableHead>
                <TableHead>Bay</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredReservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-950">
                      {reservation.reservationId}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {reservation.userType}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {reservation.userName}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {reservation.universityId}
                    </p>

                    <p className="mt-1 text-xs font-black text-cyan-700">
                      {reservation.vehiclePlate}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {reservation.bayNumber}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {reservation.zone}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {reservation.date}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {reservation.startTime} - {reservation.endTime}
                    </p>

                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      {reservation.duration}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <FeeText
                      reservationFee={reservation.reservationFee}
                      after7ParkingFee={reservation.after7ParkingFee}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={reservation.status} />
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedReservation(reservation)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          MOBILE CARDS
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Reservation List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredReservations.length} of {monthlyReservationData.length} reservations.
          </p>
        </div>

        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {reservation.reservationId}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {reservation.userName}
                </p>
              </div>

              <StatusBadge status={reservation.status} />
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo
                label="Vehicle"
                value={`${reservation.vehiclePlate} • ${reservation.userType}`}
              />

              <MobileInfo
                label="Bay"
                value={`${reservation.bayNumber} • ${reservation.zone}`}
              />

              <MobileInfo
                label="Schedule"
                value={`${reservation.date}, ${reservation.startTime} - ${reservation.endTime}`}
              />

              <MobileInfo label="Duration" value={reservation.duration} />

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                  Fees
                </p>

                <FeeText
                  reservationFee={reservation.reservationFee}
                  after7ParkingFee={reservation.after7ParkingFee}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReservation(reservation)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
              View Details
            </button>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          RESERVATION DETAIL MODAL
          ===================================================== */}

      <ReservationDetailModal
        reservation={selectedReservation}
        isOpen={Boolean(selectedReservation)}
        onClose={() => setSelectedReservation(null)}
        onUpdateStatus={handleUpdateStatus}
      />
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
// FEE TEXT
// =====================================================

function FeeText({ reservationFee, after7ParkingFee }) {
  return (
    <div>
      <p className="text-sm font-black text-slate-700">
        Reservation: RM {reservationFee.toFixed(2)}
      </p>

      <p
        className={`mt-1 text-xs font-bold ${
          after7ParkingFee > 0 ? "text-violet-700" : "text-slate-400"
        }`}
      >
        After 7PM: RM {after7ParkingFee.toFixed(2)}
      </p>
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

      <p className="break-words text-sm font-black text-slate-700">{value}</p>
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
        No reservations found
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

export default Reservations