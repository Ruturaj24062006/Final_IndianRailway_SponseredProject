import { useState } from "react";
import { Search, ClipboardList, CheckCircle, RefreshCw, Paperclip, ChevronLeft, ChevronRight, XCircle, ClipboardCheck, Eye, CheckCircle2 } from "lucide-react";

const CAT_C  = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
const CAT_B  = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };

export default function TIApprovals({
  myPmList = [],
  setPmList,
  reviewTab,
  setReviewTab,
  reviewSearch,
  setReviewSearch,
  reviewStation,
  setReviewStation,
  selectedPmId,
  setSelectedPmId,
  editSections,
  setEditSections,
  tiRemarks,
  setTiRemarks,
  showAudit,
  setShowAudit,
  rejectMode,
  setRejectMode,
  tiName,
  stations,
  selectedPM,
  filteredPM = [],
  getCat,
  updateSec,
  finalizePM,
  myStations = []
}) {
  const tabs = ["Pending", "Approved", "Rejected"];

    /* ─── DETAIL VIEW ─── */
    if (selectedPM) {
      const secs = editSections[selectedPM.id] || selectedPM.originalSections;
      const liveTotal = secs.reduce((s, x) => s + x.score, 0);
      const liveCat = getCat(liveTotal);
      const locked = selectedPM.status !== "Pending";
      const reject = rejectMode[selectedPM.id] || false;

      const pme = selectedPM.meta?.pmeStatus || "Fit";
      const ref = selectedPM.meta?.refStatus || "Cleared";
      const alc = selectedPM.meta?.alcoholicStatus || "Non-Alcoholic";

      return (
        <div className="ti2-card animate-fade-in">
          <div className="ti2-card-hdr">
            <div>
              <h2>Review — {selectedPM.pointsmanName} ({selectedPM.hrmsId})</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                {selectedPM.station} · Pointsman · Submitted by {selectedPM.assessingSM} on {selectedPM.submissionDate}
              </p>
            </div>
            <button className="ti2-link-btn" onClick={() => setSelectedPmId(null)}>â† Back</button>
          </div>

          {/* Info meta — same ti2-review-meta grid as AOM */}
          <div className="ti2-review-meta">
            <div><label>Pointsman</label><strong>{selectedPM.pointsmanName}</strong></div>
            <div><label>HRMS ID</label><strong>{selectedPM.hrmsId}</strong></div>
            <div><label>Station</label><strong>{selectedPM.station}</strong></div>
            <div><label>PME Status</label><strong className={pme === "Fit" ? "ti2-green" : "ti2-red"}>{pme}</strong></div>
            <div><label>REF Status</label><strong className={ref === "Cleared" ? "ti2-green" : "ti2-amber"}>{ref}</strong></div>
            <div><label>Alcoholic Status</label><strong>{alc}</strong></div>
          </div>

          {/* Section-wise marks — same ti2-review-sections as AOM */}
          <h4 className="ti2-sec-title">Section-wise Assessment Marks</h4>
          <div className="ti2-review-sections">
            {secs.map((sec, idx) => {
              const pct = Math.round((sec.score / sec.max) * 100);
              return (
                <div key={sec.title} className="ti2-review-sec-row">
                  <span className="ti2-review-sec-name">{sec.title}</span>
                  <div className="ti2-review-bar-wrap">
                    <div className="ti2-review-bar" style={{ width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626" }} />
                  </div>
                  {locked ? (
                    <span className="ti2-review-score-static">{sec.score}/{sec.max}</span>
                  ) : (
                    <div className="ti2-review-score-input">
                      <input type="number" min={0} max={sec.max} value={sec.score}
                        onChange={e => updateSec(selectedPM.id, idx, e.target.value)} />
                      <span className="ti2-sec-max">/ {sec.max}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live score — same ti2-live-score as AOM */}
          <div className="ti2-live-score">
            <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{liveTotal}/100</strong></div>
            <div><label>Category</label><span className="ti2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
          </div>

          {/* TI remarks — mirrors AOM Remarks */}
          {!locked && (
            <div className="ti2-form-field">
              <label>TI Remarks</label>
              <textarea rows={3} value={tiRemarks[selectedPM.id] || ""} onChange={e => setTiRemarks(p => ({ ...p, [selectedPM.id]: e.target.value }))} placeholder="Add remarks…" />
            </div>
          )}

          {/* Reject reason input */}
          {reject && !locked && (
            <div className="ti2-form-field" style={{ marginTop: 10 }}>
              <label style={{ color: "#dc2626" }}>Rejection Reason (mandatory)</label>
              <textarea rows={2} placeholder="Enter rejection reason…" id={`reject-${selectedPM.id}`} />
            </div>
          )}

          {/* Audit trail */}
          {selectedPM.auditTrail?.length > 0 && (
            <div>
              <button className="ti2-link-btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAudit(p => ({ ...p, [selectedPM.id]: !p[selectedPM.id] }))}>
                {showAudit[selectedPM.id] ? "Hide" : "View"} Audit Trail
              </button>
              {showAudit[selectedPM.id] && (
                <div className="ti2-audit-trail">
                  {selectedPM.auditTrail.map((a, i) => (
                    <div key={i} className="ti2-audit-row">
                      <strong>{a.action}</strong> · {a.by} · {a.date}
                      {a.remark && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>"{a.remark}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Locked banner */}
          {locked && (
            <div className="ti2-locked-banner">
              {selectedPM.status === "Approved" ? "✓ Assessment Approved and Locked" : "✗ Assessment Rejected"}
              {selectedPM.tiRemarks && <div style={{ marginTop: 4, fontSize: 12 }}>Remarks: {selectedPM.tiRemarks}</div>}
            </div>
          )}

          {/* Action buttons — exact same as AOM: Reject / Approve as Submitted / Modify & Approve */}
          {!locked && !reject && (
            <div className="ti2-review-actions">
              <button className="ti2-danger-btn" onClick={() => setRejectMode(p => ({ ...p, [selectedPM.id]: true }))}>
                <XCircle size={14} /> Reject
              </button>
              <button className="ti2-ghost-btn" onClick={() => finalizePM(selectedPM.id, "approve")}>
                <CheckCircle2 size={14} /> Approve as Submitted
              </button>
              <button className="ti2-primary-btn" onClick={() => finalizePM(selectedPM.id, "modify")}>
                <CheckCircle2 size={14} /> Modify &amp; Approve
              </button>
            </div>
          )}
          {reject && !locked && (
            <div className="ti2-review-actions">
              <button className="ti2-ghost-btn" onClick={() => setRejectMode(p => ({ ...p, [selectedPM.id]: false }))}>Cancel</button>
              <button className="ti2-danger-btn" onClick={() => {
                const note = document.getElementById(`reject-${selectedPM.id}`)?.value || "No reason provided";
                finalizePM(selectedPM.id, "reject", note);
              }}>Confirm Rejection</button>
            </div>
          )}
        </div>
      );
    }

    /* ─── LIST VIEW ─── */
    return (
      <div className="ti2-card animate-fade-in">
        <div className="ti2-card-hdr">
          <h2>Approvals — Pointsmen</h2>
        </div>
        <p className="ti2-subtitle">Review and approve Pointsman assessments submitted by Station Masters.</p>

        {/* Role switch — mirrors AOM's approvals style */}
        <div className="ti2-tabs" style={{ marginBottom: 4 }}>
          <button className="ti2-tab active">
            Pointsmen
            <span className="ti2-tab-count">
              {myPmList.filter(p => p.status === "Pending").length}
            </span>
          </button>
        </div>

        {/* Status tabs — same ti2-tabs as AOM */}
        <div className="ti2-tabs">
          {tabs.map(t => (
            <button key={t} className={`ti2-tab ${reviewTab === t ? "active" : ""}`} onClick={() => setReviewTab(t)}>
              {t} <span className="ti2-tab-count">
                {myPmList.filter(p => p.status === t).length}
              </span>
            </button>
          ))}
        </div>

        {/* Filters — exact same as AOM */}
        <div className="ti2-filter-row">
          <div className="ti2-search-box">
            <Search size={13} />
            <input placeholder="Search pointsman…"
              value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
          </div>
          <select className="ti2-select" value={reviewStation} onChange={e => setReviewStation(e.target.value)}>
            <option value="All">All Stations</option>
            {myStations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Table — exact same structure as AOM */}
        <div className="ti2-table-wrap">
          <div className="ti2-pm-head ti2-pm-row">
            {["Name", "HRMS ID", "Station", "Submitted By", "Date", "Score", "Status", "Action"].map(h => <span key={h}>{h}</span>)}
          </div>
          {filteredPM.length === 0 && <p className="ti2-empty">No records in this category.</p>}
          {filteredPM.map(p => {
            const total = (p.finalSections || p.originalSections).reduce((s, x) => s + x.score, 0);
            const cat = getCat(total);
            return (
              <div key={p.id} className="ti2-pm-row ti2-pm-data-row">
                <span><strong>{p.pointsmanName}</strong></span>
                <span>{p.hrmsId}</span>
                <span>{p.station}</span>
                <span>{p.assessingSM}</span>
                <span>{p.submissionDate}</span>
                <span><strong style={{ color: CAT_C[cat] }}>{total}/100</strong></span>
                <span>
                  <span className={`ti2-status-pill ti2-status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </span>
                <span>
                  <button className="ti2-link-btn-sm" onClick={() => openPmReview(p.id)}>
                    {p.status === "Pending" ? <><ClipboardCheck size={12} /> Review</> : <><Eye size={12} /> View</>}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
}
