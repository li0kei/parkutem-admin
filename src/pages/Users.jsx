// =====================================================
// IMPORTS
// =====================================================

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BadgeCheck,
  Briefcase,
  CircleAlert,
  Copy,
  GraduationCap,
  KeyRound,
  Plus,
  UserCheck,
  Users as UsersIcon,
  Wallet,
  X,
} from "lucide-react"

import FilterSelect from "../components/common/FilterSelect"
import SearchInput from "../components/common/SearchInput"
import StatusBadge from "../components/common/StatusBadge"
import UserDetailModal from "../components/modals/UserDetailModal"
import { useAdminRealtimeRefresh } from "../hooks/useAdminRealtimeRefresh"

import {
  accountStatusOptions,
  roleOptions,
  stickerStatusOptions,
} from "../data/users"

import {
  createUniversityUser,
  deleteUniversityUser,
  deleteVehicleRecord,
  loadAdminUserById,
  loadAdminUsers,
  updateUniversityUserAccountStatus,
  updateUniversityUserDetails,
} from "../services/adminUserService"

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_ROLE = "All Roles"
const DEFAULT_STICKER = "All Stickers"
const DEFAULT_ACCOUNT = "All Accounts"

const REALTIME_TABLES = [
  "university_users",
  "vehicle_records",
  "anpr_logs",
  "reservations",
  "payment_transactions",
]

// =====================================================
// HELPERS
// =====================================================

function getErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage
}

function sortUsers(users) {
  return [...users].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
}

function updateUserInList(users, updatedUser) {
  return sortUsers(
    users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
  )
}

function buildLoginText(loginInfo) {
  if (!loginInfo) {
    return ""
  }

  return [
    "ParkUTeM Login Details",
    `Name: ${loginInfo.name}`,
    `University ID: ${loginInfo.universityId}`,
    `Email: ${loginInfo.email}`,
    `Temporary Password: ${loginInfo.temporaryPassword}`,
  ].join("\n")
}

// =====================================================
// STUDENT / STAFF MANAGEMENT PAGE
// =====================================================

