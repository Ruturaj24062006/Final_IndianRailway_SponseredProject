import { useState } from "react";
import { Search, Award, Calendar, Download } from "lucide-react";

export default function TIRefPosition({
  users,
  setUsers,
  stations,
  getCat,
  getUserRisk,
  riskBadge,
  catBadge,
  statusBadge,
  addAuditLog,
  exportAlert
}) {
  const completed = users.filter(u => u.refStatus === "Cleared");
    const pending = users.filter(u => u.refStatus === "Pending");
    const expired = users.filter(u => u.refStatus === "Expired" || u.refStatus === "Failed");

    return (
      <div className="ti2-page-body animate-fade-in">
        <div className="ti2-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2>Refresher Course (REF) training position</h2>
              <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Monitor pointsmen safety refresher training compliance ledger.</p>
            </div>
            <button className="ti2-view-profile-btn" onClick={() => exportAlert("PDF", "REF_Refresher_Training_Position")}>
              <Download size={13} /> REF Report
            </button>
          </div>

          <div className="ti2-myassess-summary" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #16a34a" }}><label>REF Cleared / Completed</label><strong style={{ color: "#16a34a" }}>{completed.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #d97706" }}><label>REF Pending Class</label><strong style={{ color: "#d97706" }}>{pending.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #dc2626" }}><label>REF Expired alerts</label><strong style={{ color: "#dc2626" }}>{expired.length} personnel</strong></div>
          </div>

          <div className="ti2-profile-sec-title">REF Training Alert List</div>
          <div className="ti2-table-wrap">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
              <span>Staff Name</span>
              <span>HRMS ID</span>
              <span>Designation</span>
              <span>Station Section</span>
              <span>REF Status</span>
              <span>Action Clearance</span>
            </div>
            {users.filter(u => u.refStatus !== "Cleared").map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
                <strong>{u.name}</strong>
                <span style={{ fontFamily: "monospace" }}>{u.id}</span>
                <span>{u.designation}</span>
                <strong>{u.station}</strong>
                <span style={{ color: u.refStatus === "Expired" ? "#dc2626" : "#d97706", fontWeight: "800" }}>{u.refStatus}</span>
                <span><button className="ti2-primary-btn-sm" style={{ fontSize: "11px", padding: "5px 12px" }} onClick={() => { alert(`✓ Clear REF action submitted: ${u.name} scheduled for refresher training batches.`); setUsers(prev => prev.map(x => x.id === u.id ? { ...x, refStatus: "Cleared" } : x)); addAuditLog("Clear REF training", `Scheduled refresher course for ${u.name}`); }}>Clear REF</button></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}
