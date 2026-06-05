import React, { useEffect, useState } from "react";
import { LogOut, Bell, Menu, X, CheckCircle2 } from "lucide-react";

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
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

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
              setBellDropdownOpen(false);
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
            setBellDropdownOpen(false);
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
              {brandTitle}
            </h1>
            <p className="sdom-topbar-sub" style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              {brandSubtitle}
            </p>
          </div>
        </div>

        {/* Topbar Right Section (User details, Notifications, Logout) */}
        <div className="sm2-user-strip ti2-user-strip sdom-topbar-right topbar-right">
          
          {/* Notification Bell Dropdown */}
          <div style={{ position: "relative", marginRight: "12px" }}>
            <button
              onClick={() => {
                setBellDropdownOpen(open => !open);
                setSidebarOpen(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#e2edf8",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: "6px"
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span 
                  style={{ 
                    position: "absolute", 
                    top: "-2px", 
                    right: "-2px", 
                    width: "16px", 
                    height: "16px", 
                    borderRadius: "50%", 
                    background: "#dc2626", 
                    color: "#ffffff", 
                    fontSize: "9px", 
                    fontWeight: "900", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {bellDropdownOpen && (
              <div 
                className="sdom-notifications-panel"
                style={{ 
                  position: "absolute", 
                  top: "40px", 
                  right: 0, 
                  background: "#ffffff", 
                  border: "1px solid #cbd5e1", 
                  borderRadius: "14px", 
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)", 
                  zIndex: 1000, 
                  overflow: "hidden", 
                  color: "#0f172a" 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2edf8" }}>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800" }}>Operations Alerts</h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsRead} 
                      style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "flex-start", 
                        gap: "10px", 
                        padding: "12px 16px", 
                        borderBottom: "1px solid #f1f5f9", 
                        background: n.read ? "#fff" : "#f0f6ff" 
                      }}
                    >
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.type === "danger" ? "#dc2626" : n.type === "warning" ? "#ea580c" : "#16a34a", marginTop: "4px", flexShrink: 0 }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", lineHeight: "1.4", fontWeight: n.read ? "500" : "800", color: "#1e293b" }}>{n.message}</p>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>{n.time}</span>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p style={{ margin: 0, padding: "20px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                      No alerts in your inbox.
                    </p>
                  )}
                </div>
              </div>
            )}
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
            <LogOut size={15} /> Logout
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
            Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`sm2-nav-item ti2-nav-item sdom-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                  setBellDropdownOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
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
