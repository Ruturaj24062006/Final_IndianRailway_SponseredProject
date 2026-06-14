/**
 * Authentication Utility Helpers for Indian Railway Management System
 */

/**
 * Normalizes user designation strings to match frontend dashboard keys.
 * @param {string} role - The designation/role to normalize
 * @returns {string} Normalized role
 */
export function normalizeRole(role) {
  if (!role) return role;
  const cleanRole = role.trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, "");
  if (cleanRole === "SRDOM") {
    return "Super Admin";
  }
  if (
    cleanRole === "AOM" ||
    cleanRole === "AOM/GENERAL" ||
    cleanRole === "DOM"
  ) {
    return "AOM/General";
  }

  const cleanLower = role.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, "").replace(/_/g, "");
  if (cleanLower === "stationsupervisor" || cleanLower === "stationsuperintendent") {
    return "Station Superintendent";
  }
  if (cleanLower === "pointsman") return "Pointsman";
  if (cleanLower === "stationmaster") return "Station Master";
  if (cleanLower === "trainmanager") return "Train Manager";
  if (cleanLower === "trafficinspector") return "Traffic Inspector";
  if (cleanLower === "superadmin") return "Super Admin";

  return role;
}

/**
 * Retrieve the active JWT token from storage
 * @returns {string|null} JWT token
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Retrieve and parse the current user profile from storage
 * @returns {object|null} The parsed employee profile or null
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    if (user && user.role) {
      user.role = normalizeRole(user.role);
    }
    return user;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
}

/**
 * Retrieve the current user's normalized role from storage
 * @returns {string|null} The normalized designation role
 */
export function getCurrentRole() {
  const role = localStorage.getItem("role");
  return role ? normalizeRole(role) : null;
}

/**
 * Clear all authentication-related keys from localStorage
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

/**
 * Check if a user is currently authenticated
 * @returns {boolean} True if token exists
 */
export function isAuthenticated() {
  return !!getToken();
}
