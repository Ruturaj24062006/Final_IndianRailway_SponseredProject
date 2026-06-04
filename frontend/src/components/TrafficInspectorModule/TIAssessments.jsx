import React, { useState } from "react";
import { Search, Calendar, ClipboardCheck, ArrowLeft, RefreshCw, ShieldCheck, Lock, CheckCircle, AlertTriangle, Users, BookOpen, Clock, Play } from "lucide-react";

/* ─── CRITERIA DEFINITIONS ─── */
const TI_SM_CRITERIA = [
  { key: "stationMgmt",  label: "Station Management",          weight: 5, count: 5,
    criteria: ["Efficient train handling", "Accurate scheduling", "Staff deployment", "Complaint resolution", "Log maintenance"] },
  { key: "safety",       label: "Safety & Compliance",         weight: 4, count: 5,
    criteria: ["Safety protocols followed", "Incident reporting timely", "Emergency drill conducted", "Hazard identification", "PPE enforced"] },
  { key: "staffSupervision", label: "Staff Supervision",       weight: 3, count: 5,
    criteria: ["Regular briefings conducted", "Feedback provided to staff", "Leave management", "Timekeeping enforced", "Staff morale maintained"] },
  { key: "documentation", label: "Documentation & Reporting",   weight: 3, count: 5,
    criteria: ["Daily log accurate", "Monthly report submitted", "Incident records maintained", "Assessment documents filed", "Handover notes complete"] },
  { key: "emergency",    label: "Emergency Handling",          weight: 5, count: 5,
    criteria: ["Responded to emergencies promptly", "Coordinated with control office", "Passenger management during disruption", "Track clear protocol followed", "Post-incident review done"] },
];

const TI_SS_CRITERIA = [
  { key: "stationOps",    label: "Station Operations & Supervision",   weight: 5, count: 5,
    criteria: ["Train reception/dispatch procedures", "Station yard supervision during peak hours", "Platform safety compliance", "Crowd management protocols", "Block instrument operation"] },
  { key: "staffMgmt",    label: "Staff Management & Discipline",       weight: 4, count: 5,
    criteria: ["Duty roster maintenance", "Punctuality and attendance tracking", "Leave management compliance", "Uniform & conduct enforcement", "Safety briefing conduct"] },
  { key: "records",      label: "Records & Documentation",             weight: 3, count: 5,
    criteria: ["Station log book accuracy", "Accident/incident reporting", "Block register maintenance", "Cash and freight register audit", "Train delay reporting"] },
  { key: "safety",       label: "Safety Compliance & Emergency",       weight: 5, count: 5,
    criteria: ["Emergency evacuation drill conduct", "Fire equipment serviceability check", "Signal failure response protocol", "Fog signal deployment knowledge", "Coordination with control office"] },
  { key: "infra",        label: "Infrastructure & Asset Maintenance",  weight: 3, count: 5,
    criteria: ["Platform surface and lighting check", "Footover bridge safety assessment", "Washroom hygiene maintenance", "Waiting room orderliness", "Coach indication board accuracy"] },
];

const TI_TM_CRITERIA = [
  { key: "trainSafety",  label: "Train Safety & Brake Inspection",   weight: 5, count: 5,
    criteria: ["Brake power certificate verification", "BP/FP pressure gauge monitoring", "Tail lamp/board correctness", "Loose coupling check", "Vigilance control check"] },
  { key: "signaling",    label: "Signaling & Whistle Compliance",    weight: 4, count: 5,
    criteria: ["Hand signal exchange with SM", "Whistling at gate/whistle boards", "Fog signal detonator drill", "Acknowledge route aspects", "Correct flags/lamps display"] },
  { key: "shunting",     label: "Shunting & Coupling Ops",           weight: 3, count: 5,
    criteria: ["Coordinating shunting movement", "Screw/CBC coupling secured", "Hand brake application on sidings", "Point locking verification", "Clearance distance estimation"] },
  { key: "documentation", label: "Train Log & Guard Certificates",  weight: 3, count: 5,
    criteria: ["Train journal logs accurate", "Caution orders noted", "Guard's certificate issued properly", "Rough journal handovers complete", "Incident report log filled"] },
  { key: "emergency",    label: "Emergency Train Protection",        weight: 5, count: 5,
    criteria: ["Flashing amber tail light active", "Detonator protection at 600m/1200m", "Informing control/SM of disruption", "First-aid response coordination", "Track clearance verification"] },
];

