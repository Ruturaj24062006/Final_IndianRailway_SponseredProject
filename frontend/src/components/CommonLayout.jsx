import React, { useEffect, useState } from "react";
import { LogOut, Menu, X, CheckCircle2 } from "lucide-react";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import { getWorkflowStats, getMyRecommendations } from "../services/workflowService";
import { getQueue } from "../utils/offlineQueue";
import { useLanguage } from "../utils/LanguageContext";

/**
 * CommonLayout - A unified dashboard layout wrapper for the Indian Railway Evaluation System.
 * This component centralizes the common header (topbar), sidebar, and main page structure
 * for all role modules (Station Master, Traffic Inspector, Train Manager, Pointsman, etc.).
 * 
 * Centralizing this layout in a single file makes future backend migrations, routing setup,
 * and database connection integrations much easier.
 * 
 * @param {Object} props
 * @param {Object} props.user - Current logged-in user details: { name, hrmsId, role }
 * @param {Array} props.navItems - Sidebar navigation links: [{ key, label, icon: ReactComponent }]
 * @param {string} props.activeTab - Currently active sidebar tab key
 * @param {Function} props.setActiveTab - Callback when sidebar tab is changed
 * @param {Function} props.onLogout - Callback to handle user logout
 * @param {string} props.statusMsg - Notification banner message
 * @param {Function} props.setStatusMsg - Callback to dismiss the notification banner
 * @param {string} props.brandTitle - Main title (e.g. "Indian Railway Evaluation System")
 * @param {string} props.brandSubtitle - Subtitle (e.g. "Station Master Module")
 * @param {Array} props.notifications - Optional array of notifications for the bell dropdown
 * @param {Function} props.markAllNotificationsRead - Optional callback to clear notifications
 * @param {Function} props.onViewAll - Callback to open all alerts in the notifications hub
 * @param {React.ReactNode} props.children - Active workspace screen content
 */
