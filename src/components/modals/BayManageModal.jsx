// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  Car,
  Cpu,
  MapPin,
  Plus,
  Radio,
  Save,
  TimerReset,
  Trash2,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// OPTIONS
// =====================================================

const statusOptions = ["Available", "Occupied", "Reserved", "Maintenance"]

const sensorOptions = ["Placeholder", "Online", "Offline"]

// =====================================================
// INITIAL STATE
// =====================================================

function getInitialBayForm({ bay, parkingZones, mode }) {
  const firstZoneId = parkingZones?.[0]?.id || ""

  if (mode === "create") {
    return {
      bayNumber: "",
      zoneId: firstZoneId,
      status: "Available",
      sensorStatus: "Placeholder",
    }
  }

  return {
    bayNumber: bay?.bayNumber || "",
    zoneId: bay?.zoneId || bay?.raw?.zone_id || firstZoneId,
    status: bay?.status || "Available",
    sensorStatus:
      bay?.sensorStatus === "Warning"
        ? "Placeholder"
        : bay?.sensorStatus || "Placeholder",
  }
}

function getInitialZoneForm() {
  return {
    zoneCode: "",
    zoneName: "",
    locationName: "",
    description: "",
  }
}

// =====================================================
// HELPERS
// =====================================================

function hasZoneDraft(zoneForm) {
  return (
    zoneForm.zoneCode.trim() ||
    zoneForm.zoneName.trim() ||
    zoneForm.locationName.trim() ||
    zoneForm.description.trim()
  )
}

// =====================================================
// BAY MANAGE MODAL
// =====================================================

