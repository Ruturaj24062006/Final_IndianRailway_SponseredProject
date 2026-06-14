import { useState, useEffect } from "react";
import { Search, Plus, Building2, ExternalLink, HelpCircle, Activity, ShieldCheck, Award, TrendingUp, Users, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LabelList, LineChart, Line, Cell, PieChart, Pie, Legend } from "recharts";
import { useLanguage } from "../../utils/LanguageContext";
import { getEmployeeHistory } from "../../services/employeeService";

const MONTHLY_TREND = [
  { month: "Dec'25", score: 81, safety: 80 },
  { month: "Jan'26", score: 83, safety: 82 },
  { month: "Feb'26", score: 85, safety: 85 },
  { month: "Mar'26", score: 87, safety: 88 },
  { month: "Apr'26", score: 89, safety: 91 },
  { month: "May'26", score: 91, safety: 94 }
];

const ROLE_MAP = {
  pointsmen: "Pointsman",
  Pointsman: "Pointsman",
  sm: "Station Master",
  "Station Master": "Station Master",
  ss: "Station Superintendent",
  "Station Superintendent": "Station Superintendent",
  tm: "Train Manager",
  "Train Manager": "Train Manager",
  ti: "Traffic Inspector",
  "Traffic Inspector": "Traffic Inspector"
};

