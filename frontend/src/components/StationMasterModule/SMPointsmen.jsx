import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit, CheckCircle, RefreshCw, Paperclip, ChevronLeft, ChevronRight, PlayCircle, Star, Target, ShieldCheck, Gauge, Award, ArrowLeft, UserPlus, ArrowRightLeft, TrendingUp, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import CommonUserModal from "../CommonUserModal";

export default function SMPointsmen({
  pointsmen,
  setPointsmen,
  stationMasterProfile,
  employeeId,
  selectedPointsman,
  setSelectedPointsman,
  pmModal,
  setPmModal,
  openPmAdd,
  openPmEdit,
  openPmShift,
  savePmModal,
  removePm,
  pmF,
  setPmF,
  stations = [],
  filteredPm,
  viewingPm,
  setViewingPm,
  riskLevel,
  getCat,
  CAT_BG,
  CAT_COLOR,
  RISK_BG,
  RISK_COLOR
}) {
  const smProfile = stationMasterProfile;
  const smId = employeeId;

  const renderPointsmenDetail = (s) => {
    const trendScores = [
      { month: "Dec 25", score: Math.max(50, (s.lastScore || s.score || 80) - 6) },
      { month: "Jan 26", score: Math.max(50, (s.lastScore || s.score || 80) - 4) },
      { month: "Feb 26", score: Math.max(50, (s.lastScore || s.score || 80) - 2) },
      { month: "Mar 26", score: Math.max(50, (s.lastScore || s.score || 80) + 1) },
      { month: "Apr 26", score: Math.max(50, (s.lastScore || s.score || 80) + 2) },
      { month: "May 26", score: Math.max(50, (s.lastScore || s.score || 80)) },
    ];
    const catMap = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
    const pmRisk = riskLevel(s);
    const riskMap = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
    const catVal = getCat(s.lastScore);

    return (
      <div className="sdom-fade">
        <div style={{ marginBottom: 24 }}>
          <button className="sdom-back-btn" onClick={() => setViewingPm(null)}>
            <ArrowLeft size={16} /> Back to List
          </button>
        </div>

        {/* Hero header */}
        <div className="sdom-station-header" style={{ marginBottom: 24 }}>
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>Pointsman &bull; {s.station || smProfile.station} &bull; Central Railway</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <span className={`sdom-badge ${catMap[catVal] || "sdom-badge-neutral"}`}>{catVal}</span>
              <span className={`sdom-badge ${riskMap[pmRisk] || "sdom-badge-neutral"}`}>{pmRisk}</span>
              <span className="sdom-badge sdom-badge-success">Active</span>
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{s.lastScore || s.score || "–"}</span>
              <span className="lbl">Latest Score</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.contact || "—"}</span>
              <span className="lbl">Contact</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.lastAssessDate || s.lastDate || "—"}</span>
              <span className="lbl">Last Assessment</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Personal &amp; Professional Details</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, paddingBottom: 20 }}>
              {[
                ["Employee ID / HRMS ID", s.hrmsId],
                ["Designation", s.designation || "Pointsman"],
                ["Mobile Number", s.contact || "N/A"],
                ["Email ID", `${s.hrmsId?.toLowerCase()}@rail.in`],
                ["Account Status", "Active"],
                ["Current Zone", "Central Railway"],
                ["Current Division", "Nagpur"],
                ["Current Station Placement", s.station || smProfile.station],
                ["Reporting Officer", smProfile.name || "Station Master"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Operational Specifications */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", marginTop: 10 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#0f172a", fontWeight: 800, borderBottom: "1px solid #cbd5e1", paddingBottom: 6 }}>
                Operational Profile Specifications
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 13 }}>
                <div><strong>Reporting Station Master:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.reportingSm || smProfile.name}</div></div>
                <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                <div><strong>Work Location Setup:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.workLocation || "Yard Area"}</div></div>
              </div>
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score Trend</div>
            <div className="sdom-chart-subtitle">Assessment score progression</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendScores}>
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
  };

  const renderPointsmenModal = () => {
    if (!pmModal) return null;
    const isShift = pmModal.mode === "shift";
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e=>e.target===e.currentTarget&&setPmModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>
          
          {!isShift ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header inside modal */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                  color: "#ffffff"
                }}>
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                    {pmModal.mode === "edit" ? "EDIT OPERATIONAL POINTSMAN" : "ADD NEW OPERATIONAL POINTSMAN"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>

              {/* Section 1: General & Contact Information */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  1. General & Contact Information
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Full Name *</label>
                    <input 
                      value={pmModal.data.name || ""} 
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))} 
                      placeholder="Enter full name (e.g. A. K. Sharma)" 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Mobile Number *</label>
                    <input 
                      value={pmModal.data.contact || ""} 
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, contact: e.target.value } }))} 
                      placeholder="Enter 10-digit mobile number" 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>HRMS ID / Employee ID *</label>
                    <input 
                      value={pmModal.data.hrmsId || ""} 
                      disabled={pmModal.mode === "edit"}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, hrmsId: e.target.value, id: e.target.value } }))} 
                      placeholder="Enter unique ID (e.g. PM_8820)" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Designation & Station Placement Setup */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  2. Designation & Station Placement Setup
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Role / Designation *</label>
                    <select value="Pointsman" disabled>
                      <option value="Pointsman">Pointsman</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Station Name *</label>
                    <select value={pmModal.data.station || ""} disabled>
                      <option value={smProfile.station}>{smProfile.station}</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Category *</label>
                    <select 
                      value={pmModal.data.cat || "A"} 
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, cat: e.target.value } }))}
                    >
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Pointsman Operational Setup */}
              <div style={{ padding: 18, background: "#f0f7ff", border: "1px solid #c2e0ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Pointsman Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Reporting Station Master *</label>
                    <input 
                      value={pmModal.data.reportingSm || ""} 
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, reportingSm: e.target.value } }))} 
                      placeholder="Station Master Name"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Work Location Setup *</label>
                    <select 
                      value={pmModal.data.workLocation || ""} 
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, workLocation: e.target.value } }))}
                    >
                      <option value="">Select Location</option>
                      <option value="Yard">Yard Area</option>
                      <option value="Cabin A">Cabin A</option>
                      <option value="Cabin B">Cabin B</option>
                      <option value="Platform Area">Platform Area</option>
                      <option value="Level Crossing Gate">Level Crossing Gate</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select 
                      value={pmModal.data.shift || ""} 
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, shift: e.target.value } }))}
                    >
                      <option value="">Select Shift</option>
                      <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                      <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                      <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                      <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sdom-modal-title" style={{ marginBottom: 20 }}>Shift Staff Role</div>
              <div className="sdom-modal-field">
                <label>Role (Shift to)</label>
                <select 
                  value={pmModal.role || "Pointsman"} 
                  onChange={e=>setPmModal(p=>({...p, role: e.target.value}))}
                >
                  <option value="Pointsman">Pointsman</option>
                  <option value="Station Master">Station Master</option>
                  <option value="Station Superintendent">Station Superintendent</option>
                  <option value="Train Manager">Train Manager</option>
                  <option value="Traffic Inspector">Traffic Inspector</option>
                </select>
              </div>
            </>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={savePmModal}>
              {pmModal.mode === "edit" ? "🔒 UPDATE POINTSMAN" : isShift ? "🔄 SHIFT POINTSMAN ROLE" : "👤 ADD POINTSMAN"}
            </button>
            <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={()=>setPmModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPmDetail = (pm) => {
    const cat  = getCat(pm.lastScore);
    const risk = riskLevel(pm);
    const safetyPct = pm.safetyScore;
    const hist = pmAssessmentHistory[pm.id] || [];
    return (
      <section className="sm2-card">
        <div className="sm2-card-hdr">
          <h2>Pointsman Details</h2>
          <button className="sm2-link-btn" onClick={() => setPageMode("default")}>← Back</button>
        </div>

        {/* Hero */}
        <div className="sm2-pm-hero">
          <div className="sm2-pm-avatar">{pm.name.charAt(0)}</div>
          <div>
            <h3>{pm.name}</h3>
            <span>{pm.hrmsId} · {pm.designation || "Pointsman"} · {pm.station || smProfile.station}</span>
            <div className="sm2-pm-badges">
              <span className="sm2-badge" style={{background:CAT_BG[cat],color:CAT_COLOR[cat]}}>Category {cat}</span>
              <span className="sm2-badge" style={{background:RISK_BG[risk],color:RISK_COLOR[risk]}}>{risk} Risk</span>
              <span className={`sm2-status-pill sm2-status-${pm.approvalStatus.toLowerCase()}`}>{pm.approvalStatus}</span>
            </div>
          </div>
          <div className="sm2-pm-quick-stats">
            <div><label>Latest Score</label><strong>{pm.lastScore}/100</strong></div>
            <div><label>Safety Score</label><strong>{pm.safetyScore}%</strong></div>
            <div><label>Assessments</label><strong>{pm.totalAssessments}</strong></div>
          </div>
        </div>

        {/* Personal Info */}
        <dl className="sm2-dl-grid" style={{marginBottom:20}}>
          <div><dt>Gender</dt><dd>{pm.gender}</dd></div>
          <div><dt>Age</dt><dd>{pm.age} yrs</dd></div>
          <div><dt>Date of Joining</dt><dd>{pm.doj}</dd></div>
          <div><dt>Base Pay</dt><dd>{pm.basePay}</dd></div>
        </dl>

        {/* Monitoring Status */}
        <div style={{
          marginTop: "20px",
          marginBottom: "20px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)"
        }}>
          <h4 style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 16px 0",
            fontSize: "14px",
            fontWeight: "700",
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <Activity size={16} color="#0d2c4d" /> Monitoring Status
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {[
              { 
                status: "Active", 
                color: "#16a34a", 
                bg: "#dcfce7", 
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" fill="#16a34a" fillOpacity="0.2" />
                    <circle cx="12" cy="12" r="3" fill="#16a34a" />
                  </svg>
                ),
                desc: "Available for yard operations" 
              },
              { 
                status: "On Duty", 
                color: "#d97706", 
                bg: "#fef3c7", 
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                desc: "Currently executing track tasks" 
              },
              { 
                status: "Off Duty", 
                color: "#64748b", 
                bg: "#f1f5f9", 
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                desc: "Resting / Shift ended" 
              },
              { 
                status: "Absent", 
                color: "#dc2626", 
                bg: "#fee2e2", 
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ),
                desc: "Unexcused leave of absence" 
              }
            ].map(item => {
              const isActive = (pm.monitoringStatus || "Active") === item.status;
              return (
                <div
                  key={item.status}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: isActive ? `1.5px solid ${item.color}` : "1.5px solid #e2e8f0",
                    background: isActive ? item.bg : "#ffffff",
                    boxShadow: isActive ? `0 4px 14px ${item.color}15` : "none",
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? "scale(1.02)" : "none",
                    transition: "all 0.2s ease",
                    cursor: "default"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: isActive ? item.color : "#334155"
                      }}>
                        {item.status}
                      </span>
                    </div>
                    {isActive && (
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "800",
                        background: item.color,
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2px"
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: "11px",
                    color: isActive ? "#334155" : "#64748b",
                    fontWeight: isActive ? "500" : "400",
                    lineHeight: "1.4"
                  }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Compliance */}
        <div className="sm2-safety-block">
          <h4>Safety Compliance</h4>
          <div className="sm2-safety-grid">
            <div className="sm2-safety-item"><span>PME Status</span><strong className={pm.pmeStatus==="Fit"?"text-green":"text-red"}>{pm.pmeStatus}</strong></div>
            <div className="sm2-safety-item"><span>REF Status</span><strong className={pm.refStatus==="Cleared"?"text-green":"text-amber"}>{pm.refStatus}</strong></div>
            <div className="sm2-safety-item"><span>Disciplinary</span><strong className={pm.disciplinary==="None"?"text-green":"text-red"}>{pm.disciplinary}</strong></div>
            <div className="sm2-safety-item"><span>Incidents</span><strong className={pm.incidents===0?"text-green":"text-red"}>{pm.incidents} reported</strong></div>
          </div>
          <div className="sm2-compliance-bar-wrap">
            <div className="sm2-compliance-label">
              <span>Overall Safety Compliance</span>
              <strong style={{color: safetyPct >= 75 ? "#16a34a" : safetyPct >= 50 ? "#d97706" : "#dc2626"}}>{safetyPct}%</strong>
            </div>
            <div className="sm2-compliance-track">
              <div className="sm2-compliance-fill" style={{
                width:`${safetyPct}%`,
                background: safetyPct >= 75 ? "#16a34a" : safetyPct >= 50 ? "#d97706" : "#dc2626"
              }}/>
            </div>
          </div>
        </div>

        {/* 📈 PERFORMANCE TREND & SAFETY COMPETENCY breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginTop: "20px" }}>
          
          {/* Performance Improvement Trend Chart */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)"
          }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={16} color="#2563eb" /> Performance Improvement Trend
            </h4>
            {hist.length === 0 ? (
              <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "13px" }}>No history to plot trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[...hist].reverse().map((h, i) => ({ attempt: `Eval ${i+1}`, score: h.total, date: h.date }))} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="attempt" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop: "12px", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              💡 The timeline shows overall competence score growth over review periods. Target compliance rate is <strong>60% minimum</strong>.
            </div>
          </div>

          {/* Correct / Wrong Answers Audit */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)"
          }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={16} color="#16a34a" /> Safety Competency Audit Breakdown
            </h4>
            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
              {[
                { q: "Speed limit permitted over loop lines?", ans: "30 km/h", key: 1 },
                { q: "Signal below stop signal to admit train into occupied lines?", ans: "Calling-on signal", key: 2 },
                { q: "Maximum speed limit during shunting operations?", ans: "15 km/h", key: 3 },
                { q: "Vigilance action upon noticing hot axle on train?", ans: "Display Danger Hand Signal", key: 4 },
                { q: "Detonator count required for emergency protection?", ans: "3 Detonators", key: 5 },
                { q: "Frequency of mandatory refresher training?", ans: "Every 3 years", key: 6 },
                { q: "Who delivers key/token to loco pilots?", ans: "Authorized Pointsman", key: 7 },
                { q: "Shunting indicator signal light type?", ans: "Position Light Type", key: 8 }
              ].map((item, index) => {
                const isCorrect = pm.lastScore >= (index + 1) * 11;
                return (
                  <div key={item.key} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: isCorrect ? "#f0fdf4" : "#fef2f2",
                    border: isCorrect ? "1px solid #dcfce7" : "1px solid #fee2e2"
                  }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: isCorrect ? "#16a34a" : "#dc2626",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: "bold",
                      marginTop: "1px",
                      flexShrink: 0
                    }}>
                      {isCorrect ? "✓" : "✗"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>{item.q}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: isCorrect ? "#16a34a" : "#dc2626", fontWeight: "500" }}>
                        {isCorrect ? `Correct Answer: ${item.ans}` : `Incorrect (Selected wrong threshold)`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div style={{marginTop:20}}>
          <h4 style={{margin:"0 0 12px",fontSize:14,color:"#0f172a"}}>Assessment History</h4>
          {hist.length === 0 ? <p className="sm2-empty">No assessments recorded yet.</p> : (
            <div className="sm2-table-wrap">
              <div className="sm2-hist-head sm2-hist-row-6">
                {["Date","Test Marks","Add. Marks","Total","Grade","Status"].map(h => <span key={h}>{h}</span>)}
              </div>
              {hist.map(r => {
                const hCat = getCat(r.total);
                return (
                  <div key={r.id} className="sm2-hist-row-6 sm2-hist-data-row">
                    <span>{r.date}</span>
                    <span>{r.testMarks}</span>
                    <span>{r.addMarks}</span>
                    <span><strong>{r.total}</strong></span>
                    <span><span className="sm2-badge" style={{background:CAT_BG[hCat],color:CAT_COLOR[hCat]}}>Cat. {hCat}</span></span>
                    <span>
                      <span className={`sm2-status-pill sm2-status-${r.approvalStatus.toLowerCase()}`}>{r.approvalStatus}</span>
                      {r.tiRemarks && <div style={{fontSize:11,color:"#dc2626",marginTop:2}}>{r.tiRemarks}</div>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  };

  if (viewingPm) return renderPointsmenDetail(viewingPm);

    const catMap = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
    const riskMap = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 className="sdom-page-title">Pointsman Management</h1>
            <p className="sdom-page-subtitle">Search, filter and manage operational pointsmen in your station limits.</p>
          </div>
          <button className="sdom-btn-primary" onClick={openPmAdd}>
            <Plus size={16} /> Add New Pointsman
          </button>
        </div>

        {/* Filters */}
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ minWidth: 200 }}>
            <label>Name / ID</label>
            <input 
              value={pmF.name} 
              onChange={e => setPmF(prev => ({ ...prev, name: e.target.value }))} 
              placeholder="Search..." 
            />
          </div>
          <div className="sdom-filter-field">
            <label>Category</label>
            <select value={pmF.cat} onChange={e => setPmF(prev => ({ ...prev, cat: e.target.value }))}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Risk Level</label>
            <select value={pmF.risk} onChange={e => setPmF(prev => ({ ...prev, risk: e.target.value }))}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>{filteredPm.length} pointsmen found</span>
          </div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Emp ID</th>
                  <th>Station</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Last Score</th>
                  <th>PME Status</th>
                  <th>REF Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPm.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No records found</td></tr>
                )}
                {filteredPm.map(s => {
                  const riskVal = riskLevel(s);
                  const catVal = getCat(s.lastScore);
                  return (
                    <tr key={s.id || s.hrmsId}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.hrmsId}</td>
                      <td>{s.station || smProfile.station}</td>
                      <td><span className={`sdom-badge ${catMap[catVal] || "sdom-badge-neutral"}`}>{catVal}</span></td>
                      <td><span className={`sdom-badge ${riskMap[riskVal] || "sdom-badge-neutral"}`}>{riskVal}</span></td>
                      <td style={{ fontWeight: 700 }}>{s.lastScore || s.score || "–"}</td>
                      <td>
                        <span className={`sdom-badge ${s.pmeStatus === "Fit" ? "sdom-badge-success" : s.pmeStatus === "Pending" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>
                          {s.pmeStatus || "Fit"}
                        </span>
                      </td>
                      <td>
                        <span className={`sdom-badge ${s.refStatus === "Cleared" ? "sdom-badge-success" : s.refStatus === "Pending" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>
                          {s.refStatus || "Cleared"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="sdom-btn-outline" style={{ padding: "5px 10px", fontSize: "0.8rem" }} onClick={() => setViewingPm(s)}>View</button>
                          <button className="sdom-icon-btn" title="Edit" onClick={() => openPmEdit(s)}><Edit size={15} color="#2563eb" /></button>
                          <button className="sdom-icon-btn" title="Shift" onClick={() => openPmShift(s)}><ArrowRightLeft size={15} color="#d97706" /></button>
                          <button className="sdom-icon-btn" title="Remove" onClick={() => removePm(s.hrmsId)}><Trash2 size={15} color="#dc2626" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      <CommonUserModal
        isOpen={!!pmModal}
        onClose={() => setPmModal(null)}
        mode={pmModal?.mode}
        userData={pmModal?.data}
        setUserData={(data) => setPmModal(p => ({ ...p, data }))}
        onSubmit={savePmModal}
        stations={stations}
      />
      </div>
    );
}
