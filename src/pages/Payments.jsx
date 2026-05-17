// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle,
  CircleDollarSign,
  CreditCard,
  MoreHorizontal,
  Receipt,
  Wallet,
  XCircle,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import PaymentDetailModal from "../components/modals/PaymentDetailModal"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"

import {
  paymentMethodOptions,
  paymentStatusOptions,
  paymentTypeOptions,
  paymentUserTypeOptions,
} from "../data/payments"

import {
  loadAdminPayments,
  updatePaymentTransactionStatus,
} from "../services/adminPaymentService"


// =====================================================
// MONTH HELPERS
// =====================================================

function getCurrentMonthValue() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

function getPaymentDateValue(payment) {
  return (
    payment.raw?.paid_at ||
    payment.raw?.created_at ||
    payment.raw?.reservation_start_at ||
    payment.raw?.updated_at ||
    null
  )
}

function isPaymentInSelectedMonth(payment, selectedMonth) {
  if (!selectedMonth) {
    return true
  }

  const paymentDateValue = getPaymentDateValue(payment)

  if (!paymentDateValue) {
    return false
  }

  const paymentDate = new Date(paymentDateValue)

  if (Number.isNaN(paymentDate.getTime())) {
    return false
  }

  const paymentMonth = `${paymentDate.getFullYear()}-${String(
    paymentDate.getMonth() + 1
  ).padStart(2, "0")}`

  return paymentMonth === selectedMonth
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
// WALLET & PAYMENT TRANSACTIONS PAGE
// =====================================================

function Payments() {
  const [paymentData, setPaymentData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All Types")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedUserType, setSelectedUserType] = useState("All Users")
  const [selectedMethod, setSelectedMethod] = useState("All Methods")
  const [selectedPayment, setSelectedPayment] = useState(null)

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue())

// =====================================================
// LOAD PAYMENTS FROM SUPABASE
// =====================================================

async function loadPayments({ silent = false } = {}) {
  if (!silent) {
    setIsLoading(true)
  }

  setLoadError("")

  try {
    const realPayments = await loadAdminPayments()
    setPaymentData(realPayments)
  } catch (error) {
    console.error("Failed to load payments:", error)

    setLoadError(
      error.message ||
        "Unable to load payment transactions from Supabase. Please check your connection or admin access."
    )

    setPaymentData([])
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
  loadPayments()
}, [])

// =====================================================
// REALTIME REFRESH
// =====================================================

useAdminRealtimeRefresh({
  channelName: "admin-payments-realtime",
  tables: [
    "payment_transactions",
    "guest_bookings",
    "reservations",
  ],
  onRefresh: () => {
    loadPayments({ silent: true })
  },
  onStatusChange: (statusInfo) => {
    console.log("Payments realtime:", statusInfo.label)
  },
})

// =====================================================
// MONTHLY PAYMENT DATA
// =====================================================

const monthlyPaymentData = useMemo(() => {
  return paymentData.filter((payment) =>
    isPaymentInSelectedMonth(payment, selectedMonth)
  )
}, [paymentData, selectedMonth])

  // =====================================================
  // FILTERED PAYMENTS
  // =====================================================

  const filteredPayments = useMemo(() => {
    return monthlyPaymentData.filter((payment) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        payment.transactionId.toLowerCase().includes(searchValue) ||
        payment.userName.toLowerCase().includes(searchValue) ||
        payment.reference.toLowerCase().includes(searchValue) ||
        payment.vehiclePlate.toLowerCase().includes(searchValue) ||
        payment.type.toLowerCase().includes(searchValue) ||
        payment.source.toLowerCase().includes(searchValue)

      const matchesType =
        selectedType === "All Types" || payment.type === selectedType

      const matchesStatus =
        selectedStatus === "All Status" || payment.status === selectedStatus

      const matchesUserType =
        selectedUserType === "All Users" || payment.userType === selectedUserType

      const matchesMethod =
        selectedMethod === "All Methods" ||
        payment.paymentMethod === selectedMethod

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesUserType &&
        matchesMethod
      )
    })
  }, [
    monthlyPaymentData,
    searchTerm,
    selectedType,
    selectedStatus,
    selectedUserType,
    selectedMethod,
  ])

