// =====================================================
// IMPORTS
// =====================================================

import {
  CalendarCheck,
  Car,
  CreditCard,
  Receipt,
  User,
  Wallet,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// PAYMENT DETAIL MODAL
// =====================================================

function PaymentDetailModal({ payment, isOpen, onClose }) {
  if (!isOpen || !payment) {
    return null
  }

  const amount = Number(payment.amount || 0)
  const isRefund = amount < 0

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* =====================================================
            MODAL HEADER
            ===================================================== */}

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              Payment Transaction
            </p>

            <h2 className="mt-1 break-words text-2xl font-black text-slate-950">
              {payment.transactionId}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {payment.type} • {payment.userName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            MODAL BODY
            ===================================================== */}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* =====================================================
              MAIN PAYMENT DETAILS
              ===================================================== */}

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBox
              icon={Receipt}
              label="Transaction Type"
              value={payment.type}
            />

            <InfoBox
              icon={Wallet}
              label="Amount"
              value={`${isRefund ? "-" : ""}RM ${Math.abs(amount).toFixed(2)}`}
            />

            <InfoBox
              icon={User}
              label="User"
              value={`${payment.userName} • ${payment.userType}`}
            />

            <InfoBox
              icon={Car}
              label="Vehicle Plate"
              value={payment.vehiclePlate || "-"}
            />

            <InfoBox
              icon={CalendarCheck}
              label="Date / Time"
              value={payment.dateTime}
            />

            <InfoBox
              icon={CreditCard}
              label="Payment Method"
              value={payment.paymentMethod}
            />
          </div>

          {/* =====================================================
              REFERENCE AND STATUS
              ===================================================== */}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">
                Transaction Reference
              </p>

              <div className="mt-4 space-y-3">
                <DetailRow label="Reference ID" value={payment.reference} />

                <DetailRow label="Source" value={payment.source} />

                <DetailRow label="Status" value={payment.status} status />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">
                Payment Record Status
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={payment.status} />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                This payment record is loaded from Supabase. Guest payments are
                created from the guest web portal. Student/staff wallet top-up,
                reservation fees, and after-7PM parking payments will be
                connected in the next backend phase.
              </p>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Admin Note
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Payment status is read-only here to prevent local-only changes.
                  Refunds or manual corrections should be handled through a
                  proper backend function later.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              PAYMENT LOGIC PANEL
              ===================================================== */}

          <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-600">
              <Wallet className="h-5 w-5" />
            </div>

            <p className="text-sm font-black text-slate-950">
              ParkUTeM Payment Logic
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Student/staff users will use wallet in the mobile app. Guest users
              pay through the guest web portal and do not use wallet. Guest
              no-show bookings are non-refundable, while overstay fees can be
              issued through the guest web portal later.
            </p>
          </div>

          {/* =====================================================
              REMARKS
              ===================================================== */}

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Remarks
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {payment.remarks || "-"}
            </p>
          </div>
        </div>

        {/* =====================================================
            MODAL FOOTER
            ===================================================== */}

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// INFO BOX
// =====================================================

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  )
}

// =====================================================
// DETAIL ROW
// =====================================================

function DetailRow({ label, value, status = false }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black text-slate-800">{label}</p>

        {status ? (
          <StatusBadge status={value} />
        ) : (
          <p className="break-words text-right text-sm font-black text-slate-950">
            {value || "-"}
          </p>
        )}
      </div>
    </div>
  )
}

export default PaymentDetailModal