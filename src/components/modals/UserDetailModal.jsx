// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  BadgeCheck,
  Building2,
  Car,
  Copy,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// OPTIONS
// =====================================================

const roleOptions = ["Student", "Staff"]

const accountStatusOptions = ["Active", "Inactive", "Suspended"]

const stickerStatusOptions = ["Active", "Pending", "Expired", "Rejected"]

const anprAccessOptions = ["Enabled", "Disabled"]

// =====================================================
// HELPERS
// =====================================================

function isEmptyDisplayValue(value) {
  return !value || value === "-" || value === "No registered vehicle"
}

function toInputValue(value) {
  if (isEmptyDisplayValue(value)) {
    return ""
  }

  return String(value)
}

function toDateInputValue(value) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString().slice(0, 10)
}

function cleanUniversityId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
}

function generateTemporaryPasswordFromUniversityId(universityId) {
  const cleanedId = cleanUniversityId(universityId).replace(/[^A-Z0-9]/g, "")
  const suffix = cleanedId.slice(-6)

  if (!suffix) {
    return ""
  }

  return `Park@${suffix}`
}

function getMainVehicle(user) {
  if (user?.vehicles?.length) {
    return user.vehicles[0]
  }

  if (user?.raw?.linkedVehicles?.length) {
    return user.raw.linkedVehicles[0]
  }

  return null
}

function resolveInitialMode(mode, user) {
  if (mode === "create") {
    return "create"
  }

  if (mode === "edit" && user) {
    return "edit"
  }

  return "view"
}

function getInitialForm(user) {
  const mainVehicle = getMainVehicle(user)

  return {
    fullName: toInputValue(user?.name),
    universityId: toInputValue(user?.universityId),
    role: user?.role || "Student",

    email: toInputValue(user?.email),
    phone: toInputValue(user?.phone),

    faculty: toInputValue(user?.faculty),
    department: toInputValue(user?.department),

    accountStatus: user?.accountStatus || "Active",

    temporaryPassword: "",

    vehicleId: user?.vehicleId || mainVehicle?.id || "",
    vehiclePlate: toInputValue(user?.vehiclePlate || mainVehicle?.plateNumber),
    vehicleModel: toInputValue(user?.vehicleModel || mainVehicle?.vehicleModel),
    vehicleColor: toInputValue(user?.vehicleColor || mainVehicle?.vehicleColor),

    stickerStatus:
      user?.stickerStatus || mainVehicle?.stickerStatus || "Pending",
    anprAccessStatus:
      user?.anprAccessStatus || mainVehicle?.anprAccessStatus || "Disabled",

    expiryAt: toDateInputValue(mainVehicle?.raw?.expiry_at),
    remarks: toInputValue(mainVehicle?.remarks),
  }
}

function getEmptyForm() {
  return {
    fullName: "",
    universityId: "",
    role: "Student",

    email: "",
    phone: "",

    faculty: "",
    department: "",

    accountStatus: "Active",

    temporaryPassword: "",

    vehicleId: "",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleColor: "",

    stickerStatus: "Pending",
    anprAccessStatus: "Disabled",

    expiryAt: "",
    remarks: "",
  }
}

function getTitle(mode, user) {
  if (mode === "create") {
    return "Add New User"
  }

  if (mode === "edit") {
    return `Edit ${user?.name || "User"}`
  }

  return user?.name || "User Details"
}

// =====================================================
// USER DETAIL MODAL
// =====================================================

