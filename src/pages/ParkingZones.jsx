import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CircleCheck,
  CircleOff,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Save,
  Settings2,
} from "lucide-react"

import ZoneMapPicker from "../components/parking/ZoneMapPicker"
import {
  createParkingZoneWithMap,
  loadAdminParkingZonesForManagement,
  updateParkingZoneDetails,
} from "../services/adminParkingBayService"

const EMPTY_FORM = {
  zoneCode: "",
  zoneName: "",
  locationName: "",
  description: "",
  isActive: true,
  guestEnabled: true,
  mapLabel: "",
  mapLatitude: "",
  mapLongitude: "",
}

function sortZones(zones) {
  return [...zones].sort((a, b) =>
    String(a.zoneCode || "").localeCompare(String(b.zoneCode || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
}

function toForm(zone) {
  if (!zone) {
    return { ...EMPTY_FORM }
  }

  return {
    zoneCode: zone.zoneCode || "",
    zoneName: zone.zoneName || "",
    locationName: zone.locationName || "",
    description: zone.description || "",
    isActive: zone.isActive !== false,
    guestEnabled: zone.guestEnabled !== false,
    mapLabel: zone.mapLabel || "",
    mapLatitude:
      zone.mapLatitude === null || zone.mapLatitude === undefined
        ? ""
        : String(zone.mapLatitude),
    mapLongitude:
      zone.mapLongitude === null || zone.mapLongitude === undefined
        ? ""
        : String(zone.mapLongitude),
  }
}

function ParkingZones() {
  const [zones, setZones] = useState([])
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [mode, setMode] = useState("edit")
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  )

  const summary = useMemo(() => {
    return {
      total: zones.length,
      active: zones.filter((zone) => zone.isActive).length,
      guestEnabled: zones.filter((zone) => zone.guestEnabled).length,
      mapped: zones.filter(
        (zone) =>
          zone.mapLatitude !== null &&
          zone.mapLatitude !== undefined &&
          zone.mapLongitude !== null &&
          zone.mapLongitude !== undefined
      ).length,
    }
  }, [zones])

  const loadZones = useCallback(async () => {
    setIsLoading(true)
    setLoadError("")

    try {
      const data = sortZones(await loadAdminParkingZonesForManagement())
      setZones(data)

      if (mode !== "create") {
        const preferred =
          data.find((zone) => zone.id === selectedZoneId) || data[0] || null

        setSelectedZoneId(preferred?.id || null)
        setForm(toForm(preferred))
        setMode(preferred ? "edit" : "create")
      }
    } catch (error) {
      console.error("Load parking zones error:", error)
      setLoadError(error.message || "Unable to load parking zones from Supabase.")
      setZones([])
    } finally {
      setIsLoading(false)
    }
  }, [mode, selectedZoneId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadZones()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))

    setSaveError("")
    setSuccessMessage("")
  }

  function handleSelectZone(zone) {
    setSelectedZoneId(zone.id)
    setMode("edit")
    setForm(toForm(zone))
    setSaveError("")
    setSuccessMessage("")
  }

  function handleNewZone() {
    setSelectedZoneId(null)
    setMode("create")
    setForm({ ...EMPTY_FORM })
    setSaveError("")
    setSuccessMessage("")
  }

  function handleMapChange({ latitude, longitude }) {
    setForm((prev) => ({
      ...prev,
      mapLatitude: String(latitude),
      mapLongitude: String(longitude),
    }))
    setSaveError("")
    setSuccessMessage("")
  }

  function handleClearMap() {
    setForm((prev) => ({
      ...prev,
      mapLatitude: "",
      mapLongitude: "",
    }))
    setSaveError("")
    setSuccessMessage("")
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveError("")
    setSuccessMessage("")

    try {
      const payload = {
        zoneCode: form.zoneCode,
        zoneName: form.zoneName,
        locationName: form.locationName,
        description: form.description,
        isActive: form.isActive,
        guestEnabled: form.guestEnabled,
        mapLabel: form.mapLabel,
        mapLatitude: form.mapLatitude,
        mapLongitude: form.mapLongitude,
      }

      let savedZone

      if (mode === "create") {
        savedZone = await createParkingZoneWithMap(payload)

        setZones((prev) => sortZones([...prev, savedZone]))
        setSelectedZoneId(savedZone.id)
        setMode("edit")
        setForm(toForm(savedZone))
        setSuccessMessage("Parking zone created successfully.")
      } else {
        savedZone = await updateParkingZoneDetails(selectedZoneId, payload)

        setZones((prev) =>
          sortZones(
            prev.map((zone) => (zone.id === savedZone.id ? savedZone : zone))
          )
        )
        setForm(toForm(savedZone))
        setSuccessMessage("Parking zone updated successfully.")
      }
    } catch (error) {
      console.error("Save parking zone error:", error)
      setSaveError(error.message || "Unable to save parking zone.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-200/60 sm:px-8 lg:px-10 lg:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              <MapPinned size={16} />
              Phase 03B
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Parking Zone & Map Management
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              Configure which parking zones are available to guests and place
              each zone on the campus map. Guest availability will later use
              these saved coordinates together with the Phase 03A availability
              RPC.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadZones()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleNewZone}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              <Plus size={17} />
              New Zone
            </button>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {loadError}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Zones" value={summary.total} helper="All records" />
        <SummaryCard label="Active Zones" value={summary.active} helper="Operational" />
        <SummaryCard
          label="Guest Enabled"
          value={summary.guestEnabled}
          helper="Visible to Guest flow"
        />
        <SummaryCard
          label="Mapped Zones"
          value={summary.mapped}
          helper="Latitude + longitude saved"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Parking Zones
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Select a zone to edit.
              </p>
            </div>

            {isLoading && <Loader2 size={20} className="animate-spin text-cyan-600" />}
          </div>

          <div className="mt-3 space-y-2">
            {zones.map((zone) => {
              const active = zone.id === selectedZoneId && mode === "edit"
              const mapped =
                zone.mapLatitude !== null &&
                zone.mapLatitude !== undefined &&
                zone.mapLongitude !== null &&
                zone.mapLongitude !== undefined

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => handleSelectZone(zone)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-cyan-300 bg-cyan-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {zone.zoneCode} â€” {zone.zoneName}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {zone.locationName}
                      </p>
                    </div>

                    <span
                      className={`mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-[11px] font-black ${
                        mapped
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {mapped ? "MAP" : "â€”"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MiniBadge
                      active={zone.isActive}
                      activeLabel="Active"
                      inactiveLabel="Inactive"
                    />
                    <MiniBadge
                      active={zone.guestEnabled}
                      activeLabel="Guest"
                      inactiveLabel="No Guest"
                    />
                  </div>
                </button>
              )
            })}

            {!isLoading && zones.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                No parking zones found.
              </div>
            )}
          </div>
        </aside>

        <form
          onSubmit={handleSave}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                <Settings2 size={15} />
                {mode === "create" ? "Create Parking Zone" : "Zone Configuration"}
              </div>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                {mode === "create"
                  ? "New Parking Zone"
                  : selectedZone?.zoneName || "Parking Zone"}
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Zone coordinates are stored at zone level. Individual bays remain
                linked to the zone through their existing bay records.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {isSaving ? "Saving..." : mode === "create" ? "Create Zone" : "Save Changes"}
            </button>
          </div>

          {saveError && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {saveError}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CircleCheck size={18} />
              {successMessage}
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Field label="Zone Code" hint="Example: A, B, F">
              <input
                value={form.zoneCode}
                onChange={(event) => updateField("zoneCode", event.target.value)}
                placeholder="A"
                className={inputClass}
              />
            </Field>

            <Field label="Zone Name" hint="Name shown across Admin and Guest">
              <input
                value={form.zoneName}
                onChange={(event) => updateField("zoneName", event.target.value)}
                placeholder="Zone A"
                className={inputClass}
              />
            </Field>

            <Field label="Location Name" hint="Human-readable campus location">
              <input
                value={form.locationName}
                onChange={(event) => updateField("locationName", event.target.value)}
                placeholder="Library Area"
                className={inputClass}
              />
            </Field>

            <Field label="Map Label" hint="Popup label on the Guest map">
              <input
                value={form.mapLabel}
                onChange={(event) => updateField("mapLabel", event.target.value)}
                placeholder="Library Parking"
                className={inputClass}
              />
            </Field>

            <div className="lg:col-span-2">
              <Field label="Description" hint="Optional admin description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Parking zone near the library entrance."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>

            <ToggleCard
              label="Zone Active"
              description="Inactive zones remain in Admin but are excluded from public availability."
              checked={form.isActive}
              onChange={(checked) => updateField("isActive", checked)}
            />

            <ToggleCard
              label="Guest Parking Enabled"
              description="Controls whether this zone can be returned by Guest availability."
              checked={form.guestEnabled}
              onChange={(checked) => updateField("guestEnabled", checked)}
            />
          </div>

          <div className="my-8 h-px bg-slate-100" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Campus Map Position
              </p>
              <h3 className="mt-2 text-lg font-black text-slate-950">
                Place this zone on the map
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Click the parking area directly on the map. Latitude and longitude
                will be filled automatically, but they can still be edited manually.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearMap}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              <CircleOff size={17} />
              Clear Coordinates
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Field label="Latitude" hint="-90 to 90">
              <input
                type="number"
                step="0.000001"
                value={form.mapLatitude}
                onChange={(event) => updateField("mapLatitude", event.target.value)}
                placeholder="2.xxxxxx"
                className={inputClass}
              />
            </Field>

            <Field label="Longitude" hint="-180 to 180">
              <input
                type="number"
                step="0.000001"
                value={form.mapLongitude}
                onChange={(event) => updateField("mapLongitude", event.target.value)}
                placeholder="102.xxxxxx"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5">
            <ZoneMapPicker
              latitude={form.mapLatitude}
              longitude={form.mapLongitude}
              label={form.mapLabel || form.locationName || form.zoneName || "Parking zone"}
              locationName={form.locationName}
              zoneName={form.zoneName}
              onChange={handleMapChange}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4 text-sm font-semibold leading-6 text-cyan-900">
            The Guest portal will not read sensitive parking-bay table rows directly.
            It will use the Phase 03A availability RPC, which already returns only
            safe bay and zone metadata including these map coordinates.
          </div>
        </form>
      </section>
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
        {hint && <span className="text-xs font-semibold text-slate-400">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function ToggleCard({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-28 items-start justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-cyan-200 bg-cyan-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div>
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <span
        className={`relative mt-1 inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-cyan-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  )
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  )
}

function MiniBadge({ active, activeLabel, inactiveLabel }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? <CircleCheck size={11} /> : <CircleOff size={11} />}
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export default ParkingZones


