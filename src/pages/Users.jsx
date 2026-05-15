// =====================================================
// IMPORTS
// =====================================================

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  Briefcase,
  CircleAlert,
  GraduationCap,
  UserCheck,
  Users as UsersIcon,
  Wallet,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import UserDetailModal from "../components/modals/UserDetailModal"

import {
  accountStatusOptions,
  roleOptions,
  stickerStatusOptions,
  users,
} from "../data/users"

// =====================================================
// STUDENT / STAFF MANAGEMENT PAGE
// =====================================================

function Users() {
  const [userData, setUserData] = useState(users)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("All Roles")
  const [selectedSticker, setSelectedSticker] = useState("All Stickers")
  const [selectedAccount, setSelectedAccount] = useState("All Accounts")
  const [selectedUser, setSelectedUser] = useState(null)

  // =====================================================
  // FILTERED USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    return userData.filter((user) => {
      const searchValue = searchTerm.toLowerCase()

      const matchesSearch =
        user.universityId.toLowerCase().includes(searchValue) ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.faculty.toLowerCase().includes(searchValue) ||
        user.department.toLowerCase().includes(searchValue) ||
        user.vehiclePlate.toLowerCase().includes(searchValue)

      const matchesRole =
        selectedRole === "All Roles" || user.role === selectedRole

      const matchesSticker =
        selectedSticker === "All Stickers" ||
        user.stickerStatus === selectedSticker

      const matchesAccount =
        selectedAccount === "All Accounts" ||
        user.accountStatus === selectedAccount

      return matchesSearch && matchesRole && matchesSticker && matchesAccount
    })
  }, [userData, searchTerm, selectedRole, selectedSticker, selectedAccount])

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: userData.length,
      students: userData.filter((user) => user.role === "Student").length,
      staff: userData.filter((user) => user.role === "Staff").length,
      activeStickers: userData.filter((user) => user.stickerStatus === "Active")
        .length,
      lowWallet: userData.filter((user) => user.walletBalance < 10).length,
      suspended: userData.filter((user) => user.accountStatus === "Suspended")
        .length,
    }
  }, [userData])

  // =====================================================
  // UPDATE ACCOUNT STATUS
  // =====================================================

  function handleUpdateAccountStatus(userId, newStatus) {
    const updateUser = (user) => {
      if (user.id !== userId) {
        return user
      }

      return {
        ...user,
        accountStatus: newStatus,
        lastActivity: "Just now",
      }
    }

    setUserData((prev) => prev.map(updateUser))

    setSelectedUser((prev) => {
      if (!prev || prev.id !== userId) {
        return prev
      }

      return updateUser(prev)
    })
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function handleResetFilters() {
    setSearchTerm("")
    setSelectedRole("All Roles")
    setSelectedSticker("All Stickers")
    setSelectedAccount("All Accounts")
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
                University Users
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Student & Staff Account Overview
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Monitor student and staff accounts, vehicle ownership, stickers,
              and wallet balance.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryCard
              label="Total Users"
              value={summary.total}
              icon={UsersIcon}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Students"
              value={summary.students}
              icon={GraduationCap}
              className="bg-blue-300/10 text-blue-300"
            />

            <SummaryCard
              label="Staff"
              value={summary.staff}
              icon={Briefcase}
              className="bg-violet-300/10 text-violet-300"
            />

            <SummaryCard
              label="Active Stickers"
              value={summary.activeStickers}
              icon={BadgeCheck}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Low Wallet"
              value={summary.lowWallet}
              icon={Wallet}
              className="bg-amber-300/10 text-amber-300"
            />

            <SummaryCard
              label="Suspended"
              value={summary.suspended}
              icon={CircleAlert}
              className="bg-red-300/10 text-red-300"
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
              placeholder="Search name, university ID, email, plate..."
            />
          </div>

          <FilterSelect
            label="Role"
            value={selectedRole}
            onChange={setSelectedRole}
            options={roleOptions}
          />

          <FilterSelect
            label="Sticker"
            value={selectedSticker}
            onChange={setSelectedSticker}
            options={stickerStatusOptions}
          />

          <FilterSelect
            label="Account"
            value={selectedAccount}
            onChange={setSelectedAccount}
            options={accountStatusOptions}
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
              Student / Staff List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredUsers.length} of {userData.length} accounts.
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Dummy University Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-left">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Faculty / Dept.</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Sticker</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Action</TableHead>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 transition even:bg-slate-50/45 hover:bg-cyan-50/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-black text-slate-950">{user.name}</p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {user.universityId}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <RolePill role={user.role} />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {user.faculty}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {user.department}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">
                      {user.vehiclePlate}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {user.vehicleModel}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={user.stickerStatus} />
                  </td>

                  <td className="px-6 py-4">
                    <WalletText amount={user.walletBalance} />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={user.accountStatus} />
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <UserCheck className="h-4 w-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && <EmptyResult onReset={handleResetFilters} />}
      </section>

      {/* =====================================================
          MOBILE CARDS
          ===================================================== */}

      <section className="space-y-4 lg:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Student / Staff List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredUsers.length} of {userData.length} accounts.
          </p>
        </div>

        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">
                  {user.name}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {user.universityId}
                </p>
              </div>

              <RolePill role={user.role} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={user.stickerStatus} />
              <StatusBadge status={user.accountStatus} />
            </div>

            <div className="mt-5 grid gap-3">
              <MobileInfo label="Email" value={user.email} />
              <MobileInfo label="Faculty" value={`${user.faculty} • ${user.department}`} />
              <MobileInfo label="Vehicle" value={`${user.vehiclePlate} • ${user.vehicleModel}`} />
              <MobileInfo label="Wallet" value={`RM ${user.walletBalance.toFixed(2)}`} />
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(user)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <UserCheck className="h-4 w-4" />
              View Details
            </button>
          </div>
        ))}

        {filteredUsers.length === 0 && <EmptyResult onReset={handleResetFilters} />}
      </section>

      {/* =====================================================
          USER DETAIL MODAL
          ===================================================== */}

      <UserDetailModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        onUpdateAccountStatus={handleUpdateAccountStatus}
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
// ROLE PILL
// =====================================================

function RolePill({ role }) {
  const styles = {
    Student: "bg-blue-50 text-blue-700",
    Staff: "bg-violet-50 text-violet-700",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        styles[role] || "bg-slate-100 text-slate-600"
      }`}
    >
      {role}
    </span>
  )
}

// =====================================================
// WALLET TEXT
// =====================================================

function WalletText({ amount }) {
  const isLow = amount < 10

  return (
    <div>
      <p
        className={`text-sm font-black ${
          isLow ? "text-orange-600" : "text-slate-700"
        }`}
      >
        RM {amount.toFixed(2)}
      </p>

      {isLow && (
        <p className="mt-1 text-xs font-bold text-orange-500">
          Low balance
        </p>
      )}
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
        No users found
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

export default Users