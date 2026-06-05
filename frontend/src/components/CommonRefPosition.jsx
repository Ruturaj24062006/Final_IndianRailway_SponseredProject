import React from "react";
import { Download, Award } from "lucide-react";

export default function CommonRefPosition({
  users = [],
  roleFilter = null,
  stationFilter = null,
  onClearRef = () => {},
  exportAlert = () => {}
}) {
  // Filter users based on parameters
  const filteredUsers = users.filter(u => {
    const matchesRole = !roleFilter || u.role === roleFilter || 
      (roleFilter === "Pointsman" && u.role === "pointsmen") || 
      (roleFilter === "pointsmen" && u.role === "Pointsman");
    const matchesStation = !stationFilter || u.station === stationFilter || u.stationName === stationFilter;
    return matchesRole && matchesStation;
  });

  const completed = filteredUsers.filter(u => u.refStatus === "Cleared");
  const pending = filteredUsers.filter(u => u.refStatus === "Pending");
  const expired = filteredUsers.filter(u => u.refStatus === "Expired" || u.refStatus === "Failed");

  return (
    <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
      <div className="ti2-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div className="sdom-stack-on-mobile" style={{ marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Refresher Course (REF) Training Position
            </h2>
            <p className="ti2-subtitle" style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
              Monitor safety refresher training compliance ledger for operational staff.
            </p>
          </div>
          <button 
            type="button" 
            className="sdom-btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px" }}
            onClick={() => exportAlert("PDF", "REF_Training_Compliance_Report")}
          >
            <Download size={14} /> REF Report
          </button>
        </div>

        <div className="ti2-myassess-summary sdom-summary-grid" style={{ marginBottom: "24px" }}>
          <div className="ti2-report-mini" style={{ borderLeft: "4px solid #16a34a", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>REF Cleared / Completed</div>
            <strong style={{ display: "block", fontSize: "20px", color: "#16a34a", marginTop: "4px" }}>{completed.length} staff</strong>
          </div>
          <div className="ti2-report-mini" style={{ borderLeft: "4px solid #d97706", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>REF Pending Class</div>
            <strong style={{ display: "block", fontSize: "20px", color: "#d97706", marginTop: "4px" }}>{pending.length} staff</strong>
          </div>
          <div className="ti2-report-mini" style={{ borderLeft: "4px solid #dc2626", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>REF Expired Alerts</div>
            <strong style={{ display: "block", fontSize: "20px", color: "#dc2626", marginTop: "4px" }}>{expired.length} personnel</strong>
          </div>
        </div>

        <div className="ti2-profile-sec-title" style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
          REF Training Alert List
        </div>

        <div className="ti2-table-wrap" style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#334155", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Staff Name</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>HRMS ID</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Designation</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Station Section</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>REF Status</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Action Clearance</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.filter(u => u.refStatus !== "Cleared").length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>All staff REF statuses are Cleared. No alerts.</td>
                </tr>
              ) : (
                filteredUsers.filter(u => u.refStatus !== "Cleared").map(u => (
                  <tr key={u.id || u.hrmsId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>{u.name}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "13px" }}>{u.id || u.hrmsId}</td>
                    <td style={{ padding: "12px 14px" }}>{u.designation}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "700" }}>{u.station || u.stationName}</td>
                    <td style={{ padding: "12px 14px", color: u.refStatus === "Expired" ? "#dc2626" : "#d97706", fontWeight: "800" }}>{u.refStatus}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button 
                        type="button"
                        className="sdom-btn-primary" 
                        style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "6px", cursor: "pointer", background: "#2563eb", color: "#fff", border: "none", fontWeight: "700" }} 
                        onClick={() => onClearRef(u)}
                      >
                        Clear REF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