function Users() {
  const [userData, setUserData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLE)
  const [selectedSticker, setSelectedSticker] = useState(DEFAULT_STICKER)
  const [selectedAccount, setSelectedAccount] = useState(DEFAULT_ACCOUNT)

  const [selectedUser, setSelectedUser] = useState(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState("view")

  const [createdLoginInfo, setCreatedLoginInfo] = useState(null)

  // =====================================================
  // LOAD USERS FROM SUPABASE
  // =====================================================

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const realUsers = await loadAdminUsers()

      setUserData(sortUsers(realUsers))
    } catch (error) {
      console.error("Failed to load users:", error)

      setLoadError(
        getErrorMessage(
          error,
          "Unable to load student/staff records from Supabase."
        )
      )

      setUserData([])
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }, [])

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    void window.setTimeout(() => {
      void loadUsers()
    }, 0)
  }, [loadUsers])

  // =====================================================
  // REALTIME REFRESH
  // =====================================================

  useAdminRealtimeRefresh({
    channelName: "admin-users-realtime",
    tables: REALTIME_TABLES,
    onRefresh: () => {
      loadUsers({ silent: true })
    },
    onStatusChange: (statusInfo) => {
      console.log("Users realtime:", statusInfo.label)
    },
  })

  // =====================================================
  // FILTERED USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase()

    return userData.filter((user) => {
      const matchesSearch =
        !searchValue ||
        String(user.universityId || "").toLowerCase().includes(searchValue) ||
        String(user.name || "").toLowerCase().includes(searchValue) ||
        String(user.email || "").toLowerCase().includes(searchValue) ||
        String(user.phone || "").toLowerCase().includes(searchValue) ||
        String(user.faculty || "").toLowerCase().includes(searchValue) ||
        String(user.department || "").toLowerCase().includes(searchValue) ||
        String(user.vehiclePlate || "").toLowerCase().includes(searchValue) ||
        String(user.vehicleModel || "").toLowerCase().includes(searchValue)

      const matchesRole =
        selectedRole === DEFAULT_ROLE || user.role === selectedRole

      const matchesSticker =
        selectedSticker === DEFAULT_STICKER ||
        user.stickerStatus === selectedSticker

      const matchesAccount =
        selectedAccount === DEFAULT_ACCOUNT ||
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
      lowWallet: userData.filter((user) => Number(user.walletBalance || 0) < 10)
        .length,
      suspended: userData.filter((user) => user.accountStatus === "Suspended")
        .length,
    }
  }, [userData])

  // =====================================================
  // MODAL HANDLERS
  // =====================================================

  function handleOpenCreateUser() {
    setSelectedUser(null)
    setUserModalMode("create")
    setIsUserModalOpen(true)
  }

  function handleOpenViewUser(user) {
    setSelectedUser(user)
    setUserModalMode("view")
    setIsUserModalOpen(true)
  }

  function handleCloseUserModal() {
    setIsUserModalOpen(false)
    setSelectedUser(null)
    setUserModalMode("view")
  }

  // =====================================================
  // COPY LOGIN INFO
  // =====================================================

  async function handleCopyLoginInfo() {
    if (!createdLoginInfo) {
      return
    }

    const loginText = buildLoginText(createdLoginInfo)

    try {
      await navigator.clipboard.writeText(loginText)
    } catch {
      window.prompt("Copy login details:", loginText)
    }
  }

  // =====================================================
  // CREATE USER
  // =====================================================

  async function handleCreateUser(payload) {
    try {
      const createdUser = await createUniversityUser(payload)

      setUserData((prev) => sortUsers([...prev, createdUser]))

      setCreatedLoginInfo({
        name: createdUser.name,
        universityId: createdUser.universityId,
        email: createdUser.email,
        temporaryPassword:
          createdUser.temporaryPassword || payload.temporaryPassword,
      })

      return createdUser
    } catch (error) {
      console.error("Failed to create user:", error)
      throw error
    }
  }

  // =====================================================
  // UPDATE USER
  // =====================================================

  async function handleUpdateUser(userId, payload) {
    try {
      const updatedUser = await updateUniversityUserDetails(userId, payload)

      setUserData((prev) => updateUserInList(prev, updatedUser))

      setSelectedUser((prev) => {
        if (!prev || prev.id !== userId) {
          return prev
        }

        return updatedUser
      })

      return updatedUser
    } catch (error) {
      console.error("Failed to update user:", error)
      throw error
    }
  }

  // =====================================================
  // UPDATE ACCOUNT STATUS
  // =====================================================

  async function handleUpdateAccountStatus(userId, newStatus) {
    try {
      const updatedUser = await updateUniversityUserAccountStatus(
        userId,
        newStatus
      )

      setUserData((prev) => updateUserInList(prev, updatedUser))

      setSelectedUser((prev) => {
        if (!prev || prev.id !== userId) {
          return prev
        }

        return updatedUser
      })

      return updatedUser
    } catch (error) {
      console.error("Failed to update account status:", error)

      setLoadError(
        getErrorMessage(
          error,
          "Unable to update account status in Supabase."
        )
      )

      throw error
    }
  }

  // =====================================================
  // DELETE USER
  // =====================================================

  async function handleDeleteUser(userId) {
    try {
      await deleteUniversityUser(userId)

      setUserData((prev) => prev.filter((user) => user.id !== userId))

      setSelectedUser((prev) => {
        if (!prev || prev.id !== userId) {
          return prev
        }

        return null
      })

      return userId
    } catch (error) {
      console.error("Failed to delete user:", error)
      throw error
    }
  }

  // =====================================================
  // DELETE VEHICLE
  // =====================================================

  async function handleDeleteVehicle(vehicleId, userId) {
    try {
      await deleteVehicleRecord(vehicleId)

      const updatedUser = await loadAdminUserById(userId)

      setUserData((prev) => updateUserInList(prev, updatedUser))

      setSelectedUser((prev) => {
        if (!prev || prev.id !== userId) {
          return prev
        }

        return updatedUser
      })

      return updatedUser
    } catch (error) {
      console.error("Failed to delete vehicle:", error)
      throw error
    }
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function handleResetFilters() {
    setSearchTerm("")
    setSelectedRole(DEFAULT_ROLE)
    setSelectedSticker(DEFAULT_STICKER)
    setSelectedAccount(DEFAULT_ACCOUNT)
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          Loading student/staff records from Supabase...
        </div>
      )}

      {createdLoginInfo && (
        <CreatedLoginPanel
          loginInfo={createdLoginInfo}
          onCopy={handleCopyLoginInfo}
          onClose={() => setCreatedLoginInfo(null)}
        />
      )}

      <SummaryPanel summary={summary} />

      <FilterPanel
        searchTerm={searchTerm}
        selectedRole={selectedRole}
        selectedSticker={selectedSticker}
        selectedAccount={selectedAccount}
        onSearchChange={setSearchTerm}
        onRoleChange={setSelectedRole}
        onStickerChange={setSelectedSticker}
        onAccountChange={setSelectedAccount}
        onReset={handleResetFilters}
      />

      <DesktopUserTable
        users={filteredUsers}
        totalUsers={userData.length}
        onAddUser={handleOpenCreateUser}
        onViewUser={handleOpenViewUser}
        onReset={handleResetFilters}
      />

      <MobileUserList
        users={filteredUsers}
        totalUsers={userData.length}
        onAddUser={handleOpenCreateUser}
        onViewUser={handleOpenViewUser}
        onReset={handleResetFilters}
      />

      <UserDetailModal
        user={selectedUser}
        mode={userModalMode}
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onDeleteVehicle={handleDeleteVehicle}
        onUpdateAccountStatus={handleUpdateAccountStatus}
      />
    </div>
  )
}

