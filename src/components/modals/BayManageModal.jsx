// =====================================================
// IMPORTS
// =====================================================

import {
  Car,
  Cpu,
  MapPin,
  Radio,
  Save,
  TimerReset,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// BAY MANAGE MODAL
// =====================================================

function BayManageModal({ bay, isOpen, onClose, onUpdateStatus }) {
  if (!isOpen || !bay) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* =====================================================
            MODAL HEADER
            ===================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              Manage Parking Bay
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Bay {bay.bayNumber}
            </h2>
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
              icon={MapPin}
              label="Parking Zone"
              value={bay.zone}
            />

            <InfoBox
              icon={Car}
              label="Current Vehicle"
              value={bay.currentVehicle === "-" ? "No vehicle detected" : bay.currentVehicle}
            />

            <InfoBox
              icon={Cpu}
              label="Sensor Health"
              value={
                bay.sensorStatus === "Placeholder"
                  ? "Placeholder • IoT sensor not connected yet"
                  : `${bay.sensorStatus} • ${bay.sensorBattery}`
              }
            />

            <InfoBox
              icon={Radio}
              label="ANPR Access"
              value={bay.anprLinked}
            />

            <InfoBox
              icon={TimerReset}
              label="Last Updated"
              value={bay.lastUpdated}
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Current Bay Status
                </p>

                <div className="mt-2">
                  <StatusBadge status={bay.status} />
                </div>
              </div>

              <div className="w-full sm:w-64">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Update Status
                </label>

                <select
                  value={bay.status}
                  onChange={(event) =>
                    onUpdateStatus(bay.id, event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              This bay status is saved to Supabase. IoT sensor updates will be connected
              during the hardware integration phase.
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

function InfoBox({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`rounded-[1.4rem] border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-slate-800">{value}</p>
    </div>
  )
}

export default BayManageModal