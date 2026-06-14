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
 * Send general chat message to AI copilot
 */
export async function sendChat(message) {
  return await apiRequest("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

/**
 * Send natural language query (NLQ) to database query classifier
 */
export async function sendQuery(queryText) {
  return await apiRequest("/ai/query", {
    method: "POST",
    body: JSON.stringify({ query: queryText })
  });
}

/**
 * Request diagnostic safety explanation of risk factors for an employee
 */
export async function getRiskExplanation(hrmsId) {
  return await apiRequest("/ai/explain-risk", {
    method: "POST",
    body: JSON.stringify({ hrms_id: hrmsId })
  });
}

/**
 * Generate safety gap audit report and roadmap for an incident
 */
export async function getInvestigationReport(hrmsId, incidentDetails) {
  return await apiRequest("/ai/investigate", {
    method: "POST",
    body: JSON.stringify({ hrms_id: hrmsId, incident_details: incidentDetails })
  });
}

/**
 * Retrieve Nagpur division safety executive summary narrative
 */
export async function getAiExecutiveSummary() {
  return await apiRequest("/ai/executive-summary", {
    method: "GET"
  });
}
