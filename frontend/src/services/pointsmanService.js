/**
 * Pointsman API Service for fetching authenticated dashboard details
 */

import { getToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:5000/api";

/**
 * Fetch Pointsman Dashboard data
 * Calls: GET http://localhost:5000/api/pointsman/dashboard
 * Falls back to Vite proxy /api/pointsman/dashboard on network failure
 * @returns {Promise<object>} Pointsman dashboard data payload
 */
export async function getPointsmanDashboard() {
  const token = getToken();
  if (!token) {
    throw new Error("No authorization token found. Please login again.");
  }

  // Try direct localhost:5000 call first
  try {
    const response = await fetch(`${API_BASE_URL}/pointsman/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch dashboard (Status: ${response.status})`);
    }
  } catch (err) {
    console.warn("Direct connection to http://localhost:5000 failed, trying relative proxy path...", err);
  }

  // Fallback to relative proxy path
  const response = await fetch("/api/pointsman/dashboard", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch dashboard (Status: ${response.status})`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to retrieve dashboard data.");
  }

  return data.data;
}
