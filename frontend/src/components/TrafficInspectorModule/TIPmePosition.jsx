import { useState } from "react";
import { Search, Activity, Calendar, Download } from "lucide-react";

export default function TIPmePosition({
  users,
  setUsers,
  stations,
  getCat,
  getUserRisk,
  riskBadge,
  catBadge,
  statusBadge,
  addAuditLog,
  exportAlert,
  triggerNotification,
  setGoToCounselling
}) {
  const due = users.filter(u => u.pmeStatus === "Due" || u.pmeStatus === "Pending");
    const fit = users.filter(u => u.pmeStatus === "Fit");
    const overdue = users.filter(u => u.pmeStatus === "Overdue" || u.pmeStatus === "Unfit");

    return (
      <div className="ti2-page-body animate-fade-in">
        <div className="ti2-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2>Periodic Medical Examination (PME) Position</h2>
              <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Track periodic medical exam clearances, overdue alerts, and compliance targets.</p>
            </div>
            <button className="ti2-view-profile-btn" onClick={() => exportAlert("PDF", "Section_PME_Compliance_Report")}>
              <Download size={13} /> PME Report
            </button>
          </div>

          <div className="ti2-myassess-summary" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #16a34a" }}><label>PME FIT Clearance</label><strong style={{ color: "#16a34a" }}>{fit.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #d97706" }}><label>PME Due / Pending</label><strong style={{ color: "#d97706" }}>{due.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #dc2626" }}><label>PME Overdue (High Risk)</label><strong style={{ color: "#dc2626" }}>{overdue.length} alerts</strong></div>
          </div>

          <div className="ti2-profile-sec-title" style={{ color: "#dc2626" }}>CRITICAL PME OVERDUE ALERTS ({overdue.length})</div>
          <div className="ti2-table-wrap">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "10px 14px", background: "#fee2e2", color: "#991b1b", fontWeight: "700", fontSize: "11px" }}>
              <span>Staff Name</span>
              <span>HRMS ID</span>
              <span>Designation</span>
              <span>Assigned Station</span>
              <span>PME Status</span>
              <span>Action Taken</span>
            </div>
            {overdue.map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "12px 14px", borderBottom: "1px solid #fecdd3", fontSize: "13px", alignItems: "center" }}>
                <strong>{u.name}</strong>
                <span style={{ fontFamily: "monospace" }}>{u.id}</span>
                <span>{u.designation}</span>
                <strong>{u.station}</strong>
                <span style={{ color: "#dc2626", fontWeight: "800" }}>{u.pmeStatus}</span>
                <span><button className="ti2-danger-btn" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => { triggerNotification("warning", `Counselling scheduled for ${u.name}`); setGoToCounselling(u.name); }}>Schedule Counselling</button></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}
