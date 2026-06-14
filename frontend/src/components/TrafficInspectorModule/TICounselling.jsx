import { Search, HeartHandshake, Calendar, Plus } from "lucide-react";

export default function TICounselling({
  counsellings,
  setCounsellings,
  showCounForm,
  setShowCounForm,
  newCoun,
  setNewCoun,
  stations,
  users,
  addAuditLog,
  submitCounselling
}) {
  return (
  <div className="ti2-page-body animate-fade-in">
      <div className="ti2-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2>Staff Counselling &amp; Behaviour Records</h2>
            <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Brief high-risk pointsmen, log safety awareness counseling sessions, and track behaviour logs.</p>
          </div>
          <button className="ti2-primary-btn" onClick={() => setShowCounForm(!showCounForm)}>
            <Plus size={13} /> {showCounForm ? "Close Form" : "Log Counselling Briefing"}
          </button>
        </div>

        {showCounForm && (
          <form onSubmit={submitCounselling} className="ti2-assess-form" style={{ padding: "18px", border: "1px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", marginBottom: "18px" }}>
            <div className="ti2-form-field">
              <label>Staff Roster Personnel</label>
              <select value={newCoun.staffName} onChange={e => {
                const targetUser = users.find(u => u.name === e.target.value);
                setNewCoun({ ...newCoun, staffName: e.target.value, designation: targetUser?.designation || "Pointsman", station: targetUser?.station || "Parbhani Junction" });
              }} required>
                <option value="">Select staff member…</option>
                {users.map(u => <option key={u.id} value={u.name}>{u.name} ({u.designation} - {u.station})</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="ti2-form-field">
                <label>Session Duration</label>
                <input type="text" value={newCoun.duration} onChange={e => setNewCoun({ ...newCoun, duration: e.target.value })} placeholder="e.g. 45 mins" required />
              </div>
              <div className="ti2-form-field">
                <label>Progress Status</label>
                <select value={newCoun.progress} onChange={e => setNewCoun({ ...newCoun, progress: e.target.value })} required>
                  <option>Under Monitor</option>
                  <option>Completed</option>
                  <option>Recommended for REF</option>
                </select>
              </div>
            </div>

            <div className="ti2-form-field" style={{ gridColumn: "1/-1" }}>
              <label>Briefing Topics &amp; Counselling Notes</label>
              <textarea rows={3} value={newCoun.topics} onChange={e => setNewCoun({ ...newCoun, topics: e.target.value })} placeholder="Focus topics: Alcoholic rehabilitation, safe shunting speeds, whistle codes compliance, alertness..." required />
            </div>

            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" className="ti2-ghost-btn" onClick={() => setShowCounForm(false)}>Cancel</button>
              <button type="submit" className="ti2-primary-btn">Submit Counselling Brief</button>
            </div>
          </form>
        )}

        {/* Counselling list */}
        <div className="ti2-table-wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1.2fr 2.5fr 1fr 1.2fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
            <span>Counselling Date</span>
            <span>Staff Name</span>
            <span>Designation</span>
            <span>Focus Briefing Topics</span>
            <span>Duration</span>
            <span>Progress Status</span>
          </div>

          {counsellings.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <HeartHandshake size={40} color="#64748b" />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>No Data Available</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No counselling sessions have been logged yet.</p>
            </div>
          ) : (
            counsellings.map(c => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1.2fr 2.5fr 1fr 1.2fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
                <strong>{c.date}</strong>
                <strong>{c.staffName}</strong>
                <span><span className="ti2-pill-grey" style={{ fontSize: "10px", fontWeight: "700" }}>{c.designation}</span></span>
                <span>{c.topics}</span>
                <span>{c.duration}</span>
                <span><span className="ti2-badge" style={{ background: c.progress === "Completed" ? "#d1fae5" : "#fef3c7", color: c.progress === "Completed" ? "#065f46" : "#92400e" }}>{c.progress}</span></span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
);
}
