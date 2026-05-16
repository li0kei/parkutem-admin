// =====================================================
// IMPORTS
// =====================================================

import {
  Calendar,
  Car,
  Palette,
  Radio,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// STICKER REVIEW MODAL
// =====================================================

function StickerReviewModal({
  vehicle,
  isOpen,
  onClose,
  onUpdateStickerStatus,
  onUpdateAnprStatus,
}) {
  if (!isOpen || !vehicle) {
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
              Vehicle & Sticker Record
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {vehicle.plateNumber}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {vehicle.ownerName} • {vehicle.userType}
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
            <InfoBox
              icon={Car}
              label="Vehicle Model"
              value={vehicle.vehicleModel}
            />

            <InfoBox
              icon={Palette}
              label="Vehicle Color"
              value={vehicle.vehicleColor}
            />

            <InfoBox
              icon={User}
              label="Owner"
              value={`${vehicle.ownerName} • ${vehicle.universityId}`}
            />

            <InfoBox
              icon={ShieldCheck}
              label="Faculty / Unit"
              value={vehicle.faculty}
            />

            <InfoBox
              icon={Calendar}
              label="Registered Date"
              value={vehicle.registeredDate}
            />

            <InfoBox
              icon={Calendar}
              label="Expiry Date"
              value={vehicle.expiryDate}
            />

            <InfoBox
              icon={Radio}
              label="ANPR Access"
              value={vehicle.anprStatus}
            />

            <InfoBox
              icon={ShieldCheck}
              label="Sticker Status"
              value={vehicle.stickerStatus}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* =====================================================
                STICKER ACTION PANEL
                ===================================================== */}

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Sticker Review
                </p>

                <div className="mt-2">
                  <StatusBadge status={vehicle.stickerStatus} />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update Sticker
                </label>

                <select
                  value={vehicle.stickerStatus}
                  onChange={(event) =>
                    onUpdateStickerStatus(vehicle.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                If sticker is approved as Active, ANPR access can be enabled for
                automatic plate detection.
              </p>
            </div>

            {/* =====================================================
                ANPR ACTION PANEL
                ===================================================== */}

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-sm font-black text-slate-950">
                  ANPR Access Control
                </p>

                <div className="mt-2">
                  <StatusBadge status={vehicle.anprStatus} />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update ANPR
                </label>

                <select
                  value={vehicle.anprStatus}
                  onChange={(event) =>
                    onUpdateAnprStatus(vehicle.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Enabled">Enabled</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                This ANPR permission is saved to Supabase. Later, the ANPR recognition
                pipeline will use this record to decide whether a detected student/staff
                vehicle should be allowed or flagged.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Remarks
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {vehicle.remarks}
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

export default StickerReviewModal