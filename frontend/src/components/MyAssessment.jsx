import { useState, useMemo } from "react";
import { ShieldCheck, Clock, Award, FileText, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Search, PlayCircle } from "lucide-react";

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
  assessedByTitle = '{assessedByTitle}'
}) {
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
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a"/> Detailed Evaluation Scorecard</h2>
            <button className="ti2-primary-btn" onClick={() => setMyAssessSelected(null)}>← Return to History</button>
          </div>

          <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
            <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${getCategoryColor(cat) || "#2563eb"}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
              <strong style={{ fontSize: "24px", color: getCategoryColor(cat) || "#2563eb", fontWeight: "800" }}>{liveTotal}</strong>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/100</span>
            </div>
            <div>
              <span className="pm-cat-badge-lg" style={{ background: getCategoryBg(cat), color: getCategoryColor(cat), display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                Final Category: Category {cat}
              </span>
              <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{sc.assessmentPeriod} - Self-Compliance Audit</p>
              <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Attempt Completed: {sc.date} &nbsp;·&nbsp; Assessed By: {sc.assessedBy || "{assessedByTitle}"}</p>
            </div>
          </div>

          {/* Dynamic Performance Summary */}
          <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 Official Performance Evaluation Summary</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{performanceSummary || `Assessment score: ${liveTotal}/100. Periodic evaluation completed.`}</p>
          </div>

          {/* Competency Module Breakdown */}
          <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>Safety Domain Competency Breakdown</h3>
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
              <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>Complete Assessment Question Review</h3>
            </div>
            <p className="pm-subtitle" style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "20px" }}>
              Below is the detailed response evaluation for all 25 compulsory questions. Correct responses are highlighted in green; incorrect choices are highlighted in red.
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
                        <span className="pm-rq-badge success">Correct (+4 Marks)</span>
                      ) : (
                        <span className="pm-rq-badge danger">Incorrect (0 Marks)</span>
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
                        <strong style={{ color: "#c2410c" }}>💡 Operational Safety Explanation: </strong> {q.explanation}
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

    const testActive = testAssigned === "Assigned" && (!mcqTest || !mcqTest.completed);

    /* History list */
    return (
      <section className="sm2-card">
        {/* MCQ Assessment Assignment Banner */}
        {testActive ? (
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
                  ⚠️ Pending Competency Assessment
                </h3>
                <p style={{margin:"0 0 14px", fontSize:13, color:"#9a3412", lineHeight:1.4}}>
                  Your supervisor ({assessedByTitle}) has scheduled a periodic safety &amp; competency assessment for you. You must complete the 25-question MCQ exam.
                </p>
                <button
                  onClick={startTestAttempt}
                  style={{
                    background:"#ea580c",
                    color:"#ffffff",
                    border:"none",
                    padding:"10px 20px",
                    borderRadius:8,
                    fontSize:13.5,
                    fontWeight:700,
                    cursor:"pointer",
                    boxShadow:"0 4px 6px rgba(234, 88, 12, 0.2)",
                    display:"flex",
                    alignItems:"center",
                    gap:8
                  }}
                >
                  Start 25 MCQ Online Assessment
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                All assessments are up to date. No pending test available.
              </h3>
              <p style={{margin:0, fontSize:12, color:"#166534"}}>
                Your periodic safety and competency evaluation is currently active and compliant.
              </p>
            </div>
            <div style={{display:"flex", gap:16, fontSize:12, textAlign:"right"}}>
              <div>
                <span style={{color:"#166534", display:"block"}}>Last Exam Score</span>
                <strong style={{color:"#14532d", fontSize:13}}>{mcqTest ? `${mcqTest.correctCount}/25 (${mcqTest.percentage}%)` : `${history[0]?.totalScore ?? 84}/100`}</strong>
              </div>
              <div style={{borderLeft:"1px solid #bbf7d0", paddingLeft:16}}>
                <span style={{color:"#166534", display:"block"}}>Next Due Date</span>
                <strong style={{color:"#14532d", fontSize:13}}>25 Sep 2026</strong>
              </div>
            </div>
          </div>
        )}

        <div className="sm2-card-hdr"><h2>My Assessment History</h2></div>
        <p className="sm2-subtitle">All assessments conducted by the {assessedByTitle} for your record. Click any row to view the detailed scorecard.</p>

        {/* Summary strip */}
        <div className="sm2-myassess-summary">
          <div className="sm2-report-mini">
            <label>Total Assessments</label>
            <strong>{history.length}</strong>
          </div>
          <div className="sm2-report-mini">
            <label>Latest Score</label>
            <strong>{history[0]?.totalScore ?? "—"}/{history[0]?.isOnlineExam ? 25 : 100}</strong>
          </div>
          <div className="sm2-report-mini">
            <label>Average SM Score</label>
            <strong>{
              (() => {
                const regs = history.filter(h => !h.isOnlineExam);
                return regs.length ? `${Math.round(regs.reduce((s, a) => s + a.totalScore, 0) / regs.length)}/100` : "—";
              })()
            }</strong>
          </div>
          <div className="sm2-report-mini">
            <label>Latest Assessment</label>
            <strong style={{color: getCategoryColor(getCategory(history[0]?.totalScore || 0))}}>
              {history[0]?.isOnlineExam ? "Online CBT" : `Category ${getCategory(history[0]?.totalScore || 0)}`}
            </strong>
          </div>
        </div>

        {/* List */}
        <div className="sm2-myassess-list">
          <div className="sm2-myassess-head">
            {["Period","Date","Score Scale","Category","Assessed By","Status",""].map(h =>
              <span key={h}>{h}</span>)}
          </div>
          {history.map(sc => {
            const cat = getCategory(sc.totalScore);
            return (
              <button key={sc.id} className="sm2-myassess-row" onClick={() => setMyAssessSelected(sc)}>
                <span title={`Cycle: ${sc.assessmentPeriod}\nDuration: ${formatQuarterPeriod(sc.assessmentPeriod)}`}>
                  <strong>{formatQuarterPeriod(sc.assessmentPeriod)}</strong>
                </span>
                <span>{sc.date}</span>
                <span><strong>{sc.totalScore}/{sc.isOnlineExam ? 25 : 100}</strong></span>
                <span>
                  <span className="sm2-badge" style={{background:getCategoryBg(cat),color:getCategoryColor(cat)}}>
                    {sc.isOnlineExam ? "CBT Exam" : `Cat. ${cat}`}
                  </span>
                </span>
                <span style={{fontSize:11,color:"#64748b"}}>{sc.assessedBy || "S. Deshmukh (SM)"}</span>
                <span>
                  <span className={`sm2-status-pill sm2-status-${(sc.approvalStatus || "approved").toLowerCase()}`}>{sc.approvalStatus || "Approved"}</span>
                </span>
                <span style={{color:"#2563eb",fontSize:12,fontWeight:600}}>View Form</span>
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
                {roleTitle.toUpperCase()} CBT COMPETENCY EVALUATION
              </h1>
              <p style={{margin:0, fontSize:11, color:"#94a3b8", fontWeight:500}}>
                Official Railway Safety &amp; Operational Assessment
              </p>
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:16}}>
            <div style={{background:"#334155", padding:"6px 16px", borderRadius:8, fontSize:13, fontWeight:700, color:"#cbd5e1", border:"1px solid #475569"}}>
              ⚙️ STATUS: <span style={{color:"#ea580c"}}>Active Exam Session</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to abort the exam? Your progress will not be saved.")) {
                  setScreenMode("default");
                }
              }}
              style={{padding:"8px 18px", borderRadius:8, fontSize:13, background:"#ef4444", color:"#ffffff", border:"none", fontWeight:700, cursor:"pointer"}}
            >
              Exit Exam
            </button>
          </div>
        </header>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderBottom:"1.5px solid #e2e8f0", padding:"12px 24px", height:"50px", flexShrink:0, fontSize:13.5, color:"#334155"}}>
          <div>Candidate: <strong style={{color:"#1e3a8a"}}>{fullName}</strong> &nbsp;|&nbsp; HRMS: <strong style={{color:"#1e3a8a"}}>{employeeId}</strong> &nbsp;|&nbsp; Station: <strong>{profileData?.stationName || ''}</strong></div>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <span style={{fontWeight:600}}>Progress: <strong style={{color:"#ea580c"}}>{answeredCount} / 25 Answered</strong> ({completionRate}%)</span>
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
                  Compulsory Question {activeQIdx + 1} of 25
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
              <button disabled={activeQIdx===0} onClick={() => setActiveQIdx(p=>Math.max(0,p-1))} style={{padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:700, background:activeQIdx===0?"#f1f5f9":"#ffffff", color:activeQIdx===0?"#94a3b8":"#334155", border:"1.5px solid #cbd5e1", cursor:activeQIdx===0?"not-allowed":"pointer"}}>← Previous Question</button>
              <div style={{fontSize:14, color:"#64748b"}}>
                {unansweredCount>0 ? <span style={{color:"#b45309",fontWeight:800}}>⚠️ {unansweredCount} question{unansweredCount>1?"s":""} remaining</span> : <span style={{color:"#16a34a",fontWeight:800}}>✓ All 25 answered! You can submit.</span>}
              </div>
              <button disabled={activeQIdx===24} onClick={() => setActiveQIdx(p=>Math.min(24,p+1))} style={{padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:700, background:activeQIdx===24?"#f1f5f9":"#ffffff", color:activeQIdx===24?"#94a3b8":"#334155", border:"1.5px solid #cbd5e1", cursor:activeQIdx===24?"not-allowed":"pointer"}}>Next Question →</button>
            </div>
          </div>

          {/* Right: Navigator Sidebar */}
          <div style={{background:"#ffffff", borderLeft:"1.5px solid #e2e8f0", padding:"24px", display:"flex", flexDirection:"column", gap:20, overflowY:"auto", height:"100%"}}>
            <div style={{textAlign:"center", paddingBottom:16, borderBottom:"1.5px solid #f1f5f9"}}>
              <div style={{width:60, height:60, borderRadius:"50%", background:"#ffedd5", color:"#ea580c", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, margin:"0 auto 10px"}}>{fullName.charAt(0)}</div>
              <h3 style={{fontSize:15, fontWeight:700, color:"#1e293b", margin:0}}>{fullName}</h3>
              <span style={{fontSize:12, color:"#64748b", fontWeight:500}}>HRMS ID: {employeeId}</span>
            </div>
            <h4 style={{fontSize:12, fontWeight:800, color:"#475569", textTransform:"uppercase", letterSpacing:"0.6px", margin:0}}>Question Palette</h4>
            <div className="sdom-keep-grid" style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, maxHeight:220, overflowY:"auto", paddingRight:4}}>
              {testQuestions.map((q, idx) => {
                const isCurrent = idx===activeQIdx;
                const isAnswered = testResponses[idx]!==null && testResponses[idx]!==undefined;
                let bg="#ffffff", border="1.5px solid #cbd5e1", color="#475569", fw="600";
                if (isCurrent) { bg="#ffedd5"; border="2px solid #ea580c"; color="#c2410c"; fw="800"; }
                else if (isAnswered) { bg="#dcfce7"; border="1.5px solid #86efac"; color="#15803d"; }
                else { bg="#fef3c7"; border="1.5px solid #fde047"; color="#a16207"; }
                return <button key={q.id} onClick={()=>setActiveQIdx(idx)} style={{height:40, borderRadius:8, fontSize:13, fontWeight:fw, background:bg, border, color, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>{q.id}</button>;
              })}
            </div>
            <div style={{borderTop:"1.5px solid #f1f5f9", paddingTop:16, fontSize:12, color:"#64748b", display:"flex", flexDirection:"column", gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#dcfce7",border:"1.5px solid #86efac",borderRadius:4}}/><span>Attempted</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#fef3c7",border:"1.5px solid #fde047",borderRadius:4}}/><span style={{color:"#a16207",fontWeight:600}}>Unattempted</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#ffedd5",border:"2px solid #ea580c",borderRadius:4}}/><span>Current Focus</span></div>
            </div>
            <div style={{marginTop:"auto", paddingTop:20, borderTop:"1.5px solid #f1f5f9"}}>
              <button
                disabled={unansweredCount>0}
                onClick={handleSubmitTestAttempt}
                style={{width:"100%", padding:"14px 16px", borderRadius:10, fontSize:14.5, fontWeight:800, background:unansweredCount>0?"#cbd5e1":"#16a34a", color:unansweredCount>0?"#94a3b8":"#ffffff", border:"none", cursor:unansweredCount>0?"not-allowed":"pointer", boxShadow:unansweredCount>0?"none":"0 4px 12px rgba(22,163,74,0.3)"}}
              >
                Submit Examination
              </button>
              {unansweredCount>0 && <p style={{fontSize:11, color:"#b45309", margin:"8px 0 0", textAlign:"center", fontWeight:600}}>* All 25 questions must be answered before submission ({unansweredCount} remaining)</p>}
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
          <h2>Periodic Evaluation Archive</h2>
        </div>
        <p className="pm-subtitle">Historical ledger of standard Pointsman CBT safety competency trials.</p>

        {/* 4 Premium High-Fidelity Analytics Cards ({assessedByTitle} Alignment) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Assessments</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{totalAssessments} Attempts</div>
            </div>
          </div>

          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: "#f0fdf4", color: "#16a34a", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>Latest Score</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{latestScore !== null ? `${latestScore}/100` : "—"}</div>
            </div>
          </div>

          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: "#fff7ed", color: "#ea580c", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>Average Score</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{averageScore}/100</div>
            </div>
          </div>

          <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ background: getCategoryBg(latestCategory), color: getCategoryColor(latestCategory), width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>Latest Category</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: getCategoryColor(latestCategory), marginTop: "2px" }}>
                {latestCategory !== "—" ? `Cat. ${latestCategory}` : "—"}
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
              placeholder="Search by period (e.g. April 2026)"
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
              <option value="date-desc">Newest Attempt First</option>
              <option value="date-asc">Oldest Attempt First</option>
              <option value="score-desc">Highest Score First</option>
              <option value="score-asc">Lowest Score First</option>
            </select>
          </div>
        </div>

        {/* Search empty state */}
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <Search size={36} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#475569", margin: "0 0 6px" }}>No attempts found</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Try clearing your search query or sorting filters.</p>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Attempt No.</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Period</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Assessment Date</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Score</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Category</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Assessed By</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Status</th>
                  <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: "700", color: "#475569" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((record, index) => {
                  const absoluteIdx = filteredHistory.length - (startIndex + index);
                  const cat = getCategory(record.totalScore);
                  return (
                    <tr key={record.id} className="sdom-table-row-hover" style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
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
                          Cat. {cat}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#334155", fontWeight: "500" }}>S. Deshmukh (SM)</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: "700", fontSize: "11px", padding: "4px 8px", borderRadius: "20px" }}>
                          Approved
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
                          View Form
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
                  Showing <b>{startIndex + 1}</b> to <b>{Math.min(startIndex + itemsPerPage, filteredHistory.length)}</b> of <b>{filteredHistory.length}</b> attempts
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#ffffff", color: currentPage === 1 ? "#94a3b8" : "#334155", fontWeight: "600", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "12.5px" }}
                  >
                    Previous
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
        <p className="pm-empty-state">Select a record from History to review.</p>
      </section>
    );

    const cat = getCategory(selectedRecord.totalScore);

    return (
      <div className="ti2-card animate-fade-in" style={{ padding: "24px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        <div className="ti2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a"/> Detailed Evaluation Scorecard</h2>
          <button className="ti2-primary-btn" onClick={() => setScreenMode("default")}>← Return to History</button>
        </div>

        <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${getCategoryColor(cat)}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
            <strong style={{ fontSize: "24px", color: getCategoryColor(cat), fontWeight: "800" }}>{selectedRecord.totalScore}</strong>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/100</span>
          </div>
          <div>
            <span className="pm-cat-badge-lg" style={{ background: getCategoryBg(cat), color: getCategoryColor(cat), display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              Final Category: Category {cat}
            </span>
            <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{selectedRecord.assessmentPeriod} - Self-Compliance Audit</p>
            <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Attempt Completed: {selectedRecord.date} &nbsp;·&nbsp; Assessed By: S. Deshmukh ({assessedByTitle})</p>
          </div>
        </div>

        {/* Dynamic Performance Summary */}
        <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 Official Performance Evaluation Summary</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{performanceSummaryText}</p>
        </div>

        {/* Competency Module Breakdown */}
        <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>Safety Domain Competency Breakdown</h3>
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
            <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>Complete Assessment Question Review</h3>
          </div>
          <p className="pm-subtitle" style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "20px" }}>
            Below is the detailed response evaluation for all 25 compulsory questions. Correct responses are highlighted in green; incorrect choices are highlighted in red.
          </p>

          <div className="pm-review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {testQuestions.map((q, qIndex) => {
              const selectedOpt = selectedRecord.responses ? selectedRecord.responses[qIndex] : null;
              const isCorrect = selectedOpt === q.answer;

              return (
                <div key={qIndex} className={`pm-review-question-card ${isCorrect ? "correct-card" : "wrong-card"}`}>
                  <div className="pm-rq-header">
                    <span className="pm-rq-number">Question {qIndex + 1}</span>
                    {isCorrect ? (
                      <span className="pm-rq-badge success">Correct (+4 Marks)</span>
                    ) : (
                      <span className="pm-rq-badge danger">Incorrect (0 Marks)</span>
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
                            <span className="opt-user-tag">{isCorrect ? "✓ Selected" : "✗ Selected"}</span>
                          )}
                          {!wasSelected && isOptCorrect && (
                            <span className="opt-correct-tag">✓ Correct Key</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Operational Safety Explanation */}
                  {q.explanation && (
                    <div style={{ marginTop: "16px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f97316", fontSize: "12.5px", color: "#334155" }}>
                      <strong style={{ color: "#c2410c" }}>💡 Operational Safety Explanation: </strong> {q.explanation}
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
    const isTestActivated = localStorage.getItem("pm_test_activated_" + employeeId) === "true";
    return (
      <section className="pm-page-card">
        <div className="pm-page-header">
          <h2>Assigned Competency Trials</h2>
        </div>
        <p className="pm-subtitle">Mandatory periodically scheduled evaluation of SWR Rules and points shunting safety clearance.</p>

        <div className="pm-current-tests">
          {!isTestActivated ? (
            <div className="pm-no-test-banner" style={{ background: "#f8fafc", border: "2px dashed #cbd5e1" }}>
              <Lock size={40} color="#64748b" />
              <h3>Competency Exam Locked</h3>
              <p>Your periodic evaluation has not been activated by the {assessedByTitle} yet. Please request your {assessedByTitle} to activate your test so you can attempt it.</p>
            </div>
          ) : !currentTest ? (
            <div className="pm-no-test-banner">
              <CheckCircle2 size={40} color="#16a34a" />
              <h3>All caught up!</h3>
              <p>Your periodic evaluation for April 2026 is fully completed. Grade successfully filed to Station Supervisor records.</p>
              
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
                Reappear for CBT Exam (Dev Mode)
              </button>
            </div>
          ) : (
            <article className="pm-test-card-premium">
              <div className="pm-tc-header">
                <ClipboardList size={22} color="#f97316" />
                <div>
                  <h3>{currentTest.name}</h3>
                  <p>Scheduled Period: <strong>{currentTest.period}</strong></p>
                </div>
              </div>
              <div className="pm-tc-meta-row">
                <span className="pm-mini-pill">📝 25 Compulsory Questions</span>
                <span className="pm-mini-pill">⏱ Unlimited Time (No timer)</span>
                <span className="pm-mini-pill">🎯 MCQ Single Key Option</span>
                <span className="pm-mini-pill">⚠️ Answering All Required to Submit</span>
              </div>
              <div className="pm-tc-sections-preview">
                {["Signal Rules", "Track Handling", "Communication", "Safety Response", "Operational Judgement"].map(s => (
                  <span key={s} className="pm-tc-section-chip">{s}</span>
                ))}
              </div>
              <button className="pm-start-btn" onClick={startTestAttempt} style={{ background: "#f97316", border: "none" }}>
                <PlayCircle size={18} /> Initialize Assessment Command
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
                {roleTitle.toUpperCase()} CBT COMPETENCY EVALUATION
              </h1>
              <p style={{margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500}}>
                Official Railway Safety &amp; Operational Assessment
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
              ⚙️ STATUS: <span style={{color: "#f97316"}}>Active Exam Session</span>
            </div>
            
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to abort the exam? Your progress will not be saved.")) {
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
              Exit Exam
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
            Candidate Name: <strong style={{color: "#1e3a8a"}}>{fullName}</strong> &nbsp;|&nbsp; HRMS ID: <strong style={{color: "#1e3a8a"}}>{employeeId}</strong> &nbsp;|&nbsp; Station: <strong>{profileData?.stationName || ''}</strong>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <span style={{fontWeight: 600}}>Progress: <strong style={{color: "#f97316"}}>{answeredCount} / 25 Answered</strong> ({completionRate}%)</span>
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
                  Compulsory Question {currentQuestion + 1} of 25
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
                ← Previous Question
              </button>

              <div style={{fontSize: 14, color: "#64748b"}}>
                {unansweredCount > 0 ? (
                  <span style={{color: "#b45309", fontWeight: 800, display: "flex", alignItems: "center", gap: 6}}>
                    ⚠️ {unansweredCount} question{unansweredCount > 1 ? "s" : ""} remaining to unlock submission
                  </span>
                ) : (
                  <span style={{color: "#16a34a", fontWeight: 800, display: "flex", alignItems: "center", gap: 6}}>
                    ✓ All 25 questions attempted! You can now submit.
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
                Next Question →
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
              <span style={{fontSize: 12, color: "#64748b", fontWeight: 500}}>HRMS ID: {employeeId}</span>
            </div>

            <h4 style={{
              fontSize: 12, 
              fontWeight: 800, 
              color: "#475569", 
              textTransform: "uppercase", 
              letterSpacing: "0.6px", 
              margin: 0
            }}>
              Question Palette
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
                    key={q.id}
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
                <span style={{fontWeight: 500}}>Attempted</span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <span style={{width: 16, height: 16, background: "#fef3c7", border: "1.5px solid #fde047", borderRadius: 4}}/>
                <span style={{fontWeight: 600, color: "#a16207"}}>Unattempted</span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <span style={{width: 16, height: 16, background: "#ffedd5", border: "2px solid #f97316", borderRadius: 4}}/>
                <span style={{fontWeight: 500}}>Current Focus</span>
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
                Submit Examination
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
                  * All 25 questions must be answered before submission ({unansweredCount} remaining)
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
  return renderMyAssessment();
}