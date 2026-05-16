// =====================================================
// IMPORTS
// =====================================================

import { supabase } from "../lib/supabaseClient"

// =====================================================
// LOGIN ADMIN
// =====================================================

export async function loginAdmin(email, password) {
  const cleanEmail = email.trim().toLowerCase()

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

  if (authError) {
    return {
      success: false,
      message: authError.message || "Invalid admin email or password.",
    }
  }

  const user = authData?.user

  if (!user) {
    return {
      success: false,
      message: "Unable to verify admin account.",
    }
  }

  const { data: adminProfile, error: profileError } = await supabase
    .from("admin_users")
    .select("id, user_id, email, full_name, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (profileError || !adminProfile) {
    await supabase.auth.signOut()

    return {
      success: false,
      message: "This account is not registered as an active ParkUTeM admin.",
    }
  }

  localStorage.setItem("parkutem_admin_profile", JSON.stringify(adminProfile))

  return {
    success: true,
    user,
    adminProfile,
  }
}

// =====================================================
// GET CURRENT ADMIN SESSION
// =====================================================

export async function getCurrentAdminSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data?.session) {
    return {
      success: false,
      session: null,
      adminProfile: null,
    }
  }

  const { data: adminProfile, error: profileError } = await supabase
    .from("admin_users")
    .select("id, user_id, email, full_name, role, status")
    .eq("user_id", data.session.user.id)
    .eq("status", "active")
    .maybeSingle()

  if (profileError || !adminProfile) {
    await supabase.auth.signOut()
    localStorage.removeItem("parkutem_admin_profile")

    return {
      success: false,
      session: null,
      adminProfile: null,
    }
  }

  localStorage.setItem("parkutem_admin_profile", JSON.stringify(adminProfile))

  return {
    success: true,
    session: data.session,
    adminProfile,
  }
}

// =====================================================
// GET CURRENT ADMIN PROFILE
// Legacy function used by Topbar.jsx
// =====================================================

export function getCurrentAdmin() {
  try {
    const savedProfile = localStorage.getItem("parkutem_admin_profile")

    if (!savedProfile) {
      return null
    }

    return JSON.parse(savedProfile)
  } catch (error) {
    console.error("Failed to read admin profile:", error)
    localStorage.removeItem("parkutem_admin_profile")
    return null
  }
}

// =====================================================
// LOGOUT ADMIN
// =====================================================

export async function logoutAdmin() {
  localStorage.removeItem("parkutem_admin_profile")

  await supabase.auth.signOut()
}

// =====================================================
// LEGACY COMPATIBILITY
// Used by ProtectedRoute or older components.
// =====================================================

export function isAdminAuthenticated() {
  return Boolean(localStorage.getItem("parkutem_admin_profile"))
}