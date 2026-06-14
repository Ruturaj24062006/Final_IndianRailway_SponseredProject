import React, { useState } from "react";
import { TrendingUp, Award, Clock, FileCheck, CheckCircle2, ChevronRight, Activity, Users, Building2, UserCheck, BusFront, ShieldAlert, ClipboardCheck, AlertTriangle, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LabelList, LineChart, Line } from "recharts";
import { useLanguage } from "../../utils/LanguageContext";

const PIE_C = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];

export default function TIDashboard({
  dbStationFilter,
  setDbStationFilter,
  dbSearchQuery,
  setDbSearchQuery,
  myStations = [],
  users = [],
  getCat,
  getUserRisk,
  riskBadge,
  catBadge,
  statusBadge,
  tiAssessments = [],
  inspections = [],
  counsellings = [],
  activePage,
  setActivePage,
  setSelectedStation,
  fullscreenChart,
  setFullscreenChart,
  TI_PROFILE = {},
  stationTiMap = {},
  MONTHLY = [],
  DEFAULT_SS_TM_USERS = [],
  totalPM,
  totalSMs,
  pending,
  highRiskAll,
  avgScoreAll,
  goTo,
  setUserStationFilter,
  setUserCategoryFilter,
  setUserRiskFilter,
  setUserSearch,
  setReviewTab,
  myStationsProgress = [],
  stationStats = [],
  roleBarData = [],
  pieData = [],
  myCompliance = [],
  topStations = [],
  bottomStations = [],
  myPipeline = [],
  myAssessmentMonthly = [],
  handleChartClick,
  handlePieClick
}) {
  const { t } = useLanguage();
  const [modalDetail, setModalDetail] = useState(null);

  // Extract PME & REF info for Traffic Inspector
  const pmeRaw = TI_PROFILE?.pme_status || TI_PROFILE?.pmeStatus || "FIT";
  const pmeStatus = pmeRaw.includes(" - ") ? pmeRaw.split(" - ")[0] : pmeRaw;
  const pmeDueDate = TI_PROFILE?.pme_next_due_date || (pmeRaw.includes("Due: ") ? pmeRaw.split("Due: ")[1] : "2029-08-20");
  const pmeDoneDate = TI_PROFILE?.pme_date || "2025-08-20";

  const refRaw = TI_PROFILE?.ref_status || TI_PROFILE?.refStatus || "COMPLETED";
  const refStatus = refRaw.includes(" - ") ? refRaw.split(" - ")[0] : refRaw;
  const refDueDate = TI_PROFILE?.ref_next_due_date || (refRaw.includes("Due: ") ? refRaw.split("Due: ")[1] : "2027-05-12");
  const refDoneDate = TI_PROFILE?.ref_date || "2024-05-12";

  const showDetail = (type, extra = null) => {
    let title = "";
    let content = null;

    if (type === "pme_ref") {
      title = "My Medical Fitness & Refresher Course Status";
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Periodic Medical Examination (PME)</h4>
            <p>Periodic eye and physical fitness examinations are mandatory to retain safety clearance as a Traffic Inspector supervising active yards.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last Exam Date: <strong>{pmeDoneDate}</strong></div>
              <div>Next Due Date: <strong style={{ color: "#c53030" }}>{pmeDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{pmeStatus}</span></div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Refresher Safety Course (REF)</h4>
            <p>Verify supervisor training compliance at ZRTI to stay updated with block system revisions and accident inquiries.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last ZRTI Course: <strong>{refDoneDate}</strong></div>
              <div>Next Due Date: <strong style={{ color: "#c53030" }}>{refDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{refStatus}</span></div>
            </div>
          </div>
        </div>
      );
    } else if (type === "stations") {
      title = "Section Assigned Stations";
      content = (
        <div>
          <p style={{ marginBottom: 10 }}>Your section covers <strong>{myStations.length}</strong> active block stations:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {myStations.map(st => (
              <div key={st.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700 }}>{st.name}</span>
                <strong>{st.code}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "pointsmen") {
      title = "Section Pointsmen Status";
      content = (
        <div>
          <p>Total active Pointsmen in your jurisdiction: <strong>{totalPM}</strong>.</p>
          <p style={{ marginTop: 8 }}>Clicking the summary card navigates to the detailed Pointsmen checklist inside safety logs.</p>
        </div>
      );
    } else if (type === "sm") {
      title = "Section Station Masters";
      content = (
        <div>
          <p>Total active Station Masters in your jurisdiction: <strong>{totalSMs}</strong>.</p>
        </div>
      );
    } else if (type === "pending") {
      title = "Pending Approvals Status";
      content = (
        <div>
          <p>You have <strong>{pending}</strong> pointsman assessments awaiting your supervisor review.</p>
        </div>
      );
    } else if (type === "avg") {
      title = "Section-Wide Competency Average";
      content = (
        <div>
          <p>The average evaluation score across all subordinates is <strong>{avgScoreAll}%</strong>.</p>
          <p style={{ marginTop: 12 }}>A section average above 80% represents Category A compliance. Review stations needing attention to address low scoring markers.</p>
        </div>
      );
    } else if (type === "risk") {
      title = "Immediate High-Risk Staff Attention";
      content = (
        <div>
          <p>There are <strong>{highRiskAll}</strong> high-risk staff members in your section due to PME expirations or low competency marks.</p>
        </div>
      );
    } else if (type === "station_progress") {
      title = "Station Evaluation Progress Statistics";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Evaluation completion progress breakdown:</p>
          {myStationsProgress.map(st => (
            <div key={st.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontWeight: "700" }}>{st.name}</span>
              <span>Completed: <b>{st.completed}</b> | Pending: <b>{st.pending}</b></span>
            </div>
          ))}
        </div>
      );
    } else if (type === "station_average") {
      title = "Station Competency Average Details";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Average evaluation marks per station:</p>
          {stationStats.map(st => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontWeight: "700" }}>{st.name} ({st.code})</span>
              <strong style={{ color: st.avgScore < 75 ? "#dc2626" : "#16a34a" }}>{st.avgScore}%</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "role_distribution") {
      title = "Subordinate Roles Breakdown";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Subordinates categorized by operational roles:</p>
          {roleBarData.map(r => (
            <div key={r.role} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{r.role}</span>
              <strong>{r.count} staff</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "grade_distribution") {
      title = "Subordinate Grade Ratings";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Percentage breakdown of safety competency grades:</p>
          {pieData.map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>Grade {d.name}</span>
              <strong>{d.value}%</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "safety_compliance") {
      title = "Safety Compliance Index Breakdown";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Operational compliance rates across safety parameters:</p>
          {myCompliance.map(c => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{c.label}</span>
              <strong style={{ color: c.color }}>{c.pct}%</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "trend_chart") {
      title = "Nagpur Section Performance Trends";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>6-month evaluation trend tracking:</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                <th style={{ padding: "6px", textAlign: "left" }}>Month</th>
                <th style={{ padding: "6px", textAlign: "right" }}>Average Score</th>
                <th style={{ padding: "6px", textAlign: "right" }}>Compliance %</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY.map((m, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px" }}>{m.month}</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>{m.avgScore}%</td>
                  <td style={{ padding: "6px", textAlign: "right", color: "#10b981", fontWeight: "700" }}>{m.safetyAvg}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (type === "top_stations") {
      title = "Top Performing Stations Details";
      content = (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topStations.map(st => (
              <div key={st.id} style={{ padding: "10px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{st.name} ({st.code})</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px", color: "#475569" }}>
                  <span>Avg Competency: <b>{st.avgScore}%</b></span>
                  <span>Safety Compliance: <b>{st.safetyPct}%</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "bottom_stations") {
      title = "Stations Needing Attention Details";
      content = (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {bottomStations.map(st => (
              <div key={st.id} style={{ padding: "10px", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{st.name} ({st.code})</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px", color: "#475569" }}>
                  <span style={{ color: "#dc2626" }}>Avg Competency: <b>{st.avgScore}%</b></span>
                  <span>Safety Compliance: <b>{st.safetyPct}%</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "assessment_pipeline") {
      title = "Assessment Pipeline Details";
      content = (
        <div>
          <p style={{ marginBottom: 12 }}>Active cycle assessment statuses:</p>
          {myPipeline.map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.label}</span>
              <strong>{p.count}</strong>
            </div>
          ))}
        </div>
      );
    }

    setModalDetail({ title, content });
  };

  return (
    <div className="sdom-fade">
      {/* Page header */}
      <h1 className="sdom-page-title">{TI_PROFILE.jurisdiction} {t("dashboard.sectionCommandCenter") || "Section Command Center"}</h1>
      <p className="sdom-page-subtitle">{t("dashboard.sectionCommandCenterSub") || "Complete strategic overview of your section — staff, performance, safety and assessment pipeline."}</p>

      {/* Traffic Inspector Personal Safety Section */}
      <div className="sdom-chart-card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", borderLeft: "6px solid #1E3A5F", cursor: "pointer" }} onClick={() => showDetail("pme_ref")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0B1F3A" }}>My Personal Safety & Compliance Stats</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Medical fitness and ZRTI refresher course updates</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>PME Medical Status</span>
              <span className="sdom-badge" style={{
                background: pmeStatus === "Fit" || pmeStatus === "FIT" || pmeStatus === "Valid" ? "#C6F6D5" : "#FED7D7",
                color: pmeStatus === "Fit" || pmeStatus === "FIT" || pmeStatus === "Valid" ? "#2F855A" : "#C53030",
                padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700"
              }}>
                {pmeStatus}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              <div>Last Exam Date: <strong>{pmeDoneDate}</strong></div>
              <div style={{ marginTop: "4px" }}>Next Due Date: <strong style={{ color: "#2563eb" }}>{pmeDueDate}</strong></div>
            </div>
          </div>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Refresher Training (REF)</span>
              <span className="sdom-badge" style={{
                background: refStatus === "Cleared" || refStatus === "Valid" || refStatus === "COMPLETED" ? "#C6F6D5" : "#FEE2E2",
                color: refStatus === "Cleared" || refStatus === "Valid" || refStatus === "COMPLETED" ? "#2F855A" : "#D97706",
                padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700"
              }}>
                {refStatus}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              <div>Last Course Date: <strong>{refDoneDate}</strong></div>
              <div style={{ marginTop: "4px" }}>Next Due Date: <strong style={{ color: "#2563eb" }}>{refDueDate}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {[
          { key: "stations", label: t("sidebar.stations") || "Stations", count: myStations.length, sub: t("dashboard.assignedSection") || "Assigned in your section", icon: <Building2 size={18} />, color: "#1E3A5F", type: "stations" },
          { key: "pointsmen", label: t("sidebar.pointsmen") || "Pointsmen", count: totalPM, sub: t("dashboard.acrossAssigned") || "Across assigned stations", icon: <Users size={18} />, color: "#1E3A5F", type: "pointsmen" },
          { key: "sm", label: t("sidebar.stationMasters") || "Station Masters", count: totalSMs, sub: t("dashboard.acrossAssigned") || "Across assigned stations", icon: <Building2 size={18} />, color: "#1E3A5F", type: "sm" },
          { key: "pending", label: t("dashboard.pendingApprovals") || "Pending Approvals", count: pending, sub: t("dashboard.awaitingReview") || "Assessments awaiting review", icon: <ClipboardCheck size={18} />, color: "#1E3A5F", type: "pending" },
          { key: "avg", label: t("dashboard.averageScore") || "Average Score", count: `${avgScoreAll}/100`, sub: t("dashboard.sectionWideAvg") || "Section-wide average", icon: <Activity size={18} />, color: "#1E3A5F", type: "avg" },
          { key: "risk", label: t("dashboard.highRiskStaff") || "High-Risk Staff", count: highRiskAll, sub: t("dashboard.immediateAttention") || "Requires immediate attention", icon: <AlertTriangle size={18} />, color: "#1E3A5F", type: "risk" },
        ].map((c) => (
          <div
            className="sdom-stat-card"
            key={c.key}
            style={{ cursor: "pointer" }}
            onClick={() => showDetail(c.type)}
          >
            <div className="sdom-stat-icon">
              <span style={{ color: "#1E3A5F" }}>{c.icon}</span>
            </div>
            <div className="sdom-stat-label">{c.label}</div>
            <div className="sdom-stat-value">{c.count}</div>
            <div className="sdom-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Station-wise Progress & Average Score Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("station_progress")}>
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">{t("dashboard.stationProgress") || "Station-wise Evaluation Progress"}</div>
              <div className="sdom-chart-subtitle">{t("dashboard.completedPendingSection") || "Completed and pending assessments in your section"}</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleChartClick(null, "progress"); }}
              style={{
                background: "var(--brand-primary, #0B1F3A)",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {t("dashboard.viewFullScreen") || "View Full Screen"}
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={myStationsProgress}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                barGap={6}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#627D98" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="completed"
                  fill="var(--brand-secondary, #1E3A5F)"
                  radius={[4, 4, 0, 0]}
                  name={t("assessment.completed") || "Completed"}
                  barSize={12}
                />
                <Bar
                  dataKey="pending"
                  fill="#D69E2E"
                  radius={[4, 4, 0, 0]}
                  name={t("assessment.pending") || "Pending"}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("station_average")}>
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">{t("dashboard.stationAverageScore") || "Station-wise Average Score"}</div>
              <div className="sdom-chart-subtitle">{t("dashboard.averagePerformanceScores") || "Average performance scores for your stations"}</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleChartClick(null, "score"); }}
              style={{
                background: "#1f7a5c",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {t("dashboard.viewFullScreen") || "View Full Screen"}
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationStats.map(st => ({ station: st.code, avgScore: st.avgScore }))}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                style={{ cursor: "pointer" }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis
                  dataKey="station"
                  tick={{ fontSize: 10, fill: "#627D98" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} formatter={(value) => [`${value}/100`, t("dashboard.averageScore") || "Average Score"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="avgScore"
                  fill="#1f7a5c"
                  radius={[4, 4, 0, 0]}
                  name={t("dashboard.averageScore") || "Average Score"}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Role-wise Staff Distribution Row ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("role_distribution")}>
          <div className="sdom-chart-title">{t("dashboard.roleStaffDistribution") || "Role-wise Staff Distribution"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.staffCountRole") || "Staff count per role in your section"}</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBarData} margin={{ top: 16, right: 40, left: 0, bottom: 8 }} barSize={52}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="role" fontSize={12} tick={{ fill: "#102A43", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Bar dataKey="count" fill="#1E3A5F" radius={[5, 5, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#102A43" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Grade & Safety Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("grade_distribution")}>
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">{t("dashboard.gradeDistribution") || "Grade/Category Distribution"}</div>
              <div className="sdom-chart-subtitle">{t("dashboard.staffGradesSection") || "Staff grades in your section"}</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePieClick(null); }}
              style={{
                background: "var(--brand-primary, #0B1F3A)",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {t("dashboard.viewFullScreen") || "View Full Screen"}
            </button>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.map(d => ({ name: `${t("assessment.categoryCol") || "Grade"} ${d.name}`, value: d.value, fill: d.name === "A" ? "#1E3A5F" : d.name === "B" ? "#2B6CB0" : d.name === "C" ? "#D69E2E" : "#C53030" }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.name === "A" ? "#1E3A5F" : d.name === "B" ? "#2B6CB0" : d.name === "C" ? "#D69E2E" : "#C53030"} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("safety_compliance")}>
          <div className="sdom-chart-title">{t("dashboard.safetyCompliance") || "Safety Compliance Analytics"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.sectionComplianceCategories") || "Section compliance rates across categories"}</div>
          <div style={{ marginTop: 16 }}>
            {myCompliance.map((c) => (
              <div className="sdom-compliance-item" key={c.label}>
                <div className="sdom-compliance-header">
                  <span>{c.label}</span>
                  <span className="sdom-compliance-pct">{c.pct}%</span>
                </div>
                <div className="sdom-compliance-track">
                  <div className="sdom-compliance-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Monthly Score & Safety Trend Row ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("trend_chart")}>
          <div className="sdom-chart-title">{t("dashboard.sectionPerformanceSafetyTrend") || "Section-wide Performance & Safety Trend (Last 6 Months)"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.sectionPerformanceSafetyTrendSub") || "Average assessment scores and safety compliance percentage in your section"}</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[60, 100]} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Line type="monotone" dataKey="avgScore" name={t("dashboard.averageScore") || "Avg Score"} stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }} />
                <Line type="monotone" dataKey="safetyAvg" name="Safety Compliance%" stroke="#2F855A" strokeWidth={2.5} dot={{ r: 4, fill: "#2F855A" }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Top/Bottom Performing Stations Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("top_stations")}>
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>{t("dashboard.topPerformingStations") || "Top Performing Stations"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.topPerformingStationsSub") || "Highest average assessment score in your section"}</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("assessment.station") || "Station"}</th>
                  <th>{t("dashboard.colAverageScore") || "Avg Score"}</th>
                  <th>{t("dashboard.colSafety") || "Safety %"}</th>
                  <th>{t("dashboard.colHighRisk") || "High Risk"}</th>
                </tr>
              </thead>
              <tbody>
                {topStations.map((st, i) => (
                  <tr key={st.id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.name}</td>
                    <td><span style={{ color: "#2F855A", fontWeight: 700 }}>{st.avgScore}%</span></td>
                    <td>{st.safetyPct}%</td>
                    <td>{st.highRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("bottom_stations")}>
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>{t("dashboard.stationsNeedingAttention") || "Stations Needing Attention"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.stationsNeedingAttentionSub") || "Lowest average assessment score in your section"}</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("assessment.station") || "Station"}</th>
                  <th>{t("dashboard.colAverageScore") || "Avg Score"}</th>
                  <th>{t("dashboard.colSafety") || "Safety %"}</th>
                  <th>{t("dashboard.colHighRisk") || "High Risk"}</th>
                </tr>
              </thead>
              <tbody>
                {bottomStations.map((st, i) => (
                  <tr key={st.id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.name}</td>
                    <td><span style={{ color: st.avgScore < 75 ? "#C53030" : "#D69E2E", fontWeight: 700 }}>{st.avgScore}%</span></td>
                    <td>{st.safetyPct}%</td>
                    <td>{st.highRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Assessment Pipeline Row ── */}
      <div className="sdom-row-1">
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("assessment_pipeline")}>
          <div className="sdom-chart-title">{t("dashboard.assessmentPipeline") || "Assessment Pipeline"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.assessmentPipelineSub") || "Section-wide pipeline status and trend"}</div>
          <div className="sdom-pipeline-row" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            {myPipeline.map((p) => (
              <div className="sdom-pipeline-card" key={p.label} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", flex: 1 }}>
                <div className="sdom-pipeline-dot" style={{ background: p.dot, width: "10px", height: "10px", borderRadius: "50%" }} />
                <div>
                  <div className="sdom-pipeline-lbl" style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>{p.label}</div>
                  <div className="sdom-pipeline-val" style={{ fontSize: "18px", fontWeight: "800" }}>{p.count}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 280, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={myAssessmentMonthly} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Bar dataKey="approved" name="Approved" fill="#1E3A5F" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#4A90D9" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#B83A3A" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#5A6B7C" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reusable modal popup */}
      {modalDetail && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px"
        }} onClick={() => setModalDetail(null)}>
          <div style={{
            background: "#ffffff",
            borderRadius: "14px",
            width: "100%",
            maxWidth: "550px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)",
            padding: "24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            animation: "pm-modal-show 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }} onClick={e => e.stopPropagation()}>
            <style>{`
              @keyframes pm-modal-show {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{modalDetail.title}</h3>
              <button style={{ background: "none", border: "none", fontSize: "20px", fontWeight: "700", cursor: "pointer", color: "#94a3b8" }} onClick={() => setModalDetail(null)}>&times;</button>
            </div>
            <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
              {modalDetail.content}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
              <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#ffffff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }} onClick={() => setModalDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
