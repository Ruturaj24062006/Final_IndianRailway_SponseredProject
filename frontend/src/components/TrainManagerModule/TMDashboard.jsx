import { Gauge, TrendingUp, BarChart2, Award, Search, ArrowUpDown, Bell, Target, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, Legend } from "recharts";

const PIE_COLORS = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#dc2626' };

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
      <span>Category {payload[0].name}: </span>
      <span style={{ color: PIE_COLORS[payload[0].name] || '#6b7280' }}>{payload[0].value} attempts</span>
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

export default function TMDashboard({
  fullName,
  latestScore,
  latestCategory,
  averageScore,
  history,
  trendData,
  pieData,
  openScorecard,
  testAssigned,
  tmMcqTest,
  startTestAttempt,
  handleReattempt,
  notifications,
  unreadNotificationsCount,
  bellDropdownOpen,
  setBellDropdownOpen,
  markAllNotificationsRead,
  setActiveNav
}) {
  const categoryCounts = { A: 0, B: 0, C: 0, D: 0 };
  history.forEach(r => {
    const cat = getCategory(r.totalScore);
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    }
  });

  return (
          <div className="pm-dashboard-layout">
      {/* Summary cards */}
      <div className="pm-summary-cards">
        <article className="pm-sum-card" style={{ cursor: "pointer" }} onClick={() => setActiveNav("myAssessment")}>
          <div className="pm-sum-icon" style={{ background: "#eff6ff" }}>
            <Target size={20} color="#2563eb" />
          </div>
          <div>
            <label>Latest Score</label>
            <strong>{latestScore !== null ? `${latestScore}/100` : "—"}</strong>
          </div>
        </article>

        <article className="pm-sum-card" style={{ cursor: "pointer" }} onClick={() => setActiveNav("myAssessment")}>
          <div className="pm-sum-icon" style={{ background: "#f0fdf4" }}>
            <Gauge size={20} color="#16a34a" />
          </div>
          <div>
            <label>Average Score</label>
            <strong>{averageScore}/100</strong>
          </div>
        </article>

        <article className="pm-sum-card" style={{ cursor: "pointer" }} onClick={() => setActiveNav("myAssessment")}>
          <div className="pm-sum-icon" style={{ background: getCategoryBg(latestCategory) }}>
            <ShieldCheck size={20} color={getCategoryColor(latestCategory)} />
          </div>
          <div>
            <label>Current Category</label>
            <strong style={{ color: getCategoryColor(latestCategory) }}>
              {latestCategory !== "—" ? `Category ${latestCategory}` : "—"}
            </strong>
          </div>
        </article>

        <article className="pm-sum-card" style={{ cursor: "pointer" }} onClick={() => setActiveNav("myAssessment")}>
          <div className="pm-sum-icon" style={{ background: "#fdf4ff" }}>
            <Award size={20} color="#9333ea" />
          </div>
          <div>
            <label>Total Attempts</label>
            <strong>{history.length}</strong>
          </div>
        </article>
      </div>

      <div className="pm-charts-row">
        {/* Performance Trends Chart */}
        <div className="pm-chart-card">
          <div className="pm-chart-header">
            <TrendingUp size={16} />
            <h3>Assessment Performance Trend</h3>
          </div>
          {trendData.length < 2 ? (
            <p className="pm-empty-state">At least 2 attempts needed to show trend.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                  formatter={(v) => [`${v}/100`, "Score"]}
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
        <div className="pm-chart-card">
          <div className="pm-chart-header">
            <BarChart2 size={16} />
            <h3>Category Grade Distribution</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="pm-empty-state">No data.</p>
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
                display: 'flex', 
                justifyContent: 'center', 
                gap: '16px', 
                marginTop: '-5px', 
                paddingBottom: '8px', 
                fontSize: '11px', 
                color: '#475569', 
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS.A }}></span>
                  Cat A: {categoryCounts.A} times
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS.B }}></span>
                  Cat B: {categoryCounts.B} times
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS.C }}></span>
                  Cat C: {categoryCounts.C} times
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS.D }}></span>
                  Cat D: {categoryCounts.D} times
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     RENDER: PROFILE
  ═══════════════════════════════════════ */

}