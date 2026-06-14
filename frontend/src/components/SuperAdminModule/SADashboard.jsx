import React, { useState } from "react";
import { Target, Gauge, ShieldCheck, Award, TrendingUp, BarChart2, Building2, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend, Bar, LabelList, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];
const CAT_COLORS = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, payload: inner } = payload[0];
    return (
      <div className="pm-pie-tooltip" style={{ background: '#fff', border: '1px solid #dbe5f0', padding: '8px', borderRadius: '8px' }}>
        <strong>Category {name}</strong>
        <div>{value}% &nbsp;({inner.count} attempt{inner.count !== 1 ? "s" : ""})</div>
      </div>
    );
  }
  return null;
};

const UserRound = Users;
const UserCheck = Users;
const TrainFront = Users;

export default function SADashboard({
  averageScore,
  complianceRate,
  stationCount,
  pointsmen = [],
  stationMasters = [],
  stationSuperintendents = [],
  trainManagers = [],
  trafficInspectors = [],
  history = [],
  trendData = [],
  pieData = [],
  openScorecard,
  getCategoryBg,
  getCategoryColor,
  isRoleAssessmentOverdue,
  isRolePmeOverdue,
  isRoleRefOverdue,
  getOverdueCount,
  getAverageScore,
  staff = [],
  stations = [],
  stationProgressData = [],
  stationAverageScoreData = [],
  MONTHLY_TREND = [],
  COMPLIANCE = [],
  ASSESSMENT_MONTHLY = [],
  handleChartClick,
  handlePieClick,
  profileData = {}
}) {
  const [modalDetail, setModalDetail] = useState(null);

  // Extract PME and REF status
  const pmeRaw = profileData?.pme_status || profileData?.pmeStatus || "AUDITED (Due: 2026-06-20)";
  const pmeStatus = pmeRaw.includes(" (") ? pmeRaw.split(" (")[0] : (pmeRaw.includes(" - ") ? pmeRaw.split(" - ")[0] : pmeRaw);
  const pmeDueDate = profileData?.pme_next_due_date || (pmeRaw.includes("Due:") ? pmeRaw.split("Due:")[1].replace(")", "") : "2026-06-20");
  const pmeDoneDate = profileData?.pme_date || "2022-06-20";

  const refRaw = profileData?.ref_status || profileData?.refStatus || "COMPLETED: Executive Safety Training";
  const refStatus = refRaw.includes(":") ? refRaw.split(":")[0] : refRaw;
  const refDoneDate = profileData?.ref_date || "2024-05-12";
  const refDueDate = profileData?.ref_next_due_date || "2027-05-12";

  const counts = {
    stations:  stations.length,
    pointsmen: staff.filter(s=>s.role==="pointsmen").length,
    sm:        staff.filter(s=>s.role==="sm").length,
    ss:        staff.filter(s=>s.role==="ss").length,
    tm:        staff.filter(s=>s.role==="tm").length,
    ti:        staff.filter(s=>s.role==="ti").length,
  };

  const summaryCards = [
    { key:"stations",  label:"Stations",                count: counts.stations,  sub:"Total in Nagpur Division",   icon:<Building2 size={18}/>,  type:"stations" },
    { key:"pointsmen", label:"Pointsmen",               count: counts.pointsmen, sub:"Operational pointsmen",       icon:<Users size={18}/>,      type:"pointsmen" },
    { key:"sm",        label:"Station Masters",         count: counts.sm,        sub:"Across all stations",         icon:<UserRound size={18}/>,  type:"sm" },
    { key:"ss",        label:"Station Superintendents", count: counts.ss,        sub:"Division supervisors",        icon:<UserCheck size={18}/>,  type:"ss" },
    { key:"tm",        label:"Train Managers",          count: counts.tm,        sub:"Active train managers",       icon:<TrainFront size={18}/>, type:"tm" },
    { key:"ti",        label:"Traffic Inspectors",      count: counts.ti,        sub:"Jurisdiction coverage",       icon:<ShieldCheck size={18}/>,type:"ti" },
  ];

  const roleBar = [
    { role:"Pointsmen",              count: counts.pointsmen },
    { role:"Station Masters",        count: counts.sm },
    { role:"Station Superintendents",count: counts.ss },
    { role:"Train Managers",         count: counts.tm },
    { role:"Traffic Inspectors",     count: counts.ti },
  ];

  const catData = ["A","B","C","D"].map(c => ({
    name: `Cat ${c}`, value: staff.filter(s=>s.cat===c).length, fill: CAT_COLORS[c]
  }));

  const top10    = [...stations].sort((a,b) => b.score - a.score).slice(0,10);
  const bottom10 = [...stations].sort((a,b) => a.score - b.score).slice(0,10);

  const pData = (ASSESSMENT_MONTHLY && ASSESSMENT_MONTHLY[0]) || {};
  const pipeline = [
    { label:"Approved", count: pData.approved || 0, dot:"#1E3A5F" },
    { label:"Pending",  count: pData.pending || 0,  dot:"#4A90D9" },
    { label:"Rejected", count: pData.rejected || 0, dot:"#B83A3A" },
    { label:"Overdue",  count: pData.overdue || 0,  dot:"#5A6B7C" },
  ];

  const showDetail = (type) => {
    let title = "";
    let content = null;

    if (type === "pme_ref") {
      title = "Super Admin Medical fitness audit & Executive Safety Training Status";
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Medical Audit Status</h4>
            <p>Annual safety audit and health clearances mapped for operational command oversight.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last Audit Date: <strong>{pmeDoneDate}</strong></div>
              <div>Next Due Audit: <strong style={{ color: "#c53030" }}>{pmeDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{pmeStatus}</span></div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Executive Safety Course (REF)</h4>
            <p>Verification of mandatory leadership courses, accident mitigation reviews and command logs.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last Executive Course: <strong>{refDoneDate}</strong></div>
              <div>Next Training Review: <strong style={{ color: "#c53030" }}>{refDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{refStatus}</span></div>
            </div>
          </div>
        </div>
      );
    } else if (type === "stations") {
      title = "Division Active Stations List";
      content = (
        <div>
          <p style={{ marginBottom: 10 }}>Total stations tracked in Nagpur Division: <strong>{stations.length}</strong></p>
          <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Station</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Code</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Safety Rating</th>
                </tr>
              </thead>
              <tbody>
                {stations.map(st => (
                  <tr key={st.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px", fontWeight: "600" }}>{st.name}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{st.code}</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "#10b981", fontWeight: "700" }}>{st.safety}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "pointsmen") {
      title = "Pointsmen Division Statistics";
      content = (
        <div>
          <p>Total Pointsmen in roster database: <strong>{counts.pointsmen}</strong>.</p>
          <p style={{ marginTop: 8 }}>Clicking the summary card links you to hierarchy management details.</p>
        </div>
      );
    } else if (type === "sm") {
      title = "Station Masters Division Statistics";
      content = (
        <div>
          <p>Total Station Masters registered: <strong>{counts.sm}</strong>.</p>
        </div>
      );
    } else if (type === "ss") {
      title = "Station Superintendents Division Statistics";
      content = (
        <div>
          <p>Total Station Superintendents supervising block sections: <strong>{counts.ss}</strong>.</p>
        </div>
      );
    } else if (type === "tm") {
      title = "Train Managers Division Statistics";
      content = (
        <div>
          <p>Total active Train Managers in Nagpur division: <strong>{counts.tm}</strong>.</p>
        </div>
      );
    } else if (type === "ti") {
      title = "Traffic Inspectors Division Statistics";
      content = (
        <div>
          <p>Total Traffic Inspectors supervising local sections: <strong>{counts.ti}</strong>.</p>
        </div>
      );
    } else if (type === "station_progress") {
      title = "Station-wise Evaluation Progress Details";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Subordinate safety assessment cycles per station:</p>
          <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Station</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Completed</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {stationProgressData.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{s.station}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{s.completed}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{s.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "station_average") {
      title = "Station Average Scores Details";
      content = (
        <div>
          <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Station</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Average Marks</th>
                </tr>
              </thead>
              <tbody>
                {stationAverageScoreData.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{s.station}</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "#16a34a", fontWeight: "700" }}>{s.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "role_distribution") {
      title = "Role Staff Distribution Details";
      content = (
        <div>
          {roleBar.map(r => (
            <div key={r.role} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{r.role}</span>
              <strong>{r.count} staff</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "grade_distribution") {
      title = "Grade Distribution Details";
      content = (
        <div>
          {catData.map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{d.name}</span>
              <strong>{d.value} staff</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "safety_compliance") {
      title = "Division Safety Compliance Analytics";
      content = (
        <div>
          {COMPLIANCE.map(c => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{c.label}</span>
              <strong>{c.pct}%</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "trend_chart") {
      title = "Division Performance & Safety Trend Details";
      content = (
        <div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Month</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Average Score</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Safety Compliance %</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_TREND.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{m.month}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{m.score}%</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "#10b981", fontWeight: "700" }}>{m.safety}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "top_stations") {
      title = "Top 10 Performing Stations Details";
      content = (
        <div>
          {top10.map((st, i) => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{i+1}. <b>{st.name}</b></span>
              <span style={{ color: "#16a34a" }}>Score: <b>{st.score}%</b> | Safety: <b>{st.safety}%</b></span>
            </div>
          ))}
        </div>
      );
    } else if (type === "bottom_stations") {
      title = "Bottom 10 Stations Details";
      content = (
        <div>
          {bottom10.map((st, i) => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{i+1}. <b>{st.name}</b></span>
              <span style={{ color: "#dc2626" }}>Score: <b>{st.score}%</b> | High Risk: <b>{st.highRisk}</b></span>
            </div>
          ))}
        </div>
      );
    } else if (type === "assessment_pipeline") {
      title = "Assessment Pipeline Details";
      content = (
        <div>
          {pipeline.map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.label}</span>
              <strong>{p.count} assessments</strong>
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
      <h1 className="sdom-page-title">Nagpur Division Command Center</h1>
      <p className="sdom-page-subtitle">Complete strategic overview of the division — staff, performance, safety and assessment pipeline.</p>

      {/* Super Admin Personal Safety Section */}
      <div className="sdom-chart-card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", borderLeft: "6px solid #1E3A5F", cursor: "pointer" }} onClick={() => showDetail("pme_ref")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0B1F3A" }}>My Personal Safety & Compliance Stats</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Audit health logs and executive training verification</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Medical Audit Status</span>
              <span className="sdom-badge" style={{
                background: pmeStatus === "AUDITED" || pmeStatus === "Fit" || pmeStatus === "FIT" || pmeStatus === "Valid" ? "#C6F6D5" : "#FED7D7",
                color: pmeStatus === "AUDITED" || pmeStatus === "Fit" || pmeStatus === "FIT" || pmeStatus === "Valid" ? "#2F855A" : "#C53030",
                padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700"
              }}>
                {pmeStatus}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              <div>Last Audit Date: <strong>{pmeDoneDate}</strong></div>
              <div style={{ marginTop: "4px" }}>Next Audit Date: <strong style={{ color: "#2563eb" }}>{pmeDueDate}</strong></div>
            </div>
          </div>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Refresher Safety Audit</span>
              <span className="sdom-badge" style={{
                background: refStatus === "COMPLETED" || refStatus === "Valid" || refStatus === "Cleared" ? "#C6F6D5" : "#FEE2E2",
                color: refStatus === "COMPLETED" || refStatus === "Valid" || refStatus === "Cleared" ? "#2F855A" : "#D97706",
                padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700"
              }}>
                {refStatus}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              <div>Last Review: <strong>{refDoneDate}</strong></div>
              <div style={{ marginTop: "4px" }}>Next Due Date: <strong style={{ color: "#2563eb" }}>{refDueDate}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {summaryCards.map(c => (
          <div className="sdom-stat-card" key={c.key} style={{ cursor: "pointer" }} onClick={() => showDetail(c.type)}>
            <div className="sdom-stat-icon">
              <span style={{color:"#1E3A5F"}}>{c.icon}</span>
            </div>
            <div className="sdom-stat-label">{c.label}</div>
            <div className="sdom-stat-value">{c.count}</div>
            <div className="sdom-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Station-wise Evaluation Progress & Average Score at the Top ── */}
      <div className="sdom-row-2">
        {/* Station-wise Evaluation Progress */}
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("station_progress")}>
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Evaluation Progress</div>
              <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
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
                transition: "all 0.2s ease",
              }}
            >
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationProgressData}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                barGap={6}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis
                  dataKey="station"
                  tick={{ fontSize: 10, fill: "#627D98" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
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

        {/* Station-wise Average Score */}
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("station_average")}>
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Average Score</div>
              <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
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
                transition: "all 0.2s ease",
              }}
            >
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationAverageScoreData}
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
                <RTooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} formatter={(value) => [`${value}/100`, "Average Score"]} />
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

      {/* ── Role-wise Distribution ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("role_distribution")}>
          <div className="sdom-chart-title">Role-wise Staff Distribution</div>
          <div className="sdom-chart-subtitle">Staff count per role across the division</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBar} margin={{ top:16, right:40, left:0, bottom:8 }} barSize={52}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="role" fontSize={12} tick={{fill:"#102A43",fontWeight:600}} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}} />
                <Bar dataKey="count" fill="#1E3A5F" radius={[5,5,0,0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize:12, fontWeight:700, fill:"#102A43" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Category + Safety ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("grade_distribution")}>
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Category Distribution (Division-wide)</div>
              <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
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
                transition: "all 0.2s ease",
              }}
            >
              View Full Screen
            </button>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={catData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={110}
                  dataKey="value" 
                  paddingAngle={3} 
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                >
                  {catData.map((d,i) => <Cell key={i} fill={d.fill} style={{ cursor: "pointer" }} />)}
                </Pie>
                <Legend wrapperStyle={{ cursor: "pointer" }} />
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("safety_compliance")}>
          <div className="sdom-chart-title">Safety Compliance Analytics</div>
          <div className="sdom-chart-subtitle">Division-wide compliance across all categories</div>
          <div style={{ marginTop: 16 }}>
            {COMPLIANCE.map(c => (
              <div className="sdom-compliance-item" key={c.label}>
                <div className="sdom-compliance-header">
                  <span>{c.label}</span>
                  <span className="sdom-compliance-pct">{c.pct}%</span>
                </div>
                <div className="sdom-compliance-track">
                  <div className="sdom-compliance-fill" style={{ width:`${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score Trend ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("trend_chart")}>
          <div className="sdom-chart-title">Division-wide Performance & Safety Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Average assessment scores and safety compliance percentage over time</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TREND} margin={{ top:10, right:30, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[60,100]} fontSize={12} />
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}} />
                <Legend wrapperStyle={{fontSize:"0.82rem"}} />
                <Line type="monotone" dataKey="score"  name="Avg Score"         stroke="#1E3A5F" strokeWidth={2.5} dot={{r:4,fill:"#1E3A5F"}} />
                <Line type="monotone" dataKey="safety" name="Safety Compliance%" stroke="#2F855A" strokeWidth={2.5} dot={{r:4,fill:"#2F855A"}} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Station Performance Top/Bottom ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("top_stations")}>
          <div className="sdom-chart-title" style={{marginBottom:4}}>Top 10 Performing Stations</div>
          <div className="sdom-chart-subtitle">Sorted by average assessment score</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>Safety %</th><th>Pending</th></tr>
              </thead>
              <tbody>
                {top10.map((st,i) => (
                  <tr key={st.id}>
                    <td style={{color:"#9FB3C8",fontWeight:700}}>{i+1}</td>
                    <td style={{fontWeight:600}}>{st.name}</td>
                    <td><span style={{color:"#2F855A",fontWeight:700}}>{st.score}</span></td>
                    <td>{st.safety}%</td>
                    <td>{st.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("bottom_stations")}>
          <div className="sdom-chart-title" style={{marginBottom:4}}>Bottom 10 — Stations Needing Attention</div>
          <div className="sdom-chart-subtitle">Sorted by average assessment score (ascending)</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>High Risk</th><th>Pending</th></tr>
              </thead>
              <tbody>
                {bottom10.map((st,i) => (
                  <tr key={st.id}>
                    <td style={{color:"#9FB3C8",fontWeight:700}}>{i+1}</td>
                    <td style={{fontWeight:600}}>{st.name}</td>
                    <td><span style={{color: st.score < 75 ? "#C53030":"#D69E2E",fontWeight:700}}>{st.score}</span></td>
                    <td>{st.highRisk > 3 ? <span style={{color:"#C53030",fontWeight:700}}>{st.highRisk}</span> : st.highRisk}</td>
                    <td>{st.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Assessment Pipeline ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }} onClick={() => showDetail("assessment_pipeline")}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }}>
          <div className="sdom-chart-title">Assessment Pipeline</div>
          <div className="sdom-chart-subtitle">Current assessment status and monthly trend</div>
          <div className="sdom-pipeline-row">
            {pipeline.map(p => (
              <div className="sdom-pipeline-card" key={p.label}>
                <div className="sdom-pipeline-dot" style={{background:p.dot}} />
                <div>
                  <div className="sdom-pipeline-lbl">{p.label}</div>
                  <div className="sdom-pipeline-val">{p.count.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 280, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ASSESSMENT_MONTHLY} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="month" fontSize={12} tick={{fill:"#627D98"}} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}} />
                <Legend wrapperStyle={{fontSize:"0.82rem"}} />
                <Bar dataKey="approved" name="Approved" fill="#1E3A5F" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending"  name="Pending"  fill="#4A90D9" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#B83A3A" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="overdue"  name="Overdue"  fill="#5A6B7C" barSize={12} radius={[2, 2, 0, 0]} />
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
