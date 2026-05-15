import { Navigate } from "react-router"
import { isAdminAuthenticated } from "../../utils/auth"

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const isAuthenticated = isAdminAuthenticated()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute