import { useState } from "react";
import { Award, ShieldAlert, Clock, Activity, FileText, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    form[s.key].forEach(v => { if (v === "Yes") ynTotal += s.weight; });
  });
  return { knowledge, ynTotal, total: knowledge + ynTotal };
};

export default function SMAssess({
  pageMode,
  setPageMode,
  assessTarget,
  setAssessTarget,
  assessForm,
  setAssessForm,
  assessLocked,
  setAssessLocked,
  submittedAssessments,
  setSubmittedAssessments,
  drafts,
  setDrafts,
  statusMsg,
  setStatusMsg,
  activatedTests,
  setActivatedTests,
  pointsmen,
  setPointsmen,
  submitAssessment,
  toggleYN,
  openAssessForm
}) {
  if (pageMode === "assessForm" && assessTarget) {
    const mcqDataStr = localStorage.getItem(`pm_mcq_test_${assessTarget.hrmsId}`);
    const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
    const isMcqCompleted = mcqData && mcqData.completed;
    const isActivated = localStorage.getItem(`pm_test_activated_${assessTarget.hrmsId}`) === "true";

    const { knowledge, ynTotal, total: liveTotal } = computeScore(assessForm);
    const liveCat = getCat(liveTotal);

    return (
      <section className="sm2-card">
        <div className="sm2-card-hdr">
          <div>
            <h2>Assessment — {assessTarget.name}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{assessTarget.hrmsId} · {assessTarget.lastDate}</p>
          </div>
          <button className="sm2-link-btn" onClick={() => setPageMode("default")}>← Back</button>
        </div>

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
                        if (isActivated) {
                          localStorage.setItem(`pm_test_activated_${assessTarget.hrmsId}`, "false");
                        } else {
                          localStorage.setItem(`pm_test_activated_${assessTarget.hrmsId}`, "true");
                        }
                        setActivatedTests(prev => ({ ...prev, [assessTarget.hrmsId]: !isActivated }));
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
          const secScore = assessForm[sec.key].filter(v => v === "Yes").length * sec.weight;
          return (
            <div key={sec.key} className="sm2-assess-section" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
              <div className="sm2-assess-sec-hdr">
                <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                <div>
                  <strong>{sec.title}</strong>
                  <span className="sm2-assess-sec-meta">5 criteria · {sec.weight} marks each · Total {sec.outOf}</span>
                </div>
                <span className="sm2-assess-live-marks">{secScore} / {sec.outOf}</span>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((label, idx) => (
                  <div key={idx} className="sm2-yn-row">
                    <span className="sm2-yn-label">{idx + 1}. {label}</span>
                    <div className="sm2-yn-btns">
                      <button
                        type="button" disabled={!isMcqCompleted || assessLocked}
                        className={assessForm[sec.key][idx] === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                        onClick={() => toggleYN(sec.key, idx, "Yes")}>
                        Yes
                      </button>
                      <button
                        type="button" disabled={!isMcqCompleted || assessLocked}
                        className={assessForm[sec.key][idx] === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                        onClick={() => toggleYN(sec.key, idx, "No")}>
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Additional Details ── */}
        <div className="sm2-assess-section" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div className="sm2-assess-sec-hdr">
            <span className="sm2-assess-sec-num">07</span>
            <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
          </div>
          <div className="sm2-assess-form" style={{ marginTop: 12 }}>
            <div className="sm2-form-field">
              <label>Alcoholic / Non-Alcoholic <span style={{ color: "#dc2626" }}>*</span></label>
              <select
                disabled={!isMcqCompleted || assessLocked}
                value={assessForm.alcoholicStatus}
                onChange={e => setAssessForm(p => ({ ...p, alcoholicStatus: e.target.value }))}>
                <option value="">Select…</option>
                <option>Non-Alcoholic</option>
                <option>Alcoholic</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>PME Status</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.pmeStatus}
                onChange={e => setAssessForm(p => ({ ...p, pmeStatus: e.target.value }))}>
                <option>Fit</option>
                <option>Unfit</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>REF Status</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.refStatus}
                onChange={e => setAssessForm(p => ({ ...p, refStatus: e.target.value }))}>
                <option>Cleared</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>Automatic Training</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.automaticTraining}
                onChange={e => setAssessForm(p => ({ ...p, automaticTraining: e.target.value }))}>
                <option>Not Required</option>
                <option>Recommended</option>
                <option>Mandatory</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>Counselling</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.counselling}
                onChange={e => setAssessForm(p => ({ ...p, counselling: e.target.value }))}>
                <option>Not Required</option>
                <option>Recommended</option>
                <option>Mandatory</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>Date of Appointment</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.dateOfAppointment}
                onChange={e => setAssessForm(p => ({ ...p, dateOfAppointment: e.target.value }))} />
            </div>
            <div className="sm2-form-field">
              <label>Working Since (current grade)</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.workingSince}
                onChange={e => setAssessForm(p => ({ ...p, workingSince: e.target.value }))} />
            </div>
            <div className="sm2-form-field sm2-form-full">
              <label>Remarks for Traffic Inspector</label>
              <textarea rows={3} disabled={!isMcqCompleted || assessLocked} value={assessForm.remarks}
                onChange={e => setAssessForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder={isMcqCompleted ? "Enter observations, recommendations…" : "Please wait for Pointsman to complete the MCQ exam..."} />
            </div>
          </div>
        </div>

        {/* ── Live Score Bar ── */}
        <div className="sm2-live-score" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div>
            <label>Knowledge (MCQ)</label>
            <strong>{knowledge} / 25</strong>
          </div>
          <div>
            <label>Yes / No Sections</label>
            <strong>{ynTotal} / 75</strong>
          </div>
          <div>
            <label>Grand Total</label>
            <strong style={{ color: CAT_COLOR[liveCat], fontSize: 22 }}>{liveTotal} / 100</strong>
          </div>
          <div>
            <label>Category</label>
            <span className="sm2-badge" style={{ background: CAT_BG[liveCat], color: CAT_COLOR[liveCat], fontSize: 13, padding: "4px 12px" }}>
              Category {liveCat}
            </span>
          </div>
        </div>

        {assessLocked && (
          <div className="sm2-submitted-banner">✓ Assessment submitted for TI approval. Form is now locked.</div>
        )}

        {!assessLocked && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
            <div className="sm2-assess-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="sm2-ghost-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} disabled={!isMcqCompleted} onClick={() => submitAssessment(true)}>Save as Draft</button>
              <button className="sm2-primary-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: isMcqCompleted ? "#2563eb" : "#cbd5e1", color: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} disabled={!isMcqCompleted} onClick={() => submitAssessment(false)}>
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

  return (
    <section className="sm2-card">
      <div className="sm2-card-hdr"><h2>Assess Pointsman</h2></div>
      <p className="sm2-subtitle">Pointsmen with pending assessments are listed below. Fill the full structured form and submit for Traffic Inspector approval.</p>

      {drafts.length === 0 ? (
        <div className="sm2-empty-state-center">
          <CheckCircle2 size={36} color="#16a34a" />
          <h3>All Assessments Up-to-Date</h3>
          <p>No pending assessments at this time.</p>
        </div>
      ) : (
        <div className="sm2-assess-list">
          {drafts.map(d => {
            const mcqDataStr = localStorage.getItem(`pm_mcq_test_${d.hrmsId}`);
            const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
            const isCompleted = mcqData && mcqData.completed;
            const isActivated = localStorage.getItem(`pm_test_activated_${d.hrmsId}`) === "true";

            return (
              <div key={d.pointsmanId} className="sm2-assess-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "12px" }}>
                <div>
                  <strong style={{ fontSize: "15px", color: "#0f172a" }}>{d.name}</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{d.hrmsId}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Last assessed: {d.lastDate}</span>

                  {isCompleted ? (
                    <span className="sdom-badge sdom-badge-success">
                      MCQ Completed ({mcqData.correctCount}/25)
                    </span>
                  ) : isActivated ? (
                    <span className="sdom-badge sdom-badge-warning">
                      Exam Active
                    </span>
                  ) : (
                    <span className="sdom-badge sdom-badge-neutral" style={{ background: "#f1f5f9", color: "#475569" }}>
                      Exam Locked
                    </span>
                  )}

                  <div style={{ display: "flex", gap: "8px" }}>
                    {!isCompleted && (
                      <button
                        className="sm2-ghost-btn-sm"
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
                          if (isActivated) {
                            localStorage.setItem(`pm_test_activated_${d.hrmsId}`, "false");
                          } else {
                            localStorage.setItem(`pm_test_activated_${d.hrmsId}`, "true");
                          }
                          setActivatedTests(prev => ({ ...prev, [d.hrmsId]: !isActivated }));
                        }}
                      >
                        {isActivated ? "Deactivate Test" : "Activate Test"}
                      </button>
                    )}

                    <button
                      className="sm2-primary-btn-sm"
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
                      Open Form
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submittedAssessments.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>Submitted This Session</h4>
          {submittedAssessments.map(r => (
            <div key={r.id} className="sm2-submitted-row">
              <div><strong>{r.name}</strong><span>{r.hrmsId}</span></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="sm2-badge" style={{ background: CAT_BG[r.grade], color: CAT_COLOR[r.grade] }}>Cat. {r.grade}</span>
                <strong>{r.total}/100</strong>
                <span className={`sm2-status-pill sm2-status-${r.approvalStatus.toLowerCase()}`}>{r.approvalStatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}