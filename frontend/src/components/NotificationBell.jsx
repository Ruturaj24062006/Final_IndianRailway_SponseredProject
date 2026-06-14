import React, { useState, useEffect, useRef } from "react";
import { Bell, Trash2, CheckCircle, RefreshCw, AlertTriangle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  syncNotifications 
} from "../services/adminService";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const dropdownRef = useRef(null);

  // Fetch count and list
  const loadNotifications = async () => {
    try {
      const countRes = await getUnreadCount();
      setUnreadCount(countRes.data?.unread_count || 0);

      const listRes = await getNotifications({ is_read: "false" });
      // If we don't have enough unread, fetch read ones to show up to 5 alerts
      let alerts = listRes.data || [];
      if (alerts.length < 5) {
        const allRes = await getNotifications();
        alerts = allRes.data || [];
      }
      setNotifications(alerts.slice(0, 5));
    } catch (err) {
      console.error("Failed to load notifications:", err.message);
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark read:", err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all read:", err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err.message);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage("Syncing compliance...");
    try {
      const syncRes = await syncNotifications();
      setSyncMessage(syncRes.message || "Sync complete!");
      await loadNotifications();
      setTimeout(() => setSyncMessage(""), 4000);
    } catch (err) {
      setSyncMessage("Sync failed.");
      console.error("Failed to sync compliance notifications:", err.message);
      setTimeout(() => setSyncMessage(""), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Get style properties for different categories
  const getCategoryStyles = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("expired") || cat.includes("failed") || cat.includes("risk")) {
      return {
        color: "#dc2626", // red
        bg: "#fee2e2",
        icon: AlertCircle
      };
    }
    if (cat.includes("due") || cat.includes("category d")) {
      return {
        color: "#ea580c", // orange
        bg: "#ffedd5",
        icon: AlertTriangle
      };
    }
    if (cat.includes("pending") || cat.includes("approval")) {
      return {
        color: "#2563eb", // blue
        bg: "#dbeafe",
        icon: Info
      };
    }
    return {
      color: "#16a34a", // green
      bg: "#dcfce7",
      icon: CheckCircle
    };
  };

  return (
    <div ref={dropdownRef} className="sdom-notification-bell-container" style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "#e2edf8",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          borderRadius: "50%",
          transition: "background 0.2s",
          outline: "none"
        }}
        className="sdom-bell-btn-hover"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span 
            style={{ 
              position: "absolute", 
              top: "2px", 
              right: "2px", 
              minWidth: "16px", 
              height: "16px", 
              borderRadius: "50%", 
              background: "#ef4444", 
              color: "#ffffff", 
              fontSize: "9px", 
              fontWeight: "900", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 0 0 2px #0d2c4d",
              padding: "0 4px"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="sdom-notifications-panel"
          style={{ 
            position: "absolute", 
            top: "45px", 
            right: 0, 
            background: "#ffffff", 
            border: "1px solid #e2edf8", 
            borderRadius: "14px", 
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)", 
            zIndex: 1000, 
            width: "360px",
            overflow: "hidden", 
            color: "#0f172a",
            fontFamily: "'Inter', system-ui, sans-serif",
            animation: "sdomFadeIn 0.15s ease-out"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f8fafc", borderBottom: "1px solid #e2edf8" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>Operations Alerts</h4>
              {syncMessage && (
                <span style={{ fontSize: "11px", color: isSyncing ? "#2563eb" : "#16a34a", fontWeight: "600" }}>
                  {syncMessage}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                title="Refresh compliance metrics"
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "4px",
                  transition: "background 0.2s"
                }}
              >
                <RefreshCw size={14} className={isSyncing ? "sdom-spin" : ""} style={{ transition: "transform 0.5s" }} />
              </button>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead} 
                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "11px", cursor: "pointer", padding: 0 }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {notifications.map(n => {
              const styles = getCategoryStyles(n.category);
              const CatIcon = styles.icon;
              return (
                <div 
                  key={n.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: "12px", 
                    padding: "14px 18px", 
                    borderBottom: "1px solid #f1f5f9", 
                    background: n.is_read ? "#ffffff" : "#f0f6ff",
                    transition: "background 0.2s",
                    position: "relative"
                  }}
                >
                  {/* Category Circle Badge */}
                  <div 
                    style={{ 
                      width: "28px", 
                      height: "28px", 
                      borderRadius: "50%", 
                      background: styles.bg, 
                      color: styles.color,
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px"
                    }}
                  >
                    <CatIcon size={14} />
                  </div>

                  {/* Text Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: styles.color }}>
                        {n.category || "Alert"}
                      </span>
                      <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 4px 0", fontSize: "12px", lineHeight: "1.4", fontWeight: n.is_read ? "500" : "700", color: "#1e293b", wordBreak: "break-word" }}>
                      {n.message}
                    </p>
                  </div>

                  {/* Quick Action Overlay (Right Side) */}
                  <div style={{ display: "flex", gap: "6px", alignSelf: "center", flexShrink: 0, marginLeft: "4px" }}>
                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        title="Mark as read"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px"
                        }}
                        className="sdom-action-btn-hover"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      title="Delete alert"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px"
                      }}
                      className="sdom-action-delete-hover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b" }}>
                <Bell size={24} style={{ margin: "0 auto 8px", color: "#94a3b8", display: "block" }} />
                <p style={{ margin: 0, fontSize: "12px", fontWeight: "600" }}>No alerts in your inbox</p>
              </div>
            )}
          </div>


        </div>
      )}

      {/* Basic Keyframe CSS injected dynamically */}
      <style>{`
        @keyframes sdomFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sdom-bell-btn-hover:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .sdom-action-btn-hover:hover {
          color: #2563eb !important;
          background: #eff6ff !important;
        }
        .sdom-action-delete-hover:hover {
          color: #dc2626 !important;
          background: #fee2e2 !important;
        }
        .sdom-spin {
          animation: sdom-spin-anim 1s linear infinite;
        }
        @keyframes sdom-spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
