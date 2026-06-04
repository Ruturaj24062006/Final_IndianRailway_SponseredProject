import { useState } from "react";
import { Search, FileBarChart2, ShieldCheck, Clock, Award, FileText } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export default function TIReports({
  rpStation,
  setRpStation,
  rpCat,
  setRpCat,
  rpRisk,
  setRpRisk,
  rpSearch,
  setRpSearch,
  rpSort,
  setRpSort,
  selectedReportUserId,
  setSelectedReportUserId,
  users,
  stations,
  tiAssessments,
  getUserRisk,
  isChartZoomModalOpen,
  setIsChartZoomModalOpen,
  selectedChartType,
  setSelectedChartType,
  zoomPopupPage,
  setZoomPopupPage,
  zoomPopupSearch,
  setZoomPopupSearch,
  zoomPopupZone,
  setZoomPopupZone,
  zoomPopupDivision,
  setZoomPopupDivision,
  zoomPopupStationName,
  setZoomPopupStationName,
  zoomPopupStationCode,
  setZoomPopupStationCode,
  zoomPopupCategory,
  setZoomPopupCategory,
  zoomPopupRisk,
  setZoomPopupRisk,
  zoomPopupStatus,
  setZoomPopupStatus,
  zoomPopupStartDate,
  setZoomPopupStartDate,
  zoomPopupEndDate,
  setZoomPopupEndDate,
  MONTHLY
}) {
  const ROLE_MAP = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector", Pointsman: "Pointsman", "Station Master": "Station Master", "Station Superintendent": "Station Superintendent", "Train Manager": "Train Manager", "Traffic Inspector": "Traffic Inspector" };

    if (selectedReportUserId) {
      const u = users.find(x => x.id === selectedReportUserId);
      if (!u) return null;

      const getCat = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D";
      const cat = u.cat || getCat(u.score || 0);

      const CAT_C = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
      const CAT_B = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
      const RISK_C = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };

      const isHighRisk = u.pmeStatus === "Overdue" || u.refStatus === "Expired" || (u.score || 0) < 50;
      const risk = isHighRisk ? "High" : (u.score || 0) >= 80 ? "Low" : "Medium";
      const pmeVal = u.pmeStatus === "Fit" ? "FIT" : u.pmeStatus === "Pending" ? "PENDING" : u.pmeStatus === "Overdue" ? "OVERDUE" : "UNFIT";
      const refVal = u.refStatus === "Cleared" ? "CLEARED" : "EXPIRED";

      const pmAssess = pmList.find(p => p.hrmsId === u.id);
      const smAssess = smList.find(s => s.hrmsId === u.id);
      const smForm = smForms[smAssess?.id];

      return (
        <div className="ti2-card animate-fade-in" style={{ padding: "24px", background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          {/* Header section with back button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #e2edf8", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="ti2-pm-avatar" style={{ width: 48, height: 48, fontSize: 18, background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "700" }}>{u.name.charAt(0)}</div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: 0 }}>{u.name}</h2>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b", fontWeight: "700" }}>{ROLE_MAP[u.role] || u.designation || u.role} Dossier · {u.station}</p>
              </div>
            </div>
            <button className="ti2-link-btn" onClick={() => setSelectedReportUserId(null)} style={{ fontSize: "13px", fontWeight: "800", color: "#2563eb", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              â† Back to Reports
            </button>
          </div>

          {/* Quick Info Summary metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Grand Total Score</span>
              <strong style={{ display: "block", fontSize: "24px", color: CAT_C[cat] || "#2563eb", marginTop: "4px", fontWeight: "900" }}>{u.score}/100</strong>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Safety Grade</span>
              <div>
                <span className="ti2-badge" style={{ display: "inline-block", background: CAT_B[cat] || "#dbeafe", color: CAT_C[cat] || "#2563eb", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                  Category {cat}
                </span>
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>PME Clearance</span>
              <div>
                <span className="ti2-badge" style={{ display: "inline-block", background: pmeVal === "FIT" ? "#dcfce7" : "#fee2e2", color: pmeVal === "FIT" ? "#16a34a" : "#dc2626", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                  {pmeVal}
                </span>
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>REF Training</span>
              <div>
                <span className="ti2-badge" style={{ display: "inline-block", background: refVal === "CLEARED" ? "#dcfce7" : "#fee2e2", color: refVal === "CLEARED" ? "#16a34a" : "#dc2626", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                  {refVal}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px" }}>
            {/* Left side details card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1.5px solid #e2edf8", paddingBottom: "8px" }}>Personnel Roster Details</h3>
                <dl style={{ display: "flex", flexDirection: "column", gap: "12px", margin: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Employee HRMS ID</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.id}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Designation</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{ROLE_MAP[u.role] || u.designation}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Jurisdiction Station</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.station}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Contact Number</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.contact || "+91 98765 11001"}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Date of Appointment</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.joiningDate || "2018-02-12"}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Alcoholic Status</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: u.alcoholicStatus === "Alcoholic" ? "#dc2626" : "#16a34a" }}>{u.alcoholicStatus || "Non-Alcoholic"}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Assigned Division Risk</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: RISK_C[risk] }}>{risk} Risk</dd></div>
                </dl>
              </div>

              {/* Action button */}
              <button className="ti2-primary-btn" onClick={() => alert("Exporting Dossier PDF...")} style={{ width: "100%", height: "42px", justifyContent: "center", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "8px", fontWeight: "700", cursor: "pointer", border: "none", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={16} /> Export Assessment Dossier (PDF)
              </button>
            </div>

            {/* Right side Performance Breakdown */}
            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "18px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1.5px solid #e2edf8", paddingBottom: "8px" }}>Sectional Competency Breakdown</h3>

              {u.role === "Pointsman" || u.role === "pointsmen" ? (
                /* Pointsman sections competency progress bars */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(() => {
                    const secs = pmAssess?.finalSections || pmAssess?.originalSections || [
                      { title: "Knowledge of Rules", score: Math.round(u.score * 0.23), max: 25 },
                      { title: "Alertness & Observation", score: Math.round(u.score * 0.22), max: 25 },
                      { title: "Safety Record", score: Math.round(u.score * 0.14), max: 15 },
                      { title: "Leadership & Management", score: Math.round(u.score * 0.13), max: 15 },
                      { title: "Discipline", score: Math.round(u.score * 0.09), max: 10 },
                      { title: "Appearance & Neatness", score: Math.round(u.score * 0.09), max: 10 },
                    ];
                    return secs.map(s => {
                      const pct = Math.round((s.score / s.max) * 100);
                      return (
                        <div key={s.title}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            <span>{s.title}</span>
                            <strong>{s.score} / {s.max} ({pct}%)</strong>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626", borderRadius: "999px" }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Station Master sections competency progress bars */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(() => {
                    let totalYes = smForm ? smForm.stationMgmt.filter(v => v === "Yes").length +
                      smForm.safety.filter(v => v === "Yes").length +
                      smForm.staffSupervision.filter(v => v === "Yes").length +
                      smForm.documentation.filter(v => v === "Yes").length +
                      smForm.emergency.filter(v => v === "Yes").length : 12;
                    let knowledgeMarks = smForm ? Math.min(parseInt(smForm.knowledgeMarks) || 0, 25) : Math.max(0, u.score - 60);

                    const secs = [
                      { title: "Station Management", score: smForm ? smForm.stationMgmt.filter(v => v === "Yes").length * 5 : Math.round(totalYes * 5 * 0.25), max: 25 },
                      { title: "Safety & Compliance", score: smForm ? smForm.safety.filter(v => v === "Yes").length * 4 : Math.round(totalYes * 4 * 0.25), max: 20 },
                      { title: "Staff Supervision", score: smForm ? smForm.staffSupervision.filter(v => v === "Yes").length * 3 : Math.round(totalYes * 3 * 0.20), max: 15 },
                      { title: "Documentation & Reporting", score: smForm ? smForm.documentation.filter(v => v === "Yes").length * 3 : Math.round(totalYes * 3 * 0.15), max: 15 },
                      { title: "Emergency Handling", score: smForm ? smForm.emergency.filter(v => v === "Yes").length * 5 : Math.round(totalYes * 5 * 0.25), max: 25 },
                      { title: "Knowledge (Safety Exam)", score: knowledgeMarks, max: 25 }
                    ];

                    return secs.map(s => {
                      const pct = Math.round((s.score / s.max) * 100);
                      return (
                        <div key={s.title}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            <span>{s.title}</span>
                            <strong>{s.score} / {s.max} ({pct}%)</strong>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626", borderRadius: "999px" }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const divSummary = [
      { label: "Average Division Score", val: 87 },
      { label: "Safety Compliance %", val: "91%" },
      { label: "High-Risk Staff", val: 18 },
      { label: "Pending Approvals", val: 246 },
      { label: "Total Reports Generated", val: 6245 },
    ];

    const STATION_OPTS = ["All", ...stations.map(s => s.name)];
    const TI_OPTS = ["All", "TI PAR", "TI AMLA", "TI NGP"];
    const ROLE_OPTS = ["All", "Pointsman", "Station Master", "Station Superintendent", "Train Manager"];

    const stationTiMap = {
      "Parbhani Junction": "TI PAR",
      "Amla Junction": "TI AMLA",
      "Badnera Junction": "TI NGP",
      "Akola Junction": "TI PAR",
      "Nagpur Junction": "TI NGP",
      "Wardha Junction": "TI NGP",
      "Betul Station": "TI AMLA",
      "Itarsi Junction": "TI AMLA",
      "Chandrapur Station": "TI NGP",
      "Gondia Junction": "TI NGP",
      "Dhamangaon Station": "TI NGP",
      "Pulgaon Junction": "TI NGP"
    };
    const getTiArea = (st) => stationTiMap[st] || "TI NGP";

    const getCat = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D";

    const repFiltered = users.filter(s => {
      const matchesSearch = !repF.search ||
        (s.name || "").toLowerCase().includes(repF.search.toLowerCase()) ||
        (s.id || "").toLowerCase().includes(repF.search.toLowerCase());
      const matchesRole = repF.role === "All" || (s.role || "").toLowerCase() === repF.role.toLowerCase() || (s.designation || "").toLowerCase().includes(repF.role.toLowerCase());
      const matchesStation = repF.station === "All" || s.station === repF.station;
      const matchesCat = repF.cat === "All" || (s.cat || getCat(s.score)) === repF.cat;
      const isHighRisk = s.pmeStatus === "Overdue" || s.refStatus === "Expired" || s.score < 50;
      const sRisk = isHighRisk ? "High" : s.score >= 80 ? "Low" : "Medium";
      const matchesRisk = repF.risk === "All" || sRisk === repF.risk;
      return matchesSearch && matchesRole && matchesStation && matchesCat && matchesRisk;
    });

    const catBadge = c => <span className="sdom-badge" style={{ background: { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" }[c] || "#f3f4f6", color: { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" }[c] || "#6b7280" }}>{c ? `Cat. ${c}` : "—"}</span>;
    const riskBadge = r => <span className="sdom-badge" style={{ background: { Low: "#dcfce7", Medium: "#fef3c7", High: "#fee2e2" }[r] || "#f3f4f6", color: { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" }[r] || "#6b7280" }}>{r}</span>;
    const statusBadge = s => <span className="sdom-badge" style={{ background: { Approved: "#dcfce7", Pending: "#fef3c7", Rejected: "#fee2e2", Completed: "#dcfce7", Fit: "#dcfce7" }[s] || "#f3f4f6", color: { Approved: "#16a34a", Pending: "#d97706", Rejected: "#dc2626", Completed: "#16a34a", Fit: "#16a34a" }[s] || "#6b7280" }}>{s}</span>;

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>Reports &amp; Analytics</h1>
        <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>Division-level reporting hub. Use filters below to generate specific staff reports.</p>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "16px", marginBottom: "24px" }}>
          {divSummary.map(c => (
            <div key={c.label} className="sdom-stat-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="sdom-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{c.val}</div>
              <div className="sdom-stat-label" style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="sdom-filter-bar" style={{ display: "flex", gap: "16px", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2, minWidth: "200px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Search by Name/HRMS ID</label>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Type name or HRMS ID..."
                value={repF.search || ""}
                onChange={e => setRepF(p => ({ ...p, search: e.target.value }))}
                style={{ width: "100%", height: "42px", padding: "0 12px 0 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", outline: "none" }}
              />
            </div>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "120px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Role</label>
            <select value={repF.role} onChange={e => setRepF(p => ({ ...p, role: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              {ROLE_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Station</label>
            <select value={repF.station} onChange={e => setRepF(p => ({ ...p, station: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              {STATION_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "100px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Category</label>
            <select value={repF.cat} onChange={e => setRepF(p => ({ ...p, cat: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "110px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Risk Level</label>
            <select value={repF.risk} onChange={e => setRepF(p => ({ ...p, risk: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <div>
            <button className="sdom-btn-primary" style={{ height: "42px", display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "white", padding: "0 20px", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
              <Search size={16} /> Search
            </button>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: 14, fontWeight: 700, color: "#1e293b" }}>{repFiltered.length} staff in report</div>
          <div className="sdom-table-wrap" style={{ overflowX: "auto" }}>
            <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Name</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Role</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Station</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>TI Area</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Score</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Category</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Risk</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {repFiltered.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No staff match the selected filters</td></tr>}
                {repFiltered.map(s => {
                  const sCat = s.cat || getCat(s.score);
                  const isHighRisk = s.pmeStatus === "Overdue" || s.refStatus === "Expired" || s.score < 50;
                  const sRisk = isHighRisk ? "High" : s.score >= 80 ? "Low" : "Medium";
                  return (
                    <tr key={s.id} style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }} onClick={() => setSelectedReportUserId(s.id)}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2563eb" }}>{s.name}</td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{ROLE_MAP[s.role] || s.role}</td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{s.station}</td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{getTiArea(s.station)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{s.score}</td>
                      <td style={{ padding: "12px 16px" }}>{catBadge(sCat)}</td>
                      <td style={{ padding: "12px 16px" }}>{riskBadge(sRisk)}</td>
                      <td style={{ padding: "12px 16px" }}>{statusBadge(s.pmeStatus === "Unfit" ? "Rejected" : s.refStatus === "Expired" ? "Pending" : "Approved")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
}
