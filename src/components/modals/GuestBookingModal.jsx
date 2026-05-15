// =====================================================
// IMPORTS
// =====================================================

import {
  CalendarCheck,
  Car,
  Clock3,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Radio,
  Receipt,
  Save,
  User,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// GUEST BOOKING MODAL
// =====================================================

function GuestBookingModal({
  booking,
  isOpen,
  onClose,
  onUpdateBookingStatus,
  onUpdateAnprAccess,
}) {
  if (!isOpen || !booking) {
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
              Guest Booking Details
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {booking.bookingId}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {booking.guestName} • {booking.vehiclePlate}
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
            <InfoBox icon={User} label="Guest Name" value={booking.guestName} />
            <InfoBox icon={Car} label="Vehicle Plate" value={booking.vehiclePlate} />
            <InfoBox icon={Mail} label="Email" value={booking.email} />
            <InfoBox icon={Phone} label="Phone" value={booking.phone} />
            <InfoBox icon={MapPin} label="Bay / Zone" value={`${booking.bayNumber} • ${booking.zone}`} />
            <InfoBox icon={CalendarCheck} label="Booking Date" value={booking.bookingDate} />
            <InfoBox icon={Clock3} label="Time" value={`${booking.startTime} - ${booking.endTime}`} />
            <InfoBox icon={Clock3} label="Duration" value={booking.duration} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">
                Payment & Receipt
              </p>

              <div className="mt-4 space-y-3">
                <DetailRow
                  icon={CreditCard}
                  label="Parking Fee"
                  value={`RM ${booking.parkingFee.toFixed(2)}`}
                />

                <DetailRow
                  icon={CreditCard}
                  label="Payment Method"
                  value={booking.paymentMethod}
                />

                <DetailRow
                  icon={Receipt}
                  label="Receipt Status"
                  value={booking.receiptStatus}
                  status
                />

                <DetailRow
                  icon={CreditCard}
                  label="Payment Status"
                  value={booking.paymentStatus}
                  status
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">
                ANPR Access Control
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={booking.anprAccess} />
                <StatusBadge status={booking.entryStatus} />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update ANPR Access
                </label>

                <select
                  value={booking.anprAccess}
                  onChange={(event) =>
                    onUpdateAnprAccess(booking.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Enabled">Enabled</option>
                  <option value="Not Enabled">Not Enabled</option>
                  <option value="Expired">Expired</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update Booking Status
                </label>

                <select
                  value={booking.bookingStatus}
                  onChange={(event) =>
                    onUpdateBookingStatus(booking.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-600">
              <Radio className="h-5 w-5" />
            </div>

            <p className="text-sm font-black text-slate-950">
              Updated Guest Access Rule
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Guest booking does not require admin approval or QR for gate
              entry. Once payment is successful, the guest plate is registered
              automatically and ANPR can allow entry during the valid booking
              period.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoBox icon={Clock3} label="Entry Time" value={booking.entryTime} />
            <InfoBox icon={Clock3} label="Exit Time" value={booking.exitTime} />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Visit Purpose
            </p>

            <p className="mt-2 text-sm font-black text-slate-800">
              {booking.visitPurpose}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Host: {booking.hostDepartment}
            </p>

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {booking.remarks}
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

function DetailRow({ icon: Icon, label, value, status = false }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Icon className="h-4 w-4" />
          </div>

          <p className="text-sm font-black text-slate-800">{label}</p>
        </div>

        {status ? (
          <StatusBadge status={value} />
        ) : (
          <p className="text-sm font-black text-slate-950">{value}</p>
        )}
      </div>
    </div>
  )
}

export default GuestBookingModal