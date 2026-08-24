import { useMemo, useState } from "react"
import {
  Car,
  Cpu,
  MapPin,
  Radio,
  Save,
  Trash2,
  X,
} from "lucide-react"

const STATUS_OPTIONS = ["Available", "Occupied", "Reserved", "Maintenance"]
const SENSOR_OPTIONS = ["Placeholder", "Online", "Offline"]

function getInitialForm({ bay, parkingZones, mode, defaultZoneId }) {
  const fallbackZoneId =
    defaultZoneId ||
    bay?.zoneId ||
    bay?.raw?.zone_id ||
    parkingZones?.[0]?.id ||
    ""

  if (mode === "create") {
    return {
      bayNumber: "",
      zoneId: fallbackZoneId,
      status: "Available",
      sensorStatus: "Placeholder",
    }
  }

  return {
    bayNumber: bay?.bayNumber || "",
    zoneId: fallbackZoneId,
    status: bay?.status || "Available",
    sensorStatus:
      bay?.sensorStatus === "Warning"
        ? "Placeholder"
        : bay?.sensorStatus || "Placeholder",
  }
}

function BayManageModal({
  bay,
  mode = "edit",
  parkingZones = [],
  defaultZoneId = "",
  onClose,
  onCreateBay,
  onUpdateBay,
  onDeleteBay,
}) {
  const isCreateMode = mode === "create"

  const [form, setForm] = useState(() =>
    getInitialForm({
      bay,
      parkingZones,
      mode,
      defaultZoneId,
    })
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const selectedArea = useMemo(
    () => parkingZones.find((area) => area.id === form.zoneId) || null,
    [parkingZones, form.zoneId]
  )

  const canDelete =
    !isCreateMode &&
    bay &&
    bay.currentVehicle === "-" &&
    (bay.status === "Available" || bay.status === "Maintenance")

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setErrorMessage("")
  }

  function validate() {
    if (!String(form.bayNumber || "").trim()) {
      return "Bay number is required."
    }

    if (!form.zoneId) {
      return "Parking area is required."
    }

    return ""
  }

  async function handleSave() {
    const validationError = validate()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const payload = {
        bayNumber: form.bayNumber,
        zoneId: form.zoneId,
        status: form.status,
        sensorStatus: form.sensorStatus,
      }

      if (isCreateMode) {
        await onCreateBay?.(payload)
      } else {
        await onUpdateBay?.(bay.id, payload)
      }

      onClose?.()
    } catch (error) {
      console.error("Save parking bay error:", error)
      setErrorMessage(error.message || "Unable to save parking bay.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!canDelete || !bay?.id) {
      return
    }

    const confirmed = window.confirm(
      `Delete parking bay ${bay.bayNumber}? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await onDeleteBay?.(bay.id)
      onClose?.()
    } catch (error) {
      console.error("Delete parking bay error:", error)
      setErrorMessage(error.message || "Unable to delete parking bay.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              {isCreateMode ? "Add Parking Bay" : "Manage Parking Bay"}
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {isCreateMode ? "New Parking Bay" : `Bay ${bay?.bayNumber || ""}`}
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              A bay is one individual parking space. Its map location is inherited
              from the selected Parking Area.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={19} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          )}

          <section className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Bay Number" hint="Individual parking slot">
                <input
                  value={form.bayNumber}
                  onChange={(event) => updateField("bayNumber", event.target.value)}
                  placeholder="A-01"
                  className={inputClass}
                />
              </Field>

              <Field label="Parking Area" hint="Map and location are managed by area">
                <select
                  value={form.zoneId}
                  onChange={(event) => updateField("zoneId", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select parking area</option>
                  {parkingZones
                    .filter((area) => area.isActive !== false)
                    .map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.zoneCode} - {area.locationName}
                      </option>
                    ))}
                </select>
              </Field>

              <Field label="Bay Status">
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Sensor Status">
                <select
                  value={form.sensorStatus}
                  onChange={(event) =>
                    updateField("sensorStatus", event.target.value)
                  }
                  className={inputClass}
                >
                  {SENSOR_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={MapPin}
              label="Parking Area"
              value={
                selectedArea
                  ? `${selectedArea.zoneCode} - ${selectedArea.locationName}`
                  : "Not selected"
              }
              note={
                selectedArea?.mapLatitude != null &&
                selectedArea?.mapLongitude != null
                  ? "Map location configured"
                  : "Map location not configured yet"
              }
            />

            <InfoCard
              icon={Car}
              label="Current Vehicle"
              value={bay?.currentVehicle && bay.currentVehicle !== "-" ? bay.currentVehicle : "No vehicle detected"}
              note={bay?.currentUserType && bay.currentUserType !== "-" ? bay.currentUserType : "No active occupant"}
            />

            <InfoCard
              icon={Cpu}
              label="Sensor"
              value={form.sensorStatus}
              note={
                form.sensorStatus === "Placeholder"
                  ? "IoT sensor not connected yet"
                  : "IoT sensor state"
              }
            />

            <InfoCard
              icon={Radio}
              label="ANPR"
              value={bay?.anprLinked || "Pending IoT/ANPR integration"}
              note="Bay state can later be updated by ANPR/IoT."
            />
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            {!isCreateMode && (
              <button
                type="button"
                disabled={!canDelete || isSubmitting}
                onClick={handleDelete}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                title={
                  canDelete
                    ? "Delete parking bay"
                    : "Only available or maintenance bays without vehicles can be deleted"
                }
              >
                <Trash2 size={17} />
                Delete Bay
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {isSubmitting
                ? "Saving..."
                : isCreateMode
                  ? "Create Bay"
                  : "Save Changes"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-slate-800">{label}</span>
        {hint && (
          <span className="text-right text-[11px] font-semibold text-slate-400">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  )
}

function InfoCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
        <Icon size={17} />
      </span>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{note}</p>
    </div>
  )
}

export default BayManageModal
