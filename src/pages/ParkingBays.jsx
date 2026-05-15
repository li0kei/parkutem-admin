// =====================================================
// IMPORTS
// =====================================================

import { useMemo, useState } from "react"
import {
  Car,
  CircleCheck,
  CircleParking,
  Clock3,
  MonitorCog,
  MoreHorizontal,
  TriangleAlert,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import BayManageModal from "../components/modals/BayManageModal"

import {
  bayStatusOptions,
  parkingBays,
  parkingZoneOptions,
  sensorStatusOptions,
} from "../data/parkingBays"

// =====================================================
// PARKING BAY MANAGEMENT PAGE
// =====================================================

function ParkingBays() {
  const [bayData, setBayData] = useState(parkingBays)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState("All Zones")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedSensor, setSelectedSensor] = useState("All Sensors")
  const [selectedBay, setSelectedBay] = useState(null)

  // =====================================================
  // FILTERED PARKING BAYS
  // =====================================================

  const filteredBays = useMemo(() => {
    return bayData.filter((bay) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        bay.bayNumber.toLowerCase().includes(searchValue) ||
        bay.currentVehicle.toLowerCase().includes(searchValue) ||
        bay.zone.toLowerCase().includes(searchValue)

      const matchesZone =
        selectedZone === "All Zones" || bay.zone === selectedZone

      const matchesStatus =
        selectedStatus === "All Status" || bay.status === selectedStatus

      const matchesSensor =
        selectedSensor === "All Sensors" ||
        bay.sensorStatus === selectedSensor

      return matchesSearch && matchesZone && matchesStatus && matchesSensor
    })
  }, [bayData, searchTerm, selectedZone, selectedStatus, selectedSensor])

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: bayData.length,
      available: bayData.filter((bay) => bay.status === "Available").length,
      occupied: bayData.filter((bay) => bay.status === "Occupied").length,
      reserved: bayData.filter((bay) => bay.status === "Reserved").length,
      maintenance: bayData.filter((bay) => bay.status === "Maintenance").length,
      sensorIssues: bayData.filter(
        (bay) => bay.sensorStatus === "Offline" || bay.sensorStatus === "Warning"
      ).length,
    }
  }, [bayData])

  // =====================================================
  // UPDATE BAY STATUS
  // =====================================================

  function handleUpdateBayStatus(bayId, newStatus) {
    const updateBay = (bay) => {
      if (bay.id !== bayId) {
        return bay
      }

      const shouldClearVehicle =
        newStatus === "Available" || newStatus === "Maintenance"

      return {
        ...bay,
        status: newStatus,
        currentVehicle: shouldClearVehicle ? "-" : bay.currentVehicle,
        lastUpdated: "Just now",
      }
    }

    setBayData((prev) => prev.map(updateBay))

    setSelectedBay((prev) => {
      if (!prev || prev.id !== bayId) {
        return prev
      }

      return updateBay(prev)
    })
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function handleResetFilters() {
    setSearchTerm("")
    setSelectedZone("All Zones")
    setSelectedStatus("All Status")
    setSelectedSensor("All Sensors")
  }

  return (
    <div className="space-y-6">
     {/* =====================================================
    SUMMARY PANEL
    ===================================================== */}

<section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
  <div className="relative p-4 sm:p-6">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_35%)]" />
    <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

    <div className="relative z-10 mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
          Bay Operations
        </p>

       <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
          Parking Bay Status Overview
        </h2>
      </div>

      <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
        Live placeholder view for bay availability, sensor condition, and admin
        monitoring.
      </p>
    </div>

    <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <SummaryCard
        label="Total Bays"
        value={summary.total}
        icon={CircleParking}
        className="bg-cyan-300/10 text-cyan-300"
        dark
      />

      <SummaryCard
        label="Available"
        value={summary.available}
        icon={CircleCheck}
        className="bg-emerald-300/10 text-emerald-300"
        dark
      />

      <SummaryCard
        label="Occupied"
        value={summary.occupied}
        icon={Car}
        className="bg-blue-300/10 text-blue-300"
        dark
      />

      <SummaryCard
        label="Reserved"
        value={summary.reserved}
        icon={Clock3}
        className="bg-amber-300/10 text-amber-300"
        dark
      />

      <SummaryCard
        label="Maintenance"
        value={summary.maintenance}
        icon={MonitorCog}
        className="bg-red-300/10 text-red-300"
        dark
      />

      <SummaryCard
        label="Sensor Issues"
        value={summary.sensorIssues}
        icon={TriangleAlert}
        className="bg-orange-300/10 text-orange-300"
        dark
      />
    </div>
  </div>
