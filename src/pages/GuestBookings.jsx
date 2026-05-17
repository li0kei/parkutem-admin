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
  Radio,
  Receipt,
  Timer,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import GuestBookingModal from "../components/modals/GuestBookingModal"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"

import {
  guestAnprAccessOptions,
  guestBookingStatusOptions,
  guestEntryStatusOptions,
  guestPaymentStatusOptions,
} from "../data/guestBookings"

import { loadAdminGuestBookings } from "../services/adminGuestBookingService"

// =====================================================
// GUEST BOOKING MANAGEMENT PAGE
// =====================================================

function GuestBookings() {
  const [bookingData, setBookingData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBookingStatus, setSelectedBookingStatus] =
    useState("All Status")
  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState("All Payments")
  const [selectedAnprAccess, setSelectedAnprAccess] = useState("All ANPR")
  const [selectedEntryStatus, setSelectedEntryStatus] = useState("All Entry")
  const [selectedBooking, setSelectedBooking] = useState(null)

// =====================================================
// LOAD GUEST BOOKINGS
// =====================================================

  async function loadGuestBookings({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const realBookings = await loadAdminGuestBookings()
      setBookingData(realBookings)
    } catch (error) {
      console.error("Failed to load guest bookings:", error)

      setLoadError(
        error.message || "Unable to load guest bookings from Supabase."
      )

      setBookingData([])
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  // =====================================================
  // INITIAL LOAD + REALTIME SUBSCRIPTION
  // =====================================================

    useEffect(() => {
      loadGuestBookings()
    }, [])

// =====================================================
// REALTIME REFRESH
// =====================================================

  useAdminRealtimeRefresh({
    channelName: "admin-guest-bookings-realtime",
    tables: [
      "guest_bookings",
      "payment_transactions",
      "anpr_logs",
      "guest_email_logs",
    ],
    onRefresh: () => {
      loadGuestBookings({ silent: true })
    },
    onStatusChange: (statusInfo) => {
      console.log("Guest bookings realtime:", statusInfo.label)
    },
  })

  // =====================================================
  // FILTERED BOOKINGS
  // =====================================================

  const filteredBookings = useMemo(() => {
    return bookingData.filter((booking) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        booking.bookingId.toLowerCase().includes(searchValue) ||
        booking.guestName.toLowerCase().includes(searchValue) ||
        booking.email.toLowerCase().includes(searchValue) ||
        booking.phone.toLowerCase().includes(searchValue) ||
        booking.vehiclePlate.toLowerCase().includes(searchValue) ||
        booking.visitPurpose.toLowerCase().includes(searchValue) ||
        booking.hostDepartment.toLowerCase().includes(searchValue)

      const matchesBookingStatus =
        selectedBookingStatus === "All Status" ||
        booking.bookingStatus === selectedBookingStatus

      const matchesPayment =
        selectedPaymentStatus === "All Payments" ||
        booking.paymentStatus === selectedPaymentStatus

      const matchesAnpr =
        selectedAnprAccess === "All ANPR" ||
        booking.anprAccess === selectedAnprAccess

      const matchesEntry =
        selectedEntryStatus === "All Entry" ||
        booking.entryStatus === selectedEntryStatus

      return matchesSearch && matchesBookingStatus && matchesPayment && matchesAnpr && matchesEntry
    })
  }, [
    bookingData,
    searchTerm,
    selectedBookingStatus,
    selectedPaymentStatus,
    selectedAnprAccess,
    selectedEntryStatus,
  ])

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const summary = useMemo(() => {
    const guestRevenue = bookingData
      .filter((booking) => booking.paymentStatus === "Paid")
      .reduce((total, booking) => total + booking.parkingFee, 0)

    return {
        total: bookingData.length,
        paid: bookingData.filter((booking) => booking.paymentStatus === "Paid")
          .length,

        confirmed: bookingData.filter(
          (booking) => booking.bookingStatus === "Confirmed"
        ).length,

        anprActive: bookingData.filter(
          (booking) => booking.anprAccess === "Enabled"
        ).length,

        anprEnabled: bookingData.filter(
          (booking) => booking.anprAccess === "Enabled"
        ).length,

        entered: bookingData.filter((booking) =>
          ["Entered", "Overstay", "Exited"].includes(booking.entryStatus)
        ).length,

        guestRevenue,
      }
  }, [bookingData])

  // =====================================================
  // UPDATE BOOKING STATUS
  // =====================================================

  function handleUpdateBookingStatus(bookingId, newStatus) {
    const updateBooking = (booking) => {
      if (booking.id !== bookingId) {
        return booking
      }

      const nextAnprAccess =
        newStatus === "Cancelled"
          ? "Blocked"
          : newStatus === "Expired"
            ? "Expired"
            : booking.anprAccess

      return {
        ...booking,
        bookingStatus: newStatus,
        anprAccess: nextAnprAccess,
      }
    }

    setBookingData((prev) => prev.map(updateBooking))

    setSelectedBooking((prev) => {
      if (!prev || prev.id !== bookingId) {
        return prev
      }

      return updateBooking(prev)
    })
  }

  // =====================================================
  // UPDATE ANPR ACCESS
  // =====================================================

  function handleUpdateAnprAccess(bookingId, newAccess) {
    const updateBooking = (booking) => {
      if (booking.id !== bookingId) {
        return booking
      }

      return {
        ...booking,
        anprAccess: newAccess,
      }
    }

    setBookingData((prev) => prev.map(updateBooking))

    setSelectedBooking((prev) => {
      if (!prev || prev.id !== bookingId) {
        return prev
      }

      return updateBooking(prev)
    })
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function handleResetFilters() {
    setSearchTerm("")
    setSelectedBookingStatus("All Status")
    setSelectedPaymentStatus("All Payments")
    setSelectedAnprAccess("All ANPR")
    setSelectedEntryStatus("All Entry")
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
        Loading real guest bookings from Supabase...
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
                Guest Parking
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Guest Booking & ANPR Access
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Monitor paid guest bookings, temporary plate access, payment
              status, and ANPR entry activity.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryCard
              label="Total Bookings"
              value={summary.total}
              icon={CalendarCheck}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Paid"
              value={summary.paid}
              icon={CreditCard}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Confirmed"
              value={summary.confirmed}
              icon={Clock3}
              className="bg-amber-300/10 text-amber-300"
            />

            <SummaryCard
              label="ANPR Active"
              value={summary.anprActive}
              icon={Timer}
              className="bg-blue-300/10 text-blue-300"
            />

            <SummaryCard
              label="ANPR Enabled"
              value={summary.anprEnabled}
              icon={Radio}
              className="bg-violet-300/10 text-violet-300"
            />

            <SummaryCard
              label="Entered"
              value={summary.entered}
              icon={CheckCircle}
              className="bg-teal-300/10 text-teal-300"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          RULE PANEL
          ===================================================== */}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600">
            <Radio className="h-5 w-5" />
          </div>

          <h3 className="text-lg font-black text-slate-950">
            Auto ANPR Access After Payment
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Guest vehicles do not need admin approval. Once payment succeeds,
            the plate is registered automatically for ANPR guest access.
          </p>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600">
            <Receipt className="h-5 w-5" />
          </div>

          <h3 className="text-lg font-black text-slate-950">
            Guest Revenue
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Guest pays parking fee only through the guest web portal. Guest does
            not use student/staff wallet.
          </p>

          <p className="mt-4 text-2xl font-black text-emerald-700">
            RM {summary.guestRevenue.toFixed(2)}
          </p>
        </div>
      </section>

      {/* =====================================================
          FILTER PANEL
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.75fr_0.75fr_0.75fr_0.75fr_auto] xl:items-end">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Search
            </label>

            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search guest, plate, email, phone, purpose..."
            />
          </div>

          <FilterSelect
            label="Booking"
            value={selectedBookingStatus}
            onChange={setSelectedBookingStatus}
            options={guestBookingStatusOptions}
          />

          <FilterSelect
            label="Payment"
            value={selectedPaymentStatus}
            onChange={setSelectedPaymentStatus}
            options={guestPaymentStatusOptions}
          />

          <FilterSelect
            label="ANPR"
            value={selectedAnprAccess}
            onChange={setSelectedAnprAccess}
            options={guestAnprAccessOptions}
          />

          <FilterSelect
            label="Entry"
            value={selectedEntryStatus}
            onChange={setSelectedEntryStatus}
            options={guestEntryStatusOptions}
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
              Guest Booking List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredBookings.length} of {bookingData.length} guest bookings.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            No Approval Required
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>Guest</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>ANPR / Entry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-950">
                      {booking.guestName}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {booking.bookingId}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {booking.email}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-cyan-700">
                      {booking.vehiclePlate}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {booking.bayNumber
                      ? `${booking.bayNumber} • ${booking.zone}`
                      : booking.parkingAllocation}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {booking.bookingDate}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {booking.startTime} - {booking.endTime}
                    </p>

                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      {booking.duration}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      RM {booking.parkingFee.toFixed(2)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={booking.paymentStatus} />
                      <StatusBadge status={booking.receiptStatus} />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={booking.anprAccess} />
                      <StatusBadge status={booking.entryStatus} />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={booking.bookingStatus} />

                    {booking.bookingStatus === "Expired" && booking.expiredReason !== "-" && (
                      <p className="mt-2 text-xs font-bold text-orange-600">
                        {booking.expiredReason}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
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

        {filteredBookings.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          MOBILE CARDS
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Guest Booking List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredBookings.length} of {bookingData.length} guest bookings.
          </p>
        </div>

        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {booking.guestName}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {booking.bookingId}
                </p>
              </div>

               <div className="text-right">
                <StatusBadge status={booking.bookingStatus} />

                {booking.bookingStatus === "Expired" && booking.expiredReason !== "-" && (
                  <p className="mt-2 text-xs font-bold text-orange-600">
                    {booking.expiredReason}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={booking.paymentStatus} />
              <StatusBadge status={booking.anprAccess} />
              <StatusBadge status={booking.entryStatus} />
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo label="Vehicle" value={booking.vehiclePlate} />
              <MobileInfo
                label="Schedule"
                value={`${booking.bookingDate}, ${booking.startTime} - ${booking.endTime}`}
              />
              <MobileInfo
                label="Bay"
                value={
                  booking.bayNumber
                    ? `${booking.bayNumber} • ${booking.zone}`
                    : booking.parkingAllocation
                }
              />
              <MobileInfo
                label="Parking Fee"
                value={`RM ${booking.parkingFee.toFixed(2)} • ${booking.paymentMethod}`}
              />
              <MobileInfo label="Visit Purpose" value={booking.visitPurpose} />
            </div>

            <button
              type="button"
              onClick={() => setSelectedBooking(booking)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
              View Details
            </button>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          GUEST BOOKING MODAL
          ===================================================== */}

      <GuestBookingModal
        booking={selectedBooking}
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onUpdateAnprAccess={handleUpdateAnprAccess}
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
        No guest bookings found
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

export default GuestBookings