/* ─── LIVE SCORE COMPUTATION ─── */
const calculateLiveScore = (form, criteria) => {
  if (!form) return { knowledge: 0, ynScore: 0, total: 0 };
  let total = 0;
  criteria.forEach(c => {
    const arr = form[c.key] || [];
    arr.forEach(v => { if (v === "Yes") total += c.weight; });
  });
  const km = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
  return { ynScore: Math.min(total, 75), knowledge: km, total: Math.min(total, 75) + km };
};

const CAT_COLORS = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
const CAT_BGS = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };

export default function TIAssessments({
  assessRole = "SM",
  setAssessRole,
  assessSearch = "",
  setAssessSearch,
  assessStation = "All",
  setAssessStation,
  assessStatus = "All",
  setAssessStatus,
  assessCat = "All",
  setAssessCat,
  smList = [],
  ssList = [],
  tmList = [],
  getCat,
  catBadge,
  activeSmId,
  openSMForm,
  smForms = {},
  toggleSMYN,
  setSMField,
  submitSMAssessment,
  smLocked = {},
  handleSendExamAccess,
  activeSsId,
  openSSForm,
  ssForms = {},
  toggleSSYN,
  setSSField,
  submitSSAssessment,
  ssLocked = {},
  handleSendSSExamAccess,
  activeTmId,
  openTMForm,
  tmForms = {},
  toggleTMYN,
  setTMField,
  submitTMAssessment,
  tmLocked = {},
  handleSendTMExamAccess,
  myStations = []
}) {
  const currentRole = assessRole || "SM";

  // --- RENDERING LEVEL 3: ACTIVE EVALUATION FORM ---
  if (currentRole === "SM" && activeSmId) {
    const form = smForms[activeSmId] || {};
    const sm = smList.find(s => s.id === activeSmId);
    const locked = smLocked[activeSmId] || sm?.status === "Submitted" || sm?.status === "Approved";
    const { ynScore, knowledge, total: liveTotal } = calculateLiveScore(form, TI_SM_CRITERIA);
    const liveCat = form.alcoholicStatus === "Alcoholic" ? "D" : getCat(liveTotal);

    return renderFormView(
      sm?.name, sm?.hrmsId, sm?.station, "Station Master", activeSmId,
      TI_SM_CRITERIA, form, locked, ynScore, knowledge, liveTotal, liveCat,
      toggleSMYN, setSMField, submitSMAssessment, openSMForm
    );
  }


  if (currentRole === "TM" && activeTmId) {
    const form = tmForms[activeTmId] || {};
    const tm = tmList.find(t => t.id === activeTmId);
    const locked = tmLocked[activeTmId] || tm?.status === "Submitted" || tm?.status === "Approved";
    const { ynScore, knowledge, total: liveTotal } = calculateLiveScore(form, TI_TM_CRITERIA);
    const liveCat = form.alcoholicStatus === "Alcoholic" ? "D" : getCat(liveTotal);

    return renderFormView(
      tm?.name, tm?.hrmsId, tm?.station, "Train Manager", activeTmId,
      TI_TM_CRITERIA, form, locked, ynScore, knowledge, liveTotal, liveCat,
      toggleTMYN, setTMField, submitTMAssessment, openTMForm
    );
  }

  // --- LEVEL 2: ROSTER VIEW ---
  const activeList = currentRole === "SM" ? smList : tmList;
  
  // Filtering
  const filteredList = activeList.filter(item => {
    const matchesSearch = !assessSearch || 
      item.name.toLowerCase().includes(assessSearch.toLowerCase()) ||
      item.hrmsId.toLowerCase().includes(assessSearch.toLowerCase()) ||
      item.id.toLowerCase().includes(assessSearch.toLowerCase());
    
    const matchesStation = assessStation === "All" || item.station === assessStation;
    const matchesStatus = assessStatus === "All" || item.status === assessStatus;
    const score = item.score || 80;
    const cat = item.category || getCat(score);
    const matchesCat = assessCat === "All" || cat === assessCat;

    return matchesSearch && matchesStation && matchesStatus && matchesCat;
  });

  return (
    <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
            Assessments Directory
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Select a staff category to conduct periodic competency evaluations and log shunting records.
          </p>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="ti2-tabs" style={{ marginBottom: "20px" }}>
        {[
          { key: "SM", label: "Station Masters", count: smList.filter(s => s.status === "Pending").length },
          { key: "TM", label: "Train Managers", count: tmList.filter(t => t.status === "Pending").length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`ti2-tab ${currentRole === tab.key ? "active" : ""}`}
            onClick={() => {
              setAssessRole(tab.key);
              setAssessSearch("");
              setAssessStation("All");
              setAssessStatus("All");
              setAssessCat("All");
            }}
          >
            {tab.label}
            {tab.count > 0 && <span className="ti2-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr auto", gap: "16px", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Search Staff</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Name or HRMS ID..."
                value={assessSearch}
                onChange={(e) => setAssessSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Station Placement</label>
            <select
              value={assessStation}
              onChange={(e) => setAssessStation(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
            >
              <option value="All">All Stations</option>
              {myStations.map(st => (
                <option key={st.id || st.code} value={st.name}>{st.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Evaluation Status</label>
            <select
              value={assessStatus}
              onChange={(e) => setAssessStatus(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Exam Sent">Exam Sent</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Category</label>
            <select
              value={assessCat}
              onChange={(e) => setAssessCat(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
            >
              <option value="All">All Categories</option>
              <option value="A">Category A</option>
              <option value="B">Category B</option>
              <option value="C">Category C</option>
              <option value="D">Category D</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => { setAssessSearch(""); setAssessStation("All"); setAssessStatus("All"); setAssessCat("All"); }}
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", color: "#475569", cursor: "pointer" }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase" }}>Employee</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase" }}>HRMS ID</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase" }}>Station</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase" }}>Last Assessed</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase" }}>Score</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No staff records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const score = item.score || null;
                  const cat = item.category || (score ? getCat(score) : null);
                  const isSubmitted = item.status === "Submitted" || item.status === "Approved";

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0f172a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{item.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>
                              {currentRole === "SM" ? "Station Master" : "Train Manager"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>
                        {item.hrmsId}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155", fontSize: "13px", fontWeight: "500" }}>
                        {item.station}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
                        {item.lastDate || "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {score ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "14px" }}>{score}/100</strong>
                            {catBadge(cat)}
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`sdom-badge ${
                          item.status === "Approved" ? "sdom-badge-success" :
                          item.status === "Submitted" ? "sdom-badge-info" :
                          item.status === "Exam Sent" ? "sdom-badge-warning" : "sdom-badge-neutral"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          {item.status === "Pending" && (
                            <button
                              onClick={() => {
                                if (currentRole === "SM") handleSendExamAccess(item.id);
                                else if (currentRole === "TM") handleSendTMExamAccess(item.id);
                              }}
                              style={{ background: "#7c3aed", border: "none", color: "#ffffff", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}
                            >
                              Send Access
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (currentRole === "SM") openSMForm(item.id);
                              else if (currentRole === "TM") openTMForm(item.id);
                            }}
                            style={{
                              background: isSubmitted ? "#f1f5f9" : "#2563eb",
                              color: isSubmitted ? "#475569" : "#ffffff",
                              border: isSubmitted ? "1px solid #cbd5e1" : "none",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "700",
                              fontSize: "12px"
                            }}
                          >
                            {isSubmitted ? "View Sheet" : "Assess"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL EVALUATION FORM RENDERER ─── */
function renderFormView(
  name, hrmsId, station, designation, activeId, criteria, form, locked,
  ynScore, knowledge, liveTotal, liveCat, toggleYN, setField, submitAssessment, openForm
) {
  return (
    <section className="ti2-card animate-fade-in" style={{ padding: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0B1F3A", margin: 0 }}>
            Assessment Sheet — {name}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
            {hrmsId} · {designation} · {station}
          </p>
        </div>
        <button 
          className="sdom-btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px" }}
          onClick={() => {
            // Close active form by setting active ID null (trigged via mock action)
            if (designation === "Station Master") openForm(null);
            else if (designation === "Station Superintendent") openForm(null);
            else if (designation === "Train Manager") openForm(null);
          }}
        >
          ← Back to List
        </button>
      </div>

      {/* MCQ Knowledge score display card */}
      <div className="sm2-assess-section">
        <div className="sm2-assess-sec-hdr">
          <span className="sm2-assess-sec-num">01</span>
          <div>
            <strong>Knowledge of Rules (MCQ)</strong>
            <span className="sm2-assess-sec-meta">Syncs score out of 25 from staff test logs</span>
          </div>
          <span className="sm2-assess-live-marks">{knowledge} / 25</span>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
            <div className="sdom-modal-field" style={{ width: "200px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>MCQ Marks (Max 25)</label>
              <input
                type="number" min={0} max={25}
                disabled={locked}
                value={form.knowledgeMarks || ""}
                onChange={e => setField(activeId, "knowledgeMarks", e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Yes/No Sections */}
      {criteria.map((sec, si) => {
        const arr = form[sec.key] || [];
        const count = sec.criteria.length;
        const currentScore = arr.filter(v => v === "Yes").length * sec.weight;
        const weight = (sec.outOf || sec.marks || (sec.weight * count));

        return (
          <div key={sec.key} className="sm2-assess-section">
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
              <div>
                <strong>{sec.label}</strong>
                <span className="sm2-assess-sec-meta">{count} criteria · {sec.weight} marks each · Total {weight}</span>
              </div>
              <span className="sm2-assess-live-marks">{currentScore} / {weight}</span>
            </div>

            <div className="sm2-yn-grid">
              {sec.criteria.map((text, idx) => {
                const answer = arr[idx] || "No";
                return (
                  <div key={idx} className="sm2-yn-row">
                    <span className="sm2-yn-label">{idx + 1}. {text}</span>
                    <div className="sm2-yn-btns">
                      <button
                        type="button" disabled={locked}
                        className={answer === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                        onClick={() => toggleYN(activeId, sec.key, idx, "Yes")}
                      >
                        Yes
                      </button>
                      <button
                        type="button" disabled={locked}
                        className={answer === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                        onClick={() => toggleYN(activeId, sec.key, idx, "No")}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Additional Details */}
      <div className="sm2-assess-section">
        <div className="sm2-assess-sec-hdr">
          <span className="sm2-assess-sec-num">{criteria.length + 2}</span>
          <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
        </div>
        <div className="sm2-assess-form" style={{ marginTop: 12 }}>
          <div className="sm2-form-field">
            <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
            <select
              disabled={locked}
              value={form.alcoholicStatus || ""}
              onChange={e => setField(activeId, "alcoholicStatus", e.target.value)}
              required
            >
              <option value="">Select…</option>
              <option value="Non-Alcoholic">Non-Alcoholic</option>
              <option value="Alcoholic">Alcoholic</option>
            </select>
          </div>
          <div className="sm2-form-field">
            <label>PME Status</label>
            <select disabled={locked} value={form.pmeStatus || "Fit"} onChange={e => setField(activeId, "pmeStatus", e.target.value)}>
              <option>Fit</option><option>Unfit</option><option>Pending</option>
            </select>
          </div>
          <div className="sm2-form-field">
            <label>REF Status</label>
            <select disabled={locked} value={form.refStatus || "Cleared"} onChange={e => setField(activeId, "refStatus", e.target.value)}>
              <option>Cleared</option><option>Pending</option><option>Failed</option>
            </select>
          </div>
          <div className="sm2-form-field">
            <label>Counselling</label>
            <select disabled={locked} value={form.counselling || "Not Required"} onChange={e => setField(activeId, "counselling", e.target.value)}>
              <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
            </select>
          </div>
          <div className="sm2-form-field">
            <label>Automatic Training</label>
            <select disabled={locked} value={form.automaticTraining || "Not Required"} onChange={e => setField(activeId, "automaticTraining", e.target.value)}>
              <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
            </select>
          </div>
          <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
            <label>Remarks for Officer / AOM</label>
            <textarea rows={3} disabled={locked} value={form.remarks || ""} onChange={e => setField(activeId, "remarks", e.target.value)} placeholder="Enter observations, recommendations…" />
          </div>
        </div>
      </div>

      {/* Live Score Bar */}
      <div className="sm2-live-score">
        <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
        <div><label>Yes/No Score</label><strong>{ynScore}/75</strong></div>
        <div><label>Grand Total</label><strong style={{ color: CAT_COLORS[liveCat], fontSize: 22 }}>{liveTotal}/100</strong></div>
        <div>
          <label>Category</label>
          <span className="sm2-badge" style={{ background: CAT_BGS[liveCat], color: CAT_COLORS[liveCat], fontSize: 13, padding: "4px 14px" }}>
            Category {liveCat}
          </span>
        </div>
      </div>

      {locked ? (
        <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>
          ✓ Assessment Submitted & Locked (Pending AOM Approval)
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button
            className="sdom-btn-outline"
            style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
            onClick={() => alert("Assessment saved as draft successfully!")}
          >
            Save as Draft
          </button>
          <button
            className="sdom-btn-primary"
            style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}
            onClick={() => submitAssessment(activeId)}
          >
            Submit for AOM Approval
          </button>
        </div>
      )}
    </section>
  );
}
