// =====================================================
// IMPORTS
// =====================================================

import {
  Building2,
  Car,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// USER DETAIL MODAL
// =====================================================

function UserDetailModal({ user, isOpen, onClose, onUpdateAccountStatus }) {
  if (!isOpen || !user) {
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
              User Details
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {user.name}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {user.universityId} • {user.role}
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
            <InfoBox icon={User} label="Role" value={user.role} />
            <InfoBox icon={Building2} label="Faculty / Department" value={`${user.faculty} • ${user.department}`} />
            <InfoBox icon={Mail} label="Email" value={user.email} />
            <InfoBox icon={Phone} label="Phone" value={user.phone} />
            <InfoBox icon={Car} label="Vehicle" value={`${user.vehiclePlate} • ${user.vehicleModel}`} />
            <InfoBox icon={Wallet} label="Wallet Balance" value={`RM ${user.walletBalance.toFixed(2)}`} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatusPanel label="Sticker Status" status={user.stickerStatus} />
            <StatusPanel label="Account Status" status={user.accountStatus} />
            <StatusPanel label="Last Activity" text={user.lastActivity} />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Account Control
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This account status is saved to Supabase. Later, wallet and vehicle
                  ownership changes will be connected through the mobile app backend.
                 </p>
              </div>

              <div className="w-full sm:w-60">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update Account
                </label>

                <select
                  value={user.accountStatus}
                  onChange={(event) =>
                    onUpdateAccountStatus(user.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
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
            <ShieldCheck className="h-4 w-4" />
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
// STATUS PANEL
// =====================================================

function StatusPanel({ label, status, text }) {
  return (
    <div className="rounded-[1.4rem] bg-slate-50 p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      {status ? (
        <StatusBadge status={status} />
      ) : (
        <p className="text-sm font-black text-slate-700">{text}</p>
      )}
    </div>
  )
}

export default UserDetailModal