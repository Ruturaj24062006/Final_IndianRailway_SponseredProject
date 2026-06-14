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

  // Fallback to relative proxy path
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

/**
 * Fetch detailed profile of the logged-in employee (PME, REF, supervisor details, etc.)
 */
export async function getEmployeeProfile() {
  return authenticatedFetch("/employees/profile");
}

export async function getEmployeeHistory(employeeId) {
  const query = employeeId ? `?employee_id=${employeeId}` : "";
  return authenticatedFetch(`/employees/history${query}`);
}

/**
 * Fetch audit logs of the logged-in employee
 */
export async function getEmployeeAuditLogs() {
  return authenticatedFetch("/employees/audit-logs");
}

/**
 * Fetch safety reports submitted by the logged-in employee
 */
export async function getSafetyReports() {
  return authenticatedFetch("/employees/safety-reports");
}

/**
 * Submit a new safety report
 */
export async function createSafetyReport(data) {
  return authenticatedFetch("/employees/safety-reports", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
