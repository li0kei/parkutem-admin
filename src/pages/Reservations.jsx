// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarCheck,
  Car,
  CheckCircle,
  Clock3,
  CreditCard,
  MapPin,
  MoreHorizontal,
  Moon,
  Plus,
  Save,
  Timer,
  User,
  Wallet,
  X,
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
  cancelAdminReservation,
  calculateReservationFees,
  createAdminReservation,
  deleteAdminReservation,
  loadAdminReservations,
  loadReservationFormOptions,
  updateAdminReservation,
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
// FORM HELPERS
// =====================================================

function padNumber(value) {
  return String(value).padStart(2, "0")
}

function toDateTimeLocalInput(value) {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )}T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}

function createDefaultReservationForm() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)

  const end = new Date(start)
  end.setHours(end.getHours() + 2)

  return {
    universityUserId: "",
    vehicleRecordId: "",
    bayId: "",
    reservationStartAt: toDateTimeLocalInput(start),
    reservationEndAt: toDateTimeLocalInput(end),
    status: "upcoming",
    remarks: "",
    chargeWallet: true,
  }
}

function createEditReservationForm(reservation) {
  return {
    universityUserId:
      reservation?.universityUserId || reservation?.raw?.university_user_id || "",
    vehicleRecordId:
      reservation?.vehicleRecordId || reservation?.raw?.vehicle_record_id || "",
    bayId: reservation?.bayId || reservation?.raw?.bay_id || "",
    reservationStartAt: toDateTimeLocalInput(
      reservation?.reservationStartAt || reservation?.raw?.reservation_start_at
    ),
    reservationEndAt: toDateTimeLocalInput(
      reservation?.reservationEndAt || reservation?.raw?.reservation_end_at
    ),
    status:
      reservation?.statusValue ||
      reservation?.raw?.status ||
      String(reservation?.status || "upcoming").toLowerCase(),
    remarks:
      reservation?.raw?.remarks && reservation.raw.remarks !== "-"
        ? reservation.raw.remarks
        : "",
    chargeWallet: false,
  }
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
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
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue())

  const [selectedReservation, setSelectedReservation] = useState(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create")
  const [formReservation, setFormReservation] = useState(null)
  const [formError, setFormError] = useState("")
  const [isFormSaving, setIsFormSaving] = useState(false)

  const [formOptions, setFormOptions] = useState({
    users: [],
    vehicles: [],
    parkingBays: [],
    zones: [],
  })

  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [hasLoadedOptions, setHasLoadedOptions] = useState(false)
  const [actionId, setActionId] = useState("")

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
  // LOAD FORM OPTIONS
  // =====================================================

  async function loadFormOptions({ force = false } = {}) {
    if (hasLoadedOptions && !force) {
      return
    }

    setIsLoadingOptions(true)
    setFormError("")

    try {
      const options = await loadReservationFormOptions()

      setFormOptions({
        users: options.users || [],
        vehicles: options.vehicles || [],
        parkingBays: options.parkingBays || [],
        zones: options.zones || [],
      })

      setHasLoadedOptions(true)
    } catch (error) {
      console.error("Failed to load reservation form options:", error)

      setFormError(
        error.message ||
          "Unable to load users, vehicles, and parking bays from Supabase."
      )
    } finally {
      setIsLoadingOptions(false)
    }
  }

  // PARKUTEM_PHASE_06G_R1_RESERVATIONS_PAGE_LINT
  // Initial Supabase loading is deferred one event-loop tick.
  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadReservations()
    }, 0)

    return () => window.clearTimeout(initialLoadTimer)
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
        String(reservation.bayNumber || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reservation.zone || "").toLowerCase().includes(searchValue)

      const matchesStatus =
        selectedStatus === "All Status" || reservation.status === selectedStatus

      const matchesZone =
        selectedZone === "All Zones" || reservation.zone === selectedZone

      const matchesUserType =
        selectedUserType === "All Types" ||
        reservation.userType === selectedUserType

      return matchesSearch && matchesStatus && matchesZone && matchesUserType
    })
  }, [
    monthlyReservationData,
    searchTerm,
    selectedStatus,
    selectedZone,
    selectedUserType,
  ])

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

      active: monthlyReservationData.filter((item) => item.status === "Active")
        .length,

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
  // MODAL OPENERS
  // =====================================================

  function handleOpenCreateModal() {
    setFormMode("create")
    setFormReservation(null)
    setFormError("")
    setIsFormOpen(true)
    loadFormOptions()
  }

  function handleOpenEditModal(reservation) {
    setFormMode("edit")
    setFormReservation(reservation)
    setFormError("")
    setIsFormOpen(true)
    loadFormOptions()
  }

  function handleCloseFormModal() {
    if (isFormSaving) {
      return
    }

    setIsFormOpen(false)
    setFormReservation(null)
    setFormError("")
  }

  // =====================================================
  // CREATE / EDIT RESERVATION
  // =====================================================

  async function handleSaveReservation(formValues) {
    setIsFormSaving(true)
    setFormError("")
    setLoadError("")

    try {
      if (formMode === "edit" && formReservation?.id) {
        await updateAdminReservation(formReservation.id, {
          ...formValues,
          chargeWallet: Boolean(formValues.chargeWallet),
        })
      } else {
        await createAdminReservation({
          ...formValues,
          chargeWallet: true,
        })
      }

      await loadReservations({ silent: true })

      setIsFormOpen(false)
      setFormReservation(null)
      setFormError("")
    } catch (error) {
      console.error("Failed to save reservation:", error)

      setFormError(error.message || "Unable to save reservation.")
    } finally {
      setIsFormSaving(false)
    }
  }

  // =====================================================
  // UPDATE RESERVATION STATUS
  // =====================================================

  async function handleUpdateStatus(reservationId, newStatus) {
    const currentReservation = reservationData.find(
      (reservation) => reservation.id === reservationId
    )

    if (currentReservation?.status === newStatus) {
      return
    }

    if (
      newStatus === "Cancelled" &&
      !window.confirm(
        "Cancel this reservation? The bay will be released if there is no other active/upcoming reservation."
      )
    ) {
      return
    }

    setActionId(`status-${reservationId}`)
    setLoadError("")

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
    } finally {
      setActionId("")
    }
  }

  // =====================================================
  // CANCEL RESERVATION
  // =====================================================

  async function handleCancelReservation(reservation) {
    if (!reservation?.id) {
      return
    }

    if (reservation.status === "Cancelled") {
      return
    }

    const confirmed = window.confirm(
      `Cancel reservation ${reservation.reservationId}? The bay will become available again if no other active/upcoming reservation exists.`
    )

    if (!confirmed) {
      return
    }

    setActionId(`cancel-${reservation.id}`)
    setLoadError("")

    try {
      const updatedReservation = await cancelAdminReservation(reservation.id)

      setReservationData((prev) =>
        prev.map((item) =>
          item.id === reservation.id ? updatedReservation : item
        )
      )

      setSelectedReservation((prev) => {
        if (!prev || prev.id !== reservation.id) {
          return prev
        }

        return updatedReservation
      })
    } catch (error) {
      console.error("Failed to cancel reservation:", error)

      setLoadError(error.message || "Unable to cancel reservation.")
    } finally {
      setActionId("")
    }
  }

  // =====================================================
  // DELETE RESERVATION
  // =====================================================

  async function handleDeleteReservation(reservation) {
    if (!reservation?.id) {
      return
    }

    const confirmed = window.confirm(
      `Delete reservation ${reservation.reservationId}? This action cannot be undone. Payment transaction rows will be preserved but detached from this reservation.`
    )

    if (!confirmed) {
      return
    }

    setActionId(`delete-${reservation.id}`)
    setLoadError("")

    try {
      await deleteAdminReservation(reservation.id)

      setReservationData((prev) =>
        prev.filter((item) => item.id !== reservation.id)
      )

      setSelectedReservation((prev) => {
        if (!prev || prev.id !== reservation.id) {
          return prev
        }

        return null
      })
    } catch (error) {
      console.error("Failed to delete reservation:", error)

      setLoadError(error.message || "Unable to delete reservation.")
    } finally {
      setActionId("")
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

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
        <div className="relative p-4 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Reservation Control
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Student & Staff Bay Reservations
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Monitor advance bay reservations, fixed reservation fees, and
                after-7PM parking charges.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              <Plus className="h-4 w-4" />
              Add Reservation
            </button>
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
              Reservation counts, fixed fees, and after-7PM charges are filtered
              by selected reservation month.
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600">
            <CreditCard className="h-5 w-5" />
          </div>

          <h3 className="text-lg font-black text-slate-950">
            Fixed Reservation Fee
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Student/staff reservation fee is charged once when booking a bay. It
            does not depend on reservation duration.
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
            parking fee is charged separately based on reserved time.
          </p>

          <p className="mt-4 text-2xl font-black text-violet-700">
            RM {summary.after7Revenue.toFixed(2)}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-500">
            Total after-7PM parking fee recorded
          </p>
        </div>
      </section>

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

      <section className="hidden overflow-visible rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm backdrop-blur lg:block">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Reservation List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredReservations.length} of{" "}
              {monthlyReservationData.length} reservations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700 xl:inline-flex">
              Fixed Fee + After 7PM Rule
            </span>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[9%]" />
              <col className="w-[13%]" />
            </colgroup>

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
                  <td className="px-4 py-5 align-top">
                    <p className="break-words text-sm font-black leading-6 text-slate-950">
                      {reservation.reservationId}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {reservation.userType}
                    </p>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <p className="break-words text-sm font-black leading-5 text-slate-700">
                      {reservation.userName}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {reservation.universityId}
                    </p>

                    <p className="mt-1 text-xs font-black text-cyan-700">
                      {reservation.vehiclePlate}
                    </p>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <p className="text-sm font-black text-slate-700">
                      {reservation.bayNumber}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {reservation.zone}
                    </p>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <p className="text-sm font-black text-slate-700">
                      {reservation.date}
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {reservation.startTime} - {reservation.endTime}
                    </p>

                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      {reservation.duration}
                    </p>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <FeeText
                      reservationFee={reservation.reservationFee}
                      after7ParkingFee={reservation.after7ParkingFee}
                    />
                  </td>

                  <td className="px-4 py-5 align-top">
                    <StatusBadge status={reservation.status} />
                  </td>

                  <td className="px-4 py-5 align-top">
                    <DesktopActionDropdown
                      reservation={reservation}
                      actionId={actionId}
                      onDetails={() => setSelectedReservation(reservation)}
                      onEdit={() => handleOpenEditModal(reservation)}
                      onCancel={() => handleCancelReservation(reservation)}
                      onDelete={() => handleDeleteReservation(reservation)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <EmptyResult
            onReset={handleResetFilters}
            onAdd={handleOpenCreateModal}
          />
        )}
      </section>

      <section className="space-y-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Reservation List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredReservations.length} of{" "}
              {monthlyReservationData.length} reservations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
            aria-label="Add reservation"
          >
            <Plus className="h-5 w-5" />
          </button>
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
                value={`${reservation.vehiclePlate} - ${reservation.userType}`}
              />

              <MobileInfo
                label="Bay"
                value={`${reservation.bayNumber} - ${reservation.zone}`}
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

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedReservation(reservation)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <MoreHorizontal className="h-4 w-4" />
                Details
              </button>

              <MobileActionSelect
                reservation={reservation}
                actionId={actionId}
                onEdit={() => handleOpenEditModal(reservation)}
                onCancel={() => handleCancelReservation(reservation)}
                onDelete={() => handleDeleteReservation(reservation)}
              />
            </div>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <EmptyResult
            onReset={handleResetFilters}
            onAdd={handleOpenCreateModal}
          />
        )}
      </section>

      <ReservationDetailModal
        reservation={selectedReservation}
        isOpen={Boolean(selectedReservation)}
        onClose={() => setSelectedReservation(null)}
        onUpdateStatus={handleUpdateStatus}
        onEdit={(reservation) => {
          setSelectedReservation(null)
          handleOpenEditModal(reservation)
        }}
        onCancel={handleCancelReservation}
        onDelete={handleDeleteReservation}
        isActionLoading={Boolean(actionId)}
      />

      <ReservationFormModal
        isOpen={isFormOpen}
        mode={formMode}
        reservation={formReservation}
        options={formOptions}
        isLoadingOptions={isLoadingOptions}
        isSaving={isFormSaving}
        error={formError}
        onClose={handleCloseFormModal}
        onSubmit={handleSaveReservation}
      />
    </div>
  )
}

