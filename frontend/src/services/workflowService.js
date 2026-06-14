import { getToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:5000/api";

/**
 * Helper to perform fetch requests with JWT token and relative proxy fallback.
 */
import { saveCache, getCache, enqueueRequest } from "../utils/offlineQueue";

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
  const method = options.method || "GET";

  if (method === "GET") {
    try {
      let response;
      try {
        response = await fetch(directUrl, { ...options, headers });
      } catch {
        response = await fetch(proxyUrl, { ...options, headers });
      }

      if (response.ok) {
        const data = await response.json();
        await saveCache(endpoint, data);
        return data;
      }
    } catch (err) {
      console.warn(`Fetch to ${endpoint} failed, attempting cache fallback...`, err);
    }

    const cached = await getCache(endpoint);
    if (cached) {
      console.log(`Using cached data for ${endpoint} (Offline)`);
      return cached;
    }
    throw new Error("Offline: No cached data available for this request.");
  } else {
    // POST, PUT, DELETE writes
    if (typeof window !== "undefined" && !navigator.onLine) {
      const body = options.body ? JSON.parse(options.body) : {};
      await enqueueRequest(directUrl, method, body, {}, "workflow");
      return { success: true, queued: true, data: { success: true, queued: true, message: "Offline: Workflow request queued for automatic sync." } };
    }

    let response;
    try {
      response = await fetch(directUrl, { ...options, headers });
    } catch {
      response = await fetch(proxyUrl, { ...options, headers });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error (Status: ${response.status})`);
    }

    return response.json();
  }
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
 * Fetch top-level dashboard metrics (counts, breakdown, recent, engine state)
 */
export async function getWorkflowDashboard() {
  const res = await apiRequest("/workflow/dashboard", { method: "GET" });
  return res.data;
}

/**
 * Fetch aggregated counts of open escalations/recommendations
 */
export async function getWorkflowStats() {
  const res = await apiRequest("/workflow/stats", { method: "GET" });
  return res.data;
}

/**
 * Fetch escalations with server-side filters & pagination
 */
export async function getEscalations(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/workflow/escalations${query}`, { method: "GET" });
  return res; // Return full response object to get pagination data
}

/**
 * Fetch single escalation details
 */
export async function getEscalation(id) {
  const res = await apiRequest(`/workflow/escalations/${id}`, { method: "GET" });
  return res.data;
}

/**
 * Acknowledge or Resolve an escalation
 */
export async function updateEscalation(id, data) {
  const res = await apiRequest(`/workflow/escalations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Fetch recommendations with server-side filters & pagination
 */
export async function getRecommendations(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/workflow/recommendations${query}`, { method: "GET" });
  return res;
}

/**
 * Fetch Pointsman own recommendations (optimized endpoint)
 */
export async function getMyRecommendations(filters) {
  const query = buildQueryString(filters);
  const res = await apiRequest(`/workflow/my-recommendations${query}`, { method: "GET" });
  return res;
}

/**
 * Fetch single recommendation details
 */
export async function getRecommendation(id) {
  const res = await apiRequest(`/workflow/recommendations/${id}`, { method: "GET" });
  return res.data;
}

/**
 * Update recommendation status (In Progress, Completed)
 */
export async function updateRecommendation(id, data) {
  const res = await apiRequest(`/workflow/recommendations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Manually create a recommendation (AOM, Admin, TI only)
 */
export async function createRecommendation(data) {
  const res = await apiRequest("/workflow/recommendations", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Manually trigger the workflow engine scan
 */
export async function triggerEngine() {
  const res = await apiRequest("/workflow/engine/trigger", { method: "POST" });
  return res;
}

/**
 * Get engine state (isRunning, lastRunAt, runHistory)
 */
export async function getEngineStatus() {
  const res = await apiRequest("/workflow/engine/status", { method: "GET" });
  return res.data;
}
