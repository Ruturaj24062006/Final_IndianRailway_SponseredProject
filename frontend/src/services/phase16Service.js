import { getToken } from "../utils/auth";

const API_ROOT = "http://127.0.0.1:5000/api";

import { saveCache, getCache, enqueueRequest } from "../utils/offlineQueue";

async function phase16Fetch(namespace, path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token. Please log in again.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const localBase = `${API_ROOT}/${namespace}`;
  const relativeBase = `/api/${namespace}`;
  const fullPathKey = `/${namespace}${path}`;
  const method = options.method || "GET";

  if (method === "GET") {
    try {
      let response;
      try {
        response = await fetch(`${localBase}${path}`, { ...options, headers });
      } catch {
        response = await fetch(`${relativeBase}${path}`, { ...options, headers });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await saveCache(fullPathKey, data);
          return data;
        }
      }
    } catch (err) {
      console.warn(`Fetch to ${fullPathKey} failed, attempting cache fallback...`, err);
    }

    const cached = await getCache(fullPathKey);
    if (cached) {
      console.log(`Using cached data for ${fullPathKey} (Offline)`);
      return cached;
    }
    throw new Error("Offline: No cached data available for this request.");
  } else {
    // POST, PUT, DELETE
    if (typeof window !== "undefined" && !navigator.onLine) {
      const body = options.body ? JSON.parse(options.body) : {};
      const url = `${localBase}${path}`;
      await enqueueRequest(url, method, body, {}, namespace);
      return { success: true, queued: true, data: { success: true, queued: true, message: "Offline: Request queued for automatic sync." } };
    }

    let response;
    try {
      response = await fetch(`${localBase}${path}`, { ...options, headers });
    } catch {
      response = await fetch(`${relativeBase}${path}`, { ...options, headers });
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  }
}

// ── Counselling APIs ─────────────────────────────────────────────────────────
export const getCounsellingRecords = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "All") params.append(k, v);
  });
  const qs = params.toString();
  return phase16Fetch("counselling", `${qs ? "?" + qs : ""}`).then(d => d.data);
};

export const getEmployeeCounselling = (employee_id) =>
  phase16Fetch("counselling", `/employee/${employee_id}`).then(d => d.data);

export const logCounselling = (payload) =>
  phase16Fetch("counselling", "/", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(d => d.data);

export const updateCounselling = (id, payload) =>
  phase16Fetch("counselling", `/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(d => d.data);

// ── Document Dossier APIs ───────────────────────────────────────────────────
export const getEmployeeDocuments = (employee_id) =>
  phase16Fetch("documents", `/${employee_id}`).then(d => d.data);

export const uploadDocument = (payload) =>
  phase16Fetch("documents", "/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(d => d.data);

export const deleteDocument = (id) =>
  phase16Fetch("documents", `/${id}`, {
    method: "DELETE",
  });

// ── Bulk Import APIs ──────────────────────────────────────────────────────────
export const getImportPreview = () =>
  phase16Fetch("admin/import", "/preview");

export const executeImport = () =>
  phase16Fetch("admin/import", "/execute", {
    method: "POST",
  });
