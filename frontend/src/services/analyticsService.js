import { getToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:5000/api";

/**
 * Helper to perform fetch requests with JWT token and relative proxy fallback.
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("No authorization token found. Please login again.");
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {})
  };

  const directUrl = `${API_BASE_URL}${endpoint}`;
  const proxyUrl = `/api${endpoint}`;

  // Try direct localhost:5000 call first
  try {
    const response = await fetch(directUrl, { ...options, headers });
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error (Status: ${response.status})`);
    }
  } catch (err) {
    if (err.message && err.message.includes("API Error")) {
      throw err;
    }
    console.warn(`Direct connection to ${directUrl} failed, trying relative proxy ${proxyUrl}...`, err);
  }

  // Fallback to relative proxy path
  const response = await fetch(proxyUrl, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error (Status: ${response.status})`);
  }

  return response.json();
}

/**
 * Helper to construct query strings for filtering
 */
function buildQueryString(filters = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "All" && filters[key] !== "") {
      params.append(key, filters[key]);
    }
  });
  const str = params.toString();
  return str ? `?${str}` : "";
}

/**
 * Fetch high-level executive statistics
 */
export async function getExecutiveSummary(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/analytics/executive-summary${query}`, { method: "GET" });
  return res.data;
}

/**
 * Fetch detailed compliance rates grouped by role
 */
export async function getComplianceBreakdown(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/analytics/compliance-breakdown${query}`, { method: "GET" });
  return res.data;
}

/**
 * Fetch station-level safety heatmap matrix data
 */
export async function getStationHeatmap() {
  const res = await apiRequest("/analytics/station-heatmap", { method: "GET" });
  return res.data;
}

/**
 * Fetch expiring credentials forecasts and historical trends
 */
export async function getTrendsForecast(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/analytics/trends-forecast${query}`, { method: "GET" });
  return res.data;
}

/**
 * Fetch paginated safety-critical employees ordered by risk score descending
 */
export async function getTopRiskEmployees(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/analytics/top-risk-employees${query}`, { method: "GET" });
  return res; // Return full response to get pagination data
}

/**
 * Fetch live system safety console audit logs
 */
export async function getLiveConsole() {
  const res = await apiRequest("/analytics/live-console", { method: "GET" });
  return res.data;
}
