import { useState } from "react";
import { Search, Plus, Trash2, Edit, RefreshCw, ChevronLeft, ChevronRight, Star, HeartHandshake, Eye, Award, Clock, FileCheck, CheckCircle2, Lock, Paperclip, ArrowLeft, Users } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

export default function AOmRoleView({
  roleKey,
  title,
  stationsDirectory,
  view,
  setView,
  roleF,
  setRoleF,
  openAdd,
  openEdit,
  openShift,
  removeStaff,
  getCategoryBg,
  getCategoryColor,
  riskBadge,
  catBadge,
  statusBadge,
  ROLE_MAP,
  ROLE_OPTS,
  STATION_OPTS,
  TI_OPTS,
  filterByRole,
  selectedTIForStationMasters,
  setSelectedTIForStationMasters,
  selectedSMProfile,
  setSelectedSMProfile,
  activePage,
  setActivePage,
  getPmRisk,
  stationMastersDirectory,
  aomPointsmen,
  aomTIs,
  aomSSs,
  aomTMs,
  setAomPointsmen,
  setStationMastersDirectory,
  setAomTIs,
  setAomSSs,
  setAomTMs,
  modal,
  setModal,
  saveModal,
  MONTHLY_TREND
}) {
  // If a profile detail is being viewed
    if (selectedRoleEmployee && selectedRoleEmployee._roleKey === roleKey) {
      const s = selectedRoleEmployee;
      const scoreData = MONTHLY_TREND.map((m, i) => ({ month: m.month, score: Math.max(50, (s.lastScore || 80) - 10 + i * 2) }));
      const roleLabel = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector" }[roleKey] || title;
      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => setSelectedRoleEmployee(null)}>
              <ArrowLeft size={16} /> Back to List
            </button>
          </div>
          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{roleLabel} &bull; {s.stationName} &bull; {s.zone || "Central Railway"}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <span className={`sdom-badge ${{ A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" }[s.category] || "sdom-badge-neutral"}`}>{s.category}</span>
                <span className={`sdom-badge ${{ Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" }[s.riskLevel] || "sdom-badge-neutral"}`}>{s.riskLevel}</span>
                <span className={`sdom-badge ${{ Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger" }[s.assessmentStatus] || "sdom-badge-neutral"}`}>{s.assessmentStatus}</span>
              </div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat"><span className="val">{s.lastScore || "–"}</span><span className="lbl">Latest Score</span></div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat"><span className="val">{s.contactNumber || "—"}</span><span className="lbl">Contact</span></div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat"><span className="val">{s.lastAssessedDate || "—"}</span><span className="lbl">Last Assessment</span></div>
            </div>
          </div>
          <div className="sdom-row-2">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Personal &amp; Professional Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, paddingBottom: 20 }}>
                {[
                  ["HRMS ID", s.hrmsId],
                  ["Designation", roleLabel],
                  ["Mobile Number", s.contactNumber || "N/A"],
                  ["Email ID", s.emailId || `${s.hrmsId?.toLowerCase()}@rail.in`],
                  ["Account Status", s.monitoringStatus || "Active"],
                  ["Zone", s.zone || "Central Railway"],
                  ["Division", s.division || "Nagpur"],
                  ["Station", s.stationName],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Operational Specifications */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                  Operational Profile Specifications
                </h4>
                
                {s.role === "pointsmen" && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Reporting Station Master:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                    <div><strong>Assigned Shift:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                    <div><strong>Work Location Setup:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.workLocation || "Yard Area"}</div></div>
                  </div>
                )}

                {(s.role === "sm" || s.role === "ss") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Operational Station:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.smStation || s.stationName || "N/A"}</div></div>
                    <div><strong>Operational Division:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.smDivision || s.division || "Nagpur"}</div></div>
                    <div><strong>Operational Zone:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.smZone || s.zone || "Central Railway"}</div></div>
                  </div>
                )}

                {s.role === "tm" && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Crew Depot:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.workLocation || "Nagpur Depot"}</div></div>
                    <div><strong>Assigned Shift:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.shift || "Goods Train Beat"}</div></div>
                    <div><strong>Assigned Section Beats:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                  </div>
                )}
              </div>
            </div>
            <div className="sdom-chart-card">
              <div className="sdom-chart-title">Score Trend</div>
              <div className="sdom-chart-subtitle">Assessment score progression</div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis domain={[40, 100]} fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // TI Assessment fill form
    if (roleKey === "ti" && tiAssessmentFormOpen) {
      const tiEmployee = allEmployees.find(e => e.hrmsId === tiAssessmentFormOpen && e.role === "ti");
      const answers = tiAssessmentAnswers[tiAssessmentFormOpen] || {};
      const totalMarks = assessmentCriteria.reduce((t, c) => t + c.marks, 0);
      const scored = assessmentCriteria.reduce((t, c) => t + (answers[c.key] === "yes" ? c.marks : 0), 0);
      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => setTiAssessmentFormOpen(null)}>
              <ArrowLeft size={16} /> Back to Traffic Inspectors
            </button>
          </div>
          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase" }}>Traffic Inspector Assessment</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 }}>{tiEmployee?.name || tiAssessmentFormOpen}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>HRMS: {tiAssessmentFormOpen} &bull; Division: {tiEmployee?.division || "–"}</div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat"><span className="val">{scored}/{totalMarks}</span><span className="lbl">Current Score</span></div>
            </div>
          </div>
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: 20 }}>Safety & Competency Assessment — Yes / No Checklist</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assessmentCriteria.map((c) => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "14px 18px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{c.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>Max Marks: {c.marks}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTiAssessmentAnswers(prev => ({ ...prev, [tiAssessmentFormOpen]: { ...prev[tiAssessmentFormOpen], [c.key]: "yes" } }))}
                      style={{ padding: "8px 20px", borderRadius: 6, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                        borderColor: answers[c.key] === "yes" ? "#16a34a" : "#d1d5db",
                        background: answers[c.key] === "yes" ? "#dcfce7" : "#ffffff",
                        color: answers[c.key] === "yes" ? "#15803d" : "#6b7280" }}
                    >✓ Yes</button>
                    <button
                      type="button"
                      onClick={() => setTiAssessmentAnswers(prev => ({ ...prev, [tiAssessmentFormOpen]: { ...prev[tiAssessmentFormOpen], [c.key]: "no" } }))}
                      style={{ padding: "8px 20px", borderRadius: 6, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                        borderColor: answers[c.key] === "no" ? "#dc2626" : "#d1d5db",
                        background: answers[c.key] === "no" ? "#fee2e2" : "#ffffff",
                        color: answers[c.key] === "no" ? "#b91c1c" : "#6b7280" }}
                    >✗ No</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Score: {scored} / {totalMarks} — Grade: {scored >= 90 ? "A" : scored >= 70 ? "B" : "C"}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="sdom-btn-outline" onClick={() => setTiAssessmentFormOpen(null)}>Cancel</button>
                <button className="sdom-btn-primary" onClick={() => {
                  const grade = scored >= 90 ? "A" : scored >= 70 ? "B" : "C";
                  alert(`Assessment submitted for ${tiEmployee?.name || tiAssessmentFormOpen}.\nScore: ${scored}/${totalMarks} — Grade: ${grade}`);
                  setTiActivatedAssessments(prev => ({ ...prev, [tiAssessmentFormOpen]: "submitted" }));
                  setTiAssessmentFormOpen(null);
                }}>Submit Assessment</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const filtered = allEmployees.filter(e =>
      e.role === roleKey &&
      (roleFilterStation === "All" || e.stationName === roleFilterStation) &&
      (roleFilterDivision === "All" || e.division === roleFilterDivision) &&
      (roleFilterCat === "All" || e.category === roleFilterCat) &&
      (roleFilterRisk === "All" || e.riskLevel === roleFilterRisk) &&
      (!roleFilterName || e.name.toLowerCase().includes(roleFilterName.toLowerCase()) || e.hrmsId.toLowerCase().includes(roleFilterName.toLowerCase()))
    );

    const stationOpts = ["All", ...Array.from(new Set(allEmployees.filter(e => e.role === roleKey).map(e => e.stationName)))];
    const divisionOpts = ["All", ...Array.from(new Set(allEmployees.filter(e => e.role === roleKey).map(e => e.division)))];

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 className="sdom-page-title">{title} Management</h1>
            <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
          </div>
          {(roleKey === "pointsmen" || roleKey === "sm" || roleKey === "ss" || roleKey === "tm" || roleKey === "ti") && (
            <button className="sdom-btn-primary" onClick={
              roleKey === "pointsmen" ? openPmAdd :
              roleKey === "sm" ? openSmAdd :
              roleKey === "ss" ? openSsAdd :
              roleKey === "tm" ? openTmAdd : openTiAdd
            }>
              <Plus size={16} /> Add New {title}
            </button>
          )}
        </div>

        {/* Filters - matching SuperAdmin style */}
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ minWidth: 200 }}>
            <label>Name / ID</label>
            <input value={roleFilterName} onChange={e => setRoleFilterName(e.target.value)} placeholder="Search..." />
          </div>
          <div className="sdom-filter-field">
            <label>Station</label>
            <select value={roleFilterStation} onChange={e => setRoleFilterStation(e.target.value)}>
              {stationOpts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>{roleKey === "ti" ? "TI Area" : "Division"}</label>
            <select value={roleFilterDivision} onChange={e => setRoleFilterDivision(e.target.value)}>
              {divisionOpts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Category</label>
            <select value={roleFilterCat} onChange={e => setRoleFilterCat(e.target.value)}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Risk Level</label>
            <select value={roleFilterRisk} onChange={e => setRoleFilterRisk(e.target.value)}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>{filtered.length} staff found</span>
          </div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{roleKey === "ti" ? "Emp ID" : "HRMS ID"}</th>
                  <th>Station</th>
                  <th>{roleKey === "ti" ? "TI Area" : "Division"}</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Last Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No records found</td></tr>
                )}
                {filtered.map(s => {
                  const isPending = s.assessmentStatus === "Pending";
                  const tiActivated = tiActivatedAssessments[s.hrmsId];

                  const renderCategoryBadge = (cat) => {
                    const bgMap = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
                    const fgMap = { A: "#15803d", B: "#1d4ed8", C: "#b45309", D: "#b91c1c" };
                    
                    if (roleKey === "ti") {
                      return (
                        <span style={{
                          background: bgMap[cat] || "#f1f5f9",
                          color: fgMap[cat] || "#475569",
                          border: `1px solid ${fgMap[cat] || "#cbd5e1"}`,
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          fontWeight: "700",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center"
                        }}>
                          {cat}
                        </span>
                      );
                    }

                    return (
                      <span style={{
                        background: bgMap[cat] || "#f1f5f9",
                        color: fgMap[cat] || "#475569",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "12px",
                        display: "inline-block",
                        minWidth: "24px",
                        textAlign: "center"
                      }}>
                        {cat}
                      </span>
                    );
                  };

                  const renderRiskBadge = (risk) => {
                    const bgMap = { Low: "#dcfce7", Medium: "#fff7ed", High: "#fee2e2" };
                    const fgMap = { Low: "#16a34a", Medium: "#ea580c", High: "#dc2626" };
                    return (
                      <span style={{
                        background: bgMap[risk] || "#f1f5f9",
                        color: fgMap[risk] || "#475569",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        display: "inline-block"
                      }}>
                        {risk}
                      </span>
                    );
                  };

                  const renderStatusBadge = (status) => {
                    const bgMap = { Approved: "#dcfce7", Completed: "#dcfce7", Pending: "#fff7ed", "In Progress": "#fef08a", Rejected: "#fee2e2" };
                    const fgMap = { Approved: "#16a34a", Completed: "#16a34a", Pending: "#ea580c", "In Progress": "#ca8a04", Rejected: "#dc2626" };
                    const text = status === "Completed" ? "APPROVED" : status.toUpperCase();
                    return (
                      <span style={{
                        background: bgMap[status] || "#f1f5f9",
                        color: fgMap[status] || "#475569",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        display: "inline-block"
                      }}>
                        {text}
                      </span>
                    );
                  };

                  return (
                    <tr key={s.hrmsId}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.hrmsId}</td>
                      <td>{s.stationName}</td>
                      <td>{s.division}</td>
                      <td>{renderCategoryBadge(s.category)}</td>
                      <td>{renderRiskBadge(s.riskLevel)}</td>
                      <td style={{ fontWeight: 700 }}>{s.lastScore || "–"}</td>
                      <td>{renderStatusBadge(s.assessmentStatus)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {/* View Profile */}
                          <button className="sdom-btn-outline" style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                            onClick={() => setSelectedRoleEmployee({ ...s, _roleKey: roleKey })}>
                            View
                          </button>
                          
                          {/* Edit */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => openTiEdit(s)}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const pmObj = aomPointsmen.find(pm => pm.hrmsId === s.hrmsId);
                              if (pmObj) openPmEdit(pmObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const smObj = aomStationMasters.find(sm => (sm.hrmsId || sm.id) === s.hrmsId);
                              if (smObj) openSmEdit(smObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const ssObj = aomSuperintendents.find(ss => ss.employeeId === s.hrmsId);
                              if (ssObj) openSsEdit(ssObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const tmObj = aomTrainManagers.find(tm => tm.employeeId === s.hrmsId);
                              if (tmObj) openTmEdit(tmObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          )}

                          {/* Shift */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const dest = window.prompt(`Enter new Division to shift ${s.name} (e.g. Pune, Mumbai, Delhi):`);
                              if (dest) {
                                if (window.confirm(`Shift ${s.name} to ${dest} Division?`)) {
                                  setTrafficInspectors(prev => prev.map(t => t.employeeId === s.hrmsId ? { ...t, division: dest, jurisdiction: dest } : t));
                                  alert(`${s.name} shifted to ${dest} Division successfully.`);
                                }
                              }
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const pmObj = aomPointsmen.find(pm => pm.hrmsId === s.hrmsId);
                              if (pmObj) openPmShift(pmObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const smObj = aomStationMasters.find(sm => (sm.hrmsId || sm.id) === s.hrmsId);
                              if (smObj) openSmShift(smObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const ssObj = aomSuperintendents.find(ss => ss.employeeId === s.hrmsId);
                              if (ssObj) openSsShift(ssObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const tmObj = aomTrainManagers.find(tm => tm.employeeId === s.hrmsId);
                              if (tmObj) openTmShift(tmObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          )}

                          {/* Remove */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeTi(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removePm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeSm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeSs(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeTm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
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
    );
}