export default function TIStations({
  stations,
  setStations,
  showAddStationModal,
  setShowAddStationModal,
  newStationData,
  setNewStationData,
  handleAddStationSubmit,
  stSearch,
  setStSearch,
  stCatFilter,
  setStCatFilter,
  selectedStation,
  setSelectedStation,
  users,
  getCat,
  getUserRisk,
  riskBadge,
  catBadge,
  statusBadge,
  stationTiMap,
  myPmList = [],
  mySmList = [],
  myTmList = [],
  ssList,
  view,
  setView,
  myStations = [],
  stationStats = [],
  tiName
}) {
  const { t } = useLanguage();
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (view?.type === "staffDetail" && view.data) {
      const empId = view.data.dbId || view.data.id;
      if (empId) {
        setHistoryLoading(true);
        getEmployeeHistory(empId)
          .then(data => {
            setAssessmentHistory(data || []);
            setHistoryLoading(false);
          })
          .catch(err => {
            console.error("Failed to load employee history:", err);
            setAssessmentHistory([]);
            setHistoryLoading(false);
          });
      } else {
        setAssessmentHistory([]);
      }
    } else {
      setAssessmentHistory([]);
    }
  }, [view]);

  const RISK_COLORS = {
      Low: "#16a34a",
      Medium: "#f59e0b",
      High: "#ef4444"
    };

    const CAT_COLORS = {
      A: "#16a34a",
      B: "#2563eb",
      C: "#d97706",
      D: "#dc2626"
    };

    const renderCategoryBadge = (category) => {
      const value = String(category || "").trim().toUpperCase();
      const isRank = ["A", "B", "C", "D"].includes(value);

      if (isRank) {
        return <span className={`category-circle category-${value.toLowerCase()}`}>{value}</span>;
      }

      return <span className="category-text-chip">{value || "-"}</span>;
    };

    const renderStaffDetail = (s) => {
      const computedRisk = getUserRisk(s);
      const scoreData = [...assessmentHistory]
        .reverse()
        .map(item => ({
          month: item.assessmentPeriod || item.date || "Exam",
          score: parseFloat(item.totalScore) || 0
        }));
      
      return (
        <div className="sdom-fade animate-fade-in">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => {
              if (view?.returnTo === "stationDetail") {
                setView({ type: "stationDetail", data: view.stationData });
              } else {
                setView(null);
              }
            }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>
              <ArrowLeft size={16} /> {t("buttons.backToList")}
            </button>
          </div>

          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("stations.staffProfile")}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                {catBadge(s.cat || getCat(s.score))}
                {riskBadge(computedRisk)}
                {statusBadge(s.status || "Active")}
              </div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat">
                <span className="val">{s.score}%</span>
                <span className="lbl">{t("dashboard.latestScore")}</span>
              </div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat">
                <span className="val">{s.contact || "—"}</span>
                <span className="lbl">{t("stations.contact")}</span>
              </div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat">
                <span className="val">{s.lastAssessDate || s.lastDate || "—"}</span>
                <span className="lbl">{t("assessment.lastAssessed")}</span>
              </div>
            </div>
          </div>

          <div className="sdom-row-2">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>{t("profile.personalDetails")}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
                {[
                  [t("profile.hrmsId"), s.id || s.hrmsId],
                  [t("profile.designation"), ROLE_MAP[s.role] || s.role],
                  [t("profile.mobile"), s.contact || "N/A"],
                  [t("profile.email"), s.email || `${(s.id || s.hrmsId)?.toLowerCase()}@rail.in`],
                  [t("assessment.statusCol"), s.status || "Active"],
                  [t("profile.zone"), s.zone || "Central Railway"],
                  [t("profile.division"), s.division || "Nagpur Division"],
                  [t("profile.placement"), s.station],
                  [t("profile.reportingOfficer"), s.reportingAom || "TI R. Khan (Safety)"]
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                  {t("profile.operationalProfileSpecs")}
                </h4>
                
                {(s.role === "Pointsman" || s.role === "pointsmen") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>{t("profile.reportingSM")}:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                    <div><strong>{t("profile.assignedShift")}:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                    <div><strong>{t("profile.workLocation")}:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.workLocation || "Yard Area"}</div></div>
                  </div>
                )}

                {(s.role === "Station Master" || s.role === "sm" || s.role === "Station Superintendent" || s.role === "ss") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>{t("stations.operationalStation")}:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.station || "N/A"}</div></div>
                    <div><strong>{t("stations.operationalDivision")}:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.division || "Nagpur Division"}</div></div>
                    <div><strong>{t("stations.operationalZone")}:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.zone || "Central Railway"}</div></div>
                  </div>
                )}

                {(s.role === "Train Manager" || s.role === "tm") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>{t("stations.crewDepot")}:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.workLocation || "Nagpur Depot"}</div></div>
                    <div><strong>{t("profile.assignedShift")}:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.shift || "Goods Train Beat"}</div></div>
                    <div><strong>{t("stations.assignedSectionBeats")}:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                  </div>
                )}

                {(s.role === "Traffic Inspector" || s.role === "ti") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>{t("stations.jurisdiction")}:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.jurisdiction || "Parbhani-Amla Section"}</div></div>
                    <div><strong>{t("profile.division")}:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.division || "Nagpur Division"}</div></div>
                    <div><strong>{t("profile.reportingOfficer")}:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.reportingAom || "P. K. Verma (Sr. DOM)"}</div></div>
                  </div>
                )}
              </div>
            </div>

            <div className="sdom-chart-card">
              <div className="sdom-chart-title">{t("profile.scoreTrend")}</div>
              <div className="sdom-chart-subtitle">{t("profile.scoreProgression")}</div>
              <div style={{ height: 300 }}>
                {historyLoading ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    Loading history...
                  </div>
                ) : scoreData.length === 0 ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", color: "#64748b", fontWeight: 600 }}>
                    Data not available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis domain={[40, 100]} fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Sub-view: Station Detail Dashboard (drill-down)
    const renderStationDetail = (st) => {
      const stStaff = users.filter(s => s.station === st.name).map(u => ({
        ...u,
        risk: getUserRisk(u)
      }));
      const pmList = stStaff.filter(s => s.role === "Pointsman" || s.role === "pointsmen");
      const smList = stStaff.filter(s => s.role === "Station Master" || s.role === "sm");

      const catCount = ["A", "B", "C", "D"].map(c => ({
        cat: `Cat ${c}`,
        count: stStaff.filter(s => (s.cat || getCat(s.score)) === c).length,
        fill: CAT_COLORS[c]
      }));

      const riskCount = [
        { name: "Low", value: stStaff.filter(s => s.risk === "Low").length, fill: "#16a34a" },
        { name: "Medium", value: stStaff.filter(s => s.risk === "Medium").length, fill: "#f59e0b" },
        { name: "High", value: stStaff.filter(s => s.risk === "High").length, fill: "#ef4444" },
      ].filter(r => r.value > 0);

      const trend = MONTHLY_TREND.map(m => ({ ...m, score: Math.max(60, st.score - 8 + MONTHLY_TREND.indexOf(m) * 2) }));

      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 20 }}>
            <button className="sdom-back-btn" onClick={() => { setView(null); setSelectedStation(null); }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>
              <ArrowLeft size={16} /> {t("stations.backToStations")}
            </button>
          </div>

          <div className="sdom-station-header">
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("stations.stationAnalyticsDashboard")}</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: 4 }}>{st.name}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{t("stations.code")}: <b>{st.code}</b> &bull; {t("stations.assignedTI")}: <b>{st.ti}</b></div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <span className="sdom-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{st.smCount} {t("sidebar.stationMasters")}</span>
                <span className="sdom-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{st.pmCount} {t("sidebar.pointsmen")}</span>
                <span className={`sdom-badge ${st.highRisk > 4 ? "sdom-badge-red" : "sdom-badge-green"}`}>{st.highRisk} {t("dashboard.riskBreakdown")}</span>
              </div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat">
                <span className="val">{st.score}</span>
                <span className="lbl">{t("stations.avgScore")}</span>
              </div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat">
                <span className="val">{st.safety}%</span>
                <span className="lbl">{t("stations.safety")}</span>
              </div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat">
                <span className="val">{st.pending}</span>
                <span className="lbl">{t("assessment.pending")}</span>
              </div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat">
                <span className="val">{stStaff.length}</span>
                <span className="lbl">{t("stations.totalStaff")}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: t("stations.totalStaff"), val: stStaff.length },
              { label: t("stations.pendingAssessments"), val: st.pending },
              { label: t("assessment.completed"), val: stStaff.filter(s => s.status === "Approved" || s.status === "Submitted").length },
              { label: t("stations.highRiskPointsmen"), val: pmList.filter(s => s.risk === "High").length },
              { label: t("dashboard.safetyCompliance"), val: `${st.safety}%` },
            ].map(c => (
              <div key={c.label} className="sdom-stat-card">
                <div className="sdom-stat-value">{c.val}</div>
                <div className="sdom-stat-label">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="sdom-row-2">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title">{t("dashboard.gradeDistribution")}</div>
              <div className="sdom-chart-subtitle">{t("stations.gradeBreakdownDesc")}</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catCount} barSize={46} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                    <XAxis dataKey="cat" fontSize={12} tick={{ fill: "#102A43", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                      {catCount.map((d, i) => <Cell key={i} fill={CAT_COLORS[Object.keys(CAT_COLORS)[i]]} />)}
                      <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#102A43" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="sdom-chart-card">
              <div className="sdom-chart-title">{t("dashboard.riskBreakdown")}</div>
              <div className="sdom-chart-subtitle">{t("stations.riskBreakdownDesc")}</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                      dataKey="value" paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {riskCount.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                    <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="sdom-row-1">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("sidebar.stationMasters")}</div>
              <div className="sdom-table-wrap">
                <table className="sdom-table">
                  <thead><tr><th>{t("profile.name")}</th><th>{t("login.hrmsId")}</th><th>{t("assessment.categoryCol")}</th><th>{t("dashboard.latestScore")}</th><th>{t("assessment.lastAssessed")}</th><th>{t("assessment.statusCol")}</th><th>{t("workflow.actions")}</th></tr></thead>
                  <tbody>
                    {smList.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>{t("stations.noSMAssigned")}</td></tr>}
                    {smList.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id}</td>
                        <td>{catBadge(s.cat || getCat(s.score))}</td>
                        <td style={{ fontWeight: 700 }}>{s.score}</td>
                        <td>{s.lastAssessDate || s.lastDate || "—"}</td>
                        <td>{statusBadge(s.status || "Active")}</td>
                        <td><button className="sdom-btn-ghost" onClick={() => setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>{t("buttons.viewDetails")}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sdom-row-1">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("sidebar.pointsmen")}</div>
              <div className="sdom-table-wrap">
                <table className="sdom-table">
                  <thead><tr><th>{t("profile.name")}</th><th>{t("login.hrmsId")}</th><th>{t("assessment.categoryCol")}</th><th>{t("stations.riskLevel")}</th><th>{t("dashboard.latestScore")}</th><th>{t("assessment.statusCol")}</th><th>{t("workflow.actions")}</th></tr></thead>
                  <tbody>
                    {pmList.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>{t("stations.noPMAssigned")}</td></tr>}
                    {pmList.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id}</td>
                        <td>{catBadge(s.cat || getCat(s.score))}</td>
                        <td>{riskBadge(s.risk)}</td>
                        <td style={{ fontWeight: 700 }}>{s.score}</td>
                        <td>{statusBadge(s.status || "Active")}</td>
                        <td><button className="sdom-btn-ghost" onClick={() => setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>{t("buttons.viewDetails")}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    if (view?.type === "stationDetail") return renderStationDetail(view.data);

    // Main Station List rendering (looks exactly like AOM's renderStations)
    const filtered = stationStats.map(st => {
      const smCount = users.filter(u => u.station === st.name && (u.role === "Station Master" || u.role === "sm")).length || st.smCount || 0;
      const pmCount = users.filter(u => u.station === st.name && (u.role === "Pointsman" || u.role === "pointsmen")).length || st.pmCount || st.pointsmenCount || 0;
      const pmPending = myPmList.filter(p => p.station === st.name && p.status === "Pending").length;
      const smPending = mySmList.filter(s => s.station === st.name && s.status === "Pending").length;
      const tmPending = myTmList.filter(t => t.station === st.name && t.status === "Pending").length;
      const pending = pmPending + smPending + tmPending;

      return {
        ...st,
        ti: tiName || "TI R. Khan",
        smCount,
        pmCount,
        score: st.avgScore,
        safety: st.safetyPct,
        highRisk: st.highRisk,
        pending
      };
    }).filter(st => {
      const q = stSearch.toLowerCase();
      const matchesSearch = !q || st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
      const matchesCat = stCatFilter === "All" || getCat(st.avgScore) === stCatFilter;
      return matchesSearch && matchesCat;
    });

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 className="sdom-page-title">{t("sidebar.stations")}</h1>
            <p className="sdom-page-subtitle">{t("stations.subtitle")}</p>
          </div>
          <button className="sdom-btn-primary" onClick={() => {
            setNewStationData({ name: "", code: "", division: "", zone: "", category: "B", smCount: "", pmCount: "" });
            setShowAddStationModal(true);
          }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> {t("stations.addNewStation")}
          </button>
        </div>

        <div className="sdom-filter-bar" style={{ display: "flex", gap: "12px", flexWrap: "nowrap", marginBottom: "16px" }}>
          <div className="sdom-filter-field" style={{ flex: 1 }}>
            <label>{t("stations.searchStation")}</label>
            <input value={stSearch} onChange={e => setStSearch(e.target.value)} placeholder={t("stations.searchPlaceholder")} />
          </div>
          <div className="sdom-filter-field" style={{ width: "200px" }}>
            <label>{t("stations.categoryFilter")}</label>
            <select value={stCatFilter} onChange={e => setStCatFilter(e.target.value)}>
              <option value="All">{t("stations.allCategories")}</option>
              <option value="A">{t("stations.gradeAStations")}</option>
              <option value="B">{t("stations.gradeBStations")}</option>
              <option value="C">{t("stations.gradeCStations")}</option>
              <option value="D">{t("stations.gradeDStations")}</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>{t("stations.stationName")}</th>
                  <th>{t("stations.code")}</th>
                  <th>{t("stations.assignedTI")}</th>
                  <th>{t("stations.sms")}</th>
                  <th>{t("sidebar.pointsmen")}</th>
                  <th>{t("stations.avgScore")}</th>
                  <th>{t("stations.safety")}%</th>
                  <th>{t("dashboard.riskBreakdown")}</th>
                  <th>{t("assessment.pending")}</th>
                  <th>{t("sidebar.dashboard")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                      {t("stations.noStationsFound")}
                    </td>
                  </tr>
                ) : (
                  filtered.map(st => (
                    <tr key={st.id}>
                      <td style={{ fontWeight: 700 }}>{st.name}</td>
                      <td><span className="sdom-badge sdom-badge-blue">{st.code}</span></td>
                      <td>{st.ti}</td>
                      <td>{st.smCount}</td>
                      <td>{st.pmCount}</td>
                      <td style={{ fontWeight: 700, color: st.score >= 85 ? "#16a34a" : st.score >= 75 ? "#d97706" : "#dc2626" }}>{st.score}%</td>
                      <td>{st.safety}%</td>
                      <td>{st.highRisk > 3 ? <span style={{ color: "#dc2626", fontWeight: 700 }}>{st.highRisk}</span> : st.highRisk}</td>
                      <td>{st.pending}</td>
                      <td>
                        <button className="sdom-btn-primary" style={{ padding: "7px 14px", fontSize: "0.82rem" }} onClick={() => setSelectedStation(st)}>
                          {t("stations.openStationDashboard")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddStationModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 9999 }}>
            <div className="sdom-modal" style={{ width: "550px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0B1F3A" }}>{t("stations.addNewStation")}</h3>
                <button type="button" onClick={() => setShowAddStationModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("stations.stationName")}</label>
                  <input type="text" value={newStationData.name} onChange={e => setNewStationData({ ...newStationData, name: e.target.value })} placeholder="e.g. Wardha Junction" />
                </div>
                <div className="sdom-modal-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("stations.stationCode")}</label>
                  <input type="text" value={newStationData.code} onChange={e => setNewStationData({ ...newStationData, code: e.target.value })} placeholder="e.g. WR" />
                </div>
                <div className="sdom-modal-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("assessment.categoryCol")}</label>
                  <select value={newStationData.category} onChange={e => setNewStationData({ ...newStationData, category: e.target.value })}>
                    <option value="A">{t("stations.gradeAStations").replace(" Stations", " Station")}</option>
                    <option value="B">{t("stations.gradeBStations").replace(" Stations", " Station")}</option>
                    <option value="C">{t("stations.gradeCStations").replace(" Stations", " Station")}</option>
                    <option value="D">{t("stations.gradeDStations").replace(" Stations", " Station")}</option>
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("profile.division")}</label>
                  <input type="text" value={newStationData.division} onChange={e => setNewStationData({ ...newStationData, division: e.target.value })} placeholder="e.g. Nagpur Division" />
                </div>
                <div className="sdom-modal-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("profile.zone")}</label>
                  <input type="text" value={newStationData.zone} onChange={e => setNewStationData({ ...newStationData, zone: e.target.value })} placeholder="e.g. Central Railway" />
                </div>
                <div className="sdom-modal-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("stations.initialSMCount")}</label>
                  <input type="number" min="0" value={newStationData.smCount} onChange={e => setNewStationData({ ...newStationData, smCount: e.target.value })} placeholder="e.g. 2" />
                </div>
                <div className="sdom-modal-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>{t("stations.initialPointsmenCount")}</label>
                  <input type="number" min="0" value={newStationData.pmCount} onChange={e => setNewStationData({ ...newStationData, pmCount: e.target.value })} placeholder="e.g. 8" />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button className="sdom-btn-outline" onClick={() => setShowAddStationModal(false)}>{t("buttons.cancel")}</button>
                <button className="sdom-btn-primary" onClick={handleAddStationSubmit}>{t("stations.createStation")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
