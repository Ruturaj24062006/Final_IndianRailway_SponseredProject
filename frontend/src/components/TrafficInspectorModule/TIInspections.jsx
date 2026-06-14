import { Search, Eye, Calendar, Plus } from "lucide-react";

const RISK_C = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const RISK_B = { High: "#fee2e2", Medium: "#fef3c7", Low: "#dcfce7" };

export default function TIInspections({
  inspections,
  setInspections,
  showInspForm,
  setShowInspForm,
  newInsp,
  setNewInsp,
  stations,
  addAuditLog,
  submitInspection,
  myStations
}) {
  return (
  <div className="ti2-page-body animate-fade-in">
      <div className="ti2-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2>Field Inspection Reports &amp; Schedules</h2>
            <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Schedule field audits, document safety observations, and log track point compliance.</p>
          </div>
          <button className="ti2-primary-btn" onClick={() => setShowInspForm(!showInspForm)}>
            <Plus size={13} /> {showInspForm ? "Close Form" : "Log New Inspection"}
          </button>
        </div>

        {showInspForm && (
          <form onSubmit={submitInspection} className="ti2-assess-form" style={{ padding: "18px", border: "1px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", marginBottom: "18px" }}>
            <div className="ti2-form-field">
              <label>Audited Station</label>
              <select value={newInsp.station} onChange={e => setNewInsp({ ...newInsp, station: e.target.value })} required>
                {myStations.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
              </select>
            </div>

            <div className="ti2-form-field">
              <label>Risk Level Class</label>
              <select value={newInsp.risk} onChange={e => setNewInsp({ ...newInsp, risk: e.target.value })} required>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="ti2-form-field" style={{ gridColumn: "1/-1" }}>
              <label>Safety Observations &amp; Point Audit Remarks</label>
              <textarea rows={3} value={newInsp.observations} onChange={e => setNewInsp({ ...newInsp, observations: e.target.value })} placeholder="Describe joint clearance, signal relays, shunting speed compliance observations..." required />
            </div>

            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" className="ti2-ghost-btn" onClick={() => setShowInspForm(false)}>Cancel</button>
              <button type="submit" className="ti2-primary-btn">Submit Inspection Log</button>
            </div>
          </form>
        )}

        {/* Inspections ledger list */}
        <div className="ti2-table-wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 3fr 1.2fr 1fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
            <span>Inspection Date</span>
            <span>Station audited</span>
            <span>Safety Observations</span>
            <span>Risk Severity</span>
            <span>Status</span>
          </div>

          {inspections.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <Search size={40} color="#64748b" />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>No Data Available</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No inspections have been logged yet.</p>
            </div>
          ) : (
            inspections.map(i => (
              <div key={i.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 3fr 1.2fr 1fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
                <strong>{i.date}</strong>
                <strong>{i.station}</strong>
                <span>{i.observations}</span>
                <span><span className="ti2-badge" style={{ background: RISK_B[i.risk], color: RISK_C[i.risk] }}>{i.risk} Risk</span></span>
                <span><span className="ti2-pill-grey">{i.status}</span></span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
);
}