// =====================================================
// SUMMARY COUNTS
// =====================================================

const summary = useMemo(() => {
  const successfulRevenue = monthlyPaymentData
    .filter((payment) => payment.amount > 0)
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0)

  const reservationRevenue = monthlyPaymentData
    .filter((payment) => payment.type === "Reservation Fee")
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0)

  const parkingRevenue = monthlyPaymentData
    .filter((payment) => payment.type === "After 7PM Parking Fee")
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0)

  const guestRevenue = monthlyPaymentData
    .filter((payment) => payment.type === "Guest Parking Fee")
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0)

  const refunds = monthlyPaymentData
    .filter((payment) => payment.status === "Refunded")
    .reduce((total, payment) => total + Math.abs(payment.amount), 0)

  return {
    total: monthlyPaymentData.length,
    successful: monthlyPaymentData.filter(
      (payment) => payment.status === "Paid"
    ).length,
    pending: monthlyPaymentData.filter(
      (payment) => payment.status === "Pending"
    ).length,
    failed: monthlyPaymentData.filter(
      (payment) => payment.status === "Failed"
    ).length,
    successfulRevenue,
    reservationRevenue,
    parkingRevenue,
    guestRevenue,
    refunds,
  }
}, [monthlyPaymentData])

// =====================================================
// UPDATE PAYMENT STATUS
// Only real payment_transactions rows can be updated.
// Reservation fallback rows are display-only.
// =====================================================