// =====================================================
// CREATED LOGIN PANEL
// =====================================================

function CreatedLoginPanel({ loginInfo, onCopy, onClose }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50 shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <KeyRound className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              User Login Created
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-950">
              Temporary password is ready
            </h3>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <LoginDetail label="Name" value={loginInfo.name} />
              <LoginDetail label="University ID" value={loginInfo.universityId} />
              <LoginDetail label="Email" value={loginInfo.email} />
              <LoginDetail
                label="Temporary Password"
                value={loginInfo.temporaryPassword}
                highlight
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-emerald-800">
              Share this temporary password with the user. The account is marked
              as must change password for first login.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-100"
            aria-label="Close login panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function LoginDetail({ label, value, highlight = false }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-black ${
          highlight ? "text-emerald-700" : "text-slate-800"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  )
}

// =====================================================
// SUMMARY PANEL
// =====================================================

function SummaryPanel({ summary }) {
  return (
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
            Manage student and staff accounts, vehicle ownership, stickers, and
            wallet balance.
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
  )
}

// =====================================================
// FILTER PANEL
// =====================================================

function FilterPanel({
  searchTerm,
  selectedRole,
  selectedSticker,
  selectedAccount,
  onSearchChange,
  onRoleChange,
  onStickerChange,
  onAccountChange,
  onReset,
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] xl:items-end">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Search
          </label>

          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search name, university ID, email, plate..."
          />
        </div>

        <FilterSelect
          label="Role"
          value={selectedRole}
          onChange={onRoleChange}
          options={roleOptions}
        />

        <FilterSelect
          label="Sticker"
          value={selectedSticker}
          onChange={onStickerChange}
          options={stickerStatusOptions}
        />

        <FilterSelect
          label="Account"
          value={selectedAccount}
          onChange={onAccountChange}
          options={accountStatusOptions}
        />

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
    </section>
  )
}

// =====================================================
// DESKTOP USER TABLE
// =====================================================

function DesktopUserTable({
  users,
  totalUsers,
  onAddUser,
  onViewUser,
  onReset,
}) {
  return (
    <section className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm backdrop-blur lg:block">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Student / Staff List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {users.length} of {totalUsers} accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Supabase University Users
          </span>

          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
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
            {users.map((user) => (
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
                    onClick={() => onViewUser(user)}
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

      {users.length === 0 && <EmptyResult onReset={onReset} />}
    </section>
  )
}

// =====================================================
// MOBILE USER LIST
// =====================================================

function MobileUserList({ users, totalUsers, onAddUser, onViewUser, onReset }) {
  return (
    <section className="space-y-4 lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Student / Staff List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {users.length} of {totalUsers} accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {users.map((user) => (
        <div
          key={user.id}
          className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-black text-slate-950">{user.name}</p>

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

            <MobileInfo
              label="Faculty"
              value={`${user.faculty} • ${user.department}`}
            />

            <MobileInfo
              label="Vehicle"
              value={`${user.vehiclePlate} • ${user.vehicleModel}`}
            />

            <MobileInfo
              label="Wallet"
              value={`RM ${Number(user.walletBalance || 0).toFixed(2)}`}
            />
          </div>

          <button
            type="button"
            onClick={() => onViewUser(user)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <UserCheck className="h-4 w-4" />
            View Details
          </button>
        </div>
      ))}

      {users.length === 0 && <EmptyResult onReset={onReset} />}
    </section>
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
  const safeAmount = Number(amount || 0)
  const isLow = safeAmount < 10

  return (
    <div>
      <p
        className={`text-sm font-black ${
          isLow ? "text-orange-600" : "text-slate-700"
        }`}
      >
        RM {safeAmount.toFixed(2)}
      </p>

      {isLow && (
        <p className="mt-1 text-xs font-bold text-orange-500">Low balance</p>
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
      <h3 className="text-lg font-black text-slate-950">No users found</h3>

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