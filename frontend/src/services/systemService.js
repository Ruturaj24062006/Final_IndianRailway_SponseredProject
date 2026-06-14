import { getToken } from "../utils/auth";

const API_BASE = "http://127.0.0.1:5000/api";

async function systemFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token. Please log in again.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    response = await fetch(`/api${path}`, { ...options, headers });
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

// ── System Health, Timeline & Audit Logs ──────────────────────────────────────
export const getSystemHealth = () => systemFetch("/system/health");
export const getSystemActivity = () => systemFetch("/system/activity");

export const getAuditLogs = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "All") {
      params.append(k, v);
    }
  });
  const qs = params.toString();
  return systemFetch(`/system/audit-logs${qs ? "?" + qs : ""}`);
};

export const getSecurityEvents = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "All") {
      params.append(k, v);
    }
  });
  const qs = params.toString();
  return systemFetch(`/system/security-events${qs ? "?" + qs : ""}`);
};

// ── PME & Refresher Updates ──────────────────────────────────────────────────
export const updatePme = (payload) => 
  systemFetch("/pme/update", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateRef = (payload) => 
  systemFetch("/ref/update", {
    method: "POST",
    body: JSON.stringify(payload)
  });
