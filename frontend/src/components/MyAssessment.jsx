import { useState, useMemo } from "react";
import { ShieldCheck, Clock, Award, FileText, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Search, PlayCircle, Lock } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

const formatQuarterPeriod = (periodStr) => {
  if (!periodStr) return "—";
  const match = periodStr.match(/Q([1-4])\s+(\d{4})/i);
  if (!match) return periodStr;
  const quarter = parseInt(match[1], 10);
  const year = match[2];
  switch (quarter) {
    case 1: return `01 Jan ${year} – 31 Mar ${year}`;
    case 2: return `01 Apr ${year} – 30 Jun ${year}`;
    case 3: return `01 Jul ${year} – 30 Sep ${year}`;
    case 4: return `01 Oct ${year} – 31 Dec ${year}`;
    default: return periodStr;
  }
};


/* ─── HELPERS ─── */
function getCategory(score) {
  if (score >= 80) return "A";
  if (score >= 50) return "B";
  if (score >= 26) return "C";
  return "D";
}
const getCategoryColor = (cat) => {
  return { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" }[cat] || "#6b7280";
};
const getCategoryBg = (cat) => {
  return { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" }[cat] || "#f3f4f6";
};

export default function MyAssessment({
  myAssessSelected,
  setMyAssessSelected,
  performanceSummaryText,
  testQuestions,
  testAssigned,
  mcqTest,
  startTestAttempt,
  history,
  openScorecard,
  handleReattempt,
  activeQIdx,
  setActiveQIdx,
  testResponses,
  setTestResponses,
  handleSubmitTestAttempt,
  screenMode,
  setScreenMode,
  fullName,
  employeeId,
  profileData,
  roleTitle = 'Pointsman',
  assessedByTitle = '{assessedByTitle}',
  questionBankCount,
  assessmentStatus,
  assessmentDetails,
  activeTest,
  setActiveTest,
  currentQuestion,
  setCurrentQuestion,
  responses,
  setResponses,
  handleSelectOption,
  submitTest
}) {
  const { t } = useLanguage();
  // Local state parameters that are local to pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDateSearch, setHistoryDateSearch] = useState("");
  const [historySortOrder, setHistorySortOrder] = useState("date-desc");

  // Re-run filter logic inside to avoid parent coupling
  const filteredHistory = useMemo(() => {
    let list = history.filter(item =>
      historyDateSearch.trim() === "" || item.date.includes(historyDateSearch.trim())
    );
    if (historySortOrder === "score-asc") list = [...list].sort((a, b) => a.totalScore - b.totalScore);
    else if (historySortOrder === "score-desc") list = [...list].sort((a, b) => b.totalScore - a.totalScore);
    else if (historySortOrder === "date-asc") list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    else if (historySortOrder === "date-desc") list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [history, historyDateSearch, historySortOrder]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentPage = Math.min(historyPage, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

    const renderMyAssessment = () => {
    /* Scorecard detail view */
    if (myAssessSelected) {
      const sc = myAssessSelected;
      const cat = getCategory(sc.totalScore);
      const liveTotal = sc.totalScore || 0;
      const performanceSummary = performanceSummaryText;

      return (
        <div className="ti2-card animate-fade-in" style={{ padding: "24px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
          <div className="ti2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a"/> {t("assessment.detailedScorecard")}</h2>
            <button className="ti2-primary-btn" onClick={() => setMyAssessSelected(null)}>{t("buttons.returnToHistory")}</button>
          </div>

          <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
            <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${getCategoryColor(cat) || "#2563eb"}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
              <strong style={{ fontSize: "24px", color: getCategoryColor(cat) || "#2563eb", fontWeight: "800" }}>{liveTotal}</strong>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/100</span>
            </div>
            <div>
              <span className="pm-cat-badge-lg" style={{ background: getCategoryBg(cat), color: getCategoryColor(cat), display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                {t("assessment.finalCategory")}: {t("assessment.categoryCol")} {cat}
              </span>
              <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{sc.assessmentPeriod} - {t("assessment.selfCompliance")}</p>
              <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{t("assessment.attemptCompleted")}: {sc.date} &nbsp;·&nbsp; {t("assessment.assessedByCol")}: {sc.assessedBy || assessedByTitle}</p>
            </div>
          </div>

          {/* Dynamic Performance Summary */}
          <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 {t("assessment.evaluationSummary")}</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{performanceSummary || `${t("dashboard.latestScore")}: ${liveTotal}/100.`}</p>
          </div>

          {/* Competency Module Breakdown */}
          <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>{t("assessment.safetyDomainBreakdown")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(sc.sections || []).map(s => {
                const spc = Math.round((s.marks / s.outOf) * 100);
                const barColor = spc >= 80 ? "#16a34a" : spc >= 50 ? "#2563eb" : spc >= 26 ? "#d97706" : "#dc2626";
                return (
                  <div key={s.title} className="pm-sc-section-row" style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px" }}>
                    <span className="pm-sc-section-name" style={{ width: "260px", fontWeight: "600", color: "#334155" }}>{s.title}</span>
                    <div className="pm-sc-bar-wrap" style={{ flexGrow: 1, height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                      <div className="pm-sc-bar-fill" style={{ width: `${spc}%`, height: "100%", background: barColor, borderRadius: "999px" }} />
                    </div>
                    <span className="pm-sc-section-marks" style={{ width: "60px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{s.marks}/{s.outOf}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complete MCQ Question Review */}
          <div className="pm-mcq-review-panel" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
            <div className="pm-chart-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} color="#475569"/>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>{t("assessment.questionReview")}</h3>
            </div>
            <p className="pm-subtitle" style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "20px" }}>
              {t("assessment.questionReviewDesc")}
            </p>
            <div className="pm-review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {testQuestions.map((q, qIndex) => {
                const selectedOpt = sc.responses ? sc.responses[qIndex] : null;
                const isCorrect = selectedOpt === q.answer;
                return (
                  <div key={qIndex} className={`pm-review-question-card ${isCorrect ? "correct-card" : "wrong-card"}`}>
                    <div className="pm-rq-header">
                      <span className="pm-rq-number">Question {qIndex + 1}</span>
                      {isCorrect ? (
                        <span className="pm-rq-badge success">{t("assessment.correctBadge")} (+4 {t("assessment.marks") || "Marks"})</span>
                      ) : (
                        <span className="pm-rq-badge danger">{t("assessment.incorrectBadge")} (0 {t("assessment.marks") || "Marks"})</span>
                      )}
                    </div>
                    <h4 className="pm-rq-text">{q.text}</h4>
                    <div className="pm-rq-options-grid">
                      {q.options.map((opt, oIdx) => {
                        const wasSelected = selectedOpt === oIdx;
                        const isOptCorrect = q.answer === oIdx;
                        let optClass = "";
                        if (wasSelected) optClass = isCorrect ? "opt-selected-correct" : "opt-selected-wrong";
                        else if (isOptCorrect) optClass = "opt-correct-unselected";
                        return (
                          <div key={oIdx} className={`pm-rq-option-item ${optClass}`}>
                            <span className="font-mono opt-prefix">{["A","B","C","D"][oIdx]}</span>
                            <span className="opt-label-text">{opt}</span>
                            {wasSelected && <span className="opt-user-tag">{isCorrect ? "✓ Selected" : "✗ Selected"}</span>}
                            {!wasSelected && isOptCorrect && <span className="opt-correct-tag">✓ Correct Key</span>}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div style={{ marginTop: "16px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f97316", fontSize: "12.5px", color: "#334155" }}>
                        <strong style={{ color: "#c2410c" }}>💡 {t("assessment.safetyExplanation")}: </strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    let activationKey = `pm_test_activated_${employeeId}`;
    if (roleTitle === "Station Master") {
      activationKey = `sm_test_activated_${employeeId}`;
    } else if (roleTitle === "Train Manager") {
      activationKey = `tm_test_activated_${employeeId}`;
    } else if (roleTitle === "Station Superintendent") {
      activationKey = `ss_test_activated_${employeeId}`;
    } else if (roleTitle === "Traffic Inspector") {
      activationKey = `ti_exam_assigned_${employeeId}`;
    }
    const isActivated = localStorage.getItem(activationKey) === "true";
    const isTestPending = isActivated || (testAssigned === "Assigned" && (!mcqTest || !mcqTest.completed));
    const testActive = isTestPending && isActivated;
    const testLocked = isTestPending && !isActivated;

    const headers = {
      "Period": t("assessment.periodCol"),
      "Date": t("assessment.dateCol"),
      "Score Scale": t("assessment.scoreScaleCol"),
      "Category": t("assessment.categoryCol"),
      "Assessed By": t("assessment.assessedByCol"),
      "Status": t("assessment.statusCol"),
      "": ""
    };

    /* History list */
    return (
      <section className="sm2-card">
        {/* MCQ Assessment Assignment Banner */}
        {roleTitle === "Pointsman" ? (
          <>
            {assessmentStatus === "Not Assigned" && (
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "1.5px solid #cbd5e1",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                  <div style={{
                    background: "#e2e8f0",
                    borderRadius: 50,
                    width: 42,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Lock size={22} color="#64748b"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#334155" }}>
                      Assessment Status: Not Assigned
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.4 }}>
                      No active assessment is currently assigned by your supervisor.
                      <br />
                      Please wait until an assessment is activated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {assessmentStatus === "Active" && (
              <div style={{
                background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                border: "1.5px solid #fed7aa",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                  <div style={{
                    background: "#ffedd5",
                    borderRadius: 50,
                    width: 42,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={22} color="#ea580c"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#c2410c" }}>
                      Assessment Status: Active
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: 13, color: "#9a3412", marginBottom: 14 }}>
                      <div><strong>Assigned By:</strong> {assessmentDetails?.assigned_by || "Station Master"}</div>
                      <div><strong>Assigned Date:</strong> {assessmentDetails?.assigned_date ? new Date(assessmentDetails.assigned_date).toLocaleDateString() : "—"}</div>
                      <div><strong>Due Date:</strong> {assessmentDetails?.due_date ? new Date(assessmentDetails.due_date).toLocaleDateString() : "—"}</div>
                    </div>
                    {questionBankCount < 25 && (
                      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#dc2626", fontWeight: "700", lineHeight: 1.4 }}>
                        ⚠️ {t("assessment.questionBankMissing")}
                      </p>
                    )}
                    <button
                      onClick={startTestAttempt}
                      disabled={questionBankCount < 25}
                      style={{
                        background: questionBankCount < 25 ? "#cbd5e1" : "#ea580c",
                        color: questionBankCount < 25 ? "#94a3b8" : "#ffffff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 8,
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: questionBankCount < 25 ? "not-allowed" : "pointer",
                        boxShadow: questionBankCount < 25 ? "none" : "0 4px 6px rgba(234, 88, 12, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      {profileData?.exam_status === "Active" ? "Continue Assessment" : "Start Assessment"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {assessmentStatus === "Completed" && (
              <div style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                border: "1.5px solid #bbf7d0",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                  <div style={{
                    background: "#dcfce7",
                    borderRadius: 50,
                    width: 42,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={22} color="#16a34a"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#14532d" }}>
                      Assessment Status: Completed
                    </h3>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#166534", lineHeight: 1.4 }}>
                      Your assessment has already been completed.
                      <br />
                      No further action is required.
                    </p>
                    <div style={{ display: "flex", gap: 24, fontSize: 13, background: "#ffffff", padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0", width: "fit-content" }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Score</span>
                        <strong style={{ color: "#0f172a", fontSize: 14 }}>{assessmentDetails?.score ? `${assessmentDetails.score}%` : "—"}</strong>
                      </div>
                      <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: 20 }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Completion Date</span>
                        <strong style={{ color: "#0f172a", fontSize: 14 }}>{assessmentDetails?.completion_date ? new Date(assessmentDetails.completion_date).toLocaleDateString() : "—"}</strong>
                      </div>
                      <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: 20 }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Result</span>
                        <span className="sdom-badge sdom-badge-success" style={{ display: "inline-block", marginTop: 2, padding: "2px 8px", fontSize: 11 }}>
                          {assessmentDetails?.result || "FIT"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {testActive && (
              <div style={{
                background:"linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                border:"1.5px solid #fed7aa",
                borderRadius:12,
                padding:20,
                marginBottom:24,
                boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <div style={{display:"flex", gap:16, alignItems:"start"}}>
                  <div style={{
                    background:"#ffedd5",
                    borderRadius:50,
                    width:42,
                    height:42,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    flexShrink:0
                  }}>
                    <ShieldCheck size={22} color="#ea580c"/>
                  </div>
                  <div style={{flex:1}}>
                    <h3 style={{margin:"0 0 6px", fontSize:16, fontWeight:700, color:"#c2410c"}}>
                      ⚠️ {t("assessment.pendingAssessment")}
                    </h3>
                    <p style={{margin:"0 0 14px", fontSize:13, color:"#9a3412", lineHeight:1.4}}>
                      {t("assessment.pendingAssessmentDesc").replace("{assessedByTitle}", assessedByTitle)}
                    </p>
                    {questionBankCount < 25 && (
                      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#dc2626", fontWeight: "700", lineHeight: 1.4 }}>
                        ⚠️ {t("assessment.questionBankMissing")}
                      </p>
                    )}
                    <button
                      onClick={startTestAttempt}
                      disabled={questionBankCount < 25}
                      style={{
                        background: questionBankCount < 25 ? "#cbd5e1" : "#ea580c",
                        color: questionBankCount < 25 ? "#94a3b8" : "#ffffff",
                        border:"none",
                        padding:"10px 20px",
                        borderRadius:8,
                        fontSize:13.5,
                        fontWeight:700,
                        cursor: questionBankCount < 25 ? "not-allowed" : "pointer",
                        boxShadow: questionBankCount < 25 ? "none" : "0 4px 6px rgba(234, 88, 12, 0.2)",
                        display:"flex",
                        alignItems:"center",
                        gap:8
                      }}
                    >
                      {t("buttons.startAssessment")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {testLocked && (
              <div style={{
                background:"linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)",
                border:"1.5px solid #fca5a5",
                borderRadius:12,
                padding:20,
                marginBottom:24,
                boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <div style={{display:"flex", gap:16, alignItems:"start"}}>
                  <div style={{
                    background:"#fee2e2",
                    borderRadius:50,
                    width:42,
                    height:42,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    flexShrink:0
                  }}>
                    <Lock size={22} color="#dc2626"/>
                  </div>
                  <div style={{flex:1}}>
                    <h3 style={{margin:"0 0 6px", fontSize:16, fontWeight:700, color:"#991b1b"}}>
                      🔒 {t("assessment.examLocked")}
                    </h3>
                    <p style={{margin:0, fontSize:13, color:"#991b1b", lineHeight:1.4}}>
                      {t("assessment.examLockedDesc")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isTestPending && (
              <div style={{
                background:"#f0fdf4",
                border:"1.5px solid #bbf7d0",
                borderRadius:12,
                padding:18,
                marginBottom:24,
                display:"flex",
                alignItems:"center",
                gap:14
              }}>
                <ShieldCheck size={24} color="#16a34a"/>
                <div style={{flex:1}}>
                  <h3 style={{margin:"0 0 2px", fontSize:14.5, fontWeight:700, color:"#14532d"}}>
                    {t("assessment.upToDate")}
                  </h3>
                  <p style={{margin:0, fontSize:12, color:"#166534"}}>
                    {t("assessment.upToDateDesc")}
                  </p>
                </div>
                <div style={{display:"flex", gap:16, fontSize:12, textAlign:"right"}}>
                  <div>
                    <span style={{color:"#166534", display:"block"}}>{t("dashboard.latestScore")}</span>
                    <strong style={{color:"#14532d", fontSize:13}}>{history.length > 0 ? `${history[0].totalScore}%` : "—"}</strong>
                  </div>
                  <div style={{borderLeft:"1px solid #bbf7d0", paddingLeft:16}}>
                    <span style={{color:"#166534", display:"block"}}>{t("profile.pmeStatus")}/{t("profile.refStatus")} Due</span>
                    <strong style={{color:"#14532d", fontSize:13}}>{profileData?.ref_next_due_date || profileData?.pme_next_due_date || "—"}</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="sm2-card-hdr"><h2>{t("assessment.historyTitle")}</h2></div>
        <p className="sm2-subtitle">{t("assessment.historySubtitle")}</p>

        {/* Summary strip */}
        <div className="sm2-myassess-summary">
          <div className="sm2-report-mini">
            <label>{t("dashboard.totalAttempts")}</label>
            <strong>{history.length}</strong>
          </div>
          <div className="sm2-report-mini">
            <label>{t("dashboard.latestScore")}</label>
            <strong>{history[0]?.totalScore !== undefined && history[0]?.totalScore !== null ? `${history[0].totalScore}%` : "—"}</strong>
          </div>
          <div className="sm2-report-mini">
            <label>{t("dashboard.averageScore")}</label>
            <strong>{
              (() => {
                const regs = history;
                return regs.length ? `${Math.round(regs.reduce((s, a) => s + (a.totalScore || 0), 0) / regs.length)}%` : "—";
              })()
            }</strong>
          </div>
          <div className="sm2-report-mini">
            <label>{t("dashboard.currentCategory")}</label>
            <strong style={{color: getCategoryColor(getCategory(history[0]?.totalScore || 0))}}>
              {history[0] ? `${t("assessment.categoryCol")} ${getCategory(history[0].totalScore || 0)}` : "—"}
            </strong>
          </div>
        </div>

        {/* List */}
        <div className="sm2-myassess-list">
          <div className="sm2-myassess-head">
            {["Period","Date","Score Scale","Category","Assessed By","Status",""].map(h =>
              <span key={h}>{headers[h] || h}</span>)}
          </div>
          {history.map((sc, index) => {
            const cat = getCategory(sc.totalScore);
            return (
              <button key={sc.result_id || sc.id || index} className="sm2-myassess-row" onClick={() => setMyAssessSelected(sc)}>
                <span title={`Cycle: ${sc.assessmentPeriod}\nDuration: ${formatQuarterPeriod(sc.assessmentPeriod)}`}>
                  <strong>{formatQuarterPeriod(sc.assessmentPeriod)}</strong>
                </span>
                <span>{sc.date}</span>
                <span><strong>{sc.totalScore}%</strong></span>
                <span>
                  <span className="sm2-badge" style={{background:getCategoryBg(cat),color:getCategoryColor(cat)}}>
                    {sc.isOnlineExam ? t("assessment.cbtExam") : `${t("assessment.categoryCol")} ${cat}`}
                  </span>
                </span>
                <span style={{fontSize:11,color:"#64748b"}}>{sc.assessedBy || "—"}</span>
                <span>
                  <span className={`sm2-status-pill sm2-status-${(sc.approvalStatus || "approved").toLowerCase()}`}>{sc.approvalStatus || t("assessment.approved")}</span>
                </span>
                <span style={{color:"#2563eb",fontSize:12,fontWeight:600}}>{t("buttons.viewForm")}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  /* ═══════════════════════════════════════
     RENDER: TAKE TEST SCREEN (mirrors SM renderTakeTest)
  ═══════════════════════════════════════ */
  const renderTakeTest = () => {
    const question = testQuestions[activeQIdx];
    const answeredCount = testResponses.filter(r => r !== null && r !== undefined).length;
    const completionRate = Math.round((answeredCount / 25) * 100);
    const unansweredCount = 25 - answeredCount;

    return (
      <div className="sdom-exam-layout" style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999999,
        background:"#f1f5f9", display:"flex", flexDirection:"column",
        height:"100vh", width:"100vw", overflow:"hidden", fontFamily:"'Poppins', sans-serif"
      }}>
        <header style={{
          background:"#1e293b", color:"#ffffff", padding:"16px 24px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          boxShadow:"0 4px 6px -1px rgba(0,0,0,0.1)", height:"70px", flexShrink:0
        }}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <ShieldCheck size={28} color="#ea580c"/>
            <div>
              <h1 style={{fontSize:18, fontWeight:800, margin:0, color:"#ffffff", letterSpacing:"0.5px"}}>
                {roleTitle.toUpperCase()} {t("assessment.title").toUpperCase()}
              </h1>
              <p style={{margin:0, fontSize:11, color:"#94a3b8", fontWeight:500}}>
                {t("assessment.subtitle")}
              </p>
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:16}}>
            <div style={{background:"#334155", padding:"6px 16px", borderRadius:8, fontSize:13, fontWeight:700, color:"#cbd5e1", border:"1px solid #475569"}}>
              ⚙️ {t("assessment.status") || "STATUS"}: <span style={{color:"#ea580c"}}>{t("assessment.activeSession")}</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm(t("assessment.confirmAbort"))) {
                  setScreenMode("default");
                }
              }}
              style={{padding:"8px 18px", borderRadius:8, fontSize:13, background:"#ef4444", color:"#ffffff", border:"none", fontWeight:700, cursor:"pointer"}}
            >
              {t("buttons.exitExam")}
            </button>
          </div>
        </header>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderBottom:"1.5px solid #e2e8f0", padding:"12px 24px", height:"50px", flexShrink:0, fontSize:13.5, color:"#334155"}}>
          <div>{t("assessment.candidate")}: <strong style={{color:"#1e3a8a"}}>{fullName}</strong> &nbsp;|&nbsp; {t("assessment.hrms")}: <strong style={{color:"#1e3a8a"}}>{employeeId}</strong> &nbsp;|&nbsp; {t("assessment.station")}: <strong>{profileData?.station_name || profileData?.stationName || ''}</strong></div>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <span style={{fontWeight:600}}>{t("assessment.progress")}: <strong style={{color:"#ea580c"}}>{answeredCount} / 25 {t("assessment.answered")}</strong> ({completionRate}%)</span>
            <div style={{width:140, height:8, background:"#e2e8f0", borderRadius:4, overflow:"hidden"}}>
              <div style={{width:`${completionRate}%`, height:"100%", background:"#ea580c", borderRadius:4}}/>
            </div>
          </div>
        </div>

        <div className="sdom-exam-body" style={{display:"grid", gridTemplateColumns:"1fr 340px", flex:1, overflow:"hidden"}}>
          {/* Left: Question Pane */}
          <div style={{padding:"32px 40px", display:"flex", flexDirection:"column", background:"#f8fafc", overflowY:"auto", height:"100%"}}>
            <div style={{background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, padding:36, boxShadow:"0 10px 15px -3px rgba(0,0,0,0.05)", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", marginBottom:24}}>
              <div>
                <span style={{fontSize:12.5, fontWeight:800, color:"#ea580c", background:"#fff7ed", padding:"6px 14px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.8px"}}>
                  {t("assessment.compulsoryQuestion")} {activeQIdx + 1} {t("assessment.of")} 25
                </span>
                <h2 style={{fontSize:22, fontWeight:700, color:"#0f172a", marginTop:24, marginBottom:28, lineHeight:1.5}}>{question.text}</h2>
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  {question.options.map((opt, oi) => {
                    const isSelected = testResponses[activeQIdx] === oi;
                    return (
                      <label key={oi} onClick={(e) => { e.preventDefault(); const r=[...testResponses]; r[activeQIdx]=oi; setTestResponses(r); }} style={{display:"flex", alignItems:"center", gap:16, padding:"18px 24px", border:isSelected ? "2.5px solid #ea580c" : "1.5px solid #e2e8f0", borderRadius:12, background:isSelected ? "#fff7ed" : "#ffffff", cursor:"pointer", boxShadow:isSelected ? "0 4px 6px rgba(234,88,12,0.08)" : "none", transition:"all 0.15s ease"}}>
                        <input type="radio" name={`pmq-${activeQIdx}`} checked={isSelected} readOnly style={{width:20, height:20, accentColor:"#ea580c"}}/>
                        <span style={{fontSize:15, fontWeight:800, color:isSelected?"#c2410c":"#64748b", width:24}}>{["A","B","C","D"][oi]}</span>
                        <span style={{fontSize:15, color:"#1e293b", fontWeight:isSelected?700:500}}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:12, padding:"16px 24px", boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"}}>
              <button disabled={activeQIdx===0} onClick={() => setActiveQIdx(p=>Math.max(0,p-1))} style={{padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:700, background:activeQIdx===0?"#f1f5f9":"#ffffff", color:activeQIdx===0?"#94a3b8":"#334155", border:"1.5px solid #cbd5e1", cursor:activeQIdx===0?"not-allowed":"pointer"}}>{t("buttons.previousQuestion")}</button>
              <div style={{fontSize:14, color:"#64748b"}}>
                {unansweredCount>0 ? <span style={{color:"#b45309"}}>⚠️ {unansweredCount} {t("assessment.questionsRemaining")}</span> : <span style={{color:"#16a34a"}}>✓ {t("assessment.allAnswered")}</span>}
              </div>
              <button disabled={activeQIdx===24} onClick={() => setActiveQIdx(p=>Math.min(24,p+1))} style={{padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:700, background:activeQIdx===24?"#f1f5f9":"#ffffff", color:activeQIdx===24?"#94a3b8":"#334155", border:"1.5px solid #cbd5e1", cursor:activeQIdx===24?"not-allowed":"pointer"}}>{t("buttons.nextQuestion")}</button>
            </div>
          </div>

          {/* Right: Navigator Sidebar */}
          <div style={{background:"#ffffff", borderLeft:"1.5px solid #e2e8f0", padding:"24px", display:"flex", flexDirection:"column", gap:20, overflowY:"auto", height:"100%"}}>
            <div style={{textAlign:"center", paddingBottom:16, borderBottom:"1.5px solid #f1f5f9"}}>
              <div style={{width:60, height:60, borderRadius:"50%", background:"#ffedd5", color:"#ea580c", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, margin:"0 auto 10px"}}>{fullName.charAt(0)}</div>
              <h3 style={{fontSize:15, fontWeight:700, color:"#1e293b", margin:0}}>{fullName}</h3>
              <span style={{fontSize:12, color:"#64748b", fontWeight:500}}>{t("assessment.hrms")}: {employeeId}</span>
            </div>
            <h4 style={{fontSize:12, fontWeight:800, color:"#475569", textTransform:"uppercase", letterSpacing:"0.6px", margin:0}}>{t("assessment.questionPalette")}</h4>
            <div className="sdom-keep-grid" style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, maxHeight:220, overflowY:"auto", paddingRight:4}}>
              {testQuestions.map((q, idx) => {
                const isCurrent = idx===activeQIdx;
                const isAnswered = testResponses[idx]!==null && testResponses[idx]!==undefined;
                let bg="#ffffff", border="1.5px solid #cbd5e1", color="#475569", fw="600";
                if (isCurrent) { bg="#ffedd5"; border="2px solid #ea580c"; color="#c2410c"; fw="800"; }
                else if (isAnswered) { bg="#dcfce7"; border="1.5px solid #86efac"; color="#15803d"; }
                else { bg="#fef3c7"; border="1.5px solid #fde047"; color="#a16207"; }
                return <button key={q.id || idx} onClick={()=>setActiveQIdx(idx)} style={{height:40, borderRadius:8, fontSize:13, fontWeight:fw, background:bg, border, color, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>{q.id}</button>;
              })}
            </div>
            <div style={{borderTop:"1.5px solid #f1f5f9", paddingTop:16, fontSize:12, color:"#64748b", display:"flex", flexDirection:"column", gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#dcfce7",border:"1.5px solid #86efac",borderRadius:4}}/><span>{t("assessment.attempted")}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#fef3c7",border:"1.5px solid #fde047",borderRadius:4}}/><span style={{color:"#a16207",fontWeight:600}}>{t("assessment.unattempted")}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#ffedd5",border:"2px solid #ea580c",borderRadius:4}}/><span>{t("assessment.currentFocus")}</span></div>
            </div>
            <div style={{marginTop:"auto", paddingTop:20, borderTop:"1.5px solid #f1f5f9"}}>
              <button
                disabled={unansweredCount>0}
                onClick={handleSubmitTestAttempt}
                style={{width:"100%", padding:"14px 16px", borderRadius:10, fontSize:14.5, fontWeight:800, background:unansweredCount>0?"#cbd5e1":"#16a34a", color:unansweredCount>0?"#94a3b8":"#ffffff", border:"none", cursor:unansweredCount>0?"not-allowed":"pointer", boxShadow:unansweredCount>0?"none":"0 4px 12px rgba(22,163,74,0.3)"}}
              >
                {t("buttons.submitExam")}
              </button>
              {unansweredCount>0 && <p style={{fontSize:11, color:"#b45309", margin:"8px 0 0", textAlign:"center", fontWeight:600}}>{t("assessment.allRequired")} ({unansweredCount} {t("assessment.remaining")})</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
     RENDER: TEST HISTORY (legacy — kept for internal dispatch)
  ═══════════════════════════════════════ */
  const renderHistoryPage = () => {
    // Top summary statistics calculated reactively:
    const totalAssessments = history.length;
    const latestScore = history.length ? history[0].totalScore : null;
    const averageScore = history.length
      ? Math.round(history.reduce((s, i) => s + i.totalScore, 0) / history.length)
      : 0;
    const latestCategory = latestScore !== null ? getCategory(latestScore) : "—";

    // Paginated history list
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
    const currentPage = Math.min(historyPage, totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

    return (
      <section className="pm-page-card animate-fade-in">
        <div className="pm-page-header">
          <h2>{t("assessment.historyTitle")}</h2>
        </div>
        <p className="pm-subtitle">{t("assessment.historySubtitle")}</p>

        {/* 4 Premium High-Fidelity Analytics Cards ({assessedByTitle} Alignment) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("dashboard.totalAttempts")}</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{totalAssessments} {t("assessment.attempts")}</div>
            </div>
          </div>

          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: "#f0fdf4", color: "#16a34a", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("dashboard.latestScore")}</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{latestScore !== null ? `${latestScore}/100` : "—"}</div>
            </div>
          </div>

          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: "#fff7ed", color: "#ea580c", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("dashboard.averageScore")}</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{averageScore}/100</div>
            </div>
          </div>

          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: getCategoryBg(latestCategory), color: getCategoryColor(latestCategory), width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("dashboard.currentCategory")}</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: getCategoryColor(latestCategory), marginTop: "2px" }}>
                {latestCategory !== "—" ? `${t("assessment.catShort")} ${latestCategory}` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Sort Panel */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "20px", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", width: "320px" }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder={t("assessment.searchByPeriod")}
              value={historyDateSearch}
              onChange={e => { setHistoryDateSearch(e.target.value); setHistoryPage(1); }}
              style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", color: "#334155" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px" }}>
            <ArrowUpDown size={14} color="#64748b" />
            <select 
              value={historySortOrder} 
              onChange={e => { setHistorySortOrder(e.target.value); setHistoryPage(1); }}
              style={{ border: "none", outline: "none", fontSize: "13px", color: "#334155", fontWeight: "600", cursor: "pointer" }}
            >
              <option value="date-desc">{t("assessment.newestFirst")}</option>
              <option value="date-asc">{t("assessment.oldestFirst")}</option>
              <option value="score-desc">{t("assessment.highestScoreFirst")}</option>
              <option value="score-asc">{t("assessment.lowestScoreFirst")}</option>
            </select>
          </div>
        </div>

        {/* Search empty state */}
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <Search size={36} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#475569", margin: "0 0 6px" }}>{t("assessment.noAttemptsFound")}</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{t("assessment.clearSearchHint")}</p>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("assessment.attemptNo")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("assessment.periodCol")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("assessment.assessmentDate")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("dashboard.score")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("assessment.categoryCol")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("assessment.assessedByCol")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("assessment.statusCol")}</th>
                  <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: "700", color: "#475569" }}>{t("assessment.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((record, index) => {
                  const absoluteIdx = filteredHistory.length - (startIndex + index);
                  const cat = getCategory(record.totalScore);
                  return (
                    <tr key={record.result_id || record.id || index} className="sdom-table-row-hover" style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
                      <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1e3a8a" }}>#{absoluteIdx}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", color: "#334155" }}>{record.assessmentPeriod}</td>
                      <td style={{ padding: "14px 18px", color: "#64748b" }}>{record.date}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "800", color: "#0f172a" }}>{record.totalScore} / 100</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span 
                          style={{ 
                            background: getCategoryBg(cat), 
                            color: getCategoryColor(cat), 
                            fontWeight: "800", 
                            fontSize: "12px", 
                            padding: "4px 10px", 
                            borderRadius: "6px",
                            textTransform: "uppercase" 
                          }}
                        >
                          {t("assessment.catShort")} {cat}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#334155", fontWeight: "500" }}>{record.assessedBy || "—"}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: "700", fontSize: "11px", padding: "4px 8px", borderRadius: "20px" }}>
                          {t("assessment.approved")}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button 
                          onClick={() => openScorecard(record)}
                          style={{ 
                            background: "#eff6ff", 
                            color: "#2563eb", 
                            border: "none", 
                            fontWeight: "700", 
                            padding: "6px 14px", 
                            borderRadius: "6px", 
                            cursor: "pointer", 
                            fontSize: "12.5px",
                            transition: "all 0.15s ease" 
                          }}
                        >
                          {t("buttons.viewForm")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {t("assessment.showingPage")} <b>{startIndex + 1}</b> {t("assessment.toPage")} <b>{Math.min(startIndex + itemsPerPage, filteredHistory.length)}</b> {t("assessment.ofPage")} <b>{filteredHistory.length}</b> {t("assessment.attempts")}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#ffffff", color: currentPage === 1 ? "#94a3b8" : "#334155", fontWeight: "600", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "12.5px" }}
                  >
                    {t("assessment.previous")}
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                    style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#ffffff", color: currentPage === totalPages ? "#94a3b8" : "#334155", fontWeight: "600", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "12.5px" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  /* ═══════════════════════════════════════
     RENDER: SCORECARD & QUESTION REVIEW
  ═══════════════════════════════════════ */
  const renderScorecardPage = () => {
    if (!selectedRecord) return (
      <section className="pm-page-card">
        <p className="pm-empty-state">{t("assessment.selectFromHistory")}</p>
      </section>
    );

    const cat = getCategory(selectedRecord.totalScore);

    return (
      <div className="ti2-card animate-fade-in" style={{ padding: "24px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        <div className="ti2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a"/> {t("assessment.detailedScorecard")}</h2>
          <button className="ti2-primary-btn" onClick={() => setScreenMode("default")}>{t("buttons.returnToHistory")}</button>
        </div>

        <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${getCategoryColor(cat)}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
            <strong style={{ fontSize: "24px", color: getCategoryColor(cat), fontWeight: "800" }}>{selectedRecord.totalScore}</strong>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/100</span>
          </div>
          <div>
            <span className="pm-cat-badge-lg" style={{ background: getCategoryBg(cat), color: getCategoryColor(cat), display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              {t("assessment.finalCategory")}: {t("assessment.categoryCol")} {cat}
            </span>
            <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{selectedRecord.assessmentPeriod} - {t("assessment.selfCompliance")}</p>
            <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{t("assessment.attemptCompleted")}: {selectedRecord.date} &nbsp;·&nbsp; {t("assessment.assessedByCol")}: {selectedRecord.assessedBy || assessedByTitle}</p>
          </div>
        </div>

        {/* Dynamic Performance Summary */}
        <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 {t("assessment.evaluationSummary")}</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{performanceSummaryText}</p>
        </div>

        {/* Competency Module Breakdown */}
        <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>{t("assessment.safetyDomainBreakdown")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selectedRecord.sections.map(s => {
              const spc = Math.round((s.marks / s.outOf) * 100);
              const barColor = getCategoryColor(getCategory(spc));
              return (
                <div key={s.title} className="pm-sc-section-row" style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px" }}>
                  <span className="pm-sc-section-name" style={{ width: "260px", fontWeight: "600", color: "#334155" }}>{s.title}</span>
                  <div className="pm-sc-bar-wrap" style={{ flexGrow: 1, height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div className="pm-sc-bar-fill" style={{ width: `${spc}%`, height: "100%", background: barColor, borderRadius: "999px" }} />
                  </div>
                  <span className="pm-sc-section-marks" style={{ width: "60px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{s.marks}/{s.outOf}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete MCQ Question Review */}
        <div className="pm-mcq-review-panel" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
          <div className="pm-chart-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} color="#475569"/>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>{t("assessment.questionReview")}</h3>
          </div>
          <p className="pm-subtitle" style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "20px" }}>
            {t("assessment.questionReviewDesc")}
          </p>

          <div className="pm-review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {testQuestions.map((q, qIndex) => {
              const selectedOpt = selectedRecord.responses ? selectedRecord.responses[qIndex] : null;
              const isCorrect = selectedOpt === q.answer;

              return (
                <div key={qIndex} className={`pm-review-question-card ${isCorrect ? "correct-card" : "wrong-card"}`}>
                  <div className="pm-rq-header">
                    <span className="pm-rq-number">{t("assessment.compulsoryQuestion")} {qIndex + 1}</span>
                    {isCorrect ? (
                      <span className="pm-rq-badge success">{t("assessment.correctBadge")} (+4 {t("assessment.marks")})</span>
                    ) : (
                      <span className="pm-rq-badge danger">{t("assessment.incorrectBadge")} (0 {t("assessment.marks")})</span>
                    )}
                  </div>
                  <h4 className="pm-rq-text">{q.text}</h4>

                  <div className="pm-rq-options-grid">
                    {q.options.map((opt, oIdx) => {
                      const wasSelected = selectedOpt === oIdx;
                      const isOptCorrect = q.answer === oIdx;
                      
                      let optClass = "";
                      if (wasSelected) {
                        optClass = isCorrect ? "opt-selected-correct" : "opt-selected-wrong";
                      } else if (isOptCorrect) {
                        optClass = "opt-correct-unselected";
                      }

                      return (
                        <div key={oIdx} className={`pm-rq-option-item ${optClass}`}>
                          <span className="font-mono opt-prefix">{["A", "B", "C", "D"][oIdx]}</span>
                          <span className="opt-label-text">{opt}</span>
                          {wasSelected && (
                            <span className="opt-user-tag">{isCorrect ? t("assessment.selectedCorrect") : t("assessment.selectedWrong")}</span>
                          )}
                          {!wasSelected && isOptCorrect && (
                            <span className="opt-correct-tag">{t("assessment.correctKey")}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Operational Safety Explanation */}
                  {q.explanation && (
                    <div style={{ marginTop: "16px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f97316", fontSize: "12.5px", color: "#334155" }}>
                      <strong style={{ color: "#c2410c" }}>💡 {t("assessment.safetyExplanation")}: </strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
     RENDER: CURRENT TEST (SCHEDULED)
  ═══════════════════════════════════════ */
  const renderCurrentTestsPage = () => {
    const isTestActivated = profileData?.assessment_status === "Pending";
    return (
      <section className="pm-page-card">
        <div className="pm-page-header">
          <h2>{t("assessment.title") || "Assigned Competency Trials"}</h2>
        </div>
        <p className="pm-subtitle">{t("assessment.subtitle") || "Mandatory periodically scheduled evaluation of SWR Rules and points shunting safety clearance."}</p>

        <div className="pm-current-tests">
          {!isTestActivated && testAssigned !== "Completed" ? (
            <div className="pm-no-test-banner" style={{ background: "#f8fafc", border: "2px dashed #cbd5e1" }}>
              <Lock size={40} color="#64748b" />
              <h3>{t("assessment.examLocked") || "Competency Exam Locked"}</h3>
              <p>{t("assessment.examLockedDesc") || `Your periodic evaluation has not been activated by the ${assessedByTitle} yet. Please request your ${assessedByTitle} to activate your test so you can attempt it.`}</p>
            </div>
          ) : testAssigned === "Completed" ? (
            <div className="pm-no-test-banner">
              <CheckCircle2 size={40} color="#16a34a" />
              <h3>{t("assessment.allCaughtUp") || "All caught up!"}</h3>
              <p>{t("assessment.allCaughtUpDesc") || "Your periodic evaluation is fully completed. Grade successfully filed to Station Supervisor records."}</p>
              
              {handleReattempt && (
                <button 
                  onClick={handleReattempt}
                  className="pm-start-btn" 
                  style={{ 
                    marginTop: "18px", 
                    background: "#f97316", 
                    border: "none",
                    fontWeight: "800",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)"
                  }}
                >
                  {t("assessment.reappearCbt")}
                </button>
              )}
            </div>
          ) : (
            <article className="pm-test-card-premium">
              <div className="pm-tc-header">
                <ClipboardList size={22} color="#f97316" />
                <div>
                  <h3>{t("assessment.pendingAssessment") || "Pointsman Periodic Assessment"}</h3>
                  <p>{t("assessment.periodCol") || "Scheduled Period"}: <strong>Q2 2026</strong></p>
                </div>
              </div>
              <div className="pm-tc-meta-row">
                <span className="pm-mini-pill">📝 {t("assessment.compulsoryQuestions")}</span>
                <span className="pm-mini-pill">⏱ {t("assessment.duration30")}</span>
                <span className="pm-mini-pill">🎯 {t("assessment.mcqSingleKey")}</span>
                <span className="pm-mini-pill">⚠️ {t("assessment.answeringRequired")}</span>
              </div>
              <div className="pm-tc-sections-preview">
                {[t("assessment.signalRules"), t("assessment.trackHandling"), t("assessment.communication"), t("assessment.safetyResponse"), t("assessment.operationalJudgement")].map(s => (
                  <span key={s} className="pm-tc-section-chip">{s}</span>
                ))}
              </div>
              {questionBankCount < 25 && (
                <p style={{ margin: "10px 0", fontSize: 13, color: "#dc2626", fontWeight: "700", lineHeight: 1.4 }}>
                  ⚠️ {t("assessment.questionBankMissing") || "Question bank not uploaded yet."}
                </p>
              )}
              <button 
                className="pm-start-btn" 
                onClick={startTestAttempt} 
                disabled={questionBankCount < 25}
                style={{ 
                  background: questionBankCount < 25 ? "#cbd5e1" : "#f97316", 
                  color: questionBankCount < 25 ? "#94a3b8" : "#ffffff",
                  border: "none",
                  cursor: questionBankCount < 25 ? "not-allowed" : "pointer"
                }}
              >
                <PlayCircle size={18} /> {t("buttons.startAssessment") || "Initialize Assessment Command"}
              </button>
            </article>
          )}
        </div>
      </section>
    );
  };

  /* ═══════════════════════════════════════
     RENDER: TEST ATTEMPT (WITH TIMER)
  ═══════════════════════════════════════ */
  const renderAttemptPage = () => {
    if (!activeTest) return renderCurrentTestsPage();
    const question = testQuestions[currentQuestion];
    const answeredCount = (responses || []).filter(r => r !== null && r !== undefined).length;
    const completionRate = Math.round((answeredCount / 25) * 100);
    const unansweredCount = 25 - answeredCount;

    return (
      <div className="sdom-exam-layout" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif"
      }}>
        {/* Header Bar: TCS iON Style with Safety Orange Accent */}
        <header style={{
          background: "#1e293b",
          color: "#ffffff",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          height: "70px",
          flexShrink: 0
        }}>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <ShieldCheck size={28} color="#f97316"/>
            <div>
              <h1 style={{fontSize: 18, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "0.5px"}}>
                {roleTitle.toUpperCase()} {t("assessment.title").toUpperCase()}
              </h1>
              <p style={{margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500}}>
                {t("assessment.subtitle")}
              </p>
            </div>
          </div>
          
          <div style={{display: "flex", alignItems: "center", gap: 16}}>
            <div style={{
              background: "#334155",
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#cbd5e1",
              border: "1px solid #475569"
            }}>
              ⚙️ {t("assessment.status")}: <span style={{color: "#f97316"}}>{t("assessment.activeSession")}</span>
            </div>
            
            <button 
              onClick={() => {
                if (window.confirm(t("assessment.confirmAbort"))) {
                  setActiveTest(null);
                  setScreenMode("default");
                  logActivity("Assessment", "Periodic assessment aborted by user.");
                }
              }} 
              style={{
                padding: "8px 18px", 
                borderRadius: 8, 
                fontSize: 13, 
                background: "#ef4444", 
                color: "#ffffff", 
                border: "none", 
                fontWeight: 700, 
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                transition: "all 0.2s ease"
              }}
            >
               {t("buttons.exitExam")}
            </button>
          </div>
        </header>

        {/* Candidate & Progress Strip */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#ffffff",
          borderBottom: "1.5px solid #e2e8f0",
          padding: "12px 24px",
          height: "50px",
          flexShrink: 0,
          fontSize: 13.5,
          color: "#334155"
        }}>
          <div>
            {t("assessment.candidateName")}: <strong style={{color: "#1e3a8a"}}>{fullName}</strong> &nbsp;|&nbsp; {t("assessment.hrms")}: <strong style={{color: "#1e3a8a"}}>{employeeId}</strong> &nbsp;|&nbsp; {t("assessment.station")}: <strong>{profileData?.stationName || ''}</strong>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <span style={{fontWeight: 600}}>{t("assessment.progress")}: <strong style={{color: "#f97316"}}>{answeredCount} / 25 {t("assessment.answered")}</strong> ({completionRate}%)</span>
            <div style={{width: 140, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden"}}>
              <div style={{width: `${completionRate}%`, height: "100%", background: "#f97316", borderRadius: 4}}/>
            </div>
          </div>
        </div>

        {/* Main Split Body */}
        <div className="sdom-exam-body" style={{
          display: "grid", 
          gridTemplateColumns: "1fr 340px", 
          flex: 1, 
          overflow: "hidden"
        }}>
          {/* Left Column: Spacious Question Pane */}
          <div style={{
            padding: "32px 40px", 
            display: "flex", 
            flexDirection: "column", 
            background: "#f8fafc",
            overflowY: "auto",
            height: "100%"
          }}>
            {/* Immersive Question Card (Glassmorphism & Clean drop shadow) */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 36,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              marginBottom: 24
            }}>
              <div>
                <span style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#f97316",
                  background: "#fff7ed",
                  padding: "6px 14px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px"
                }}>
                  {t("assessment.compulsoryQuestion")} {currentQuestion + 1} {t("assessment.of")} 25
                </span>
                
                <h2 style={{
                  fontSize: 22, 
                  fontWeight: 700, 
                  color: "#0f172a", 
                  marginTop: 24, 
                  marginBottom: 28, 
                  lineHeight: 1.5
                }}>
                  {question.text}
                </h2>

                <div style={{display: "flex", flexDirection: "column", gap: 14}}>
                  {question.options.map((opt, oi) => {
                    const isSelected = responses[currentQuestion] === oi;
                    return (
                      <label key={oi} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "18px 24px",
                        border: isSelected ? "2.5px solid #f97316" : "1.5px solid #e2e8f0",
                        borderRadius: 12,
                        background: isSelected ? "#fff7ed" : "#ffffff",
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 4px 6px rgba(249, 115, 22, 0.08)" : "none",
                        transition: "all 0.15s ease"
                      }} className="pm-option-hover">
                        <input
                          type="radio"
                          name={`pm-q-${question.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(oi)}
                          style={{width: 20, height: 20, accentColor: "#f97316"}}
                        />
                        <span style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: isSelected ? "#c2410c" : "#64748b",
                          width: 24
                        }}>{["A", "B", "C", "D"][oi]}</span>
                        <span style={{
                          fontSize: 15, 
                          color: "#1e293b", 
                          fontWeight: isSelected ? 700 : 500
                        }}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Immersive Control Footer Bar */}
            <div style={{
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "16px 24px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
            }}>
              <button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                style={{
                  padding: "12px 28px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  background: currentQuestion === 0 ? "#f1f5f9" : "#ffffff",
                  color: currentQuestion === 0 ? "#94a3b8" : "#334155",
                  border: "1.5px solid #cbd5e1",
                  cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {t("buttons.previousQuestion")}
              </button>

              <div style={{fontSize: 14, color: "#64748b"}}>
                {unansweredCount > 0 ? (
                  <span style={{color: "#b45309", fontWeight: 800, display: "flex", alignItems: "center", gap: 6}}>
                    ⚠️ {unansweredCount} {t("assessment.questionsRemainingUnlock")}
                  </span>
                ) : (
                  <span style={{color: "#16a34a", fontWeight: 800, display: "flex", alignItems: "center", gap: 6}}>
                    ✓ {t("assessment.allAttemptedSubmit")}
                  </span>
                )}
              </div>

              <button
                disabled={currentQuestion === 24}
                onClick={() => setCurrentQuestion(p => Math.min(24, p + 1))}
                style={{
                  padding: "12px 28px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  background: currentQuestion === 24 ? "#f1f5f9" : "#ffffff",
                  color: currentQuestion === 24 ? "#94a3b8" : "#334155",
                  border: "1.5px solid #cbd5e1",
                  cursor: currentQuestion === 24 ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {t("buttons.nextQuestion")}
              </button>
            </div>
          </div>

          {/* Right Column: Navigator Sidebar */}
          <div style={{
            background: "#ffffff",
            borderLeft: "1.5px solid #e2e8f0",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: "auto",
            height: "100%"
          }}>
            <div style={{textAlign: "center", paddingBottom: 16, borderBottom: "1.5px solid #f1f5f9"}}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#ffedd5",
                color: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                margin: "0 auto 10px"
              }}>
                {fullName.charAt(0)}
              </div>
              <h3 style={{fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0}}>{fullName}</h3>
              <span style={{fontSize: 12, color: "#64748b", fontWeight: 500}}>{t("assessment.hrms")}: {employeeId}</span>
            </div>

            <h4 style={{
              fontSize: 12, 
              fontWeight: 800, 
              color: "#475569", 
              textTransform: "uppercase", 
              letterSpacing: "0.6px", 
              margin: 0
            }}>
              {t("assessment.questionPalette")}
            </h4>

            {/* Grid of questions */}
            <div className="sdom-keep-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              paddingRight: 4
            }}>
              {testQuestions.map((q, idx) => {
                const isCurrent = idx === currentQuestion;
                const isAnswered = responses[idx] !== null && responses[idx] !== undefined;
                
                let btnBg = "#ffffff";
                let btnBorder = "1.5px solid #cbd5e1";
                let btnColor = "#475569";
                let fontWeight = "600";

                if (isCurrent) {
                  btnBg = "#ffedd5";
                  btnBorder = "2px solid #f97316";
                  btnColor = "#c2410c";
                  fontWeight = "800";
                } else if (isAnswered) {
                  btnBg = "#dcfce7";
                  btnBorder = "1.5px solid #86efac";
                  btnColor = "#15803d";
                } else {
                  btnBg = "#fef3c7";
                  btnBorder = "1.5px solid #fde047";
                  btnColor = "#a16207";
                }

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentQuestion(idx)}
                    style={{
                      height: 40,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: fontWeight,
                      background: btnBg,
                      border: btnBorder,
                      color: btnColor,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.1s ease"
                    }}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>

            {/* Legend section */}
            <div style={{
              borderTop: "1.5px solid #f1f5f9",
              paddingTop: 16,
              fontSize: 12,
              color: "#64748b",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <span style={{width: 16, height: 16, background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 4}}/>
                <span style={{fontWeight: 500}}>{t("assessment.attempted")}</span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <span style={{width: 16, height: 16, background: "#fef3c7", border: "1.5px solid #fde047", borderRadius: 4}}/>
                <span style={{fontWeight: 600, color: "#a16207"}}>{t("assessment.unattempted")}</span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <span style={{width: 16, height: 16, background: "#ffedd5", border: "2px solid #f97316", borderRadius: 4}}/>
                <span style={{fontWeight: 500}}>{t("assessment.currentFocus")}</span>
              </div>
            </div>

            {/* Submission Section at Bottom */}
            <div style={{
              marginTop: "auto", 
              paddingTop: 20, 
              borderTop: "1.5px solid #f1f5f9"
            }}>
              <button
                disabled={unansweredCount > 0}
                onClick={() => submitTest(false)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 10,
                  fontSize: 14.5,
                  fontWeight: 800,
                  background: unansweredCount > 0 ? "#cbd5e1" : "#16a34a",
                  color: unansweredCount > 0 ? "#94a3b8" : "#ffffff",
                  border: "none",
                  cursor: unansweredCount > 0 ? "not-allowed" : "pointer",
                  boxShadow: unansweredCount > 0 ? "none" : "0 4px 12px rgba(22, 163, 74, 0.3)",
                  transition: "all 0.2s ease"
                }}
              >
                {t("buttons.submitExam")}
              </button>
              {unansweredCount > 0 && (
                <p style={{
                  fontSize: 11,
                  color: "#b45309",
                  margin: "8px 0 0",
                  textAlign: "center",
                  fontWeight: 600,
                  lineHeight: 1.4
                }}>
                  {t("assessment.allRequired")} ({unansweredCount} {t("assessment.remaining")})
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
     MAIN RETURN DISPATCHER
  ═══════════════════════════════════════ */
  if (screenMode === "takeTest") return renderTakeTest();
  if (screenMode === "attempt") return renderAttemptPage();
  return renderMyAssessment();
}