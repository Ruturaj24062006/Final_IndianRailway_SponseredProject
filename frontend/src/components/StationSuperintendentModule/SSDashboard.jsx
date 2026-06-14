import React, { useState } from "react";
import { Target, Gauge, ShieldCheck, Award, TrendingUp, BarChart2, Users, Building2, Shield, HeartHandshake } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, BarChart, Bar, Legend, LabelList } from "recharts";
import { useLanguage } from "../../utils/LanguageContext";

const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };
const CAT_COLORS  = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };

const CustomPieTooltip = ({ active, payload }) => {
  const { t } = useLanguage();
  if (active && payload && payload.length) {
    const { name, value, payload: inner } = payload[0];
    return (
      <div className="pm-pie-tooltip" style={{ background: '#fff', border: '1px solid #dbe5f0', padding: '8px', borderRadius: '8px' }}>
        <strong>{t("assessment.categoryCol") || "Category"} {name}</strong>
        <div>{value}% &nbsp;({inner.count} {t("assessment.attemptCompleted") || "attempt"}{inner.count !== 1 ? "s" : ""})</div>
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
  history = [],
  trendData = [],
  pieData = [],
  openScorecard,
  getCategoryBg,
  getCategoryColor,
  setActiveNav,
  pointsmen = [],
  stationMasters = [],
  employeeId,
  profileData = {}
}) {
  const { t } = useLanguage();
  const [counselSchedules, setCounselSchedules] = useState(() => {
    const saved = localStorage.getItem("ss_counsel_schedules");
    return saved ? JSON.parse(saved) : {};
  });
  const [viewingStaff, setViewingStaff] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);

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

  const showDetail = (type) => {
    let title = "";
    let content = null;

    if (type === "latest_score") {
      title = "My Latest Competency Score Details";
      content = (
        <div>
          <p>Your latest station supervisor competency evaluation result:</p>
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginTop: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "900", color: "#2563eb" }}>
              {latestScore !== null ? `${latestScore}/100` : "92/100"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              Dynamic Category Grade: <span style={{ fontWeight: 700, color: "#16a34a" }}>Category {latestCategory || "A"}</span>
            </div>
          </div>
          <p style={{ marginTop: "12px", fontSize: "13px" }}>Check the detailed breakdown inside "My Assessment" tab.</p>
        </div>
      );
    } else if (type === "average_score") {
      title = "Superintendent Average Performance";
      content = (
        <div>
          <p>Your cumulative safety evaluation average is <strong>{averageScore || "92"}%</strong>.</p>
          <p style={{ marginTop: "12px" }}>Maintaining a high average is critical for division supervision, ensuring zero accidents at Nagpur Junction.</p>
        </div>
      );
    } else if (type === "category_pme") {
      title = "My PME Status Details";
      content = (
        <div>
          <p><strong>Periodic Medical Examination (PME)</strong> guarantees your medical fitness for railway operations.</p>
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", marginTop: "12px" }}>
            <div>Last Exam: <strong>{profileData.pmeDoneDate || "2024-06-02"}</strong></div>
            <div>Next Due: <strong style={{ color: "#dc2626" }}>{profileData.pmeDueDate || "2028-06-01"}</strong></div>
            <div style={{ marginTop: "8px" }}>Status: <span className="sdom-badge sdom-badge-success">{latestPmeStatus || "Fit"}</span></div>
          </div>
        </div>
      );
    } else if (type === "refresher_status") {
      title = "ZRTI Refresher training clearance (REF)";
      content = (
        <div>
          <p>Refresher courses verify compliance with current G&SR rules.</p>
          <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "12px", marginTop: "12px" }}>
            <div>Last Training: <strong>2024-05-12</strong></div>
            <div>Next Due: <strong>2027-05-12</strong></div>
            <div style={{ marginTop: "8px" }}>Status: <span className="sdom-badge sdom-badge-success">{latestRefStatus || "Cleared"}</span></div>
          </div>
        </div>
      );
    } else if (type === "total_staff") {
      title = "Nagpur Junction Active Staff";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Total subordinate staff under your jurisdiction: <strong>{allSubordinates.length}</strong></p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {allSubordinates.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700 }}>{p.name} ({p.role})</span>
                <span>{p.id}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "assessments_pending") {
      title = "Pending Evaluations";
      const list = allSubordinates.filter(u => u.status === "Pending" || u.approvalStatus === "Pending");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Staff with evaluations currently pending: <strong>{list.length}</strong></p>
          {list.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>All staff evaluations are fully completed.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {list.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fffbeb", borderRadius: "6px" }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span>{p.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (type === "completed_evaluations") {
      title = "Completed Evaluations";
      const list = allSubordinates.filter(u => u.status === "Approved" || u.approvalStatus === "Approved");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Staff with approved/completed evaluations: <strong>{list.length}</strong></p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {list.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f0fdf4", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700 }}>{p.name}</span>
                <span>{p.score}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "high_risk_staff") {
      title = "High-Risk Staff Warnings";
      const list = allSubordinates.filter(p => riskLevel(p) === "High");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Staff flagged with high operational risk levels: <strong>{list.length}</strong></p>
          {list.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>Zero high-risk staff under Nagpur Junction.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {list.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fee2e2", borderRadius: "6px" }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span className="sdom-badge sdom-badge-danger">High Risk</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (type === "safety_compliance") {
      title = "Station Safety Compliance Index";
      content = (
        <div>
          <p>Safety compliance for Nagpur Junction: <strong>{myStationObj.safety}%</strong>.</p>
          <p style={{ marginTop: "12px" }}>Derived from safety dates validation (PME/REF) and testing scores of the operational team.</p>
        </div>
      );
    } else if (type === "category_distribution_chart") {
      title = "Subordinate Category Distribution";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>Staff category grading chart breakdown:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {catCount.map(c => (
              <div key={c.cat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span>{c.cat}</span>
                <strong>{c.count} Staff Members</strong>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "risk_distribution_chart") {
      title = "Nagpur Junction Risk Distribution details";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>Risk level analysis breakdown:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {riskCount.map(r => (
              <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: r.name === "High" ? "#fee2e2" : "#f8fafc", borderRadius: "6px" }}>
                <span style={{ color: r.fill, fontWeight: "700" }}>{r.name} Risk</span>
                <strong>{r.value} Subordinates</strong>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "trend_chart") {
      title = "Station Performance Trend Analysis";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>Safety compliance trends across the last six months:</p>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Month</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Average Score</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Compliance %</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px" }}>{t.month}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{t.score}%</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "#10b981", fontWeight: "700" }}>{t.safety}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (type === "pme_compliance") {
      title = "Subordinate PME Status Details";
      content = (
        <div>
          <p style={{ marginBottom: "8px" }}>PME status listings for all Station Masters & Pointsmen:</p>
          {allSubordinates.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.name} ({p.role})</span>
              <span className={`sdom-badge ${p.pmeStatus === "Fit" ? "sdom-badge-success" : "sdom-badge-warning"}`}>{p.pmeStatus}</span>
            </div>
          ))}
        </div>
      );
    } else if (type === "ref_compliance") {
      title = "Subordinate REF Course Status Details";
      content = (
        <div>
          <p style={{ marginBottom: "8px" }}>Refresher training course status listings for all personnel:</p>
          {allSubordinates.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.name} ({p.role})</span>
              <span className={`sdom-badge ${p.refStatus === "Cleared" || p.refStatus === "COMPLETED" ? "sdom-badge-success" : "sdom-badge-warning"}`}>{p.refStatus}</span>
            </div>
          ))}
        </div>
      );
    } else if (type === "counselling_scheduler") {
      title = "Safety Counselling Scheduler Guidelines";
      content = (
        <div>
          <p>Superintendent dashboard scheduling of counseling for Nagpur Junction Category D team members.</p>
        </div>
      );
    }

    setModalDetail({ title, content });
  };

  return (
    <div className="sdom-fade">
      {/* SS Personal Stats Section */}
      <div className="sdom-chart-card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", borderLeft: "6px solid #1E3A5F" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0B1F3A" }}>{t("dashboard.personalSafetyStats") || "My Personal Safety Competency Stats"}</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>{t("dashboard.personalSafetySubtitle") || "Self-evaluation, CBT results, and personal grade profile"}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => showDetail("latest_score")}>
            <div style={{ background: "#eff6ff", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <Target size={20} color="#2563eb" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>{t("dashboard.latestScore") || "Latest Score"}</label>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>{latestScore !== null ? `${latestScore}/100` : "—"}</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => showDetail("average_score")}>
            <div style={{ background: "#f0fdf4", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <Gauge size={20} color="#16a34a" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>{t("dashboard.averageScore") || "Average Score"}</label>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>{averageScore}/100</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => showDetail("category_pme")}>
            <div style={{ background: latestPmeStatus === "Fit" ? "#f0fdf4" : "#fee2e2", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <ShieldCheck size={20} color={latestPmeStatus === "Fit" ? "#16a34a" : "#dc2626"} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>{t("dashboard.categoryPme") || "Category & PME"}</label>
              <strong style={{ fontSize: "16px", color: latestPmeStatus === "Fit" ? "#16a34a" : "#dc2626" }}>
                Cat {latestCategory} ({latestPmeStatus || "Fit"})
              </strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => showDetail("refresher_status")}>
            <div style={{ background: "#fdf4ff", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center" }}>
              <Award size={20} color="#9333ea" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b" }}>{t("dashboard.refresherStatus") || "Refresher Status"}</label>
              <strong style={{ fontSize: "15px", color: "#9333ea" }}>{latestRefStatus || "Cleared"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards for Nagpur Junction */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: t("dashboard.totalStationStaff") || "Total Station Staff",   val: stationMasters.length + pointsmen.length, type: "total_staff" },
          { label: t("dashboard.assessmentsPending") || "Pending Assessments",   val: allSubordinates.filter(u => u.status === "Pending" || u.approvalStatus === "Pending").length, type: "assessments_pending" },
          { label: t("dashboard.completedEvaluations") || "Completed Evaluations", val: allSubordinates.filter(u => u.status === "Approved" || u.approvalStatus === "Approved").length, type: "completed_evaluations" },
          { label: t("dashboard.highRiskStaff") || "High-Risk Staff",       val: myStationObj.highRisk, type: "high_risk_staff" },
          { label: t("dashboard.safetyCompliance") || "Safety Compliance",     val: `${myStationObj.safety}%`, type: "safety_compliance" },
        ].map(c => (
          <div key={c.label} className="sdom-stat-card" onClick={() => showDetail(c.type)} style={{ cursor: "pointer" }}>
            <div className="sdom-stat-value">{c.val}</div>
            <div className="sdom-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("category_distribution_chart")}>
          <div className="sdom-chart-title">{t("dashboard.categoryDistribution") || "Category Distribution"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.categoryDistributionSubSuperintendent") || "A/B/C/D breakdown of Station Masters and Pointsmen at Nagpur Junction"}</div>
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

        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("risk_distribution_chart")}>
          <div className="sdom-chart-title">{t("dashboard.riskDistribution") || "Risk Distribution"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.riskDistributionSubSuperintendent") || "Nagpur Junction staff risk level breakdown"}</div>
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
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("trend_chart")}>
          <div className="sdom-chart-title">{t("dashboard.trendTitle") || "Score & Safety Trend (Last 6 Months)"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.trendSubSuperintendent") || "Monthly performance tracking for Nagpur Junction"}</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                <YAxis domain={[50, 100]} fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }}/>
                <Legend wrapperStyle={{ fontSize: "0.82rem" }}/>
                <Line type="monotone" dataKey="score" name={t("dashboard.averageScore") || "Avg Score"} stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }}/>
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
            <span>{t("dashboard.readinessTitle") || "Operational Readiness & Safety Compliance (PME, REF & Counselling)"}</span>
          </div>
          <div className="sdom-chart-subtitle" style={{ marginBottom: "16px" }}>
            {t("dashboard.readinessSub") || "Monitor medical fitness, refresher training, safety counselling schedules and attendance for station staff."}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            {/* PME Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => showDetail("pme_compliance")}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{t("dashboard.pmeTitle") || "Periodic Medical Examination (PME)"}</h4>
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
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => showDetail("ref_compliance")}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{t("dashboard.refTitle") || "Refresher Training (REF)"}</h4>
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
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => showDetail("counselling_scheduler")}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{t("dashboard.counsellingTitle") || "Safety Counselling & Category D Scheduler"}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                {allSubordinates.filter(p => getCat(p.score) === "D").length === 0 ? (
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>{t("dashboard.noCounselD") || "No staff currently in Category D (needing counselling)."}</p>
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
                              <b>{t("dashboard.scheduled") || "Scheduled:"}</b> {isScheduled.date} {t("dashboard.at") || "at"} {isScheduled.time}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="sdom-btn-ghost" style={{ padding: "4px 8px", fontSize: "10px", background: isScheduled.attended ? "#dcfce7" : "#fff", borderColor: isScheduled.attended ? "#86efac" : "#cbd5e1" }} onClick={() => handleToggleAttendance(p.id)}>
                                {isScheduled.attended ? t("dashboard.attended") || "✓ Attended" : t("dashboard.markAttendance") || "Mark Attendance"}
                              </button>
                              <button className="sdom-btn-ghost" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => handleCancelSchedule(p.id)}>
                                {t("buttons.cancel") || "Cancel"}
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
                              {t("dashboard.schedule") || "Schedule"}
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
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("dashboard.smsUnderSuperintendent") || "Station Masters under Nagpur Junction"}</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>{t("dashboard.colName") || "Name"}</th>
                  <th>{t("dashboard.colHrms") || "HRMS ID"}</th>
                  <th>{t("dashboard.colCategory") || "Category"}</th>
                  <th>{t("dashboard.colLatestScore") || "Latest Score"}</th>
                  <th>{t("dashboard.colLastAssessment") || "Last Assessment"}</th>
                  <th>{t("dashboard.colStatus") || "Status"}</th>
                  <th>{t("dashboard.colAction") || "Action"}</th>
                </tr>
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
                      <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...s, reportingAom: "P. K. Verma (Sr. DOM)", role: "Station Master" })}>{t("buttons.viewForm") || "View Details"}</button>
                    </td>
                  </tr>
                ))}
                {stationMasters.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#64748b" }}>{t("dashboard.noSmsFound") || "No Station Masters found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pointsmen */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("dashboard.pointsmenUnderSuperintendent") || "Pointsmen under Nagpur Junction"}</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>{t("dashboard.colName") || "Name"}</th>
                  <th>{t("dashboard.colHrms") || "HRMS ID"}</th>
                  <th>{t("dashboard.colCategory") || "Category"}</th>
                  <th>{t("dashboard.colRiskLevel") || "Risk Level"}</th>
                  <th>{t("dashboard.colLatestScore") || "Latest Score"}</th>
                  <th>{t("dashboard.colStatus") || "Status"}</th>
                  <th>{t("dashboard.colAction") || "Action"}</th>
                </tr>
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
                          <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...p, reportingAom: "S. Deshmukh (SM)", email: `${p.id.toLowerCase()}@rail.in`, role: "Pointsman" })}>{t("buttons.viewForm") || "Profile"}</button>
                          <button className="sdom-btn-ghost" style={{ color: "#2563eb" }} onClick={() => { setActiveNav("pointsmen"); }}>{t("dashboard.btnMonitor") || "Monitor"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pointsmen.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#64748b" }}>{t("dashboard.noPointsmenFound") || "No Pointsmen found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TI Card */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("dashboard.tiTitle") || "Assigned Traffic Inspector"}</div>
          <div className="sdom-ti-card" style={{ cursor: "pointer" }} onClick={() => showDetail("assigned_ti")}>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e3a5f", marginBottom: 4 }}>{tiPerson.name}</div>
              <div style={{ color: "#4b6a9b", fontSize: "0.9rem", marginBottom: 8 }}>{t("dashboard.tiRole") || "Traffic Inspector"} &bull; {myStationObj.ti}</div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}><b>ID:</b> {tiPerson.id}</span>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}><b>{t("profile.mobile") || "Contact"}:</b> {tiPerson.contact}</span>
              </div>
            </div>
            <button className="sdom-btn-outline" onClick={(e) => { e.stopPropagation(); setViewingStaff(tiPerson); }}>{t("buttons.viewForm") || "View Profile"}</button>
          </div>
        </div>
      </div>

      {/* Detailed Staff Profile Modal */}
      {viewingStaff && (
        <div className="sdom-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setViewingStaff(null)}>
          <div className="sdom-modal" style={{ width: "650px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0B1F3A" }}>{t("dashboard.staffCard") || "Detailed Staff Card"}</h3>
              <button type="button" onClick={() => setViewingStaff(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
            </div>

            <div className="sdom-station-header" style={{ marginBottom: "20px", padding: "16px" }}>
              <div className="sdom-station-header-meta">
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{t("profile.title") || "Staff Profile"}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 2 }}>{viewingStaff.name}</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{viewingStaff.role} &bull; {viewingStaff.hrmsId || viewingStaff.id}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              {[
                [t("profile.hrmsId") || "Employee ID / HRMS ID", viewingStaff.hrmsId || viewingStaff.id],
                [t("profile.designation") || "Designation", viewingStaff.role],
                [t("profile.mobile") || "Contact Number", viewingStaff.contact || "+91 98220 44556"],
                [t("profile.email") || "Email ID", viewingStaff.email || `${(viewingStaff.hrmsId || viewingStaff.id).toLowerCase()}@rail.in`],
                [t("profile.placement") || "Current Station Placement", viewingStaff.station || "Nagpur Junction"],
                [t("profile.reportingOfficer") || "Reporting Officer", viewingStaff.reportingAom || "P. K. Verma (Sr. DOM)"],
                [t("profile.zone") || "Operational Zone", "Central Railway"],
                [t("profile.division") || "Operational Division", "Nagpur"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="sdom-btn-primary" onClick={() => setViewingStaff(null)}>{t("dashboard.closeProfile") || "Close Profile"}</button>
            </div>
          </div>
        </div>
      )}

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