// =====================================================
// RESERVATION FORM MODAL
// =====================================================

function ReservationFormModal({
  isOpen,
  mode,
  reservation,
  options,
  isLoadingOptions,
  isSaving,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(createDefaultReservationForm())
  const [localError, setLocalError] = useState("")

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const formResetTimer = window.setTimeout(() => {
      setLocalError("")

      if (mode === "edit" && reservation) {
        setForm(createEditReservationForm(reservation))
        return
      }

      setForm(createDefaultReservationForm())
    }, 0)

    return () => window.clearTimeout(formResetTimer)
  }, [isOpen, mode, reservation])

  const selectedUser = useMemo(() => {
    return (options.users || []).find((user) => user.id === form.universityUserId)
  }, [options.users, form.universityUserId])

  const filteredVehicles = useMemo(() => {
    if (!selectedUser) {
      return []
    }

    return (options.vehicles || []).filter((vehicle) => {
      const sameUniversityId =
        String(vehicle.universityId || "") ===
        String(selectedUser.universityId || "")

      const sameUserType =
        String(vehicle.userType || "").toLowerCase() ===
        String(selectedUser.userType || "").toLowerCase()

      return sameUniversityId && sameUserType
    })
  }, [options.vehicles, selectedUser])

  const selectedVehicle = useMemo(() => {
    return filteredVehicles.find((vehicle) => vehicle.id === form.vehicleRecordId)
  }, [filteredVehicles, form.vehicleRecordId])

  const selectedBay = useMemo(() => {
    return (options.parkingBays || []).find((bay) => bay.id === form.bayId)
  }, [options.parkingBays, form.bayId])

  const feePreview = useMemo(() => {
    try {
      return {
        ...calculateReservationFees(
          form.reservationStartAt,
          form.reservationEndAt
        ),
        error: "",
      }
    } catch (feeError) {
      return {
        reservationFee: 2,
        after7ParkingFee: 0,
        totalAmount: 2,
        error: feeError.message || "Unable to calculate fee.",
      }
    }
  }, [form.reservationStartAt, form.reservationEndAt])

  if (!isOpen) {
    return null
  }

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))

    setLocalError("")
  }

  function handleUserChange(userId) {
    setForm((prev) => ({
      ...prev,
      universityUserId: userId,
      vehicleRecordId: "",
    }))

    setLocalError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.universityUserId) {
      setLocalError("Please select student/staff user.")
      return
    }

    if (!form.vehicleRecordId) {
      setLocalError("Please select vehicle linked to the selected user.")
      return
    }

    if (!form.bayId) {
      setLocalError("Please select parking bay.")
      return
    }

    if (!form.reservationStartAt || !form.reservationEndAt) {
      setLocalError("Please select reservation start and end datetime.")
      return
    }

    const startDate = new Date(form.reservationStartAt)
    const endDate = new Date(form.reservationEndAt)

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setLocalError("Reservation end datetime must be later than start datetime.")
      return
    }

    await onSubmit({
      universityUserId: form.universityUserId,
      vehicleRecordId: form.vehicleRecordId,
      bayId: form.bayId,
      reservationStartAt: form.reservationStartAt,
      reservationEndAt: form.reservationEndAt,
      status: form.status,
      remarks: form.remarks.trim() || null,
      chargeWallet: mode === "create" ? true : Boolean(form.chargeWallet),
    })
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              {mode === "edit" ? "Edit Reservation" : "Add Reservation"}
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {mode === "edit"
                ? reservation?.reservationId || "Update reservation"
                : "Manual Admin Reservation"}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Select user, linked vehicle, parking bay, schedule, status, and
              remarks.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[76vh] overflow-y-auto p-6">
            {(error || localError) && (
              <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{localError || error}</p>
              </div>
            )}

            {isLoadingOptions && (
              <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
                Loading users, vehicles, and parking bays...
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormSelect
                    icon={User}
                    label="Student / Staff User"
                    value={form.universityUserId}
                    onChange={handleUserChange}
                    disabled={isSaving || isLoadingOptions}
                    options={(options.users || []).map((user) => ({
                      value: user.id,
                      label: `${user.fullName} - ${user.universityId} - ${user.userType}`,
                    }))}
                    placeholder="Select user"
                  />

                  <FormSelect
                    icon={Car}
                    label="Linked Vehicle / Plate"
                    value={form.vehicleRecordId}
                    onChange={(value) => updateField("vehicleRecordId", value)}
                    disabled={
                      isSaving ||
                      isLoadingOptions ||
                      !form.universityUserId ||
                      filteredVehicles.length === 0
                    }
                    options={filteredVehicles.map((vehicle) => ({
                      value: vehicle.id,
                      label: `${vehicle.plateNumber} - ${
                        vehicle.vehicleModel || "Vehicle"
                      }`,
                    }))}
                    placeholder={
                      form.universityUserId
                        ? "Select vehicle"
                        : "Select user first"
                    }
                  />

                  <FormSelect
                    icon={MapPin}
                    label="Parking Bay"
                    value={form.bayId}
                    onChange={(value) => updateField("bayId", value)}
                    disabled={isSaving || isLoadingOptions}
                    options={(options.parkingBays || []).map((bay) => ({
                      value: bay.id,
                      label: `${bay.bayCode} - ${bay.zoneName || "Zone"} - ${
                        bay.status
                      }`,
                    }))}
                    placeholder="Select parking bay"
                  />

                  <FormSelect
                    icon={CheckCircle}
                    label="Status"
                    value={form.status}
                    onChange={(value) => updateField("status", value)}
                    disabled={isSaving}
                    options={[
                      { value: "upcoming", label: "Upcoming" },
                      { value: "active", label: "Active" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    placeholder="Select status"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    icon={Clock3}
                    label="Start Datetime"
                    type="datetime-local"
                    value={form.reservationStartAt}
                    onChange={(value) =>
                      updateField("reservationStartAt", value)
                    }
                    disabled={isSaving}
                  />

                  <FormInput
                    icon={Clock3}
                    label="End Datetime"
                    type="datetime-local"
                    value={form.reservationEndAt}
                    onChange={(value) => updateField("reservationEndAt", value)}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Remarks
                  </label>

                  <textarea
                    value={form.remarks}
                    onChange={(event) =>
                      updateField("remarks", event.target.value)
                    }
                    disabled={isSaving}
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Optional admin remarks..."
                  />
                </div>

                {mode === "edit" && (
                  <label className="flex cursor-pointer gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <input
                      type="checkbox"
                      checked={form.chargeWallet}
                      onChange={(event) =>
                        updateField("chargeWallet", event.target.checked)
                      }
                      disabled={isSaving}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />

                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Charge wallet if additional fee is needed
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        For edit mode, this only charges the unpaid difference if
                        the updated fee is higher than the existing paid amount.
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600">
                    <Wallet className="h-5 w-5" />
                  </div>

                  <p className="text-sm font-black text-slate-950">
                    Payment Preview
                  </p>

                  <div className="mt-4 space-y-3">
                    <PreviewRow
                      label="Reservation Fee"
                      value={`RM ${formatMoney(feePreview.reservationFee)}`}
                    />

                    <PreviewRow
                      label="After 7PM Fee"
                      value={`RM ${formatMoney(feePreview.after7ParkingFee)}`}
                    />

                    <PreviewRow
                      label="Total Wallet Charge"
                      value={`RM ${formatMoney(feePreview.totalAmount)}`}
                      strong
                    />
                  </div>

                  {feePreview.error && (
                    <p className="mt-4 text-xs font-bold leading-5 text-amber-700">
                      {feePreview.error}
                    </p>
                  )}

                  <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
                    Payment transaction will use payment_type reservation_fee,
                    payment_method wallet, and payment_status paid.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black text-slate-950">
                    Selected Record
                  </p>

                  <div className="mt-4 space-y-3">
                    <MiniInfo
                      label="User"
                      value={
                        selectedUser
                          ? `${selectedUser.fullName} - ${selectedUser.universityId}`
                          : "Not selected"
                      }
                    />

                    <MiniInfo
                      label="Vehicle"
                      value={
                        selectedVehicle
                          ? `${selectedVehicle.plateNumber} - ${
                              selectedVehicle.vehicleModel || "Vehicle"
                            }`
                          : "Not selected"
                      }
                    />

                    <MiniInfo
                      label="Bay"
                      value={
                        selectedBay
                          ? `${selectedBay.bayCode} - ${
                              selectedBay.zoneName || "Zone"
                            } - ${selectedBay.status}`
                          : "Not selected"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm font-black text-slate-950">
                    Bay Sync Rule
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    If reservation is upcoming or active, bay will sync as
                    reserved. If reservation is cancelled, completed, deleted, or
                    moved to another bay, old bay will be released only when no
                    other active/upcoming reservation exists.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isLoadingOptions}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? "Saving..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// DESKTOP ACTION DROPDOWN
// =====================================================

function DesktopActionDropdown({
  reservation,
  actionId,
  onDetails,
  onEdit,
  onCancel,
  onDelete,
}) {
  return (
    <div className="flex min-w-[190px] items-center gap-2">
      <button
        type="button"
        onClick={onDetails}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
      >
        <MoreHorizontal className="h-4 w-4" />
        Details
      </button>

      <ActionSelect
        reservation={reservation}
        actionId={actionId}
        onEdit={onEdit}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    </div>
  )
}

// =====================================================
// MOBILE ACTION SELECT
// =====================================================

function MobileActionSelect({ reservation, actionId, onEdit, onCancel, onDelete }) {
  return (
    <ActionSelect
      reservation={reservation}
      actionId={actionId}
      onEdit={onEdit}
      onCancel={onCancel}
      onDelete={onDelete}
      className="h-12 flex-1"
    />
  )
}

// =====================================================
// ACTION SELECT
// =====================================================

function ActionSelect({
  reservation,
  actionId,
  onEdit,
  onCancel,
  onDelete,
  className = "h-11 w-[94px]",
}) {
  const cancelDisabled =
    reservation.status === "Cancelled" ||
    reservation.status === "Completed" ||
    actionId === `cancel-${reservation.id}`

  const deleteDisabled = actionId === `delete-${reservation.id}`
  const isBusy = Boolean(actionId)

  function handleActionChange(event) {
    const action = event.target.value

    if (!action) {
      return
    }

    if (action === "edit") {
      onEdit()
    }

    if (action === "cancel") {
      onCancel()
    }

    if (action === "delete") {
      onDelete()
    }

    event.target.value = ""
  }

  return (
    <select
      defaultValue=""
      disabled={isBusy}
      onChange={handleActionChange}
      className={`${className} cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none transition hover:bg-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50`}
      aria-label={`Reservation actions for ${reservation.reservationId}`}
    >
      <option value="">Action</option>
      <option value="edit">Edit</option>
      <option value="cancel" disabled={cancelDisabled}>
        Cancel
      </option>
      <option value="delete" disabled={deleteDisabled}>
        Delete
      </option>
    </select>
  )
}

// =====================================================
// TABLE HEAD
// =====================================================

function TableHead({ children }) {
  return (
    <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
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
      <p className="text-sm font-black leading-5 text-slate-700">
        Reservation: RM {Number(reservationFee || 0).toFixed(2)}
      </p>

      <p
        className={`mt-1 text-xs font-bold leading-5 ${
          Number(after7ParkingFee || 0) > 0
            ? "text-violet-700"
            : "text-slate-400"
        }`}
      >
        After 7PM: RM {Number(after7ParkingFee || 0).toFixed(2)}
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

function EmptyResult({ onReset, onAdd }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-black text-slate-950">
        No reservations found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search keyword or selected filters.
      </p>

      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Reset Filters
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-600"
        >
          Add Reservation
        </button>
      </div>
    </div>
  )
}

// =====================================================
// FORM INPUT
// =====================================================

function FormInput({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  disabled,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </div>
  )
}

// =====================================================
// FORM SELECT
// =====================================================

function FormSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-[52px] w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// =====================================================
// PREVIEW ROW
// =====================================================

function PreviewRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
      <p className="text-sm font-bold text-slate-500">{label}</p>

      <p
        className={`text-sm ${
          strong ? "font-black text-cyan-700" : "font-black text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// =====================================================
// MINI INFO
// =====================================================

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  )
}

export default Reservations