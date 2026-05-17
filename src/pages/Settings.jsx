// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useState } from "react"
import {
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  ParkingCircle,
  RefreshCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Wallet,
} from "lucide-react"

import {
  defaultAdminSettings,
  loadAdminSettings,
  resetAdminSettings,
  saveAdminSettings,
  subscribeToSettings,
  unsubscribeFromSettings,
} from "../services/adminSettingsService"

// =====================================================
// SETTINGS PAGE
// =====================================================

function Settings() {
  const [profile, setProfile] = useState(defaultAdminSettings.adminProfile)
  const [parking, setParking] = useState(defaultAdminSettings.parkingPolicy)
  const [reservation, setReservation] = useState(
    defaultAdminSettings.reservationPolicy
  )
  const [guest, setGuest] = useState(defaultAdminSettings.guestPolicy)
  const [anpr, setAnpr] = useState(defaultAdminSettings.anprPolicy)
  const [preferences, setPreferences] = useState(
    defaultAdminSettings.systemPreferences
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [savedMessage, setSavedMessage] = useState("")

  // =====================================================
  // APPLY SETTINGS TO STATE
  // =====================================================

  function applySettings(settings) {
    setProfile(settings.adminProfile)
    setParking(settings.parkingPolicy)
    setReservation(settings.reservationPolicy)
    setGuest(settings.guestPolicy)
    setAnpr(settings.anprPolicy)
    setPreferences(settings.systemPreferences)
  }

  // =====================================================
  // GET CURRENT SETTINGS PAYLOAD
  // =====================================================

  function getCurrentSettingsPayload() {
    return {
      adminProfile: profile,
      parkingPolicy: parking,
      reservationPolicy: reservation,
      guestPolicy: guest,
      anprPolicy: anpr,
      systemPreferences: preferences,
    }
  }

  // =====================================================
  // LOAD SETTINGS FROM SUPABASE
  // =====================================================

  async function loadSettings({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setLoadError("")

    try {
      const settings = await loadAdminSettings()
      applySettings(settings)
    } catch (error) {
      console.error("Failed to load settings:", error)
      setLoadError(error.message || "Unable to load settings from Supabase.")
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  // =====================================================
  // INITIAL LOAD + REALTIME
  // =====================================================

  useEffect(() => {
    loadSettings()

    const channel = subscribeToSettings(() => {
      loadSettings({ silent: true })
    })

    return () => {
      unsubscribeFromSettings(channel)
    }
  }, [])

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  async function handleSave() {
    setIsSaving(true)
    setLoadError("")
    setSavedMessage("")

    try {
      const savedSettings = await saveAdminSettings(getCurrentSettingsPayload())

      applySettings(savedSettings)
      setSavedMessage("Settings saved successfully to Supabase.")

      setTimeout(() => {
        setSavedMessage("")
      }, 2500)
    } catch (error) {
      console.error("Failed to save settings:", error)
      setLoadError(error.message || "Unable to save settings to Supabase.")
    } finally {
      setIsSaving(false)
    }
  }

  // =====================================================
  // RESET SETTINGS
  // =====================================================

  async function handleReset() {
    setIsSaving(true)
    setLoadError("")
    setSavedMessage("")

    try {
      const resetSettings = await resetAdminSettings()

      applySettings(resetSettings)
      setSavedMessage("Settings reset to default Supabase configuration.")

      setTimeout(() => {
        setSavedMessage("")
      }, 2500)
    } catch (error) {
      console.error("Failed to reset settings:", error)
      setLoadError(error.message || "Unable to reset settings.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          SETTINGS HERO
          ===================================================== */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                System Configuration
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                ParkUTeM Admin Settings
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Manage administrator profile, parking fee rules, reservation
                policy, guest access, ANPR checks, and notification preferences.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving || isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUPABASE STATUS
          ===================================================== */}

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-black text-amber-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm font-black text-cyan-700">
          Loading system settings from Supabase...
        </div>
      )}

      {savedMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {savedMessage}
        </div>
      )}

      {/* =====================================================
          SETTINGS GRID
          ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard
          title="Admin Profile"
          subtitle="Basic administrator account information."
          icon={UserRound}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Admin Name"
              value={profile.name}
              onChange={(value) => setProfile({ ...profile, name: value })}
            />

            <TextInput
              label="Email"
              value={profile.email}
              onChange={(value) => setProfile({ ...profile, email: value })}
            />

            <TextInput
              label="Role"
              value={profile.role}
              onChange={(value) => setProfile({ ...profile, role: value })}
            />

            <TextInput
              label="Department"
              value={profile.department}
              onChange={(value) =>
                setProfile({ ...profile, department: value })
              }
            />

            <TextInput
              label="Phone"
              value={profile.phone}
              onChange={(value) => setProfile({ ...profile, phone: value })}
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Parking Fee Policy"
          subtitle="Student/staff normal parking is free from 7AM to 7PM. After 7PM, parking fee is charged based on actual usage."
          icon={ParkingCircle}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Free Parking Start"
              type="time"
              value={parking.freeStartTime}
              onChange={(value) =>
                setParking({ ...parking, freeStartTime: value })
              }
            />

            <TextInput
              label="Free Parking End"
              type="time"
              value={parking.freeEndTime}
              onChange={(value) =>
                setParking({ ...parking, freeEndTime: value })
              }
            />

            <TextInput
              label="After 7PM Rate (RM)"
              type="number"
              value={parking.afterHourRate}
              onChange={(value) =>
                setParking({ ...parking, afterHourRate: Number(value) })
              }
            />

            <TextInput
              label="Rate Unit"
              value={parking.afterHourRateUnit}
              onChange={(value) =>
                setParking({ ...parking, afterHourRateUnit: value })
              }
            />

            <TextInput
              label="Max Daily Charge (RM)"
              type="number"
              value={parking.maxDailyCharge}
              onChange={(value) =>
                setParking({ ...parking, maxDailyCharge: Number(value) })
              }
            />

            <TextInput
              label="Grace Period (Minutes)"
              type="number"
              value={parking.gracePeriodMinutes}
              onChange={(value) =>
                setParking({ ...parking, gracePeriodMinutes: Number(value) })
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Reservation Policy"
          subtitle="Reservation fee is a fixed one-time fee and does not depend on parking duration."
          icon={Wallet}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Reservation Fee (RM)"
              type="number"
              value={reservation.reservationFee}
              onChange={(value) =>
                setReservation({
                  ...reservation,
                  reservationFee: Number(value),
                })
              }
            />

            <TextInput
              label="Fee Type"
              value={reservation.reservationFeeType}
              onChange={(value) =>
                setReservation({
                  ...reservation,
                  reservationFeeType: value,
                })
              }
            />

            <TextInput
              label="Max Reservation Hours"
              type="number"
              value={reservation.maxReservationHours}
              onChange={(value) =>
                setReservation({
                  ...reservation,
                  maxReservationHours: Number(value),
                })
              }
            />

            <TextInput
              label="Cancellation Window (Minutes)"
              type="number"
              value={reservation.cancellationWindowMinutes}
              onChange={(value) =>
                setReservation({
                  ...reservation,
                  cancellationWindowMinutes: Number(value),
                })
              }
            />
          </div>

          <div className="mt-5">
            <ToggleRow
              label="Allow Reservation Extension"
              description="Future mobile app reservation extension option."
              checked={reservation.allowExtension}
              onChange={(value) =>
                setReservation({ ...reservation, allowExtension: value })
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Guest Parking Policy"
          subtitle="Guest pays through the web portal. After successful payment, guest plate is registered for ANPR access automatically."
          icon={CreditCard}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Guest Parking Fee (RM)"
              type="number"
              value={guest.guestParkingRate}
              onChange={(value) =>
                setGuest({ ...guest, guestParkingRate: Number(value) })
              }
            />

            <TextInput
              label="Fee Unit"
              value={guest.guestParkingRateUnit}
              onChange={(value) =>
                setGuest({ ...guest, guestParkingRateUnit: value })
              }
            />

            <TextInput
              label="No-Show Grace (Minutes)"
              type="number"
              value={guest.noShowGraceMinutes}
              onChange={(value) =>
                setGuest({ ...guest, noShowGraceMinutes: Number(value) })
              }
            />

            <TextInput
              label="Overstay Email After (Minutes)"
              type="number"
              value={guest.overstayEmailAfterMinutes}
              onChange={(value) =>
                setGuest({
                  ...guest,
                  overstayEmailAfterMinutes: Number(value),
                })
              }
            />
          </div>

          <div className="mt-5 space-y-3">
            <ToggleRow
              label="Auto Register Plate After Payment"
              description="Guest plate becomes available for ANPR detection immediately after payment."
              checked={guest.autoRegisterPlateAfterPayment}
              onChange={(value) =>
                setGuest({
                  ...guest,
                  autoRegisterPlateAfterPayment: value,
                })
              }
            />

            <ToggleRow
              label="Require Admin Approval"
              description="Should remain disabled to reduce admin workload."
              checked={guest.requireAdminApproval}
              onChange={(value) =>
                setGuest({ ...guest, requireAdminApproval: value })
              }
            />

            <ToggleRow
              label="Send Receipt Email"
              description="Send receipt email after successful guest payment."
              checked={guest.sendReceiptEmail}
              onChange={(value) =>
                setGuest({ ...guest, sendReceiptEmail: value })
              }
            />

            <ToggleRow
              label="Send QR Email"
              description="Optional feature. Current guest access relies on ANPR plate registration."
              checked={guest.sendQrEmail}
              onChange={(value) => setGuest({ ...guest, sendQrEmail: value })}
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="ANPR & Sensor Settings"
          subtitle="System checks for plate detection, unknown plates, and camera health."
          icon={Camera}
        >
          <div className="mb-5">
            <TextInput
              label="Minimum ANPR Confidence (%)"
              type="number"
              value={anpr.minimumConfidence}
              onChange={(value) =>
                setAnpr({ ...anpr, minimumConfidence: Number(value) })
              }
            />
          </div>

          <div className="space-y-3">
            <ToggleRow
              label="Allow Guest Auto Access"
              description="Guest plates with completed payment can enter automatically."
              checked={anpr.allowGuestAutoAccess}
              onChange={(value) =>
                setAnpr({ ...anpr, allowGuestAutoAccess: value })
              }
            />

            <ToggleRow
              label="Flag Unknown Plate"
              description="Unknown plates are marked for admin review."
              checked={anpr.flagUnknownPlate}
              onChange={(value) =>
                setAnpr({ ...anpr, flagUnknownPlate: value })
              }
            />

            <ToggleRow
              label="Flag Low Confidence Detection"
              description="Low-confidence plate readings are flagged in ANPR logs."
              checked={anpr.flagLowConfidence}
              onChange={(value) =>
                setAnpr({ ...anpr, flagLowConfidence: value })
              }
            />

            <ToggleRow
              label="Camera Health Check"
              description="Future ANPR camera online/offline monitoring."
              checked={anpr.cameraHealthCheck}
              onChange={(value) =>
                setAnpr({ ...anpr, cameraHealthCheck: value })
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="System Preferences"
          subtitle="Notification and system behaviour settings."
          icon={SlidersHorizontal}
        >
          <div className="space-y-3">
            <ToggleRow
              label="Maintenance Mode"
              description="Disable public-facing operations temporarily."
              checked={preferences.maintenanceMode}
              onChange={(value) =>
                setPreferences({ ...preferences, maintenanceMode: value })
              }
            />

            <ToggleRow
              label="Email Notifications"
              description="Send system emails for receipts, alerts, and issue updates."
              checked={preferences.emailNotifications}
              onChange={(value) =>
                setPreferences({ ...preferences, emailNotifications: value })
              }
            />

            <ToggleRow
              label="Issue Alerts"
              description="Notify admin when new support issues are created."
              checked={preferences.issueAlerts}
              onChange={(value) =>
                setPreferences({ ...preferences, issueAlerts: value })
              }
            />

            <ToggleRow
              label="Sensor Alerts"
              description="Notify admin about low battery or offline IoT sensors."
              checked={preferences.sensorAlerts}
              onChange={(value) =>
                setPreferences({ ...preferences, sensorAlerts: value })
              }
            />

            <ToggleRow
              label="Payment Alerts"
              description="Notify admin about failed or pending payment transactions."
              checked={preferences.paymentAlerts}
              onChange={(value) =>
                setPreferences({ ...preferences, paymentAlerts: value })
              }
            />
          </div>
        </SettingsCard>
      </div>

      {/* =====================================================
          POLICY SUMMARY
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Active Policy Summary
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Quick explanation of current Supabase configuration.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <PolicySummaryItem
            icon={Clock}
            title="Student/Staff Free Parking"
            description={`Normal parking is free from ${parking.freeStartTime} to ${parking.freeEndTime}.`}
          />

          <PolicySummaryItem
            icon={Wallet}
            title="After 7PM Parking Fee"
            description={`After free hours, parking is charged RM ${parking.afterHourRate} ${parking.afterHourRateUnit}.`}
          />

          <PolicySummaryItem
            icon={Mail}
            title="Guest Access"
            description={
              guest.autoRegisterPlateAfterPayment
                ? "Guest plate is registered automatically after payment. No admin approval required."
                : "Guest plate requires manual registration."
            }
          />
        </div>
      </section>
    </div>
  )
}

// =====================================================
// SETTINGS CARD
// =====================================================

function SettingsCard({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  )
}

// =====================================================
// TEXT INPUT
// =====================================================

function TextInput({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </div>
  )
}

// =====================================================
// TOGGLE ROW
// =====================================================

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-black text-slate-800">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-cyan-400" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  )
}

// =====================================================
// POLICY SUMMARY ITEM
// =====================================================

function PolicySummaryItem({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

export default Settings