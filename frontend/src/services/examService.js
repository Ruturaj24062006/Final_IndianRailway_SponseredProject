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
 * Fetch question count and active attempt status
 */
export async function getExamStatus() {
  const res = await apiRequest("/exam/status", { method: "GET" });
  return res.data;
}

/**
 * Start/resume exam session
 */
export async function startExam() {
  const res = await apiRequest("/exam/start", { method: "POST" });
  return res.data;
}

/**
 * Save an answer in real-time
 */
export async function submitAnswer(attemptId, questionId, selectedAnswer) {
  return await apiRequest("/exam/submit-answer", {
    method: "POST",
    body: JSON.stringify({
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: selectedAnswer
    })
  });
}

/**
 * Finalize and grade the exam
 */
export async function submitExam(attemptId) {
  const res = await apiRequest("/exam/submit", {
    method: "POST",
    body: JSON.stringify({ attempt_id: attemptId })
  });
  return res.data;
}
