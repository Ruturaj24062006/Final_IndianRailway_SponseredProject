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

  // Try localhost direct connection first
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed (Status: ${response.status})`);
    }
  } catch (err) {
    console.warn(`Direct connection to http://localhost:5000${path} failed, trying relative proxy...`, err);
  }

  // Fallback to relative proxy route
  const response = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed (Status: ${response.status})`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to retrieve API data.");
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
  const str = params.toString();
  return str ? `?${str}` : "";
}

/**
 * Fetch top-level dashboard overview metrics for AOM console
 * @param {object} filters - { station_id, risk_level }
 */
export async function getAomDashboard(filters) {
  return authenticatedFetch(`/aom/dashboard${buildQueryString(filters)}`);
}

/**
 * Fetch station-wise aggregates and performance lists for the division
 */
export async function getAomStationSummary() {
  return authenticatedFetch("/aom/station-summary");
}

/**
 * Fetch detailed medical and refresher compliance summaries for rostered staff
 * @param {object} filters - { station_id, risk_level }
 */
export async function getAomComplianceSummary(filters) {
  return authenticatedFetch(`/aom/compliance-summary${buildQueryString(filters)}`);
}

/**
 * Fetch employee-level results, grades, and monthly division score trends
 * @param {object} filters - { station_id, risk_level }
 */
export async function getAomPerformanceSummary(filters) {
  return authenticatedFetch(`/aom/performance-summary${buildQueryString(filters)}`);
}

/**
 * Predictive & Decision Support APIs (Phase 18)
 */
export async function getPredictiveDashboard() {
  return authenticatedFetch("/reports/predictive-dashboard");
}

export async function getStationRiskRanking() {
  return authenticatedFetch("/reports/station-risk-ranking");
}

export async function getEmployeeRiskLedger(search = "", stationId = "", riskLevel = "") {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (stationId && stationId !== "All") params.append("station_id", stationId);
  if (riskLevel && riskLevel !== "All") params.append("risk_level", riskLevel);
  const str = params.toString();
  return authenticatedFetch(`/reports/employee-risk-ledger${str ? "?" + str : ""}`);
}

export async function getAlertRecommendations() {
  return authenticatedFetch("/reports/alert-recommendations");
}

export async function syncRiskLevels() {
  return authenticatedFetch("/reports/sync-risk-levels", { method: "POST" });
}
