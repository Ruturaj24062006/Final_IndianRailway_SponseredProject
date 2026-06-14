const DB_NAME = "ir-safety-db";
const DB_VERSION = 1;

// Initialize Database
export function initDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      console.error("IndexedDB initialization error:", e);
      reject(e);
    };

    request.onsuccess = (e) => {
      resolve(e.target.result);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("cached_data")) {
        db.createObjectStore("cached_data", { keyPath: "key" });
      }
    };
  });
}

// Queue offline write requests
export async function enqueueRequest(url, method, body, headers = {}, category = "general") {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("offline_queue", "readwrite");
    const store = transaction.objectStore("offline_queue");
    
    const request = store.add({
      url,
      method,
      body,
      headers,
      category,
      timestamp: Date.now()
    });

    request.onsuccess = () => {
      // Trigger notification event for layout count update
      window.dispatchEvent(new CustomEvent("offline-queue-changed"));
      resolve(true);
    };
    
    request.onerror = (err) => reject(err);
  });
}

// Get the list of queued offline writes
export async function getQueue() {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("offline_queue", "readonly");
    const store = transaction.objectStore("offline_queue");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (err) => reject(err);
  });
}

// Remove request from queue
export async function dequeueRequest(id) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("offline_queue", "readwrite");
    const store = transaction.objectStore("offline_queue");
    const request = store.delete(id);

    request.onsuccess = () => {
      window.dispatchEvent(new CustomEvent("offline-queue-changed"));
      resolve(true);
    };
    request.onerror = (err) => reject(err);
  });
}

// Cache GET responses (e.g. Pointsmen rosters, assessments directories)
export async function saveCache(key, data) {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("cached_data", "readwrite");
      const store = transaction.objectStore("cached_data");
      const request = store.put({ key, data, cachedAt: Date.now() });

      request.onsuccess = () => resolve(true);
      request.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn("Could not save to IndexedDB cache:", err);
  }
}

// Retrieve cached responses
export async function getCache(key) {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("cached_data", "readonly");
      const store = transaction.objectStore("cached_data");
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn("Could not retrieve from IndexedDB cache:", err);
    return null;
  }
}

// Sync all queued requests to the backend server
export async function syncOfflineQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return;

  const token = localStorage.getItem("token");
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          ...item.headers
        },
        body: JSON.stringify(item.body)
      });

      if (response.ok || response.status === 400 || response.status === 409) {
        // If successful or rejected due to client error validation, dequeue it (prevents infinite loop retrying bad data)
        await dequeueRequest(item.id);
        console.log(`Synced offline item ${item.id} successfully:`, item.url);
      }
    } catch (err) {
      console.warn(`Failed to sync offline item ${item.id}, will retry when network is available:`, err);
      break; // Pause syncing to keep sequence if server is temporarily down
    }
  }
}

// Listen for reconnection to trigger sync automatically
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Network connection restored. Syncing offline data queue...");
    syncOfflineQueue();
  });
}
