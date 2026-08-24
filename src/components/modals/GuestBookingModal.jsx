// PARKUTEM_PHASE_06C_R1_SOURCE_LOCKED
// Provider-managed payment controls are read-only
// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"

import {
  AlertTriangle,
  Ban,
  CalendarCheck,
  Car,
  CheckCircle,
  Clock3,
  CreditCard,
  Edit3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Radio,
  Receipt,
  RefreshCcw,
  Save,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

// =====================================================
// OPTIONS
// =====================================================

const bookingStatusOptions = [
  "Pending Payment",
  "Confirmed",
  "Expired",
  "Cancelled",
]

const paymentStatusOptions = ["Pending", "Paid", "Failed", "Refunded"]

const anprAccessOptions = ["Enabled", "Not Enabled", "Expired", "Blocked"]

const entryStatusOptions = [
  "Not Entered",
  "Entered",
  "Overstay",
  "Exited",
  "No Show",
]

// =====================================================
// HELPERS
// =====================================================

function cleanText(value) {
  return String(value || "").trim()
}

function normalizePlateNumber(plateNumber = "") {
  return cleanText(plateNumber).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

function toDateTimeLocal(value) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 16)
}

function calculateDurationHours(startValue, endValue) {
  if (!startValue || !endValue) {
    return 0
  }

  const start = new Date(startValue)
  const end = new Date(endValue)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  const diffMs = end.getTime() - start.getTime()

  if (diffMs <= 0) {
    return 0
  }

  return diffMs / (60 * 60 * 1000)
}

function calculateAmount(durationHours) {
  const cleanDuration = Number(durationHours || 0)

  if (cleanDuration <= 0) {
    return "0.00"
  }

  return cleanDuration.toFixed(2)
}

function formatDuration(durationHours) {
  const cleanDuration = Number(durationHours || 0)

  if (!cleanDuration) {
    return "-"
  }

  if (!Number.isInteger(cleanDuration)) {
    const hours = Math.floor(cleanDuration)
    const minutes = Math.round((cleanDuration - hours) * 60)

    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
  }

  return `${cleanDuration} hour${cleanDuration > 1 ? "s" : ""}`
}

function buildInitialForm(booking) {
  const raw = booking?.raw || {}

  const visitStartAt = toDateTimeLocal(raw.visit_start_at)
  const visitEndAt = toDateTimeLocal(raw.visit_end_at)

  return {
    guestName: booking?.guestName || raw.visitor_name || "",
    email: booking?.email || raw.email || "",
    phone: booking?.phone || raw.phone_number || "",
    vehiclePlate: booking?.vehiclePlate || raw.plate_number || "",
    normalizedPlateNumber:
      booking?.normalizedPlateNumber || raw.normalized_plate_number || "",
    visitPurpose: booking?.visitPurpose || raw.purpose || "",
    hostDepartment: booking?.hostDepartment || raw.host_department || "",
    visitStartAt,
    visitEndAt,
    durationHours:
      raw.duration_hours ||
      calculateDurationHours(visitStartAt, visitEndAt) ||
      "",
    parkingFee:
      raw.amount !== undefined && raw.amount !== null
        ? Number(raw.amount).toFixed(2)
        : booking?.parkingFee !== undefined && booking?.parkingFee !== null
          ? Number(booking.parkingFee).toFixed(2)
          : "",
    paymentStatus: booking?.paymentStatus || "Pending",
    bookingStatus: booking?.bookingStatus || "Pending Payment",
    anprAccess: booking?.anprAccess || "Not Enabled",
    entryStatus: booking?.entryStatus || "Not Entered",
    sendConfirmationEmail: true,
  }
}

function canSendConfirmationEmail(form) {
  return (
    form.paymentStatus === "Paid" &&
    form.bookingStatus === "Confirmed" &&
    form.anprAccess === "Enabled"
  )
}