function UserDetailModal({
  user,
  isOpen,
  mode = "view",
  onClose,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onDeleteVehicle,
  onUpdateAccountStatus,
}) {
  const [activeMode, setActiveMode] = useState(() =>
    resolveInitialMode(mode, user)
  )

  const [form, setForm] = useState(() =>
    mode === "create" ? getEmptyForm() : getInitialForm(user)
  )

  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCreateMode = activeMode === "create"
  const isEditMode = activeMode === "edit"
  const isViewMode = activeMode === "view"

  const modalTitle = useMemo(() => {
    return getTitle(activeMode, user)
  }, [activeMode, user])

  const modalEyebrow = useMemo(() => {
    if (isCreateMode) {
      return "Create University User"
    }

    if (isEditMode) {
      return "Edit University User"
    }

    return "User Details"
  }, [isCreateMode, isEditMode])

  const linkedVehicles = user?.vehicles || []

  // =====================================================
  // RESET MODAL STATE
  // =====================================================

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const nextMode = resolveInitialMode(mode, user)

    void window.setTimeout(() => {
      setActiveMode(nextMode)
      setForm(nextMode === "create" ? getEmptyForm() : getInitialForm(user))
      setErrorMessage("")
      setIsSubmitting(false)
    }, 0)
  }, [isOpen, mode, user])

  if (!isOpen) {
    return null
  }

  if (!isCreateMode && !user) {
    return null
  }

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  function handleChange(field, value) {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      }

      if (activeMode === "create" && field === "universityId") {
        const previousGeneratedPassword =
          generateTemporaryPasswordFromUniversityId(prev.universityId)

        const shouldAutoGenerate =
          !prev.temporaryPassword ||
          prev.temporaryPassword === previousGeneratedPassword

        if (shouldAutoGenerate) {
          next.temporaryPassword =
            generateTemporaryPasswordFromUniversityId(value)
        }
      }

      return next
    })
  }

  function handleGeneratePassword() {
    setForm((prev) => ({
      ...prev,
      temporaryPassword: generateTemporaryPasswordFromUniversityId(
        prev.universityId
      ),
    }))
  }

  async function handleCopyPassword() {
    if (!form.temporaryPassword) {
      return
    }

    try {
      await navigator.clipboard.writeText(form.temporaryPassword)
    } catch {
      window.prompt("Copy temporary password:", form.temporaryPassword)
    }
  }

  function validateForm() {
    if (!form.fullName.trim()) {
      return "Full name is required."
    }

    if (!form.universityId.trim()) {
      return "University ID is required."
    }

    if (!form.email.trim()) {
      return "Email is required."
    }

    if (!form.role.trim()) {
      return "Role is required."
    }

    if (isCreateMode && !form.temporaryPassword.trim()) {
      return "Temporary password is required."
    }

    if (isCreateMode && form.temporaryPassword.trim().length < 8) {
      return "Temporary password must be at least 8 characters."
    }

    return ""
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      if (isCreateMode) {
        if (!onCreateUser) {
          throw new Error("Create user function is not connected.")
        }

        await onCreateUser(form)
      } else {
        if (!onUpdateUser) {
          throw new Error("Update user function is not connected.")
        }

        await onUpdateUser(user.id, form)
      }

      onClose()
    } catch (error) {
      console.error("Save university user error:", error)
      setErrorMessage(error.message || "Unable to save user.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUser() {
    if (!user || !onDeleteUser) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${user.name}? This will also delete linked vehicle records.`
    )

    if (!confirmed) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await onDeleteUser(user.id)
      onClose()
    } catch (error) {
      console.error("Delete university user error:", error)
      setErrorMessage(error.message || "Unable to delete user.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteVehicle(vehicleId) {
    if (!vehicleId || !onDeleteVehicle) {
      return
    }

    const confirmed = window.confirm("Delete this vehicle record?")

    if (!confirmed) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await onDeleteVehicle(vehicleId, user.id)
      setActiveMode("view")
    } catch (error) {
      console.error("Delete vehicle record error:", error)
      setErrorMessage(error.message || "Unable to delete vehicle record.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAccountStatusChange(newStatus) {
    if (!user || !onUpdateAccountStatus) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await onUpdateAccountStatus(user.id, newStatus)
    } catch (error) {
      console.error("Update account status error:", error)
      setErrorMessage(error.message || "Unable to update account status.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancelEdit() {
    if (isCreateMode) {
      onClose()
      return
    }

    setForm(getInitialForm(user))
    setActiveMode("view")
    setErrorMessage("")
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <ModalHeader
          eyebrow={modalEyebrow}
          title={modalTitle}
          subtitle={
            isCreateMode
              ? "Register a new student or staff account."
              : `${user.universityId} • ${user.role}`
          }
          onClose={onClose}
        />

        {errorMessage && (
          <div className="px-6 pt-6">
            <ErrorMessage message={errorMessage} />
          </div>
        )}

        {isViewMode ? (
          <ViewContent
            user={user}
            linkedVehicles={linkedVehicles}
            isSubmitting={isSubmitting}
            onEdit={
              onUpdateUser
                ? () => {
                    setActiveMode("edit")
                    setErrorMessage("")
                  }
                : null
            }
            onDeleteVehicle={onDeleteVehicle ? handleDeleteVehicle : null}
            onUpdateAccountStatus={handleAccountStatusChange}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <EditContent
              form={form}
              mode={activeMode}
              onChange={handleChange}
              onGeneratePassword={handleGeneratePassword}
              onCopyPassword={handleCopyPassword}
            />

            <ModalFooter
              mode={activeMode}
              isSubmitting={isSubmitting}
              canDelete={!isCreateMode && Boolean(onDeleteUser)}
              onCancel={handleCancelEdit}
              onDelete={handleDeleteUser}
            />
          </form>
        )}

        {isViewMode && (
          <ViewFooter
            isSubmitting={isSubmitting}
            canEdit={Boolean(onUpdateUser)}
            canDelete={Boolean(onDeleteUser)}
            onClose={onClose}
            onEdit={() => {
              setActiveMode("edit")
              setErrorMessage("")
            }}
            onDelete={handleDeleteUser}
          />
        )}
      </div>
    </div>
  )
}

// =====================================================
// MODAL HEADER
// =====================================================

function ModalHeader({ eyebrow, title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>

        {subtitle && (
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        )}
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
// VIEW CONTENT
// =====================================================

function ViewContent({
  user,
  linkedVehicles,
  isSubmitting,
  onEdit,
  onDeleteVehicle,
  onUpdateAccountStatus,
}) {
  return (
    <div className="max-h-[75vh] overflow-y-auto p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoBox icon={User} label="Role" value={user.role} />

        <InfoBox
          icon={Building2}
          label="Faculty / Department"
          value={`${user.faculty} • ${user.department}`}
        />

        <InfoBox icon={Mail} label="Email" value={user.email} />
        <InfoBox icon={Phone} label="Phone" value={user.phone} />

        <InfoBox
          icon={Car}
          label="Main Vehicle"
          value={`${user.vehiclePlate} • ${user.vehicleModel}`}
        />


      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatusPanel label="Sticker Status" status={user.stickerStatus} />
        <StatusPanel label="Account Status" status={user.accountStatus} />
        <StatusPanel
          label="Password"
          text={user.mustChangePassword ? "Must change" : "Updated"}
        />
        <StatusPanel label="Last Login" text={user.lastLogin || "-"} />
      </div>

      <VehicleList
        vehicles={linkedVehicles}
        onDeleteVehicle={onDeleteVehicle}
      />

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              Account Control
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Change account access without editing the full profile.
            </p>
          </div>

          <div className="w-full sm:w-60">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Update Account
            </label>

            <select
              value={user.accountStatus}
              disabled={isSubmitting || !onUpdateAccountStatus}
              onChange={(event) => onUpdateAccountStatus(event.target.value)}
              className="input-field disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accountStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Pencil className="h-4 w-4" />
            Edit User Details
          </button>
        )}
      </div>
    </div>
  )
}

// =====================================================
// EDIT CONTENT
// =====================================================

function EditContent({
  form,
  mode,
  onChange,
  onGeneratePassword,
  onCopyPassword,
}) {
  const isCreateMode = mode === "create"

  return (
    <div className="max-h-[75vh] overflow-y-auto p-6">
      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <SectionTitle
          icon={User}
          title="User Information"
          description="Basic student or staff account details."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name">
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
              placeholder="Example: Ahmad Hakimi"
              className="input-field"
            />
          </FormField>

          <FormField label="University ID">
            <input
              type="text"
              value={form.universityId}
              onChange={(event) => onChange("universityId", event.target.value)}
              placeholder="Example: B032310123"
              className="input-field"
            />
          </FormField>

          <FormField label="Role">
            <select
              value={form.role}
              onChange={(event) => onChange("role", event.target.value)}
              className="input-field"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="student@utem.edu.my"
              className="input-field"
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="text"
              value={form.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="Optional"
              className="input-field"
            />
          </FormField>


          <FormField label="Faculty">
            <input
              type="text"
              value={form.faculty}
              onChange={(event) => onChange("faculty", event.target.value)}
              placeholder="Example: FTMK"
              className="input-field"
            />
          </FormField>

          <FormField label="Department">
            <input
              type="text"
              value={form.department}
              onChange={(event) => onChange("department", event.target.value)}
              placeholder="Example: Software Development"
              className="input-field"
            />
          </FormField>

          <FormField label="Account Status">
            <select
              value={form.accountStatus}
              onChange={(event) =>
                onChange("accountStatus", event.target.value)
              }
              className="input-field"
            >
              {accountStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {isCreateMode && (
        <section className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5">
          <SectionTitle
            icon={KeyRound}
            title="Login Temporary Password"
            description="This password is generated from the university ID. Share it with the user for first login."
          />

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <FormField label="Temporary Password">
              <input
                type="text"
                value={form.temporaryPassword}
                onChange={(event) =>
                  onChange("temporaryPassword", event.target.value)
                }
                placeholder="Auto generated after University ID"
                className="input-field"
              />
            </FormField>

            <button
              type="button"
              onClick={onGeneratePassword}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-5 text-sm font-black text-amber-700 transition hover:bg-amber-100"
            >
              <RefreshCcw className="h-4 w-4" />
              Generate
            </button>

            <button
              type="button"
              onClick={onCopyPassword}
              disabled={!form.temporaryPassword}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-amber-700">
            User will login using university ID/email and this temporary
            password. The account will be marked as must change password.
          </p>
        </section>
      )}

      <section className="mt-5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50/60 p-5">
        <SectionTitle
          icon={Car}
          title="Vehicle Record"
          description="Optional. Leave plate number empty if the user has no registered vehicle yet."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Plate Number">
            <input
              type="text"
              value={form.vehiclePlate}
              onChange={(event) => onChange("vehiclePlate", event.target.value)}
              placeholder="Example: ABC1122"
              className="input-field"
            />
          </FormField>

          <FormField label="Vehicle Model">
            <input
              type="text"
              value={form.vehicleModel}
              onChange={(event) => onChange("vehicleModel", event.target.value)}
              placeholder="Example: Honda City"
              className="input-field"
            />
          </FormField>

          <FormField label="Vehicle Color">
            <input
              type="text"
              value={form.vehicleColor}
              onChange={(event) => onChange("vehicleColor", event.target.value)}
              placeholder="Example: Black"
              className="input-field"
            />
          </FormField>

          <FormField label="Sticker Status">
            <select
              value={form.stickerStatus}
              onChange={(event) =>
                onChange("stickerStatus", event.target.value)
              }
              className="input-field"
            >
              {stickerStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="ANPR Access">
            <select
              value={form.anprAccessStatus}
              onChange={(event) =>
                onChange("anprAccessStatus", event.target.value)
              }
              className="input-field"
            >
              {anprAccessOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Sticker Expiry">
            <input
              type="date"
              value={form.expiryAt}
              onChange={(event) => onChange("expiryAt", event.target.value)}
              className="input-field"
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Remarks">
              <input
                type="text"
                value={form.remarks}
                onChange={(event) => onChange("remarks", event.target.value)}
                placeholder="Optional"
                className="input-field"
              />
            </FormField>
          </div>
        </div>
      </section>
    </div>
  )
}

// =====================================================
// MODAL FOOTERS
// =====================================================

function ViewFooter({
  isSubmitting,
  canEdit,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </button>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Close
        </button>

        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            Done
          </button>
        )}
      </div>
    </div>
  )
}

function ModalFooter({ mode, isSubmitting, canDelete, onCancel, onDelete }) {
  const isCreateMode = mode === "create"

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {!isCreateMode && canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </button>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
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
              ? "Create User"
              : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

// =====================================================
// VEHICLE LIST
// =====================================================

function VehicleList({ vehicles, onDeleteVehicle }) {
  if (!vehicles.length) {
    return (
      <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-5">
        <p className="text-sm font-black text-slate-950">
          No registered vehicle
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Add a vehicle by editing this user profile.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
          <BadgeCheck className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black text-slate-950">
            Registered Vehicles
          </p>

          <p className="text-sm text-slate-500">
            {vehicles.length} vehicle record{vehicles.length > 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {vehicle.plateNumber}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {vehicle.vehicleModel} • {vehicle.vehicleColor}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={vehicle.stickerStatus} />
                  <StatusBadge status={vehicle.anprAccessStatus} />
                </div>
              </div>

              {onDeleteVehicle && (
                <button
                  type="button"
                  onClick={() => onDeleteVehicle(vehicle.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// SMALL COMPONENTS
// =====================================================

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

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

function StatusPanel({ label, status, text }) {
  return (
    <div className="rounded-[1.4rem] bg-slate-50 p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      {status ? (
        <StatusBadge status={status} />
      ) : (
        <p className="text-sm font-black text-slate-700">{text}</p>
      )}
    </div>
  )
}

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

function ErrorMessage({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  )
}

export default UserDetailModal