export default function CommonLayout({
  user = { name: "Guest User", hrmsId: "GST_1001", role: "Visitor" },
  navItems = [],
  activeTab = "",
  setActiveTab = () => {},
  onLogout = () => {},
  statusMsg = "",
  setStatusMsg = () => {},
  brandTitle = "Indian Railway Evaluation System",
  brandSubtitle = "Operations Command Workspace",
  notifications = [],
  markAllNotificationsRead = () => {},
  children
}) {
  const { locale, changeLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [workflowBadgeCount, setWorkflowBadgeCount] = useState(0);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [queueCount, setQueueCount] = useState(0);

  // Connection and offline queue listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    async function updateQueueCount() {
      try {
        const list = await getQueue();
        setQueueCount(list.length);
      } catch (err) {
        console.warn("IndexedDB not ready for count check:", err);
      }
    }
    updateQueueCount();

    window.addEventListener("offline-queue-changed", updateQueueCount);
    window.addEventListener("online", updateQueueCount);
    return () => {
      window.removeEventListener("offline-queue-changed", updateQueueCount);
      window.removeEventListener("online", updateQueueCount);
    };
  }, []);

  // Fetch workflow stats periodically to update sidebar badge
  useEffect(() => {
    if (!user || user.hrmsId === "GST_1001" || user.role === "Visitor") return;
    
    async function fetchStats() {
      try {
        if (user.role === "Pointsman") {
          const res = await getMyRecommendations({ status: "Pending", limit: 100 });
          setWorkflowBadgeCount(res.data?.length || 0);
        } else {
          const res = await getWorkflowStats();
          const openEsc = parseInt(res?.escalations?.open_count || 0, 10);
          const pendingRec = parseInt(res?.recommendations?.pending_count || 0, 10);
          setWorkflowBadgeCount(openEsc + pendingRec);
        }
      } catch (err) {
        console.warn("Failed to fetch workflow stats for layout badge:", err);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="sm2-layout ti2-layout sdom-app-layout">
      {/* Sidebar Close Backdrop (for mobile screens) */}
      {sidebarOpen && (
        <div 
          className="sdom-sidebar-close-backdrop"
            onClick={() => {
              setSidebarOpen(false);
            }}
        />
      )}

      {/* ─── Topbar Header ─── */}
      <header className="sm2-topbar ti2-topbar sdom-topbar-fixed topbar">
        {/* Toggle Button for Sidebar (Mobile view) */}
        <button 
          className="sdom-sidebar-toggle-btn"
          aria-controls="sdom-main-sidebar"
          aria-expanded={sidebarOpen}
          onClick={() => {
            setSidebarOpen(open => !open);
          }}
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand Group */}
        <div className="sm2-topbar-brand ti2-topbar-brand sdom-topbar-brand brand-group">
          <div 
            className="sm2-topbar-logo ti2-topbar-logo sdom-topbar-logo brand-mark" 
            style={{ 
              background: "#1E3A5F", 
              color: "#ffffff", 
              fontWeight: "800", 
              fontSize: "0.95rem",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            IR
          </div>
          <div>
            <h1 className="sdom-topbar-title" style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
              {t("layout.brandTitle") || brandTitle}
            </h1>
            <p className="sdom-topbar-sub" style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              {t("layout.brandSubtitle") || brandSubtitle}
            </p>
          </div>
        </div>

        {/* Topbar Right Section (User details, Notifications, Logout) */}
        <div className="sm2-user-strip ti2-user-strip sdom-topbar-right topbar-right">
          
          {/* Online/Offline Connection Sync Badge */}
          <div style={{ marginRight: "16px", display: "flex", alignItems: "center" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "12px",
              border: isOnline ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
              background: isOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: isOnline ? "#10b981" : "#ef4444"
            }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isOnline ? "#10b981" : "#ef4444",
                display: "inline-block"
              }}></span>
              {isOnline ? t("layout.online") : t("layout.offline")}
              {queueCount > 0 && (
                <span style={{
                  marginLeft: "4px",
                  background: "#ea580c",
                  color: "#fff",
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "8px",
                  fontWeight: "800"
                }}>
                  {queueCount} {t("layout.pendingSync")}
                </span>
              )}
            </span>
          </div>

          {/* Live Notification Bell */}
          <div style={{ marginRight: "12px" }}>
            <NotificationBell />
          </div>

          {/* Language Selector Component */}
          <div style={{ marginRight: "12px", display: "flex", alignItems: "center" }}>
            <LanguageSwitcher />
          </div>

          {/* User Details */}
          <div className="sm2-user-avatar ti2-user-avatar sdom-topbar-avatar" style={{ marginRight: "8px" }}>
            {user.name.charAt(0)}
          </div>
          <div className="sdom-topbar-user-details" style={{ marginRight: "12px" }}>
            <strong style={{ fontSize: "13px", color: "#fff", fontWeight: "700" }}>{user.name}</strong>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{user.hrmsId}</span>
          </div>

          {/* Logout Button */}
          <button className="sm2-logout-btn ti2-logout-btn sdom-logout-btn logout-btn" onClick={onLogout}>
            <LogOut size={15} /> {t("layout.logout")}
          </button>
        </div>
      </header>

      <div className="sm2-shell ti2-shell sdom-body-layout layout-grid">
        
        {/* Sidebar Panel */}
        <aside 
          id="sdom-main-sidebar"
          className={`sm2-sidebar ti2-sidebar sdom-sidebar-fixed sidebar ${sidebarOpen ? "open" : ""}`}
          style={isMobileLayout ? {
            position: "fixed",
            top: "60px",
            left: 0,
            height: "calc(100dvh - 60px)",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-102%)",
            zIndex: 101,
            boxShadow: "18px 0 40px rgba(15, 23, 42, 0.22)"
          } : undefined}
        >
          <div className="sdom-sidebar-section-label" style={{ fontSize: "0.65rem", fontWeight: "700", color: "#486581", textTransform: "uppercase", padding: "14px 20px 8px" }}>
            {t("layout.navigation")}
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            const transKey = `sidebar.${item.key}`;
            const labelText = t(transKey) !== transKey ? t(transKey) : item.label;
            return (
              <button
                key={item.key}
                className={`sm2-nav-item ti2-nav-item sdom-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{labelText}</span>
                {item.key === "workflow" && workflowBadgeCount > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    lineHeight: 1
                  }}>
                    {workflowBadgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content Pane */}
        <main className="sm2-main ti2-main sdom-content-scrollable">
          {/* Real-time Status Alert Banner */}
          {statusMsg && (
            <div className="sm2-status-banner ti2-status-banner" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", marginBottom: "16px" }}>
              <CheckCircle2 size={14} /> 
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{statusMsg}</span>
              <button 
                className="sm2-dismiss ti2-dismiss" 
                onClick={() => setStatusMsg("")}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "inherit" }}
              >
                ×
              </button>
            </div>
          )}

          {/* Active Workspace Screen Rendered Here */}
          <div className="sm2-page-wrap ti2-page-wrap">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
