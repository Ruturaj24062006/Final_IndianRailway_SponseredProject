import React from "react";
import { Download, Activity } from "lucide-react";

export default function CommonPmePosition({
  users = [],
  roleFilter = null, // Filter for specific role if needed
  stationFilter = null, // Filter for specific station if needed
  onScheduleCounselling = () => {},
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

  const fit = filteredUsers.filter(u => u.pmeStatus === "Fit");
  const due = filteredUsers.filter(u => u.pmeStatus === "Due" || u.pmeStatus === "Pending");
  const overdue = filteredUsers.filter(u => u.pmeStatus === "Overdue" || u.pmeStatus === "Unfit");

  return (
    <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
      <div className="ti2-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Periodic Medical Examination (PME) Position
            </h2>
            <p className="ti2-subtitle" style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
              Track periodic medical exam clearances, overdue alerts, and compliance targets.
            </p>
          </div>
          <button 
            type="button" 
            className="sdom-btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px" }}
            onClick={() => exportAlert("PDF", "PME_Compliance_Report")}
          >
            <Download size={14} /> PME Report
          </button>
        </div>

        <div className="ti2-myassess-summary" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="ti2-report-mini" style={{ borderLeft: "4px solid #16a34a", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>PME FIT Clearance</div>
            <strong style={{ display: "block", fontSize: "20px", color: "#16a34a", marginTop: "4px" }}>{fit.length} staff</strong>
          </div>
          <div className="ti2-report-mini" style={{ borderLeft: "4px solid #d97706", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>PME Due / Pending</div>
            <strong style={{ display: "block", fontSize: "20px", color: "#d97706", marginTop: "4px" }}>{due.length} staff</strong>
          </div>
          <div className="ti2-report-mini" style={{ borderLeft: "4px solid #dc2626", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>PME Overdue (High Risk)</div>
            <strong style={{ display: "block", fontSize: "20px", color: "#dc2626", marginTop: "4px" }}>{overdue.length} alerts</strong>
          </div>
        </div>

        <div className="ti2-profile-sec-title" style={{ fontSize: "14px", fontWeight: "800", color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
          CRITICAL PME OVERDUE ALERTS ({overdue.length})
        </div>

        <div className="ti2-table-wrap" style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fee2e2", color: "#991b1b", borderBottom: "1.5px solid #fecdd3" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Staff Name</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>HRMS ID</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Designation</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Assigned Station</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>PME Status</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {overdue.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No active PME overdue alerts.</td>
                </tr>
              ) : (
                overdue.map(u => (
                  <tr key={u.id || u.hrmsId} style={{ borderBottom: "1px solid #fecdd3" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>{u.name}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "13px" }}>{u.id || u.hrmsId}</td>
                    <td style={{ padding: "12px 14px" }}>{u.designation}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "700" }}>{u.station || u.stationName}</td>
                    <td style={{ padding: "12px 14px", color: "#dc2626", fontWeight: "800" }}>{u.pmeStatus}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button 
                        type="button"
                        className="sdom-btn-danger" 
                        style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "6px", cursor: "pointer", background: "#dc2626", color: "#fff", border: "none", fontWeight: "700" }} 
                        onClick={() => onScheduleCounselling(u)}
                      >
                        Schedule Counselling
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
