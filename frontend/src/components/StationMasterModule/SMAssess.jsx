import React, { useState } from "react";
import { Award, Clock, Activity, Lock, AlertTriangle, CheckCircle2, Search, Filter, Play, Check } from "lucide-react";

/* ─── HELPERS ─── */
function getCat(score) {
  if (score >= 80) return "A";
  if (score >= 50) return "B";
  if (score >= 26) return "C";
  return "D";
}

const CAT_COLOR = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
const CAT_BG = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };

function riskLevel(pm) {
  if (pm.safetyScore < 60 || pm.lastScore < 50) return "High";
  if (pm.safetyScore < 75 || pm.lastScore < 65) return "Medium";
  return "Low";
}

const YN_SECTIONS = [
  {
    key: "alertness", title: "Alertness & Observation",
    weight: 5, outOf: 25,
    criteria: [
      "Observes track and signals diligently",
      "Responds promptly to train movements",
      "Maintains vigilance during duty hours",
      "Reports anomalies immediately",
      "Demonstrates situational awareness"
    ]
  },
  {
    key: "safety", title: "Safety Record",
    weight: 3, outOf: 15,
    criteria: [
      "Follows all safety protocols consistently",
      "No safety violations in review period",
      "Wears required PPE at all times",
      "Participates in safety drills",
      "Maintains incident-free record"
    ]
  },
  {
    key: "leadership", title: "Leadership & Management",
    weight: 3, outOf: 15,
    criteria: [
      "Guides junior staff effectively",
      "Handles peak hours without disruption",
      "Communicates clearly with team",
      "Resolves operational issues promptly",
      "Maintains duty log accurately"
    ]
  },
  {
    key: "discipline", title: "Discipline",
    weight: 2, outOf: 10,
    criteria: [
      "Reports to duty on time",
      "Follows uniform and grooming standards",
      "Complies with supervisory instructions",
      "No disciplinary action in review period",
      "Maintains respectful conduct"
    ]
  },
  {
    key: "appearance", title: "Appearance & Neatness",
    weight: 2, outOf: 10,
    criteria: [
      "Uniform worn correctly and is clean",
      "Identification badge displayed",
      "Footwear as per regulation",
      "Grooming standards maintained",
      "Duty area kept tidy"
    ]
  }
];

const computeScore = (form) => {
  const knowledge = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
  let ynTotal = 0;
  YN_SECTIONS.forEach(s => {
    form[s.key]?.forEach(v => { if (v === "Yes") ynTotal += s.weight; });
  });
  return { knowledge, ynTotal, total: knowledge + ynTotal };
};

