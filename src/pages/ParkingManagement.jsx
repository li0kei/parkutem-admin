import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Car,
  CheckCircle2,
  CircleParking,
  Loader2,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Wrench,
} from "lucide-react"

import BayManageModal from "../components/modals/BayManageModal"
import ZoneMapPicker from "../components/parking/ZoneMapPicker"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"
import {
  createParkingBay,
  createParkingZoneWithMap,
  deleteParkingBay,
  loadAdminParkingBays,
  loadAdminParkingZonesForManagement,
  updateParkingBayDetails,
  updateParkingZoneDetails,
} from "../services/adminParkingBayService"

const EMPTY_AREA = {
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

const STATUS_STYLES = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Occupied: "bg-blue-50 text-blue-700 ring-blue-200",
  Reserved: "bg-amber-50 text-amber-700 ring-amber-200",
  Maintenance: "bg-rose-50 text-rose-700 ring-rose-200",
}

const TABS = [
  { key: "details", label: "Details" },
  { key: "map", label: "Map" },
  { key: "bays", label: "Bays" },
]

function sortAreas(areas) {
  return [...areas].sort((a, b) =>
    String(a.zoneCode || "").localeCompare(String(b.zoneCode || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
}

function sortBays(bays) {
  return [...bays].sort((a, b) =>
    String(a.bayNumber || "").localeCompare(String(b.bayNumber || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
}

function toAreaDraft(area) {
  if (!area) {
    return { ...EMPTY_AREA }
  }

  return {
    zoneCode: area.zoneCode || "",
    zoneName: area.zoneName || "",
    locationName: area.locationName || "",
    description: area.description || "",
    isActive: area.isActive !== false,
    guestEnabled: area.guestEnabled !== false,
    mapLabel: area.mapLabel || "",
    mapLatitude:
      area.mapLatitude === null || area.mapLatitude === undefined
        ? ""
        : String(area.mapLatitude),
    mapLongitude:
      area.mapLongitude === null || area.mapLongitude === undefined
        ? ""
        : String(area.mapLongitude),
  }
}

function ParkingManagement() {
  const [areas, setAreas] = useState([])
  const [bays, setBays] = useState([])

  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [areaMode, setAreaMode] = useState("edit")
  const [areaDraft, setAreaDraft] = useState({ ...EMPTY_AREA })
  const [activeTab, setActiveTab] = useState("details")

  const [isLoading, setIsLoading] = useState(true)
  const [isSavingArea, setIsSavingArea] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [areaNotice, setAreaNotice] = useState(null)

  const [baySearch, setBaySearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const [selectedBay, setSelectedBay] = useState(null)
  const [bayModalMode, setBayModalMode] = useState("edit")
  const [isBayModalOpen, setIsBayModalOpen] = useState(false)

  const loadParking = useCallback(
    async ({ silent = false, preferredAreaId = null } = {}) => {
      if (!silent) {
        setIsLoading(true)
      }

      setLoadError("")

      try {
        const [nextBays, nextAreas] = await Promise.all([
          loadAdminParkingBays(),
          loadAdminParkingZonesForManagement(),
        ])

        const sortedAreas = sortAreas(nextAreas)
        const sortedBays = sortBays(nextBays)

        setAreas(sortedAreas)
        setBays(sortedBays)

        if (areaMode !== "create") {
          const targetId =
            preferredAreaId ||
            (sortedAreas.some((area) => area.id === selectedAreaId)
              ? selectedAreaId
              : sortedAreas[0]?.id || null)

          const targetArea =
            sortedAreas.find((area) => area.id === targetId) || null

          setSelectedAreaId(targetId)
          setAreaDraft(toAreaDraft(targetArea))
          setAreaMode(targetArea ? "edit" : "create")
        }
      } catch (error) {
        console.error("Load parking management error:", error)
        setLoadError(
          error.message ||
            "Unable to load parking areas and bays from Supabase."
        )
      } finally {
        if (!silent) {
          setIsLoading(false)
        }
      }
    },
    [areaMode, selectedAreaId]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadParking()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useAdminRealtimeRefresh({
    channelName: "admin-clean-parking-realtime",
    tables: ["parking_bays", "parking_zones"],
    onRefresh: () => {
      void loadParking({ silent: true })
    },
    onStatusChange: (statusInfo) => {
      console.log("Parking realtime:", statusInfo.label)
    },
  })

  const selectedArea = useMemo(
    () => areas.find((area) => area.id === selectedAreaId) || null,
    [areas, selectedAreaId]
  )

  const areaCounts = useMemo(() => {
    const counts = new Map()

    for (const area of areas) {
      counts.set(area.id, {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0,
      })
    }

    for (const bay of bays) {
      const current = counts.get(bay.zoneId)

      if (!current) {
        continue
      }

      current.total += 1

      if (bay.status === "Available") current.available += 1
      if (bay.status === "Occupied") current.occupied += 1
      if (bay.status === "Reserved") current.reserved += 1
      if (bay.status === "Maintenance") current.maintenance += 1
    }

    return counts
  }, [areas, bays])

  const selectedAreaCounts = useMemo(
    () =>
      areaCounts.get(selectedAreaId) || {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0,
      },
    [areaCounts, selectedAreaId]
  )

  const filteredBays = useMemo(() => {
    if (!selectedAreaId) {
      return []
    }

    const query = baySearch.trim().toLowerCase()

    return bays.filter((bay) => {
      if (bay.zoneId !== selectedAreaId) {
        return false
      }

      if (statusFilter !== "All" && bay.status !== statusFilter) {
        return false
      }

      if (!query) {
        return true
      }

      return [
        bay.bayNumber,
        bay.status,
        bay.sensorStatus,
        bay.currentVehicle,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    })
  }, [bays, baySearch, selectedAreaId, statusFilter])

  const totalAvailable = useMemo(
    () => bays.filter((bay) => bay.status === "Available").length,
    [bays]
  )

  function selectArea(area) {
    setSelectedAreaId(area.id)
    setAreaMode("edit")
    setAreaDraft(toAreaDraft(area))
    setActiveTab("details")
    setAreaNotice(null)
    setBaySearch("")
    setStatusFilter("All")
  }

  function startNewArea() {
    setSelectedAreaId(null)
    setAreaMode("create")
    setAreaDraft({ ...EMPTY_AREA })
    setActiveTab("details")
    setAreaNotice(null)
    setBaySearch("")
    setStatusFilter("All")
  }

  function updateAreaField(field, value) {
    setAreaDraft((current) => ({
      ...current,
      [field]: value,
    }))

    setAreaNotice(null)
  }

  function handleMapChange({ latitude, longitude }) {
    setAreaDraft((current) => ({
      ...current,
      mapLatitude: String(latitude),
      mapLongitude: String(longitude),
    }))

    setAreaNotice(null)
  }

  function clearCoordinates() {
    setAreaDraft((current) => ({
      ...current,
      mapLatitude: "",
      mapLongitude: "",
    }))

    setAreaNotice(null)
  }

  async function saveArea() {
    setIsSavingArea(true)
    setAreaNotice(null)

    try {
      const payload = {
        zoneCode: areaDraft.zoneCode,
        zoneName: areaDraft.zoneName,
        locationName: areaDraft.locationName,
        description: areaDraft.description,
        isActive: areaDraft.isActive,
        guestEnabled: areaDraft.guestEnabled,
        mapLabel: areaDraft.mapLabel,
        mapLatitude: areaDraft.mapLatitude,
        mapLongitude: areaDraft.mapLongitude,
      }

      let savedArea

      if (areaMode === "create") {
        savedArea = await createParkingZoneWithMap(payload)
      } else {
        savedArea = await updateParkingZoneDetails(selectedAreaId, payload)
      }

      setSelectedAreaId(savedArea.id)
      setAreaMode("edit")
      setAreaDraft(toAreaDraft(savedArea))
      setAreaNotice({
        type: "success",
        message:
          areaMode === "create"
            ? "Parking area created."
            : "Parking area saved.",
      })

      await loadParking({
        silent: true,
        preferredAreaId: savedArea.id,
      })
    } catch (error) {
      console.error("Save parking area error:", error)
      setAreaNotice({
        type: "error",
        message: error.message || "Unable to save parking area.",
      })
    } finally {
      setIsSavingArea(false)
    }
  }

  function openCreateBay() {
    if (!selectedAreaId) {
      setAreaNotice({
        type: "error",
        message: "Save the Parking Area before adding bays.",
      })
      return
    }

    setSelectedBay(null)
    setBayModalMode("create")
    setIsBayModalOpen(true)
  }

  function openManageBay(bay) {
    setSelectedBay(bay)
    setBayModalMode("edit")
    setIsBayModalOpen(true)
  }

  function closeBayModal() {
    setSelectedBay(null)
    setBayModalMode("edit")
    setIsBayModalOpen(false)
  }

  async function createBay(payload) {
    await createParkingBay(payload)
    await loadParking({
      silent: true,
      preferredAreaId: payload.zoneId,
    })
  }

  async function updateBay(bayId, payload) {
    await updateParkingBayDetails(bayId, payload)
    await loadParking({
      silent: true,
      preferredAreaId: payload.zoneId,
    })
  }

  async function deleteBay(bayId) {
    await deleteParkingBay(bayId)
    await loadParking({
      silent: true,
      preferredAreaId: selectedAreaId,
    })
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-cyan-600" size={28} />
          <p className="mt-4 text-sm font-black text-slate-700">
            Loading parking...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Parking Management
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Parking Areas & Bays
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Choose an area, then manage its details, map and bays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CompactStat label="Areas" value={areas.length} />
          <CompactStat label="Bays" value={bays.length} />
          <CompactStat label="Available" value={totalAvailable} />

          <button
            type="button"
            onClick={() => void loadParking()}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Refresh parking data"
          >
            <RefreshCw size={17} />
          </button>

          <button
            type="button"
            onClick={startNewArea}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-cyan-500"
          >
            <Plus size={17} />
            Add Area
          </button>
        </div>
      </section>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {loadError}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24">
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
              Parking Areas
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {areas.length} configured areas
            </p>
          </div>

          <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-2">
            {areas.map((area) => {
              const counts = areaCounts.get(area.id) || {
                total: 0,
                available: 0,
              }

              const selected =
                area.id === selectedAreaId && areaMode === "edit"

              const mapped =
                area.mapLatitude !== null &&
                area.mapLatitude !== undefined &&
                area.mapLongitude !== null &&
                area.mapLongitude !== undefined

              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => selectArea(area)}
                  className={`mb-1.5 w-full rounded-2xl px-3.5 py-3 text-left transition ${
                    selected
                      ? "bg-cyan-50 ring-1 ring-cyan-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {area.zoneCode} - {area.zoneName}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {area.locationName}
                      </p>
                    </div>

                    <span
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        mapped ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                      title={mapped ? "Map configured" : "Map not configured"}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-700">
                      {counts.available} available
                    </span>
                    <span className="text-slate-400">
                      {counts.total} bays
                    </span>
                  </div>
                </button>
              )
            })}

            {areas.length === 0 && (
              <div className="px-4 py-10 text-center">
                <MapPinned size={24} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">
                  No parking areas
                </p>
              </div>
            )}
          </div>
        </aside>

        <main className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-950">
                    {areaMode === "create"
                      ? "New Parking Area"
                      : selectedArea?.zoneName || "Parking Area"}
                  </h2>

                  {areaMode === "edit" && selectedArea && (
                    <>
                      <StatusChip
                        active={selectedArea.isActive}
                        label={selectedArea.isActive ? "Active" : "Inactive"}
                      />
                      <StatusChip
                        active={selectedArea.guestEnabled}
                        label={
                          selectedArea.guestEnabled ? "Guest" : "No Guest"
                        }
                      />
                    </>
                  )}
                </div>

                <p className="mt-1.5 text-sm font-semibold text-slate-500">
                  {areaMode === "create"
                    ? "Create the area first, then configure its map and bays."
                    : selectedArea?.locationName || "No location name"}
                </p>
              </div>

              {areaMode === "edit" && selectedArea && (
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <InlineMetric
                    icon={CheckCircle2}
                    value={selectedAreaCounts.available}
                    label="Available"
                  />
                  <InlineMetric
                    icon={Car}
                    value={selectedAreaCounts.occupied}
                    label="Occupied"
                  />
                  <InlineMetric
                    icon={Wrench}
                    value={selectedAreaCounts.maintenance}
                    label="Maintenance"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
              {TABS.map((tab) => {
                const disabled =
                  areaMode === "create" && tab.key !== "details"

                return (
                  <button
                    key={tab.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setActiveTab(tab.key)}
                    className={`min-h-10 flex-1 rounded-xl px-4 py-2 text-sm font-black transition ${
                      activeTab === tab.key
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </header>

          <div className="p-5 sm:p-6">
            {areaNotice && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  areaNotice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {areaNotice.message}
              </div>
            )}

            {activeTab === "details" && (
              <DetailsTab
                areaDraft={areaDraft}
                areaMode={areaMode}
                isSaving={isSavingArea}
                onChange={updateAreaField}
                onSave={saveArea}
              />
            )}

            {activeTab === "map" && areaMode === "edit" && (
              <MapTab
                areaDraft={areaDraft}
                isSaving={isSavingArea}
                onChange={updateAreaField}
                onMapChange={handleMapChange}
                onClear={clearCoordinates}
                onSave={saveArea}
              />
            )}

            {activeTab === "bays" && areaMode === "edit" && (
              <BaysTab
                bays={filteredBays}
                totalBays={selectedAreaCounts.total}
                baySearch={baySearch}
                statusFilter={statusFilter}
                onSearchChange={setBaySearch}
                onStatusChange={setStatusFilter}
                onAddBay={openCreateBay}
                onManageBay={openManageBay}
              />
            )}
          </div>
        </main>
      </section>

      {isBayModalOpen && (
        <BayManageModal
          key={`${bayModalMode}-${selectedBay?.id || "new"}-${selectedAreaId || "no-area"}`}
          bay={selectedBay}
          mode={bayModalMode}
          parkingZones={areas}
          defaultZoneId={selectedAreaId || ""}
          onClose={closeBayModal}
          onCreateBay={createBay}
          onUpdateBay={updateBay}
          onDeleteBay={deleteBay}
        />
      )}
    </div>
  )
}

function DetailsTab({
  areaDraft,
  areaMode,
  isSaving,
  onChange,
  onSave,
}) {
  return (
    <div className="max-w-4xl">
      <SectionIntro
        title="Area details"
        description="Basic information and Guest availability for this parking area."
      />

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Field label="Area Code">
          <input
            value={areaDraft.zoneCode}
            onChange={(event) => onChange("zoneCode", event.target.value)}
            placeholder="A"
            className={inputClass}
          />
        </Field>

        <Field label="Area Name">
          <input
            value={areaDraft.zoneName}
            onChange={(event) => onChange("zoneName", event.target.value)}
            placeholder="Zone A"
            className={inputClass}
          />
        </Field>

        <Field label="Location Name">
          <input
            value={areaDraft.locationName}
            onChange={(event) => onChange("locationName", event.target.value)}
            placeholder="Library Area"
            className={inputClass}
          />
        </Field>

        <Field label="Map Label">
          <input
            value={areaDraft.mapLabel}
            onChange={(event) => onChange("mapLabel", event.target.value)}
            placeholder="Library Parking"
            className={inputClass}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Description">
            <textarea
              rows={3}
              value={areaDraft.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Optional parking area description"
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        <SimpleToggle
          label="Area Active"
          description="Use this area for live parking operations."
          checked={areaDraft.isActive}
          onChange={(value) => onChange("isActive", value)}
        />

        <SimpleToggle
          label="Guest Parking"
          description="Show this area to Guest parking users."
          checked={areaDraft.guestEnabled}
          onChange={(value) => onChange("guestEnabled", value)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <PrimarySaveButton
          isSaving={isSaving}
          label={areaMode === "create" ? "Create Area" : "Save Changes"}
          onClick={() => void onSave()}
        />
      </div>
    </div>
  )
}

function MapTab({
  areaDraft,
  isSaving,
  onChange,
  onMapChange,
  onClear,
  onSave,
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionIntro
          title="Map location"
          description="Search a UTeM place or click the map for the exact parking area."
        />

        <button
          type="button"
          onClick={onClear}
          className="min-h-10 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
        >
          Clear coordinates
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Latitude">
          <input
            type="number"
            step="0.000001"
            value={areaDraft.mapLatitude}
            onChange={(event) => onChange("mapLatitude", event.target.value)}
            placeholder="2.xxxxxx"
            className={inputClass}
          />
        </Field>

        <Field label="Longitude">
          <input
            type="number"
            step="0.000001"
            value={areaDraft.mapLongitude}
            onChange={(event) => onChange("mapLongitude", event.target.value)}
            placeholder="102.xxxxxx"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-5">
        <ZoneMapPicker
          latitude={areaDraft.mapLatitude}
          longitude={areaDraft.mapLongitude}
          label={
            areaDraft.mapLabel ||
            areaDraft.locationName ||
            areaDraft.zoneName ||
            "Parking Area"
          }
          locationName={areaDraft.locationName}
          zoneName={areaDraft.zoneName}
          onChange={onMapChange}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <PrimarySaveButton
          isSaving={isSaving}
          label="Save Location"
          onClick={() => void onSave()}
        />
      </div>
    </div>
  )
}

function BaysTab({
  bays,
  totalBays,
  baySearch,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onAddBay,
  onManageBay,
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SectionIntro
          title="Parking bays"
          description={`${totalBays} individual parking spaces in this area.`}
        />

        <button
          type="button"
          onClick={onAddBay}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white transition hover:bg-cyan-500"
        >
          <Plus size={16} />
          Add Bay
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={baySearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search bay or vehicle..."
            className={`${inputClass} mt-0 pl-10`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          className={`${inputClass} mt-0`}
        >
          <option value="All">All status</option>
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Reserved">Reserved</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[120px_150px_160px_minmax(180px,1fr)_80px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 md:grid">
          <span>Bay</span>
          <span>Status</span>
          <span>Sensor</span>
          <span>Vehicle</span>
          <span className="text-right">Action</span>
        </div>

        {bays.map((bay) => (
          <button
            key={bay.id}
            type="button"
            onClick={() => onManageBay(bay)}
            className="grid w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50 md:grid-cols-[120px_150px_160px_minmax(180px,1fr)_80px] md:items-center md:gap-4"
          >
            <div>
              <span className="md:hidden text-[10px] font-black uppercase tracking-wide text-slate-400">
                Bay
              </span>
              <p className="text-sm font-black text-slate-950">
                {bay.bayNumber}
              </p>
            </div>

            <div>
              <span className="md:hidden text-[10px] font-black uppercase tracking-wide text-slate-400">
                Status
              </span>
              <StatusPill value={bay.status} />
            </div>

            <div>
              <span className="md:hidden text-[10px] font-black uppercase tracking-wide text-slate-400">
                Sensor
              </span>
              <p className="text-sm font-semibold text-slate-600">
                {bay.sensorStatus}
              </p>
            </div>

            <div className="min-w-0">
              <span className="md:hidden text-[10px] font-black uppercase tracking-wide text-slate-400">
                Vehicle
              </span>
              <p className="truncate text-sm font-semibold text-slate-700">
                {bay.currentVehicle && bay.currentVehicle !== "-"
                  ? bay.currentVehicle
                  : "No vehicle"}
              </p>
            </div>

            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-700">
                <Pencil size={13} />
                Edit
              </span>
            </div>
          </button>
        ))}

        {bays.length === 0 && (
          <div className="px-5 py-12 text-center">
            <CircleParking size={26} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              No bays found
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Add a bay or clear the current filter.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const inputClass =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function SectionIntro({ title, description }) {
  return (
    <div>
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
    </div>
  )
}

function SimpleToggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-24 items-start justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-cyan-200 bg-cyan-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div>
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <span
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-cyan-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  )
}

function PrimarySaveButton({ isSaving, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Save size={16} />
      )}
      {isSaving ? "Saving..." : label}
    </button>
  )
}

function CompactStat({ label, value }) {
  return (
    <div className="min-w-20 rounded-xl bg-slate-50 px-3 py-2 text-center">
      <p className="text-base font-black text-slate-950">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
    </div>
  )
}

function StatusChip({ active, label }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </span>
  )
}

function InlineMetric({ icon: Icon, value, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
      <Icon size={14} />
      <span className="font-black text-slate-950">{value}</span>
      <span>{label}</span>
    </span>
  )
}

function StatusPill({ value }) {
  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ring-inset md:mt-0 ${
        STATUS_STYLES[value] ||
        "bg-slate-50 text-slate-600 ring-slate-200"
      }`}
    >
      {value}
    </span>
  )
}

export default ParkingManagement