function buildSubmitPayload(form) {
  return {
    guestName: cleanText(form.guestName),
    email: cleanText(form.email),
    phone: cleanText(form.phone),
    vehiclePlate: cleanText(form.vehiclePlate).toUpperCase(),
    normalizedPlateNumber:
      normalizePlateNumber(form.normalizedPlateNumber) ||
      normalizePlateNumber(form.vehiclePlate),
    visitPurpose: cleanText(form.visitPurpose),
    hostDepartment: cleanText(form.hostDepartment),
    visitStartAt: form.visitStartAt,
    visitEndAt: form.visitEndAt,
    durationHours: Number(form.durationHours || 0),
    parkingFee: Number(form.parkingFee || 0),
    amount: Number(form.parkingFee || 0),
    paymentStatus: form.paymentStatus,
    bookingStatus: form.bookingStatus,
    anprAccess: form.anprAccess,
  }
}

// =====================================================
// GUEST BOOKING MODAL
// =====================================================

function GuestBookingModal({
  booking,
  isOpen,
  mode = "view",
  onClose,
  onCreateBooking,
  onSaveBooking,
  onUpdateBookingStatus,
  onUpdatePaymentStatus,
  onUpdateAnprAccess,
  onUpdateEntryStatus,
  onResendEmail,
  onCancelBooking,
  onDeleteBooking,
}) {
  const initialMode = mode === "create" || !booking ? "create" : "view"

  const [activeMode, setActiveMode] = useState(initialMode)
  const [form, setForm] = useState(buildInitialForm(booking))
  const [isWorking, setIsWorking] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const syncTimer = window.setTimeout(() => {
      const nextMode = mode === "create" || !booking ? "create" : "view"

      setActiveMode(nextMode)
      setForm(buildInitialForm(booking))
      setNotice(null)
      setIsWorking(false)
    }, 0)

    return () => {
      window.clearTimeout(syncTimer)
    }
  }, [booking, isOpen, mode])

  const isCreateMode = activeMode === "create"
  const isEditMode = activeMode === "edit"
  const isViewMode = activeMode === "view"
  const isFormMode = isCreateMode || isEditMode

  const parkingAllocation = booking?.bayNumber
    ? `${booking.bayNumber} • ${booking.zone}`
    : booking?.parkingAllocation || "Not assigned yet"

  const parkingFee = Number(booking?.parkingFee || 0)

  const calculatedDuration = useMemo(() => {
    return calculateDurationHours(form.visitStartAt, form.visitEndAt)
  }, [form.visitStartAt, form.visitEndAt])

  const shouldOfferEmail = canSendConfirmationEmail(form)

  if (!isOpen) {
    return null
  }

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  function updateFormValue(name, value) {
    setForm((prev) => {
      const nextForm = {
        ...prev,
        [name]: value,
      }

      if (name === "vehiclePlate") {
        nextForm.vehiclePlate = value.toUpperCase()
        nextForm.normalizedPlateNumber = normalizePlateNumber(value)
      }

      if (name === "normalizedPlateNumber") {
        nextForm.normalizedPlateNumber = normalizePlateNumber(value)
      }

      if (name === "visitStartAt" || name === "visitEndAt") {
        const duration = calculateDurationHours(
          name === "visitStartAt" ? value : nextForm.visitStartAt,
          name === "visitEndAt" ? value : nextForm.visitEndAt
        )

        nextForm.durationHours = duration ? Number(duration.toFixed(2)) : ""
        nextForm.parkingFee = calculateAmount(duration)
      }

      return nextForm
    })
  }

  function showSuccess(message) {
    setNotice({
      type: "success",
      message,
    })
  }

  function showError(message) {
    setNotice({
      type: "error",
      message,
    })
  }

  function showWarning(message) {
    setNotice({
      type: "warning",
      message,
    })
  }

  async function runAction(action, successMessage) {
    setIsWorking(true)
    setNotice(null)

    try {
      const result = await action()

      if (result?.emailWarning || result?.paymentWarning) {
        showWarning(
          [result.paymentWarning, result.emailWarning].filter(Boolean).join(" ")
        )
      } else {
        showSuccess(successMessage)
      }

      return result
    } catch (error) {
      showError(error.message || "Action failed. Please try again.")
      return null
    } finally {
      setIsWorking(false)
    }
  }

  async function handleSubmitForm(event) {
    event.preventDefault()

    const payload = buildSubmitPayload(form)

    if (!payload.guestName) {
      showError("Guest name is required.")
      return
    }

    if (!payload.email) {
      showError("Guest email is required.")
      return
    }

    if (!payload.phone) {
      showError("Guest phone number is required.")
      return
    }

    if (!payload.vehiclePlate) {
      showError("Vehicle plate number is required.")
      return
    }

    if (!payload.visitStartAt || !payload.visitEndAt) {
      showError("Booking start and end datetime are required.")
      return
    }

    if (!payload.durationHours || payload.durationHours <= 0) {
      showError("Booking end time must be after booking start time.")
      return
    }

    if (isCreateMode) {
      if (!onCreateBooking) {
        showError("Create booking action is not connected yet.")
        return
      }

      await runAction(
        () =>
          onCreateBooking(payload, {
            sendConfirmationEmail: form.sendConfirmationEmail,
          }),
        form.sendConfirmationEmail && shouldOfferEmail
          ? "Guest booking saved. Confirmation email was requested."
          : "Guest booking saved successfully."
      )

      return
    }

    if (!onSaveBooking || !booking?.id) {
      showError("Save booking action is not connected yet.")
      return
    }

    await runAction(
      () =>
        onSaveBooking(booking.id, payload, {
          sendConfirmationEmail: form.sendConfirmationEmail,
        }),
      form.sendConfirmationEmail && shouldOfferEmail
        ? "Guest booking updated. Confirmation email was requested."
        : "Guest booking updated successfully."
    )
  }

  // =====================================================
  // QUICK ACTION HANDLERS
  // =====================================================

  async function handleBookingStatusChange(value) {
    if (!booking?.id || !onUpdateBookingStatus) {
      showError("Booking status update is not connected yet.")
      return
    }

    const isDangerStatus = value === "Cancelled" || value === "Expired"

    if (
      isDangerStatus &&
      !window.confirm(
        `Confirm update booking status to ${value}? This may revoke guest ANPR access.`
      )
    ) {
      return
    }

    await runAction(
      () => onUpdateBookingStatus(booking.id, value),
      `Booking status updated to ${value}.`
    )
  }

  async function handlePaymentStatusChange(value) {
    if (booking?.providerManaged) {
      showError(
        "Payment status is controlled by the verified payment provider callback."
      )
      return
    }

    if (!booking?.id || !onUpdatePaymentStatus) {
      showError("Payment status update is not connected yet.")
      return
    }

    const shouldSendEmail =
      value === "Paid" &&
      window.confirm(
        "Mark this guest booking as paid? If the booking becomes confirmed and ANPR active, send confirmation email too?"
      )

    if (
      value !== "Paid" &&
      !window.confirm(`Confirm update payment status to ${value}?`)
    ) {
      return
    }

    await runAction(
      () =>
        onUpdatePaymentStatus(booking.id, value, {
          sendConfirmationEmail: shouldSendEmail,
        }),
      `Payment status updated to ${value}.`
    )
  }

  async function handleAnprAccessChange(value) {
    if (!booking?.id || !onUpdateAnprAccess) {
      showError("ANPR access update is not connected yet.")
      return
    }

    const isDangerAccess = value === "Blocked" || value === "Expired"

    if (
      isDangerAccess &&
      !window.confirm(
        `Confirm update ANPR access to ${value}? This may stop guest entry access.`
      )
    ) {
      return
    }

    await runAction(
      () => onUpdateAnprAccess(booking.id, value),
      `ANPR access updated to ${value}.`
    )
  }

  async function handleEntryStatusChange(value) {
    if (value !== "No Show") {
      showError(
        "Entry status is derived from ANPR logs. Only No Show can be manually set here."
      )
      return
    }

    if (!booking?.id || !onUpdateEntryStatus) {
      showError("Entry status update is not connected yet.")
      return
    }

    if (
      !window.confirm(
        "Mark this guest booking as No Show? ANPR access will be expired."
      )
    ) {
      return
    }

    await runAction(
      () => onUpdateEntryStatus(booking.id, value),
      "Guest booking marked as No Show."
    )
  }

  async function handleResendEmail() {
    if (!booking || !onResendEmail) {
      showError("Resend email action is not connected yet.")
      return
    }

    if (
      !window.confirm(
        "Resend guest booking confirmation email to this guest?"
      )
    ) {
      return
    }

    await runAction(
      () => onResendEmail(booking),
      "Confirmation email sent successfully."
    )
  }

  async function handleCancelBooking() {
    if (!booking || !onCancelBooking) {
      showError("Cancel booking action is not connected yet.")
      return
    }

    if (
      !window.confirm(
        "Cancel this guest booking? Payment history will be preserved and ANPR access will be blocked."
      )
    ) {
      return
    }

    await runAction(() => onCancelBooking(booking), "Guest booking cancelled.")
  }

  async function handleDeleteBooking() {
    if (!booking || !onDeleteBooking) {
      showError("Delete booking action is not connected yet.")
      return
    }

    if (
      !window.confirm(
        "Delete this guest booking? This is only allowed when there is no payment history."
      )
    ) {
      return
    }

    await runAction(() => onDeleteBooking(booking), "Guest booking deleted.")
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* =====================================================
            MODAL HEADER
            ===================================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              {isCreateMode ? "Add Guest Booking" : "Guest Booking Details"}
            </p>

            <h2 className="mt-1 break-words text-2xl font-black text-slate-950">
              {isCreateMode ? "New Guest Booking" : booking?.bookingId}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {isCreateMode
                ? "Create manual guest parking access from admin portal."
                : `${booking?.guestName || "-"} • ${
                    booking?.vehiclePlate || "-"
                  }`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isCreateMode && isViewMode && (
              <button
                type="button"
                onClick={() => {
                  setActiveMode("edit")
                  setNotice(null)
                }}
                className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* =====================================================
            NOTICE
            ===================================================== */}

        {notice && (
          <div
            className={`mx-5 mt-5 rounded-2xl border px-4 py-3 text-sm font-bold sm:mx-6 ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : notice.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3">
              {notice.type === "success" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}

              <span>{notice.message}</span>
            </div>
          </div>
        )}

        {/* =====================================================
            MODAL BODY
            ===================================================== */}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isFormMode ? (
            <form onSubmit={handleSubmitForm} className="space-y-6">
              <FormSection
                title="Guest Information"
                description="Guest details used for booking record and email notification."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Guest Name"
                    value={form.guestName}
                    onChange={(value) => updateFormValue("guestName", value)}
                    required
                  />

                  <FormInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateFormValue("email", value)}
                    required
                  />

                  <FormInput
                    label="Phone Number"
                    value={form.phone}
                    onChange={(value) => updateFormValue("phone", value)}
                    required
                  />

                  <FormInput
                    label="Vehicle Plate"
                    value={form.vehiclePlate}
                    onChange={(value) => updateFormValue("vehiclePlate", value)}
                    required
                  />

                  <FormInput
                    label="Normalized Plate"
                    value={form.normalizedPlateNumber}
                    onChange={(value) =>
                      updateFormValue("normalizedPlateNumber", value)
                    }
                    required
                  />

                  <FormInput
                    label="Host Department"
                    value={form.hostDepartment}
                    onChange={(value) =>
                      updateFormValue("hostDepartment", value)
                    }
                  />
                </div>

                <FormTextarea
                  label="Purpose / Remarks"
                  value={form.visitPurpose}
                  onChange={(value) => updateFormValue("visitPurpose", value)}
                />
              </FormSection>

              <FormSection
                title="Booking Schedule & Fee"
                description="Guest fee follows current prototype rule: RM1.00 per hour."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Visit Start"
                    type="datetime-local"
                    value={form.visitStartAt}
                    onChange={(value) => updateFormValue("visitStartAt", value)}
                    required
                  />

                  <FormInput
                    label="Visit End"
                    type="datetime-local"
                    value={form.visitEndAt}
                    onChange={(value) => updateFormValue("visitEndAt", value)}
                    required
                  />

                  <FormInput
                    label="Duration Hours"
                    type="number"
                    value={form.durationHours}
                    onChange={(value) => updateFormValue("durationHours", value)}
                    min="0"
                    step="0.5"
                    required
                  />

                  {booking?.providerManaged ? (
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Parking Fee / Amount
                      </span>

                      <input
                        type="number"
                        value={form.parkingFee}
                        disabled
                        className="h-[52px] w-full cursor-not-allowed rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 outline-none opacity-80"
                        title="The provider-linked payment amount is read-only."
                      />
                    </label>
                  ) : (
                    <FormInput
                      label="Parking Fee / Amount"
                      type="number"
                      value={form.parkingFee}
                      onChange={(value) =>
                        updateFormValue("parkingFee", value)
                      }
                      min="0"
                      step="0.01"
                      required
                    />
                  )}
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800">
                  Estimated duration: {formatDuration(calculatedDuration)} •
                  Estimated amount: RM {calculateAmount(calculatedDuration)}
                </div>
              </FormSection>

              <FormSection
                title="Status Control"
                description="Email confirmation can only be sent when payment is Paid, booking is Confirmed, and ANPR access is Enabled."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {booking?.providerManaged ? (
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Payment Status
                      </span>

                      <select
                        value={form.paymentStatus}
                        disabled
                        className="h-[52px] w-full cursor-not-allowed rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 outline-none opacity-80"
                        title="Payment status is controlled by the verified provider callback."
                      >
                        {paymentStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <FormSelect
                      label="Payment Status"
                      value={form.paymentStatus}
                      onChange={(value) =>
                        updateFormValue("paymentStatus", value)
                      }
                      options={paymentStatusOptions}
                    />
                  )}

                  <FormSelect
                    label="Booking Status"
                    value={form.bookingStatus}
                    onChange={(value) =>
                      updateFormValue("bookingStatus", value)
                    }
                    options={bookingStatusOptions}
                  />

                  <FormSelect
                    label="ANPR Access"
                    value={form.anprAccess}
                    onChange={(value) => updateFormValue("anprAccess", value)}
                    options={anprAccessOptions}
                  />
                </div>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
                    shouldOfferEmail
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.sendConfirmationEmail}
                    onChange={(event) =>
                      updateFormValue(
                        "sendConfirmationEmail",
                        event.target.checked
                      )
                    }
                    disabled={!shouldOfferEmail}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-900">
                      Send confirmation email
                    </span>

                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                      Uses existing Supabase Edge Function
                      send-guest-booking-email. Available only for Paid +
                      Confirmed + Enabled booking.
                    </span>
                  </span>
                </label>
              </FormSection>
            </form>
          ) : (
            <>
              {/* =====================================================
                  BASIC DETAILS
                  ===================================================== */}

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox
                  icon={User}
                  label="Guest Name"
                  value={booking?.guestName}
                />

                <InfoBox
                  icon={Car}
                  label="Vehicle Plate"
                  value={booking?.vehiclePlate}
                />

                <InfoBox icon={Mail} label="Email" value={booking?.email} />

                <InfoBox icon={Phone} label="Phone" value={booking?.phone} />

                <InfoBox
                  icon={MapPin}
                  label="Parking Allocation"
                  value={parkingAllocation}
                />

                <InfoBox
                  icon={CalendarCheck}
                  label="Booking Date"
                  value={booking?.bookingDate}
                />

                <InfoBox
                  icon={Clock3}
                  label="Time"
                  value={`${booking?.startTime || "-"} - ${
                    booking?.endTime || "-"
                  }`}
                />

                <InfoBox
                  icon={Clock3}
                  label="Duration"
                  value={booking?.duration}
                />
              </div>

              {/* =====================================================
                  PAYMENT AND ACCESS DETAILS
                  ===================================================== */}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black text-slate-950">
                    Payment & Receipt
                  </p>

                  <div className="mt-4 space-y-3">
                    <DetailRow
                      icon={CreditCard}
                      label="Parking Fee"
                      value={`RM ${parkingFee.toFixed(2)}`}
                    />

                    <DetailRow
                      icon={CreditCard}
                      label="Payment Method"
                      value={booking?.paymentMethod || "-"}
                    />

                    <DetailRow
                      icon={Receipt}
                      label="Payment Reference"
                      value={booking?.paymentReference || "-"}
                    />

                    {booking?.providerManaged && (
                      <>
                        <DetailRow
                          icon={CreditCard}
                          label="Payment Provider"
                          value={booking?.paymentProvider || "-"}
                        />

                        <DetailRow
                          icon={Receipt}
                          label="Provider Bill ID"
                          value={booking?.providerBillId || "-"}
                        />

                        <DetailRow
                          icon={Receipt}
                          label="Provider Status"
                          value={booking?.providerStatus || "-"}
                        />

                        <DetailRow
                          icon={Receipt}
                          label="Provider Reference"
                          value={booking?.providerReference || "-"}
                        />
                      </>
                    )}

                    <DetailRow
                      icon={Receipt}
                      label="Receipt Status"
                      value={booking?.receiptStatus}
                      status
                    />

                    <div className="rounded-2xl bg-white p-4">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Payment Status
                      </label>

                      {booking?.providerManaged && (
                        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                          <p className="text-xs font-black text-emerald-800">
                            Provider-managed payment
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
                            {booking.paymentProvider || "Payment provider"} is
                            the payment authority. Manual status changes are
                            disabled.
                          </p>
                        </div>
                      )}

                      <select
                        value={booking?.paymentStatus || "Pending"}
                        onChange={(event) =>
                          handlePaymentStatusChange(event.target.value)
                        }
                        disabled={isWorking || Boolean(booking?.providerManaged)}
                        title={
                          booking?.providerManaged
                            ? "Payment status is controlled by the verified provider callback."
                            : undefined
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {paymentStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black text-slate-950">
                    ANPR Access Control
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={booking?.anprAccess} />
                    <StatusBadge status={booking?.entryStatus} />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      ANPR Access Status
                    </label>

                    <select
                      value={booking?.anprAccess || "Not Enabled"}
                      onChange={(event) =>
                        handleAnprAccessChange(event.target.value)
                      }
                      disabled={isWorking}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {anprAccessOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      This controls whether the plate should be allowed by ANPR
                      during the valid booking window.
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      Booking Status
                    </label>

                    <select
                      value={booking?.bookingStatus || "Pending Payment"}
                      onChange={(event) =>
                        handleBookingStatusChange(event.target.value)
                      }
                      disabled={isWorking}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bookingStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      Entry Status
                    </label>

                    <select
                      value={booking?.entryStatus || "Not Entered"}
                      onChange={(event) =>
                        handleEntryStatusChange(event.target.value)
                      }
                      disabled={isWorking}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {entryStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Entry and exit are derived from ANPR logs. Admin can only
                      mark No Show manually.
                    </p>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  EMAIL ACTION
                  ===================================================== */}

              <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
                      <Mail className="h-5 w-5" />
                    </div>

                    <p className="text-sm font-black text-slate-950">
                      Guest Confirmation Email
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Reuses existing email template and sender through Supabase
                      Edge Function. Email can only be sent for Paid +
                      Confirmed + Enabled booking.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isWorking}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isWorking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Resend Email
                  </button>
                </div>
              </div>

              {/* =====================================================
                  GUEST ACCESS RULE
                  ===================================================== */}

              <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-600">
                  <Radio className="h-5 w-5" />
                </div>

                <p className="text-sm font-black text-slate-950">
                  Automatic Guest Access Rule
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Guest booking does not require admin approval or QR for gate
                  entry. Once payment is successful, the guest plate is
                  registered automatically and ANPR can allow entry during the
                  valid booking period.
                </p>
              </div>

              {/* =====================================================
                  ENTRY, EXIT AND EXPIRY DETAILS
                  ===================================================== */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoBox
                  icon={Clock3}
                  label="Entry Time"
                  value={booking?.entryTime || "-"}
                />

                <InfoBox
                  icon={Clock3}
                  label="Exit Time"
                  value={booking?.exitTime || "-"}
                />

                {booking?.bookingStatus === "Expired" && (
                  <>
                    <InfoBox
                      icon={Clock3}
                      label="Expired Reason"
                      value={booking?.expiredReason || "-"}
                    />

                    <InfoBox
                      icon={Clock3}
                      label="Expired At"
                      value={booking?.expiredAt || "-"}
                    />
                  </>
                )}
              </div>

              {/* =====================================================
                  VISIT DETAILS
                  ===================================================== */}

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Visit Purpose
                </p>

                <p className="mt-2 text-sm font-black text-slate-800">
                  {booking?.visitPurpose || "-"}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Host: {booking?.hostDepartment || "-"}
                </p>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                  {booking?.remarks || "-"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* =====================================================
            MODAL FOOTER
            ===================================================== */}

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isCreateMode && isViewMode && (
              <>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={isWorking}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Ban className="h-4 w-4" />
                  Cancel Booking
                </button>

                <button
                  type="button"
                  onClick={handleDeleteBooking}
                  disabled={isWorking}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {isFormMode && !isCreateMode && (
              <button
                type="button"
                onClick={() => {
                  setActiveMode("view")
                  setForm(buildInitialForm(booking))
                  setNotice(null)
                }}
                disabled={isWorking}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isWorking}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>

            {isViewMode && !isCreateMode && (
              <button
                type="button"
                onClick={() => {
                  setActiveMode("edit")
                  setNotice(null)
                }}
                disabled={isWorking}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Edit3 className="h-4 w-4" />
                Edit Booking
              </button>
            )}

            {isFormMode && (
              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={isWorking}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCreateMode ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}

                {isCreateMode ? "Create Booking" : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// FORM SECTION
// =====================================================

function FormSection({ title, description, children }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <p className="text-sm font-black text-slate-950">{title}</p>

        {description && (
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  )
}

// =====================================================
// FORM INPUT
// =====================================================

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        step={step}
        required={required}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  )
}

// =====================================================
// FORM SELECT
// =====================================================

function FormSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

// =====================================================
// FORM TEXTAREA
// =====================================================

function FormTextarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  )
}

// =====================================================
// INFO BOX
// =====================================================

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
        {value || "-"}
      </p>
    </div>
  )
}

// =====================================================
// DETAIL ROW
// =====================================================

function DetailRow({ icon: Icon, label, value, status = false }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Icon className="h-4 w-4" />
          </div>

          <p className="text-sm font-black text-slate-800">{label}</p>
        </div>

        {status ? (
          <StatusBadge status={value} />
        ) : (
          <p className="text-right text-sm font-black text-slate-950">
            {value || "-"}
          </p>
        )}
      </div>
    </div>
  )
}

export default GuestBookingModal