export default function SMAssess({
  screenMode,
  setScreenMode,
  assessTarget,
  setAssessTarget,
  assessForm,
  setAssessForm,
  assessLocked,
  setAssessLocked,
  submittedAssessments = [],
  setSubmittedAssessments,
  drafts = [],
  setDrafts,
  statusMsg,
  setStatusMsg,
  activatedTests = {},
  setActivatedTests,
  pointsmen = [],
  setPointsmen,
  submitAssessment,
  toggleYN,
  openAssessForm
}) {
  const [searchQuery, setSearchQuery] = useState("");

  if (screenMode === "assessForm" && assessTarget) {
    const mcqDataStr = localStorage.getItem(`pm_mcq_test_${assessTarget.hrmsId}`);
    const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
    const isMcqCompleted = mcqData && mcqData.completed;
    const isActivated = localStorage.getItem(`pm_test_activated_${assessTarget.hrmsId}`) === "true";

    const { knowledge, ynTotal, total: liveTotal } = computeScore(assessForm);
    const liveCat = getCat(liveTotal);

    return (
      <section className="ti2-card animate-fade-in" style={{ padding: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0B1F3A", margin: 0 }}>
              Assessment — {assessTarget.name}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
              {assessTarget.hrmsId} · Last Assessed: {assessTarget.lastDate}
            </p>
          </div>
          <button 
            className="sdom-btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px" }}
            onClick={() => setScreenMode("default")}
          >
            ← Back
          </button>
        </div>

        {statusMsg && (
          <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#e8f5e9", border: "1px solid #c8e6c9", color: "#1b5e20", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
            {statusMsg}
          </div>
        )}

        {/* ── Section 1: Knowledge of Rules ── */}
        <div className="sm2-assess-section">
          <div className="sm2-assess-sec-hdr">
            <span className="sm2-assess-sec-num">01</span>
            <div>
              <strong>Knowledge of Rules (MCQ-based)</strong>
              <span className="sm2-assess-sec-meta">Auto-calculated from Pointsman MCQ Test</span>
            </div>
            <span className="sm2-assess-live-marks">{knowledge} / 25</span>
          </div>

          <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
            {isMcqCompleted ? (
              <div className="sm2-mcq-success-card">
                <div className="sm2-mcq-card-header">
                  <div className="sm2-mcq-status">
                    <span className="sm2-status-dot green"></span>
                    <span className="sm2-status-text text-green font-semibold">MCQ Test Completed</span>
                  </div>
                  <div className="sm2-mcq-lock-badge">
                    <Lock size={12} />
                    <span>Read-Only (Synced)</span>
                  </div>
                </div>

                <div className="sm2-mcq-card-body">
                  <div className="sm2-mcq-score-display">
                    <div className="sm2-mcq-large-score">
                      <strong>{mcqData.correctCount}</strong>
                      <span>/ 25</span>
                    </div>
                    <div className="sm2-mcq-percentage-badge">
                      {mcqData.percentage}% Score
                    </div>
                  </div>

                  <div className="sm2-mcq-progress-container">
                    <div className="sm2-mcq-progress-bar">
                      <div
                        className="sm2-mcq-progress-fill"
                        style={{
                          width: `${mcqData.percentage}%`,
                          background: mcqData.percentage >= 80 ? "#16a34a" : mcqData.percentage >= 50 ? "#2563eb" : "#dc2626"
                        }}
                      />
                    </div>
                  </div>

                  <div className="sm2-mcq-meta-grid">
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">Submitted On</span>
                      <strong className="sm2-mcq-meta-val">{mcqData.submittedDate}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">Assessed Entity</span>
                      <strong className="sm2-mcq-meta-val">{assessTarget.name}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sm2-mcq-pending-card">
                <div className="sm2-mcq-card-header">
                  <div className="sm2-mcq-status">
                    <span className={`sm2-status-dot ${isActivated ? "amber" : "red"}`}></span>
                    <span className={`sm2-status-text text-${isActivated ? "amber" : "red"} font-semibold`}>
                      {isActivated ? "MCQ Test Active" : "MCQ Test Locked"}
                    </span>
                  </div>
                  <div className="sm2-mcq-lock-badge">
                    <Lock size={12} />
                    <span>Read-Only</span>
                  </div>
                </div>

                <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                    <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? "Awaiting Pointsman Attempt" : "Competency Exam Locked"}</h4>
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                        {isActivated ? (
                          <span>The shunting safety competency trial is active. Request pointsman (<strong>{assessTarget.name}</strong>) to log into their portal and attempt the 25 safety questions to automatically sync scores.</span>
                        ) : (
                          <span>The pointsman shunting safety MCQ exam is currently locked. You must click the <strong>Activate Safety Exam</strong> button below to enable the pointsman to log in and attempt the test.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: "none",
                        background: isActivated ? "#fef2f2" : "#2563eb",
                        color: isActivated ? "#dc2626" : "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                      }}
                      onClick={() => {
                        const nextVal = !isActivated;
                        localStorage.setItem(`pm_test_activated_${assessTarget.hrmsId}`, nextVal ? "true" : "false");
                        setActivatedTests(prev => ({ ...prev, [assessTarget.hrmsId]: nextVal }));
                      }}
                    >
                      {isActivated ? "Deactivate Safety Competency Exam" : "Activate Safety Competency Exam"}
                    </button>
                  </div>

                  <div className="sm2-mcq-meta-grid">
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">Assessment Status</span>
                      <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? "Active & Awaiting Attempt" : "Locked (Awaiting Activation)"}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">Assessed Entity</span>
                      <strong className="sm2-mcq-meta-val">{assessTarget.name}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">Total Questions</span>
                      <strong className="sm2-mcq-meta-val">25 Questions (1 mark each)</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sections 2–6: Yes/No blocks ── */}
        {YN_SECTIONS.map((sec, si) => {
          const count = sec.criteria.length;
          const secScore = (assessForm[sec.key] || []).filter(v => v === "Yes").length * sec.weight;
          const weight = (sec.outOf / count).toFixed(2);

          return (
            <div key={sec.key} className="sm2-assess-section" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
              <div className="sm2-assess-sec-hdr">
                <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                <div>
                  <strong>{sec.title}</strong>
                  <span className="sm2-assess-sec-meta">{count} criteria · {weight} marks each · Total {sec.outOf}</span>
                </div>
                <span className="sm2-assess-live-marks">{secScore} / {sec.outOf}</span>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((criteriaText, idx) => {
                  const currentAnswer = assessForm[sec.key]?.[idx] || "No";
                  return (
                    <div key={idx} className="sm2-yn-row">
                      <span className="sm2-yn-label">{idx + 1}. {criteriaText}</span>
                      <div className="sm2-yn-btns">
                        <button
                          type="button" disabled={!isMcqCompleted || assessLocked}
                          className={currentAnswer === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                          style={{ cursor: (!isMcqCompleted || assessLocked) ? "not-allowed" : "pointer" }}
                          onClick={() => toggleYN(sec.key, idx, "Yes")}
                        >
                          Yes
                        </button>
                        <button
                          type="button" disabled={!isMcqCompleted || assessLocked}
                          className={currentAnswer === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                          style={{ cursor: (!isMcqCompleted || assessLocked) ? "not-allowed" : "pointer" }}
                          onClick={() => toggleYN(sec.key, idx, "No")}
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

        {/* ── Section 07: Additional Details ── */}
        <div className="sm2-assess-section" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div className="sm2-assess-sec-hdr">
            <span className="sm2-assess-sec-num">07</span>
            <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
          </div>
          <div className="sm2-assess-form" style={{ marginTop: 12 }}>
            <div className="sm2-form-field">
              <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
              <select
                disabled={!isMcqCompleted || assessLocked}
                value={assessForm.alcoholicStatus || ""}
                onChange={e => setAssessForm(p => ({ ...p, alcoholicStatus: e.target.value }))}
                required
              >
                <option value="">Select…</option>
                <option value="Non-Alcoholic">Non-Alcoholic</option>
                <option value="Alcoholic">Alcoholic</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>PME Status</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.pmeStatus || "Fit"}
                onChange={e => setAssessForm(p => ({ ...p, pmeStatus: e.target.value }))}>
                <option>Fit</option>
                <option>Unfit</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>REF Status</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.refStatus || "Cleared"}
                onChange={e => setAssessForm(p => ({ ...p, refStatus: e.target.value }))}>
                <option>Cleared</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>Automatic Training</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.automaticTraining || "Not Required"}
                onChange={e => setAssessForm(p => ({ ...p, automaticTraining: e.target.value }))}>
                <option>Not Required</option>
                <option>Recommended</option>
                <option>Mandatory</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>Counselling</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.counselling || "Not Required"}
                onChange={e => setAssessForm(p => ({ ...p, counselling: e.target.value }))}>
                <option>Not Required</option>
                <option>Recommended</option>
                <option>Mandatory</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>Date of Appointment</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.dateOfAppointment || ""}
                onChange={e => setAssessForm(p => ({ ...p, dateOfAppointment: e.target.value }))} />
            </div>
            <div className="sm2-form-field">
              <label>Working Since (current grade)</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.workingSince || ""}
                onChange={e => setAssessForm(p => ({ ...p, workingSince: e.target.value }))} />
            </div>
            <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
              <label>Remarks for Traffic Inspector</label>
              <textarea rows={3} disabled={!isMcqCompleted || assessLocked} value={assessForm.remarks || ""}
                onChange={e => setAssessForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder={isMcqCompleted ? "Enter observations, recommendations…" : "Please wait for Pointsman to complete the MCQ exam..."} />
            </div>
          </div>
        </div>

        {/* ── Live Score Bar ── */}
        <div className="sm2-live-score" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
          <div><label>Yes/No Score</label><strong>{ynTotal}/75</strong></div>
          <div><label>Grand Total</label><strong style={{ color: CAT_COLOR[liveCat], fontSize: 22 }}>{liveTotal}/100</strong></div>
          <div><label>Category</label><span className="sm2-badge" style={{ background: CAT_BG[liveCat], color: CAT_COLOR[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
        </div>

        {assessLocked && (
          <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>
            ✓ Assessment submitted for TI approval. Form is now locked.
          </div>
        )}

        {!assessLocked && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                className="sdom-btn-outline" 
                style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} 
                disabled={!isMcqCompleted} 
                onClick={() => submitAssessment(true)}
              >
                Save as Draft
              </button>
              <button 
                className="sdom-btn-primary" 
                style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: isMcqCompleted ? "#2563eb" : "#cbd5e1", color: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} 
                disabled={!isMcqCompleted} 
                onClick={() => submitAssessment(false)}
              >
                Submit for TI Approval
              </button>
            </div>
            {!isMcqCompleted && (
              <div style={{ color: "#dc2626", fontSize: "12.5px", fontWeight: "700", textAlign: "center", background: "#fef2f2", border: "1px solid #fee2e2", padding: "10px", borderRadius: "8px" }}>
                ⚠️ MCQ Safety Competency Trial is locked or incomplete. All shunting assessment marks are locked until the Pointsman completes the shunting safety exam.
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // --- FILTERED ROSTER LIST (TABULAR) ---
  const filteredDrafts = drafts.filter(d => {
    const q = searchQuery.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.hrmsId.toLowerCase().includes(q);
  });

  return (
    <section className="ti2-card animate-fade-in" style={{ padding: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Assess Pointsmen</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Pointsmen with pending assessments. Complete the structured field form and submit for Traffic Inspector approval.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search Pointsman by Name or HRMS ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "500", boxSizing: "border-box" }}
          />
        </div>
        {searchQuery && (
          <button 
            className="sdom-btn-outline" 
            style={{ padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" }} 
            onClick={() => setSearchQuery("")}
          >
            Clear
          </button>
        )}
      </div>

      {filteredDrafts.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <CheckCircle2 size={40} color="#16a34a" />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>All Assessments Complete</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No pointsmen match the search criteria or require assessment.</p>
        </div>
      ) : (
        <div className="sdom-table-wrap" style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pointsman</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>HRMS ID</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Assessed</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>MCQ Exam Status</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map((d) => {
                const mcqDataStr = localStorage.getItem(`pm_mcq_test_${d.hrmsId}`);
                const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
                const isCompleted = mcqData && mcqData.completed;
                const isActivated = localStorage.getItem(`pm_test_activated_${d.hrmsId}`) === "true";

                return (
                  <tr key={d.pointsmanId || d.hrmsId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1e3a8a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{d.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>Pointsman</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>
                      {d.hrmsId}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
                      {d.lastDate || "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {isCompleted ? (
                        <span className="sdom-badge sdom-badge-success" style={{ padding: "4px 8px" }}>
                          ✓ MCQ Completed ({mcqData.correctCount}/25)
                        </span>
                      ) : isActivated ? (
                        <span className="sdom-badge sdom-badge-warning" style={{ padding: "4px 8px" }}>
                          Exam Active
                        </span>
                      ) : (
                        <span className="sdom-badge sdom-badge-neutral" style={{ padding: "4px 8px", background: "#f1f5f9", color: "#475569" }}>
                          Exam Locked
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        {!isCompleted && (
                          <button
                            className="sdom-btn-outline"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              border: "1px solid #cbd5e1",
                              background: isActivated ? "#fef2f2" : "#eff6ff",
                              color: isActivated ? "#dc2626" : "#2563eb"
                            }}
                            onClick={() => {
                              const nextVal = !isActivated;
                              localStorage.setItem(`pm_test_activated_${d.hrmsId}`, nextVal ? "true" : "false");
                              setActivatedTests(prev => ({ ...prev, [d.hrmsId]: nextVal }));
                            }}
                          >
                            {isActivated ? "Deactivate Test" : "Activate Test"}
                          </button>
                        )}
                        <button
                          className="sdom-btn-primary"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none"
                          }}
                          onClick={() => openAssessForm(d)}
                        >
                          Assess
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {submittedAssessments.length > 0 && (
        <div style={{ marginTop: 28, background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "700" }}>Submitted This Session</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {submittedAssessments.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>{r.name}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>({r.hrmsId})</span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span className="sdom-badge sdom-badge-danger" style={{ background: CAT_BG[r.grade], color: CAT_COLOR[r.grade], border: `1px solid ${CAT_COLOR[r.grade]}22` }}>Cat. {r.grade}</span>
                  <strong style={{ fontSize: "14px" }}>{r.total}/100</strong>
                  <span className={`sdom-badge ${r.approvalStatus === "Approved" ? "sdom-badge-success" : "sdom-badge-warning"}`}>{r.approvalStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}