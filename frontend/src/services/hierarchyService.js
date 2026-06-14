import { getToken } from "../utils/auth";

const API_ROOT = "http://127.0.0.1:5000/api/hierarchy";

async function hierarchyFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token. Please log in again.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const localBase = `${API_ROOT}${path}`;
  const relativeBase = `/api/hierarchy${path}`;

  let response;
  try {
    response = await fetch(localBase, { ...options, headers });
  } catch {
    response = await fetch(relativeBase, { ...options, headers });
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export const getHierarchyTree = () => 
  hierarchyFetch("/tree").then(d => d.data);

export const getSubordinates = () => 
  hierarchyFetch("/subordinates").then(d => d.data);

export const assignSupervisor = (employee_id, reporting_to) => 
  hierarchyFetch("/assign", {
    method: "POST",
    body: JSON.stringify({ employee_id, reporting_to })
  });
