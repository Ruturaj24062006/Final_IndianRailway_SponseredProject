import React, { useState } from "react";
import {
  Users, Building2, UserCheck, ShieldCheck, BusFront, UserRound,
  Percent, Activity, CheckCircle, AlertTriangle, Loader2, AlertCircle, RefreshCw, Award
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, Bar, LabelList, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const TrainFront = BusFront;

export default function AOmDashboard({
  // Live data props from AOmModule state
  aomDashStats = null,
  aomStationSummary = [],
  aomPerformance = { monthly_trend: [], grade_stats: {}, detailed_performance: [] },
  aomComplianceSummary = { total_roster_count: 0, pme_compliant_count: 0, ref_compliant_count: 0, pme_compliance_pct: 0, ref_compliance_pct: 0, detailed_roster: [] },
  aomDashLoading = false,
  aomDashError = null,
  aomDashFilters = { station_id: null, risk_level: null },
  onFilterChange = () => {},
  onRefresh = () => {},
  // Legacy array props still passed from AOmModule (used in other sections, kept as fallback)
  aomPointsmen = [],
  stationMastersDirectory = [],
  trafficInspectors = [],
  stations = [],
  setActivePage = () => {},
  handleChartClick = () => {},
  handlePieClick = () => {},
  profileData = {}
}) {
  const [modalDetail, setModalDetail] = useState(null);

  // Extract PME & REF info for AOM
  const pmeRaw = profileData?.pme_status || profileData?.pmeStatus || "FIT (Medical Review) - Due: 2029-09-15";
  const pmeStatus = pmeRaw.includes(" - ") ? pmeRaw.split(" - ")[0] : pmeRaw;
  const pmeDueDate = profileData?.pme_next_due_date || (pmeRaw.includes("Due: ") ? pmeRaw.split("Due: ")[1] : "2029-09-15");
  const pmeDoneDate = profileData?.pme_date || "2025-09-15";

  const refRaw = profileData?.ref_status || profileData?.refStatus || "COMPLETED (Safety Operations Seminar) - Due: 2027-04-22";
  const refStatus = refRaw.includes(" - ") ? refRaw.split(" - ")[0] : refRaw;
  const refDueDate = profileData?.ref_next_due_date || (refRaw.includes("Due: ") ? refRaw.split("Due: ")[1] : "2027-04-22");
  const refDoneDate = profileData?.ref_date || "2024-04-22";

  // ── Derived stats from live aomDashStats ──
  const stats = aomDashStats || {};
  const totalEmployees = stats.total_employees || 0;
  const totalPointsmen = stats.total_pointsmen || 0;
  const totalSM = stats.total_station_masters || 0;
  const totalTI = stats.total_traffic_inspectors || 0;
  const cbtPassPct = stats.cbt_pass_pct || 0;
  const pmePct = stats.pme_compliance_pct || 0;
  const refPct = stats.ref_compliance_pct || 0;
  const assessPct = stats.assessment_completion_pct || 0;
  const riskStats = stats.risk_stats || { high: 0, medium: 0, low: 0 };
  const pipeline = stats.pipeline_stats || { approved: 0, pending: 0, rejected: 0 };

  // ── Derived chart data ──
  const monthlyTrend = (aomPerformance.monthly_trend || []).map(r => ({
    month: r.month,
    score: parseFloat(r.score) || 0,
    safety: parseFloat(r.safety) || 0,
    approved: parseInt(r.approved) || 0,
    pending: parseInt(r.pending) || 0,
    rejected: parseInt(r.rejected) || 0
  }));

  const gradeStats = aomPerformance.grade_stats || {};
  const catData = [
    { name: "Grade A", value: gradeStats.A || 0, fill: "#1E3A5F" },
    { name: "Grade B", value: gradeStats.B || 0, fill: "#2B6CB0" },
    { name: "Grade C", value: gradeStats.C || 0, fill: "#D69E2E" },
    { name: "Grade D", value: gradeStats.D || 0, fill: "#C53030" }
  ];
  const catDataHasValues = catData.some(d => d.value > 0);

  const riskData = [
    { name: "High Risk", value: riskStats.high, fill: "#C53030" },
    { name: "Medium Risk", value: riskStats.medium, fill: "#D69E2E" },
    { name: "Low Risk", value: riskStats.low, fill: "#2F855A" }
  ];

  const pipelineBar = [
    { label: "Approved", count: pipeline.approved, dot: "#1E3A5F", type: "pipeline_approved" },
    { label: "Pending",  count: pipeline.pending,  dot: "#4A90D9", type: "pipeline_pending" },
    { label: "Rejected", count: pipeline.rejected, dot: "#B83A3A", type: "pipeline_rejected" }
  ];

  const stationProgressData = aomStationSummary.map(s => ({
    station: s.station_name,
    completed: parseInt(s.completed) || 0,
    pending: parseInt(s.pending) || 0
  }));

  const stationAvgScore = aomStationSummary.map(s => ({
    station: s.station_name,
    avgScore: parseFloat(s.avg_score) || 0
  }));

  const top10 = [...aomStationSummary]
    .sort((a, b) => parseFloat(b.avg_score) - parseFloat(a.avg_score))
    .slice(0, 10);
  const bottom10 = [...aomStationSummary]
    .sort((a, b) => parseFloat(a.avg_score) - parseFloat(b.avg_score))
    .slice(0, 10);

  // ── Summary cards definition ──
  const summaryCards = [
    {
      key: "employees", label: "Total Employees", count: totalEmployees,
      sub: "All active staff", icon: <Users size={18} />, color: "#1E3A5F", type: "employees"
    },
    {
      key: "pointsmen", label: "Pointsmen", count: totalPointsmen,
      sub: "Operational pointsmen", icon: <Users size={18} />, color: "#1E3A5F", type: "pointsmen"
    },
    {
      key: "sm", label: "Station Masters", count: totalSM,
      sub: "Across all stations", icon: <UserRound size={18} />, color: "#1E3A5F", type: "sm"
    },
    {
      key: "ti", label: "Traffic Inspectors", count: totalTI,
      sub: "Jurisdiction coverage", icon: <ShieldCheck size={18} />, color: "#1E3A5F", type: "ti"
    },
    {
      key: "cbt", label: "CBT Pass %", count: `${cbtPassPct}%`,
      sub: "Completed CBT attempts", icon: <CheckCircle size={18} />,
      color: cbtPassPct >= 60 ? "#2F855A" : "#C53030", type: "cbt"
    },
    {
      key: "pme", label: "PME Compliance %", count: `${pmePct}%`,
      sub: "Valid medical fitness", icon: <Activity size={18} />,
      color: pmePct >= 70 ? "#2F855A" : "#D69E2E", type: "pme"
    },
    {
      key: "ref", label: "REF Compliance %", count: `${refPct}%`,
      sub: "Valid refresher training", icon: <Percent size={18} />,
      color: refPct >= 70 ? "#2F855A" : "#D69E2E", type: "ref"
    },
    {
      key: "assess", label: "Assessment Completion %", count: `${assessPct}%`,
      sub: "Approved assessments", icon: <UserCheck size={18} />,
      color: assessPct >= 60 ? "#2F855A" : "#C53030", type: "assess"
    }
  ];

  const showDetail = (type) => {
    let title = "";
    let content = null;

    if (type === "pme_ref") {
      title = "My Personal PME & REF Status Details";
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Periodic Medical Examination (PME)</h4>
            <p>Your periodic medical review confirms active safety category clearance for division inspections.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last Exam Date: <strong>{pmeDoneDate}</strong></div>
              <div>Next Due Date: <strong style={{ color: "#c53030" }}>{pmeDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{pmeStatus}</span></div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", fontWeight: "700" }}>Refresher Seminar (REF)</h4>
            <p>Verification of mandatory safety course seminar attendance at division headquarters.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "8px", fontSize: "12px" }}>
              <div>Last Seminar Date: <strong>{refDoneDate}</strong></div>
              <div>Next Training Review: <strong style={{ color: "#c53030" }}>{refDueDate}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Status: <span style={{ fontWeight: 700, color: "#16a34a" }}>{refStatus}</span></div>
            </div>
          </div>
        </div>
      );
    } else if (type === "employees") {
      title = "Total Active Roster Staff";
      content = (
        <div>
          <p>Total active employees currently monitored in your division console database: <strong>{totalEmployees}</strong>.</p>
        </div>
      );
    } else if (type === "pointsmen") {
      title = "Division Pointsmen Statistics";
      content = (
        <div>
          <p>Total Pointsmen in database: <strong>{totalPointsmen}</strong>.</p>
        </div>
      );
    } else if (type === "sm") {
      title = "Division Station Masters Statistics";
      content = (
        <div>
          <p>Total Station Masters registered: <strong>{totalSM}</strong>.</p>
        </div>
      );
    } else if (type === "ti") {
      title = "Division Traffic Inspectors Statistics";
      content = (
        <div>
          <p>Total Traffic Inspectors registered: <strong>{totalTI}</strong>.</p>
        </div>
      );
    } else if (type === "cbt") {
      title = "CBT Pass Rate Analysis";
      content = (
        <div>
          <p>Overall division computer-based training pass rate is <strong>{cbtPassPct}%</strong>.</p>
        </div>
      );
    } else if (type === "pme") {
      title = "Division PME Compliance Analysis";
      content = (
        <div>
          <p>Percentage of safety staff with valid PME medical clearances: <strong>{pmePct}%</strong>.</p>
        </div>
      );
    } else if (type === "ref") {
      title = "Division REF Compliance Analysis";
      content = (
        <div>
          <p>Percentage of safety staff with valid ZRTI training clearance: <strong>{refPct}%</strong>.</p>
        </div>
      );
    } else if (type === "assess") {
      title = "Assessment Completion Rate";
      content = (
        <div>
          <p>Division evaluation completion index stands at <strong>{assessPct}%</strong>.</p>
        </div>
      );
    } else if (type === "risk_distribution") {
      title = "Division Risk Levels Breakdown";
      content = (
        <div>
          <p style={{ marginBottom: 12 }}>Roster staff grouped by operational safety risk levels:</p>
          {riskData.map(r => (
            <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: r.fill, fontWeight: "700" }}>{r.name}</span>
              <strong>{r.value} staff</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "grade_distribution") {
      title = "Practical Assessment Grades Breakdown";
      content = (
        <div>
          <p style={{ marginBottom: 12 }}>Grade category achievements of approved assessments:</p>
          {catData.map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{d.name}</span>
              <strong>{d.value} staff</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "station_progress") {
      title = "Station Progress Statistics";
      content = (
        <div>
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
      title = "Station Averages Details";
      content = (
        <div>
          <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Station</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {stationAvgScore.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{s.station}</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "#1f7a5c", fontWeight: "700" }}>{s.avgScore.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "compliance_summary") {
      title = "Live Roster Compliance Analysis";
      content = (
        <div>
          <p>Total monitored roster records: <strong>{aomComplianceSummary.total_roster_count}</strong></p>
          <p style={{ marginTop: 6 }}>PME Compliant: <strong>{aomComplianceSummary.pme_compliant_count}</strong></p>
          <p>REF Compliant: <strong>{aomComplianceSummary.ref_compliant_count}</strong></p>
        </div>
      );
    } else if (type === "pipeline_summary") {
      title = "Assessment Pipeline Details";
      content = (
        <div>
          {pipelineBar.map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.label}</span>
              <strong>{p.count}</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "trend_chart") {
      title = "Zonal Performance Trends";
      content = (
        <div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Month</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Avg Practical Score</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>High Scorer %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{m.month}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{m.score.toFixed(1)}%</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "#10b981", fontWeight: "700" }}>{m.safety.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "volume_chart") {
      title = "Monthly Assessment Volume details";
      content = (
        <div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Month</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Approved</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Pending</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{m.month}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{m.approved}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{m.pending}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{m.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "top_stations") {
      title = "Top Performing Stations Details";
      content = (
        <div>
          {top10.map((st, i) => (
            <div key={st.station_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{i+1}. <b>{st.station_name}</b></span>
              <span style={{ color: "#10b981" }}>Score: <b>{parseFloat(st.avg_score).toFixed(1)}%</b> | Compliance: <b>{parseFloat(st.overall_compliance_pct).toFixed(1)}%</b></span>
            </div>
          ))}
        </div>
      );
    } else if (type === "bottom_stations") {
      title = "Bottom Performing Stations Details";
      content = (
        <div>
          {bottom10.map((st, i) => (
            <div key={st.station_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{i+1}. <b>{st.station_name}</b></span>
              <span style={{ color: "#dc2626" }}>Score: <b>{parseFloat(st.avg_score).toFixed(1)}%</b> | Compliance: <b>{parseFloat(st.overall_compliance_pct).toFixed(1)}%</b></span>
            </div>
          ))}
        </div>
      );
    } else if (type === "roster_table") {
      title = "Division Staff Compliance Roster Details";
      content = (
        <div>
          <p>Total employees logged in database: <strong>{aomComplianceSummary.total_roster_count}</strong></p>
          <p style={{ marginTop: 8, fontSize: 13 }}>Clicking row elements lets you query specific safety statuses in Nagpur Command Center.</p>
        </div>
      );
    }

    setModalDetail({ title, content });
  };

  // ── Loading / Error states ──
  if (aomDashLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <Loader2 size={48} style={{ animation: "spin 1s linear infinite", color: "#1E3A5F" }} />
        <p style={{ color: "#627D98", fontSize: 16, fontWeight: 600 }}>Loading AOM Dashboard…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (aomDashError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, padding: 24 }}>
        <AlertCircle size={48} style={{ color: "#C53030" }} />
        <p style={{ color: "#C53030", fontSize: 16, fontWeight: 600 }}>Failed to load dashboard</p>
        <p style={{ color: "#627D98", fontSize: 14, maxWidth: 480, textAlign: "center" }}>{aomDashError}</p>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Ensure the backend server is running and you are logged in as AOM.</p>
      </div>
    );
  }

  return (
    <div className="sdom-fade">
      {/* Page header */}
      <h1 className="sdom-page-title">Nagpur Division Command Center</h1>
      <p className="sdom-page-subtitle">Live strategic overview — staff counts, compliance rates, safety and assessment pipeline from database.</p>

      {/* AOM Personal Safety Compliance Card */}
      <div className="sdom-chart-card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", borderLeft: "6px solid #1E3A5F", cursor: "pointer" }} onClick={() => showDetail("pme_ref")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0B1F3A" }}>My Personal Safety & Compliance Stats</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Health review logs and safety seminar clearances</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>PME Medical Status</span>
              <span className="sdom-badge" style={{
                background: pmeStatus === "FIT" || pmeStatus === "Valid" ? "#C6F6D5" : "#FED7D7",
                color: pmeStatus === "FIT" || pmeStatus === "Valid" ? "#2F855A" : "#C53030",
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
              <span style={{ fontWeight: 600, color: "#475569" }}>Refresher Seminar (REF)</span>
              <span className="sdom-badge" style={{
                background: refStatus === "COMPLETED" || refStatus === "Valid" ? "#C6F6D5" : "#FEE2E2",
                color: refStatus === "COMPLETED" || refStatus === "Valid" ? "#2F855A" : "#D97706",
                padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700"
              }}>
                {refStatus}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              <div>Last Seminar: <strong>{refDoneDate}</strong></div>
              <div style={{ marginTop: "4px" }}>Next Due Date: <strong style={{ color: "#2563eb" }}>{refDueDate}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "#627D98", fontWeight: 600 }}>Filter by Station:</label>
        <select
          value={aomDashFilters.station_id || ""}
          onChange={e => onFilterChange({ ...aomDashFilters, station_id: e.target.value || null })}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D9E2EC", fontSize: 13, color: "#102A43" }}
        >
          <option value="">All Stations</option>
          {aomStationSummary.map(s => (
            <option key={s.station_id} value={s.station_id}>{s.station_name} ({s.station_code})</option>
          ))}
        </select>

        <label style={{ fontSize: 13, color: "#627D98", fontWeight: 600 }}>Risk Level:</label>
        <select
          value={aomDashFilters.risk_level || ""}
          onChange={e => onFilterChange({ ...aomDashFilters, risk_level: e.target.value || null })}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D9E2EC", fontSize: 13, color: "#102A43" }}
        >
          <option value="">All Risk Levels</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {(aomDashFilters.station_id || aomDashFilters.risk_level) && (
          <button
            onClick={() => onFilterChange({ station_id: null, risk_level: null })}
            style={{ padding: "6px 14px", borderRadius: 6, background: "#E53E3E", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Clear Filters
          </button>
        )}

        <button
          onClick={onRefresh}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            background: "#1E3A5F",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {summaryCards.map((c) => (
          <div
            className="sdom-stat-card"
            key={c.key}
            style={{ cursor: "pointer" }}
            onClick={() => showDetail(c.type)}
          >
            <div className="sdom-stat-icon">
              <span style={{ color: c.color }}>{c.icon}</span>
            </div>
            <div className="sdom-stat-label">{c.label}</div>
            <div className="sdom-stat-value" style={{ color: c.color }}>{c.count}</div>
            <div className="sdom-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Risk Distribution ── */}
      <div className="sdom-row-2" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("risk_distribution")}>
          <div className="sdom-chart-title">Risk Distribution</div>
          <div className="sdom-chart-subtitle">High / Medium / Low risk across the division</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={105}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, value, percent }) => value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ""}
                >
                  {riskData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Grade / Category Distribution ── */}
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("grade_distribution")}>
          <div className="sdom-chart-title">Grade Distribution (Approved Assessments)</div>
          <div className="sdom-chart-subtitle">Based on final_score from assessment_results table</div>
          <div style={{ height: 260 }}>
            {catDataHasValues ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={105}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value, percent }) => value > 0 ? `${name}: ${value}` : ""}
                  >
                    {catData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }} onClick={e => e.stopPropagation()}>
                <AlertTriangle size={32} style={{ color: "#D69E2E" }} />
                <p style={{ color: "#627D98", fontSize: 13, textAlign: "center" }}>
                  No approved assessments with grade data yet.
                  <br />Grades will appear once practical assessments are completed and graded.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Station-wise Evaluation Progress & Average Score ── */}
      <div className="sdom-row-2" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("station_progress")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
            <div>
              <div className="sdom-chart-title">Station-wise Evaluation Progress</div>
              <div className="sdom-chart-subtitle">Completed vs Pending assessments per station</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleChartClick(null, "progress"); }}
              style={{ background: "var(--brand-primary, #0B1F3A)", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationProgressData} margin={{ top: 8, right: 12, left: -20, bottom: 5 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="station" tick={{ fontSize: 9, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="completed" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Completed" barSize={12} />
                <Bar dataKey="pending"   fill="#D69E2E" radius={[4, 4, 0, 0]} name="Pending"   barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("station_average")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
            <div>
              <div className="sdom-chart-title">Station-wise Average Score</div>
              <div className="sdom-chart-subtitle">Average practical marks (approved assessments)</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleChartClick(null, "score"); }}
              style={{ background: "#1f7a5c", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationAvgScore} margin={{ top: 8, right: 12, left: -20, bottom: 5 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="station" tick={{ fontSize: 9, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6 }} formatter={(v) => [`${v}/100`, "Avg Score"]} />
                <Bar dataKey="avgScore" fill="#1f7a5c" radius={[4, 4, 0, 0]} name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── PME & REF Compliance Progress Bars ── */}
      <div className="sdom-row-1" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("compliance_summary")}>
          <div className="sdom-chart-title">Compliance Summary</div>
          <div className="sdom-chart-subtitle">Live from pme_records and ref_records tables</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "PME Compliance", pct: pmePct, color: pmePct >= 70 ? "#2F855A" : "#D69E2E" },
              { label: "REF Compliance", pct: refPct, color: refPct >= 70 ? "#2F855A" : "#D69E2E" },
              { label: "CBT Pass Rate", pct: cbtPassPct, color: cbtPassPct >= 60 ? "#1E3A5F" : "#C53030" },
              { label: "Assessment Completion", pct: assessPct, color: assessPct >= 60 ? "#1E3A5F" : "#C53030" }
            ].map((c) => (
              <div className="sdom-compliance-item" key={c.label}>
                <div className="sdom-compliance-header">
                  <span>{c.label}</span>
                  <span className="sdom-compliance-pct" style={{ color: c.color }}>{c.pct}%</span>
                </div>
                <div className="sdom-compliance-track">
                  <div className="sdom-compliance-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Assessment Pipeline Summary ── */}
      <div className="sdom-row-1" style={{ marginBottom: 24 }} onClick={() => showDetail("pipeline_summary")}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }}>
          <div className="sdom-chart-title">Assessment Pipeline</div>
          <div className="sdom-chart-subtitle">Current assessment status across all employees</div>
          <div className="sdom-pipeline-row">
            {pipelineBar.map((p) => (
              <div className="sdom-pipeline-card" key={p.label}>
                <div className="sdom-pipeline-dot" style={{ background: p.dot }} />
                <div>
                  <div className="sdom-pipeline-lbl">{p.label}</div>
                  <div className="sdom-pipeline-val">{p.count.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score Trend (last 6 months) ── */}
      <div className="sdom-row-1" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("trend_chart")}>
          <div className="sdom-chart-title">Division-wide Performance Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Average practical scores and safety compliance over time — live from assessments table</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Line type="monotone" dataKey="score"  name="Avg Practical Score" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="safety" name="High Scorer % (≥80)" stroke="#2F855A" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Monthly Assessment Volume ── */}
      <div className="sdom-row-1" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("volume_chart")}>
          <div className="sdom-chart-title">Monthly Assessment Volume (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Breakdown by approval status per month — live from assessments table</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Bar dataKey="approved" name="Approved" fill="#1E3A5F" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending"  name="Pending"  fill="#4A90D9" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#B83A3A" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Top 10 / Bottom 10 Stations ── */}
      <div className="sdom-row-2" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("top_stations")}>
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Top Performing Stations</div>
          <div className="sdom-chart-subtitle">Sorted by avg assessment score (approved)</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>#</th><th>Station</th><th>Code</th><th>Avg Score</th><th>Compliance %</th><th>Employees</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((st, i) => (
                  <tr key={st.station_id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.station_name}</td>
                    <td><span style={{ color: "#627D98", fontSize: 11 }}>{st.station_code}</span></td>
                    <td><span style={{ color: "#2F855A", fontWeight: 700 }}>{parseFloat(st.avg_score).toFixed(1)}</span></td>
                    <td>{parseFloat(st.overall_compliance_pct).toFixed(1)}%</td>
                    <td>{st.total_employees}</td>
                  </tr>
                ))}
                {top10.length === 0 && (
                  <tr><td colSpan={6} style={{ color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("bottom_stations")}>
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Stations Needing Attention</div>
          <div className="sdom-chart-subtitle">Lowest avg score / compliance (ascending)</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>#</th><th>Station</th><th>Code</th><th>Avg Score</th><th>Compliance %</th><th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {bottom10.map((st, i) => (
                  <tr key={st.station_id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.station_name}</td>
                    <td><span style={{ color: "#627D98", fontSize: 11 }}>{st.station_code}</span></td>
                    <td>
                      <span style={{ color: parseFloat(st.avg_score) < 50 ? "#C53030" : "#D69E2E", fontWeight: 700 }}>
                        {parseFloat(st.avg_score).toFixed(1)}
                      </span>
                    </td>
                    <td>{parseFloat(st.overall_compliance_pct).toFixed(1)}%</td>
                    <td>{st.pending}</td>
                  </tr>
                ))}
                {bottom10.length === 0 && (
                  <tr><td colSpan={6} style={{ color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Per-Employee Compliance Roster Table ── */}
      <div className="sdom-row-1" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("roster_table")}>
          <div className="sdom-chart-title">Staff Compliance Roster</div>
          <div className="sdom-chart-subtitle">Live per-employee PME and REF compliance from database ({aomComplianceSummary.total_roster_count} employees)</div>
          <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2F855A" }}>
              PME Compliant: {aomComplianceSummary.pme_compliant_count} / {aomComplianceSummary.total_roster_count} ({aomComplianceSummary.pme_compliance_pct}%)
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>
              REF Compliant: {aomComplianceSummary.ref_compliant_count} / {aomComplianceSummary.total_roster_count} ({aomComplianceSummary.ref_compliance_pct}%)
            </span>
          </div>
          <div className="sdom-table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>HRMS ID</th><th>Name</th><th>Designation</th><th>Station</th><th>PME Status</th><th>PME Due</th><th>REF Status</th><th>REF Due</th>
                </tr>
              </thead>
              <tbody>
                {(aomComplianceSummary.detailed_roster || []).slice(0, 50).map((e) => (
                  <tr key={e.employee_id}>
                    <td style={{ fontSize: 11, color: "#627D98" }}>{e.hrms_id}</td>
                    <td style={{ fontWeight: 600 }}>{e.full_name || "—"}</td>
                    <td style={{ fontSize: 12 }}>{e.designation || "—"}</td>
                    <td style={{ fontSize: 12 }}>{e.station_name || "—"}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: e.pme_status === "Valid" ? "#C6F6D5" : e.pme_status === "Expired" ? "#FED7D7" : "#EDF2F7",
                        color: e.pme_status === "Valid" ? "#2F855A" : e.pme_status === "Expired" ? "#C53030" : "#718096"
                      }}>
                        {e.pme_status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11 }}>{e.pme_next_due_date || "—"}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: e.ref_status === "Valid" ? "#C6F6D5" : e.ref_status === "Expired" ? "#FED7D7" : "#EDF2F7",
                        color: e.ref_status === "Valid" ? "#2F855A" : e.ref_status === "Expired" ? "#C53030" : "#718096"
                      }}>
                        {e.ref_status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11 }}>{e.ref_next_due_date || "—"}</td>
                  </tr>
                ))}
                {(aomComplianceSummary.detailed_roster || []).length === 0 && (
                  <tr><td colSpan={8} style={{ color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No roster data</td></tr>
                )}
              </tbody>
            </table>
            {(aomComplianceSummary.detailed_roster || []).length > 50 && (
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                Showing top 50 of {aomComplianceSummary.detailed_roster.length} employees. Use filters to narrow results.
              </p>
            )}
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
