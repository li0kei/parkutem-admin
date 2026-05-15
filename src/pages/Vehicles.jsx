// =====================================================
// IMPORTS
// =====================================================

import { useMemo, useState } from "react"
import {
  Car,
  CheckCircle,
  CircleAlert,
  Clock3,
  MoreHorizontal,
  Radio,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import StickerReviewModal from "../components/modals/StickerReviewModal"

import {
  vehicleAnprStatusOptions,
  vehicles,
  vehicleStickerStatusOptions,
  vehicleUserTypeOptions,
} from "../data/vehicles"

// =====================================================
// VEHICLES & STICKER RECORDS PAGE
// =====================================================

function Vehicles() {
  const [vehicleData, setVehicleData] = useState(vehicles)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUserType, setSelectedUserType] = useState("All Types")
  const [selectedSticker, setSelectedSticker] = useState("All Stickers")
  const [selectedAnpr, setSelectedAnpr] = useState("All ANPR")
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // =====================================================
  // FILTERED VEHICLES
  // =====================================================

  const filteredVehicles = useMemo(() => {
    return vehicleData.filter((vehicle) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        vehicle.plateNumber.toLowerCase().includes(searchValue) ||
        vehicle.ownerName.toLowerCase().includes(searchValue) ||
        vehicle.universityId.toLowerCase().includes(searchValue) ||
        vehicle.vehicleModel.toLowerCase().includes(searchValue) ||
        vehicle.vehicleColor.toLowerCase().includes(searchValue) ||
        vehicle.faculty.toLowerCase().includes(searchValue)

      const matchesUserType =
        selectedUserType === "All Types" ||
        vehicle.userType === selectedUserType

      const matchesSticker =
        selectedSticker === "All Stickers" ||
        vehicle.stickerStatus === selectedSticker

      const matchesAnpr =
        selectedAnpr === "All ANPR" || vehicle.anprStatus === selectedAnpr

      return matchesSearch && matchesUserType && matchesSticker && matchesAnpr
    })
  }, [vehicleData, searchTerm, selectedUserType, selectedSticker, selectedAnpr])

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: vehicleData.length,
      active: vehicleData.filter((vehicle) => vehicle.stickerStatus === "Active")
        .length,
      pending: vehicleData.filter(
        (vehicle) => vehicle.stickerStatus === "Pending"
      ).length,
      expired: vehicleData.filter(
        (vehicle) => vehicle.stickerStatus === "Expired"
      ).length,
      rejected: vehicleData.filter(
        (vehicle) => vehicle.stickerStatus === "Rejected"
      ).length,
      anprEnabled: vehicleData.filter(
        (vehicle) => vehicle.anprStatus === "Enabled"
      ).length,
    }
  }, [vehicleData])

  // =====================================================
  // UPDATE STICKER STATUS
  // =====================================================

  function handleUpdateStickerStatus(vehicleId, newStatus) {
    const updateVehicle = (vehicle) => {
      if (vehicle.id !== vehicleId) {
        return vehicle
      }

      const shouldEnableAnpr = newStatus === "Active"

      return {
        ...vehicle,
        stickerStatus: newStatus,
        anprStatus: shouldEnableAnpr ? "Enabled" : vehicle.anprStatus,
        expiryDate: shouldEnableAnpr ? "15 May 2027" : vehicle.expiryDate,
        remarks:
          newStatus === "Active"
            ? "Sticker approved by admin. ANPR access can be enabled."
            : vehicle.remarks,
      }
    }

    setVehicleData((prev) => prev.map(updateVehicle))

    setSelectedVehicle((prev) => {
      if (!prev || prev.id !== vehicleId) {
        return prev
      }

      return updateVehicle(prev)
    })
  }

  // =====================================================
  // UPDATE ANPR STATUS
  // =====================================================

  function handleUpdateAnprStatus(vehicleId, newStatus) {
    const updateVehicle = (vehicle) => {
      if (vehicle.id !== vehicleId) {
        return vehicle
      }

      return {
        ...vehicle,
        anprStatus: newStatus,
      }
    }

    setVehicleData((prev) => prev.map(updateVehicle))

    setSelectedVehicle((prev) => {
      if (!prev || prev.id !== vehicleId) {
        return prev
      }

      return updateVehicle(prev)
    })
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function handleResetFilters() {
    setSearchTerm("")
    setSelectedUserType("All Types")
    setSelectedSticker("All Stickers")
    setSelectedAnpr("All ANPR")
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
                Vehicle Registry
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Vehicle & Sticker Records
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Manage registered plates, sticker approval status, and ANPR
              access permission.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryCard
              label="Total Vehicles"
              value={summary.total}
              icon={Car}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Active"
              value={summary.active}
              icon={CheckCircle}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Pending"
              value={summary.pending}
              icon={Clock3}
              className="bg-amber-300/10 text-amber-300"
            />

            <SummaryCard
              label="Expired"
              value={summary.expired}
              icon={CircleAlert}
              className="bg-orange-300/10 text-orange-300"
            />

            <SummaryCard
              label="Rejected"
              value={summary.rejected}
              icon={XCircle}
              className="bg-red-300/10 text-red-300"
            />

            <SummaryCard
              label="ANPR Enabled"
              value={summary.anprEnabled}
              icon={Radio}
              className="bg-blue-300/10 text-blue-300"
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
              placeholder="Search plate, owner, model, color, ID..."
            />
          </div>

          <FilterSelect
            label="User Type"
            value={selectedUserType}
            onChange={setSelectedUserType}
            options={vehicleUserTypeOptions}
          />

          <FilterSelect
            label="Sticker"
            value={selectedSticker}
            onChange={setSelectedSticker}
            options={vehicleStickerStatusOptions}
          />

          <FilterSelect
            label="ANPR"
            value={selectedAnpr}
            onChange={setSelectedAnpr}
            options={vehicleAnprStatusOptions}
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
              Vehicle List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredVehicles.length} of {vehicleData.length} vehicle
              records.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Sticker Review
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>Vehicle</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Sticker</TableHead>
                <TableHead>ANPR</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {vehicle.plateNumber}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {vehicle.vehicleModel}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {vehicle.vehicleColor}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {vehicle.ownerName}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {vehicle.universityId}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {vehicle.faculty}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <UserTypePill type={vehicle.userType} />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={vehicle.stickerStatus} />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={vehicle.anprStatus} />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">
                      {vehicle.registeredDate}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Exp: {vehicle.expiryDate}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(vehicle)}
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

        {filteredVehicles.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          MOBILE CARDS
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">Vehicle List</h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredVehicles.length} of {vehicleData.length} records.
          </p>
        </div>

        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {vehicle.plateNumber}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {vehicle.vehicleModel} • {vehicle.vehicleColor}
                </p>
              </div>

              <UserTypePill type={vehicle.userType} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={vehicle.stickerStatus} />
              <StatusBadge status={vehicle.anprStatus} />
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo label="Owner" value={vehicle.ownerName} />
              <MobileInfo
                label="University ID"
                value={vehicle.universityId}
              />
              <MobileInfo label="Faculty / Unit" value={vehicle.faculty} />
              <MobileInfo
                label="Validity"
                value={`${vehicle.registeredDate} → ${vehicle.expiryDate}`}
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedVehicle(vehicle)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
              Manage Sticker
            </button>
          </div>
        ))}

        {filteredVehicles.length === 0 && (
          <EmptyResult onReset={handleResetFilters} />
        )}
      </section>

      {/* =====================================================
          STICKER REVIEW MODAL
          ===================================================== */}

      <StickerReviewModal
        vehicle={selectedVehicle}
        isOpen={Boolean(selectedVehicle)}
        onClose={() => setSelectedVehicle(null)}
        onUpdateStickerStatus={handleUpdateStickerStatus}
        onUpdateAnprStatus={handleUpdateAnprStatus}
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

function SummaryCard({ label, value, icon: Icon, className }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur sm:rounded-[1.5rem] sm:p-5">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl sm:mb-4 sm:h-11 sm:w-11 ${className}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xl font-black text-white sm:text-2xl">{value}</p>

      <p className="mt-1 text-xs font-bold text-slate-300 sm:text-sm">
        {label}
      </p>
    </div>
  )
}

// =====================================================
// USER TYPE PILL
// =====================================================

function UserTypePill({ type }) {
  const styles = {
    Student: "bg-blue-50 text-blue-700",
    Staff: "bg-violet-50 text-violet-700",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        styles[type] || "bg-slate-100 text-slate-600"
      }`}
    >
      {type}
    </span>
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

      <p className="break-words text-sm font-black text-slate-700">{value}</p>
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
        No vehicle records found
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

export default Vehicles