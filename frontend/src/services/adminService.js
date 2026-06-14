import { getToken } from "../utils/auth";

const API_BASE = "http://127.0.0.1:5000/api/admin";

// ── Shared authenticated fetch helper ────────────────────────────────────────
async function adminFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token. Please log in again.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  // Try direct localhost first, then relative fallback
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    response = await fetch(`/api/admin${path}`, { ...options, headers });
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data.data;
}

// ── Dashboard & System ───────────────────────────────────────────────────────
export const getDashboard     = ()       => adminFetch("/dashboard");
export const getSystemHealth  = ()       => adminFetch("/system-health");
export const getAuditLogs     = ()       => adminFetch("/audit-logs");

// ── Employees ────────────────────────────────────────────────────────────────
export const getEmployees = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "All") params.append(k, v);
  });
  const qs = params.toString();
  return adminFetch(`/employees${qs ? "?" + qs : ""}`);
};

export const createEmployee = (payload) =>
  adminFetch("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateEmployee = (id, payload) =>
  adminFetch(`/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// Logical deactivation only — sets status='Inactive'
export const deactivateEmployee = (id) =>
  adminFetch(`/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "Inactive" }),
  });

// ── User Accounts ─────────────────────────────────────────────────────────────
export const getUsers        = ()        => adminFetch("/users");
export const resetPassword   = (hrms_id, password) =>
  adminFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify({ hrms_id, password }),
  });

// ── Stations ──────────────────────────────────────────────────────────────────
export const getStations     = ()        => adminFetch("/stations");
export const createStation   = (payload) =>
  adminFetch("/stations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateStation   = (id, payload) =>
  adminFetch(`/stations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ── Question Bank ─────────────────────────────────────────────────────────────
export const getQuestions    = ()        => adminFetch("/questions");
export const createQuestion  = (payload) =>
  adminFetch("/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateQuestion  = (id, payload) =>
  adminFetch(`/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
// Sends DELETE — server sets is_active = false, no physical deletion
export const deactivateQuestion = (id) =>
  adminFetch(`/questions/${id}`, { method: "DELETE" });

// ── Reports ───────────────────────────────────────────────────────────────────
const API_REPORTS_BASE = "http://127.0.0.1:5000/api/reports";

async function reportsFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token. Please log in again.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_REPORTS_BASE}${path}`, { ...options, headers });
  } catch {
    response = await fetch(`/api/reports${path}`, { ...options, headers });
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data.data;
}

export const getReportsDashboard   = () => reportsFetch("/dashboard");
export const getReportsCbt         = () => reportsFetch("/cbt");
export const getReportsPme         = () => reportsFetch("/pme");
export const getReportsRef         = () => reportsFetch("/ref");
export const getReportsAssessments = () => reportsFetch("/assessments");
export const getReportsRisk        = () => reportsFetch("/risk");
export const getReportsCompliance   = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "All" && v !== "") {
      params.append(k, v);
    }
  });
  const qs = params.toString();
  return reportsFetch(`/compliance${qs ? "?" + qs : ""}`);
};

// ── Notifications ─────────────────────────────────────────────────────────────
const API_NOTIFICATIONS_BASE = "http://127.0.0.1:5000/api/notifications";

async function notificationsFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token. Please log in again.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_NOTIFICATIONS_BASE}${path}`, { ...options, headers });
  } catch {
    response = await fetch(`/api/notifications${path}`, { ...options, headers });
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export const getNotifications = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "All" && v !== "") {
      params.append(k, v);
    }
  });
  const qs = params.toString();
  return notificationsFetch(qs ? `?${qs}` : "");
};

export const getUnreadCount = () => notificationsFetch("/unread-count");
export const syncNotifications = () => notificationsFetch("/sync", { method: "POST" });
export const markAsRead = (id) => notificationsFetch(`/${id}/read`, { method: "PUT" });
export const markAllAsRead = () => notificationsFetch("/read-all", { method: "POST" });
export const deleteNotification = (id) => notificationsFetch(`/${id}`, { method: "DELETE" });

