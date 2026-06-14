import React, { useState } from "react";
import { Award, Clock, Activity, Lock, AlertTriangle, CheckCircle2, Search, Filter, Play, Check } from "lucide-react";
import { useLanguage } from "../../utils/LanguageContext";

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
  openAssessForm,
  onToggleMcqStatus
}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  if (screenMode === "assessForm" && assessTarget) {
    const isMcqCompleted = assessTarget.mcq_status === 'Completed';
    const isActivated = assessTarget.mcq_status === 'Active';
    const mcqData = isMcqCompleted ? {
      correctCount: assessTarget.mcq_correct_count || 0,
      percentage: parseFloat(assessTarget.mcq_percentage) || 0,
      submittedDate: assessTarget.mcq_submitted_date || "—"
    } : null;

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
              {assessTarget.hrmsId} · {t("assessment.lastAssessed")}: {assessTarget.lastDate}
            </p>
          </div>
          <button 
            className="sdom-btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px" }}
            onClick={() => setScreenMode("default")}
          >
            ← {t("buttons.back")}
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
              <strong>{t("assessment.knowledgeOfRules")}</strong>
              <span className="sm2-assess-sec-meta">{t("assessment.autoCalculatedMcq")}</span>
            </div>
            <span className="sm2-assess-live-marks">{knowledge} / 25</span>
          </div>

          <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
            {isMcqCompleted ? (
              <div className="sm2-mcq-success-card">
                <div className="sm2-mcq-card-header">
                  <div className="sm2-mcq-status">
                    <span className="sm2-status-dot green"></span>
                    <span className="sm2-status-text text-green font-semibold">{t("assessment.mcqTestCompleted")}</span>
                  </div>
                  <div className="sm2-mcq-lock-badge">
                    <Lock size={12} />
                    <span>{t("assessment.readOnlySynced")}</span>
                  </div>
                </div>

                <div className="sm2-mcq-card-body">
                  <div className="sm2-mcq-score-display">
                    <div className="sm2-mcq-large-score">
                      <strong>{mcqData.correctCount}</strong>
                      <span>/ 25</span>
                    </div>
                    <div className="sm2-mcq-percentage-badge">
                      {mcqData.percentage}% {t("assessment.scoreText")}
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
                      <span className="sm2-mcq-meta-label">{t("assessment.submittedOn")}</span>
                      <strong className="sm2-mcq-meta-val">{mcqData.submittedDate}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("assessment.assessedEntity")}</span>
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
                      {isActivated ? t("assessment.mcqTestActive") : t("assessment.mcqTestLocked")}
                    </span>
                  </div>
                  <div className="sm2-mcq-lock-badge">
                    <Lock size={12} />
                    <span>{t("assessment.readOnly")}</span>
                  </div>
                </div>

                <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                    <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? t("assessment.awaitingAttempt") : t("assessment.examLocked")}</h4>
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                        {isActivated ? (
                          <span>{t("assessment.awaitingAttemptDescSM").replace("{name}", assessTarget.name)}</span>
                        ) : (
                          <span>{t("assessment.examLockedDescSM")}</span>
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
                        onToggleMcqStatus(assessTarget.assessment_id, isActivated ? 'Locked' : 'Active');
                      }}
                    >
                      {isActivated ? t("assessment.deactivateSafetyExam") : t("assessment.activateSafetyExam")}
                    </button>
                  </div>

                  <div className="sm2-mcq-meta-grid">
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("assessment.assessmentStatus")}</span>
                      <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? t("assessment.activeAwaitingAttempt") : t("assessment.lockedAwaitingActivation")}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("assessment.assessedEntity")}</span>
                      <strong className="sm2-mcq-meta-val">{assessTarget.name}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("assessment.totalQuestions")}</span>
                      <strong className="sm2-mcq-meta-val">{t("assessment.totalQuestionsVal")}</strong>
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
                  <strong>{t("ynSections." + sec.key + ".title") || sec.title}</strong>
                  <span className="sm2-assess-sec-meta">{count} {t("assessment.criteriaText")} · {weight} {t("assessment.marksEach")} · {t("assessment.totalText")} {sec.outOf}</span>
                </div>
                <span className="sm2-assess-live-marks">{secScore} / {sec.outOf}</span>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((criteriaText, idx) => {
                  const currentAnswer = assessForm[sec.key]?.[idx] || "No";
                  const localizedCriteria = t("ynSections." + sec.key + ".criteria." + idx);
                  const criteriaDisplay = localizedCriteria.startsWith("ynSections.") ? criteriaText : localizedCriteria;
                  return (
                    <div key={idx} className="sm2-yn-row">
                      <span className="sm2-yn-label">{idx + 1}. {criteriaDisplay}</span>
                      <div className="sm2-yn-btns">
                        <button
                          type="button" disabled={!isMcqCompleted || assessLocked}
                          className={currentAnswer === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                          style={{ cursor: (!isMcqCompleted || assessLocked) ? "not-allowed" : "pointer" }}
                          onClick={() => toggleYN(sec.key, idx, "Yes")}
                        >
                          {t("buttons.yes")}
                        </button>
                        <button
                          type="button" disabled={!isMcqCompleted || assessLocked}
                          className={currentAnswer === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                          style={{ cursor: (!isMcqCompleted || assessLocked) ? "not-allowed" : "pointer" }}
                          onClick={() => toggleYN(sec.key, idx, "No")}
                        >
                          {t("buttons.no")}
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
            <div><strong>{t("assessment.additionalDetails")}</strong><span className="sm2-assess-sec-meta">{t("assessment.mandatoryFields")}</span></div>
          </div>
          <div className="sm2-assess-form" style={{ marginTop: 12 }}>
            <div className="sm2-form-field">
              <label>{t("assessment.alcoholicStatus")} <span style={{ color: "#dc2626" }}>*</span></label>
              <select
                disabled={!isMcqCompleted || assessLocked}
                value={assessForm.alcoholicStatus || ""}
                onChange={e => setAssessForm(p => ({ ...p, alcoholicStatus: e.target.value }))}
                required
              >
                <option value="">{t("assessment.select")}</option>
                <option value="Non-Alcoholic">{t("assessment.nonAlcoholic")}</option>
                <option value="Alcoholic">{t("assessment.alcoholic")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("assessment.pmeStatusLabel")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.pmeStatus || "Fit"}
                onChange={e => setAssessForm(p => ({ ...p, pmeStatus: e.target.value }))}>
                <option value="Fit">{t("assessment.fit")}</option>
                <option value="Unfit">{t("assessment.unfit")}</option>
                <option value="Pending">{t("assessment.pending")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("assessment.refStatusLabel")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.refStatus || "Cleared"}
                onChange={e => setAssessForm(p => ({ ...p, refStatus: e.target.value }))}>
                <option value="Cleared">{t("assessment.cleared")}</option>
                <option value="Pending">{t("assessment.pending")}</option>
                <option value="Failed">{t("assessment.failed")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("assessment.automaticTraining")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.automaticTraining || "Not Required"}
                onChange={e => setAssessForm(p => ({ ...p, automaticTraining: e.target.value }))}>
                <option value="Not Required">{t("assessment.notRequired")}</option>
                <option value="Recommended">{t("assessment.recommended")}</option>
                <option value="Mandatory">{t("assessment.mandatory")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("assessment.counsellingLabel")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.counselling || "Not Required"}
                onChange={e => setAssessForm(p => ({ ...p, counselling: e.target.value }))}>
                <option value="Not Required">{t("assessment.notRequired")}</option>
                <option value="Recommended">{t("assessment.recommended")}</option>
                <option value="Mandatory">{t("assessment.mandatory")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("assessment.dateOfAppointment")}</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.dateOfAppointment || ""}
                onChange={e => setAssessForm(p => ({ ...p, dateOfAppointment: e.target.value }))} />
            </div>
            <div className="sm2-form-field">
              <label>{t("assessment.workingSince")}</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.workingSince || ""}
                onChange={e => setAssessForm(p => ({ ...p, workingSince: e.target.value }))} />
            </div>
            <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
              <label>{t("assessment.remarksForTI")}</label>
              <textarea rows={3} disabled={!isMcqCompleted || assessLocked} value={assessForm.remarks || ""}
                onChange={e => setAssessForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder={isMcqCompleted ? t("assessment.remarksPlaceholderActive") : t("assessment.remarksPlaceholderLocked")} />
            </div>
          </div>
        </div>

        {/* ── Live Score Bar ── */}
        <div className="sm2-live-score" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div><label>{t("assessment.knowledgeMcq")}</label><strong>{knowledge}/25</strong></div>
          <div><label>{t("assessment.ynScore")}</label><strong>{ynTotal}/75</strong></div>
          <div><label>{t("assessment.grandTotal")}</label><strong style={{ color: CAT_COLOR[liveCat], fontSize: 22 }}>{liveTotal}/100</strong></div>
          <div><label>{t("assessment.categoryLabel")}</label><span className="sm2-badge" style={{ background: CAT_BG[liveCat], color: CAT_COLOR[liveCat], fontSize: 13, padding: "4px 14px" }}>{t("assessment.categoryText")} {liveCat}</span></div>
        </div>

        {assessLocked && (
          <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>
            {t("assessment.assessmentSubmittedLocked")}
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
                {t("buttons.saveAsDraft")}
              </button>
              <button 
                className="sdom-btn-primary" 
                style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: isMcqCompleted ? "#2563eb" : "#cbd5e1", color: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} 
                disabled={!isMcqCompleted} 
                onClick={() => submitAssessment(false)}
              >
                {t("buttons.submitForTI")}
              </button>
            </div>
            {!isMcqCompleted && (
              <div style={{ color: "#dc2626", fontSize: "12.5px", fontWeight: "700", textAlign: "center", background: "#fef2f2", border: "1px solid #fee2e2", padding: "10px", borderRadius: "8px" }}>
                {t("assessment.mcqLockedAlert")}
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
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{t("assessment.assessPointsmen")}</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            {t("assessment.assessPointsmenDesc")}
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            type="text"
            placeholder={t("assessment.searchPointsmanPlaceholder")}
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
            {t("buttons.clear")}
          </button>
        )}
      </div>

      {filteredDrafts.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <CheckCircle2 size={40} color="#16a34a" />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t("assessment.allAssessmentsComplete")}</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{t("assessment.noPointsmenAssess")}</p>
        </div>
      ) : (
        <div className="sdom-table-wrap" style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("sidebar.pointsmen")}</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("login.hrmsId")}</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("assessment.lastAssessed")}</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("assessment.mcqExamStatus")}</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assessment Status</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Score</th>
                <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>{t("workflow.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map((d) => {
                const isCompleted = d.mcq_status === 'Completed';
                const isActivated = d.mcq_status === 'Active';
                const correctCount = d.mcq_correct_count || 0;

                return (
                  <tr key={d.pointsmanId || d.hrmsId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1e3a8a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{d.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>{t("sidebar.pointsmen")}</div>
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
                          ✓ {t("assessment.completed")} ({correctCount}/25)
                        </span>
                      ) : isActivated ? (
                        <span className="sdom-badge sdom-badge-warning" style={{ padding: "4px 8px" }}>
                          {t("assessment.examActiveStatus")}
                        </span>
                      ) : (
                        <span className="sdom-badge sdom-badge-neutral" style={{ padding: "4px 8px", background: "#f1f5f9", color: "#475569" }}>
                          {t("assessment.examLockedStatus")}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="sdom-badge sdom-badge-neutral" style={{ padding: "4px 8px", background: "#eff6ff", color: "#1e40af", textTransform: "capitalize" }}>
                        {d.assessment_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "700", fontSize: "13px" }}>
                      {d.percentage !== null && d.percentage !== undefined ? `${parseFloat(d.percentage).toFixed(1)}%` : "—"}
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
                            onClick={() => onToggleMcqStatus(d.assessment_id, isActivated ? 'Locked' : 'Active')}
                          >
                            {isActivated ? t("assessment.deactivateTest") : t("assessment.activateTest")}
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
                          {t("buttons.assess")}
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
          <h4 style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "700" }}>{t("assessment.assessmentHistory")}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {submittedAssessments.map(r => {
              const statusClassMap = {
                Approved: "sdom-badge-success",
                Completed: "sdom-badge-success",
                Active: "sdom-badge-success",
                Pending: "sdom-badge-warning",
                Submitted: "sdom-badge-warning",
                Rejected: "sdom-badge-danger",
                Expired: "sdom-badge-danger",
                Overdue: "sdom-badge-danger"
              };
              const statusClass = statusClassMap[r.approvalStatus] || "sdom-badge-neutral";
              
              const displayScore = r.total !== null && r.total !== undefined ? `${r.total}/100` : t("assessment.notEvaluated");

              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>{r.name}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>({r.hrmsId})</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "12px" }}>{t("assessment.dateCol")}: {r.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {r.total !== null && r.total !== undefined && (
                      <span className="sdom-badge" style={{ background: CAT_BG[r.grade] || "#f1f5f9", color: CAT_COLOR[r.grade] || "#475569", border: `1px solid ${CAT_COLOR[r.grade]}22` }}>{t("assessment.catShort")} {r.grade}</span>
                    )}
                    <strong style={{ fontSize: "14px", color: "#334155" }}>{displayScore}</strong>
                    <span className={`sdom-badge ${statusClass}`} style={{ padding: "4px 8px" }}>{r.approvalStatus}</span>
                    {r.report_url && (
                      <a
                        href={r.report_url.startsWith("http") ? r.report_url : `http://127.0.0.1:5000${r.report_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sdom-btn-outline"
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#fff",
                          border: "1px solid #cbd5e1",
                          color: "#1e293b",
                          cursor: "pointer"
                        }}
                      >
                        View Report
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}