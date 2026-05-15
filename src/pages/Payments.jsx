// =====================================================
// IMPORTS
// =====================================================

import { useMemo, useState } from "react"
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

import {
  paymentMethodOptions,
  payments,
  paymentStatusOptions,
  paymentTypeOptions,
  paymentUserTypeOptions,
} from "../data/payments"

// =====================================================
// WALLET & PAYMENT TRANSACTIONS PAGE
// =====================================================

function Payments() {
  const [paymentData, setPaymentData] = useState(payments)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All Types")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedUserType, setSelectedUserType] = useState("All Users")
  const [selectedMethod, setSelectedMethod] = useState("All Methods")
  const [selectedPayment, setSelectedPayment] = useState(null)

  // =====================================================
  // FILTERED PAYMENTS
  // =====================================================

  const filteredPayments = useMemo(() => {
    return paymentData.filter((payment) => {
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
    paymentData,
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
    const successfulRevenue = paymentData
      .filter((payment) => payment.amount > 0)
      .filter(
        (payment) => payment.status === "Success" || payment.status === "Paid"
      )
      .reduce((total, payment) => total + payment.amount, 0)

    const reservationRevenue = paymentData
      .filter((payment) => payment.type === "Reservation Fee")
      .filter((payment) => payment.status === "Success")
      .reduce((total, payment) => total + payment.amount, 0)

    const parkingRevenue = paymentData
      .filter((payment) => payment.type === "Parking Fee")
      .filter((payment) => payment.status === "Success")
      .reduce((total, payment) => total + payment.amount, 0)

    const guestRevenue = paymentData
      .filter((payment) => payment.type === "Guest Parking Fee")
      .filter((payment) => payment.status === "Paid")
      .reduce((total, payment) => total + payment.amount, 0)

    const refunds = paymentData
      .filter((payment) => payment.type === "Refund")
      .reduce((total, payment) => total + Math.abs(payment.amount), 0)

    return {
      total: paymentData.length,
      successful: paymentData.filter(
        (payment) => payment.status === "Success" || payment.status === "Paid"
      ).length,
      pending: paymentData.filter((payment) => payment.status === "Pending")
        .length,
      failed: paymentData.filter((payment) => payment.status === "Failed")
        .length,
      successfulRevenue,
      reservationRevenue,
      parkingRevenue,
      guestRevenue,
      refunds,
    }
  }, [paymentData])

  // =====================================================
  // UPDATE PAYMENT STATUS
  // =====================================================

  function handleUpdateStatus(paymentId, newStatus) {
    const updatePayment = (payment) => {
      if (payment.id !== paymentId) {
        return payment
      }

      return {
        ...payment,
        status: newStatus,
      }
    }

    setPaymentData((prev) => prev.map(updatePayment))

    setSelectedPayment((prev) => {
      if (!prev || prev.id !== paymentId) {
        return prev
      }

      return updatePayment(prev)
    })
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
  }

  return (
    <div className="space-y-6">
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
              Showing {filteredPayments.length} of {paymentData.length} transactions.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Dummy Payment Records
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
            Showing {filteredPayments.length} of {paymentData.length} transactions.
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
    "Parking Fee": "bg-blue-50 text-blue-700",
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