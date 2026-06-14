import React, { useState } from "react";
import { Target, Gauge, ShieldCheck, Award, TrendingUp, BarChart2 } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, BarChart, Bar, Legend, LabelList } from "recharts";
import { useLanguage } from "../../utils/LanguageContext";

const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];
const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };

const getStatusClass = (status) => {
  const map = {
    Approved: "sdom-badge-success",
    Completed: "sdom-badge-success",
    Active: "sdom-badge-success",
    Pending: "sdom-badge-warning",
    Submitted: "sdom-badge-warning",
    Rejected: "sdom-badge-danger",
    Expired: "sdom-badge-danger",
    Overdue: "sdom-badge-danger",
    Fit: "sdom-badge-success",
    Cleared: "sdom-badge-success"
  };
  return map[status] || "sdom-badge-neutral";
};

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

export default function SMDashboard({
  averageScore,
  complianceRate,
  pointsmen = [],
  stationHistory = [],
  scoreHistory = [],
  barChartData,
  pieData,
  openScorecard,
  latestCategory,
  latestScore,
  latestPmeStatus,
  latestRefStatus,
  smId,
  drafts = [],
  riskLevel,
  getCat,
  setActiveTab,
  viewingStaff,
  setViewingStaff,
  openPmDetail,
  smList: smListProp,
  dashboardMetrics,
  onInitiateAssessment
}) {
  const { t } = useLanguage();
  const [counselSchedules, setCounselSchedules] = useState(() => {
    const saved = localStorage.getItem("sm_counsel_schedules");
    return saved ? JSON.parse(saved) : {};
  });

  const [modalDetail, setModalDetail] = useState(null);

  const handleScheduleCounselling = (id, datetime) => {
    const [date, time] = datetime.split("T");
    const updated = {
      ...counselSchedules,
      [id]: { date, time, attended: false }
    };
    setCounselSchedules(updated);
    localStorage.setItem("sm_counsel_schedules", JSON.stringify(updated));
  };

  const handleCancelSchedule = (id) => {
    const updated = { ...counselSchedules };
    delete updated[id];
    setCounselSchedules(updated);
    localStorage.setItem("sm_counsel_schedules", JSON.stringify(updated));
  };

  const handleToggleAttendance = (id) => {
    const updated = {
      ...counselSchedules,
      [id]: { ...counselSchedules[id], attended: !counselSchedules[id].attended }
    };
    setCounselSchedules(updated);
    localStorage.setItem("sm_counsel_schedules", JSON.stringify(updated));
  };

  const CAT_COLORS  = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };
  const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };

  const tiSmListStr = localStorage.getItem("ti_sm_list");
  const smListState = tiSmListStr ? JSON.parse(tiSmListStr) : [];
  const myAssess = smListState.find(s => s.hrmsId === smId);
  const hasAssignedExam = myAssess && myAssess.status === "Exam Sent";

  // Station metrics dynamically tied to our pointsmen scores and backend metrics!
  const avgScore = pointsmen.length ? Math.round(pointsmen.reduce((s, p) => s + p.lastScore, 0) / pointsmen.length) : 0;
  const safetyVal = pointsmen.length ? Math.round(pointsmen.reduce((s, p) => s + p.safetyScore, 0) / pointsmen.length) : 0;

  const liveMetrics = dashboardMetrics || {
    station_name: "Nagpur Junction",
    station_code: "NGP",
    total_pointsmen: pointsmen.length,
    cbt_pending: pointsmen.filter(p => p.cbtStatus !== "PASSED").length,
    pme_due: pointsmen.filter(p => p.pmeStatus !== "Fit" && p.pmeStatus !== "Valid").length,
    ref_due: pointsmen.filter(p => p.refStatus !== "Cleared" && p.refStatus !== "Valid").length,
    assessments_pending: drafts.length,
    assessments_submitted: 0,
    assessments_approved: pointsmen.filter(p => p.approvalStatus === "Approved").length,
    assessments_rejected: pointsmen.filter(p => p.approvalStatus === "Rejected").length,
    compliance_percentage: safetyVal
  };

  const myStationObj = {
    name: liveMetrics.station_name,
    code: liveMetrics.station_code,
    ti: "TI NGP",
    smCount: 4,
    pmCount: liveMetrics.total_pointsmen,
    score: avgScore,
    safety: liveMetrics.compliance_percentage,
    highRisk: pointsmen.filter(p => riskLevel(p) === "High").length,
    pending: liveMetrics.assessments_pending
  };

  // calculate category distribution dynamically from pointsmen!
  const catCount = ["A", "B", "C", "D"].map(c => ({
    cat: `Cat ${c}`,
    count: pointsmen.filter(p => (p.category_grade === c || p.cat === c)).length,
    fill: CAT_COLORS[c]
  }));

  // calculate risk distribution dynamically!
  const riskCount = [
    { name: "Low",    value: pointsmen.filter(p => riskLevel(p) === "Low").length,    fill: RISK_COLORS.Low },
    { name: "Medium", value: pointsmen.filter(p => riskLevel(p) === "Medium").length, fill: RISK_COLORS.Medium },
    { name: "High",   value: pointsmen.filter(p => riskLevel(p) === "High").length,   fill: RISK_COLORS.High },
  ].filter(r => r.value > 0);

  const trend = [
    { month: "Dec'25", score: 82, safety: 86 },
    { month: "Jan'26", score: 85, safety: 89 },
    { month: "Feb'26", score: 88, safety: 91 },
    { month: "Mar'26", score: 91, safety: 93 },
    { month: "Apr'26", score: 90, safety: 94 },
    { month: "May'26", score: avgScore, safety: safetyVal } // current month tied dynamically!
  ];

  const smList = smListProp || [];

  const tiPerson = { name: "R. Khan", id: "TI_1001", contact: "+91 99999 33333", email: "r.khan@rail.in", role: "ti", station: liveMetrics.station_name };

  const showDetail = (type) => {
    let title = "";
    let content = null;

    if (type === "overall_compliance") {
      title = "Station Compliance & Safety Index Info";
      content = (
        <div>
          <p>The overall compliance index for <strong>{liveMetrics.station_name}</strong> is calculated at <strong>{liveMetrics.compliance_percentage}%</strong>.</p>
          <p style={{ marginTop: 12 }}>This composite safety rating evaluates:</p>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            <li>Medical fitness check completion (PME)</li>
            <li>Refresher safety training completion (REF)</li>
            <li>Average competency marks of pointsmen (CBT score)</li>
            <li>Prompt scheduling of counseling for Category D personnel</li>
          </ul>
        </div>
      );
    } else if (type === "latest_score") {
      title = "My Latest Competency Score Details";
      content = (
        <div>
          <p>Your latest Periodic Station Master Evaluation result:</p>
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginTop: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "900", color: "#2563eb" }}>
              {latestScore !== null ? `${latestScore}/100` : "88/100"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              Dynamic Category Grade: <span style={{ fontWeight: 700, color: "#16a34a" }}>Category {latestCategory || "A"}</span>
            </div>
          </div>
          <p style={{ marginTop: "12px", fontSize: "13px" }}>Evaluate your assessment dashboard inside "My Assessment" to view detailed question breakdowns and response logs.</p>
        </div>
      );
    } else if (type === "average_score") {
      title = "Station Master Average Performance";
      content = (
        <div>
          <p>Your personal cumulative evaluation average is <strong>{averageScore || "85"}%</strong>.</p>
          <p style={{ marginTop: "12px" }}>Maintaining a high average ensures operational precision in block panel handling and safety checks. Ensure to attend ZRTI training cycles on schedule.</p>
        </div>
      );
    } else if (type === "category_pme") {
      title = "My Medical Fitness Status (PME)";
      content = (
        <div>
          <p><strong>Periodic Medical Examination (PME)</strong> status ensures you are physically and visually fit for station master duties.</p>
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", marginTop: "12px" }}>
            <div>Last Exam: <strong>{smProfile.pmeDoneDate}</strong></div>
            <div style={{ marginTop: "4px" }}>Next Due: <strong style={{ color: "#dc2626" }}>{smProfile.pmeDueDate}</strong></div>
            <div style={{ marginTop: "8px" }}>Status: <span className="sdom-badge sdom-badge-success">{latestPmeStatus || "Fit"}</span></div>
          </div>
        </div>
      );
    } else if (type === "refresher_status") {
      title = "Refresher Training Status (REF)";
      content = (
        <div>
          <p>Your refresher course clearance indicates up-to-date knowledge on General and Subsidiary Rules (G&SR).</p>
          <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "12px", marginTop: "12px" }}>
            <div>Last Training Cycle: <strong>2024-05-12</strong></div>
            <div>Next Due Cycle: <strong>2027-05-12</strong></div>
            <div style={{ marginTop: "8px" }}>Status: <span className="sdom-badge sdom-badge-success">{latestRefStatus || "Cleared"}</span></div>
          </div>
        </div>
      );
    } else if (type === "total_pointsmen") {
      title = "Pointsmen Roster List";
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Total Pointsmen currently under your command: <strong>{pointsmen.length}</strong></p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pointsmen.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700 }}>{p.name}</span>
                <span>{p.hrmsId}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "cbt_pending") {
      title = "CBT Pending Status";
      const list = pointsmen.filter(p => p.cbtStatus !== "PASSED");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Pointsmen with CBT assessments pending: <strong>{list.length}</strong></p>
          {list.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>All pointsmen have successfully cleared CBT.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {list.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fee2e2", borderRadius: "6px" }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span>{p.hrmsId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (type === "pme_due") {
      title = "PME Medical Examination Due";
      const list = pointsmen.filter(p => p.pmeStatus !== "Fit" && p.pmeStatus !== "Valid");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Pointsmen with medical review / PME overdue or due: <strong>{list.length}</strong></p>
          {list.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>No staff currently due for PME.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {list.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fffbeb", borderRadius: "6px" }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span className="sdom-badge sdom-badge-warning">{p.pmeStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (type === "ref_due") {
      title = "ZRTI Refresher Course Safety Due";
      const list = pointsmen.filter(p => p.refStatus !== "Cleared" && p.refStatus !== "Valid");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Pointsmen due for refresher course: <strong>{list.length}</strong></p>
          {list.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>All staff are fully cleared for Refresher Course.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {list.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fffbeb", borderRadius: "6px" }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span className="sdom-badge sdom-badge-warning">{p.refStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (type === "assessments_pending") {
      title = "Assessments Pending";
      content = (
        <div>
          <p>You have <strong>{drafts.length}</strong> assessment drafts pending completion or submission.</p>
          <p style={{ marginTop: 8 }}>Go to "Assess Pointsmen" to finish grading your staff.</p>
        </div>
      );
    } else if (type === "assessments_submitted") {
      title = "Assessments Submitted";
      content = (
        <div>
          <p>You have submitted all required assessments for the current evaluation cycle.</p>
        </div>
      );
    } else if (type === "assessments_approved") {
      title = "Assessments Approved";
      const list = pointsmen.filter(p => p.approvalStatus === "Approved");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Approved assessments: <strong>{list.length}</strong></p>
          {list.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "#f0fdf4", borderRadius: "4px", marginBottom: "4px" }}>
              <span>{p.name}</span>
              <strong>{p.lastScore}%</strong>
            </div>
          ))}
        </div>
      );
    } else if (type === "assessments_rejected") {
      title = "Assessments Rejected";
      const list = pointsmen.filter(p => p.approvalStatus === "Rejected");
      content = (
        <div>
          <p style={{ marginBottom: 8 }}>Rejected assessments: <strong>{list.length}</strong></p>
          {list.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#64748b" }}>No assessments rejected by the inspector.</p>
          ) : (
            list.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "#fee2e2", borderRadius: "4px", marginBottom: "4px" }}>
                <span>{p.name}</span>
                <strong>{p.lastScore}%</strong>
              </div>
            ))
          )}
        </div>
      );
    } else if (type === "category_distribution_chart") {
      title = "Category Distribution breakdown";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>Distribution of pointsmen based on safety competency grades:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {catCount.map(c => (
              <div key={c.cat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span>{c.cat}</span>
                <strong>{c.count} Pointsmen</strong>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "risk_distribution_chart") {
      title = "Pointsman Operational Risk Levels";
      content = (
        <div>
          <p style={{ marginBottom: "12px" }}>Risk classifications derived from safety scores:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {riskCount.map(r => (
              <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: r.name === "High" ? "#fee2e2" : "#f8fafc", borderRadius: "6px" }}>
                <span style={{ color: r.fill, fontWeight: "700" }}>{r.name} Risk</span>
                <strong>{r.value} Pointsmen</strong>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (type === "trend_chart") {
      title = "Historical Station Safety Progress";
      content = (
        <div>
          <p>Evaluation trend chart over the last six months shows progression of safety markings:</p>
          <div style={{ marginTop: "12px", maxHeight: "200px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Month</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Average Score</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Compliance Index</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
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
    } else if (type === "pme_readiness") {
      title = "Station Staff PME Compliance Details";
      content = (
        <div>
          <p style={{ marginBottom: "8px" }}>Status of Periodic Medical Exams for all station personnel:</p>
          {pointsmen.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.name} ({p.hrmsId})</span>
              <span className={`sdom-badge ${getStatusClass(p.pmeStatus)}`}>{p.pmeStatus}</span>
            </div>
          ))}
        </div>
      );
    } else if (type === "ref_readiness") {
      title = "Station Staff REF Course Compliance Details";
      content = (
        <div>
          <p style={{ marginBottom: "8px" }}>ZRTI Refresher course training status for all personnel:</p>
          {pointsmen.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <span>{p.name} ({p.hrmsId})</span>
              <span className={`sdom-badge ${getStatusClass(p.refStatus)}`}>{p.refStatus}</span>
            </div>
          ))}
        </div>
      );
    } else if (type === "counselling_scheduler") {
      title = "Safety Counselling & ZRTI schedule";
      content = (
        <div>
          <p>For any staff rated under Category D (less than 50% competency marks), a mandatory one-on-one safety counseling session must be scheduled immediately.</p>
        </div>
      );
    } else if (type === "assigned_ti") {
      title = "Traffic Inspector Contact & Escalation";
      content = (
        <div>
          <p>Your immediate superior officer overseeing Nagpur Junction operations:</p>
          <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "12px", border: "1px solid #bfdbfe", marginTop: "8px" }}>
            <div>Name: <strong>{tiPerson.name}</strong></div>
            <div>HRMS ID: <strong>{tiPerson.id}</strong></div>
            <div>Mobile: <strong>{tiPerson.contact}</strong></div>
            <div>Email: <strong>{tiPerson.email}</strong></div>
          </div>
        </div>
      );
    }

    setModalDetail({ title, content });
  };

  return (
    <div className="sdom-fade">

      {/* Station Details Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0B1F3A 0%, #1a365d 100%)",
        color: "#ffffff",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer"
      }} onClick={() => showDetail("overall_compliance")}>
        <div>
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#94a3b8", fontWeight: "700" }}>{t("dashboard.activeStation") || "Active Station Jurisdiction"}</span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "800" }}>{liveMetrics.station_name} ({liveMetrics.station_code})</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#94a3b8", fontWeight: "700" }}>{t("dashboard.overallCompliance") || "Overall Station Compliance"}</span>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#10b981", marginTop: "2px" }}>{liveMetrics.compliance_percentage}%</div>
        </div>
      </div>

      {/* SM Personal Stats Section */}
      <div className="sdom-chart-card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", borderLeft: "6px solid #1E3A5F" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0B1F3A" }}>{t("dashboard.personalSafetyStats") || "My Personal Safety Competency Stats"}</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>{t("dashboard.personalSafetySubtitle") || "Self-evaluation, CBT results, and personal grade profile"}</p>
          </div>
          {hasAssignedExam && (
            <span className="sdom-badge sdom-badge-danger" style={{ animation: "pulse 2s infinite" }}>{t("dashboard.examAssignedPending") || "🚨 Exam Assigned: Pending Attempt"}</span>
          )}
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
                Cat {latestCategory} ({latestPmeStatus})
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

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: t("dashboard.totalPointsmen") || "Total Pointsmen",        val: liveMetrics.total_pointsmen, type: "total_pointsmen" },
          { label: t("dashboard.cbtPending") || "CBT Pending",            val: liveMetrics.cbt_pending, type: "cbt_pending" },
          { label: t("dashboard.pmeDue") || "PME Due",                val: liveMetrics.pme_due, type: "pme_due" },
          { label: t("dashboard.refDue") || "REF Due",                val: liveMetrics.ref_due, type: "ref_due" },
          { label: t("dashboard.assessmentsPending") || "Assessments Pending",    val: liveMetrics.assessments_pending, type: "assessments_pending" },
          { label: t("dashboard.assessmentsSubmitted") || "Assessments Submitted",  val: liveMetrics.assessments_submitted, type: "assessments_submitted" },
          { label: t("dashboard.assessmentsApproved") || "Assessments Approved",   val: liveMetrics.assessments_approved, type: "assessments_approved" },
          { label: t("dashboard.assessmentsRejected") || "Assessments Rejected",   val: liveMetrics.assessments_rejected, type: "assessments_rejected" }
        ].map(c => (
          <div key={c.label} className="sdom-stat-card" onClick={() => showDetail(c.type)} style={{ cursor: "pointer", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div className="sdom-stat-value" style={{ fontSize: "20px", fontWeight: "800", color: "#0B1F3A" }}>{c.val}</div>
            <div className="sdom-stat-label" style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card" style={{ cursor: "pointer" }} onClick={() => showDetail("category_distribution_chart")}>
          <div className="sdom-chart-title">{t("dashboard.categoryDistribution") || "Category Distribution"}</div>
          <div className="sdom-chart-subtitle">{t("dashboard.categoryDistributionSub") || "A/B/C/D breakdown of pointsmen at"} {liveMetrics.station_name}</div>
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
          <div className="sdom-chart-subtitle">{t("dashboard.riskDistributionSub") || "Pointsmen risk level breakdown at"} {liveMetrics.station_name}</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                     dataKey="value" paddingAngle={4}
                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                     labelLine={false}>
                  {riskCount.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name]}/>)}
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
          <div className="sdom-chart-subtitle">{t("dashboard.trendSub") || "Monthly performance tracking for"} {liveMetrics.station_name}</div>
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
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => showDetail("pme_readiness")}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{t("dashboard.pmeTitle") || "Periodic Medical Examination (PME)"}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pointsmen.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600" }}>{p.name} ({p.hrmsId})</span>
                    <span className={`sdom-badge ${getStatusClass(p.pmeStatus)}`}>{p.pmeStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* REF Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => showDetail("ref_readiness")}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{t("dashboard.refTitle") || "Refresher Training (REF)"}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pointsmen.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600" }}>{p.name} ({p.hrmsId})</span>
                    <span className={`sdom-badge ${getStatusClass(p.refStatus)}`}>{p.refStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Counselling & Category D Scheduling Card */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => showDetail("counselling_scheduler")}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{t("dashboard.counsellingTitle") || "Safety Counselling & Category D Scheduler"}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} onClick={e => e.stopPropagation()}>
                {pointsmen.filter(p => getCat(p.lastScore) === "D").length === 0 ? (
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>{t("dashboard.noCounselD") || "No staff currently in Category D (needing counselling)."}</p>
                ) : (
                  pointsmen.filter(p => getCat(p.lastScore) === "D").map(p => {
                    const isScheduled = counselSchedules[p.id];
                    return (
                      <div key={p.id} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "700", color: "#dc2626" }}>{p.name} ({p.hrmsId})</span>
                          <span className="sdom-badge sdom-badge-danger">Cat D ({p.lastScore}%)</span>
                        </div>
                        
                        {isScheduled ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ fontSize: "11px", color: "#475569" }}>
                              <b>{t("dashboard.scheduled") || "Scheduled:"}</b> {isScheduled.date} {t("dashboard.at") || "at"} {isScheduled.time}
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
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

      {/* Other Shift Station Masters */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("dashboard.otherShiftSms") || "Other Shift Station Masters & Supervisors"}</div>
          {smList.length === 0 ? (
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic", padding: "16px" }}>{t("dashboard.noOtherSms") || "No other Station Masters or Shift Supervisors assigned to this station."}</p>
          ) : (
            <div className="sdom-table-wrap">
              <table className="sdom-table">
                <thead>
                  <tr>
                    <th>{t("dashboard.colName") || "Name"}</th>
                    <th>{t("dashboard.colHrms") || "HRMS ID"}</th>
                    <th>{t("profile.designation") || "Designation"}</th>
                    <th>{t("profile.mobile") || "Contact"}</th>
                    <th>{t("dashboard.joiningDateCol") || "Joining Date"}</th>
                    <th>{t("assessment.statusCol") || "Status"}</th>
                    <th>{t("dashboard.colAction") || "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {smList.map(sm => (
                    <tr key={sm.id}>
                      <td style={{ fontWeight: 700 }}>{sm.full_name || sm.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{sm.hrms_id || sm.hrmsId}</td>
                      <td>{sm.designation}</td>
                      <td>{sm.mobile || sm.contact || "N/A"}</td>
                      <td>{sm.joining_date || sm.lastDate || "N/A"}</td>
                      <td>
                        <span className={`sdom-badge ${getStatusClass(sm.status)}`}>{sm.status}</span>
                      </td>
                      <td>
                        <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ 
                          name: sm.full_name || sm.name, 
                          id: sm.hrms_id || sm.hrmsId, 
                          hrmsId: sm.hrms_id || sm.hrmsId,
                          role: "sm", 
                          designation: sm.designation,
                          contact: sm.mobile || sm.contact,
                          email: `${(sm.hrms_id || sm.hrmsId).toLowerCase()}@rail.in`,
                          station: liveMetrics.station_name 
                        })}>{t("buttons.viewForm") || "Profile"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pointsmen */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("dashboard.pointsmenTitle") || "Pointsmen"}</div>
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
                  const cat = p.category_grade || p.cat || getCat(p.lastScore);
                  const risk = riskLevel(p);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{p.hrmsId}</td>
                      <td>
                        <span className={`sdom-badge ${cat === "A" ? "sdom-badge-success" : cat === "B" ? "sdom-badge-info" : cat === "C" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{cat}</span>
                      </td>
                      <td>
                        <span className={`sdom-badge ${risk === "Low" ? "sdom-badge-success" : risk === "Medium" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{risk}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{p.lastScore}/100</td>
                      <td>
                        <span className={`sdom-badge ${getStatusClass(p.approvalStatus)}`}>{p.approvalStatus}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...p, reportingAom: "S. Deshmukh (SM)", email: `${p.hrmsId.toLowerCase()}@rail.in`, role: "pointsmen" })}>{t("buttons.viewForm") || "Profile"}</button>
                          <button className="sdom-btn-ghost" style={{ color: "#2563eb" }} onClick={() => { openPmDetail(p); setActiveTab("pointsmen"); }}>{t("dashboard.btnMonitor") || "Monitor"}</button>
                          {["Not Started", "Approved", "Rejected"].includes(p.approvalStatus) && (
                            <button 
                              className="sdom-btn-ghost" 
                              style={{ color: "#16a34a" }} 
                              onClick={() => onInitiateAssessment(p.id)}
                            >
                              {t("dashboard.btnInitiate") || "Initiate Assessment"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{viewingStaff.role === "sm" ? t("sidebar.stationMasters") || "Station Master" : viewingStaff.role === "ti" ? t("sidebar.trafficInspectors") || "Traffic Inspector" : t("sidebar.pointsmen") || "Pointsman"} &bull; {viewingStaff.hrmsId || viewingStaff.id}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              {[
                [t("profile.hrmsId") || "Employee ID / HRMS ID", viewingStaff.hrmsId || viewingStaff.id],
                [t("profile.designation") || "Designation", viewingStaff.role === "sm" ? t("sidebar.stationMasters") || "Station Master" : viewingStaff.role === "ti" ? t("sidebar.trafficInspectors") || "Traffic Inspector" : t("sidebar.pointsmen") || "Pointsman"],
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
