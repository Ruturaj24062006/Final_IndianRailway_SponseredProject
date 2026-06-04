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

// Lucide icon components replacement for renderDashboard compatibility
const UserRound = Users;
const UserCheck = Users;
const TrainFront = Users;

export default function SADashboard({
  averageScore,
  complianceRate,
  stationCount,
  pointsmen,
  stationMasters,
  stationSuperintendents,
  trainManagers,
  trafficInspectors,
  history,
  trendData,
  pieData,
  openScorecard,
  getCategoryBg,
  getCategoryColor,
  isRoleAssessmentOverdue,
  isRolePmeOverdue,
  isRoleRefOverdue,
  getOverdueCount,
  getAverageScore,
  // pass other properties used
  staff,
  stations,
  stationProgressData,
  stationAverageScoreData,
  MONTHLY_TREND,
  COMPLIANCE,
  ASSESSMENT_MONTHLY,
  handleChartClick,
  handlePieClick
}) {
  const counts = {
      stations:  stations.length,
      pointsmen: staff.filter(s=>s.role==="pointsmen").length,
      sm:        staff.filter(s=>s.role==="sm").length,
      ss:        staff.filter(s=>s.role==="ss").length,
      tm:        staff.filter(s=>s.role==="tm").length,
      ti:        staff.filter(s=>s.role==="ti").length,
    };
    const summaryCards = [
      { key:"stations",  label:"Stations",                count: counts.stations,  sub:"Total in Nagpur Division",   icon:<Building2 size={18}/>,  color:"#1E3A5F" },
      { key:"pointsmen", label:"Pointsmen",               count: counts.pointsmen, sub:"Operational pointsmen",       icon:<Users size={18}/>,      color:"#1E3A5F" },
      { key:"sm",        label:"Station Masters",         count: counts.sm,        sub:"Across all stations",         icon:<UserRound size={18}/>,  color:"#1E3A5F" },
      { key:"ss",        label:"Station Superintendents", count: counts.ss,        sub:"Division supervisors",        icon:<UserCheck size={18}/>,  color:"#1E3A5F" },
      { key:"tm",        label:"Train Managers",          count: counts.tm,        sub:"Active train managers",       icon:<TrainFront size={18}/>, color:"#1E3A5F" },
      { key:"ti",        label:"Traffic Inspectors",      count: counts.ti,        sub:"Jurisdiction coverage",       icon:<ShieldCheck size={18}/>,color:"#1E3A5F" },
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

    const pipeline = [
      { label:"Approved", count:4520, dot:"#1E3A5F" },
      { label:"Pending",  count:246,  dot:"#4A90D9" },
      { label:"Rejected", count:87,   dot:"#B83A3A" },
      { label:"Overdue",  count:33,   dot:"#5A6B7C" },
    ];

    return (
      <div className="sdom-fade">
        {/* Page header */}
        <h1 className="sdom-page-title">Nagpur Division Command Center</h1>
        <p className="sdom-page-subtitle">Complete strategic overview of the division — staff, performance, safety and assessment pipeline.</p>

        {/* ── Summary Cards ── */}
        <div className="sdom-summary-cards">
          {summaryCards.map(c => (
            <div className="sdom-stat-card" key={c.key}>
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
          <div className="sdom-chart-card">
            <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div className="sdom-chart-title">Station-wise Evaluation Progress</div>
                <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
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
                  onClick={(state) => handleChartClick(state, "progress")}
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
          <div className="sdom-chart-card">
            <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div className="sdom-chart-title">Station-wise Average Score</div>
                <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
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
        <div className="sdom-row-1">
          <div className="sdom-chart-card">
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
          <div className="sdom-chart-card">
            <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div className="sdom-chart-title">Category Distribution (Division-wide)</div>
                <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
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
                  transition: "all 0.2s ease",
                }}
              >
                View Full Screen
              </button>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{ cursor: "pointer" }}>
                  <Pie 
                    data={catData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={110}
                    dataKey="value" 
                    paddingAngle={3} 
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                    onClick={(data) => handlePieClick(data)}
                  >
                    {catData.map((d,i) => <Cell key={i} fill={d.fill} style={{ cursor: "pointer" }} />)}
                  </Pie>
                  <Legend onClick={(data) => handlePieClick({ name: data.value })} wrapperStyle={{ cursor: "pointer" }} />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sdom-chart-card">
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
        <div className="sdom-row-1">
          <div className="sdom-chart-card">
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
          <div className="sdom-chart-card">
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

          <div className="sdom-chart-card">
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
        <div className="sdom-row-1">
          <div className="sdom-chart-card">
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

      </div>
    );
}