</section>

      {/* =====================================================
          FILTER PANEL
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] xl:items-end">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Search
            </label>

            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search bay number, plate, or zone..."
            />
          </div>

          <FilterSelect
            label="Zone"
            value={selectedZone}
            onChange={setSelectedZone}
            options={parkingZoneOptions}
          />

          <FilterSelect
            label="Bay Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={bayStatusOptions}
          />

          <FilterSelect
            label="Sensor"
            value={selectedSensor}
            onChange={setSelectedSensor}
            options={sensorStatusOptions}
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </section>

      {/* =====================================================
          DESKTOP TABLE
          ===================================================== */}

      <section className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm backdrop-blur lg:block">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Parking Bay List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredBays.length} of {bayData.length} parking bays.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            IoT Sensor Placeholder
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>Bay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Sensor Health</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredBays.map((bay) => (
                <tr
                  key={bay.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {bay.bayNumber}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {bay.zone}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={bay.status} />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {bay.currentVehicle === "-"
                        ? "No vehicle"
                        : bay.currentVehicle}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <SensorHealth
                      status={bay.sensorStatus}
                      battery={bay.sensorBattery}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-500">
                      {bay.lastUpdated}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedBay(bay)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBays.length === 0 && <EmptyResult onReset={handleResetFilters} />}
      </section>

      {/* =====================================================
          MOBILE CARD LIST
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Parking Bay List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredBays.length} of {bayData.length} bays.
          </p>
        </div>

        {filteredBays.map((bay) => (
          <div
            key={bay.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {bay.bayNumber}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {bay.zone}
                </p>
              </div>

              <StatusBadge status={bay.status} />
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo
                label="Vehicle"
                value={
                  bay.currentVehicle === "-" ? "No vehicle" : bay.currentVehicle
                }
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                  Sensor Health
                </p>

                <SensorHealth
                  status={bay.sensorStatus}
                  battery={bay.sensorBattery}
                />
              </div>

              <MobileInfo label="Last Updated" value={bay.lastUpdated} />
            </div>

            <button
              type="button"
              onClick={() => setSelectedBay(bay)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
              Manage Bay
            </button>
          </div>
        ))}

        {filteredBays.length === 0 && <EmptyResult onReset={handleResetFilters} />}
      </section>

      {/* =====================================================
          MANAGE MODAL
          ===================================================== */}

      <BayManageModal
        bay={selectedBay}
        isOpen={Boolean(selectedBay)}
        onClose={() => setSelectedBay(null)}
        onUpdateStatus={handleUpdateBayStatus}
      />
    </div>
  )
}

// =====================================================
// TABLE HEAD
// =====================================================

function TableHead({ children }) {
  return (
    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
      {children}
    </th>
  )
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({ label, value, icon: Icon, className, dark = false }) {
  return (
    <div
      className={`rounded-[1.3rem] border p-4 shadow-sm sm:rounded-[1.5rem] sm:p-5 ${
        dark
          ? "border-white/10 bg-white/[0.06] backdrop-blur"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl sm:mb-4 sm:h-11 sm:w-11 ${className}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p
        className={`text-xl font-black sm:text-2xl ${
          dark ? "text-white" : "text-slate-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-xs font-bold sm:text-sm ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>
    </div>
  )
}

// =====================================================
// SENSOR HEALTH
// =====================================================

function SensorHealth({ status, battery }) {
  const statusColor = {
    Online: "bg-emerald-500",
    Warning: "bg-orange-500",
    Offline: "bg-slate-400",
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            statusColor[status] || "bg-slate-400"
          }`}
        />

        <p className="text-sm font-black text-slate-700">{status}</p>
      </div>

      <p className="mt-1 text-xs font-semibold text-slate-400">
        Battery {battery}
      </p>
    </div>
  )
}

// =====================================================
// MOBILE INFO
// =====================================================

function MobileInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="text-sm font-black text-slate-700">{value}</p>
    </div>
  )
}

// =====================================================
// EMPTY RESULT
// =====================================================

function EmptyResult({ onReset }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-black text-slate-950">
        No parking bays found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search keyword or selected filters.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
      >
        Reset Filters
      </button>
    </div>
  )
}

export default ParkingBays