// =====================================================
// IMPORTS
// =====================================================

import {
  CalendarCheck,
  Car,
  CircleDollarSign,
  CreditCard,
  Receipt,
  ShieldCheck,
  User,
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

  const showProviderDetails =
    payment.isProviderManaged ||
    (payment.paymentProvider && payment.paymentProvider !== "-")

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* =====================================================
            MODAL HEADER
            ===================================================== */}

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              Guest Payment Transaction
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
              icon={CircleDollarSign}
              label="Amount"
              value={`${isRefund ? "-" : ""}RM ${Math.abs(amount).toFixed(2)}`}
            />

            <InfoBox
              icon={User}
              label="Guest"
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
                This Guest payment record is loaded from the ParkUTeM payment
                ledger in Supabase. Provider-managed payments are verified
                server-side before the Guest booking is activated.
              </p>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Admin Note
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Provider-managed payment status is read-only. Billplz
                  payment state must come from its verified callback, not
                  from a local admin edit.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              PROVIDER VERIFICATION
              ===================================================== */}

          {showProviderDetails && (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950">
                    Payment Provider Verification
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Provider metadata is read-only audit information from
                    the server-side payment integration.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProviderRow
                  label="Provider"
                  value={payment.paymentProvider}
                />

                <ProviderRow
                  label="Provider Status"
                  value={payment.providerStatus}
                />

                <ProviderRow
                  label="Bill ID"
                  value={payment.providerBillId}
                />

                <ProviderRow
                  label="Provider Reference"
                  value={payment.providerReference}
                />

                <ProviderRow
                  label="Provider Updated"
                  value={payment.providerUpdatedAt}
                />

                <ProviderRow
                  label="Provider Reason"
                  value={payment.providerReason}
                />
              </div>

              <p className="mt-4 text-[11px] font-semibold leading-5 text-emerald-800">
                Security-sensitive return tokens and raw provider callback
                payloads are intentionally not exposed in the Admin UI.
              </p>
            </div>
          )}

          {/* =====================================================
              PAYMENT LOGIC PANEL
              ===================================================== */}

          <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <p className="text-sm font-black text-slate-950">
              Guest Payment Flow
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Admin Payments displays Guest-linked payment records only.
              Billplz/provider-managed payment status is verified by the
              server-side callback and remains read-only in this view.
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

// =====================================================
// PROVIDER ROW
// =====================================================

function ProviderRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  )
}

export default PaymentDetailModal
