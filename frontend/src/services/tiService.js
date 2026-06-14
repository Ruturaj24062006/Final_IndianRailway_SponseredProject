import { getToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:5000/api";

async function authenticatedFetch(path, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("No authorization token found. Please login again.");
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (response.ok) {
      const data = await response.json();
      if (data.success) return data.data;
    }
  } catch (err) {
    console.warn(`Direct fetch to ${path} failed, trying fallback relative proxy...`);
  }

  // Fallback
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch (Status: ${response.status})`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "API request failed");
  }
  return data.data;
}

function buildQueryString(filters = {}) {
  const params = new URLSearchParams();
  if (filters.station_id && filters.station_id !== "All") {
    params.append("station_id", filters.station_id);
  }
  if (filters.risk_level && filters.risk_level !== "All") {
    params.append("risk_level", filters.risk_level);
  }
  if (filters.role && filters.role !== "All") {
    params.append("role", filters.role);
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

/**
 * Fetch Traffic Inspector dashboard safety stats
 */
export async function getTiDashboard(filters) {
  return authenticatedFetch(`/ti/dashboard${buildQueryString(filters)}`);
}

/**
 * Fetch assessments awaiting TI approval
 */
export async function getTiPendingApprovals(filters) {
  return authenticatedFetch(`/ti/pending-approvals${buildQueryString(filters)}`);
}

/**
 * Fetch historical approved/rejected assessments
 */
export async function getTiAssessmentHistory(filters) {
  return authenticatedFetch(`/ti/assessment-history${buildQueryString(filters)}`);
}

/**
 * Fetch compliance roster list (supporting filters and role parameter)
 */
export async function getTiPerformanceSummary(filters) {
  return authenticatedFetch(`/ti/performance-summary${buildQueryString(filters)}`);
}

/**
 * Fetch counselling records from the backend
 */
export async function getCounsellingRecords() {
  return authenticatedFetch("/counselling");
}

/**
 * Create a new counselling record
 */
export async function createCounsellingRecord(payload) {
  return authenticatedFetch("/counselling", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * Fetch all employees with role-based scoping (uses admin/employees endpoint)
 */
export async function getEmployees(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role_id && filters.role_id !== "All") params.append("role_id", filters.role_id);
  if (filters.station_id && filters.station_id !== "All") params.append("station_id", filters.station_id);
  if (filters.risk_level && filters.risk_level !== "All") params.append("risk_level", filters.risk_level);
  if (filters.search) params.append("search", filters.search);
  const qs = params.toString();
  return authenticatedFetch(`/admin/employees${qs ? `?${qs}` : ""}`);
}

/**
 * Fetch stations list from backend
 */
export async function getStations() {
  return authenticatedFetch("/admin/stations");
}

/**
 * Fetch inspections (if backend route exists, otherwise returns empty)
 */
export async function getInspections() {
  try {
    return await authenticatedFetch("/inspections");
  } catch {
    return [];
  }
}

/**
 * Approve a Pointsman safety assessment
 */
export async function approveAssessment(assessmentId, remarks, practicalScore) {
  return authenticatedFetch(`/assessments/${assessmentId}/approve`, {
    method: "POST",
    body: JSON.stringify({ remarks, practical_score: practicalScore })
  });
}

/**
 * Reject a Pointsman safety assessment
 */
export async function rejectAssessment(assessmentId, remarks) {
  return authenticatedFetch(`/assessments/${assessmentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ remarks })
  });
}

/**
 * Fetch detailed profile of the logged-in employee
 */
export async function getProfile() {
  return authenticatedFetch("/employees/profile");
}

/**
 * Fetch historical evaluations of the logged-in employee
 */
export async function getMyAssessmentHistory() {
  return authenticatedFetch("/employees/history");
}

/**
 * Fetch audit logs of the logged-in employee
 */
export async function getMyAuditLogs() {
  return authenticatedFetch("/employees/audit-logs");
}

/**
 * Fetch safety alerts and notifications
 */
export async function getNotifications(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "All" && v !== "") {
      params.append(k, v);
    }
  });
  const qs = params.toString();
  return authenticatedFetch(`/notifications${qs ? `?${qs}` : ""}`);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  return authenticatedFetch("/notifications/read-all", { method: "POST" });
}

/**
 * Mark specific notification as read
 */
export async function markNotificationAsRead(id) {
  return authenticatedFetch(`/notifications/${id}/read`, { method: "PUT" });
}