function BayManageModal({
  bay,
  isOpen,
  mode = "edit",
  parkingZones = [],
  onClose,
  onCreateBay,
  onCreateZone,
  onUpdateBay,
  onDeleteBay,
}) {
  const isCreateMode = mode === "create"

  const [bayForm, setBayForm] = useState(() =>
    getInitialBayForm({ bay, parkingZones, mode })
  )

  const [zoneForm, setZoneForm] = useState(getInitialZoneForm)

  const [isZoneFormOpen, setIsZoneFormOpen] = useState(false)
  const [isSubmittingBay, setIsSubmittingBay] = useState(false)
  const [isSubmittingZone, setIsSubmittingZone] = useState(false)

  const [bayError, setBayError] = useState("")
  const [zoneError, setZoneError] = useState("")

  const selectedZone = useMemo(() => {
    return parkingZones.find((zone) => zone.id === bayForm.zoneId) || null
  }, [parkingZones, bayForm.zoneId])

  const zoneDraftStarted = Boolean(hasZoneDraft(zoneForm))

  const canDelete =
    !isCreateMode &&
    bay &&
    bay.currentVehicle === "-" &&
    (bay.status === "Available" || bay.status === "Maintenance")

  // =====================================================
  // RESET MODAL STATE WHEN OPEN
  // =====================================================

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setBayForm(getInitialBayForm({ bay, parkingZones, mode }))
    setZoneForm(getInitialZoneForm())
    setIsZoneFormOpen(false)
    setBayError("")
    setZoneError("")
    setIsSubmittingBay(false)
    setIsSubmittingZone(false)
  }, [isOpen, bay?.id, mode])

  // =====================================================
  // AUTO SELECT FIRST ZONE IF ZONES LOAD LATE
  // =====================================================

  useEffect(() => {
    if (!isOpen || bayForm.zoneId || parkingZones.length === 0) {
      return
    }

    setBayForm((prev) => ({
      ...prev,
      zoneId: parkingZones[0].id,
    }))
  }, [isOpen, bayForm.zoneId, parkingZones])

  if (!isOpen) {
    return null
  }

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  function handleBayChange(field, value) {
    setBayForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleZoneChange(field, value) {
    setZoneForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function validateZoneForm() {
    if (!onCreateZone) {
      return "Create zone function is not connected."
    }

    if (!zoneForm.zoneCode.trim()) {
      return "Zone code is required."
    }

    if (!zoneForm.zoneName.trim()) {
      return "Zone name is required."
    }

    if (!zoneForm.locationName.trim()) {
      return "Location name is required."
    }

    return ""
  }

  async function createZoneAndSelect() {
    const validationError = validateZoneForm()

    if (validationError) {
      setZoneError(validationError)
      throw new Error(validationError)
    }

    setZoneError("")
    setIsSubmittingZone(true)

    try {
      const createdZone = await onCreateZone({
        zoneCode: zoneForm.zoneCode,
        zoneName: zoneForm.zoneName,
        locationName: zoneForm.locationName,
        description: zoneForm.description,
      })

      setBayForm((prev) => ({
        ...prev,
        zoneId: createdZone.id,
      }))

      setZoneForm(getInitialZoneForm())
      setIsZoneFormOpen(false)

      return createdZone
    } catch (error) {
      console.error("Create parking zone error:", error)

      const message = error.message || "Unable to create parking zone."

      setZoneError(message)
      throw new Error(message)
    } finally {
      setIsSubmittingZone(false)
    }
  }

  async function handleCreateZoneOnly() {
    try {
      await createZoneAndSelect()
    } catch {
      // Error already shown inside zone form.
    }
  }

  async function handleSubmitBay(event) {
    event.preventDefault()

    setBayError("")
    setZoneError("")

    if (!bayForm.bayNumber.trim()) {
      setBayError("Bay number is required.")
      return
    }

    setIsSubmittingBay(true)

    try {
      let finalZoneId = bayForm.zoneId

      if (isZoneFormOpen && zoneDraftStarted) {
        const createdZone = await createZoneAndSelect()
        finalZoneId = createdZone.id
      }

      if (!finalZoneId) {
        setBayError("Parking zone is required.")
        return
      }

      const payload = {
        bayNumber: bayForm.bayNumber,
        zoneId: finalZoneId,
        status: bayForm.status,
        sensorStatus: bayForm.sensorStatus,
      }

      if (isCreateMode) {
        await onCreateBay(payload)
      } else {
        await onUpdateBay(bay.id, payload)
      }

      onClose()
    } catch (error) {
      console.error("Parking bay form error:", error)

      setBayError(error.message || "Unable to save parking bay.")
    } finally {
      setIsSubmittingBay(false)
    }
  }

  async function handleDeleteBay() {
    if (!bay || !onDeleteBay) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${bay.bayNumber}? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setIsSubmittingBay(true)
    setBayError("")

    try {
      await onDeleteBay(bay.id)
      onClose()
    } catch (error) {
      console.error("Delete parking bay error:", error)
      setBayError(error.message || "Unable to delete parking bay.")
    } finally {
      setIsSubmittingBay(false)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <ModalHeader
          title={isCreateMode ? "Add New Bay" : `Bay ${bay?.bayNumber}`}
          eyebrow={isCreateMode ? "Create Parking Bay" : "Manage Parking Bay"}
          onClose={onClose}
        />

        <form onSubmit={handleSubmitBay}>
          <div className="max-h-[75vh] overflow-y-auto p-6">
            {bayError && <ErrorMessage message={bayError} />}

            <BayFormSection
              form={bayForm}
              parkingZones={parkingZones}
              isZoneFormOpen={isZoneFormOpen}
              zoneDraftStarted={zoneDraftStarted}
              onChange={handleBayChange}
              onToggleZoneForm={() => setIsZoneFormOpen((prev) => !prev)}
            />

            {isZoneFormOpen && (
              <ZoneFormSection
                form={zoneForm}
                error={zoneError}
                isSubmitting={isSubmittingZone}
                onChange={handleZoneChange}
                onCreateZone={handleCreateZoneOnly}
                onClose={() => {
                  setIsZoneFormOpen(false)
                  setZoneForm(getInitialZoneForm())
                  setZoneError("")
                }}
              />
            )}

            {!isCreateMode && bay && (
              <BayInfoSection bay={bay} selectedZone={selectedZone} />
            )}
          </div>

          <ModalFooter
            isCreateMode={isCreateMode}
            canDelete={canDelete}
            isSubmitting={isSubmittingBay || isSubmittingZone}
            zoneDraftStarted={isZoneFormOpen && zoneDraftStarted}
            onClose={onClose}
            onDelete={handleDeleteBay}
          />
        </form>
      </div>
    </div>
  )
}

// =====================================================
// MODAL HEADER
// =====================================================

function ModalHeader({ title, eyebrow, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
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
  )
}

// =====================================================
// BAY FORM SECTION
// =====================================================

function BayFormSection({
  form,
  parkingZones,
  isZoneFormOpen,
  zoneDraftStarted,
  onChange,
  onToggleZoneForm,
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Bay Number">
          <input
            type="text"
            value={form.bayNumber}
            onChange={(event) => onChange("bayNumber", event.target.value)}
            placeholder="Example: A-01"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />
        </FormField>

        <FormField label="Parking Zone">
          <div className="flex gap-2">
            <select
              value={form.zoneId}
              onChange={(event) => onChange("zoneId", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            >
              {parkingZones.length === 0 && (
                <option value="">No active zone found</option>
              )}

              {parkingZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.zoneName} — {zone.locationName}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onToggleZoneForm}
              className={`flex h-[46px] shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-black text-white transition ${
                isZoneFormOpen
                  ? "bg-slate-700 hover:bg-slate-800"
                  : "bg-cyan-600 hover:bg-cyan-700"
              }`}
              title="Add parking zone"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {isZoneFormOpen && zoneDraftStarted && (
            <p className="mt-2 text-xs font-bold text-cyan-700">
              New zone draft detected. Create Bay will create this zone first.
            </p>
          )}
        </FormField>

        <FormField label="Bay Status">
          <select
            value={form.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Sensor Status">
          <select
            value={form.sensorStatus}
            onChange={(event) => onChange("sensorStatus", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          >
            {sensorOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Bay details will be saved directly to Supabase. Sensor status is
        prepared for future IoT integration.
      </p>
    </div>
  )
}

// =====================================================
// ZONE FORM SECTION
// =====================================================

function ZoneFormSection({
  form,
  error,
  isSubmitting,
  onChange,
  onCreateZone,
  onClose,
}) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50/60 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">
            Add Parking Zone
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create a new zone here. It will be selected automatically for this
            parking bay.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm font-black text-slate-500 hover:text-slate-900"
        >
          Close
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Zone Code">
          <input
            type="text"
            value={form.zoneCode}
            onChange={(event) => onChange("zoneCode", event.target.value)}
            placeholder="Example: F"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />
        </FormField>

        <FormField label="Zone Name">
          <input
            type="text"
            value={form.zoneName}
            onChange={(event) => onChange("zoneName", event.target.value)}
            placeholder="Example: Zone F"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />
        </FormField>

        <FormField label="Location Name">
          <input
            type="text"
            value={form.locationName}
            onChange={(event) => onChange("locationName", event.target.value)}
            placeholder="Example: FPTT"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />
        </FormField>
      </div>

      <div className="mt-4">
        <FormField label="Description">
          <input
            type="text"
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Optional"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />
        </FormField>
      </div>

      <button
        type="button"
        onClick={onCreateZone}
        disabled={isSubmitting}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {isSubmitting ? "Creating Zone..." : "Create & Select Zone"}
      </button>
    </div>
  )
}

// =====================================================
// BAY INFO SECTION
// =====================================================

function BayInfoSection({ bay, selectedZone }) {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoBox
          icon={MapPin}
          label="Parking Zone"
          value={
            selectedZone
              ? `${selectedZone.zoneName} • ${selectedZone.locationName}`
              : bay.zone
          }
        />

        <InfoBox
          icon={Car}
          label="Current Vehicle"
          value={
            bay.currentVehicle === "-"
              ? "No vehicle detected"
              : bay.currentVehicle
          }
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

        <InfoBox icon={Radio} label="ANPR Access" value={bay.anprLinked} />

        <InfoBox
          icon={TimerReset}
          label="Last Updated"
          value={bay.lastUpdated}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              Current Bay Status
            </p>

            <div className="mt-2">
              <StatusBadge status={bay.status} />
            </div>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-500">
            Use the form above to edit bay number, zone, status, and sensor
            details.
          </p>
        </div>
      </div>
    </>
  )
}

// =====================================================
// MODAL FOOTER
// =====================================================

function ModalFooter({
  isCreateMode,
  canDelete,
  isSubmitting,
  zoneDraftStarted,
  onClose,
  onDelete,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {!isCreateMode && (
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete || isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
            title={
              canDelete
                ? "Delete parking bay"
                : "Only available or maintenance bays without vehicles can be deleted"
            }
          >
            <Trash2 className="h-4 w-4" />
            Delete Bay
          </button>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        {zoneDraftStarted && (
          <p className="text-right text-xs font-bold text-cyan-700">
            New zone will be created before saving this bay.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreateMode ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {isSubmitting
              ? "Saving..."
              : isCreateMode
                ? "Create Bay"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// FORM FIELD
// =====================================================

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      {children}
    </div>
  )
}

// =====================================================
// INFO BOX
// =====================================================

function InfoBox({ icon: Icon, label, value, className = "" }) {
  return (
    <div
      className={`rounded-[1.4rem] border border-slate-200 bg-white p-4 ${className}`}
    >
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

// =====================================================
// ERROR MESSAGE
// =====================================================

function ErrorMessage({ message }) {
  return (
    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  )
}

export default BayManageModal