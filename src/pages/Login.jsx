// =====================================================
// IMPORTS
// =====================================================

import { useState } from "react"
import { useNavigate } from "react-router"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

import AuthLayout from "../components/auth/AuthLayout"
import AuthInput from "../components/auth/AuthInput"
import { loginAdmin } from "../utils/auth"

// =====================================================
// LOGIN PAGE
// =====================================================

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState(() => ({
  email: localStorage.getItem("parkutem_admin_email") || "",
  password: "",
}))

const [showPassword, setShowPassword] = useState(false)

const [rememberMe, setRememberMe] = useState(() => {
  return localStorage.getItem("parkutem_admin_remember") === "true"
})

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (error) {
      setError("")
    }
  }

  // =====================================================
  // VALIDATE LOGIN FORM
  // =====================================================

  function validateLoginForm() {
    if (!formData.email.trim()) {
      return "Admin email address is required."
    }

    if (!formData.password.trim()) {
      return "Admin password is required."
    }

    return ""
  }

  // =====================================================
  // HANDLE LOGIN
  // =====================================================

  async function handleLogin(event) {
    event.preventDefault()

    const validationError = validateLoginForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await loginAdmin(formData.email, formData.password)

      if (!result.success) {
        setError(result.message)
        return
      }

      if (rememberMe) {
  localStorage.setItem("parkutem_admin_remember", "true")
  localStorage.setItem(
    "parkutem_admin_email",
    formData.email.trim().toLowerCase()
  )
} else {
  localStorage.removeItem("parkutem_admin_remember")
  localStorage.removeItem("parkutem_admin_email")
}

      navigate("/dashboard", { replace: true })
    } catch (error) {
      console.error("Admin login failed:", error)

      setError(
        error.message ||
          "Unable to sign in right now. Please check your connection and try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in using your ParkUTeM administrator account."
    >
      <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
        {/* =====================================================
            EMAIL INPUT
        ===================================================== */}

        <AuthInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter admin email"
          icon="email"
          required
        />

        {/* =====================================================
            PASSWORD INPUT
        ===================================================== */}

        <div className="relative">
          <AuthInput
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter admin password"
            icon="password"
            required
            className="pr-14"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute bottom-3.5 right-4 text-slate-500 transition hover:text-cyan-300"
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* =====================================================
            LOGIN OPTIONS
        ===================================================== */}

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 font-medium text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => {
                const isChecked = event.target.checked

                setRememberMe(isChecked)

                if (!isChecked) {
                  localStorage.removeItem("parkutem_admin_remember")
                  localStorage.removeItem("parkutem_admin_email")
                }
              }}
              className="h-4 w-4 rounded border-white/10 accent-cyan-300"
            />
            Remember me
          </label>

          <p className="text-xs font-semibold text-slate-500">
            Admin access only
          </p>
        </div>

        {/* =====================================================
            ERROR MESSAGE
        ===================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {/* =====================================================
            SUBMIT BUTTON
        ===================================================== */}

        <button
          type="submit"
          disabled={isLoading}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-300 px-5 py-3.5 font-black text-slate-950 shadow-[0_16px_38px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing in..." : "Sign In"}

          {!isLoading && (
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          )}
        </button>

        {/* =====================================================
            ACCESS NOTE
        ===================================================== */}

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
          <p className="text-center text-xs leading-5 text-slate-500">
            Only registered ParkUTeM administrators can access this dashboard.
            Public registration is not available.
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}

export default Login