import { getToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:5000/api";

import { saveCache, getCache, enqueueRequest } from "../utils/offlineQueue";

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

  const method = options.method || "GET";

  if (method === "GET") {
    try {
      let response;
      try {
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      } catch {
        response = await fetch(`/api${path}`, { ...options, headers });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await saveCache(path, data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn(`Fetch to ${path} failed, attempting cache fallback...`, err);
    }

    const cached = await getCache(path);
    if (cached) {
      console.log(`Using cached data for ${path} (Offline)`);
      return cached;
    }
    throw new Error("Offline: No cached data available for this request.");
  } else {
    // POST, PUT, DELETE writes
    if (typeof window !== "undefined" && !navigator.onLine) {
      const body = options.body ? JSON.parse(options.body) : {};
      const url = `${API_BASE_URL}${path}`;
      await enqueueRequest(url, method, body, {}, "assessment");
      return { success: true, queued: true, message: "Offline: Submission queued for automatic sync." };
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch {
      response = await fetch(`/api${path}`, { ...options, headers });
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || `API call failed (Status: ${response.status})`);
    }
    return data.data;
  }
}

/**
 * Fetch Station Master dashboard metrics (Total Pointsmen, CBT Pending, PME due, REF due, assessment counts, and station compliance percentage)
 */
export async function getSmDashboard() {
  return authenticatedFetch("/sm/dashboard");
}

/**
 * Fetch Pointsmen list under SM's station with compliance statuses
 */
export async function getSmPointsmen(role) {
  return authenticatedFetch(role ? `/sm/pointsmen?role=${encodeURIComponent(role)}` : "/sm/pointsmen");
}

/**
 * Fetch assessments in 'Pending' status assigned to the logged-in SM
 */
export async function getSmPendingAssessments() {
  return authenticatedFetch("/sm/pending-assessments");
}

/**
 * Fetch all assessments created by this Station Master (Pending, Submitted, Approved, Rejected)
 */
export async function getSmAssessmentHistory() {
  return authenticatedFetch("/sm/assessment-history");
}

/**
 * Fetch compliance overview metrics (compliant counts, percentages, and total roster numbers)
 */
export async function getSmComplianceSummary() {
  return authenticatedFetch("/sm/compliance-summary");
}

/**
 * Create a new assessment request for a Pointsman
 */
export async function createAssessmentRequest(employeeId, assessmentDate) {
  return authenticatedFetch("/assessments/request", {
    method: "POST",
    body: JSON.stringify({
      employee_id: employeeId,
      assessment_date: assessmentDate
    })
  });
}

/**
 * Fetch other Station Masters / shift supervisors working at the same station
 */
export async function getSmShiftMasters() {
  return authenticatedFetch("/sm/shift-masters");
}

/**
 * Register a new Pointsman employee and create their user account automatically
 */
export async function registerPointsman(data) {
  return authenticatedFetch("/sm/register-pointsman", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

/**
 * Update pointsman MCQ exam access state
 */
export async function updateMcqStatus(assessmentId, mcqStatus) {
  return authenticatedFetch(`/assessments/${assessmentId}/mcq-status`, {
    method: "PUT",
    body: JSON.stringify({
      mcq_status: mcqStatus
    })
  });
}

