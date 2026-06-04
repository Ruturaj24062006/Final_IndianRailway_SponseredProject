import React, { useState } from "react";
import { Target, Gauge, ShieldCheck, Award, TrendingUp, BarChart2, Users, Building2, Shield, HeartHandshake } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, BarChart, Bar, Legend, LabelList } from "recharts";

const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };
const CAT_COLORS  = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };

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

export default function SSDashboard({
  latestScore,
  averageScore,
  latestCategory,
  latestPmeStatus,
  latestRefStatus,
  history,
  trendData,
  pieData,
  openScorecard,
  getCategoryBg,
  getCategoryColor,
  setActiveNav,
  pointsmen = [],
  stationMasters = [],
  employeeId
}) {
  const [counselSchedules, setCounselSchedules] = useState(() => {
    const saved = localStorage.getItem("ss_counsel_schedules");
    return saved ? JSON.parse(saved) : {};
  });
  const [viewingStaff, setViewingStaff] = useState(null);

  const handleScheduleCounselling = (id, datetime) => {
    const [date, time] = datetime.split("T");
    const updated = {
      ...counselSchedules,
      [id]: { date, time, attended: false }
    };
    setCounselSchedules(updated);
    localStorage.setItem("ss_counsel_schedules", JSON.stringify(updated));
  };

  const handleCancelSchedule = (id) => {
    const updated = { ...counselSchedules };
    delete updated[id];
    setCounselSchedules(updated);
    localStorage.setItem("ss_counsel_schedules", JSON.stringify(updated));
  };

  const handleToggleAttendance = (id) => {
    const updated = {
      ...counselSchedules,
      [id]: { ...counselSchedules[id], attended: !counselSchedules[id].attended }
    };
    setCounselSchedules(updated);
    localStorage.setItem("ss_counsel_schedules", JSON.stringify(updated));
  };

  const getCat = (score) => {
    if (score >= 80) return "A";
    if (score >= 50) return "B";
    if (score >= 26) return "C";
    return "D";
  };

  const riskLevel = (pm) => {
    if (pm.pmeStatus === "Overdue" || pm.refStatus === "Expired" || pm.score < 50) return "High";
    if (pm.score >= 80) return "Low";
    return "Medium";
  };

  // Station details & staff stats
  const allSubordinates = [...stationMasters, ...pointsmen];
  const avgSubScore = allSubordinates.length
    ? Math.round(allSubordinates.reduce((s, p) => s + (p.score || 0), 0) / allSubordinates.length)
    : 0;

  // Nagpur Junction details
  const myStationObj = {
    name: "Nagpur Junction",
    code: "NGP",
    ti: "TI NGP",
    smCount: stationMasters.length,
    pmCount: pointsmen.length,
    score: avgSubScore,
    safety: allSubordinates.length
      ? Math.round(allSubordinates.reduce((s, p) => s + (p.score >= 50 ? 100 : 50), 0) / allSubordinates.length)
      : 0,
    highRisk: allSubordinates.filter(p => riskLevel(p) === "High").length
  };

  // Dynamic distribution from subordinates
  const catCount = ["A", "B", "C", "D"].map(c => ({
    cat: `Cat ${c}`,
    count: allSubordinates.filter(p => getCat(p.score) === c).length,
    fill: CAT_COLORS[c]
  }));

  const riskCount = [
    { name: "Low",    value: allSubordinates.filter(p => riskLevel(p) === "Low").length,    fill: RISK_COLORS.Low },
    { name: "Medium", value: allSubordinates.filter(p => riskLevel(p) === "Medium").length, fill: RISK_COLORS.Medium },
    { name: "High",   value: allSubordinates.filter(p => riskLevel(p) === "High").length,   fill: RISK_COLORS.High },
  ].filter(r => r.value > 0);

  const trend = [
    { month: "Dec'25", score: 82, safety: 86 },
    { month: "Jan'26", score: 85, safety: 89 },
    { month: "Feb'26", score: 88, safety: 91 },
    { month: "Mar'26", score: 91, safety: 93 },
    { month: "Apr'26", score: 90, safety: 94 },
    { month: "May'26", score: avgSubScore || 85, safety: myStationObj.safety || 90 }
  ];

  const tiPerson = { name: "R. Khan", id: "TI_1001", contact: "+91 99999 33333", email: "r.khan@rail.in", role: "ti", station: "Nagpur Junction" };

  return (
    <div className="sdom-fade">
      {/* SS Personal Stats Section */}
      <div className="sdom-chart-card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", borderLeft: "6px solid #1E3A5F" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0B1F3A" }}>My Personal Safety Competency Stats</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Self-evaluation, CBT results, and personal grade profile</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#eff6ff", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <Target size={20} color="#2563eb" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>Latest Score</label>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>{latestScore !== null ? `${latestScore}/100` : "—"}</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#f0fdf4", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <Gauge size={20} color="#16a34a" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>Average Score</label>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>{averageScore}/100</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: latestPmeStatus === "Fit" ? "#f0fdf4" : "#fee2e2", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <ShieldCheck size={20} color={latestPmeStatus === "Fit" ? "#16a34a" : "#dc2626"} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>Category & PME</label>
              <strong style={{ fontSize: "16px", color: latestPmeStatus === "Fit" ? "#16a34a" : "#dc2626" }}>
                Cat {latestCategory} ({latestPmeStatus || "Fit"})
              </strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#fdf4ff", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <Award size={20} color="#9333ea" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>Refresher Status</label>
              <strong style={{ fontSize: "15px", color: "#9333ea" }}>{latestRefStatus || "Cleared"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards for Nagpur Junction */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Station Staff",   val: stationMasters.length + pointsmen.length, tab: "pointsmen" },
          { label: "Pending Assessments",   val: allSubordinates.filter(u => u.status === "Pending" || u.approvalStatus === "Pending").length, tab: "pointsmen" },
          { label: "Completed Evaluations", val: allSubordinates.filter(u => u.status === "Approved" || u.approvalStatus === "Approved").length, tab: "pointsmen" },
          { label: "High-Risk Staff",       val: myStationObj.highRisk, tab: "pointsmen" },
          { label: "Safety Compliance",     val: `${myStationObj.safety}%`, tab: "pointsmen" },
        ].map(c => (
          <div key={c.label} className="sdom-stat-card" onClick={() => setActiveNav(c.tab)} style={{ cursor: "pointer" }}>
            <div className="sdom-stat-value">{c.val}</div>
            <div className="sdom-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Category Distribution</div>
          <div className="sdom-chart-subtitle">A/B/C/D breakdown of Station Masters and Pointsmen at Nagpur Junction</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catCount} barSize={46} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                <XAxis dataKey="cat" fontSize={12} tick={{ fill: "#102A43", fontWeight: 600 }} axisLine={false} tickLine={false}/>
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} cursor={{ fill: "rgba(0,0,0,0.03)" }}/>
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {catCount.map((d, i) => <Cell key={i} fill={CAT_COLORS[Object.keys(CAT_COLORS)[i]]}/>)}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#102A43" }}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Risk Distribution</div>
          <div className="sdom-chart-subtitle">Nagpur Junction staff risk level breakdown</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                     dataKey="value" paddingAngle={4}
                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                     labelLine={false}>
                  {riskCount.map((d, i) => <Cell key={i} fill={d.fill}/>)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: "0.82rem" }}/>
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Score & Safety Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Monthly performance tracking for Nagpur Junction</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                <YAxis domain={[50, 100]} fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }}/>
                <Legend wrapperStyle={{ fontSize: "0.82rem" }}/>
                <Line type="monotone" dataKey="score" name="Avg Score" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }}/>
                <Line type="monotone" dataKey="safety" name="Safety %" stroke="#2F855A" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: "#2F855A" }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PME, REF, and Counselling Management */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <ShieldCheck size={18} color="#0B1F3A" />
            <span>Operational Readiness & Safety Compliance (PME, REF & Counselling)</span>
          </div>
          <div className="sdom-chart-subtitle" style={{ marginBottom: "16px" }}>
            Monitor medical fitness, refresher training, safety counselling schedules and attendance for station staff.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            {/* PME Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>Periodic Medical Examination (PME)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {allSubordinates.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600" }}>{p.name} ({p.id})</span>
                    <span className={`sdom-badge ${
                      p.pmeStatus === "Fit" || p.pmeStatus === "FIT" || p.pmeStatus === "Cleared" ? "sdom-badge-success" :
                      p.pmeStatus === "Pending" ? "sdom-badge-warning" : "sdom-badge-danger"
                    }`}>{p.pmeStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* REF Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>Refresher Training (REF)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {allSubordinates.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600" }}>{p.name} ({p.id})</span>
                    <span className={`sdom-badge ${
                      p.refStatus === "Cleared" || p.refStatus === "COMPLETED" ? "sdom-badge-success" :
                      p.refStatus === "Pending" ? "sdom-badge-warning" : "sdom-badge-danger"
                    }`}>{p.refStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Counselling & Category D Scheduling Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>Safety Counselling & Category D Scheduler</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
                {allSubordinates.filter(p => getCat(p.score) === "D").length === 0 ? (
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>No staff currently in Category D (needing counselling).</p>
                ) : (
                  allSubordinates.filter(p => getCat(p.score) === "D").map(p => {
                    const isScheduled = counselSchedules[p.id];
                    return (
                      <div key={p.id} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "700", color: "#dc2626" }}>{p.name} ({p.id})</span>
                          <span className="sdom-badge sdom-badge-danger">Cat D ({p.score}%)</span>
                        </div>
                        
                        {isScheduled ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ fontSize: "11px", color: "#475569" }}>
                              <b>Scheduled:</b> {isScheduled.date} at {isScheduled.time}
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button className="sdom-btn-ghost" style={{ padding: "4px 8px", fontSize: "10px", background: isScheduled.attended ? "#dcfce7" : "#fff", borderColor: isScheduled.attended ? "#86efac" : "#cbd5e1" }} onClick={() => handleToggleAttendance(p.id)}>
                                {isScheduled.attended ? "✓ Attended" : "Mark Attendance"}
                              </button>
                              <button className="sdom-btn-ghost" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => handleCancelSchedule(p.id)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="datetime-local" id={`schedule-${p.id}`} style={{ fontSize: "11px", padding: "4px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                            <button className="sdom-btn-primary" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => {
                              const val = document.getElementById(`schedule-${p.id}`).value;
                              if (val) handleScheduleCounselling(p.id, val);
                              else alert("Please select date and time.");
                            }}>
                              Schedule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station Masters */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Station Masters under Nagpur Junction</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Last Score</th><th>Last Assessment</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {stationMasters.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id}</td>
                    <td>
                      <span className={`sdom-badge ${s.cat === "A" || getCat(s.score) === "A" ? "sdom-badge-success" : s.cat === "B" || getCat(s.score) === "B" ? "sdom-badge-info" : s.cat === "C" || getCat(s.score) === "C" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{s.cat || getCat(s.score)}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.score}</td>
                    <td>{s.lastAssessDate || s.lastDate || "—"}</td>
                    <td>
                      <span className={`sdom-badge ${s.status === "Approved" || s.approvalStatus === "Approved" ? "sdom-badge-success" : "sdom-badge-warning"}`}>{s.status || s.approvalStatus || "Approved"}</span>
                    </td>
                    <td>
                      <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...s, reportingAom: "P. K. Verma (Sr. DOM)", role: "Station Master" })}>View Details</button>
                    </td>
                  </tr>
                ))}
                {stationMasters.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#64748b" }}>No Station Masters found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pointsmen */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Pointsmen under Nagpur Junction</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Risk Level</th><th>Latest Score</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pointsmen.map(p => {
                  const cat = getCat(p.score);
                  const risk = riskLevel(p);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{p.id}</td>
                      <td>
                        <span className={`sdom-badge ${cat === "A" ? "sdom-badge-success" : cat === "B" ? "sdom-badge-info" : cat === "C" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{cat}</span>
                      </td>
                      <td>
                        <span className={`sdom-badge ${risk === "Low" ? "sdom-badge-success" : risk === "Medium" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{risk}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{p.score}/100</td>
                      <td>
                        <span className={`sdom-badge ${p.approvalStatus === "Approved" || p.status === "Approved" ? "sdom-badge-success" : "sdom-badge-warning"}`}>{p.approvalStatus || p.status || "Approved"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...p, reportingAom: "S. Deshmukh (SM)", email: `${p.id.toLowerCase()}@rail.in`, role: "Pointsman" })}>Profile</button>
                          <button className="sdom-btn-ghost" style={{ color: "#2563eb" }} onClick={() => { setActiveNav("pointsmen"); }}>Monitor</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pointsmen.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#64748b" }}>No Pointsmen found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TI Card */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Assigned Traffic Inspector</div>
          <div className="sdom-ti-card">
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e3a5f", marginBottom: 4 }}>{tiPerson.name}</div>
              <div style={{ color: "#4b6a9b", fontSize: "0.9rem", marginBottom: 8 }}>Traffic Inspector &bull; {myStationObj.ti}</div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}><b>ID:</b> {tiPerson.id}</span>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}><b>Contact:</b> {tiPerson.contact}</span>
              </div>
            </div>
            <button className="sdom-btn-outline" onClick={() => setViewingStaff(tiPerson)}>View Profile</button>
          </div>
        </div>
      </div>

      {/* Detailed Staff Profile Modal */}
      {viewingStaff && (
        <div className="sdom-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setViewingStaff(null)}>
          <div className="sdom-modal" style={{ width: "650px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0B1F3A" }}>Detailed Staff Card</h3>
              <button type="button" onClick={() => setViewingStaff(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
            </div>

            <div className="sdom-station-header" style={{ marginBottom: "20px", padding: "16px" }}>
              <div className="sdom-station-header-meta">
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Staff Profile</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 2 }}>{viewingStaff.name}</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{viewingStaff.role} &bull; {viewingStaff.hrmsId || viewingStaff.id}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              {[
                ["Employee ID / HRMS ID", viewingStaff.hrmsId || viewingStaff.id],
                ["Designation", viewingStaff.role],
                ["Contact Number", viewingStaff.contact || "+91 98220 44556"],
                ["Email ID", viewingStaff.email || `${(viewingStaff.hrmsId || viewingStaff.id).toLowerCase()}@rail.in`],
                ["Current Station Placement", viewingStaff.station || "Nagpur Junction"],
                ["Reporting Officer", viewingStaff.reportingAom || "P. K. Verma (Sr. DOM)"],
                ["Operational Zone", "Central Railway"],
                ["Operational Division", "Nagpur"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="sdom-btn-primary" onClick={() => setViewingStaff(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
