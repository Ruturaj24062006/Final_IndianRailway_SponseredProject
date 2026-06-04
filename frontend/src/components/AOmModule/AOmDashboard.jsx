import React, { useState } from "react";
import { Users, Building2, UserCheck, ShieldCheck, BusFront, UserRound } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList, PieChart, Pie, Cell, LineChart, Line } from "recharts";

// Icon aliases
const TrainFront = BusFront;

export default function AOmDashboard({
  // Staff arrays
  aomPointsmen = [],
  stationMastersDirectory = [],
  aomSuperintendents = [],
  aomTrainManagers = [],
  trafficInspectors = [],
  stations = [],
  // Chart data passed from parent
  stationProgressData = [],
  stationAverageScoreData = [],
  DASHBOARD_96_STATIONS = [],
  MONTHLY_TREND = [],
  COMPLIANCE = [],
  ASSESSMENT_MONTHLY = [],
  handleChartClick = () => {},
  handlePieClick = () => {},
  setActivePage = () => {}
}) {
  const [counselSchedules, setCounselSchedules] = useState(() => {
    const saved = localStorage.getItem("aom_counsel_schedules");
    return saved ? JSON.parse(saved) : {};
  });

  const handleScheduleCounselling = (id, datetime) => {
    const [date, time] = datetime.split("T");
    const updated = {
      ...counselSchedules,
      [id]: { date, time, attended: false }
    };
    setCounselSchedules(updated);
    localStorage.setItem("aom_counsel_schedules", JSON.stringify(updated));
  };

  const handleCancelSchedule = (id) => {
    const updated = { ...counselSchedules };
    delete updated[id];
    setCounselSchedules(updated);
    localStorage.setItem("aom_counsel_schedules", JSON.stringify(updated));
  };

  const handleToggleAttendance = (id) => {
    const updated = {
      ...counselSchedules,
      [id]: { ...counselSchedules[id], attended: !counselSchedules[id].attended }
    };
    setCounselSchedules(updated);
    localStorage.setItem("aom_counsel_schedules", JSON.stringify(updated));
  };

  const getCat = (score) => {
    if (score === undefined || score === null) return "Unknown";
    if (score >= 80) return "A";
    if (score >= 50) return "B";
    if (score >= 26) return "C";
    return "D";
  };

  const allStaff = [
    ...aomPointsmen.map(p => ({ ...p, roleName: "Pointsman", idKey: p.hrmsId || p.id, scoreKey: p.lastScore, pmeStatus: p.pmeStatus || "Fit", refStatus: p.refStatus || "Cleared" })),
    ...stationMastersDirectory.map(sm => ({ ...sm, roleName: "Station Master", idKey: sm.hrmsId || sm.id, scoreKey: sm.score, pmeStatus: sm.pmeStatus || "Fit", refStatus: sm.refStatus || "Cleared" })),
    ...aomSuperintendents.map(ss => ({ ...ss, roleName: "Station Superintendent", idKey: ss.employeeId || ss.id, scoreKey: ss.score, pmeStatus: ss.pmeStatus || "Fit", refStatus: ss.refStatus || "Cleared" })),
    ...aomTrainManagers.map(tm => ({ ...tm, roleName: "Train Manager", idKey: tm.employeeId || tm.id, scoreKey: tm.score, pmeStatus: tm.pmeStatus || "Fit", refStatus: tm.refStatus || "Cleared" }))
  ];

  const counts = {
    stations: stations.length || 96,
    pointsmen: aomPointsmen.length,
    sm: stationMastersDirectory.length,
    ss: aomSuperintendents.length,
    tm: aomTrainManagers.length,
    ti: trafficInspectors.length
  };

  const summaryCards = [
    { key: "stations",  label: "Stations",                count: counts.stations,  sub: "Total in Nagpur Division",   icon: <Building2 size={18} />,  color: "#1E3A5F" },
    { key: "pointsmen", label: "Pointsmen",               count: counts.pointsmen, sub: "Operational pointsmen",       icon: <Users size={18} />,      color: "#1E3A5F" },
    { key: "sm",        label: "Station Masters",         count: counts.sm,        sub: "Across all stations",         icon: <UserRound size={18} />,  color: "#1E3A5F" },
    { key: "ss",        label: "Station Superintendents", count: counts.ss,        sub: "Division supervisors",        icon: <UserCheck size={18} />,  color: "#1E3A5F" },
    { key: "tm",        label: "Train Managers",          count: counts.tm,        sub: "Active train managers",       icon: <TrainFront size={18} />, color: "#1E3A5F" },
    { key: "ti",        label: "Traffic Inspectors",      count: counts.ti,        sub: "Jurisdiction coverage",       icon: <ShieldCheck size={18} />,color: "#1E3A5F" },
  ];

  const roleBar = [
    { role: "Pointsmen",               count: counts.pointsmen },
    { role: "Station Masters",         count: counts.sm },
    { role: "Station Superintendents", count: counts.ss },
    { role: "Train Managers",          count: counts.tm },
    { role: "Traffic Inspectors",      count: counts.ti },
  ];

  const catData = [
    { name: "Grade A", value: 14.6, fill: "#1E3A5F" },
    { name: "Grade B", value: 37.5, fill: "#2B6CB0" },
    { name: "Grade C", value: 36.5, fill: "#D69E2E" },
    { name: "Grade D", value: 11.5, fill: "#C53030" }
  ];

  const top10    = [...DASHBOARD_96_STATIONS].sort((a, b) => b.avgScore - a.avgScore).slice(0, 10);
  const bottom10 = [...DASHBOARD_96_STATIONS].sort((a, b) => a.avgScore - b.avgScore).slice(0, 10);

  const pipeline = [
    { label: "Approved", count: 4520, dot: "#1E3A5F" },
    { label: "Pending",  count: 246,  dot: "#4A90D9" },
    { label: "Rejected", count: 87,   dot: "#B83A3A" },
    { label: "Overdue",  count: 33,   dot: "#5A6B7C" }
  ];

  return (
    <div className="sdom-fade">
      {/* Page header */}
      <h1 className="sdom-page-title">Nagpur Division Command Center</h1>
      <p className="sdom-page-subtitle">Complete strategic overview of the division — staff, performance, safety and assessment pipeline.</p>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {summaryCards.map((c) => (
          <div
            className="sdom-stat-card"
            key={c.key}
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (c.key === "stations") setActivePage("Stations");
              else if (c.key === "pointsmen") setActivePage("Pointsmen");
              else if (c.key === "sm") setActivePage("Station Masters");
              else if (c.key === "ss") setActivePage("Station Superintendents");
              else if (c.key === "tm") setActivePage("Train Managers");
              else if (c.key === "ti") setActivePage("Traffic Inspectors");
            }}
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

      {/* ── Station-wise Evaluation Progress & Average Score ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Evaluation Progress</div>
              <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
            </div>
            <button type="button" onClick={() => handleChartClick(null, "progress")}
              style={{ background: "var(--brand-primary, #0B1F3A)", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationProgressData} margin={{ top: 8, right: 12, left: -20, bottom: 5 }} barGap={6}
                onClick={(state) => handleChartClick(state, "progress")} style={{ cursor: "pointer" }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="station" tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="completed" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Completed" barSize={12} />
                <Bar dataKey="pending"   fill="#D69E2E" radius={[4, 4, 0, 0]} name="Pending"   barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Average Score</div>
              <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
            </div>
            <button type="button" onClick={() => handleChartClick(null, "score")}
              style={{ background: "#1f7a5c", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationAverageScoreData} margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                onClick={(state) => handleChartClick(state, "score")} style={{ cursor: "pointer" }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="station" tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} formatter={(value) => [`${value}/100`, "Average Score"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="avgScore" fill="#1f7a5c" radius={[4, 4, 0, 0]} name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Role-wise Distribution ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Role-wise Staff Distribution</div>
          <div className="sdom-chart-subtitle">Staff count per role across the division</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBar} margin={{ top: 16, right: 40, left: 0, bottom: 8 }} barSize={52}>
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

      {/* ── Category + Safety ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Category Distribution (Division-wide)</div>
              <div className="sdom-chart-subtitle">Click anywhere on chart to zoom & filter 96 stations</div>
            </div>
            <button type="button" onClick={() => handlePieClick(null)}
              style={{ background: "var(--brand-primary, #0B1F3A)", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              View Full Screen
            </button>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ cursor: "pointer" }}>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                  dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  onClick={(data) => handlePieClick(data)}>
                  {catData.map((d, i) => <Cell key={i} fill={d.fill} style={{ cursor: "pointer" }} />)}
                </Pie>
                <Legend onClick={(data) => handlePieClick({ name: data.value })} wrapperStyle={{ cursor: "pointer" }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Safety Compliance Analytics</div>
          <div className="sdom-chart-subtitle">Division-wide compliance across all categories</div>
          <div style={{ marginTop: 16 }}>
            {COMPLIANCE.map((c) => (
              <div className="sdom-compliance-item" key={c.label}>
                <div className="sdom-compliance-header">
                  <span>{c.label}</span>
                  <span className="sdom-compliance-pct">{c.pct}%</span>
                </div>
                <div className="sdom-compliance-track">
                  <div className="sdom-compliance-fill" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score Trend ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Division-wide Performance & Safety Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Average assessment scores and safety compliance percentage over time</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TREND} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[60, 100]} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Line type="monotone" dataKey="score"  name="Avg Score"          stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }} />
                <Line type="monotone" dataKey="safety" name="Safety Compliance%"  stroke="#2F855A" strokeWidth={2.5} dot={{ r: 4, fill: "#2F855A" }} strokeDasharray="5 3" />
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
            Monitor medical fitness, refresher training, safety counselling schedules and attendance for division staff.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            {/* PME Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>Periodic Medical Examination (PME)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                {allStaff.map(p => (
                  <div key={p.idKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600" }}>{p.name} ({p.idKey}) - <span style={{ color: "#64748b" }}>{p.roleName}</span></span>
                    <span className={`sdom-badge ${
                      p.pmeStatus === "Fit" ? "sdom-badge-success" :
                      p.pmeStatus === "Pending" ? "sdom-badge-warning" : "sdom-badge-danger"
                    }`}>{p.pmeStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* REF Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>Refresher Training (REF)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                {allStaff.map(p => (
                  <div key={p.idKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600" }}>{p.name} ({p.idKey}) - <span style={{ color: "#64748b" }}>{p.roleName}</span></span>
                    <span className={`sdom-badge ${
                      p.refStatus === "Cleared" ? "sdom-badge-success" :
                      p.refStatus === "Pending" ? "sdom-badge-warning" : "sdom-badge-danger"
                    }`}>{p.refStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Counselling & Category D Scheduling Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>Safety Counselling & Category D Scheduler</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "250px", overflowY: "auto" }}>
                {allStaff.filter(p => getCat(p.scoreKey) === "D").length === 0 ? (
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>No staff currently in Category D (needing counselling).</p>
                ) : (
                  allStaff.filter(p => getCat(p.scoreKey) === "D").map(p => {
                    const isScheduled = counselSchedules[p.idKey];
                    return (
                      <div key={p.idKey} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "700", color: "#dc2626" }}>{p.name} ({p.idKey})</span>
                          <span className="sdom-badge sdom-badge-danger">Cat D ({p.scoreKey}%)</span>
                        </div>
                        
                        {isScheduled ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ fontSize: "11px", color: "#475569" }}>
                              <b>Scheduled:</b> {isScheduled.date} at {isScheduled.time}
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button className="sdom-btn-ghost" style={{ padding: "4px 8px", fontSize: "10px", background: isScheduled.attended ? "#dcfce7" : "#fff", borderColor: isScheduled.attended ? "#86efac" : "#cbd5e1" }} onClick={() => handleToggleAttendance(p.idKey)}>
                                {isScheduled.attended ? "✓ Attended" : "Mark Attendance"}
                              </button>
                              <button className="sdom-btn-ghost" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => handleCancelSchedule(p.idKey)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="datetime-local" id={`schedule-${p.idKey}`} style={{ fontSize: "11px", padding: "4px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                            <button className="sdom-btn-primary" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => {
                              const val = document.getElementById(`schedule-${p.idKey}`).value;
                              if (val) handleScheduleCounselling(p.idKey, val);
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

      {/* ── Station Performance Top/Bottom ── */}

      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Top 10 Performing Stations</div>
          <div className="sdom-chart-subtitle">Sorted by average assessment score</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>Safety %</th><th>Pending</th></tr>
              </thead>
              <tbody>
                {top10.map((st, i) => (
                  <tr key={st.id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.stationName}</td>
                    <td><span style={{ color: "#2F855A", fontWeight: 700 }}>{st.avgScore}</span></td>
                    <td>{st.avgScore + 5}%</td>
                    <td>{st.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Bottom 10 — Stations Needing Attention</div>
          <div className="sdom-chart-subtitle">Sorted by average assessment score (ascending)</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>High Risk</th><th>Pending</th></tr>
              </thead>
              <tbody>
                {bottom10.map((st, i) => (
                  <tr key={st.id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.stationName}</td>
                    <td><span style={{ color: st.avgScore < 75 ? "#C53030" : "#D69E2E", fontWeight: 700 }}>{st.avgScore}</span></td>
                    <td>{st.riskLevel === "High" ? <span style={{ color: "#C53030", fontWeight: 700 }}>1</span> : 0}</td>
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
            {pipeline.map((p) => (
              <div className="sdom-pipeline-card" key={p.label}>
                <div className="sdom-pipeline-dot" style={{ background: p.dot }} />
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
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
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
