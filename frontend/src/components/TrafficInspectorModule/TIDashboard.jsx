import { TrendingUp, Award, Clock, FileCheck, CheckCircle2, ChevronRight, Activity, Users, Building2, UserCheck, BusFront, ShieldAlert, ClipboardCheck, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LabelList, LineChart, Line } from "recharts";

const PIE_C = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];

export default function TIDashboard({
  dbStationFilter,
  setDbStationFilter,
  dbSearchQuery,
  setDbSearchQuery,
  myStations,
  users,
  getCat,
  getUserRisk,
  riskBadge,
  catBadge,
  statusBadge,
  tiAssessments,
  inspections,
  counsellings,
  activePage,
  setActivePage,
  setSelectedStation,
  fullscreenChart,
  setFullscreenChart,
  TI_PROFILE,
  stationTiMap,
  MONTHLY,
  DEFAULT_SS_TM_USERS,
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
  myStationsProgress,
  stationStats,
  roleBarData,
  pieData,
  myCompliance,
  topStations,
  bottomStations,
  myPipeline,
  myAssessmentMonthly,
  handleChartClick,
  handlePieClick
}) {
  return (
  <div className="sdom-fade">
      {/* Page header */}
      <h1 className="sdom-page-title">{TI_PROFILE.jurisdiction} Section Command Center</h1>
      <p className="sdom-page-subtitle">Complete strategic overview of your section — staff, performance, safety and assessment pipeline.</p>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {[
          { key: "stations", label: "Stations", count: myStations.length, sub: "Assigned in your section", icon: <Building2 size={18} />, color: "#1E3A5F", onClick: () => goTo("stations") },
          { key: "pointsmen", label: "Pointsmen", count: totalPM, sub: "Across assigned stations", icon: <Users size={18} />, color: "#1E3A5F", onClick: () => { goTo("pointsmen"); setUserStationFilter("All"); setUserCategoryFilter("All"); setUserRiskFilter("All"); setUserSearch(""); } },
          { key: "sm", label: "Station Masters", count: totalSMs, sub: "Across assigned stations", icon: <Building2 size={18} />, color: "#1E3A5F", onClick: () => { goTo("stationMasters"); setUserStationFilter("All"); setUserCategoryFilter("All"); setUserRiskFilter("All"); setUserSearch(""); } },
          { key: "pending", label: "Pending Approvals", count: pending, sub: "Assessments awaiting review", icon: <ClipboardCheck size={18} />, color: "#1E3A5F", onClick: () => { goTo("reviewPM"); setReviewTab("Pending"); } },
          { key: "avg", label: "Average Score", count: `${avgScoreAll}/100`, sub: "Section-wide average", icon: <Activity size={18} />, color: "#1E3A5F", onClick: () => goTo("reports") },
          { key: "risk", label: "High-Risk Staff", count: highRiskAll, sub: "Requires immediate attention", icon: <AlertTriangle size={18} />, color: "#1E3A5F", onClick: () => { goTo("pointsmen"); setUserRiskFilter("High"); setUserStationFilter("All"); setUserCategoryFilter("All"); setUserSearch(""); } },
        ].map((c) => (
          <div
            className="sdom-stat-card"
            key={c.key}
            style={{ cursor: "pointer" }}
            onClick={c.onClick}
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
        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Evaluation Progress</div>
              <div className="sdom-chart-subtitle">Completed and pending assessments in your section</div>
            </div>
            <button
              type="button"
              onClick={() => handleChartClick(null, "progress")}
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
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={myStationsProgress}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                barGap={6}
                onClick={(state) => handleChartClick(state, "progress")}
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
                  name="Completed"
                  barSize={12}
                />
                <Bar
                  dataKey="pending"
                  fill="#D69E2E"
                  radius={[4, 4, 0, 0]}
                  name="Pending"
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Average Score</div>
              <div className="sdom-chart-subtitle">Average performance scores for your stations</div>
            </div>
            <button
              type="button"
              onClick={() => handleChartClick(null, "score")}
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
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationStats.map(st => ({ station: st.code, avgScore: st.avgScore }))}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                onClick={(state) => handleChartClick(state, "score")}
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
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} formatter={(value) => [`${value}/100`, "Average Score"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="avgScore"
                  fill="#1f7a5c"
                  radius={[4, 4, 0, 0]}
                  name="Average Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Role-wise Staff Distribution Row ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Role-wise Staff Distribution</div>
          <div className="sdom-chart-subtitle">Staff count per role in your section</div>
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
        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Grade/Category Distribution</div>
              <div className="sdom-chart-subtitle">Staff grades in your section</div>
            </div>
            <button
              type="button"
              onClick={() => handlePieClick(null)}
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
              View Full Screen
            </button>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ cursor: "pointer" }}>
                <Pie
                  data={pieData.map(d => ({ name: `Grade ${d.name}`, value: d.value, fill: d.name === "A" ? "#1E3A5F" : d.name === "B" ? "#2B6CB0" : d.name === "C" ? "#D69E2E" : "#C53030" }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  onClick={(data) => handlePieClick(data)}
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

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Safety Compliance Analytics</div>
          <div className="sdom-chart-subtitle">Section compliance rates across categories</div>
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
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Section-wide Performance &amp; Safety Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Average assessment scores and safety compliance percentage in your section</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[60, 100]} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }} />
                <Line type="monotone" dataKey="safetyAvg" name="Safety Compliance%" stroke="#2F855A" strokeWidth={2.5} dot={{ r: 4, fill: "#2F855A" }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Top/Bottom Performing Stations Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Top Performing Stations</div>
          <div className="sdom-chart-subtitle">Highest average assessment score in your section</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>Safety %</th><th>High Risk</th></tr>
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

        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Stations Needing Attention</div>
          <div className="sdom-chart-subtitle">Lowest average assessment score in your section</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>Safety %</th><th>High Risk</th></tr>
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
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Assessment Pipeline</div>
          <div className="sdom-chart-subtitle">Section-wide pipeline status and trend</div>
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
    </div>
);
}
