// =====================================================
// DUMMY ADMIN AUTH UTILITIES
// =====================================================

const AUTH_KEY = "parkutem_admin_auth"
const ADMIN_EMAIL_KEY = "parkutem_admin_email"

const DUMMY_ADMIN = {
  email: "admin@parkutem.com",
  password: "password123",
}

// =====================================================
// LOGIN ADMIN
// =====================================================

export function loginAdmin(email, password) {
  const normalizedEmail = email.trim().toLowerCase()

  const isValidEmail = normalizedEmail === DUMMY_ADMIN.email
  const isValidPassword = password === DUMMY_ADMIN.password

  if (!isValidEmail || !isValidPassword) {
    return {
      success: false,
      message: "Invalid email or password. Please try again.",
    }
  }

  localStorage.setItem(AUTH_KEY, "true")
  localStorage.setItem(ADMIN_EMAIL_KEY, normalizedEmail)

  return {
    success: true,
    message: "Login successful.",
  }
}

// =====================================================
// LOGOUT ADMIN
// =====================================================

export function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(ADMIN_EMAIL_KEY)
}

// =====================================================
// CHECK AUTH STATUS
// =====================================================

export function isAdminAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true"
}

// =====================================================
// GET CURRENT ADMIN
// =====================================================

export function getCurrentAdmin() {
  return {
    email: localStorage.getItem(ADMIN_EMAIL_KEY) || DUMMY_ADMIN.email,
    name: "ParkUTeM Admin",
    role: "System Administrator",
  }
}