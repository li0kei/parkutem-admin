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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
  // HANDLE LOGIN
  // =====================================================

  function handleLogin(event) {
    event.preventDefault()

    setIsLoading(true)

    setTimeout(() => {
      const result = loginAdmin(formData.email, formData.password)

      if (!result.success) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      if (rememberMe) {
        localStorage.setItem("parkutem_admin_remember", "true")
      } else {
        localStorage.removeItem("parkutem_admin_remember")
      }

      navigate("/dashboard", { replace: true })
    }, 450)
  }

  // =====================================================
  // USE DEMO ACCOUNT
  // =====================================================

  function handleUseDemoAccount() {
    setFormData({
      email: "admin@parkutem.com",
      password: "password123",
    })

    setError("")
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in using your ParkUTeM administrator account."
    >
      <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
        <AuthInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin@parkutem.com"
          icon="email"
          required
        />

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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 font-medium text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-white/10 accent-cyan-300"
            />
            Remember me
          </label>

          <button
            type="button"
            className="font-bold text-cyan-300 transition hover:text-cyan-200"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

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

        <button
          type="button"
          onClick={handleUseDemoAccount}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-black text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
        >
          Use Demo Admin Account
        </button>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="font-black uppercase tracking-[0.22em] text-slate-500">
              Demo
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400">
              <span>
                Email:{" "}
                <strong className="text-cyan-200">
                  admin@parkutem.com
                </strong>
              </span>

              <span>
                Pass:{" "}
                <strong className="text-cyan-200">password123</strong>
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Admin access only. No public registration.
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login