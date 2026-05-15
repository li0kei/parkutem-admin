// =====================================================
// IMPORTS
// =====================================================

import { Mail, LockKeyhole } from "lucide-react"

// =====================================================
// AUTH INPUT COMPONENT
// =====================================================

function AuthInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  icon = "email",
  required = false,
  className = "",
}) {
  const Icon = icon === "password" ? LockKeyhole : Mail

  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-300">
        {label}
      </label>

      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-11 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-300/10 ${className}`}
        />
      </div>
    </div>
  )
}

export default AuthInput