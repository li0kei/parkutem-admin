// =====================================================
// IMPORTS
// =====================================================

import {
  AlertTriangle,
  CalendarCheck,
  Car,
  Clock3,
  CreditCard,
  Edit3,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// CONSTANTS
// =====================================================

const statusOptions = ["Upcoming", "Active", "Completed", "Cancelled"]

// =====================================================
// HELPERS
// =====================================================

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

function getReservationTotal(reservation) {
  return (
    Number(reservation?.reservationFee || 0) +
    Number(reservation?.after7ParkingFee || 0)
  )
}

function canCancelReservation(reservation) {
  return !["Cancelled", "Completed"].includes(reservation?.status)
}

// =====================================================
// RESERVATION DETAIL MODAL
// =====================================================

function ReservationDetailModal({
  reservation,
  isOpen,
  onClose,
  onUpdateStatus,
  onEdit,
  onCancel,
  onDelete,
  isActionLoading = false,
}) {
  if (!isOpen || !reservation) {
    return null
  }

  function handleStatusChange(event) {
    const nextStatus = event.target.value

    if (nextStatus === reservation.status) {
      return
    }

    if (
      nextStatus === "Cancelled" &&
      !window.confirm(
        "Cancel this reservation? The bay will be released if there is no other active/upcoming reservation for the same bay."
      )
    ) {
      return
    }

    onUpdateStatus?.(reservation.id, nextStatus)
  }

  function handleEdit() {
    onEdit?.(reservation)
  }

  function handleCancel() {
    onCancel?.(reservation)
  }

  function handleDelete() {
    onDelete?.(reservation)
  }

  const totalFee = getReservationTotal(reservation)
  const isCancelled = reservation.status === "Cancelled"
  const isCompleted = reservation.status === "Completed"

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* =====================================================
            MODAL HEADER
            ===================================================== */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              Reservation Details
            </p>

            <h2 className="mt-1 break-words text-2xl font-black text-slate-950">
              {reservation.reservationId}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {reservation.userName} - {reservation.vehiclePlate}
            </p>

            <div className="mt-3">
              <StatusBadge status={reservation.status} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isActionLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            MODAL BODY
            ===================================================== */}

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoBox
              icon={User}
              label="User"
              value={`${reservation.userName} - ${reservation.universityId}`}
              subValue={reservation.userType}
            />

            <InfoBox
              icon={Car}
              label="Vehicle Plate"
              value={reservation.vehiclePlate}
              subValue={reservation.normalizedPlateNumber || "ANPR Plate"}
            />

            <InfoBox
              icon={MapPin}
              label="Bay / Zone"
              value={`${reservation.bayNumber} - ${reservation.zone}`}
              subValue={reservation.locationName || "Parking location"}
            />

            <InfoBox
              icon={CalendarCheck}
              label="Date"
              value={reservation.date}
              subValue="Reservation date"
            />

            <InfoBox
              icon={Clock3}
              label="Time"
              value={`${reservation.startTime} - ${reservation.endTime}`}
              subValue={reservation.duration}
            />

            <InfoBox
              icon={ShieldCheck}
              label="Bay Sync"
              value={
                ["Upcoming", "Active"].includes(reservation.status)
                  ? "Reserved"
                  : "Release Check"
              }
              subValue={
                ["Upcoming", "Active"].includes(reservation.status)
                  ? "Bay should stay reserved"
                  : "Available if no active/upcoming reservation"
              }
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            {/* =====================================================
                FEE BREAKDOWN
                ===================================================== */}

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Fee Breakdown
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Fixed reservation fee + after 7PM reserved time fee.
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <FeeRow
                  label="Reservation Fee"
                  value={`RM ${formatMoney(reservation.reservationFee)}`}
                  note="Fixed one-time reservation fee"
                />

                <FeeRow
                  label="After 7PM Parking Fee"
                  value={`RM ${formatMoney(reservation.after7ParkingFee)}`}
                  note={reservation.parkingFeeRule}
                />

                <FeeRow
                  label="Total Charged"
                  value={`RM ${formatMoney(totalFee)}`}
                  note="Wallet payment total for this reservation"
                  strong
                />

                <FeeRow
                  label="Payment Method"
                  value={reservation.paymentMethod || "wallet"}
                  note="Student/staff wallet transaction"
                />
              </div>
            </div>

            {/* =====================================================
                RESERVATION CONTROL
                ===================================================== */}

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Reservation Control
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Update status safely without disabling RLS.
                  </p>
                </div>

                <StatusBadge status={reservation.status} />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update Status
                </label>

                <select
                  value={reservation.status}
                  onChange={handleStatusChange}
                  disabled={isActionLoading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-600">
                  <Wallet className="h-5 w-5" />
                </div>

                <p className="text-sm font-black text-slate-950">
                  Payment Rule
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Reservation payment uses{" "}
                  <span className="font-black">payment_type</span>{" "}
                  reservation_fee, <span className="font-black">method</span>{" "}
                  wallet, and <span className="font-black">status</span> paid.
                </p>
              </div>

              {(isCancelled || isCompleted) && (
                <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                  <p className="text-sm font-semibold leading-6 text-amber-700">
                    This reservation is {reservation.status.toLowerCase()}. Bay
                    status should be available again only if no other
                    active/upcoming reservation exists for this bay.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =====================================================
              RAW TIMELINE / REMARKS
              ===================================================== */}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Reservation Timeline
              </p>

              <div className="mt-4 space-y-3">
                <TimelineRow
                  label="Start"
                  value={reservation.reservationStartAt || "-"}
                />

                <TimelineRow
                  label="End"
                  value={reservation.reservationEndAt || "-"}
                />

                <TimelineRow
                  label="Created"
                  value={reservation.createdAt || reservation.raw?.created_at || "-"}
                />

                <TimelineRow
                  label="Updated"
                  value={reservation.updatedAt || reservation.raw?.updated_at || "-"}
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Remarks
              </p>

              <p className="mt-3 min-h-[96px] rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                {reservation.remarks && reservation.remarks !== "-"
                  ? reservation.remarks
                  : "No remarks recorded."}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            MODAL FOOTER
            ===================================================== */}

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row">
            {onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                disabled={isActionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            )}

            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={
                  isActionLoading || !canCancelReservation(reservation)
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isActionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isActionLoading}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isActionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// INFO BOX
// =====================================================

function InfoBox({ icon: Icon, label, value, subValue }) {
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

      {subValue && (
        <p className="mt-1 break-words text-xs font-semibold text-slate-400">
          {subValue}
        </p>
      )}
    </div>
  )
}

// =====================================================
// FEE ROW
// =====================================================

function FeeRow({ label, value, note, strong = false }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-800">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
            {note}
          </p>
        </div>

        <p
          className={`shrink-0 text-sm ${
            strong ? "font-black text-cyan-700" : "font-black text-slate-950"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// =====================================================
// TIMELINE ROW
// =====================================================

function TimelineRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  )
}

export default ReservationDetailModal