import React, { useState } from "react";
import { Gauge, TrendingUp, BarChart2, Award, Search, ArrowUpDown, Bell, Target, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { useLanguage } from "../../utils/LanguageContext";

const PIE_COLORS = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };

function CustomPieTooltip({ active, payload }) {
  const { t } = useLanguage();
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}>
      <span>{t("assessment.categoryCol")} {payload[0].name}: </span>
      <span style={{ color: PIE_COLORS[payload[0].name] || "#6b7280" }}>{payload[0].value} {t("dashboard.totalAttempts") || "attempts"}</span>
    </div>
  );
}

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

export default function PointsmanDashboard({
  fullName,
  latestScore,
  latestCategory,
  averageScore,
  history = [],
  trendData = [],
  pieData = [],
  openScorecard,
  testAssigned,
  pmMcqTest,
  startTestAttempt,
  handleReattempt,
  notifications,
  unreadNotificationsCount,
  bellDropdownOpen,
  setBellDropdownOpen,
  markAllNotificationsRead,
  setActiveNav,
  profileData = {}
}) {
  const { t } = useLanguage();
  const [modalDetail, setModalDetail] = useState(null);

  const categoryCounts = { A: 0, B: 0, C: 0, D: 0 };
  history.forEach(r => {
    const cat = getCategory(r.totalScore);
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    }
  });

  const pmeStatus = profileData?.pme_status || profileData?.pmeStatus || "Fit";
  const pmeDueDate = profileData?.pme_next_due_date || profileData?.pmeDueDate || "2029-08-20";
  const pmeDoneDate = profileData?.pme_date || profileData?.pmeDoneDate || "2025-08-20";
  const refStatus = profileData?.ref_status || profileData?.refStatus || "Cleared";
  const refDueDate = profileData?.ref_next_due_date || profileData?.refDueDate || "2027-05-12";
  const refDoneDate = profileData?.ref_date || profileData?.refDoneDate || "2024-05-12";

  const showDetail = (type) => {
    let title = "";
    let content = null;

    if (type === "latest_score") {
      title = "Latest Assessment Score Details";
      const lastAttempt = history[0];
      content = (
        <div>
          <p style={{ margin: "0 0 16px" }}>Here is the detailed mark breakdown of your latest assessment on <strong>{lastAttempt?.date || "—"}</strong>:</p>
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#2563eb", textAlign: "center", marginBottom: "6px" }}>
              {latestScore !== null ? `${latestScore}/100` : "—"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", textAlign: "center" }}>
              Grand Total Category Grade: <span style={{ fontWeight: 700, color: getCategoryColor(latestCategory) }}>Category {latestCategory}</span>
            </div>
          </div>
          {lastAttempt?.sections ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {lastAttempt.sections.map(s => (
                <div key={s.title} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f1f5f9", borderRadius: "6px", fontSize: "13px" }}>
                  <span>{s.title}</span>
                  <strong>{s.marks} / {s.outOf}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>Section details are not available for this record.</p>
          )}
        </div>
      );
    } else if (type === "average_score") {
      title = "Average Assessment Score Overview";
      content = (
        <div>
          <p>Your cumulative average score across all periodic competency evaluations is <strong>{averageScore}%</strong>.</p>
          <p style={{ marginTop: "12px" }}>Maintaining a high safety index represents your operational safety readiness. Nagpur Division targets a minimum competency score of <strong>80% (Category A)</strong> for mainline operations.</p>
          <div style={{ marginTop: "16px", background: "#eff6ff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #bfdbfe", fontSize: "13px", color: "#1e3a8a" }}>
            <strong>Safety Goal:</strong> Continuous counseling and refresher course updates are recommended for any staff scoring below 80% to ensure zero-accident shunting operations.
          </div>
        </div>
      );
    } else if (type === "current_category") {
      title = "Indian Railways Competency Classifications";
      content = (
        <div>
          <p>Competency categorization is dynamically determined based on your periodic safety assessment scores:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
            {[
              { cat: "A", range: "80% - 100%", desc: "Outstanding competency. Fit for mainline, passenger, and critical yard shunting.", bg: "#dcfce7", color: "#16a34a" },
              { cat: "B", range: "50% - 79%", desc: "Satisfactory operations. Allowed for secondary yard shunting and block yard siding duties.", bg: "#dbeafe", color: "#2563eb" },
              { cat: "C", range: "26% - 49%", desc: "Needs Improvement. Restricted to supervised yard duties; mandatory schedule for counseling.", bg: "#fef3c7", color: "#d97706" },
              { cat: "D", range: "Under 26%", desc: "Unfit. Taken off active yard and siding safety duties immediately. Retraining required.", bg: "#fee2e2", color: "#dc2626" }
            ].map(item => (
              <div key={item.cat} style={{ display: "flex", gap: "12px", background: item.bg, padding: "10px 14px", borderRadius: "8px", border: `1px solid ${item.color}50` }}>
                <span style={{ fontSize: "1.4rem", fontWeight: "900", color: item.color }}>{item.cat}</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>Score Range: {item.range}</div>
                  <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "total_attempts") {
      title = "Historical Assessment Logs";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>You have completed <strong>{history.length}</strong> periodic safety examinations:</p>
          <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                <tr>
                  <th style={{ padding: "8px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Period</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Score</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }} onClick={() => { setModalDetail(null); openScorecard(h); }}>
                    <td style={{ padding: "8px", color: "#2563eb", fontWeight: "600" }}>{h.date}</td>
                    <td style={{ padding: "8px" }}>{h.assessmentPeriod}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: "700" }}>{h.totalScore}%</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <span className="sdom-badge" style={{ background: getCategoryBg(getCategory(h.totalScore)), color: getCategoryColor(getCategory(h.totalScore)), padding: "2px 8px", fontSize: "11px" }}>
                        {getCategory(h.totalScore)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "pme_ref") {
      title = "Medical Fitness & Refresher Course Guidelines";
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Periodic Medical Examination (PME)</h4>
            <p>Every safety-category staff member (including Pointsman) must clear the PME to confirm physical and sensory fitness (specifically Category A-2 eye fitness for field signaling and shunting operations).</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last PME: <strong>{pmeDoneDate}</strong></div>
              <div>Next Due PME: <strong style={{ color: "#c53030" }}>{pmeDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{pmeStatus}</span></div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Refresher Safety Course (REF)</h4>
            <p>Refresher training must be completed periodically at the Zonal Training Center (ZRTI) to verify knowledge of new block rules, shunting procedures, and emergency operations.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last Course: <strong>{refDoneDate}</strong></div>
              <div>Next Due Course: <strong style={{ color: "#c53030" }}>{refDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{refStatus}</span></div>
            </div>
          </div>
        </div>
      );
    } else if (type === "trend_chart") {
      title = "Safety Competency Trend Analysis";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>Your safety scores plotted across the last 6 months shows progression in your yard rule compliance:</p>
          <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                <tr>
                  <th style={{ padding: "8px", textAlign: "left" }}>Cycle Month</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Competency Rating Score</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px", fontWeight: "600" }}>{t.date}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: "700", color: "#2563eb" }}>{t.score}%</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <span className="sdom-badge" style={{ background: getCategoryBg(getCategory(t.score)), color: getCategoryColor(getCategory(t.score)), padding: "2px 8px", fontSize: "11px" }}>
                        {getCategory(t.score)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "grade_chart") {
      title = "Grade Distribution Statistics";
      content = (
        <div>
          <p>Breakdown of attempts that qualified for each specific competency grade category:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderLeft: `5px solid ${PIE_COLORS[d.name]}`, borderRadius: "4px", fontSize: "13px" }}>
                <span>Grade Category <strong>{d.name}</strong></span>
                <span>Attempts: <strong>{d.count} ({d.value}%)</strong></span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    setModalDetail({ title, content });
  };

  return (
    <div className="pm-dashboard-layout">
      {/* Summary cards */}
      <div className="pm-summary-cards">
        <article className="pm-sum-card" onClick={() => showDetail("latest_score")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: "#eff6ff" }}>
            <Target size={20} color="#2563eb" />
          </div>
          <div>
            <label>{t("dashboard.latestScore")}</label>
            <strong>{latestScore !== null ? `${latestScore}/100` : "—"}</strong>
          </div>
        </article>

        <article className="pm-sum-card" onClick={() => showDetail("average_score")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: "#f0fdf4" }}>
            <Gauge size={20} color="#16a34a" />
          </div>
          <div>
            <label>{t("dashboard.averageScore")}</label>
            <strong>{averageScore}/100</strong>
          </div>
        </article>

        <article className="pm-sum-card" onClick={() => showDetail("current_category")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: getCategoryBg(latestCategory) }}>
            <ShieldCheck size={20} color={getCategoryColor(latestCategory)} />
          </div>
          <div>
            <label>{t("dashboard.currentCategory")}</label>
            <strong style={{ color: getCategoryColor(latestCategory) }}>
              {latestCategory !== "—" ? `${t("assessment.categoryCol")} ${latestCategory}` : "—"}
            </strong>
          </div>
        </article>

        <article className="pm-sum-card" onClick={() => showDetail("total_attempts")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: "#fdf4ff" }}>
            <Award size={20} color="#9333ea" />
          </div>
          <div>
            <label>{t("dashboard.totalAttempts")}</label>
            <strong>{history.length}</strong>
          </div>
        </article>
      </div>

      {/* PME & REF Section (Added for Pointsman) */}
      <div className="pm-chart-card" style={{ marginBottom: "24px", cursor: "pointer" }} onClick={() => showDetail("pme_ref")}>
        <div className="pm-chart-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color="#16a34a" />
          <h3>Periodic Medical Exam (PME) & Refresher Training (REF) Status</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
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
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Refresher Training (REF)</span>
              <span className="sdom-badge" style={{
                background: refStatus === "Cleared" || refStatus === "Valid" ? "#C6F6D5" : "#FEE2E2",
                color: refStatus === "Cleared" || refStatus === "Valid" ? "#2F855A" : "#D97706",
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

      <div className="pm-charts-row">
        {/* Performance Trends Chart */}
        <div className="pm-chart-card" onClick={() => showDetail("trend_chart")} style={{ cursor: "pointer" }}>
          <div className="pm-chart-header">
            <TrendingUp size={16} />
            <h3>{t("dashboard.performanceTrend")}</h3>
          </div>
          {trendData.length < 2 ? (
            <p className="pm-empty-state">{t("dashboard.noTrendData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                  formatter={(v) => [`${v}/100`, t("dashboard.score") || "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#2563eb", strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="pm-chart-card" onClick={() => showDetail("grade_chart")} style={{ cursor: "pointer" }}>
          <div className="pm-chart-header">
            <BarChart2 size={16} />
            <h3>{t("dashboard.gradeDistribution")}</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="pm-empty-state">{t("dashboard.noPieData")}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: "16px", 
                marginTop: "-5px", 
                paddingBottom: "8px", 
                fontSize: "11px", 
                color: "#475569", 
                fontWeight: "600",
                fontFamily: "Inter, sans-serif"
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: PIE_COLORS.A }}></span>
                  {t("assessment.categoryCol")} A: {categoryCounts.A} {t("dashboard.times") || "times"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: PIE_COLORS.B }}></span>
                  {t("assessment.categoryCol")} B: {categoryCounts.B} {t("dashboard.times") || "times"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: PIE_COLORS.C }}></span>
                  {t("assessment.categoryCol")} C: {categoryCounts.C} {t("dashboard.times") || "times"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: PIE_COLORS.D }}></span>
                  {t("assessment.categoryCol")} D: {categoryCounts.D} {t("dashboard.times") || "times"}
                </span>
              </div>
            </>
          )}
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