// =====================================================
// IMPORTS
// =====================================================

import { useState } from "react"
import { X } from "lucide-react"

import {
  issuePriorities,
  issueTypes,
} from "../../data/issues"

// =====================================================
// INITIAL FORM STATE
// =====================================================

const initialFormState = {
  title: "",
  type: "General Issue",
  priority: "Medium",
  reporterName: "Admin",
  reporterEmail: "",
  reporterPhone: "",
  relatedPlate: "",
  relatedBay: "",
  relatedBookingReference: "",
  description: "",
  latestNote: "",
}

// =====================================================
// ISSUE CREATE MODAL
// =====================================================

function IssueCreateModal({ isOpen, onClose, onCreateIssue }) {
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  if (!isOpen) {
    return null
  }

  // =====================================================
  // UPDATE FORM FIELD
  // =====================================================

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  // =====================================================
  // SUBMIT ISSUE
  // =====================================================

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitError("")

    try {
      await onCreateIssue(formData)

      setFormData(initialFormState)
      onClose()
    } catch (error) {
      console.error("Create issue modal error:", error)
      setSubmitError(error.message || "Unable to create support issue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
              Manual Ticket
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              Create Support Issue
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Log a manual admin issue for tracking and reporting.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            FORM
            ===================================================== */}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {submitError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {submitError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Issue Title"
              value={formData.title}
              onChange={(value) => updateField("title", value)}
              placeholder="Example: ANPR detected wrong plate number"
              required
            />

            <FormSelect
              label="Issue Type"
              value={formData.type}
              onChange={(value) => updateField("type", value)}
              options={issueTypes.filter((type) => type !== "All Types")}
            />

            <FormSelect
              label="Priority"
              value={formData.priority}
              onChange={(value) => updateField("priority", value)}
              options={issuePriorities.filter(
                (priority) => priority !== "All Priority"
              )}
            />

            <FormInput
              label="Reporter Name"
              value={formData.reporterName}
              onChange={(value) => updateField("reporterName", value)}
              placeholder="Admin"
            />

            <FormInput
              label="Reporter Email"
              value={formData.reporterEmail}
              onChange={(value) => updateField("reporterEmail", value)}
              placeholder="Optional"
            />

            <FormInput
              label="Reporter Phone"
              value={formData.reporterPhone}
              onChange={(value) => updateField("reporterPhone", value)}
              placeholder="Optional"
            />

            <FormInput
              label="Related Plate"
              value={formData.relatedPlate}
              onChange={(value) => updateField("relatedPlate", value)}
              placeholder="Example: WYY5510"
            />

            <FormInput
              label="Related Bay"
              value={formData.relatedBay}
              onChange={(value) => updateField("relatedBay", value)}
              placeholder="Example: A-01"
            />

            <FormInput
              label="Booking / Reservation Reference"
              value={formData.relatedBookingReference}
              onChange={(value) =>
                updateField("relatedBookingReference", value)
              }
              placeholder="Optional"
              className="md:col-span-2"
            />
          </div>

          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(value) => updateField("description", value)}
            placeholder="Describe the issue clearly..."
            required
          />

          <FormTextarea
            label="Admin Note"
            value={formData.latestNote}
            onChange={(value) => updateField("latestNote", value)}
            placeholder="Optional note for admin tracking..."
          />

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// FORM INPUT
// =====================================================

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  )
}

// =====================================================
// FORM SELECT
// =====================================================

function FormSelect({ label, value, onChange, options }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
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

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <textarea
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  )
}

export default IssueCreateModal