async function handleUpdateStatus(paymentId, newStatus) {
  const currentPayment = paymentData.find((payment) => payment.id === paymentId)

  if (!currentPayment) {
    return
  }

  if (currentPayment.dataSource !== "payment_transactions") {
    setLoadError(
      "This payment is a reservation fallback row. It cannot be updated until reservation wallet deduction creates a real payment transaction."
    )

    return
  }

  setLoadError("")

  try {
    const updatedPayment = await updatePaymentTransactionStatus(
      paymentId,
      newStatus
    )

    setPaymentData((prev) =>
      prev.map((payment) =>
        payment.id === paymentId ? updatedPayment : payment
      )
    )

    setSelectedPayment((prev) => {
      if (!prev || prev.id !== paymentId) {
        return prev
      }

      return updatedPayment
    })
  } catch (error) {
    console.error("Failed to update payment status:", error)

    setLoadError(
      error.message || "Unable to update payment status in Supabase."
    )
  }
}

  // =====================================================
  // RESET FILTERS
  // =====================================================

 function handleResetFilters() {
    setSearchTerm("")
    setSelectedType("All Types")
    setSelectedStatus("All Status")
    setSelectedUserType("All Users")
    setSelectedMethod("All Methods")
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
            Loading real payment transactions from Supabase...
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
                Payment Monitoring
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Wallet & Payment Transactions
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Track reservation fees, after-7PM parking fees, guest payments,
              wallet top-ups, and refunds.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryCard
              label="Transactions"
              value={summary.total}
              icon={Receipt}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Successful"
              value={summary.successful}
              icon={CheckCircle}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Pending"
              value={summary.pending}
              icon={Wallet}
              className="bg-amber-300/10 text-amber-300"
            />

            <SummaryCard
              label="Failed"
              value={summary.failed}
              icon={XCircle}
              className="bg-red-300/10 text-red-300"
            />

            <SummaryCard
              label="Revenue"
              value={`RM ${summary.successfulRevenue.toFixed(2)}`}
              icon={CircleDollarSign}
              className="bg-blue-300/10 text-blue-300"
            />

            <SummaryCard
              label="Refunds"
              value={`RM ${summary.refunds.toFixed(2)}`}
              icon={CreditCard}
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
                  Payment Month
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {formatSelectedMonthLabel(selectedMonth)}
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Revenue, transactions, and breakdown are filtered by selected month.
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
          REVENUE BREAKDOWN PANEL
          ===================================================== */}

      <section className="grid gap-4 lg:grid-cols-4">
        <RevenueCard
          label="Reservation Fee"
          amount={summary.reservationRevenue}
          description="Fixed one-time fee"
        />

        <RevenueCard
          label="After 7PM Parking"
          amount={summary.parkingRevenue}
          description="Charged by usage"
        />

        <RevenueCard
          label="Guest Parking"
          amount={summary.guestRevenue}
          description="Guest web payment"
        />

        <RevenueCard
          label="Refunds"
          amount={summary.refunds}
          description="Cancelled/refunded"
          negative
        />
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
              placeholder="Search transaction, user, reference, plate..."
            />
          </div>

          <FilterSelect
            label="Type"
            value={selectedType}
            onChange={setSelectedType}
            options={paymentTypeOptions}
          />

          <FilterSelect
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={paymentStatusOptions}
          />

          <FilterSelect
            label="User"
            value={selectedUserType}
            onChange={setSelectedUserType}
            options={paymentUserTypeOptions}
          />

          <FilterSelect
            label="Method"
            value={selectedMethod}
            onChange={setSelectedMethod}
            options={paymentMethodOptions}
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
              Transaction List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredPayments.length} of {monthlyPaymentData.length} transactions.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Supabase Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>Transaction</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date / Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-950">
                      {payment.transactionId}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Ref: {payment.reference}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {payment.userName}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {payment.userType} • {payment.vehiclePlate}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <TypePill type={payment.type} />
                  </td>

                  <td className="px-6 py-4">
                    <AmountText amount={payment.amount} />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {payment.paymentMethod}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">
                      {payment.dateTime}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {payment.source}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(payment)}
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

        {filteredPayments.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          MOBILE CARDS
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Transaction List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredPayments.length} of {monthlyPaymentData.length} transactions.
          </p>
        </div>

        {filteredPayments.map((payment) => (
          <div
            key={payment.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {payment.transactionId}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {payment.userName}
                </p>
              </div>

              <StatusBadge status={payment.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <TypePill type={payment.type} />
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {payment.paymentMethod}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo label="Amount" value={`RM ${Math.abs(payment.amount).toFixed(2)}`} />
              <MobileInfo label="User Type / Plate" value={`${payment.userType} • ${payment.vehiclePlate}`} />
              <MobileInfo label="Reference" value={payment.reference} />
              <MobileInfo label="Date / Time" value={payment.dateTime} />
              <MobileInfo label="Source" value={payment.source} />
            </div>

            <button
              type="button"
              onClick={() => setSelectedPayment(payment)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
              View Details
            </button>
          </div>
        ))}

        {filteredPayments.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          PAYMENT DETAIL MODAL
          ===================================================== */}

      <PaymentDetailModal
        payment={selectedPayment}
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
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
// REVENUE CARD
// =====================================================

function RevenueCard({ label, amount, description, negative = false }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur">
      <p className="text-sm font-black text-slate-950">{label}</p>

      <p
        className={`mt-3 text-2xl font-black ${
          negative ? "text-violet-700" : "text-cyan-700"
        }`}
      >
        RM {amount.toFixed(2)}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        {description}
      </p>
    </div>
  )
}

// =====================================================
// TYPE PILL
// =====================================================

function TypePill({ type }) {
  const styles = {
    "Reservation Fee": "bg-cyan-50 text-cyan-700",
    "After 7PM Parking Fee": "bg-blue-50 text-blue-700",
    "Guest Parking Fee": "bg-violet-50 text-violet-700",
    "Wallet Top Up": "bg-emerald-50 text-emerald-700",
    Refund: "bg-orange-50 text-orange-700",
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
// AMOUNT TEXT
// =====================================================

function AmountText({ amount }) {
  const isRefund = amount < 0

  return (
    <p
      className={`text-sm font-black ${
        isRefund ? "text-orange-600" : "text-slate-800"
      }`}
    >
      {isRefund ? "-" : ""}RM {Math.abs(amount).toFixed(2)}
    </p>
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
        No transactions found
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

export default Payments