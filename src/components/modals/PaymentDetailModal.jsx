// =====================================================
// IMPORTS
// =====================================================

import {
  CalendarCheck,
  Car,
  CreditCard,
  Receipt,
  Save,
  User,
  Wallet,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// PAYMENT DETAIL MODAL
// =====================================================

function PaymentDetailModal({ payment, isOpen, onClose, onUpdateStatus }) {
  if (!isOpen || !payment) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* =====================================================
            MODAL HEADER
            ===================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              Payment Transaction
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {payment.transactionId}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {payment.type} • {payment.userName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            MODAL BODY
            ===================================================== */}

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBox icon={Receipt} label="Transaction Type" value={payment.type} />
            <InfoBox icon={Wallet} label="Amount" value={`RM ${Math.abs(payment.amount).toFixed(2)}`} />
            <InfoBox icon={User} label="User" value={`${payment.userName} • ${payment.userType}`} />
            <InfoBox icon={Car} label="Vehicle Plate" value={payment.vehiclePlate} />
            <InfoBox icon={CalendarCheck} label="Date / Time" value={payment.dateTime} />
            <InfoBox icon={CreditCard} label="Payment Method" value={payment.paymentMethod} />
          </div>

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
                Admin Control
              </p>

              <div className="mt-3">
                <StatusBadge status={payment.status} />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update Status
                </label>

                <select
                  value={payment.status}
                  onChange={(event) =>
                    onUpdateStatus(payment.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Success">Success</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                This is a dummy frontend update. Later, payment records will be
                connected with wallet, guest booking, and transaction tables.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-600">
              <Wallet className="h-5 w-5" />
            </div>

            <p className="text-sm font-black text-slate-950">
              ParkUTeM Payment Logic
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Student/staff use wallet in the mobile app. Guest users pay
              through the guest web portal and do not use wallet. Reservation
              fee is fixed, while parking fee is charged separately after 7PM.
            </p>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Remarks
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {payment.remarks}
            </p>
          </div>
        </div>

        {/* =====================================================
            MODAL FOOTER
            ===================================================== */}

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
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
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
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
        {value}
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
          <p className="text-sm font-black text-slate-950">{value}</p>
        )}
      </div>
    </div>
  )
}

export default PaymentDetailModal