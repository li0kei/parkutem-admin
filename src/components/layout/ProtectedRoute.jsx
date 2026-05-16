// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useState } from "react"
import { Navigate } from "react-router"

import { getCurrentAdminSession } from "../../utils/auth"

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
  })

  // =====================================================
  // CHECK ADMIN SESSION
  // =====================================================

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      const result = await getCurrentAdminSession()

      if (!isMounted) return

      setAuthState({
        isChecking: false,
        isAuthenticated: result.success,
      })
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (authState.isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-3xl border border-cyan-300/20 bg-slate-900 px-6 py-5 text-center shadow-[0_0_45px_rgba(14,165,233,0.18)]">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
            ParkUTeM
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-300">
            Verifying admin session...
          </p>
        </div>
      </div>
    )
  }

  // =====================================================
  // UNAUTHENTICATED
  // =====================================================

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute