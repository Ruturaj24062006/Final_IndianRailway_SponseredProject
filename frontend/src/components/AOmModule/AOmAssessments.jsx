import { useState } from "react";
import { Search, Calendar, ClipboardCheck, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

export default function AOmAssessments({
  assessRole,
  setAssessRole,
  rosterSearch,
  setRosterSearch,
  rosterStation,
  setRosterStation,
  rosterStatus,
  setRosterStatus,
  rosterDate,
  setRosterDate,
  stationsDirectory,
  stationMastersDirectory,
  setStationMastersDirectory,
  activeSmId,
  setActiveSmId,
  smForms,
  setSmForms,
  smLocked,
  setSmLocked,
  TI_SM_CRITERIA,
  computeSMScore,
  defaultSMForm,
  aomTMs,
  setAomTMs,
  activeTmId,
  setActiveTmId,
  tmForms,
  setTmForms,
  tmLocked,
  setTmLocked,
  TI_TM_CRITERIA,
  computeTMScore,
  defaultTMForm,
  aomSSs,
  setAomSSs,
  activeSsId,
  setActiveSsId,
  ssForms,
  setSsForms,
  ssLocked,
  setSsLocked,
  TI_SS_CRITERIA,
  computeSSScore,
  defaultSSForm,
  aomPointsmen,
  setAomPointsmen,
  getCat,
  getPmRisk,
  riskBadge,
  catBadge,
  statusBadge,
  tiAssessments,
  setTiAssessments,
  addAuditLog
}) {
  // We resolve if there's an active assessment open (Level 3 - Form View)
        // If openAssessmentId is NOT null, activeAssessment is the item in pendingAssessments (or approvedAssessments)
        const activeAssessment = pendingAssessments.find((item) => item.id === openAssessmentId) || 
                                 approvedAssessments.find((item) => item.id === openAssessmentId) || null;
        
        if (activeAssessment) {
          // Render Level 3: Structured Evaluation Form View!
          const activeAnswers = answersByAssessment[activeAssessment.id] || buildPrefilledAnswers(activeAssessment.title);
          const liveScore = calculateAssessmentScore(activeAnswers, true);
          
          // Map to TI employee info
          const tiEmployee = trafficInspectors.find(t => t.employeeId === activeAssessment.id);
          const name = tiEmployee ? tiEmployee.name : (activeAssessment.employeeLine?.match(/Employee:\s*([^|]+)/i)?.[1]?.trim() || "Traffic Inspector");
          const hrmsId = activeAssessment.id;
          const division = tiEmployee ? tiEmployee.division : (activeAssessment.employeeLine?.match(/Division:\s*(.+)/i)?.[1]?.trim() || "Nagpur");
          
          const isApproved = approvedAssessments.some(a => a.id === activeAssessment.id);
          const locked = isApproved;
          
          let ynScore = 0;
          assessmentCriteria.forEach(sec => {
            if (sec.key !== "knowledgeOfRules") {
              ynScore += getTiSectionScore(sec.key, activeAnswers);
            }
          });
          const isAlcoholic = activeAnswers.alcoholicStatus === "Alcoholic";
          const liveCat = isAlcoholic ? "D" : (liveScore >= 90 ? "A" : liveScore >= 80 ? "B" : "C");
          
          const CAT_B = { A: "#dcfce7", B: "#eff6ff", C: "#fff7ed", D: "#fef2f2" };
          const CAT_C = { A: "#16a34a", B: "#2563eb", C: "#ea580c", D: "#dc2626" };

          const checklistDetails = {
            alertnessAndObservation: [
              "Maintains high situational awareness during station safety audits",
              "Monitors and corrects hand signaling compliance among pointsmen",
              "Inspects station master cabins for correct block instrument procedures"
            ],
            safetyRecord: [
              "No active safety violation reports or warnings on personal record",
              "Proactively reports and documents track and signaling safety defects"
            ],
            leadershipAndManagement: [
              "Conducts regular safety counseling sessions for supervised station staff",
              "Resolves operational bottlenecks efficiently during duty shifts"
            ],
            discipline: [
              "Adheres strictly to official inspection rosters and schedules",
              "Maintains up-to-date and accurate inspection logbooks"
            ],
            appearanceAndNeatness: [
              "Wears prescribed uniform, cap, and badges during active duty hours",
              "Exhibits neat, professional, and highly disciplined personal conduct"
            ]
          };

          const isActivated = localStorage.getItem(`ti_exam_assigned_${activeAssessment.id}`) === "true";
          const isMcqCompleted = localStorage.getItem(`ti_exam_taken_${activeAssessment.id}`) === "true";
          const knowledge = isMcqCompleted ? 25 : 0;

          return (
            <section className="sm2-card animate-fade-in" style={{ padding: "24px" }}>
              {/* Header */}
              <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    Assessment — {name}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                    {hrmsId} · {division} Division
                  </p>
                </div>
                <button
                  className="sm2-ghost-btn"
                  style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", color: "#475569" }}
                  onClick={() => setOpenAssessmentId(null)}
                >
                  ← Back
                </button>
              </div>

              {assessmentActionNotice && (
                <div className="assessment-action-notice" style={{ marginBottom: "16px", padding: "10px 14px", background: "#e8f5e9", border: "1px solid #c8e6c9", color: "#1b5e20", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  {assessmentActionNotice}
                </div>
              )}

              {/* ── Section 1: Knowledge of Rules ── */}
              <div className="sm2-assess-section">
                <div className="sm2-assess-sec-hdr">
                  <span className="sm2-assess-sec-num">01</span>
                  <div>
                    <strong>Knowledge of Rules (MCQ-based)</strong>
                    <span className="sm2-assess-sec-meta">Auto-calculated from Traffic Inspector Online Competency Test</span>
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
                            <strong>25</strong>
                            <span>/ 25</span>
                          </div>
                          <div className="sm2-mcq-percentage-badge">
                            100% Score
                          </div>
                          <button
                            type="button"
                            style={{ marginLeft: "auto", background: "#fee2e2", border: "none", color: "#dc2626", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                            onClick={() => {
                              localStorage.removeItem(`ti_exam_taken_${activeAssessment.id}`);
                              handleAnswerChange(activeAssessment.id, "knowledgeOfRules", "no");
                            }}
                          >
                            Reset Mock Exam
                          </button>
                        </div>

                        <div className="sm2-mcq-progress-container">
                          <div className="sm2-mcq-progress-bar">
                            <div
                              className="sm2-mcq-progress-fill"
                              style={{
                                width: `100%`,
                                background: "#16a34a"
                              }}
                            />
                          </div>
                        </div>

                        <div className="sm2-mcq-meta-grid">
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Submitted On</span>
                            <strong className="sm2-mcq-meta-val">30 May 2026</strong>
                          </div>
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Assessed Entity</span>
                            <strong className="sm2-mcq-meta-val">{name}</strong>
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
                            <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? "Awaiting Traffic Inspector Attempt" : "Competency Exam Locked"}</h4>
                            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                              {isActivated ? (
                                <span>The Traffic Inspector safety competency trial is active. Request TI (<strong>{name}</strong>) to log into their portal and attempt the 25 safety questions to automatically sync scores.</span>
                              ) : (
                                <span>The Traffic Inspector MCQ exam is currently locked. You must click the <strong>Activate Safety Exam</strong> button below to enable the Traffic Inspector to log in and attempt the test.</span>
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
                              localStorage.setItem(`ti_exam_assigned_${activeAssessment.id}`, nextVal ? "true" : "false");
                              handleAnswerChange(activeAssessment.id, "knowledgeOfRules", "no");
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
                            <strong className="sm2-mcq-meta-val">{name}</strong>
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

              {/* ── Sections 02-06: Yes/No blocks ── */}
              {assessmentCriteria.filter(x => x.key !== "knowledgeOfRules").map((sec, si) => {
                const checklist = checklistDetails[sec.key] || [];
                const count = checklist.length;
                const sectionScore = getTiSectionScore(sec.key, activeAnswers);
                const sectionMax = sec.marks;
                const weight = count > 0 ? (sectionMax / count).toFixed(2) : 0;

                return (
                  <div key={sec.key} className="sm2-assess-section" style={{ opacity: 1 }}>
                    <div className="sm2-assess-sec-hdr">
                      <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                      <div>
                        <strong>{sec.label}</strong>
                        <span className="sm2-assess-sec-meta">{count} criteria · {weight} marks each · Total {sectionMax}</span>
                      </div>
                      <span className="sm2-assess-live-marks">{sectionScore} / {sectionMax}</span>
                    </div>
                    <div className="sm2-yn-grid">
                      {checklist.map((itemText, idx) => {
                        const itemKey = `${sec.key}_${idx}`;
                        const currentAnswer = activeAnswers[itemKey] || "no";

                        return (
                          <div key={idx} className="sm2-yn-row">
                            <span style={{ fontSize: "13.5px" }} className="sm2-yn-label">{idx + 1}. {itemText}</span>
                            <div className="sm2-yn-btns">
                              <button
                                type="button" disabled={locked}
                                className={currentAnswer === "yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                                style={{ cursor: locked ? "not-allowed" : "pointer" }}
                                onClick={() => handleAnswerChange(activeAssessment.id, itemKey, "yes")}
                              >
                                Yes
                              </button>
                              <button
                                type="button" disabled={locked}
                                className={currentAnswer === "no" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                                style={{ cursor: locked ? "not-allowed" : "pointer" }}
                                onClick={() => handleAnswerChange(activeAssessment.id, itemKey, "no")}
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
              <div className="sm2-assess-section" style={{ opacity: 1 }}>
                <div className="sm2-assess-sec-hdr">
                  <span className="sm2-assess-sec-num">07</span>
                  <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
                </div>
                <div className="sm2-assess-form" style={{ marginTop: 12 }}>
                  <div className="sm2-form-field">
                    <label>Knowledge Marks (MCQ Test)</label>
                    <input type="number" min={0} max={25} disabled={locked} value={knowledge} style={{ background: "#f1f5f9" }} readOnly />
                  </div>
                  <div className="sm2-form-field">
                    <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
                    <select disabled={locked} value={activeAnswers.alcoholicStatus || "Non-Alcoholic"} onChange={e => handleAnswerChange(activeAssessment.id, "alcoholicStatus", e.target.value)}>
                      <option value="">Select…</option>
                      <option>Non-Alcoholic</option>
                      <option>Alcoholic</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>PME Status</label>
                    <select disabled={locked} value={activeAnswers.pmeStatus || "Fit"} onChange={e => handleAnswerChange(activeAssessment.id, "pmeStatus", e.target.value)}>
                      <option>Fit</option><option>Unfit</option><option>Pending</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>REF Status</label>
                    <select disabled={locked} value={activeAnswers.refStatus || "Cleared"} onChange={e => handleAnswerChange(activeAssessment.id, "refStatus", e.target.value)}>
                      <option>Cleared</option><option>Pending</option><option>Failed</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>Counselling</label>
                    <select disabled={locked} value={activeAnswers.counselling || "Not Required"} onChange={e => handleAnswerChange(activeAssessment.id, "counselling", e.target.value)}>
                      <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>Automatic Training</label>
                    <select disabled={locked} value={activeAnswers.automaticTraining || "Not Required"} onChange={e => handleAnswerChange(activeAssessment.id, "automaticTraining", e.target.value)}>
                      <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                    </select>
                  </div>
                  <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
                    <label>Remarks for Officer / AOM</label>
                    <textarea rows={3} disabled={locked} value={activeAnswers.remarks || ""} onChange={e => handleAnswerChange(activeAssessment.id, "remarks", e.target.value)} placeholder="Enter observations, recommendations…" />
                  </div>
                </div>
              </div>

              {/* ── Live Score Bar ── */}
              <div className="sm2-live-score" style={{ opacity: 1 }}>
                <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
                <div><label>Yes/No Score</label><strong>{ynScore}/75</strong></div>
                <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{liveScore}/100</strong></div>
                <div><label>Category</label><span className="sm2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
              </div>

              {locked ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                  <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                    ✓ Assessment Approved and Locked (AOM Approved)
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                      className="sm2-ghost-btn"
                      style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", color: "#334155" }}
                      onClick={() => {
                        alert("Assessment saved as draft successfully!");
                      }}
                    >
                      Save as Draft
                    </button>
                    <button
                      className="sm2-ghost-btn"
                      style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", color: "#dc2626" }}
                      onClick={() => handleRejectAssessment(activeAssessment.id)}
                    >
                      Reject
                    </button>
                    <button
                      className="sm2-primary-btn"
                      style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                      onClick={() => handleApproveAssessment(activeAssessment.id)}
                    >
                      <CheckCircle size={14} /> Approve &amp; Lock Assessment
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        }

        // --- LEVEL 2: Roster View ---
        const rosterList = getTiRosterList();
        
        // Roster totals
        const totalTIs = rosterList.length;
        const pendingCount = rosterList.filter(x => x.status === "Pending" || x.status === "Exam Sent").length;
        const completedCount = rosterList.filter(x => x.status === "Approved" || x.status === "Exam Taken" || x.status === "Submitted").length;
        const rejectedCount = rosterList.filter(x => x.status === "Rejected").length;
        const lastUpdatedDate = "30 May 2026";
        
        // Filter elements
        const uniqueStationsList = ["All", ...new Set(stations.map(s => s.name || s.stationName).filter(Boolean))];
        
        const filteredTiList = rosterList.filter((ti) => {
          const matchesSearch = assessSearch === "" ||
            ti.name.toLowerCase().includes(assessSearch.toLowerCase()) ||
            ti.employeeId.toLowerCase().includes(assessSearch.toLowerCase());
          
          const matchesStation = assessStation === "All" ||
            ti.stationName === assessStation ||
            ti.division === assessStation;
            
          const matchesStatus = assessStatus === "All" || ti.status === assessStatus;
          const matchesDate = assessDate === "" || ti.lastAssessed === assessDate;
          
          return matchesSearch && matchesStation && matchesStatus && matchesDate;
        });

        const stationCodeMap = {
          "Parbhani Junction": "PBN",
          "Amla": "AMLA",
          "Nagpur Junction": "NGP",
          "Pune Junction": "PUNE",
          "Mumbai Junction": "BCT",
          "Delhi Junction": "DLI"
        };

        return (
          <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
                  Assessments — Traffic Inspectors
                </h1>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                  Traffic Inspectors pending assessment are listed below. Open the form to conduct a structured evaluation.
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: `Total Traffic Inspectors`, value: totalTIs, subtitle: "In your jurisdiction", icon: Users, bg: "#ffffff", color: "#475569", valColor: "#0f172a" },
                { label: "Pending Assessments", value: pendingCount, subtitle: "Awaiting completion", icon: ClipboardCheck, bg: "#ffffff", color: "#ea580c", valColor: "#ea580c" },
                { label: "Completed This Month", value: completedCount, subtitle: "Assessments done", icon: CheckCircle, bg: "#ffffff", color: "#16a34a", valColor: "#16a34a" },
                { label: "Rejected", value: rejectedCount, subtitle: "Needs review", icon: AlertTriangle, bg: "#ffffff", color: "#dc2626", valColor: "#dc2626" },
                { label: "Last Updated", value: lastUpdatedDate, subtitle: "Recent activity", icon: Calendar, bg: "#ffffff", color: "#64748b", valColor: "#0f172a" }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                  }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, flexShrink: 0 }}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontSize: "22px", fontWeight: "800", color: stat.valColor }}>{stat.value}</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", marginTop: "2px" }}>{stat.label}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "1px" }}>{stat.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters Section */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", gap: "16px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Search Traffic Inspector
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="text"
                      placeholder="Name or HRMS ID..."
                      value={assessSearch}
                      onChange={(e) => setAssessSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#0f172a",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Station</label>
                  <select
                    value={assessStation}
                    onChange={(e) => setAssessStation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#0f172a",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="All">All Stations</option>
                    {uniqueStationsList.filter(x => x !== "All").map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Exam Status</label>
                  <select
                    value={assessStatus}
                    onChange={(e) => setAssessStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#0f172a",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Exam Sent">Exam Sent</option>
                    <option value="Exam Taken">Exam Taken</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Last Assessed</label>
                  <div style={{ position: "relative" }}>
                    <Calendar size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="date"
                      value={assessDate}
                      onChange={(e) => setAssessDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 36px 10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#0f172a",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => { setAssessSearch(""); setAssessStation("All"); setAssessStatus("All"); setAssessDate(""); }}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#475569",
                      cursor: "pointer"
                    }}
                  >
                    Reset
                  </button>
                  <button
                    style={{
                      background: "#0f172a",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer"
                    }}
                  >
                    <Filter size={14} /> Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Roster Table */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        TRAFFIC INSPECTOR
                      </th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>HRMS ID</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>STATION</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>LAST ASSESSED</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>SCORE</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>EXAM STATUS</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTiList.map((item) => {
                      const stationCode = stationCodeMap[item.stationName] || "STN";

                      const examStatusBadgeStyle = (status) => {
                        if (status === "Exam Sent") return { bg: "#f3e8ff", color: "#6b21a8" };
                        if (status === "Exam Taken") return { bg: "#dcfce7", color: "#166534" };
                        if (status === "Submitted") return { bg: "#dbeafe", color: "#2563eb" };
                        if (status === "Rejected") return { bg: "#fee2e2", color: "#dc2626" };
                        if (status === "Approved") return { bg: "#dcfce7", color: "#166534" };
                        return { bg: "#f1f5f9", color: "#475569" };
                      };

                      const statusColors = examStatusBadgeStyle(item.status);

                      return (
                        <tr key={item.id || item.employeeId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1e3a8a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{item.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>Senior Scale</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>
                            {item.employeeId}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#334155", fontSize: "13px", fontWeight: "500" }}>{item.stationName}</span>
                              <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                {stationCode}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
                            {item.lastAssessed || "—"}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "800", fontSize: "14px" }}>
                            {item.score ? `${item.score}/100` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ background: statusColors.bg, color: statusColors.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                                {item.status}
                              </span>
                              {item.status === "Exam Sent" && (
                                <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <Clock size={12} /> Waiting for Response
                                </span>
                              )}
                              {item.status === "Rejected" && (
                                <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <AlertTriangle size={12} /> Needs Review
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                              {(item.status === "Pending" || item.status === "Rejected") && (
                                <>
                                  <button
                                    onClick={() => {
                                      localStorage.setItem(`ti_exam_assigned_${item.employeeId}`, "true");
                                      // Add an item to pendingAssessments if it doesn't exist
                                      const exists = pendingAssessments.some(p => p.id === item.employeeId);
                                      if (!exists) {
                                        setPendingAssessments(prev => [{
                                          id: item.employeeId,
                                          title: `Traffic Inspector - ${item.employeeId}`,
                                          statusLabel: "Pending Assessment",
                                          assessedByLine: `Awaiting: Your Assessment - on ${todayIso()}`,
                                          employeeLine: `Employee: ${item.name} | Division: ${item.division || "Nagpur"}`,
                                          actionType: "assessment"
                                        }, ...prev]);
                                      }
                                      alert(`Exam assigned and sent to Traffic Inspector ${item.name || ""}.`);
                                      setAssessmentActionNotice(`Exam assigned to ${item.name}.`);
                                    }}
                                    style={{
                                      background: "#7c3aed",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Send Access
                                  </button>
                                  <button
                                    onClick={() => openTiForm(item)}
                                    style={{
                                      background: "#ffffff",
                                      border: "1px solid #cbd5e1",
                                      padding: "5px 12px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    Open Form <ExternalLink size={12} />
                                  </button>
                                </>
                              )}
                              {item.status === "Exam Sent" && (
                                <>
                                  <button
                                    onClick={() => {
                                      localStorage.setItem(`ti_exam_taken_${item.employeeId}`, "true");
                                      alert(`Mock sync: Traffic Inspector ${item.name} completed the online exam.`);
                                      setAssessmentActionNotice(`Online exam completed by ${item.name}.`);
                                    }}
                                    style={{
                                      background: "#2563eb",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Simulate Exam Taken
                                  </button>
                                  <button
                                    onClick={() => openTiForm(item)}
                                    style={{
                                      background: "#ffffff",
                                      border: "1px solid #cbd5e1",
                                      padding: "5px 12px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    Open Form <ExternalLink size={12} />
                                  </button>
                                </>
                              )}
                              {item.status === "Exam Taken" && (
                                <button
                                  onClick={() => openTiForm(item)}
                                  style={{
                                    background: "#16a34a",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    fontSize: "12px"
                                  }}
                                >
                                  Start Assessment
                                </button>
                              )}
                              {item.status === "Submitted" && (
                                <>
                                  <button
                                    onClick={() => openTiForm(item)}
                                    style={{
                                      background: "#2563eb",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    View Form
                                  </button>
                                  <button
                                    onClick={() => openTiForm(item)}
                                    style={{
                                      background: "#ea580c",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Edit
                                  </button>
                                </>
                              )}
                              {item.status === "Approved" && (
                                <button
                                  onClick={() => openTiForm(item)}
                                  style={{
                                    background: "#2563eb",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    fontSize: "12px"
                                  }}
                                >
                                  View Form
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTiList.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
                          No Traffic Inspectors match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Showing 1 to {filteredTiList.length} of {filteredTiList.length} entries
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    disabled
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#cbd5e1",
                      cursor: "not-allowed"
                    }}
                  >
                    &lt;
                  </button>
                  <button
                    style={{
                      background: "#0f172a",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "13px"
                    }}
                  >
                    1
                  </button>
                  <button
                    disabled
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#cbd5e1",
                      cursor: "not-allowed"
                    }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
}
